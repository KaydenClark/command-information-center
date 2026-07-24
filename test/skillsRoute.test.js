import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "../server/app.js";

// S-022 TK-001: route-level proof that GET /api/skills serves the read-only
// skill-catalog payload from configured paths, fails closed when the source
// is unreadable, and exposes no write path.

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cic-skills-route-"));
}

function writeSkill(root, name, body) {
  fs.mkdirSync(path.join(root, name), { recursive: true });
  fs.writeFileSync(path.join(root, name, "SKILL.md"), body);
}

function frontmatter(name, description, extra = "body\n") {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n${extra}`;
}

function catalogReadme(rows) {
  return `# Workbench Agent Skills

## Selected Skill Catalog

<!-- selected-skills:start -->
| Skill | Definition | Rewrite lane | Availability |
|---|---|---|---|
${rows.join("\n")}
<!-- selected-skills:end -->
`;
}

async function startTestServer(overrides = {}) {
  const dir = tmpdir();
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash: "",
    port: 0,
    spotifyAccessToken: "",
    spotifyRefreshToken: "",
    spotifyClientId: "",
    spotifyClientSecret: "",
    gmailRefreshCommand: "",
    platformHealthReport: "",
    ...overrides
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

test("GET /api/skills serves the in-sync tracer-bullet entry from configured paths", async () => {
  const canonRoot = tmpdir();
  const deployedRoot = tmpdir();
  const catalogPath = path.join(canonRoot, "README.md");
  fs.writeFileSync(catalogPath, catalogReadme([
    "| `ask-workbench` | Route a situation to the smallest skill. | Native | Active |"
  ]));
  writeSkill(canonRoot, "ask-workbench", frontmatter("ask-workbench", "route", "shared body\n"));
  writeSkill(deployedRoot, "ask-workbench", frontmatter("ask-workbench", "route", "shared body\n"));

  const { server, baseUrl } = await startTestServer({
    skillCatalogPath: catalogPath,
    skillDeployedRoot: deployedRoot
  });
  try {
    const response = await fetch(`${baseUrl}/api/skills`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "ok");
    assert.equal(body.entries.length, 1);
    const entry = body.entries[0];
    assert.equal(entry.name, "ask-workbench");
    assert.equal(entry.definition, "Route a situation to the smallest skill.");
    assert.equal(entry.lane, "Native");
    assert.equal(entry.availability, "Active");
    assert.equal(entry.drift, "in_sync");
    assert.ok(entry.canon.reflectedAt);
    assert.ok(entry.deployed.reflectedAt);
  } finally {
    server.close();
  }
});

test("GET /api/skills serves every catalog entry in catalog order (TK-002)", async () => {
  const canonRoot = tmpdir();
  const deployedRoot = tmpdir();
  const catalogPath = path.join(canonRoot, "README.md");
  // Catalog order is intentionally non-alphabetical to catch accidental sorts.
  fs.writeFileSync(catalogPath, catalogReadme([
    "| `grilling` | Question-at-a-time interview primitive. | Core rewrite | Active |",
    "| `ask-workbench` | Route a situation to the smallest skill. | Native | Active |",
    "| `make-it-so` | Approved, build it. | Native | Active |",
    "| `wayfinder` | Reduce fog in large work. | Supporting rewrite | Pending rewrite |"
  ]));
  // in_sync, drifted, missing, pending canon bodies + one deployed-only folder.
  writeSkill(canonRoot, "grilling", frontmatter("grilling", "interview", "shared\n"));
  writeSkill(deployedRoot, "grilling", frontmatter("grilling", "interview", "shared\n"));
  writeSkill(canonRoot, "ask-workbench", frontmatter("ask-workbench", "route", "canon\n"));
  writeSkill(deployedRoot, "ask-workbench", frontmatter("ask-workbench", "route", "DEPLOYED\n"));
  writeSkill(canonRoot, "make-it-so", frontmatter("make-it-so", "build", "canon only\n"));
  writeSkill(canonRoot, "wayfinder", frontmatter("wayfinder", "fog", "pending\n"));
  writeSkill(deployedRoot, "orphan-skill", frontmatter("orphan-skill", "orphan", "orphan\n"));

  const { server, baseUrl } = await startTestServer({
    skillCatalogPath: catalogPath,
    skillDeployedRoot: deployedRoot
  });
  try {
    const response = await fetch(`${baseUrl}/api/skills`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "ok");
    // Catalog entries preserve source order; deployed-only is appended.
    assert.deepEqual(
      body.entries.map((entry) => entry.name),
      ["grilling", "ask-workbench", "make-it-so", "wayfinder", "orphan-skill"]
    );
    const byName = Object.fromEntries(body.entries.map((entry) => [entry.name, entry]));
    assert.equal(byName["grilling"].drift, "in_sync");
    assert.equal(byName["ask-workbench"].drift, "drifted");
    assert.equal(byName["make-it-so"].drift, "missing");
    assert.equal(byName["wayfinder"].drift, "not_applicable");
    assert.equal(byName["orphan-skill"].drift, "deployed_only");
    // Per-entry provenance and freshness travel with each row.
    assert.equal(byName["ask-workbench"].source, "skills/README.md");
    assert.ok(byName["ask-workbench"].canon.reflectedAt);
    assert.equal(byName["orphan-skill"].source, ".claude/skills/");
    assert.equal(body.counts.total, 5);
    assert.equal(body.counts.active, 3);
  } finally {
    server.close();
  }
});

test("GET /api/skills stays 200 and fails closed when the catalog source is missing", async () => {
  const { server, baseUrl } = await startTestServer({
    skillCatalogPath: path.join(tmpdir(), "does-not-exist.md"),
    skillDeployedRoot: tmpdir()
  });
  try {
    const response = await fetch(`${baseUrl}/api/skills`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "unavailable");
    assert.deepEqual(body.entries, []);
    assert.match(body.detail, /unavailable/i);
  } finally {
    server.close();
  }
});

test("skills route exposes no write path", async () => {
  const { server, baseUrl } = await startTestServer({
    skillCatalogPath: path.join(tmpdir(), "does-not-exist.md"),
    skillDeployedRoot: tmpdir()
  });
  try {
    for (const method of ["POST", "PATCH", "PUT", "DELETE"]) {
      const response = await fetch(`${baseUrl}/api/skills`, { method });
      assert.equal(response.status, 404, `${method} must not be routable`);
      const body = await response.json();
      assert.equal(body.error, "API route not found.");
    }
  } finally {
    server.close();
  }
});
