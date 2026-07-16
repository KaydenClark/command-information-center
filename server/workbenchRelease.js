import crypto from "node:crypto";
import { isValidPasscodeHash } from "./workbenchApproval.js";

export const REPOSITORY = "KaydenClark/LLM_Workbench";
export const SOURCE_BRANCH = "integration";
export const DESTINATION_BRANCH = "main";
export const RELEASE_GATE_CONTEXT = "gptos/workbench-release-gate";
const GITHUB_API_ROOT = `https://api.github.com/repos/${REPOSITORY}`;
export const DEFAULT_GITHUB_REQUEST_TIMEOUT_MS = 10_000;

export class GithubRequestTimeoutError extends Error {
  constructor() {
    super("GitHub release-evidence read timed out.");
    this.name = "GithubRequestTimeoutError";
  }
}

function releasePayload(candidate) {
  return {
    contractVersion: 1,
    readOnly: true,
    candidate,
    latestOperation: null
  };
}

function blockedCandidate(code, detail, evidence = {}) {
  return releasePayload({
    repository: REPOSITORY,
    sourceBranch: SOURCE_BRANCH,
    destinationBranch: DESTINATION_BRANCH,
    status: "blocked",
    reason: { code, detail },
    mainSha: null,
    integrationSha: null,
    pullRequest: null,
    releaseGate: null,
    fingerprint: null,
    ...evidence
  });
}

