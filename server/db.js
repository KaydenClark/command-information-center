import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { priorityForGmailTag } from "./dataFeed.js";

const STATUSES = new Set(["Inbox", "Today", "Next", "Waiting", "Done"]);
const PRIORITIES = new Set(["P1", "P2", "P3"]);
const TERMINAL_CAPTAIN_BLOCK_CODES = new Set([
  "captain_result_verification_mismatch",
  "captain_result_verification_timeout"
]);
export const CAPTAIN_APPROVAL_MAX_AGE_MS = 15 * 60 * 1000;

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
    CREATE TABLE IF NOT EXISTS captain_operations (
      id TEXT PRIMARY KEY,
      operation_type TEXT NOT NULL,
      status TEXT NOT NULL,
      repository TEXT NOT NULL,
      source_branch TEXT NOT NULL,
      destination_branch TEXT NOT NULL,
      main_sha TEXT NOT NULL,
      integration_sha TEXT NOT NULL,
      pull_request_number INTEGER NOT NULL,
      release_gate_status_id INTEGER NOT NULL,
      evidence_url TEXT NOT NULL,
      auditor_summary TEXT NOT NULL,
      candidate_fingerprint TEXT NOT NULL UNIQUE,
      approved_at TEXT NOT NULL,
      execution_claim_id TEXT,
      execution_started_at TEXT,
      merge_sha TEXT,
      merge_evidence_url TEXT,
      execution_error_code TEXT,
      execution_error_detail TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS captain_operation_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (operation_id) REFERENCES captain_operations(id) ON DELETE RESTRICT
    );
    CREATE TABLE IF NOT EXISTS work_projection_sources (
      source_key TEXT PRIMARY KEY,
      source_path TEXT NOT NULL,
      source_revision TEXT NOT NULL,
      observed_at TEXT NOT NULL,
      captured_at TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('current', 'stale', 'unavailable')),
      detail TEXT NOT NULL DEFAULT '' CHECK (length(detail) <= 500)
    );
    CREATE TABLE IF NOT EXISTS work_items_projection (
      fuid TEXT PRIMARY KEY
        CHECK (length(fuid) = 6 AND fuid <> '000000' AND fuid NOT GLOB '*[^0-9A-Z]*'),
      source_key TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('spec', 'ticket')),
      typed_alias TEXT NOT NULL,
      parent_fuid TEXT,
      title TEXT NOT NULL,
      canonical_status TEXT NOT NULL,
      created TEXT NOT NULL,
      last_worked TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT '',
      owner TEXT NOT NULL DEFAULT '',
      blockers TEXT NOT NULL DEFAULT '',
      next_gate TEXT NOT NULL DEFAULT '',
      source_revision TEXT NOT NULL,
      UNIQUE (source_key, kind, typed_alias),
      FOREIGN KEY (source_key) REFERENCES work_projection_sources(source_key) ON DELETE CASCADE,
      FOREIGN KEY (parent_fuid) REFERENCES work_items_projection(fuid) ON DELETE RESTRICT
    );
    CREATE TABLE IF NOT EXISTS work_projection_refreshes (
      fuid TEXT PRIMARY KEY
        CHECK (length(fuid) = 6 AND fuid <> '000000' AND fuid NOT GLOB '*[^0-9A-Z]*'),
      started_at TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      source_count INTEGER NOT NULL CHECK (source_count >= 0),
      item_count INTEGER NOT NULL CHECK (item_count >= 0),
      outcome TEXT NOT NULL CHECK (outcome IN ('ok', 'failed')),
      error_detail TEXT NOT NULL DEFAULT '' CHECK (length(error_detail) <= 500)
    );
    CREATE TABLE IF NOT EXISTS intent_requests (
      fuid TEXT PRIMARY KEY
        CHECK (length(fuid) = 6 AND fuid <> '000000' AND fuid NOT GLOB '*[^0-9A-Z]*'),
      target_fuid TEXT NOT NULL,
      from_status TEXT NOT NULL,
      requested_status TEXT NOT NULL,
      actor TEXT NOT NULL CHECK (length(actor) BETWEEN 1 AND 80),
      source_revision TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE CHECK (length(idempotency_key) BETWEEN 1 AND 120),
      status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'superseded')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS intent_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      intent_fuid TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL DEFAULT '{}' CHECK (length(payload) <= 4000),
      created_at TEXT NOT NULL,
      FOREIGN KEY (intent_fuid) REFERENCES intent_requests(fuid) ON DELETE RESTRICT
    );
    CREATE TABLE IF NOT EXISTS fuid_allocators (
      scope TEXT PRIMARY KEY,
      width INTEGER NOT NULL CHECK (width IN (4, 6)),
      last_issued TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TRIGGER IF NOT EXISTS captain_operation_events_no_update
    BEFORE UPDATE ON captain_operation_events
    BEGIN
      SELECT RAISE(ABORT, 'Captain operation events are append-only.');
    END;
    CREATE TRIGGER IF NOT EXISTS captain_operation_events_no_delete
    BEFORE DELETE ON captain_operation_events
    BEGIN
      SELECT RAISE(ABORT, 'Captain operation events are append-only.');
    END;
    CREATE TRIGGER IF NOT EXISTS intent_events_no_update
    BEFORE UPDATE ON intent_events
    BEGIN
      SELECT RAISE(ABORT, 'Intent events are append-only.');
    END;
    CREATE TRIGGER IF NOT EXISTS intent_events_no_delete
    BEFORE DELETE ON intent_events
    BEGIN
      SELECT RAISE(ABORT, 'Intent events are append-only.');
    END;
  `);
  const captainOperationColumns = new Map(
    db.prepare("PRAGMA table_info(captain_operations)").all().map((column) => [column.name, column])
  );
  for (const [name, definition] of [
    ["execution_claim_id", "TEXT"],
    ["execution_started_at", "TEXT"],
    ["merge_sha", "TEXT"],
    ["merge_evidence_url", "TEXT"],
    ["execution_error_code", "TEXT"],
    ["execution_error_detail", "TEXT"]
  ]) {
    if (!captainOperationColumns.has(name)) {
      db.exec(`ALTER TABLE captain_operations ADD COLUMN ${name} ${definition}`);
    }
  }
  return db;
}

function captainOperationError(message, status, code) {
  return Object.assign(new Error(message), { status, code });
}

function validateCaptainReleaseCandidate(candidate) {
  const fixedContract = candidate?.repository === "KaydenClark/LLM_Workbench"
    && candidate?.sourceBranch === "integration"
    && candidate?.destinationBranch === "main"
    && candidate?.status === "ready";
  const validShas = /^[a-f0-9]{40}$/.test(candidate?.mainSha || "")
    && /^[a-f0-9]{40}$/.test(candidate?.integrationSha || "");
  const expectedFingerprint = crypto.createHash("sha256").update(
    `${candidate?.repository} | ${candidate?.mainSha} | ${candidate?.integrationSha} | ${candidate?.pullRequest?.number} | ${candidate?.releaseGate?.id}`
  ).digest("hex");
  const validFingerprint = /^[a-f0-9]{64}$/.test(candidate?.fingerprint || "")
    && candidate.fingerprint === expectedFingerprint;
  const validPullRequest = Number.isSafeInteger(candidate?.pullRequest?.number)
    && candidate.pullRequest.number > 0
    && candidate.pullRequest.headSha === candidate.integrationSha
    && candidate.pullRequest.baseSha === candidate.mainSha
    && candidate.pullRequest.mergeable === true;
  const validGate = Number.isSafeInteger(candidate?.releaseGate?.id)
    && candidate.releaseGate.id > 0
    && candidate.releaseGate.context === "gptos/workbench-release-gate"
    && candidate.releaseGate.state === "success"
    && candidate.releaseGate.sha === candidate.integrationSha
    && /^https:\/\//.test(candidate.releaseGate.evidenceUrl || "")
    && typeof candidate.releaseGate.auditorSummary === "string"
    && candidate.releaseGate.auditorSummary.trim().length > 0;
  if (!fixedContract || !validShas || !validFingerprint || !validPullRequest || !validGate) {
    throw captainOperationError(
      "Workbench release candidate does not match the fixed approval contract.",
      400,
      "candidate_contract_invalid"
    );
  }
}

function rowToCaptainOperation(row) {
  if (!row) return null;
  const operation = {
    id: row.id,
    type: row.operation_type,
    status: row.status,
    repository: row.repository,
    sourceBranch: row.source_branch,
    destinationBranch: row.destination_branch,
    mainSha: row.main_sha,
    integrationSha: row.integration_sha,
    pullRequestNumber: row.pull_request_number,
    releaseGateStatusId: row.release_gate_status_id,
    evidenceUrl: row.evidence_url,
    auditorSummary: row.auditor_summary,
    candidateFingerprint: row.candidate_fingerprint,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.execution_claim_id) operation.executionClaimId = row.execution_claim_id;
  if (row.execution_started_at) operation.executionStartedAt = row.execution_started_at;
  if (row.merge_sha) operation.mergeSha = row.merge_sha;
  if (row.merge_evidence_url) operation.mergeEvidenceUrl = row.merge_evidence_url;
  if (row.execution_error_code) operation.executionErrorCode = row.execution_error_code;
  if (row.execution_error_detail) operation.executionErrorDetail = row.execution_error_detail;
  return operation;
}

export function createCaptainApprovalOperation(db, candidate, options = {}) {
  validateCaptainReleaseCandidate(candidate);
  const now = options.now || new Date().toISOString();
  const operationId = options.operationId || crypto.randomUUID();

  db.exec("BEGIN IMMEDIATE");
  try {
    const existing = db.prepare(
      "SELECT * FROM captain_operations WHERE candidate_fingerprint = ?"
    ).get(candidate.fingerprint);
    if (existing) {
      const age = Date.parse(now) - Date.parse(existing.approved_at || "");
      const expiredApproval = existing.status === "approved"
        && Number.isFinite(age)
        && age > CAPTAIN_APPROVAL_MAX_AGE_MS;
      if (existing.status !== "rejected" && !expiredApproval) {
        throw captainOperationError(
          "This Workbench release candidate was already approved.",
          409,
          "candidate_already_approved"
        );
      }
      db.prepare(`
        UPDATE captain_operations
        SET status = 'approved', approved_at = ?, execution_claim_id = NULL,
            execution_started_at = NULL, merge_sha = NULL, merge_evidence_url = NULL,
            execution_error_code = NULL, execution_error_detail = NULL, updated_at = ?
        WHERE id = ? AND status = ?
      `).run(now, now, existing.id, existing.status);
      appendCaptainOperationEvent(db, existing.id, "approved", {
        candidateFingerprint: candidate.fingerprint,
        integrationSha: candidate.integrationSha,
        renewed: true,
        previousStatus: existing.status
      }, now);
      db.exec("COMMIT");
      return getLatestCaptainOperation(db, existing.id);
    }

    db.prepare(`
      INSERT INTO captain_operations (
        id, operation_type, status, repository, source_branch, destination_branch,
        main_sha, integration_sha, pull_request_number, release_gate_status_id,
        evidence_url, auditor_summary, candidate_fingerprint, approved_at,
        created_at, updated_at
      ) VALUES (?, 'workbench_release', 'approved', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      operationId,
      candidate.repository,
      candidate.sourceBranch,
      candidate.destinationBranch,
      candidate.mainSha,
      candidate.integrationSha,
      candidate.pullRequest.number,
      candidate.releaseGate.id,
      candidate.releaseGate.evidenceUrl,
      candidate.releaseGate.auditorSummary.trim(),
      candidate.fingerprint,
      now,
      now,
      now
    );
    db.prepare(`
      INSERT INTO captain_operation_events (operation_id, event_type, payload, created_at)
      VALUES (?, 'approved', ?, ?)
    `).run(operationId, JSON.stringify({
      candidateFingerprint: candidate.fingerprint,
      integrationSha: candidate.integrationSha
    }), now);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return getLatestCaptainOperation(db, operationId);
}

