import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "../server/app.js";
import { sha256 } from "../server/config.js";
import { createCaptainApprovalOperation, getLatestCaptainOperation, openDb } from "../server/db.js";
import {
  CAPTAIN_RESULT_FAILURE_CODES,
  dispatchCaptainWorkbenchRelease,
  reconcileCaptainWorkbenchRelease
} from "../server/captainHandoff.js";

const MAIN_SHA = "a".repeat(40);
const INTEGRATION_SHA = "b".repeat(40);
const MERGE_SHA = "c".repeat(40);
const OPERATION_ID = "operation-1";
const MANIFEST = {
  schemaVersion: "1.0",
  repository: "KaydenClark/LLM_Workbench",
  sourceBranch: "integration",
  destinationBranch: "main",
  mainSha: MAIN_SHA,
  integrationSha: INTEGRATION_SHA,
  pullRequestNumber: 42,
  releaseGateContext: "gptos/workbench-release-gate",
  releaseGateStatusId: 991,
  evidenceUrl: "https://github.com/KaydenClark/LLM_Workbench/pull/33#issuecomment-4992316390",
  auditorSummary: "PASS: exact integration candidate is ready.",
  fingerprint: "cb7424103ffe6f2217f89cd3a63003a061f31c8330226cb99771bc2a800092bc"
};

test("Captain result failure-code contract is explicit and closed", () => {
  assert.deepEqual(CAPTAIN_RESULT_FAILURE_CODES, [
    "ancestry_mismatch",
    "candidate_mismatch",
    "claim_conflict",
    "github_response_invalid",
    "github_unavailable",
    "internal_error",
    "invalid_request",
    "manifest_invalid",
    "merge_failed",
    "post_merge_mismatch",
    "pull_request_mismatch",
    "ref_mismatch",
    "release_gate_mismatch",
    "remote_mismatch",
    "result_conflict",
    "spool_conflict",
    "spool_invalid"
  ]);
});

