import crypto from "node:crypto";
import {
  claimCaptainOperationExecution,
  completeCaptainOperationExecution,
  getLatestCaptainOperation
} from "./db.js";
import {
  DEFAULT_GITHUB_REQUEST_TIMEOUT_MS,
  DESTINATION_BRANCH,
  GithubRequestTimeoutError,
  RELEASE_GATE_CONTEXT,
  REPOSITORY,
  SOURCE_BRANCH,
  readWorkbenchRelease,
  requestWorkbenchGithubJson
} from "./workbenchRelease.js";

const SHA = /^[a-f0-9]{40}$/;
const FIXED_REPOSITORY_LOWER = REPOSITORY.toLowerCase();

function operationHasFixedContract(operation) {
  const expectedFingerprint = crypto.createHash("sha256").update(
    `${REPOSITORY} | ${operation?.mainSha} | ${operation?.integrationSha} | ${operation?.pullRequestNumber} | ${operation?.releaseGateStatusId}`
  ).digest("hex");
  return operation?.type === "workbench_release"
    && operation.repository === REPOSITORY
    && operation.sourceBranch === SOURCE_BRANCH
    && operation.destinationBranch === DESTINATION_BRANCH
    && SHA.test(operation.mainSha || "")
    && SHA.test(operation.integrationSha || "")
    && Number.isSafeInteger(operation.pullRequestNumber)
    && operation.pullRequestNumber > 0
    && Number.isSafeInteger(operation.releaseGateStatusId)
    && operation.releaseGateStatusId > 0
    && operation.candidateFingerprint === expectedFingerprint
    && /^https:\/\/github\.com\/KaydenClark\/LLM_Workbench\//.test(operation.evidenceUrl || "")
    && typeof operation.auditorSummary === "string"
    && operation.auditorSummary.trim().length > 0;
}

function operationMatchesCandidate(operation, candidate) {
  return candidate?.status === "ready"
    && candidate.repository === REPOSITORY
    && candidate.sourceBranch === SOURCE_BRANCH
    && candidate.destinationBranch === DESTINATION_BRANCH
    && candidate.mainSha === operation.mainSha
    && candidate.integrationSha === operation.integrationSha
    && candidate.pullRequest?.number === operation.pullRequestNumber
    && candidate.pullRequest?.headSha === operation.integrationSha
    && candidate.pullRequest?.baseSha === operation.mainSha
    && candidate.pullRequest?.mergeable === true
    && candidate.releaseGate?.id === operation.releaseGateStatusId
    && candidate.releaseGate?.context === RELEASE_GATE_CONTEXT
    && candidate.releaseGate?.state === "success"
    && candidate.releaseGate?.sha === operation.integrationSha
    && candidate.releaseGate?.evidenceUrl === operation.evidenceUrl
    && candidate.releaseGate?.auditorSummary === operation.auditorSummary
    && candidate.fingerprint === operation.candidateFingerprint;
}

function pullRequestMatchesOperation(pullRequest, operation) {
  return pullRequest?.number === operation.pullRequestNumber
    && pullRequest.head?.ref === SOURCE_BRANCH
    && pullRequest.base?.ref === DESTINATION_BRANCH
    && pullRequest.head?.sha === operation.integrationSha
    && pullRequest.base?.sha === operation.mainSha
    && pullRequest.head?.repo?.full_name?.toLowerCase() === FIXED_REPOSITORY_LOWER
    && pullRequest.base?.repo?.full_name?.toLowerCase() === FIXED_REPOSITORY_LOWER;
}

async function readAlreadyApplied({ operation, fetchImpl, timeoutMs }) {
  const [mainRef, pullRequest] = await Promise.all([
    requestWorkbenchGithubJson({
      fetchImpl,
      path: `/git/ref/heads/${DESTINATION_BRANCH}`,
      timeoutMs
    }),
    requestWorkbenchGithubJson({
      fetchImpl,
      path: `/pulls/${operation.pullRequestNumber}`,
      timeoutMs
    })
  ]);
  const mergeSha = pullRequest?.merge_commit_sha;
  const mainSha = mainRef?.object?.sha;
  if (pullRequestMatchesOperation(pullRequest, operation)
    && pullRequest.state === "closed"
    && pullRequest.merged === true
    && SHA.test(mergeSha || "")
    && mainSha === mergeSha) {
    return { applied: true, mergeSha };
  }
  return { applied: false };
}

function finishFailure(db, operation, claimId, { status, code, detail, httpStatus }) {
  const completed = completeCaptainOperationExecution(db, operation.id, claimId, {
    status,
    errorCode: code,
    errorDetail: detail
  });
  return {
    httpStatus,
    body: {
      ok: false,
      executed: false,
      error: detail,
      code,
      operation: completed
    }
  };
}