export function getLatestCaptainOperation(db, operationId = null) {
  const row = operationId
    ? db.prepare("SELECT * FROM captain_operations WHERE id = ?").get(operationId)
    : db.prepare("SELECT * FROM captain_operations ORDER BY created_at DESC, rowid DESC LIMIT 1").get();
  return rowToCaptainOperation(row);
}

export function listCaptainOperationEvents(db, operationId) {
  return db.prepare(`
    SELECT * FROM captain_operation_events WHERE operation_id = ? ORDER BY id
  `).all(operationId).map((row) => ({
    id: row.id,
    operationId: row.operation_id,
    eventType: row.event_type,
    payload: JSON.parse(row.payload),
    createdAt: row.created_at
  }));
}

function appendCaptainOperationEvent(db, operationId, eventType, payload, now) {
  db.prepare(`
    INSERT INTO captain_operation_events (operation_id, event_type, payload, created_at)
    VALUES (?, ?, ?, ?)
  `).run(operationId, eventType, JSON.stringify(payload), now);
}

export function claimCaptainOperationExecution(db, operationId, options = {}) {
  const now = options.now || new Date().toISOString();
  const claimId = options.claimId || crypto.randomUUID();
  const staleAfterMs = options.staleAfterMs ?? 5 * 60 * 1000;
  if (typeof operationId !== "string" || !operationId || typeof claimId !== "string" || !claimId) {
    throw captainOperationError("A valid Captain operation and execution claim are required.", 400, "execution_claim_invalid");
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    const row = db.prepare("SELECT * FROM captain_operations WHERE id = ?").get(operationId);
    if (!row) {
      throw captainOperationError("Captain operation was not found.", 404, "operation_not_found");
    }
    appendCaptainOperationEvent(db, operationId, "requested", {
      previousStatus: row.status
    }, now);

    if (row.status === "applied") {
      db.exec("COMMIT");
      return { kind: "already_applied", operation: rowToCaptainOperation(row) };
    }
    if (row.status === "rejected") {
      db.exec("COMMIT");
      return { kind: "rejected", operation: rowToCaptainOperation(row) };
    }
    if (row.status === "blocked" && TERMINAL_CAPTAIN_BLOCK_CODES.has(row.execution_error_code)) {
      db.exec("COMMIT");
      return { kind: "not_executable", operation: rowToCaptainOperation(row) };
    }

    const startedAt = Date.parse(row.execution_started_at || "");
    const currentTime = Date.parse(now);
    const claimIsStale = row.status === "executing"
      && Number.isFinite(currentTime)
      && (!Number.isFinite(startedAt) || currentTime - startedAt >= staleAfterMs);
    if (row.status === "executing" && !claimIsStale) {
      db.exec("COMMIT");
      return { kind: "already_executing", operation: rowToCaptainOperation(row) };
    }
    if (!new Set(["approved", "blocked", "executing"]).has(row.status)) {
      db.exec("COMMIT");
      return { kind: "not_executable", operation: rowToCaptainOperation(row) };
    }

    const result = db.prepare(`
      UPDATE captain_operations
      SET status = 'executing', execution_claim_id = ?, execution_started_at = ?,
          execution_error_code = NULL, execution_error_detail = NULL, updated_at = ?
      WHERE id = ? AND status = ?
    `).run(claimId, now, now, operationId, row.status);
    if (result.changes !== 1) {
      throw captainOperationError("Captain operation execution could not be claimed.", 409, "execution_claim_conflict");
    }
    appendCaptainOperationEvent(db, operationId, "executing", {
      recovery: claimIsStale,
      candidateFingerprint: row.candidate_fingerprint,
      integrationSha: row.integration_sha
    }, now);
    db.exec("COMMIT");
    return {
      kind: "claimed",
      recovery: claimIsStale,
      operation: getLatestCaptainOperation(db, operationId)
    };
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // The transaction may already be committed for an idempotent result.
    }
    throw error;
  }
}