test("CIC exposes no GitHub merge client or release-token configuration", () => {
  const configSource = fs.readFileSync(path.resolve("server/config.js"), "utf8");
  const appSource = fs.readFileSync(path.resolve("server/app.js"), "utf8");
  const githubReadSource = fs.readFileSync(path.resolve("server/workbenchRelease.js"), "utf8");
  const handoffSource = fs.readFileSync(path.resolve("server/captainHandoff.js"), "utf8");
  const envExample = fs.readFileSync(path.resolve(".env.example"), "utf8");

  assert.equal(fs.existsSync(path.resolve("server/workbenchExecutor.js")), false);
  for (const source of [configSource, appSource, envExample]) {
    assert.doesNotMatch(source, /WORKBENCH_GITHUB_TOKEN|workbenchGithubToken/);
  }
  for (const source of [githubReadSource, handoffSource]) {
    assert.doesNotMatch(source, /\/pulls\/[^`"']*\/merge|merge_method|method:\s*["']PUT["']/);
  }
  assert.doesNotMatch(githubReadSource, /Authorization|Bearer|\btoken\b/i);
});

function candidate(overrides = {}) {
  return {
    repository: MANIFEST.repository,
    sourceBranch: MANIFEST.sourceBranch,
    destinationBranch: MANIFEST.destinationBranch,
    status: "ready",
    mainSha: MAIN_SHA,
    integrationSha: INTEGRATION_SHA,
    pullRequest: {
      number: MANIFEST.pullRequestNumber,
      headSha: INTEGRATION_SHA,
      baseSha: MAIN_SHA,
      mergeable: true
    },
    releaseGate: {
      id: MANIFEST.releaseGateStatusId,
      context: MANIFEST.releaseGateContext,
      state: "success",
      sha: INTEGRATION_SHA,
      evidenceUrl: MANIFEST.evidenceUrl,
      auditorSummary: MANIFEST.auditorSummary
    },
    fingerprint: MANIFEST.fingerprint,
    ...overrides
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function githubReads({ merged = false, integrationSha = INTEGRATION_SHA, mergeSha = MERGE_SHA } = {}) {
  const requests = [];
  const fetchImpl = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = init.method || "GET";
    requests.push({ url: url.toString(), method, headers: init.headers, body: init.body });
    if (method !== "GET") return jsonResponse({ error: "mutation forbidden" }, 405);
    if (url.pathname.endsWith("/git/ref/heads/main")) {
      return jsonResponse({ object: { sha: merged ? mergeSha : MAIN_SHA } });
    }
    if (url.pathname.endsWith("/git/ref/heads/integration")) {
      return jsonResponse({ object: { sha: integrationSha } });
    }
    if (url.pathname.endsWith("/pulls") && url.searchParams.get("state") === "open") {
      return jsonResponse(merged ? [] : [{ number: 42 }]);
    }
    if (url.pathname.endsWith("/pulls/42")) {
      return jsonResponse({
        number: 42,
        html_url: "https://github.com/KaydenClark/LLM_Workbench/pull/42",
        state: merged ? "closed" : "open",
        draft: false,
        mergeable: merged ? null : true,
        merged,
        merge_commit_sha: merged ? mergeSha : null,
        head: {
          ref: "integration",
          sha: integrationSha,
          repo: { full_name: MANIFEST.repository }
        },
        base: {
          ref: "main",
          sha: MAIN_SHA,
          repo: { full_name: MANIFEST.repository }
        }
      });
    }
    if (url.pathname.endsWith("/compare/main...integration")) {
      return jsonResponse({ status: "ahead", ahead_by: 5, behind_by: 0 });
    }
    if (url.pathname.endsWith(`/commits/${integrationSha}/status`)) {
      return jsonResponse({
        sha: integrationSha,
        statuses: [{
          id: MANIFEST.releaseGateStatusId,
          context: MANIFEST.releaseGateContext,
          state: "success",
          target_url: MANIFEST.evidenceUrl,
          description: MANIFEST.auditorSummary
        }]
      });
    }
    return jsonResponse({ error: `unexpected ${url.pathname}` }, 404);
  };
  return { fetchImpl, requests };
}

function createRuntime() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cic-captain-handoff-"));
  const manifestPath = path.join(root, "manifest.json");
  const spoolRoot = path.join(root, "spool");
  const workerPath = path.join(root, "captain-worker.mjs");
  fs.writeFileSync(manifestPath, `${JSON.stringify(MANIFEST, null, 2)}\n`, { mode: 0o600 });
  fs.writeFileSync(workerPath, "// fake worker path\n", { mode: 0o700 });
  const db = openDb(path.join(root, "test.sqlite"));
  const operation = createCaptainApprovalOperation(db, candidate(), {
    operationId: OPERATION_ID,
    now: "2026-07-16T10:00:00.000Z"
  });
  return {
    root,
    manifestPath,
    spoolRoot,
    workerPath,
    db,
    operation,
    close() {
      db.close();
      fs.rmSync(root, { recursive: true, force: true });
    }
  };
}

function resultForRequest(requestPath, outcome) {
  const requestBytes = fs.readFileSync(requestPath);
  const request = JSON.parse(requestBytes);
  return {
    schemaVersion: "1.0",
    taskType: "workbench_release",
    operationId: request.operationId,
    executionClaimId: request.executionClaimId,
    requestSha256: crypto.createHash("sha256").update(requestBytes).digest("hex"),
    completedAt: "2026-07-16T10:02:00.000Z",
    outcome
  };
}

function writeAtomicResult(spoolRoot, requestPath, result) {
  const resultsDir = path.join(spoolRoot, "results");
  fs.mkdirSync(resultsDir, { recursive: true, mode: 0o700 });
  const resultPath = path.join(resultsDir, path.basename(requestPath));
  const temporary = `${resultPath}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(result)}\n`, { mode: 0o600, flag: "wx" });
  fs.renameSync(temporary, resultPath);
  return resultPath;
}

test("Captain handoff atomically writes one credential-free bound request and spawns only the fixed worker", async () => {
  const runtime = createRuntime();
  const github = githubReads();
  const calls = [];
  const originalSecrets = {
    GH_TOKEN: process.env.GH_TOKEN,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_PAT: process.env.GITHUB_PAT,
    GH_RELEASE_AUTH: process.env.GH_RELEASE_AUTH,
    GH_CUSTOM_TOKEN: process.env.GH_CUSTOM_TOKEN,
    GITHUB_MACHINE_PAT: process.env.GITHUB_MACHINE_PAT,
    WORKBENCH_GITHUB_TOKEN: process.env.WORKBENCH_GITHUB_TOKEN,
    GH_ENTERPRISE_TOKEN: process.env.GH_ENTERPRISE_TOKEN,
    GITHUB_ENTERPRISE_TOKEN: process.env.GITHUB_ENTERPRISE_TOKEN
  };
  Object.assign(process.env, {
    GH_TOKEN: "secret-gh",
    GITHUB_TOKEN: "secret-github",
    GITHUB_PAT: "secret-pat",
    GH_RELEASE_AUTH: "secret-auth",
    GH_CUSTOM_TOKEN: "secret-custom-token",
    GITHUB_MACHINE_PAT: "secret-machine-pat",
    WORKBENCH_GITHUB_TOKEN: "secret-workbench",
    GH_ENTERPRISE_TOKEN: "secret-enterprise",
    GITHUB_ENTERPRISE_TOKEN: "secret-github-enterprise"
  });
  try {
    const response = await dispatchCaptainWorkbenchRelease({
      db: runtime.db,
      operationId: OPERATION_ID,
      passcodeHash: "f".repeat(64),
      fetchImpl: github.fetchImpl,
      manifestPath: runtime.manifestPath,
      spoolRoot: runtime.spoolRoot,
      workerPath: runtime.workerPath,
      now: () => "2026-07-16T10:01:00.000Z",
      execFileImpl(file, args, options, callback) {
        calls.push({ file, args, options });
        queueMicrotask(() => callback(null, "", ""));
        return { pid: 1234 };
      }
    });

    assert.equal(response.httpStatus, 202);
    assert.equal(response.body.queued, true);
    assert.equal(response.body.executed, false);
    assert.equal(response.body.operation.status, "executing");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].file, process.execPath);
    assert.deepEqual(calls[0].args.slice(0, 2), [runtime.workerPath, "process"]);
    assert.equal(calls[0].options.shell, false);
    for (const key of Object.keys(originalSecrets)) assert.equal(key in calls[0].options.env, false);
    assert.equal(calls[0].options.env.HOME, process.env.HOME);
    assert.equal(calls[0].options.env.PATH, process.env.PATH);

    const requestPath = calls[0].args[2];
    assert.equal(path.dirname(requestPath), path.join(runtime.spoolRoot, "requests"));
    assert.equal(path.basename(requestPath), `${OPERATION_ID}.${response.body.operation.executionClaimId}.json`);
    assert.equal(fs.statSync(runtime.spoolRoot).mode & 0o777, 0o700);
    for (const directory of ["requests", "processing", "results", "quarantine"]) {
      assert.equal(fs.statSync(path.join(runtime.spoolRoot, directory)).mode & 0o777, 0o700);
    }
    assert.equal(fs.statSync(requestPath).mode & 0o777, 0o600);
    const requestText = fs.readFileSync(requestPath, "utf8");
    const request = JSON.parse(requestText);
    assert.deepEqual(Object.keys(request), [
      "schemaVersion", "taskType", "operationId", "executionClaimId",
      "approvedAt", "dispatchedAt", "candidate"
    ]);
    assert.deepEqual(request.candidate, MANIFEST);
    assert.equal(request.dispatchedAt, response.body.operation.executionStartedAt);
    for (const secret of Object.values(originalSecrets).filter(Boolean)) {
      assert.equal(requestText.includes(secret), false);
    }
    assert.equal(requestText.includes("passcode"), false);
    assert.ok(github.requests.every((entry) => entry.method === "GET"));
  } finally {
    for (const [key, value] of Object.entries(originalSecrets)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    runtime.close();
  }
});

test("Captain handoff rejects current candidate drift before writing or spawning", async () => {
  const runtime = createRuntime();
  const github = githubReads({ integrationSha: "d".repeat(40) });
  let spawns = 0;
  try {
    const response = await dispatchCaptainWorkbenchRelease({
      db: runtime.db,
      operationId: OPERATION_ID,
      passcodeHash: "f".repeat(64),
      fetchImpl: github.fetchImpl,
      manifestPath: runtime.manifestPath,
      spoolRoot: runtime.spoolRoot,
      workerPath: runtime.workerPath,
      execFileImpl() { spawns += 1; }
    });
    assert.equal(response.httpStatus, 409);
    assert.equal(response.body.code, "candidate_stale");
    assert.equal(spawns, 0);
    assert.deepEqual(fs.readdirSync(path.join(runtime.spoolRoot, "requests")), []);
    assert.equal(getLatestCaptainOperation(runtime.db, OPERATION_ID).status, "rejected");
  } finally {
    runtime.close();
  }
});

test("GET reconciliation imports an exact result only after independent GitHub verification", async () => {
  const runtime = createRuntime();
  const before = githubReads();
  let requestPath;
  try {
    await dispatchCaptainWorkbenchRelease({
      db: runtime.db,
      operationId: OPERATION_ID,
      passcodeHash: "f".repeat(64),
      fetchImpl: before.fetchImpl,
      manifestPath: runtime.manifestPath,
      spoolRoot: runtime.spoolRoot,
      workerPath: runtime.workerPath,
      now: () => "2026-07-16T10:01:00.000Z",
      execFileImpl(_file, args, _options, callback) {
        requestPath = args[2];
        queueMicrotask(() => callback(null, "", ""));
        return { pid: 1234 };
      }
    });
    const result = resultForRequest(requestPath, {
      status: "applied",
      mergeSha: MERGE_SHA,
      evidenceUrl: `https://github.com/KaydenClark/LLM_Workbench/commit/${MERGE_SHA}`
    });
    writeAtomicResult(runtime.spoolRoot, requestPath, result);
    const after = githubReads({ merged: true });
    const reconciled = await reconcileCaptainWorkbenchRelease({
      db: runtime.db,
      fetchImpl: after.fetchImpl,
      manifestPath: runtime.manifestPath,
      spoolRoot: runtime.spoolRoot,
      now: () => "2026-07-16T10:02:01.000Z"
    });
    assert.equal(reconciled.status, "applied");
    assert.equal(reconciled.mergeSha, MERGE_SHA);
    assert.ok(after.requests.length >= 2);
    assert.ok(after.requests.every((entry) => entry.method === "GET"));
  } finally {
    runtime.close();
  }
});

