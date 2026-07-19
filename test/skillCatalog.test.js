import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildSkillCatalog, parseSkillCatalog } from "../server/skillCatalog.js";

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cic-skill-catalog-"));
}

function writeSkill(root, name, body) {
  fs.mkdirSync(path.join(root, name), { recursive: true });
  fs.writeFileSync(path.join(root, name, "SKILL.md"), body);
}

function catalogReadme(rows) {
  return `# Workbench Agent Skills

## Selected Skill Catalog

<!-- selected-skills:start -->
| Skill | Definition | Rewrite lane | Availability |
|---|---|---|---|
${rows.join("\n")}
<!-- selected-skills:end -->

## Truth Routing
`;
}

function frontmatter(name, description, extra = "body\n") {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n${extra}`;
}

test("parseSkillCatalog reads catalog-ordered entries and skips malformed rows", () => {
  const source = catalogReadme([
    "| `ask-workbench` | Route a situation to the smallest skill. | Native | Active |",
    "| `grilling` | Question-at-a-time interview primitive. | Core rewrite | Active |",
    "| `wayfinder` | Reduce fog in large work. | Supporting rewrite | Pending rewrite |",
    "| `broken-row` | missing columns |",
    "| `grilling` | duplicate name | Native | Active |"
  ]);
  const parsed = parseSkillCatalog(source);
  assert.notEqual(parsed, null);
  assert.deepEqual(parsed.entries.map((entry) => entry.name), ["ask-workbench", "grilling", "wayfinder"]);
  assert.equal(parsed.entries[0].lane, "Native");
  assert.equal(parsed.entries[2].availability, "Pending rewrite");
  assert.equal(parsed.skippedRows, 2); // malformed columns + duplicate name
});

test("parseSkillCatalog fails closed when the selected-skill markers are missing", () => {
  assert.equal(parseSkillCatalog("# No markers here\n| a | b | c | d |\n"), null);
  assert.equal(parseSkillCatalog("<!-- selected-skills:start -->\n| a | b | c | d |\n"), null);
});

test("buildSkillCatalog classifies in-sync, drifted, missing, pending, and deployed-only entries", () => {
  const canonRoot = tmpdir();
  const deployedRoot = tmpdir();

  fs.writeFileSync(path.join(canonRoot, "README.md"), catalogReadme([
    "| `ask-workbench` | Route a situation. | Native | Active |",
    "| `grilling` | Interview primitive. | Core rewrite | Active |",
    "| `make-it-so` | Approved, build it. | Native | Active |",
    "| `wayfinder` | Reduce fog. | Supporting rewrite | Pending rewrite |"
  ]));
  const catalogPath = path.join(canonRoot, "README.md");

  // in_sync: identical canon + deployed bodies
  writeSkill(canonRoot, "ask-workbench", frontmatter("ask-workbench", "route", "shared body\n"));
  writeSkill(deployedRoot, "ask-workbench", frontmatter("ask-workbench", "route", "shared body\n"));
  // drifted: bodies differ
  writeSkill(canonRoot, "grilling", frontmatter("grilling", "interview", "canon body\n"));
  writeSkill(deployedRoot, "grilling", frontmatter("grilling", "interview", "DEPLOYED body\n"));
  // missing: canon present, no deployed folder
  writeSkill(canonRoot, "make-it-so", frontmatter("make-it-so", "build", "canon only\n"));
  // pending: not deployed, drift not applicable
  writeSkill(canonRoot, "wayfinder", frontmatter("wayfinder", "fog", "pending body\n"));
  // deployed-only: deployed folder with no catalog entry
  writeSkill(deployedRoot, "orphan-skill", frontmatter("orphan-skill", "orphan", "orphan body\n"));

  const result = buildSkillCatalog({
    catalogPath,
    deployedRoot,
    now: () => new Date("2026-07-19T12:00:00.000Z")
  });

  assert.equal(result.status, "ok");
  assert.equal(result.checkedAt, "2026-07-19T12:00:00.000Z");
  assert.equal(result.catalog.status, "ok");
  assert.equal(result.deployed.status, "ok");

  const byName = Object.fromEntries(result.entries.map((entry) => [entry.name, entry]));
  assert.equal(byName["ask-workbench"].drift, "in_sync");
  assert.equal(byName["grilling"].drift, "drifted");
  assert.equal(byName["make-it-so"].drift, "missing");
  assert.equal(byName["make-it-so"].deployed.present, false);
  assert.equal(byName["wayfinder"].drift, "not_applicable");
  assert.equal(byName["wayfinder"].expectedDeployed, false);
  assert.equal(byName["wayfinder"].deployed, null);
  assert.equal(byName["orphan-skill"].drift, "deployed_only");
  assert.equal(byName["orphan-skill"].availability, null);

  // Catalog order is preserved for catalog entries; deployed-only appended.
  assert.deepEqual(
    result.entries.slice(0, 4).map((entry) => entry.name),
    ["ask-workbench", "grilling", "make-it-so", "wayfinder"]
  );

  assert.equal(result.counts.inSync, 1);
  assert.equal(result.counts.drifted, 1);
  assert.equal(result.counts.missing, 1);
  assert.equal(result.counts.deployedOnly, 1);
  assert.equal(result.counts.pending, 1);
  assert.equal(result.counts.active, 3);
});

test("buildSkillCatalog exposes provenance and never renders fresher than its source", () => {
  const canonRoot = tmpdir();
  const deployedRoot = tmpdir();
  const catalogPath = path.join(canonRoot, "README.md");
  fs.writeFileSync(catalogPath, catalogReadme([
    "| `ask-workbench` | Route a situation. | Native | Active |"
  ]));
  writeSkill(canonRoot, "ask-workbench", frontmatter("ask-workbench", "route"));
  writeSkill(deployedRoot, "ask-workbench", frontmatter("ask-workbench", "route"));

  // Use a real clock so the fixture mtimes (written just now) can be compared
  // against the read time; the invariant is that no source is reported fresher
  // than when CIC read it.
  const result = buildSkillCatalog({ catalogPath, deployedRoot });

  assert.ok(result.catalog.reflectedAt);
  const entry = result.entries[0];
  assert.equal(entry.source, "skills/README.md");
  assert.ok(entry.canon.reflectedAt);
  assert.ok(entry.deployed.reflectedAt);
  // reflectedAt reflects the real file mtime and is never newer than checkedAt.
  const readTime = new Date(result.checkedAt).getTime();
  const canonMtime = fs.statSync(path.join(canonRoot, "ask-workbench", "SKILL.md")).mtimeMs;
  assert.equal(entry.canon.reflectedAt, new Date(canonMtime).toISOString());
  assert.ok(new Date(result.catalog.reflectedAt).getTime() <= readTime);
  assert.ok(new Date(entry.canon.reflectedAt).getTime() <= readTime);
});

test("buildSkillCatalog fails closed when the catalog source is missing", () => {
  const result = buildSkillCatalog({
    catalogPath: path.join(tmpdir(), "does-not-exist.md"),
    deployedRoot: tmpdir(),
    now: () => new Date("2026-07-19T12:00:00.000Z")
  });
  assert.equal(result.status, "unavailable");
  assert.equal(result.catalog.status, "unavailable");
  assert.deepEqual(result.entries, []);
  assert.match(result.detail, /unavailable/i);
});

test("buildSkillCatalog fails closed when the catalog markers are absent", () => {
  const canonRoot = tmpdir();
  const catalogPath = path.join(canonRoot, "README.md");
  fs.writeFileSync(catalogPath, "# Skills\n\nNo markers, no table.\n");
  const result = buildSkillCatalog({ catalogPath, deployedRoot: tmpdir(), now: () => new Date() });
  assert.equal(result.status, "unavailable");
  assert.match(result.detail, /marker/i);
  assert.deepEqual(result.entries, []);
});

test("buildSkillCatalog degrades to unknown drift when the deployed tree is unreadable", () => {
  const canonRoot = tmpdir();
  const catalogPath = path.join(canonRoot, "README.md");
  fs.writeFileSync(catalogPath, catalogReadme([
    "| `ask-workbench` | Route a situation. | Native | Active |",
    "| `wayfinder` | Reduce fog. | Supporting rewrite | Pending rewrite |"
  ]));
  writeSkill(canonRoot, "ask-workbench", frontmatter("ask-workbench", "route"));

  const result = buildSkillCatalog({
    catalogPath,
    deployedRoot: path.join(canonRoot, "no-such-deployed-dir"),
    now: () => new Date("2026-07-19T12:00:00.000Z")
  });

  assert.equal(result.status, "degraded");
  assert.equal(result.deployed.status, "unavailable");
  const byName = Object.fromEntries(result.entries.map((entry) => [entry.name, entry]));
  assert.equal(byName["ask-workbench"].drift, "unknown"); // fail closed, not "missing"
  assert.equal(byName["wayfinder"].drift, "not_applicable");
  assert.equal(result.counts.unknown, 1);
});

test("buildSkillCatalog reports unknown when a deployed folder has an unreadable body", () => {
  const canonRoot = tmpdir();
  const deployedRoot = tmpdir();
  const catalogPath = path.join(canonRoot, "README.md");
  fs.writeFileSync(catalogPath, catalogReadme([
    "| `ask-workbench` | Route a situation. | Native | Active |"
  ]));
  writeSkill(canonRoot, "ask-workbench", frontmatter("ask-workbench", "route"));
  // Deployed folder exists but has no SKILL.md body.
  fs.mkdirSync(path.join(deployedRoot, "ask-workbench"), { recursive: true });

  const result = buildSkillCatalog({ catalogPath, deployedRoot, now: () => new Date() });
  const entry = result.entries.find((item) => item.name === "ask-workbench");
  assert.equal(entry.drift, "unknown");
  assert.equal(entry.deployed.present, false);
});

test("skill catalog module exposes no write path and does not mutate its sources", () => {
  const mod = buildSkillCatalog;
  assert.equal(typeof mod, "function");

  const canonRoot = tmpdir();
  const deployedRoot = tmpdir();
  const catalogPath = path.join(canonRoot, "README.md");
  fs.writeFileSync(catalogPath, catalogReadme([
    "| `ask-workbench` | Route a situation. | Native | Active |"
  ]));
  writeSkill(canonRoot, "ask-workbench", frontmatter("ask-workbench", "route"));
  writeSkill(deployedRoot, "ask-workbench", frontmatter("ask-workbench", "route"));

  const beforeCanon = fs.statSync(path.join(canonRoot, "ask-workbench", "SKILL.md")).mtimeMs;
  const beforeReadme = fs.statSync(catalogPath).mtimeMs;
  const beforeDeployedEntries = fs.readdirSync(deployedRoot).sort();

  buildSkillCatalog({ catalogPath, deployedRoot, now: () => new Date() });

  assert.equal(fs.statSync(path.join(canonRoot, "ask-workbench", "SKILL.md")).mtimeMs, beforeCanon);
  assert.equal(fs.statSync(catalogPath).mtimeMs, beforeReadme);
  assert.deepEqual(fs.readdirSync(deployedRoot).sort(), beforeDeployedEntries);

  // The module source itself contains no filesystem write calls.
  const moduleSource = fs.readFileSync(new URL("../server/skillCatalog.js", import.meta.url), "utf8");
  assert.equal(/fs\.(write|append|mkdir|rm|unlink|rename|copy|truncate|chmod|chown|createWriteStream)/.test(moduleSource), false);
});
