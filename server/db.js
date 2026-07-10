import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { priorityForGmailTag } from "./dataFeed.js";

const STATUSES = new Set(["Inbox", "Today", "Next", "Waiting", "Done"]);
const PRIORITIES = new Set(["P1", "P2", "P3"]);

export function openDb(dbPath) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'manual',
      priority TEXT NOT NULL DEFAULT 'P3',
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'Inbox',
      suggested INTEGER NOT NULL DEFAULT 0,
      dismissed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS task_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS source_status (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS refresh_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      started_at TEXT NOT NULL,
      finished_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}

export function validateTaskInput(input, partial = false) {
  const next = {};
  if (!partial || input.title !== undefined) {
    const title = String(input.title || "").trim();
    if (!title) throw Object.assign(new Error("Task title is required."), { status: 400 });
    next.title = title.slice(0, 160);
  }
  if (input.notes !== undefined) next.notes = String(input.notes || "").slice(0, 2000);
  if (input.source !== undefined) next.source = String(input.source || "manual").trim().slice(0, 80) || "manual";
  if (input.priority !== undefined) {
    if (!PRIORITIES.has(input.priority)) throw Object.assign(new Error("Priority must be P1, P2, or P3."), { status: 400 });
    next.priority = input.priority;
  }
  if (input.status !== undefined) {
    if (!STATUSES.has(input.status)) throw Object.assign(new Error("Unknown task status."), { status: 400 });
    next.status = input.status;
    next.completed_at = input.status === "Done" ? new Date().toISOString() : null;
  }
  if (input.dueDate !== undefined || input.due_date !== undefined) {
    const due = input.dueDate ?? input.due_date;
    next.due_date = due ? String(due).slice(0, 32) : null;
  }
  return next;
}

export function rowToTask(row) {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    source: row.source,
    priority: row.priority,
    dueDate: row.due_date,
    status: row.status,
    suggested: Boolean(row.suggested),
    dismissed: Boolean(row.dismissed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at
  };
}

export function listTasks(db) {
  return db.prepare("SELECT * FROM tasks WHERE dismissed = 0 ORDER BY status, created_at").all().map(rowToTask);
}

export function createTask(db, input) {
  const now = new Date().toISOString();
  const task = {
    id: crypto.randomUUID(),
    notes: "",
    source: "manual",
    priority: "P3",
    due_date: null,
    status: "Inbox",
    suggested: input.suggested ? 1 : 0,
    dismissed: 0,
    ...validateTaskInput(input)
  };
  db.prepare(`
    INSERT INTO tasks (id, title, notes, source, priority, due_date, status, suggested, dismissed, created_at, updated_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(task.id, task.title, task.notes, task.source, task.priority, task.due_date, task.status, task.suggested, task.dismissed, now, now, task.status === "Done" ? now : null);
  addTaskEvent(db, task.id, "created", { source: task.source, suggested: Boolean(task.suggested) });
  return getTask(db, task.id);
}

export function getTask(db, id) {
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!row) throw Object.assign(new Error("Task not found."), { status: 404 });
  return rowToTask(row);
}

export function updateTask(db, id, input) {
  const current = getTask(db, id);
  const patch = validateTaskInput(input, true);
  const next = { ...current, ...patch };
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE tasks SET title = ?, notes = ?, source = ?, priority = ?, due_date = ?, status = ?,
      updated_at = ?, completed_at = ?
    WHERE id = ?
  `).run(
    next.title,
    next.notes,
    next.source,
    next.priority,
    next.due_date ?? next.dueDate ?? null,
    next.status,
    now,
    patch.completed_at !== undefined ? patch.completed_at : current.completedAt,
    id
  );
  addTaskEvent(db, id, "updated", patch);
  return getTask(db, id);
}

export function dismissTask(db, id) {
  getTask(db, id);
  const now = new Date().toISOString();
  db.prepare("UPDATE tasks SET dismissed = 1, updated_at = ? WHERE id = ?").run(now, id);
  addTaskEvent(db, id, "dismissed", {});
  return { ok: true };
}

export function addTaskEvent(db, taskId, eventType, payload) {
  db.prepare("INSERT INTO task_events (task_id, event_type, payload, created_at) VALUES (?, ?, ?, ?)")
    .run(taskId, eventType, JSON.stringify(payload || {}), new Date().toISOString());
}

export function upsertSources(db, sources) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO source_status (id, name, status, detail, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, status = excluded.status, detail = excluded.detail, updated_at = excluded.updated_at
  `);
  for (const source of sources || []) {
    stmt.run(source.id, source.name, source.status, source.detail || "", now);
  }
}

export function listSourceStatus(db) {
  return db.prepare("SELECT * FROM source_status ORDER BY name").all();
}

export function recordRefreshRun(db, source, status, detail, startedAt = new Date().toISOString()) {
  const finishedAt = new Date().toISOString();
  db.prepare("INSERT INTO refresh_runs (source, status, detail, started_at, finished_at) VALUES (?, ?, ?, ?, ?)")
    .run(source, status, detail || "", startedAt, finishedAt);
}

export function listRefreshFreshness(db) {
  const freshness = {};
  const rows = db.prepare("SELECT * FROM refresh_runs ORDER BY id DESC").all();
  for (const row of rows) {
    const current = freshness[row.source] || {
      source: row.source,
      status: row.status,
      detail: row.detail,
      lastAttemptAt: row.started_at,
      lastFinishedAt: row.finished_at,
      lastSuccessAt: null
    };
    if (!current.lastSuccessAt && row.status === "ok") current.lastSuccessAt = row.started_at;
    freshness[row.source] = current;
  }
  return freshness;
}

export function seedFromMissionData(db, data) {
  upsertSources(db, data.sources || []);
  const count = db.prepare("SELECT COUNT(*) AS count FROM tasks").get().count;
  if (count > 0) return;

  for (const action of data.briefing?.actions || []) {
    createTask(db, {
      title: action.title,
      notes: action.detail,
      source: (action.sources || []).join(" + ") || "briefing",
      priority: action.priority || "P2",
      dueDate: action.due || null,
      status: action.priority === "P1" ? "Today" : "Next",
      suggested: false
    });
  }

  for (const thread of (data.gmail?.threads || []).slice(0, 6)) {
    createTask(db, {
      title: thread.subject,
      notes: `${thread.from || "Gmail"} ${thread.date || ""}`.trim(),
      source: "gmail",
      priority: priorityForGmailTag(thread.tag),
      status: "Inbox",
      suggested: true
    });
  }
}
