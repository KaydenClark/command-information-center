import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createApp } from "../server/app.js";
import { sha256 } from "../server/config.js";
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
const MERGE_SHA = "c".repeat(40);

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
      evidenceUrl: "https://github.com/KaydenClark/LLM_Workbench/commit/" + "c".repeat(40)
    }), { code: "execution_claim_lost" });

    const applied = completeCaptainOperationExecution(runtime.db, runtime.operation.id, "claim-1", {
      status: "applied",
      mergeSha: "c".repeat(40),
      evidenceUrl: "https://github.com/KaydenClark/LLM_Workbench/commit/" + "c".repeat(40),
      now: "2026-07-16T10:02:00.000Z"
    });
    assert.equal(applied.status, "applied");
    assert.equal(applied.mergeSha, "c".repeat(40));
    assert.match(applied.mergeEvidenceUrl, /^https:\/\/github\.com\/KaydenClark\/LLM_Workbench\/commit\//);

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

test("openDb additively migrates pre-executor Captain operation storage", () => {
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

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function createExecutionGithubFetch(options = {}) {
  let merged = Boolean(options.alreadyMerged);
  let putCalls = 0;
  const requests = [];
  const pullRequest = () => ({
    number: 42,
    html_url: "https://github.com/KaydenClark/LLM_Workbench/pull/42",
    state: merged ? "closed" : "open",
    draft: false,
    mergeable: merged ? null : true,
    merged,
    merge_commit_sha: merged ? MERGE_SHA : null,
    head: {
      ref: "integration",
      sha: options.integrationSha || INTEGRATION_SHA,
      repo: { full_name: "KaydenClark/LLM_Workbench" }
    },
    base: {
      ref: "main",
      sha: MAIN_SHA,
      repo: { full_name: "KaydenClark/LLM_Workbench" }
    }
  });

  const fetchImpl = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = init.method || "GET";
    requests.push({ url: url.toString(), method, headers: init.headers, body: init.body });
    if (url.pathname.endsWith("/git/ref/heads/main")) {
      return jsonResponse({ object: { sha: merged ? MERGE_SHA : MAIN_SHA } });
    }
    if (url.pathname.endsWith("/git/ref/heads/integration")) {
      return jsonResponse({ object: { sha: options.integrationSha || INTEGRATION_SHA } });
    }
    if (url.pathname.endsWith("/pulls") && url.searchParams.get("state") === "open") {
      return jsonResponse(merged ? [] : [{ number: 42 }]);
    }
    if (url.pathname.endsWith("/pulls/42") && method === "GET") {
      return jsonResponse(pullRequest());
    }
    if (url.pathname.endsWith("/compare/main...integration")) {
      return jsonResponse({ status: "ahead", ahead_by: 5, behind_by: 0 });
    }
    if (url.pathname.endsWith(`/commits/${options.integrationSha || INTEGRATION_SHA}/status`)) {
      return jsonResponse({
        sha: options.integrationSha || INTEGRATION_SHA,
        statuses: [{
          id: 991,
          context: "gptos/workbench-release-gate",
          state: "success",
          target_url: "https://github.com/KaydenClark/LLM_Workbench/actions/runs/991",
          description: "Auditor passed the exact integration SHA."
        }]
      });
    }
    if (url.pathname.endsWith("/pulls/42/merge") && method === "PUT") {
      putCalls += 1;
      if (options.onMerge) await options.onMerge();
      merged = true;
      return jsonResponse({ merged: true, sha: MERGE_SHA, message: "Pull Request successfully merged" });
    }
    return jsonResponse({ message: "Unexpected test URL" }, 404);
  };
  return { fetchImpl, requests, get putCalls() { return putCalls; } };
}

async function startServer({ fetchImpl, githubToken = "test-github-token", ...overrides } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-workbench-execution-api-"));
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash: sha256("secret"),
    workbenchGithubToken: githubToken,
    spotifyAccessToken: "",
    spotifyRefreshToken: "",
    spotifyClientId: "",
    spotifyClientSecret: "",
    gmailRefreshCommand: "",
    fetchImpl,
    ...overrides
  });
  const operation = createCaptainApprovalOperation(app.locals.db, approvedCandidate(), {
    now: "2026-07-16T10:00:00.000Z",
    operationId: "operation-1"
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  return {
    db: app.locals.db,
    operation,
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
}

async function login(runtime) {
  const response = await fetch(`${runtime.baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode: "secret" })
  });
  assert.equal(response.status, 200);
  return response.headers.get("set-cookie").split(";", 1)[0];
}

function executeOperation(runtime, cookie, body = { operationId: "operation-1", passcode: "secret" }) {
  return fetch(`${runtime.baseUrl}/api/captain/workbench-release/execution`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body)
  });
}

test("Workbench executor requires authentication and rejects generic control fields before GitHub", async () => {
  const github = createExecutionGithubFetch();
  const runtime = await startServer({ fetchImpl: github.fetchImpl });
  try {
    const unauthenticated = await executeOperation(runtime, "");
    assert.equal(unauthenticated.status, 401);
    assert.equal(github.requests.length, 0);

    const cookie = await login(runtime);
    const generic = await executeOperation(runtime, cookie, {
      operationId: "operation-1",
      passcode: "secret",
      repository: "KaydenClark/another-repo",
      command: "merge"
    });
    assert.equal(generic.status, 400);
    assert.equal((await generic.json()).code, "execution_request_invalid");
    assert.equal(github.requests.length, 0);
  } finally {
    await runtime.close();
  }
});

test("Workbench executor revalidates and applies only the approved exact-head merge commit", async () => {
  const github = createExecutionGithubFetch();
  const runtime = await startServer({ fetchImpl: github.fetchImpl });
  try {
    const cookie = await login(runtime);
    const response = await executeOperation(runtime, cookie);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.executed, true);
    assert.equal(body.operation.status, "applied");
    assert.equal(body.operation.mergeSha, MERGE_SHA);

    const mutation = github.requests.filter((request) => request.method === "PUT");
    assert.equal(mutation.length, 1);
    assert.equal(new URL(mutation[0].url).pathname, "/repos/KaydenClark/LLM_Workbench/pulls/42/merge");
    assert.deepEqual(JSON.parse(mutation[0].body), {
      merge_method: "merge",
      sha: INTEGRATION_SHA
    });
    assert.equal(mutation[0].headers.Authorization, "Bearer test-github-token");
    const statusReadIndex = github.requests.findIndex((request) => request.url.endsWith(`/commits/${INTEGRATION_SHA}/status`));
    const mutationIndex = github.requests.findIndex((request) => request.method === "PUT");
    assert.ok(statusReadIndex >= 0 && statusReadIndex < mutationIndex, "exact-SHA release gate must be re-read before mutation");
    assert.deepEqual(
      listCaptainOperationEvents(runtime.db, runtime.operation.id).map((event) => event.eventType),
      ["approved", "requested", "executing", "applied"]
    );
  } finally {
    await runtime.close();
  }
});

test("Workbench executor requires step-up and server-side GitHub credentials without exposing either", async () => {
  const github = createExecutionGithubFetch();
  const runtime = await startServer({ fetchImpl: github.fetchImpl, githubToken: "" });
  try {
    const cookie = await login(runtime);
    const wrongPasscode = await executeOperation(runtime, cookie, {
      operationId: "operation-1",
      passcode: "wrong-secret"
    });
    assert.equal(wrongPasscode.status, 401);
    assert.equal((await wrongPasscode.json()).code, "step_up_invalid");
    assert.equal(github.requests.length, 0);
    assert.equal(runtime.db.prepare("SELECT status FROM captain_operations WHERE id = ?").get("operation-1").status, "approved");

    const missingToken = await executeOperation(runtime, cookie);
    assert.equal(missingToken.status, 503);
    const body = await missingToken.json();
    assert.equal(body.code, "github_token_not_configured");
    assert.equal(github.requests.length, 0);
    assert.equal(body.operation.status, "blocked");
    assert.equal(JSON.stringify(listCaptainOperationEvents(runtime.db, "operation-1")).includes("secret"), false);
  } finally {
    await runtime.close();
  }
});

test("Workbench executor rejects changed exact-head evidence without mutation", async () => {
  const github = createExecutionGithubFetch({ integrationSha: "d".repeat(40) });
  const runtime = await startServer({ fetchImpl: github.fetchImpl });
  try {
    const cookie = await login(runtime);
    const response = await executeOperation(runtime, cookie);
    assert.equal(response.status, 409);
    assert.equal((await response.json()).code, "candidate_stale");
    assert.equal(github.putCalls, 0);
    assert.equal(runtime.db.prepare("SELECT status FROM captain_operations WHERE id = ?").get("operation-1").status, "rejected");
  } finally {
    await runtime.close();
  }
});

test("Workbench executor rejects a tampered durable operation contract before GitHub", async () => {
  const github = createExecutionGithubFetch();
  const runtime = await startServer({ fetchImpl: github.fetchImpl });
  try {
    runtime.db.prepare("UPDATE captain_operations SET repository = 'KaydenClark/another-repo' WHERE id = ?")
      .run("operation-1");
    const cookie = await login(runtime);
    const response = await executeOperation(runtime, cookie);
    assert.equal(response.status, 409);
    assert.equal((await response.json()).code, "operation_contract_invalid");
    assert.equal(github.requests.length, 0);
    assert.equal(runtime.db.prepare("SELECT status FROM captain_operations WHERE id = ?").get("operation-1").status, "rejected");
  } finally {
    await runtime.close();
  }
});

test("Workbench executor records a sanitized blocked result when the merge request is unavailable", async () => {
  const ready = createExecutionGithubFetch();
  const fetchImpl = async (input, init = {}) => {
    const url = new URL(String(input));
    if ((init.method || "GET") === "PUT" && url.pathname.endsWith("/pulls/42/merge")) {
      throw new Error("Bearer raw-token https://private.example.invalid/user-data");
    }
    return ready.fetchImpl(input, init);
  };
  const runtime = await startServer({ fetchImpl });
  try {
    const cookie = await login(runtime);
    const response = await executeOperation(runtime, cookie);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, "github_merge_unavailable");
    const operation = runtime.db.prepare("SELECT * FROM captain_operations WHERE id = ?").get("operation-1");
    assert.equal(operation.status, "blocked");
    assert.equal(operation.execution_error_code, "github_merge_unavailable");
    assert.equal(operation.execution_error_detail.includes("raw-token"), false);
    assert.deepEqual(
      listCaptainOperationEvents(runtime.db, "operation-1").map((event) => event.eventType),
      ["approved", "requested", "executing", "blocked"]
    );
  } finally {
    await runtime.close();
  }
});

test("Concurrent executor requests atomically permit at most one merge request", async () => {
  let releaseMerge;
  let mergeStarted;
  const mergeStartedPromise = new Promise((resolve) => { mergeStarted = resolve; });
  const mergeReleasePromise = new Promise((resolve) => { releaseMerge = resolve; });
  const github = createExecutionGithubFetch({
    onMerge: async () => {
      mergeStarted();
      await mergeReleasePromise;
    }
  });
  const runtime = await startServer({ fetchImpl: github.fetchImpl });
  try {
    const cookie = await login(runtime);
    const firstPromise = executeOperation(runtime, cookie);
    await mergeStartedPromise;
    const concurrent = await executeOperation(runtime, cookie);
    assert.equal(concurrent.status, 409);
    assert.equal((await concurrent.json()).code, "operation_already_executing");
    assert.equal(github.putCalls, 1);

    releaseMerge();
    const first = await firstPromise;
    assert.equal(first.status, 200);
    assert.equal(github.putCalls, 1);

    const retry = await executeOperation(runtime, cookie);
    assert.equal(retry.status, 200);
    const retryBody = await retry.json();
    assert.equal(retryBody.executed, false);
    assert.equal(retryBody.idempotent, true);
    assert.equal(github.putCalls, 1);
  } finally {
    releaseMerge?.();
    await runtime.close();
  }
});

test("Workbench executor recovers an exact already-merged stale claim without a second mutation", async () => {
  const github = createExecutionGithubFetch({ alreadyMerged: true });
  const runtime = await startServer({
    fetchImpl: github.fetchImpl,
    executionClaimStaleAfterMs: 1
  });
  try {
    claimCaptainOperationExecution(runtime.db, runtime.operation.id, {
      claimId: "crashed-claim",
      now: "2026-07-16T10:01:00.000Z"
    });
    const cookie = await login(runtime);
    const response = await executeOperation(runtime, cookie);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.executed, false);
    assert.equal(body.recovered, true);
    assert.equal(body.operation.status, "applied");
    assert.equal(github.putCalls, 0);
  } finally {
    await runtime.close();
  }
});
