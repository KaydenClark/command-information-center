import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  openDb,
  validateTaskInput,
  rowToTask,
  createTask,
  getTask,
  updateTask,
  dismissTask,
  listTasks,
  addTaskEvent,
  upsertSources,
  listSourceStatus,
  recordRefreshRun,
  seedFromMissionData
} from "../server/db.js";

function tempDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-db-"));
  return openDb(path.join(dir, "test.sqlite"));
}

// ---- validateTaskInput ----

test("validateTaskInput trims and returns title", () => {
  const result = validateTaskInput({ title: "  hello  " });
  assert.equal(result.title, "hello");
});

test("validateTaskInput truncates title to 160 characters", () => {
  const result = validateTaskInput({ title: "x".repeat(200) });
  assert.equal(result.title.length, 160);
});

test("validateTaskInput throws 400 for empty title", () => {
  assert.throws(() => validateTaskInput({ title: "  " }), { message: "Task title is required." });
  assert.throws(() => validateTaskInput({ title: "" }), { status: 400 });
});

test("validateTaskInput throws 400 for invalid priority", () => {
  assert.throws(() => validateTaskInput({ title: "t", priority: "P9" }), { status: 400 });
});

test("validateTaskInput throws 400 for invalid status", () => {
  assert.throws(() => validateTaskInput({ title: "t", status: "Backlog" }), { status: 400 });
});

test("validateTaskInput accepts all valid priorities", () => {
  for (const p of ["P1", "P2", "P3"]) {
    const result = validateTaskInput({ title: "t", priority: p });
    assert.equal(result.priority, p);
  }
});

test("validateTaskInput accepts all valid statuses", () => {
  for (const s of ["Inbox", "Today", "Next", "Waiting", "Done"]) {
    const result = validateTaskInput({ title: "t", status: s });
    assert.equal(result.status, s);
  }
});

test("validateTaskInput sets completed_at when status is Done", () => {
  const result = validateTaskInput({ title: "t", status: "Done" });
  assert.ok(result.completed_at);
});

test("validateTaskInput sets completed_at to null for non-Done statuses", () => {
  const result = validateTaskInput({ title: "t", status: "Inbox" });
  assert.equal(result.completed_at, null);
});

test("validateTaskInput in partial mode skips title check when title is absent", () => {
  const result = validateTaskInput({ notes: "updated notes" }, true);
  assert.equal(result.notes, "updated notes");
  assert.equal(result.title, undefined);
});

test("validateTaskInput truncates notes to 2000 characters", () => {
  const result = validateTaskInput({ title: "t", notes: "n".repeat(2100) });
  assert.equal(result.notes.length, 2000);
});

test("validateTaskInput accepts dueDate from either field name", () => {
  const a = validateTaskInput({ title: "t", dueDate: "01/01/2026" });
  assert.equal(a.due_date, "01/01/2026");
  const b = validateTaskInput({ title: "t", due_date: "12/31/2025" });
  assert.equal(b.due_date, "12/31/2025");
});

// ---- rowToTask ----

test("rowToTask converts snake_case columns to camelCase fields", () => {
  const row = {
    id: "abc",
    title: "Do something",
    notes: "",
    source: "manual",
    priority: "P2",
    due_date: "01/01/2026",
    status: "Inbox",
    suggested: 1,
    dismissed: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    completed_at: null
  };
  const task = rowToTask(row);
  assert.equal(task.dueDate, "01/01/2026");
  assert.equal(task.createdAt, "2026-01-01T00:00:00Z");
  assert.equal(task.suggested, true);
  assert.equal(task.dismissed, false);
  assert.equal(task.completedAt, null);
});

// ---- openDb ----

test("openDb creates the tasks table", () => {
  const db = tempDb();
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'").get();
  assert.ok(row, "tasks table should exist");
  db.close();
});

test("openDb creates the task_events table", () => {
  const db = tempDb();
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='task_events'").get();
  assert.ok(row);
  db.close();
});

test("openDb creates the source_status table", () => {
  const db = tempDb();
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='source_status'").get();
  assert.ok(row);
  db.close();
});

test("openDb is idempotent when called on the same path twice", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-db-"));
  const p = path.join(dir, "test.sqlite");
  const db1 = openDb(p);
  db1.close();
  const db2 = openDb(p);
  db2.close();
});

// ---- createTask / getTask ----

test("createTask inserts a task and returns it with an id", () => {
  const db = tempDb();
  const task = createTask(db, { title: "Buy milk", priority: "P3", status: "Inbox" });
  assert.ok(task.id);
  assert.equal(task.title, "Buy milk");
  assert.equal(task.priority, "P3");
  assert.equal(task.status, "Inbox");
  db.close();
});

test("createTask defaults source to manual", () => {
  const db = tempDb();
  const task = createTask(db, { title: "Default source" });
  assert.equal(task.source, "manual");
  db.close();
});

test("getTask returns the task by id", () => {
  const db = tempDb();
  const created = createTask(db, { title: "Fetch me" });
  const fetched = getTask(db, created.id);
  assert.equal(fetched.id, created.id);
  assert.equal(fetched.title, "Fetch me");
  db.close();
});

test("getTask throws 404 for unknown id", () => {
  const db = tempDb();
  assert.throws(() => getTask(db, "nonexistent-id"), { status: 404 });
  db.close();
});

// ---- updateTask ----

test("updateTask patches title and notes", () => {
  const db = tempDb();
  const task = createTask(db, { title: "Original" });
  const updated = updateTask(db, task.id, { title: "Updated", notes: "New notes" });
  assert.equal(updated.title, "Updated");
  assert.equal(updated.notes, "New notes");
  db.close();
});