test("first applied-result verification outage stays recoverable and the second GET succeeds", async () => {
  const runtime = createRuntime();
  const before = githubReads();
  let requestPath;
  try {
    await dispatchCaptainWorkbenchRelease({
      db: runtime.db,
      operationId: OPERATION_ID,
      passcodeHash: sha256("secret"),
      fetchImpl: before.fetchImpl,
      manifestPath: runtime.manifestPath,
      spoolRoot: runtime.spoolRoot,
      workerPath: runtime.workerPath,
      now: () => "2026-07-16T10:01:00.000Z",
      execFileImpl(_file, args, _options, callback) {
        requestPath = args[2];
        queueMicrotask(() => callback(null, "", ""));
        return { pid: 1234 };
      }
    });
    writeAtomicResult(runtime.spoolRoot, requestPath, resultForRequest(requestPath, {
      status: "applied",
      mergeSha: MERGE_SHA,
      evidenceUrl: `https://github.com/KaydenClark/LLM_Workbench/commit/${MERGE_SHA}`
    }));

    const merged = githubReads({ merged: true });
    let verificationFailures = 1;
    let recoveryReads = 0;
    const fetchImpl = async (input, init) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/git/ref/heads/main") && verificationFailures > 0) {
        verificationFailures -= 1;
        throw new Error("temporary independent verification outage");
      }
      if (url.pathname.endsWith("/git/ref/heads/main")) recoveryReads += 1;
      return merged.fetchImpl(input, init);
    };
    const app = createApp({
      db: runtime.db,
      dataFeedPath: path.resolve("data.example.js"),
      passcodeHash: sha256("secret"),
      fetchImpl,
      captainManifestPath: runtime.manifestPath,
      captainSpoolRoot: runtime.spoolRoot,
      captainResultTimeoutMs: 5 * 60_000,
      captainNow: () => "2026-07-16T10:02:00.000Z",
      captainStartupReconcile: false,
      spotifyAccessToken: "",
      spotifyRefreshToken: "",
      spotifyClientId: "",
      spotifyClientSecret: "",
      gmailRefreshCommand: ""
    });
    const server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    try {
      const login = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: "secret" })
      });
      const cookie = login.headers.get("set-cookie").split(";", 1)[0];
      const first = await fetch(`${baseUrl}/api/captain/workbench-release`, { headers: { Cookie: cookie } });
      assert.equal(first.status, 200);
      const firstBody = await first.json();
      assert.equal(firstBody.latestOperation.status, "executing");
      assert.equal(firstBody.latestOperation.verificationStatus, "verifying");
      assert.equal(fs.existsSync(path.join(runtime.spoolRoot, "results", path.basename(requestPath))), true);

      const second = await fetch(`${baseUrl}/api/captain/workbench-release`, { headers: { Cookie: cookie } });
      assert.equal(second.status, 200);
      const secondBody = await second.json();
      assert.equal(secondBody.latestOperation.status, "applied");
      assert.equal(secondBody.latestOperation.mergeSha, MERGE_SHA);
      assert.ok(recoveryReads > 0);
    } finally {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  } finally {
    runtime.close();
  }
});

