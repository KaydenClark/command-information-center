import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "../server/app.js";

async function startTestServer() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-"));
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash: "",
    port: 0
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
      body: JSON.stringify({ title: "Write release notes", priority: "P2", status: "Inbox" })
    });
    assert.equal(created.status, 201);
    const task = await created.json();
    assert.equal(task.status, "Inbox");

    const moved = await fetch(`${baseUrl}/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Write updated release notes",
        notes: "Verify changelog entries and links.",
        dueDate: "01/06/2026",
        priority: "P1",
        status: "Done"
      })
    });
    assert.equal(moved.status, 200);
    const updated = await moved.json();
    assert.equal(updated.title, "Write updated release notes");
    assert.equal(updated.notes, "Verify changelog entries and links.");
    assert.equal(updated.dueDate, "01/06/2026");
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
