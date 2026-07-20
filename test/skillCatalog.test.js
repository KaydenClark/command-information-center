import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildSkillCatalog, parseSkillCatalog } from "../server/skillCatalog.js";

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cic-skill-catalog-"));
}

function catalog(rows) {
  return `# Skills\n\n<!-- selected-skills:start -->\n| Skill | Definition | Rewrite lane | Availability |\n| --- | --- | --- | --- |\n${rows.join("\n")}\n<!-- selected-skills:end -->\n`;
}

function skill(name, description, body = "body") {
  return `---\nname: ${name}\ndescription: ${description}\n---\n${body}\n`;
}

function writeSkill(root, name, content) {
  fs.mkdirSync(path.join(root, name), { recursive: true });
  fs.writeFileSync(path.join(root, name, "SKILL.md"), content);
}

test("parses catalog order and deployed frontmatter into typed entries", () => {
  const parsed = parseSkillCatalog(catalog([
    "| `ask-workbench` | Routes a situation. | Core | Active |",
    "| `wayfinder` | Reduces fog. | Rewrite | Pending rewrite |"
  ]));
  assert.deepEqual(parsed.entries.map((entry) => entry.name), ["ask-workbench", "wayfinder"]);
  assert.equal(parsed.entries[1].availability, "Pending rewrite");
});

test("classifies in-sync, drifted, missing, deployed-only, and pending catalog entries", () => {
  const canonRoot = tempDir();
  const deployedRoot = tempDir();
  const catalogPath = path.join(canonRoot, "README.md");
  fs.writeFileSync(catalogPath, catalog([
    "| `ask-workbench` | Routes a situation. | Core | Active |",
    "| `grilling` | Interviews one question at a time. | Rewrite | Active |",
    "| `make-it-so` | Executes approved work. | Core | Active |",
    "| `wayfinder` | Reduces fog. | Rewrite | Pending rewrite |"
  ]));
  writeSkill(canonRoot, "ask-workbench", skill("ask-workbench", "Routes a situation.", "same"));
  writeSkill(deployedRoot, "ask-workbench", skill("ask-workbench", "Routes a situation.", "same"));
  writeSkill(canonRoot, "grilling", skill("grilling", "Interviews.", "canon"));
  writeSkill(deployedRoot, "grilling", skill("grilling", "Interviews.", "deployed"));
  writeSkill(canonRoot, "make-it-so", skill("make-it-so", "Executes."));
  writeSkill(canonRoot, "wayfinder", skill("wayfinder", "Reduces fog."));
  writeSkill(deployedRoot, "orphan", skill("orphan", "No catalog row."));

  const result = buildSkillCatalog({ catalogPath, deployedRoot, now: () => new Date("2026-07-20T12:00:00.000Z") });
  const entries = Object.fromEntries(result.entries.map((entry) => [entry.name, entry]));

  assert.equal(result.status, "ok");
  assert.equal(result.checkedAt, "2026-07-20T12:00:00.000Z");
  assert.equal(entries["ask-workbench"].drift, "in_sync");
  assert.equal(entries.grilling.drift, "drifted");
  assert.equal(entries["make-it-so"].drift, "missing");
  assert.equal(entries.wayfinder.drift, "not_applicable");
  assert.equal(entries.orphan.drift, "deployed_only");
  assert.deepEqual(result.entries.slice(0, 4).map((entry) => entry.name), ["ask-workbench", "grilling", "make-it-so", "wayfinder"]);
  assert.equal(entries["ask-workbench"].deployed.frontmatter.name, "ask-workbench");
  assert.equal(result.counts.deployedOnly, 1);
});