test("startup reconciliation imports a bound applied result without waiting for a GET", async () => {
  const runtime = createRuntime();
  const before = githubReads();
  let requestPath;
  let recoveryReads = 0;
  try {
    await dispatchCaptainWorkbenchRelease({
      db: runtime.db,
      operationId: OPERATION_ID,
      passcodeHash: "f".repeat(64),
      fetchImpl: before.fetchImpl,
      manifestPath: runtime.manifestPath,
      spoolRoot: runtime.spoolRoot,
      workerPath: runtime.workerPath,
      now: () => "2026-07-16T10:01:00.000Z",
      execFileImpl(_file, args, _options, callback) {
        requestPath = args[2];
        queueMicrotask(() => callback(null, "", ""));
        return { pid: 1234 };
      }
    });
    writeAtomicResult(runtime.spoolRoot, requestPath, resultForRequest(requestPath, {
      status: "applied",
      mergeSha: MERGE_SHA,
      evidenceUrl: `https://github.com/KaydenClark/LLM_Workbench/commit/${MERGE_SHA}`
    }));
    const merged = githubReads({ merged: true });
    createApp({
      db: runtime.db,
      dataFeedPath: path.resolve("data.example.js"),
      passcodeHash: "f".repeat(64),
      fetchImpl: async (input, init) => {
        if (new URL(String(input)).pathname.endsWith("/git/ref/heads/main")) recoveryReads += 1;
        return merged.fetchImpl(input, init);
      },
      captainManifestPath: runtime.manifestPath,
      captainSpoolRoot: runtime.spoolRoot,
      captainNow: () => "2026-07-16T10:02:00.000Z",
      spotifyAccessToken: "",
      spotifyRefreshToken: "",
      spotifyClientId: "",
      spotifyClientSecret: "",
      gmailRefreshCommand: ""
    });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(getLatestCaptainOperation(runtime.db).status, "applied");
    assert.ok(recoveryReads > 0);
  } finally {
    runtime.close();
  }
});

