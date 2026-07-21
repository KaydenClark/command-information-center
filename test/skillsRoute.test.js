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
