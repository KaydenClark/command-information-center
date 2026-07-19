import fs from "node:fs";
import path from "node:path";

// Read-only skill-catalog data source. Parses the canonical Workbench Factory
// `skills/README.md` selected-skill table plus the deployed `.claude/skills/`
// runtime copies into one typed payload with per-entry provenance, freshness,
// and canon-versus-deployed drift. This module never writes to any skill file.

const CATALOG_MAX_BYTES = 512 * 1024;
const SKILL_MAX_BYTES = 256 * 1024;
const START_MARKER = "<!-- selected-skills:start -->";
const END_MARKER = "<!-- selected-skills:end -->";

function cleanCell(value = "") {
  return String(value)
    .trim()
    .replace(/^`(.*)`$/, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\\\|/g, "|")
    .trim();
}

function splitRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map(cleanCell);
}

function isActive(availability) {
  return /^active$/i.test(String(availability || "").trim());
}

// Parse the selected-skill catalog table. Returns null when the required
// markers are missing so the caller can fail closed rather than fabricate an
// empty catalog. Otherwise returns catalog-ordered entries and a malformed-row
// count. Individual malformed rows are skipped, never invented.
export function parseSkillCatalog(source) {
  const text = String(source || "");
  const startIndex = text.indexOf(START_MARKER);
  if (startIndex < 0) return null;
  const endIndex = text.indexOf(END_MARKER, startIndex + START_MARKER.length);
  if (endIndex < 0) return null;

  const block = text.slice(startIndex + START_MARKER.length, endIndex);
  const entries = [];
  const seen = new Set();
  let headerSeen = false;
  let skippedRows = 0;

  for (const line of block.split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) continue;
    if (/^\s*\|?\s*:?-{3,}/.test(line)) continue; // column separator
    if (!headerSeen) {
      headerSeen = true; // first table row is the header
      continue;
    }
    const cells = splitRow(line);
    if (cells.length !== 4 || !cells[0] || !cells[1]) {
      skippedRows += 1;
      continue;
    }
    if (seen.has(cells[0])) {
      skippedRows += 1; // duplicate skill name is malformed catalog input
      continue;
    }
    seen.add(cells[0]);
    entries.push({ name: cells[0], definition: cells[1], lane: cells[2], availability: cells[3] });
  }

  return { entries, skippedRows };
}

function readTextFile(filePath, maxBytes) {
  const stats = fs.statSync(filePath);
  if (!stats.isFile()) throw new Error("not a regular file");
  if (stats.size > maxBytes) throw new Error("source exceeds size bound");
  return { content: fs.readFileSync(filePath, "utf8"), mtime: new Date(stats.mtimeMs).toISOString() };
}

// Deployed skill folders are direct children of the deployed root that contain
// a SKILL.md. Returns a name -> body map, or null when the root is unreadable
// so the caller can fail closed on drift.
function readDeployedSkills(deployedRoot) {
  let dirents;
  try {
    dirents = fs.readdirSync(deployedRoot, { withFileTypes: true });
  } catch {
    return null;
  }
  const deployed = new Map();
  for (const dirent of dirents) {
    if (!dirent.isDirectory()) continue;
    const skillPath = path.join(deployedRoot, dirent.name, "SKILL.md");
    let body = null;
    try {
      body = readTextFile(skillPath, SKILL_MAX_BYTES);
    } catch {
      body = null; // folder present but SKILL.md missing/unreadable/oversized
    }
    deployed.set(dirent.name, { path: skillPath, body });
  }
  return deployed;
}

function classifyDrift(entry, canonRoot, deployedMap) {
  const expectedDeployed = isActive(entry.availability);
  const canonPath = path.join(canonRoot, entry.name, "SKILL.md");
  let canon = null;
  try {
    canon = readTextFile(canonPath, SKILL_MAX_BYTES);
  } catch {
    canon = null;
  }
  const canonProvenance = canon ? { path: canonPath, reflectedAt: canon.mtime } : { path: canonPath, reflectedAt: null };

  // Pending (non-Active) entries are preserved in `skills-pending/` and are not
  // expected in the deployed runtime; drift does not apply to them.
  if (!expectedDeployed) {
    return { expectedDeployed, drift: "not_applicable", canon: canonProvenance, deployed: null };
  }

  // Deployed source could not be read: fail closed rather than assert "missing".
  if (deployedMap === null) {
    return { expectedDeployed, drift: "unknown", canon: canonProvenance, deployed: null };
  }

  const deployedEntry = deployedMap.get(entry.name);
  if (!deployedEntry) {
    return {
      expectedDeployed,
      drift: "missing",
      canon: canonProvenance,
      deployed: { path: path.join(deployedMap.rootPath, entry.name, "SKILL.md"), present: false, reflectedAt: null }
    };
  }

  const deployedProvenance = {
    path: deployedEntry.path,
    present: Boolean(deployedEntry.body),
    reflectedAt: deployedEntry.body ? deployedEntry.body.mtime : null
  };

  if (!deployedEntry.body || !canon) {
    // Folder is deployed but a body is unreadable on one side: cannot compare.
    return { expectedDeployed, drift: "unknown", canon: canonProvenance, deployed: deployedProvenance };
  }

  const drift = deployedEntry.body.content === canon.content ? "in_sync" : "drifted";
  return { expectedDeployed, drift, canon: canonProvenance, deployed: deployedProvenance };
}

