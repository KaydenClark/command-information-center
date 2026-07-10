import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "../server/app.js";

async function startTestServer(overrides = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-"));
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.js"),
    passcodeHash: "",
    port: 0,
    ...overrides
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

test("state returns dashboard data and seeded tasks", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const response = await fetch(`${baseUrl}/api/state`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.dashboard.meta);
    assert.ok(Array.isArray(body.tasks));
    assert.ok(body.tasks.length > 0);
    assert.deepEqual(body.atlas, { configuredUrl: "" });
  } finally {
    server.close();
  }
});

test("task lifecycle supports create, move, and dismiss", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const created = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Write launchd notes", priority: "P2", status: "Inbox" })
    });
    assert.equal(created.status, 201);
    const task = await created.json();
    assert.equal(task.status, "Inbox");

    const moved = await fetch(`${baseUrl}/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Write updated launchd notes",
        notes: "Verify plist path and logs.",
        dueDate: "06/16/2026",
        priority: "P1",
        status: "Done"
      })
    });
    assert.equal(moved.status, 200);
    const updated = await moved.json();
    assert.equal(updated.title, "Write updated launchd notes");
    assert.equal(updated.notes, "Verify plist path and logs.");
    assert.equal(updated.dueDate, "06/16/2026");
    assert.equal(updated.priority, "P1");
    assert.equal(updated.status, "Done");
    assert.ok(updated.completedAt);

    const dismissed = await fetch(`${baseUrl}/api/tasks/${task.id}/dismiss`, { method: "POST" });
    assert.equal(dismissed.status, 200);
  } finally {
    server.close();
  }
});

test("invalid task input fails closed", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const response = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "", status: "BadColumn" })
    });
    assert.equal(response.status, 400);
  } finally {
    server.close();
  }
});

test("unknown api routes return json instead of the app shell", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const response = await fetch(`${baseUrl}/api/intelligence/not-a-route`);
    assert.equal(response.status, 404);
    assert.match(response.headers.get("content-type") || "", /application\/json/);

    const body = await response.json();
    assert.equal(body.error, "API route not found.");
  } finally {
    server.close();
  }
});

test("app shell is never cached across local and LAN hostnames", async () => {
  const distPath = fs.mkdtempSync(path.join(os.tmpdir(), "cic-dist-"));
  fs.writeFileSync(path.join(distPath, "index.html"), "<!doctype html><title>CIC test shell</title>");
  const { server, baseUrl } = await startTestServer({ distPath });
  try {
    const response = await fetch(`${baseUrl}/`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store, must-revalidate");
    assert.match(await response.text(), /CIC test shell/);
  } finally {
    server.close();
  }
});

test("project taskboard API lists boards, returns details, and updates priority", async () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cic-project-api-"));
  const projectDir = path.join(projectsRoot, "Sample Project");
  fs.mkdirSync(projectDir);
  fs.writeFileSync(path.join(projectDir, "TASKBOARD.md"), `# Sample\n\n## Pending Decisions\n\nNo decisions.\n\n## Ready\n\n| ID | Priority | Task | Owner | Status |\n|---|---:|---|---|---|\n| T-100 | 2 | Test the project board | agent | ready |\n\n## In Progress\n\n## Blocked\n\n## Deferred\n\n## Done\n`);

  const { server, baseUrl } = await startTestServer({ projectsRoot });
  try {
    const listResponse = await fetch(`${baseUrl}/api/project-taskboards`);
    assert.equal(listResponse.status, 200);
    const list = await listResponse.json();
    assert.equal(list.projects[0].name, "Sample Project");

    const slug = list.projects[0].slug;
    const detailResponse = await fetch(`${baseUrl}/api/project-taskboards/${slug}`);
    assert.equal(detailResponse.status, 200);
    assert.equal((await detailResponse.json()).groups.ready[0].id, "T-100");

    const updateResponse = await fetch(`${baseUrl}/api/project-taskboards/${slug}/tasks/T-100/priority`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: "P1" })
    });
    assert.equal(updateResponse.status, 200);
    assert.equal((await updateResponse.json()).priority, "P1");
    assert.match(fs.readFileSync(path.join(projectDir, "TASKBOARD.md"), "utf8"), /\| T-100 \| 1 \|/);
  } finally {
    server.close();
  }
});