test("fails closed for missing, markerless, malformed, and unreadable sources", () => {
  const canonRoot = tempDir();
  const deployedRoot = tempDir();
  const missing = buildSkillCatalog({ catalogPath: path.join(canonRoot, "missing.md"), deployedRoot });
  assert.equal(missing.status, "unavailable");
  assert.deepEqual(missing.entries, []);

  const catalogPath = path.join(canonRoot, "README.md");
  fs.writeFileSync(catalogPath, "# no selected skills\n");
  assert.equal(buildSkillCatalog({ catalogPath, deployedRoot }).status, "unavailable");

  fs.writeFileSync(catalogPath, catalog(["| `broken` | only two |"]));
  assert.equal(buildSkillCatalog({ catalogPath, deployedRoot }).status, "unavailable");

  fs.writeFileSync(catalogPath, catalog(["| `ask-workbench` | Routes. | Core | Active |"]));
  writeSkill(canonRoot, "ask-workbench", skill("ask-workbench", "Routes."));
  fs.mkdirSync(path.join(deployedRoot, "ask-workbench"), { recursive: true });
  const malformed = buildSkillCatalog({ catalogPath, deployedRoot });
  assert.equal(malformed.status, "degraded");
  assert.equal(malformed.entries[0].drift, "unknown");
  assert.match(malformed.detail, /unavailable|malformed/i);
});

test("fails closed when canonical or deployed-only skill frontmatter is malformed", () => {
  const canonRoot = tempDir();
  const deployedRoot = tempDir();
  const catalogPath = path.join(canonRoot, "README.md");
  fs.writeFileSync(catalogPath, catalog(["| `ask-workbench` | Routes. | Core | Active |"]));
  fs.mkdirSync(path.join(canonRoot, "ask-workbench"), { recursive: true });
  fs.writeFileSync(path.join(canonRoot, "ask-workbench", "SKILL.md"), "no frontmatter");
  writeSkill(deployedRoot, "ask-workbench", skill("ask-workbench", "Routes."));
  fs.mkdirSync(path.join(deployedRoot, "orphan"), { recursive: true });
  fs.writeFileSync(path.join(deployedRoot, "orphan", "SKILL.md"), "no frontmatter");

  const result = buildSkillCatalog({ catalogPath, deployedRoot });
  const entries = Object.fromEntries(result.entries.map((entry) => [entry.name, entry]));
  assert.equal(result.status, "degraded");
  assert.equal(entries["ask-workbench"].drift, "unknown");
  assert.equal(entries.orphan.drift, "unknown");
});

test("does not call a malformed canonical skill missing from deployment", () => {
  const canonRoot = tempDir();
  const deployedRoot = tempDir();
  const catalogPath = path.join(canonRoot, "README.md");
  fs.writeFileSync(catalogPath, catalog(["| `ask-workbench` | Routes. | Core | Active |"]));
  fs.mkdirSync(path.join(canonRoot, "ask-workbench"), { recursive: true });
  fs.writeFileSync(path.join(canonRoot, "ask-workbench", "SKILL.md"), "no frontmatter");

  const result = buildSkillCatalog({ catalogPath, deployedRoot });
  assert.equal(result.status, "degraded");
  assert.equal(result.entries[0].drift, "unknown");
});

test("does not mutate skill sources or export a write operation", async () => {
  const canonRoot = tempDir();
  const deployedRoot = tempDir();
  const catalogPath = path.join(canonRoot, "README.md");
  fs.writeFileSync(catalogPath, catalog(["| `ask-workbench` | Routes. | Core | Active |"]));
  writeSkill(canonRoot, "ask-workbench", skill("ask-workbench", "Routes."));
  writeSkill(deployedRoot, "ask-workbench", skill("ask-workbench", "Routes."));
  const canonPath = path.join(canonRoot, "ask-workbench", "SKILL.md");
  const before = [fs.statSync(catalogPath).mtimeMs, fs.statSync(canonPath).mtimeMs, fs.readdirSync(deployedRoot).sort()];

  const result = buildSkillCatalog({ catalogPath, deployedRoot });
  assert.ok(new Date(result.catalog.reflectedAt).getTime() <= new Date(result.checkedAt).getTime());
  assert.deepEqual([fs.statSync(catalogPath).mtimeMs, fs.statSync(canonPath).mtimeMs, fs.readdirSync(deployedRoot).sort()], before);
  assert.equal(Object.hasOwn(await import("../server/skillCatalog.js"), "writeSkillCatalog"), false);
  const source = fs.readFileSync(new URL("../server/skillCatalog.js", import.meta.url), "utf8");
  assert.equal(/fs\.(write|append|mkdir|rm|unlink|rename|copy|truncate|chmod|chown|createWriteStream)/.test(source), false);
});