export async function executeApprovedWorkbenchRelease({
  db,
  operationId,
  passcodeHash,
  githubToken,
  fetchImpl = globalThis.fetch,
  githubRequestTimeoutMs = DEFAULT_GITHUB_REQUEST_TIMEOUT_MS,
  claimStaleAfterMs = 5 * 60 * 1000
}) {
  const claim = claimCaptainOperationExecution(db, operationId, { staleAfterMs: claimStaleAfterMs });
  if (claim.kind === "already_applied") {
    return {
      httpStatus: 200,
      body: { ok: true, executed: false, idempotent: true, recovered: false, operation: claim.operation }
    };
  }
  if (claim.kind === "already_executing") {
    return {
      httpStatus: 409,
      body: {
        ok: false,
        executed: false,
        error: "This Workbench release operation already has an active executor.",
        code: "operation_already_executing",
        operation: claim.operation
      }
    };
  }
  if (claim.kind === "rejected" || claim.kind === "not_executable") {
    return {
      httpStatus: 409,
      body: {
        ok: false,
        executed: false,
        error: "This Workbench release operation is not executable.",
        code: "operation_not_executable",
        operation: claim.operation
      }
    };
  }

  const operation = claim.operation;
  const claimId = operation.executionClaimId;
  if (!operationHasFixedContract(operation)) {
    return finishFailure(db, operation, claimId, {
      status: "rejected",
      code: "operation_contract_invalid",
      detail: "The approved operation no longer matches the fixed Workbench release contract.",
      httpStatus: 409
    });
  }
  if (typeof githubToken !== "string" || !githubToken.trim()) {
    return finishFailure(db, operation, claimId, {
      status: "blocked",
      code: "github_token_not_configured",
      detail: "A server-side Workbench GitHub token is required for release execution.",
      httpStatus: 503
    });
  }

  let release;
  try {
    release = await readWorkbenchRelease({
      passcodeHash,
      fetchImpl,
      githubRequestTimeoutMs
    });
  } catch {
    return finishFailure(db, operation, claimId, {
      status: "blocked",
      code: "github_unavailable",
      detail: "GitHub release evidence is unavailable.",
      httpStatus: 503
    });
  }

  if (!operationMatchesCandidate(operation, release.candidate)) {
    try {
      const alreadyApplied = await readAlreadyApplied({
        operation,
        fetchImpl,
        timeoutMs: githubRequestTimeoutMs
      });
      if (alreadyApplied.applied) {
        const completed = completeCaptainOperationExecution(db, operation.id, claimId, {
          status: "applied",
          mergeSha: alreadyApplied.mergeSha,
          evidenceUrl: `https://github.com/${REPOSITORY}/commit/${alreadyApplied.mergeSha}`
        });
        return {
          httpStatus: 200,
          body: { ok: true, executed: false, idempotent: true, recovered: true, operation: completed }
        };
      }
    } catch {
      // The original fail-closed candidate result below remains authoritative.
    }

    const reasonCode = release.candidate?.reason?.code;
    const transient = new Set([
      "github_timeout",
      "github_unavailable",
      "promotion_pr_not_mergeable"
    ]).has(reasonCode);
    return finishFailure(db, operation, claimId, transient ? {
      status: "blocked",
      code: reasonCode,
      detail: reasonCode === "promotion_pr_not_mergeable"
        ? "GitHub has not confirmed that the exact Workbench promotion pull request is mergeable."
        : "GitHub release evidence is temporarily unavailable.",
      httpStatus: reasonCode === "promotion_pr_not_mergeable" ? 409 : 503
    } : {
      status: "rejected",
      code: "candidate_stale",
      detail: "The approved Workbench release candidate no longer matches exact GitHub evidence.",
      httpStatus: 409
    });
  }

  const currentClaim = getLatestCaptainOperation(db, operation.id);
  if (currentClaim?.status !== "executing" || currentClaim.executionClaimId !== claimId) {
    return {
      httpStatus: 409,
      body: {
        ok: false,
        executed: false,
        error: "The Workbench release execution claim is no longer current.",
        code: "execution_claim_lost",
        operation: currentClaim
      }
    };
  }

  let mergeResult;
  try {
    mergeResult = await requestWorkbenchGithubJson({
      fetchImpl,
      path: `/pulls/${operation.pullRequestNumber}/merge`,
      timeoutMs: githubRequestTimeoutMs,
      method: "PUT",
      token: githubToken,
      body: {
        merge_method: "merge",
        sha: operation.integrationSha
      }
    });
  } catch (error) {
    return finishFailure(db, operation, claimId, {
      status: "blocked",
      code: error instanceof GithubRequestTimeoutError ? "github_timeout" : "github_merge_unavailable",
      detail: "GitHub did not confirm the exact Workbench merge; retry will re-check remote state.",
      httpStatus: 503
    });
  }

  if (mergeResult?.merged !== true || !SHA.test(mergeResult?.sha || "")) {
    return finishFailure(db, operation, claimId, {
      status: "blocked",
      code: "github_merge_not_confirmed",
      detail: "GitHub did not confirm the exact Workbench merge; retry will re-check remote state.",
      httpStatus: 503
    });
  }

  try {
    const verified = await readAlreadyApplied({
      operation,
      fetchImpl,
      timeoutMs: githubRequestTimeoutMs
    });
    if (!verified.applied || verified.mergeSha !== mergeResult.sha) {
      return finishFailure(db, operation, claimId, {
        status: "blocked",
        code: "merge_verification_failed",
        detail: "GitHub merge evidence did not match the exact operation; retry will re-check remote state.",
        httpStatus: 503
      });
    }
    const completed = completeCaptainOperationExecution(db, operation.id, claimId, {
      status: "applied",
      mergeSha: verified.mergeSha,
      evidenceUrl: `https://github.com/${REPOSITORY}/commit/${verified.mergeSha}`
    });
    return {
      httpStatus: 200,
      body: { ok: true, executed: true, idempotent: false, recovered: false, operation: completed }
    };
  } catch {
    return finishFailure(db, operation, claimId, {
      status: "blocked",
      code: "merge_verification_unavailable",
      detail: "GitHub merge verification is unavailable; retry will re-check remote state.",
      httpStatus: 503
    });
  }
}