test("applied-result verification mismatch and deadline expiry become terminal blocked outcomes", async () => {
  for (const scenario of ["mismatch", "expiry"]) {
    const runtime = createRuntime();
    const before = githubReads();
    let requestPath;
    try {
      await dispatchCaptainWorkbenchRelease({
        db: runtime.db,
        operationId: OPERATION_ID,
        passcodeHash: "f".repeat(64),
        fetchImpl: before.fetchImpl,
        manifestPath: runtime.manifestPath,
        spoolRoot: runtime.spoolRoot,
        workerPath: runtime.workerPath,
        now: () => "2026-07-16T10:01:00.000Z",
        execFileImpl(_file, args, _options, callback) {
          requestPath = args[2];
          queueMicrotask(() => callback(null, "", ""));
          return { pid: 1234 };
        }
      });
      writeAtomicResult(runtime.spoolRoot, requestPath, resultForRequest(requestPath, {
        status: "applied",
        mergeSha: MERGE_SHA,
        evidenceUrl: `https://github.com/KaydenClark/LLM_Workbench/commit/${MERGE_SHA}`
      }));
      const remote = scenario === "mismatch"
        ? githubReads({ merged: true, mergeSha: "d".repeat(40) }).fetchImpl
        : async () => { throw new Error("verification unavailable"); };
      const reconciled = await reconcileCaptainWorkbenchRelease({
        db: runtime.db,
        fetchImpl: remote,
        manifestPath: runtime.manifestPath,
        spoolRoot: runtime.spoolRoot,
        resultTimeoutMs: 60_000,
        now: () => scenario === "expiry"
          ? "2026-07-16T10:02:01.000Z"
          : "2026-07-16T10:01:30.000Z"
      });
      assert.equal(reconciled.status, "blocked", scenario);
      assert.equal(
        reconciled.executionErrorCode,
        scenario === "mismatch"
          ? "captain_result_verification_mismatch"
          : "captain_result_verification_timeout"
      );
      let spawnCount = 0;
      const retry = await dispatchCaptainWorkbenchRelease({
        db: runtime.db,
        operationId: OPERATION_ID,
        passcodeHash: "f".repeat(64),
        fetchImpl: githubReads().fetchImpl,
        manifestPath: runtime.manifestPath,
        spoolRoot: runtime.spoolRoot,
        workerPath: runtime.workerPath,
        now: () => "2026-07-16T10:03:00.000Z",
        execFileImpl() {
          spawnCount += 1;
          return { pid: 1234 };
        }
      });
      assert.equal(retry.httpStatus, 409, scenario);
      assert.equal(retry.body.code, "operation_not_executable", scenario);
      assert.equal(spawnCount, 0, scenario);
    } finally {
      runtime.close();
    }
  }
});

