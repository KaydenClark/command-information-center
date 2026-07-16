import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "../server/app.js";
import { sha256 } from "../server/config.js";

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
    pullRequest: {
      ...defaultPullRequest,
      ...pullRequestOverride,
      head: { ...defaultPullRequest.head, ...(pullRequestOverride.head || {}) },
      base: { ...defaultPullRequest.base, ...(pullRequestOverride.base || {}) }
    },
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

async function getAuthenticatedCandidate(runtime, passcode = "secret") {
  const login = await fetch(`${runtime.baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode })
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie").split(";", 1)[0];
  return fetch(`${runtime.baseUrl}/api/captain/workbench-release`, {
    headers: { Cookie: cookie }
  });
}

async function startServer({ passcodeHash = "", fetchImpl } = {}) {
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
    fetchImpl
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  return {
    server,
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