export function completeCaptainOperationExecution(db, operationId, claimId, outcome = {}) {
  const now = outcome.now || new Date().toISOString();
  const allowedStatuses = new Set(["applied", "blocked", "rejected"]);
  if (!allowedStatuses.has(outcome.status)) {
    throw captainOperationError("Captain operation execution outcome is invalid.", 400, "execution_outcome_invalid");
  }

  let mergeSha = null;
  let mergeEvidenceUrl = null;
  let errorCode = null;
  let errorDetail = null;
  if (outcome.status === "applied") {
    mergeSha = /^[a-f0-9]{40}$/.test(outcome.mergeSha || "") ? outcome.mergeSha : null;
    mergeEvidenceUrl = typeof outcome.evidenceUrl === "string"
      && outcome.evidenceUrl === `https://github.com/KaydenClark/LLM_Workbench/commit/${mergeSha}`
      ? outcome.evidenceUrl
      : null;
    if (!mergeSha || !mergeEvidenceUrl) {
      throw captainOperationError("Verified merge evidence is required for an applied operation.", 400, "merge_evidence_invalid");
    }
  } else {
    errorCode = /^[a-z0-9_]{1,80}$/.test(outcome.errorCode || "") ? outcome.errorCode : "execution_failed";
    errorDetail = typeof outcome.errorDetail === "string" && outcome.errorDetail.length <= 240
      ? outcome.errorDetail
      : "Workbench release execution failed closed.";
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    const result = db.prepare(`
      UPDATE captain_operations
      SET status = ?, merge_sha = ?, merge_evidence_url = ?,
          execution_error_code = ?, execution_error_detail = ?, updated_at = ?
      WHERE id = ? AND status = 'executing' AND execution_claim_id = ?
    `).run(
      outcome.status,
      mergeSha,
      mergeEvidenceUrl,
      errorCode,
      errorDetail,
      now,
      operationId,
      claimId
    );
    if (result.changes !== 1) {
      throw captainOperationError("Captain operation execution claim is no longer current.", 409, "execution_claim_lost");
    }
    const payload = outcome.status === "applied"
      ? { mergeSha, evidenceUrl: mergeEvidenceUrl }
      : { code: errorCode, detail: errorDetail };
    appendCaptainOperationEvent(db, operationId, outcome.status, payload, now);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return getLatestCaptainOperation(db, operationId);
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
