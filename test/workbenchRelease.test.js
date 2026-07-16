import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "../server/app.js";
import { sha256 } from "../server/config.js";
import { createCaptainApprovalOperation } from "../server/db.js";
import { readWorkbenchRelease } from "../server/workbenchRelease.js";

const MAIN_SHA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const INTEGRATION_SHA = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function createReadyGithubFetch(overrides = {}) {
  const defaultPullRequest = {
    number: 42,
    html_url: "https://github.com/KaydenClark/LLM_Workbench/pull/42",
    state: "open",
    draft: false,
    mergeable: true,
    head: {
      ref: "integration",
      sha: INTEGRATION_SHA,
      repo: { full_name: "KaydenClark/LLM_Workbench" }
    },
    base: {
      ref: "main",
      sha: MAIN_SHA,
      repo: { full_name: "KaydenClark/LLM_Workbench" }
    }
  };
  const pullRequestOverride = overrides.pullRequest || {};
  const fixture = {
    mainSha: MAIN_SHA,
    integrationSha: INTEGRATION_SHA,
    pullRequests: [{ number: 42 }],
    compare: { status: "ahead", ahead_by: 5, behind_by: 0 },
    statuses: {
      sha: INTEGRATION_SHA,
      statuses: [{
        id: 991,
        context: "gptos/workbench-release-gate",
        state: "success",
        target_url: "https://github.com/KaydenClark/LLM_Workbench/actions/runs/991",
        description: "Auditor passed the exact integration SHA."
      }]
    },
    ...overrides,
    pullRequest: {
      ...defaultPullRequest,
      ...pullRequestOverride,
      head: { ...defaultPullRequest.head, ...(pullRequestOverride.head || {}) },
      base: { ...defaultPullRequest.base, ...(pullRequestOverride.base || {}) }
    }
  };

  return async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/git/ref/heads/main")) {
      return jsonResponse({ object: { sha: fixture.mainSha } });
    }
    if (url.pathname.endsWith("/git/ref/heads/integration")) {
      return jsonResponse({ object: { sha: fixture.integrationSha } });
    }
    if (url.pathname.endsWith("/pulls") && url.searchParams.get("state") === "open") {
      return jsonResponse(fixture.pullRequests);
    }
    if (url.pathname.endsWith("/pulls/42")) {
      return jsonResponse(fixture.pullRequest);
    }
    if (url.pathname.endsWith("/compare/main...integration")) {
      return jsonResponse(fixture.compare);
    }
    if (url.pathname.endsWith(`/commits/${fixture.integrationSha}/status`)) {
      return jsonResponse(fixture.statuses);
    }
    return jsonResponse({ message: `Unexpected test URL: ${url}` }, 404);
  };
}