test("reconciliation quarantines a result with the wrong request digest and fails closed", async () => {
  const runtime = createRuntime();
  const before = githubReads();
  let requestPath;
  try {
    await dispatchCaptainWorkbenchRelease({
      db: runtime.db,
      operationId: OPERATION_ID,
      passcodeHash: "f".repeat(64),
      fetchImpl: before.fetchImpl,
      manifestPath: runtime.manifestPath,
      spoolRoot: runtime.spoolRoot,
      workerPath: runtime.workerPath,
      execFileImpl(_file, args, _options, callback) {
        requestPath = args[2];
        queueMicrotask(() => callback(null, "", ""));
        return { pid: 1234 };
      }
    });
    const result = resultForRequest(requestPath, {
      status: "blocked",
      code: "remote_mismatch",
      detail: "Remote evidence does not match the fixed target."
    });
    result.requestSha256 = "0".repeat(64);
    writeAtomicResult(runtime.spoolRoot, requestPath, result);
    const reconciled = await reconcileCaptainWorkbenchRelease({
      db: runtime.db,
      fetchImpl: before.fetchImpl,
      manifestPath: runtime.manifestPath,
      spoolRoot: runtime.spoolRoot
    });
    assert.equal(reconciled.status, "rejected");
    assert.equal(reconciled.executionErrorCode, "captain_result_invalid");
    assert.equal(fs.readdirSync(path.join(runtime.spoolRoot, "results")).length, 0);
    assert.equal(fs.readdirSync(path.join(runtime.spoolRoot, "quarantine")).length, 1);
  } finally {
    runtime.close();
  }
});