function statReflectedAt(target) {
  try {
    return new Date(fs.statSync(target).mtimeMs).toISOString();
  } catch {
    return null;
  }
}

// Build the read-only skill-catalog payload. `catalogPath` is the canonical
// `skills/README.md`; canonical skill bodies live in sibling `<name>/SKILL.md`
// folders under its directory. `deployedRoot` is the deployed `.claude/skills/`
// runtime tree. All sources fail closed with a visible status; nothing is ever
// rendered as fresher than its source and no write path exists.
export function buildSkillCatalog({ catalogPath, deployedRoot, now = () => new Date() }) {
  const checkedAt = now().toISOString();
  const emptyResult = (detail) => ({
    source: "skills/README.md",
    checkedAt,
    status: "unavailable",
    detail,
    catalog: { path: catalogPath, status: "unavailable", detail, reflectedAt: null },
    deployed: { root: deployedRoot, status: "unknown", detail: "Catalog unavailable; deployment not evaluated.", reflectedAt: null },
    entries: [],
    counts: { total: 0, active: 0, pending: 0, inSync: 0, drifted: 0, missing: 0, deployedOnly: 0, unknown: 0, skippedRows: 0 }
  });

  let catalogFile;
  try {
    catalogFile = readTextFile(catalogPath, CATALOG_MAX_BYTES);
  } catch {
    return emptyResult("Canonical skill catalog is unavailable.");
  }

  const parsed = parseSkillCatalog(catalogFile.content);
  if (parsed === null) {
    return emptyResult("Canonical skill catalog is missing its selected-skill markers.");
  }

  const canonRoot = path.dirname(catalogPath);
  const deployedMap = readDeployedSkills(deployedRoot);
  if (deployedMap) deployedMap.rootPath = deployedRoot;
  const deployedReflectedAt = statReflectedAt(deployedRoot);

  const catalogNames = new Set(parsed.entries.map((entry) => entry.name));
  const entries = parsed.entries.map((entry) => {
    const classification = classifyDrift(entry, canonRoot, deployedMap);
    return {
      name: entry.name,
      definition: entry.definition,
      lane: entry.lane,
      availability: entry.availability,
      expectedDeployed: classification.expectedDeployed,
      drift: classification.drift,
      source: "skills/README.md",
      canon: classification.canon,
      deployed: classification.deployed
    };
  });

  // Deployed-only: folders present in the deployment with no catalog entry.
  if (deployedMap) {
    for (const [name, deployedEntry] of deployedMap) {
      if (name === "rootPath" || catalogNames.has(name)) continue;
      entries.push({
        name,
        definition: null,
        lane: null,
        availability: null,
        expectedDeployed: false,
        drift: "deployed_only",
        source: ".claude/skills/",
        canon: null,
        deployed: {
          path: deployedEntry.path,
          present: Boolean(deployedEntry.body),
          reflectedAt: deployedEntry.body ? deployedEntry.body.mtime : null
        }
      });
    }
  }

  const counts = {
    total: entries.length,
    active: entries.filter((entry) => entry.expectedDeployed).length,
    pending: entries.filter((entry) => entry.drift === "not_applicable").length,
    inSync: entries.filter((entry) => entry.drift === "in_sync").length,
    drifted: entries.filter((entry) => entry.drift === "drifted").length,
    missing: entries.filter((entry) => entry.drift === "missing").length,
    deployedOnly: entries.filter((entry) => entry.drift === "deployed_only").length,
    unknown: entries.filter((entry) => entry.drift === "unknown").length,
    skippedRows: parsed.skippedRows
  };

  const deployedStatus = deployedMap ? "ok" : "unavailable";
  const deployedDetail = deployedMap
    ? "Read-only comparison of deployed SKILL.md bodies against canon."
    : "Deployed skill tree is unreadable; canon-versus-deployed drift is unknown.";

  const status = deployedMap ? "ok" : "degraded";
  const detail = deployedMap
    ? "Read-only skill catalog with per-entry provenance and canon-versus-deployed drift."
    : "Skill catalog read; deployed runtime tree unavailable so drift is reported as unknown.";

  return {
    source: "skills/README.md",
    checkedAt,
    status,
    detail,
    catalog: {
      path: catalogPath,
      status: "ok",
      detail: parsed.skippedRows
        ? `Parsed ${parsed.entries.length} entries; skipped ${parsed.skippedRows} malformed row(s).`
        : `Parsed ${parsed.entries.length} catalog entries.`,
      reflectedAt: catalogFile.mtime
    },
    deployed: {
      root: deployedRoot,
      status: deployedStatus,
      detail: deployedDetail,
      reflectedAt: deployedReflectedAt
    },
    entries,
    counts
  };
}