export async function requestWorkbenchGithubJson({
  fetchImpl,
  path,
  timeoutMs = DEFAULT_GITHUB_REQUEST_TIMEOUT_MS
}) {
  const controller = new AbortController();
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new GithubRequestTimeoutError());
    }, timeoutMs);
  });

  try {
    const read = (async () => {
      const headers = {
          Accept: "application/vnd.github+json",
          "User-Agent": "GPT-OS-Command-Information-Center",
          "X-GitHub-Api-Version": "2022-11-28"
      };
      const response = await fetchImpl(`${GITHUB_API_ROOT}${path}`, {
        headers,
        signal: controller.signal
      });
      if (!response?.ok) {
        throw new Error(`GitHub request failed with ${response?.status || "no response"}.`);
      }
      return response.json();
    })();
    return await Promise.race([read, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

function requestGithubJson(fetchImpl, path, timeoutMs) {
  return requestWorkbenchGithubJson({ fetchImpl, path, timeoutMs });
}

function branchSha(ref) {
  const sha = ref?.object?.sha;
  return typeof sha === "string" && sha.length > 0 ? sha : null;
}

function pullRequestContract(pullRequest) {
  return {
    number: pullRequest.number,
    url: pullRequest.html_url,
    headSha: pullRequest.head.sha,
    baseSha: pullRequest.base.sha,
    mergeable: pullRequest.mergeable
  };
}

function releasedPullRequestContract(pullRequest) {
  return {
    ...pullRequestContract(pullRequest),
    merged: true,
    mergeSha: pullRequest.merge_commit_sha
  };
}

function exactReleasedPullRequest(pullRequest, mainSha, integrationSha) {
  const expectedRepository = REPOSITORY.toLowerCase();
  return pullRequest?.state === "closed"
    && pullRequest?.merged === true
    && pullRequest?.draft === false
    && pullRequest?.merge_commit_sha === mainSha
    && pullRequest?.head?.ref === SOURCE_BRANCH
    && pullRequest?.head?.sha === integrationSha
    && pullRequest?.head?.repo?.full_name?.toLowerCase() === expectedRepository
    && pullRequest?.base?.ref === DESTINATION_BRANCH
    && pullRequest?.base?.repo?.full_name?.toLowerCase() === expectedRepository;
}

function releaseGateContract(status, integrationSha) {
  return {
    id: status.id,
    context: status.context,
    state: status.state,
    sha: integrationSha,
    evidenceUrl: status.target_url,
    auditorSummary: status.description
  };
}

function fingerprint(mainSha, integrationSha, pullRequestNumber, releaseGateStatusId) {
  return crypto.createHash("sha256")
    .update(`${REPOSITORY} | ${mainSha} | ${integrationSha} | ${pullRequestNumber} | ${releaseGateStatusId}`)
    .digest("hex");
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function readWorkbenchRelease({
  passcodeHash,
  fetchImpl = globalThis.fetch,
  githubRequestTimeoutMs = DEFAULT_GITHUB_REQUEST_TIMEOUT_MS
}) {
  if (!passcodeHash) {
    return blockedCandidate(
      "passcode_not_configured",
      "Configure CIC passcode protection before reading release candidates."
    );
  }
  if (!isValidPasscodeHash(passcodeHash)) {
    return blockedCandidate(
      "passcode_configuration_invalid",
      "CIC passcode protection is not configured with a valid SHA-256 hash."
    );
  }

  try {
    const [mainRef, integrationRef, openPullRequests] = await Promise.all([
      requestGithubJson(fetchImpl, `/git/ref/heads/${DESTINATION_BRANCH}`, githubRequestTimeoutMs),
      requestGithubJson(fetchImpl, `/git/ref/heads/${SOURCE_BRANCH}`, githubRequestTimeoutMs),
      requestGithubJson(fetchImpl, `/pulls?state=open&base=${DESTINATION_BRANCH}&head=KaydenClark%3A${SOURCE_BRANCH}&per_page=2`, githubRequestTimeoutMs)
    ]);
    const mainSha = branchSha(mainRef);
    const integrationSha = branchSha(integrationRef);
    if (!mainSha || !integrationSha) {
      return blockedCandidate("branch_evidence_missing", "Current Workbench branch SHAs are unavailable.");
    }
    const branchEvidence = { mainSha, integrationSha };
    if (Array.isArray(openPullRequests) && openPullRequests.length === 0) {
      const comparison = await requestGithubJson(
        fetchImpl,
        `/compare/${DESTINATION_BRANCH}...${SOURCE_BRANCH}`,
        githubRequestTimeoutMs
      );
      const integrationIsReleased = comparison?.ahead_by === 0
        && (comparison?.status === "behind" || comparison?.status === "identical");
      if (integrationIsReleased) {
        return releasePayload({
          repository: REPOSITORY,
          sourceBranch: SOURCE_BRANCH,
          destinationBranch: DESTINATION_BRANCH,
          status: "released",
          reason: null,
          ...branchEvidence,
          pullRequest: null,
          releaseGate: null,
          fingerprint: null
        });
      }

      const closedPullRequests = await requestGithubJson(
        fetchImpl,
        `/pulls?state=closed&base=${DESTINATION_BRANCH}&head=KaydenClark%3A${SOURCE_BRANCH}&sort=updated&direction=desc&per_page=2`,
        githubRequestTimeoutMs
      );
      const detailed = Array.isArray(closedPullRequests)
        ? await Promise.all(closedPullRequests
          .map((pullRequest) => pullRequest?.number)
          .filter(Number.isInteger)
          .map((number) => requestGithubJson(fetchImpl, `/pulls/${number}`, githubRequestTimeoutMs)))
        : [];
      const exactMerges = detailed.filter((pullRequest) => exactReleasedPullRequest(pullRequest, mainSha, integrationSha));
      if (exactMerges.length === 1) {
        return releasePayload({
          repository: REPOSITORY,
          sourceBranch: SOURCE_BRANCH,
          destinationBranch: DESTINATION_BRANCH,
          status: "released",
          reason: null,
          ...branchEvidence,
          pullRequest: releasedPullRequestContract(exactMerges[0]),
          releaseGate: null,
          fingerprint: null
        });
      }
    }
    if (!Array.isArray(openPullRequests) || openPullRequests.length !== 1) {
      return blockedCandidate(
        "promotion_pr_missing_or_ambiguous",
        "Exactly one open Workbench integration-to-main pull request is required.",
        branchEvidence
      );
    }

    const pullRequestNumber = openPullRequests[0]?.number;
    if (!Number.isInteger(pullRequestNumber)) {
      return blockedCandidate("promotion_pr_invalid", "The Workbench promotion pull request has no stable number.", branchEvidence);
    }

    const [pullRequest, comparison, combinedStatus] = await Promise.all([
      requestGithubJson(fetchImpl, `/pulls/${pullRequestNumber}`, githubRequestTimeoutMs),
      requestGithubJson(fetchImpl, `/compare/${DESTINATION_BRANCH}...${SOURCE_BRANCH}`, githubRequestTimeoutMs),
      requestGithubJson(fetchImpl, `/commits/${integrationSha}/status`, githubRequestTimeoutMs)
    ]);
    const prContract = pullRequestContract(pullRequest);
    const pullRequestEvidence = { ...branchEvidence, pullRequest: prContract };
    const expectedRepository = REPOSITORY.toLowerCase();
    const moved = pullRequest.number !== pullRequestNumber
      || pullRequest.head?.ref !== SOURCE_BRANCH
      || pullRequest.base?.ref !== DESTINATION_BRANCH
      || pullRequest.head?.sha !== integrationSha
      || pullRequest.base?.sha !== mainSha
      || pullRequest.head?.repo?.full_name?.toLowerCase() !== expectedRepository
      || pullRequest.base?.repo?.full_name?.toLowerCase() !== expectedRepository;
    if (moved) {
      return blockedCandidate(
        "promotion_pr_moved",
        "The promotion pull request no longer matches the fixed repository, branches, or current SHAs.",
        pullRequestEvidence
      );
    }
    if (pullRequest.state !== "open") {
      return blockedCandidate(
        "promotion_pr_not_open",
        "The detailed promotion pull request is no longer open.",
        pullRequestEvidence
      );
    }
    if (pullRequest.draft !== false) {
      return blockedCandidate(
        "promotion_pr_draft",
        "The detailed promotion pull request is still a draft.",
        pullRequestEvidence
      );
    }
    if (comparison?.status !== "ahead" || comparison?.behind_by !== 0) {
      return blockedCandidate(
        "branches_diverged",
        "Workbench main is not an ancestor of integration.",
        pullRequestEvidence
      );
    }
    if (comparison?.ahead_by < 1) {
      return blockedCandidate("no_release_changes", "Workbench integration has no changes to release.", pullRequestEvidence);
    }
    if (pullRequest.mergeable !== true) {
      return blockedCandidate(
        "promotion_pr_not_mergeable",
        "GitHub does not currently report the exact promotion pull request as mergeable.",
        pullRequestEvidence
      );
    }

    if (combinedStatus?.sha !== integrationSha) {
      return blockedCandidate(
        "release_gate_sha_mismatch",
        "GitHub returned release-gate evidence for a different commit SHA.",
        pullRequestEvidence
      );
    }
    const releaseGateStatus = combinedStatus?.statuses?.find((status) => status?.context === RELEASE_GATE_CONTEXT);
    if (!releaseGateStatus) {
      return blockedCandidate(
        "release_gate_missing",
        "The exact integration SHA has no Workbench release-gate Auditor status.",
        pullRequestEvidence
      );
    }
    const gateContract = releaseGateContract(releaseGateStatus, integrationSha);
    const gateEvidence = { ...pullRequestEvidence, releaseGate: gateContract };
    if (releaseGateStatus.state !== "success") {
      return blockedCandidate("release_gate_failed", "The exact integration SHA has not passed the Auditor release gate.", gateEvidence);
    }
    if (!Number.isSafeInteger(releaseGateStatus.id)
      || !isHttpsUrl(releaseGateStatus.target_url)
      || !releaseGateStatus.description?.trim()) {
      return blockedCandidate(
        "release_gate_evidence_incomplete",
        "The successful release gate is missing its evidence URL or Auditor summary.",
        gateEvidence
      );
    }

    return releasePayload({
      repository: REPOSITORY,
      sourceBranch: SOURCE_BRANCH,
      destinationBranch: DESTINATION_BRANCH,
      status: "ready",
      reason: null,
      mainSha,
      integrationSha,
      pullRequest: prContract,
      releaseGate: gateContract,
      fingerprint: fingerprint(mainSha, integrationSha, pullRequestNumber, releaseGateStatus.id)
    });
  } catch (error) {
    if (error instanceof GithubRequestTimeoutError) {
      return blockedCandidate(
        "github_timeout",
        "GitHub release evidence did not respond before the bounded read timeout."
      );
    }
    return blockedCandidate("github_unavailable", "Workbench release evidence is unavailable.");
  }
}