test("reconciliation rejects an unknown worker failure code instead of weakening the allowlist", async () => {
  const runtime = createRuntime();
  const github = githubReads();
  let requestPath;
  try {
    await dispatchCaptainWorkbenchRelease({
      db: runtime.db,
      operationId: OPERATION_ID,
      passcodeHash: "f".repeat(64),
      fetchImpl: github.fetchImpl,
      manifestPath: runtime.manifestPath,
      spoolRoot: runtime.spoolRoot,
      workerPath: runtime.workerPath,
      execFileImpl(_file, args, _options, callback) {
        requestPath = args[2];
        queueMicrotask(() => callback(null, "", ""));
        return { pid: 1234 };
      }
    });
    writeAtomicResult(runtime.spoolRoot, requestPath, resultForRequest(requestPath, {
      status: "blocked",
      code: "unexpected_worker_code",
      detail: "This code is not part of the shared contract."
    }));
    const reconciled = await reconcileCaptainWorkbenchRelease({
      db: runtime.db,
      fetchImpl: github.fetchImpl,
      manifestPath: runtime.manifestPath,
      spoolRoot: runtime.spoolRoot
    });
    assert.equal(reconciled.status, "rejected");
    assert.equal(reconciled.executionErrorCode, "captain_result_invalid");
    assert.equal(fs.readdirSync(path.join(runtime.spoolRoot, "quarantine")).length, 1);
  } finally {
    runtime.close();
  }
});

test("quarantining a symbolic-link result never changes its target", async () => {
  const runtime = createRuntime();
  const github = githubReads();
  let requestPath;
  try {
    await dispatchCaptainWorkbenchRelease({
      db: runtime.db,
      operationId: OPERATION_ID,
      passcodeHash: "f".repeat(64),
      fetchImpl: github.fetchImpl,
      manifestPath: runtime.manifestPath,
      spoolRoot: runtime.spoolRoot,
      workerPath: runtime.workerPath,
      execFileImpl(_file, args, _options, callback) {
        requestPath = args[2];
        queueMicrotask(() => callback(null, "", ""));
        return { pid: 1234 };
      }
    });
    const target = path.join(runtime.root, "external-target.txt");
    fs.writeFileSync(target, "must not be changed\n", { mode: 0o644 });
    const resultPath = path.join(runtime.spoolRoot, "results", path.basename(requestPath));
    fs.symlinkSync(target, resultPath);
    const reconciled = await reconcileCaptainWorkbenchRelease({
      db: runtime.db,
      fetchImpl: github.fetchImpl,
      manifestPath: runtime.manifestPath,
      spoolRoot: runtime.spoolRoot
    });
    assert.equal(reconciled.status, "rejected");
    assert.equal(fs.statSync(target).mode & 0o777, 0o644);
    assert.equal(fs.readFileSync(target, "utf8"), "must not be changed\n");
  } finally {
    runtime.close();
  }
});

test("spawn failure blocks safely and a fresh retry can recover with a newly bound result", async () => {
  const runtime = createRuntime();
  const before = githubReads();
  let firstRequest;
  try {
    const failed = await dispatchCaptainWorkbenchRelease({
      db: runtime.db,
      operationId: OPERATION_ID,
      passcodeHash: "f".repeat(64),
      fetchImpl: before.fetchImpl,
      manifestPath: runtime.manifestPath,
      spoolRoot: runtime.spoolRoot,
      workerPath: runtime.workerPath,
      execFileImpl(_file, args, _options, callback) {
        firstRequest = args[2];
        queueMicrotask(() => callback(Object.assign(new Error("raw private failure"), { code: "ENOENT" }), "", ""));
        return { pid: undefined };
      }
    });
    assert.equal(failed.httpStatus, 202);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(getLatestCaptainOperation(runtime.db, OPERATION_ID).status, "blocked");
    assert.equal(getLatestCaptainOperation(runtime.db, OPERATION_ID).executionErrorCode, "captain_worker_spawn_failed");

    let secondRequest;
    const retried = await dispatchCaptainWorkbenchRelease({
      db: runtime.db,
      operationId: OPERATION_ID,
      passcodeHash: "f".repeat(64),
      fetchImpl: before.fetchImpl,
      manifestPath: runtime.manifestPath,
      spoolRoot: runtime.spoolRoot,
      workerPath: runtime.workerPath,
      execFileImpl(_file, args, _options, callback) {
        secondRequest = args[2];
        queueMicrotask(() => callback(null, "", ""));
        return { pid: 1234 };
      }
    });
    assert.equal(retried.httpStatus, 202);
    assert.notEqual(secondRequest, firstRequest);
    writeAtomicResult(runtime.spoolRoot, secondRequest, resultForRequest(secondRequest, {
      status: "applied",
      mergeSha: MERGE_SHA,
      evidenceUrl: `https://github.com/KaydenClark/LLM_Workbench/commit/${MERGE_SHA}`
    }));
    const after = githubReads({ merged: true });
    const reconciled = await reconcileCaptainWorkbenchRelease({
      db: runtime.db,
      fetchImpl: after.fetchImpl,
      manifestPath: runtime.manifestPath,
      spoolRoot: runtime.spoolRoot
    });
    assert.equal(reconciled.status, "applied");
  } finally {
    runtime.close();
  }
});

