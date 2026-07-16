import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  claimCaptainOperationExecution,
  completeCaptainOperationExecution,
  createCaptainApprovalOperation,
  listCaptainOperationEvents,
  openDb
} from "../server/db.js";

const MAIN_SHA = "a".repeat(40);
const INTEGRATION_SHA = "b".repeat(40);
const FINGERPRINT = "cb7424103ffe6f2217f89cd3a63003a061f31c8330226cb99771bc2a800092bc";

function approvedCandidate() {
  return {
    repository: "KaydenClark/LLM_Workbench",
    sourceBranch: "integration",
    destinationBranch: "main",
    status: "ready",
    mainSha: MAIN_SHA,
    integrationSha: INTEGRATION_SHA,
    pullRequest: {
      number: 42,
      url: "https://github.com/KaydenClark/LLM_Workbench/pull/42",
      headSha: INTEGRATION_SHA,
      baseSha: MAIN_SHA,
      mergeable: true
    },
    releaseGate: {
      id: 991,
      context: "gptos/workbench-release-gate",
      state: "success",
      sha: INTEGRATION_SHA,
      evidenceUrl: "https://github.com/KaydenClark/LLM_Workbench/actions/runs/991",
      auditorSummary: "Auditor passed the exact integration SHA."
    },
    fingerprint: FINGERPRINT
  };
}

function createApprovedOperation() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-workbench-execution-"));
  const db = openDb(path.join(dir, "test.sqlite"));
  const operation = createCaptainApprovalOperation(db, approvedCandidate(), {
    now: "2026-07-16T10:00:00.000Z",
    operationId: "operation-1"
  });
  return {
    db,
    operation,
    close() {
      db.close();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
}

test("Captain operation execution claim is atomic and records requested then executing", () => {
  const runtime = createApprovedOperation();
  try {
    const claim = claimCaptainOperationExecution(runtime.db, runtime.operation.id, {
      claimId: "claim-1",
      now: "2026-07-16T10:01:00.000Z"
    });
    assert.equal(claim.kind, "claimed");
    assert.equal(claim.operation.status, "executing");
    assert.equal(claim.operation.executionClaimId, "claim-1");

    const second = claimCaptainOperationExecution(runtime.db, runtime.operation.id, {
      claimId: "claim-2",
      now: "2026-07-16T10:01:01.000Z"
    });
    assert.equal(second.kind, "already_executing");
    assert.equal(second.operation.executionClaimId, "claim-1");
    assert.deepEqual(
      listCaptainOperationEvents(runtime.db, runtime.operation.id).map((event) => event.eventType),
      ["approved", "requested", "executing", "requested"]
    );
  } finally {
    runtime.close();
  }
});

test("Captain operation execution completion is claim-bound, sanitized, and idempotent", () => {
  const runtime = createApprovedOperation();
  try {
    claimCaptainOperationExecution(runtime.db, runtime.operation.id, {
      claimId: "claim-1",
      now: "2026-07-16T10:01:00.000Z"
    });
    assert.throws(() => completeCaptainOperationExecution(runtime.db, runtime.operation.id, "wrong-claim", {
      status: "applied",
      mergeSha: "c".repeat(40),
      evidenceUrl: `https://github.com/KaydenClark/LLM_Workbench/commit/${"c".repeat(40)}`
    }), { code: "execution_claim_lost" });

    const applied = completeCaptainOperationExecution(runtime.db, runtime.operation.id, "claim-1", {
      status: "applied",
      mergeSha: "c".repeat(40),
      evidenceUrl: `https://github.com/KaydenClark/LLM_Workbench/commit/${"c".repeat(40)}`,
      now: "2026-07-16T10:02:00.000Z"
    });
    assert.equal(applied.status, "applied");
    assert.equal(applied.mergeSha, "c".repeat(40));

    const retry = claimCaptainOperationExecution(runtime.db, runtime.operation.id, {
      claimId: "claim-2",
      now: "2026-07-16T10:03:00.000Z"
    });
    assert.equal(retry.kind, "already_applied");
    assert.deepEqual(
      listCaptainOperationEvents(runtime.db, runtime.operation.id).map((event) => event.eventType),
      ["approved", "requested", "executing", "applied", "requested"]
    );
  } finally {
    runtime.close();
  }
});

test("A stale executing claim can be reclaimed for crash recovery", () => {
  const runtime = createApprovedOperation();
  try {
    claimCaptainOperationExecution(runtime.db, runtime.operation.id, {
      claimId: "claim-1",
      now: "2026-07-16T10:01:00.000Z"
    });
    const recovered = claimCaptainOperationExecution(runtime.db, runtime.operation.id, {
      claimId: "claim-2",
      now: "2026-07-16T10:07:00.000Z",
      staleAfterMs: 5 * 60 * 1000
    });
    assert.equal(recovered.kind, "claimed");
    assert.equal(recovered.recovery, true);
    assert.equal(recovered.operation.executionClaimId, "claim-2");
  } finally {
    runtime.close();
  }
});

test("openDb additively migrates pre-handoff Captain operation storage", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-workbench-execution-migration-"));
  const dbPath = path.join(dir, "test.sqlite");
  const legacy = new DatabaseSync(dbPath);
  legacy.exec(`
    CREATE TABLE captain_operations (
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
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  legacy.close();

  const migrated = openDb(dbPath);
  try {
    const columns = new Set(
      migrated.prepare("PRAGMA table_info(captain_operations)").all().map((column) => column.name)
    );
    for (const expected of [
      "execution_claim_id",
      "execution_started_at",
      "merge_sha",
      "merge_evidence_url",
      "execution_error_code",
      "execution_error_detail"
    ]) {
      assert.ok(columns.has(expected), `expected additive column ${expected}`);
    }
  } finally {
    migrated.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