test("updateTask marks completedAt when moved to Done", () => {
  const db = tempDb();
  const task = createTask(db, { title: "Work item" });
  const updated = updateTask(db, task.id, { status: "Done" });
  assert.ok(updated.completedAt);
  db.close();
});

test("updateTask throws 400 for invalid status", () => {
  const db = tempDb();
  const task = createTask(db, { title: "Task" });
  assert.throws(() => updateTask(db, task.id, { status: "BadStatus" }), { status: 400 });
  db.close();
});

// ---- dismissTask ----

test("dismissTask marks task as dismissed and hides it from listTasks", () => {
  const db = tempDb();
  const task = createTask(db, { title: "Dismiss me" });
  const result = dismissTask(db, task.id);
  assert.equal(result.ok, true);
  const tasks = listTasks(db);
  assert.ok(!tasks.some((t) => t.id === task.id));
  db.close();
});

test("dismissTask throws 404 for unknown task", () => {
  const db = tempDb();
  assert.throws(() => dismissTask(db, "bad-id"), { status: 404 });
  db.close();
});

// ---- listTasks ----

test("listTasks excludes dismissed tasks", () => {
  const db = tempDb();
  const a = createTask(db, { title: "Keep" });
  const b = createTask(db, { title: "Discard" });
  dismissTask(db, b.id);
  const tasks = listTasks(db);
  assert.ok(tasks.some((t) => t.id === a.id));
  assert.ok(!tasks.some((t) => t.id === b.id));
  db.close();
});

// ---- addTaskEvent ----

test("addTaskEvent inserts an event row for the task", () => {
  const db = tempDb();
  const task = createTask(db, { title: "Event target" });
  addTaskEvent(db, task.id, "custom_event", { key: "value" });
  const row = db.prepare("SELECT * FROM task_events WHERE task_id = ? AND event_type = 'custom_event'").get(task.id);
  assert.ok(row);
  assert.deepEqual(JSON.parse(row.payload), { key: "value" });
  db.close();
});

// ---- upsertSources / listSourceStatus ----

test("upsertSources inserts new source rows", () => {
  const db = tempDb();
  upsertSources(db, [{ id: "github", name: "GITHUB", status: "online", detail: "" }]);
  const rows = listSourceStatus(db);
  assert.ok(rows.some((r) => r.id === "github" && r.status === "online"));
  db.close();
});

test("upsertSources updates an existing source", () => {
  const db = tempDb();
  upsertSources(db, [{ id: "github", name: "GITHUB", status: "online", detail: "" }]);
  upsertSources(db, [{ id: "github", name: "GITHUB", status: "offline", detail: "timeout" }]);
  const rows = listSourceStatus(db);
  const github = rows.find((r) => r.id === "github");
  assert.equal(github.status, "offline");
  db.close();
});

test("listSourceStatus returns rows ordered by name", () => {
  const db = tempDb();
  upsertSources(db, [
    { id: "z-source", name: "Z SOURCE", status: "online", detail: "" },
    { id: "a-source", name: "A SOURCE", status: "online", detail: "" }
  ]);
  const rows = listSourceStatus(db);
  const names = rows.map((r) => r.name);
  assert.deepEqual(names, [...names].sort());
  db.close();
});

// ---- recordRefreshRun ----

test("recordRefreshRun inserts a run record", () => {
  const db = tempDb();
  recordRefreshRun(db, "gmail", "ok", "5 tasks created");
  const row = db.prepare("SELECT * FROM refresh_runs WHERE source = 'gmail'").get();
  assert.ok(row);
  assert.equal(row.status, "ok");
  assert.equal(row.detail, "5 tasks created");
  db.close();
});

// ---- seedFromMissionData ----

test("seedFromMissionData seeds briefing actions as tasks", () => {
  const db = tempDb();
  seedFromMissionData(db, {
    sources: [],
    briefing: {
      actions: [
        { title: "Action 1", detail: "Detail", priority: "P1", sources: ["github"] },
        { title: "Action 2", detail: "Detail", priority: "P3", sources: [] }
      ]
    },
    gmail: { threads: [] }
  });
  const tasks = listTasks(db);
  assert.ok(tasks.some((t) => t.title === "Action 1" && t.status === "Today"));
  assert.ok(tasks.some((t) => t.title === "Action 2" && t.status === "Next"));
  db.close();
});

test("seedFromMissionData seeds up to 6 gmail threads as suggested tasks", () => {
  const db = tempDb();
  const threads = Array.from({ length: 8 }, (_, i) => ({
    subject: `Thread ${i + 1}`,
    from: "sender@example.com",
    date: "Mon",
    tag: "INFO"
  }));
  seedFromMissionData(db, { sources: [], briefing: { actions: [] }, gmail: { threads } });
  const tasks = listTasks(db);
  const gmailTasks = tasks.filter((t) => t.source === "gmail");
  assert.equal(gmailTasks.length, 6);
  db.close();
});

test("seedFromMissionData skips seeding when tasks already exist", () => {
  const db = tempDb();
  createTask(db, { title: "Existing task" });
  seedFromMissionData(db, {
    sources: [],
    briefing: { actions: [{ title: "Should not appear", detail: "", priority: "P2", sources: [] }] },
    gmail: { threads: [] }
  });
  const tasks = listTasks(db);
  assert.ok(!tasks.some((t) => t.title === "Should not appear"));
  db.close();
});

test("seedFromMissionData upserts sources regardless of task count", () => {
  const db = tempDb();
  createTask(db, { title: "Existing" });
  seedFromMissionData(db, {
    sources: [{ id: "vercel", name: "VERCEL", status: "online", detail: "" }],
    briefing: { actions: [] },
    gmail: { threads: [] }
  });
  const rows = listSourceStatus(db);
  assert.ok(rows.some((r) => r.id === "vercel"));
  db.close();
});