async function login(runtime, passcode = "secret") {
  const login = await fetch(`${runtime.baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode })
  });
  assert.equal(login.status, 200);
  return login.headers.get("set-cookie").split(";", 1)[0];
}

async function getAuthenticatedCandidate(runtime, passcode = "secret") {
  const cookie = await login(runtime, passcode);
  return fetch(`${runtime.baseUrl}/api/captain/workbench-release`, {
    headers: { Cookie: cookie }
  });
}

async function approveCandidate(runtime, cookie, body) {
  return fetch(`${runtime.baseUrl}/api/captain/workbench-release/approval`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body)
  });
}

async function startServer({ passcodeHash = "", fetchImpl, ...overrides } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-workbench-release-"));
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash,
    spotifyAccessToken: "",
    spotifyRefreshToken: "",
    spotifyClientId: "",
    spotifyClientSecret: "",
    gmailRefreshCommand: "",
    fetchImpl,
    ...overrides
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  return {
    server,
    db: app.locals.db,
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
}

test("Workbench release candidate fails closed before GitHub when passcode protection is not configured", async () => {
  let githubCalls = 0;
  const runtime = await startServer({
    fetchImpl: async () => {
      githubCalls += 1;
      throw new Error("GitHub must not be called");
    }
  });

  try {
    const response = await fetch(`${runtime.baseUrl}/api/captain/workbench-release`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      contractVersion: 1,
      readOnly: true,
      candidate: {
        repository: "KaydenClark/LLM_Workbench",
        sourceBranch: "integration",
        destinationBranch: "main",
        status: "blocked",
        reason: {
          code: "passcode_not_configured",
          detail: "Configure CIC passcode protection before reading release candidates."
        },
        mainSha: null,
        integrationSha: null,
        pullRequest: null,
        releaseGate: null,
        fingerprint: null
      },
      latestOperation: null
    });
    assert.equal(githubCalls, 0);
  } finally {
    await runtime.close();
  }
});

test("Workbench release read hides durable operation history when passcode protection is unavailable", async () => {
  const runtime = await startServer();
  try {
    createCaptainApprovalOperation(runtime.db, {
      repository: "KaydenClark/LLM_Workbench",
      sourceBranch: "integration",
      destinationBranch: "main",
      status: "ready",
      mainSha: MAIN_SHA,
      integrationSha: INTEGRATION_SHA,
      pullRequest: {
        number: 42,
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
        auditorSummary: "Auditor passed."
      },
      fingerprint: "cb7424103ffe6f2217f89cd3a63003a061f31c8330226cb99771bc2a800092bc"
    });

    const response = await fetch(`${runtime.baseUrl}/api/captain/workbench-release`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).latestOperation, null);
  } finally {
    await runtime.close();
  }
});

test("Workbench release candidate fails closed before GitHub when passcode hash configuration is malformed", async () => {
  let githubCalls = 0;
  const result = await readWorkbenchRelease({
    passcodeHash: "not-a-sha256-hash",
    fetchImpl: async () => {
      githubCalls += 1;
      throw new Error("GitHub must not be called");
    }
  });

  assert.equal(result.candidate.status, "blocked");
  assert.equal(result.candidate.reason.code, "passcode_configuration_invalid");
  assert.equal(githubCalls, 0);
});

test("Workbench release approval revalidates and records one fixed approved operation without executing", async () => {
  const runtime = await startServer({
    passcodeHash: sha256("secret"),
    fetchImpl: createReadyGithubFetch()
  });

  try {
    const cookie = await login(runtime);
    const candidateResponse = await fetch(`${runtime.baseUrl}/api/captain/workbench-release`, {
      headers: { Cookie: cookie }
    });
    const fingerprint = (await candidateResponse.json()).candidate.fingerprint;
    const approval = await approveCandidate(runtime, cookie, { fingerprint, passcode: "secret" });
    assert.equal(approval.status, 201);
    const body = await approval.json();
    assert.equal(body.ok, true);
    assert.equal(body.executed, false);
    assert.equal(body.operation.status, "approved");
    assert.equal(body.operation.repository, "KaydenClark/LLM_Workbench");
    assert.equal(body.operation.sourceBranch, "integration");
    assert.equal(body.operation.destinationBranch, "main");
    assert.equal(body.operation.candidateFingerprint, fingerprint);
    assert.equal("command" in body.operation, false);

    assert.equal(runtime.db.prepare("SELECT COUNT(*) AS count FROM captain_operations").get().count, 1);
    assert.equal(runtime.db.prepare("SELECT COUNT(*) AS count FROM captain_operation_events").get().count, 1);

    const refreshed = await fetch(`${runtime.baseUrl}/api/captain/workbench-release`, {
      headers: { Cookie: cookie }
    });
    const refreshedBody = await refreshed.json();
    assert.equal(refreshedBody.latestOperation.id, body.operation.id);
    assert.equal(refreshedBody.latestOperation.status, "approved");
  } finally {
    await runtime.close();
  }
});

test("Workbench release approval requires an authenticated session before step-up or GitHub reads", async () => {
  let githubCalls = 0;
  const runtime = await startServer({
    passcodeHash: sha256("secret"),
    fetchImpl: async (...args) => {
      githubCalls += 1;
      return createReadyGithubFetch()(...args);
    }
  });

  try {
    const response = await approveCandidate(runtime, "", {
      fingerprint: "c".repeat(64),
      passcode: "secret"
    });
    assert.equal(response.status, 401);
    assert.equal(githubCalls, 0);
    assert.equal(runtime.db.prepare("SELECT COUNT(*) AS count FROM captain_operations").get().count, 0);
  } finally {
    await runtime.close();
  }
});

test("Workbench release approval throttles repeated failed step-up passcodes before GitHub reads", async () => {
  let githubCalls = 0;
  const runtime = await startServer({
    passcodeHash: sha256("secret"),
    approvalMaxFailures: 2,
    approvalThrottleWindowMs: 60_000,
    fetchImpl: async (...args) => {
      githubCalls += 1;
      return createReadyGithubFetch()(...args);
    }
  });

  try {
    const cookie = await login(runtime);
    for (let index = 0; index < 2; index += 1) {
      const failed = await approveCandidate(runtime, cookie, {
        fingerprint: "c".repeat(64),
        passcode: "wrong"
      });
      assert.equal(failed.status, 401);
      assert.equal((await failed.json()).code, "step_up_invalid");
    }
    const throttled = await approveCandidate(runtime, cookie, {
      fingerprint: "c".repeat(64),
      passcode: "secret"
    });
    assert.equal(throttled.status, 429);
    assert.equal((await throttled.json()).code, "step_up_throttled");
    assert.ok(Number(throttled.headers.get("retry-after")) >= 1);
    assert.equal(githubCalls, 0);
    assert.equal(runtime.db.prepare("SELECT COUNT(*) AS count FROM captain_operations").get().count, 0);
  } finally {
    await runtime.close();
  }
});

test("Workbench release approval rejects unknown control fields and malformed fingerprints before GitHub", async () => {
  let githubCalls = 0;
  const runtime = await startServer({
    passcodeHash: sha256("secret"),
    fetchImpl: async (...args) => {
      githubCalls += 1;
      return createReadyGithubFetch()(...args);
    }
  });

  try {
    const cookie = await login(runtime);
    const generic = await approveCandidate(runtime, cookie, {
      fingerprint: "c".repeat(64),
      passcode: "secret",
      repository: "KaydenClark/another-repo",
      command: "merge"
    });
    assert.equal(generic.status, 400);
    assert.equal((await generic.json()).code, "approval_request_invalid");

    const malformed = await approveCandidate(runtime, cookie, {
      fingerprint: "not-a-fingerprint",
      passcode: "secret"
    });
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).code, "approval_request_invalid");
    assert.equal(githubCalls, 0);
  } finally {
    await runtime.close();
  }
});

test("Workbench release approval fails closed when the re-fetched candidate is blocked or stale", async () => {
  const blockedRuntime = await startServer({
    passcodeHash: sha256("secret"),
    fetchImpl: createReadyGithubFetch({ pullRequests: [] })
  });
  const staleRuntime = await startServer({
    passcodeHash: sha256("secret"),
    fetchImpl: createReadyGithubFetch()
  });

  try {
    const blockedCookie = await login(blockedRuntime);
    const blocked = await approveCandidate(blockedRuntime, blockedCookie, {
      fingerprint: "c".repeat(64),
      passcode: "secret"
    });
    assert.equal(blocked.status, 409);
    assert.equal((await blocked.json()).code, "candidate_not_ready");

    const staleCookie = await login(staleRuntime);
    const stale = await approveCandidate(staleRuntime, staleCookie, {
      fingerprint: "d".repeat(64),
      passcode: "secret"
    });
    assert.equal(stale.status, 409);
    assert.equal((await stale.json()).code, "candidate_stale");
    assert.equal(blockedRuntime.db.prepare("SELECT COUNT(*) AS count FROM captain_operations").get().count, 0);
    assert.equal(staleRuntime.db.prepare("SELECT COUNT(*) AS count FROM captain_operations").get().count, 0);
  } finally {
    await blockedRuntime.close();
    await staleRuntime.close();
  }
});

test("Workbench release approval rejects replay after revalidation and keeps one durable event", async () => {
  const runtime = await startServer({
    passcodeHash: sha256("secret"),
    fetchImpl: createReadyGithubFetch()
  });

  try {
    const cookie = await login(runtime);
    const candidate = await fetch(`${runtime.baseUrl}/api/captain/workbench-release`, {
      headers: { Cookie: cookie }
    });
    const fingerprint = (await candidate.json()).candidate.fingerprint;
    const first = await approveCandidate(runtime, cookie, { fingerprint, passcode: "secret" });
    assert.equal(first.status, 201);
    const replay = await approveCandidate(runtime, cookie, { fingerprint, passcode: "secret" });
    assert.equal(replay.status, 409);
    assert.equal((await replay.json()).code, "candidate_already_approved");
    assert.equal(runtime.db.prepare("SELECT COUNT(*) AS count FROM captain_operations").get().count, 1);
    assert.equal(runtime.db.prepare("SELECT COUNT(*) AS count FROM captain_operation_events").get().count, 1);
  } finally {
    await runtime.close();
  }
});

test("a rejected same-candidate operation requires a fresh approval passcode and preserves prior evidence", async () => {
  const runtime = await startServer({
    passcodeHash: sha256("secret"),
    fetchImpl: createReadyGithubFetch()
  });

  try {
    const cookie = await login(runtime);
    const release = await fetch(`${runtime.baseUrl}/api/captain/workbench-release`, {
      headers: { Cookie: cookie }
    });
    const fingerprint = (await release.json()).candidate.fingerprint;
    const first = await approveCandidate(runtime, cookie, { fingerprint, passcode: "secret" });
    const firstOperation = (await first.json()).operation;
    runtime.db.prepare(`
      UPDATE captain_operations
      SET status = 'rejected', execution_error_code = 'captain_approval_expired',
          execution_error_detail = 'Approval expired.'
      WHERE id = ?
    `).run(firstOperation.id);

    const wrong = await approveCandidate(runtime, cookie, { fingerprint, passcode: "wrong" });
    assert.equal(wrong.status, 401);
    const renewed = await approveCandidate(runtime, cookie, { fingerprint, passcode: "secret" });
    assert.equal(renewed.status, 201);
    const renewedOperation = (await renewed.json()).operation;
    assert.equal(renewedOperation.id, firstOperation.id);
    assert.equal(renewedOperation.status, "approved");
    assert.equal(runtime.db.prepare(
      "SELECT COUNT(*) AS count FROM captain_operation_events WHERE operation_id = ? AND event_type = 'approved'"
    ).get(firstOperation.id).count, 2);
  } finally {
    await runtime.close();
  }
});

test("Workbench release candidate binds one mergeable PR and successful Auditor evidence to exact branch SHAs", async () => {
  const runtime = await startServer({
    passcodeHash: sha256("secret"),
    fetchImpl: createReadyGithubFetch()
  });

  try {
    const response = await getAuthenticatedCandidate(runtime);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      contractVersion: 1,
      readOnly: true,
      candidate: {
        repository: "KaydenClark/LLM_Workbench",
        sourceBranch: "integration",
        destinationBranch: "main",
        status: "ready",
        reason: null,
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
        fingerprint: "cb7424103ffe6f2217f89cd3a63003a061f31c8330226cb99771bc2a800092bc"
      },
      latestOperation: null
    });
  } finally {
    await runtime.close();
  }
});

for (const scenario of [
  {
    name: "missing promotion PR",
    overrides: { pullRequests: [] },
    code: "promotion_pr_missing_or_ambiguous"
  },
  {
    name: "promotion PR moved to another head SHA",
    overrides: { pullRequest: { head: { sha: "cccccccccccccccccccccccccccccccccccccccc" } } },
    code: "promotion_pr_moved"
  },
  {
    name: "closed promotion PR returned by a stale list read",
    overrides: { pullRequest: { state: "closed" } },
    code: "promotion_pr_not_open"
  },
  {
    name: "draft promotion PR",
    overrides: { pullRequest: { draft: true } },
    code: "promotion_pr_draft"
  },
  {
    name: "main and integration divergence",
    overrides: { compare: { status: "diverged", ahead_by: 5, behind_by: 1 } },
    code: "branches_diverged"
  },
  {
    name: "unmergeable promotion PR",
    overrides: { pullRequest: { mergeable: false } },
    code: "promotion_pr_not_mergeable"
  },
  {
    name: "missing exact-SHA Auditor release gate",
    overrides: { statuses: { sha: INTEGRATION_SHA, statuses: [] } },
    code: "release_gate_missing"
  },
  {
    name: "Auditor release gate attached to another SHA",
    overrides: {
      statuses: {
        sha: "cccccccccccccccccccccccccccccccccccccccc",
        statuses: [{
          id: 994,
          context: "gptos/workbench-release-gate",
          state: "success",
          target_url: "https://github.com/KaydenClark/LLM_Workbench/actions/runs/994",
          description: "Auditor status belongs to another SHA."
        }]
      }
    },
    code: "release_gate_sha_mismatch"
  },
  {
    name: "failed exact-SHA Auditor release gate",
    overrides: {
      statuses: {
        sha: INTEGRATION_SHA,
        statuses: [{
          id: 992,
          context: "gptos/workbench-release-gate",
          state: "failure",
          target_url: "https://github.com/KaydenClark/LLM_Workbench/actions/runs/992",
          description: "Auditor found a failed release check."
        }]
      }
    },
    code: "release_gate_failed"
  },
  {
    name: "successful gate without evidence URL",
    overrides: {
      statuses: {
        sha: INTEGRATION_SHA,
        statuses: [{
          id: 993,
          context: "gptos/workbench-release-gate",
          state: "success",
          target_url: "",
          description: "Auditor passed but supplied no evidence link."
        }]
      }
    },
    code: "release_gate_evidence_incomplete"
  },
  {
    name: "successful gate with a non-HTTPS evidence URL",
    overrides: {
      statuses: {
        sha: INTEGRATION_SHA,
        statuses: [{
          id: 995,
          context: "gptos/workbench-release-gate",
          state: "success",
          target_url: "javascript:alert(1)",
          description: "Auditor passed with an unsafe evidence link."
        }]
      }
    },
    code: "release_gate_evidence_incomplete"
  }
]) {
  test(`Workbench release candidate blocks ${scenario.name}`, async () => {
    const runtime = await startServer({
      passcodeHash: sha256("secret"),
      fetchImpl: createReadyGithubFetch(scenario.overrides)
    });

    try {
      const response = await getAuthenticatedCandidate(runtime);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.readOnly, true);
      assert.equal(body.candidate.status, "blocked");
      assert.equal(body.candidate.reason.code, scenario.code);
      assert.equal(body.candidate.fingerprint, null);
      assert.equal(body.latestOperation, null);
    } finally {
      await runtime.close();
    }
  });
}

test("Workbench release candidate aborts unresolved direct GitHub reads on timeout", async () => {
  const signals = [];
  const result = await readWorkbenchRelease({
    passcodeHash: sha256("secret"),
    fetchImpl: (_input, { signal }) => {
      signals.push(signal);
      return new Promise(() => {});
    },
    githubRequestTimeoutMs: 10
  });

  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.equal(result.candidate.status, "blocked");
  assert.equal(result.candidate.reason.code, "github_timeout");
  assert.equal(result.latestOperation, null);
  assert.equal(signals.length, 3);
  assert.ok(signals.every((signal) => signal.aborted), "Every direct GitHub read must receive an aborted signal.");
});

test("Workbench release candidate aborts unresolved detailed GitHub reads on timeout", async () => {
  const signals = [];
  const fetchImpl = async (input, { signal }) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/git/ref/heads/main")) {
      return jsonResponse({ object: { sha: MAIN_SHA } });
    }
    if (url.pathname.endsWith("/git/ref/heads/integration")) {
      return jsonResponse({ object: { sha: INTEGRATION_SHA } });
    }
    if (url.pathname.endsWith("/pulls") && url.searchParams.get("state") === "open") {
      return jsonResponse([{ number: 42 }]);
    }
    signals.push(signal);
    return new Promise(() => {});
  };

  const result = await readWorkbenchRelease({
    passcodeHash: sha256("secret"),
    fetchImpl,
    githubRequestTimeoutMs: 10
  });

  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.equal(result.candidate.status, "blocked");
  assert.equal(result.candidate.reason.code, "github_timeout");
  assert.equal(result.latestOperation, null);
  assert.equal(signals.length, 3);
  assert.ok(signals.every((signal) => signal.aborted), "Every detailed GitHub read must receive an aborted signal.");
});