test("an executing handoff without a result times out to a retryable blocked state", async () => {
  const runtime = createRuntime();
  const github = githubReads();
  try {
    await dispatchCaptainWorkbenchRelease({
      db: runtime.db,
      operationId: OPERATION_ID,
      passcodeHash: "f".repeat(64),
      fetchImpl: github.fetchImpl,
      manifestPath: runtime.manifestPath,
      spoolRoot: runtime.spoolRoot,
      workerPath: runtime.workerPath,
      now: () => "2026-07-16T10:01:00.000Z",
      execFileImpl(_file, _args, _options, _callback) { return { pid: 1234 }; }
    });
    const reconciled = await reconcileCaptainWorkbenchRelease({
      db: runtime.db,
      fetchImpl: github.fetchImpl,
      manifestPath: runtime.manifestPath,
      spoolRoot: runtime.spoolRoot,
      resultTimeoutMs: 60_000,
      now: () => "2026-07-16T10:02:01.000Z"
    });
    assert.equal(reconciled.status, "blocked");
    assert.equal(reconciled.executionErrorCode, "captain_result_timeout");
  } finally {
    runtime.close();
  }
});

test("execution route keeps the second fresh step-up and queues only the approved operation ID", async () => {
  const runtime = createRuntime();
  const github = githubReads();
  const spawned = [];
  const app = createApp({
    db: runtime.db,
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash: sha256("secret"),
    fetchImpl: github.fetchImpl,
    captainManifestPath: runtime.manifestPath,
    captainSpoolRoot: runtime.spoolRoot,
    captainWorkerPath: runtime.workerPath,
    captainExecFileImpl(file, args, options, callback) {
      spawned.push({ file, args, options });
      queueMicrotask(() => callback(null, "", ""));
      return { pid: 1234 };
    },
    spotifyAccessToken: "",
    spotifyRefreshToken: "",
    spotifyClientId: "",
    spotifyClientSecret: "",
    gmailRefreshCommand: ""
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: "secret" })
    });
    const cookie = login.headers.get("set-cookie").split(";", 1)[0];
    const wrong = await fetch(`${baseUrl}/api/captain/workbench-release/execution`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ operationId: OPERATION_ID, passcode: "first-approval-secret" })
    });
    assert.equal(wrong.status, 401);
    assert.equal(spawned.length, 0);

    const generic = await fetch(`${baseUrl}/api/captain/workbench-release/execution`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ operationId: OPERATION_ID, passcode: "secret", repository: MANIFEST.repository })
    });
    assert.equal(generic.status, 400);
    assert.equal(spawned.length, 0);

    const queued = await fetch(`${baseUrl}/api/captain/workbench-release/execution`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ operationId: OPERATION_ID, passcode: "secret" })
    });
    assert.equal(queued.status, 202);
    assert.equal((await queued.json()).queued, true);
    assert.equal(spawned.length, 1);
    const spoolText = fs.readFileSync(spawned[0].args[2], "utf8");
    assert.equal(spoolText.includes("secret"), false);
    assert.equal(spoolText.includes("passcode"), false);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    runtime.close();
  }
});
