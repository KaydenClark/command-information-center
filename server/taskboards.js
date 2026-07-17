import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const GROUPS = new Map([
  ["ready", "ready"],
  ["in progress", "inProgress"],
  ["in-progress", "inProgress"],
  ["blocked", "blocked"],
  ["deferred", "deferred"],
  ["backlog", "deferred"],
  ["done", "done"]
]);
const PRIORITIES = new Set(["P1", "P2", "P3"]);

function httpError(message, status) {
  return Object.assign(new Error(message), { status });
}

function cleanMarkdown(value = "") {
  return String(value)
    .replace(/<!--.*?-->/g, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*`~]/g, "")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/\\\|/g, "|")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "project";
}

function splitMarkdownRow(line) {
  const source = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells = [];
  let cell = "";
  let escaped = false;
  for (const character of source) {
    if (escaped) {
      cell += character === "|" ? "\\|" : `\\${character}`;
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === "|") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }
  if (escaped) cell += "\\";
  cells.push(cell.trim());
  return cells;
}

function isDivider(line = "") {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function sectionsFrom(source) {
  const sections = [];
  let current = null;
  for (const line of source.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = { title: cleanMarkdown(heading[1]), lines: [] };
      sections.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }
  return sections;
}

function tablesFrom(lines) {
  const tables = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!lines[index].trim().startsWith("|") || !isDivider(lines[index + 1])) continue;
    const headers = splitMarkdownRow(lines[index]).map(cleanMarkdown);
    const rows = [];
    index += 2;
    while (index < lines.length && lines[index].trim().startsWith("|")) {
      if (!isDivider(lines[index])) {
        const cells = splitMarkdownRow(lines[index]);
        rows.push(Object.fromEntries(headers.map((header, cellIndex) => [header, cleanMarkdown(cells[cellIndex] || "")])));
      }
      index += 1;
    }
    index -= 1;
    tables.push({ headers, rows });
  }
  return tables;
}

function field(row, ...names) {
  const found = Object.entries(row).find(([key]) => names.some((name) => key.toLowerCase() === name));
  return found?.[1] || "";
}

function normalizePriority(value) {
  const match = cleanMarkdown(value).toUpperCase().match(/^P?([123])$/);
  return match ? `P${match[1]}` : null;
}

function isOpenDecision(row) {
  const status = field(row, "status").toLowerCase();
  return status && !/(decided|resolved|closed|done|complete|accepted)/.test(status);
}

function parseBoard(source, metadata) {
  const sections = sectionsFrom(source);
  const groups = { ready: [], inProgress: [], blocked: [], deferred: [], done: [] };
  const decisions = [];
  const briefSection = sections.find((section) => section.title.toLowerCase() === "executive brief");
  const brief = (briefSection?.lines || [])
    .filter((line) => /^\s*[-*]\s+/.test(line))
    .map((line) => cleanMarkdown(line.replace(/^\s*[-*]\s+/, "")))
    .filter(Boolean);

  for (const section of sections) {
    const normalizedTitle = section.title.toLowerCase();
    if (normalizedTitle === "pending decisions") {
      for (const table of tablesFrom(section.lines)) {
        for (const row of table.rows) {
          const id = field(row, "id");
          const decision = field(row, "decision");
          if (!id || id.toLowerCase() === "none" || !decision || !isOpenDecision(row)) continue;
          decisions.push({
            id,
            decision,
            options: field(row, "options"),
            recommendation: field(row, "recommendation", "resolution"),
            impact: field(row, "cost / impact", "impact"),
            owner: field(row, "owner"),
            status: field(row, "status")
          });
        }
      }
      continue;
    }

    const groupName = GROUPS.get(normalizedTitle);
    if (!groupName) continue;
    for (const table of tablesFrom(section.lines)) {
      for (const row of table.rows) {
        const id = field(row, "id");
        const title = field(row, "task", "task / area", "title");
        if (!id || id.toLowerCase() === "none" || !title) continue;
        groups[groupName].push({
          id,
          title,
          priority: normalizePriority(field(row, "priority")),
          status: field(row, "status") || section.title,
          owner: field(row, "owner"),
          lastUpdated: field(row, "last update", "completed", "started"),
          detail: field(
            row,
            "current note",
            "blocked on",
            "source / why now",
            "result",
            "deferred until",
            "why it matters",
            "proof required"
          ),
          section: section.title
        });
      }
    }
  }

  const counts = Object.fromEntries(Object.entries(groups).map(([key, tasks]) => [key, tasks.length]));
  return { ...metadata, brief, decisions, groups, counts, taskCount: Object.values(counts).reduce((sum, count) => sum + count, 0) };
}

const SPEC_FILE_MAX_BYTES = 512 * 1024;
const PROJECT_INDEX_MAX_BYTES = 512 * 1024;

function specField(source, name) {
  const pattern = new RegExp(`^\\*\\*${name}:\\*\\*\\s*(.+)$`, "im");
  const match = source.match(pattern);
  return match ? cleanMarkdown(match[1]) : "";
}

function parseSpec(source, directoryName) {
  const idFromDirectory = directoryName.match(/^(S-\d+)/i)?.[1]?.toUpperCase() || "";
  const heading = source.match(/^#\s+(.+?)\s*$/m)?.[1] || "";
  const cleanedHeading = cleanMarkdown(heading);
  const headingMatch = cleanedHeading.match(/^(S-\d+)\s*[-–—:]\s*(.+)$/i);
  const id = specField(source, "Spec ID") || headingMatch?.[1]?.toUpperCase() || idFromDirectory || directoryName;
  const fallbackTitle = directoryName
    .replace(/^S-\d+-?/i, "")
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
  const title = headingMatch?.[2] || cleanedHeading || fallbackTitle || directoryName;

  const tickets = [];
  const slicesSection = sectionsFrom(source).find((section) => section.title.toLowerCase() === "vertical implementation slices");
  for (const table of tablesFrom(slicesSection?.lines || [])) {
    for (const row of table.rows) {
      const ticketId = field(row, "ticket", "id");
      const ticketTitle = field(row, "slice", "task", "title");
      if (!ticketId || ticketId.toLowerCase() === "none" || !ticketTitle) continue;
      tickets.push({
        id: ticketId,
        title: ticketTitle,
        status: field(row, "status") || "unknown",
        blockers: field(row, "blockers", "blocked on"),
        proof: field(row, "proof", "proof required")
      });
    }
  }

  return {
    id,
    title,
    status: specField(source, "Status") || "unknown",
    priority: specField(source, "Priority"),
    owner: specField(source, "Owner"),
    updated: specField(source, "Updated"),
    description: specField(source, "Catalog description"),
    blockers: specField(source, "Blockers"),
    latestEvent: specField(source, "Latest event"),
    nextGate: specField(source, "Next gate"),
    tickets
  };
}

function readProjectSpecs(projectDir) {
  const specsRoot = path.join(projectDir, "specs");
  if (!fs.existsSync(specsRoot) || !fs.statSync(specsRoot).isDirectory()) return [];
  const specs = [];
  for (const entry of fs.readdirSync(specsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    const filePath = path.join(specsRoot, entry.name, "SPEC.md");
    try {
      const stats = fs.statSync(filePath);
      if (!stats.isFile() || stats.size > SPEC_FILE_MAX_BYTES) continue;
      specs.push(parseSpec(fs.readFileSync(filePath, "utf8"), entry.name));
    } catch (error) {
      if (error?.code !== "ENOENT") {
        specs.push({ ...parseSpec("", entry.name), status: "unreadable" });
      }
    }
  }
  return specs.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

function countsFromSpecs(specs) {
  const counts = { ready: 0, inProgress: 0, blocked: 0, deferred: 0, done: 0 };
  for (const spec of specs) {
    for (const ticket of spec.tickets) {
      const group = GROUPS.get(String(ticket.status || "").toLowerCase());
      if (group) counts[group] += 1;
    }
  }
  return counts;
}

function canonicalPath(candidate) {
  const resolved = path.resolve(candidate);
  try {
    return fs.realpathSync(resolved);
  } catch {
    try {
      return path.join(fs.realpathSync(path.dirname(resolved)), path.basename(resolved));
    } catch {
      return resolved;
    }
  }
}

function readProjectIdentities(projectsRoot) {
  const identities = new Map();
  const indexPath = path.join(projectsRoot, "INDEX.md");
  try {
    const stats = fs.statSync(indexPath);
    if (!stats.isFile() || stats.size > PROJECT_INDEX_MAX_BYTES) return identities;
    const source = fs.readFileSync(indexPath, "utf8");
    const canonicalSection = sectionsFrom(source)
      .find((section) => section.title.toLowerCase() === "canonical project repositories");
    const table = tablesFrom(canonicalSection?.lines || [])
      .find((candidate) => candidate.headers.some((header) => header.toLowerCase() === "project id"));
    if (!table) return identities;

    const root = fs.realpathSync(projectsRoot);
    const candidates = table.rows.map((row) => ({
      projectId: field(row, "project id"),
      sourcePath: canonicalPath(field(row, "canonical source"))
    })).filter(({ projectId, sourcePath }) =>
      /^P-\d{3}$/.test(projectId) && path.dirname(sourcePath) === root
    );
    const idCounts = new Map();
    const pathCounts = new Map();
    for (const candidate of candidates) {
      idCounts.set(candidate.projectId, (idCounts.get(candidate.projectId) || 0) + 1);
      pathCounts.set(candidate.sourcePath, (pathCounts.get(candidate.sourcePath) || 0) + 1);
    }
    for (const candidate of candidates) {
      if (idCounts.get(candidate.projectId) === 1 && pathCounts.get(candidate.sourcePath) === 1) {
        identities.set(candidate.sourcePath, candidate.projectId);
      }
    }
  } catch {
    return identities;
  }
  return identities;
}

function discoverProjects(projectsRoot) {
  if (!fs.existsSync(projectsRoot)) return [];
  const root = fs.realpathSync(projectsRoot);
  const identities = readProjectIdentities(root);
  const projects = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    .map((entry) => {
      const filePath = path.join(root, entry.name, "TASKBOARD.md");
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
      return {
        name: entry.name,
        slug: slugify(entry.name),
        projectId: identities.get(path.dirname(filePath)) || null,
        filePath
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  const seen = new Map();
  for (const project of projects) {
    const count = seen.get(project.slug) || 0;
    seen.set(project.slug, count + 1);
    if (count) project.slug = `${project.slug}-${crypto.createHash("sha1").update(project.name).digest("hex").slice(0, 6)}`;
  }
  return projects;
}

function resolveProject(projectsRoot, slug) {
  const project = discoverProjects(projectsRoot).find((candidate) => candidate.slug === slug);
  if (!project) throw httpError("Project taskboard not found.", 404);
  return project;
}

export function readProjectTaskboard(projectsRoot, slug) {
  const project = resolveProject(projectsRoot, slug);
  const stats = fs.statSync(project.filePath);
  const board = parseBoard(fs.readFileSync(project.filePath, "utf8"), {
    name: project.name,
    slug: project.slug,
    projectId: project.projectId,
    updatedAt: stats.mtime.toISOString()
  });
  board.specs = readProjectSpecs(path.dirname(project.filePath));
  board.legacyTaskCount = board.taskCount;
  if (board.specs.length) {
    board.counts = countsFromSpecs(board.specs);
    board.taskCount = Object.values(board.counts).reduce((sum, count) => sum + count, 0);
  }
  return board;
}

export function listProjectTaskboards(projectsRoot) {
  return discoverProjects(projectsRoot).map((project) => {
    const board = readProjectTaskboard(projectsRoot, project.slug);
    return {
      name: board.name,
      slug: board.slug,
      projectId: board.projectId,
      updatedAt: board.updatedAt,
      brief: board.brief,
      counts: board.counts,
      decisionCount: board.decisions.length,
      taskCount: board.taskCount,
      specCount: board.specs.length
    };
  });
}

export function updateProjectTaskPriority(projectsRoot, slug, taskId, priority) {
  const normalizedPriority = String(priority || "").toUpperCase();
  if (!PRIORITIES.has(normalizedPriority)) throw httpError("Priority must be P1, P2, or P3.", 400);
  const project = resolveProject(projectsRoot, slug);
  const specs = readProjectSpecs(path.dirname(project.filePath));
  if (specs.length) {
    throw httpError("Generated Taskboards are read-only; change priority through the owning stable spec.", 409);
  }
  throw httpError("Legacy Taskboards are read-only; no safe direct priority action is available.", 409);
}
