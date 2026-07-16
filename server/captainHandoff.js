import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFile as nodeExecFile } from "node:child_process";
import {
  claimCaptainOperationExecution,
  completeCaptainOperationExecution,
  getLatestCaptainOperation
} from "./db.js";
import {
  DEFAULT_GITHUB_REQUEST_TIMEOUT_MS,
  DESTINATION_BRANCH,
  RELEASE_GATE_CONTEXT,
  REPOSITORY,
  SOURCE_BRANCH,
  readWorkbenchRelease,
  requestWorkbenchGithubJson
} from "./workbenchRelease.js";

export const CAPTAIN_WORKBENCH_RELEASE_WORKER_PATH = "/Users/kayden/GPT_OS/tools/captain-workbench-release.mjs";
export const CAPTAIN_WORKBENCH_RELEASE_MANIFEST_PATH = "/Users/kayden/GPT_OS/Scheduled/Captain/workbench-release-pr34.json";
export const CAPTAIN_WORKBENCH_RELEASE_SPOOL_ROOT = "/Users/kayden/GPT_OS/.local/captain-workbench-release";

const CONTRACT_VERSION = "1.0";
const TASK_TYPE = "workbench_release";
const SHA = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[A-Za-z0-9-]{1,128}$/;
const MAX_RESULT_BYTES = 64 * 1024;
const DEFAULT_RESULT_TIMEOUT_MS = 5 * 60 * 1000;
const TOKEN_ENV_KEYS = new Set([
  "GH_TOKEN",
  "GITHUB_TOKEN",
  "WORKBENCH_GITHUB_TOKEN",
  "GH_ENTERPRISE_TOKEN",
  "GITHUB_ENTERPRISE_TOKEN"
]);
export const CAPTAIN_RESULT_FAILURE_CODES = Object.freeze([
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
const FAILURE_CODES = new Set(CAPTAIN_RESULT_FAILURE_CODES);
const MANIFEST_KEYS = [
  "schemaVersion",
  "repository",
  "sourceBranch",
  "destinationBranch",
  "mainSha",
  "integrationSha",
  "pullRequestNumber",
  "releaseGateContext",
  "releaseGateStatusId",
  "evidenceUrl",
  "auditorSummary",
  "fingerprint"
];

function exactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && Object.keys(value).every((key) => keys.includes(key));
}

function isIsoTimestamp(value) {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
    && Number.isFinite(Date.parse(value));
}

function expectedFingerprint(manifest) {
  return crypto.createHash("sha256").update(
    `${manifest.repository} | ${manifest.mainSha} | ${manifest.integrationSha} | ${manifest.pullRequestNumber} | ${manifest.releaseGateStatusId}`
  ).digest("hex");
}

function validateManifest(manifest) {
  const valid = exactKeys(manifest, MANIFEST_KEYS)
    && manifest.schemaVersion === CONTRACT_VERSION
    && manifest.repository === REPOSITORY
    && manifest.sourceBranch === SOURCE_BRANCH
    && manifest.destinationBranch === DESTINATION_BRANCH
    && SHA.test(manifest.mainSha || "")
    && SHA.test(manifest.integrationSha || "")
    && Number.isSafeInteger(manifest.pullRequestNumber)
    && manifest.pullRequestNumber > 0
    && manifest.releaseGateContext === RELEASE_GATE_CONTEXT
    && Number.isSafeInteger(manifest.releaseGateStatusId)
    && manifest.releaseGateStatusId > 0
    && /^https:\/\/github\.com\/KaydenClark\/LLM_Workbench\//.test(manifest.evidenceUrl || "")
    && typeof manifest.auditorSummary === "string"
    && manifest.auditorSummary.trim() === manifest.auditorSummary
    && manifest.auditorSummary.length > 0
    && manifest.auditorSummary.length <= 240
    && SHA256.test(manifest.fingerprint || "")
    && manifest.fingerprint === expectedFingerprint(manifest);
  if (!valid) throw new Error("Captain Workbench release manifest is invalid.");
  return manifest;
}

export function readCaptainWorkbenchReleaseManifest(manifestPath = CAPTAIN_WORKBENCH_RELEASE_MANIFEST_PATH) {
  const stat = fs.lstatSync(manifestPath);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_RESULT_BYTES) {
    throw new Error("Captain Workbench release manifest is invalid.");
  }
  return validateManifest(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
}

function operationMatchesManifest(operation, manifest) {
  return operation?.type === TASK_TYPE
    && SAFE_ID.test(operation.id || "")
    && operation.repository === manifest.repository
    && operation.sourceBranch === manifest.sourceBranch
    && operation.destinationBranch === manifest.destinationBranch
    && operation.mainSha === manifest.mainSha
    && operation.integrationSha === manifest.integrationSha
    && operation.pullRequestNumber === manifest.pullRequestNumber
    && operation.releaseGateStatusId === manifest.releaseGateStatusId
    && operation.evidenceUrl === manifest.evidenceUrl
    && operation.auditorSummary === manifest.auditorSummary
    && operation.candidateFingerprint === manifest.fingerprint
    && isIsoTimestamp(operation.approvedAt);
}

function candidateMatchesManifest(candidate, manifest) {
  return candidate?.status === "ready"
    && candidate.repository === manifest.repository
    && candidate.sourceBranch === manifest.sourceBranch
    && candidate.destinationBranch === manifest.destinationBranch
    && candidate.mainSha === manifest.mainSha
    && candidate.integrationSha === manifest.integrationSha
    && candidate.pullRequest?.number === manifest.pullRequestNumber
    && candidate.pullRequest?.headSha === manifest.integrationSha
    && candidate.pullRequest?.baseSha === manifest.mainSha
    && candidate.pullRequest?.mergeable === true
    && candidate.releaseGate?.context === manifest.releaseGateContext
    && candidate.releaseGate?.id === manifest.releaseGateStatusId
    && candidate.releaseGate?.state === "success"
    && candidate.releaseGate?.sha === manifest.integrationSha
    && candidate.releaseGate?.evidenceUrl === manifest.evidenceUrl
    && candidate.releaseGate?.auditorSummary === manifest.auditorSummary
    && candidate.fingerprint === manifest.fingerprint;
}

function secureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const stat = fs.lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error("Captain handoff spool path is not a secure directory.");
  }
  fs.chmodSync(directory, 0o700);
}

function prepareSpool(spoolRoot) {
  secureDirectory(spoolRoot);
  const paths = {};
  for (const name of ["requests", "processing", "results", "quarantine"]) {
    paths[name] = path.join(spoolRoot, name);
    secureDirectory(paths[name]);
  }
  return paths;
}

function fsyncDirectory(directory) {
  const descriptor = fs.openSync(directory, fs.constants.O_RDONLY);
  try {
    fs.fsyncSync(descriptor);
  } finally {
    fs.closeSync(descriptor);
  }
}

function atomicWrite(filePath, bytes) {
  const temporaryPath = `${filePath}.${process.pid}.${crypto.randomBytes(8).toString("hex")}.tmp`;
  let descriptor;
  try {
    descriptor = fs.openSync(temporaryPath, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY, 0o600);
    fs.writeFileSync(descriptor, bytes);
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(temporaryPath, filePath);
    fs.chmodSync(filePath, 0o600);
    fsyncDirectory(path.dirname(filePath));
  } catch (error) {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    try { fs.unlinkSync(temporaryPath); } catch {}
    throw error;
  }
}

function requestForOperation(operation, manifest) {
  if (!SAFE_ID.test(operation?.id || "") || !SAFE_ID.test(operation?.executionClaimId || "")) {
    throw new Error("Captain handoff IDs are invalid.");
  }
  if (!isIsoTimestamp(operation.executionStartedAt)) {
    throw new Error("Captain handoff dispatch time is invalid.");
  }
  return {
    schemaVersion: CONTRACT_VERSION,
    taskType: TASK_TYPE,
    operationId: operation.id,
    executionClaimId: operation.executionClaimId,
    approvedAt: operation.approvedAt,
    dispatchedAt: operation.executionStartedAt,
    candidate: manifest
  };
}

function requestBytesForOperation(operation, manifest) {
  return Buffer.from(`${JSON.stringify(requestForOperation(operation, manifest))}\n`, "utf8");
}

function finishFailure(db, operation, status, code, detail, httpStatus) {
  const completed = completeCaptainOperationExecution(db, operation.id, operation.executionClaimId, {
    status,
    errorCode: code,
    errorDetail: detail
  });
  return {
    httpStatus,
    body: { ok: false, executed: false, queued: false, error: detail, code, operation: completed }
  };
}

function transientCandidate(candidate) {
  return new Set(["github_timeout", "github_unavailable", "promotion_pr_not_mergeable"])
    .has(candidate?.reason?.code);
}

function scrubbedEnvironment(environment = process.env) {
  return Object.fromEntries(Object.entries(environment).filter(([key]) => {
    const normalized = key.toUpperCase();
    if (TOKEN_ENV_KEYS.has(normalized) || normalized === "WORKBENCH_GITHUB_TOKEN") return false;
    const githubShaped = normalized.startsWith("GH_") || normalized.startsWith("GITHUB_");
    return !githubShaped || !/(?:TOKEN|PAT|AUTH)/.test(normalized);
  }));
}

function resultPathForOperation(paths, operation) {
  if (!SAFE_ID.test(operation?.id || "") || !SAFE_ID.test(operation?.executionClaimId || "")) return null;
  return path.join(paths.results, `${operation.id}.${operation.executionClaimId}.json`);
}

function quarantineResult(resultPath, quarantineDirectory) {
  const quarantinePath = path.join(
    quarantineDirectory,
    `${path.basename(resultPath)}.${Date.now()}.${crypto.randomBytes(6).toString("hex")}.invalid`
  );
  try {
    fs.renameSync(resultPath, quarantinePath);
    if (!fs.lstatSync(quarantinePath).isSymbolicLink()) fs.chmodSync(quarantinePath, 0o600);
    fsyncDirectory(quarantineDirectory);
  } catch {
    // The operation is rejected even when quarantine storage itself is unavailable.
  }
}

function validFailureOutcome(outcome) {
  return exactKeys(outcome, ["status", "code", "detail"])
    && new Set(["blocked", "rejected"]).has(outcome.status)
    && FAILURE_CODES.has(outcome.code)
    && typeof outcome.detail === "string"
    && outcome.detail.length > 0
    && outcome.detail.length <= 240
    && !/[\u0000-\u001f\u007f]/.test(outcome.detail);
}

function validAppliedOutcome(outcome) {
  return exactKeys(outcome, ["status", "mergeSha", "evidenceUrl"])
    && outcome.status === "applied"
    && SHA.test(outcome.mergeSha || "")
    && outcome.evidenceUrl === `https://github.com/${REPOSITORY}/commit/${outcome.mergeSha}`;
}

function validateResult(result, operation, requestSha256) {
  const validEnvelope = exactKeys(result, [
    "schemaVersion",
    "taskType",
    "operationId",
    "executionClaimId",
    "requestSha256",
    "completedAt",
    "outcome"
  ])
    && result.schemaVersion === CONTRACT_VERSION
    && result.taskType === TASK_TYPE
    && result.operationId === operation.id
    && result.executionClaimId === operation.executionClaimId
    && result.requestSha256 === requestSha256
    && isIsoTimestamp(result.completedAt);
  if (!validEnvelope || (!validAppliedOutcome(result.outcome) && !validFailureOutcome(result.outcome))) {
    throw new Error("Captain result contract is invalid.");
  }
  return result;
}

function readStrictResult(resultPath, operation, requestSha256) {
  const stat = fs.lstatSync(resultPath);
  if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o777) !== 0o600 || stat.size > MAX_RESULT_BYTES) {
    throw new Error("Captain result file is invalid.");
  }
  return validateResult(JSON.parse(fs.readFileSync(resultPath, "utf8")), operation, requestSha256);
}

async function verifyAppliedResult(operation, outcome, fetchImpl, timeoutMs) {
  const [mainRef, pullRequest] = await Promise.all([
    requestWorkbenchGithubJson({ fetchImpl, path: `/git/ref/heads/${DESTINATION_BRANCH}`, timeoutMs }),
    requestWorkbenchGithubJson({ fetchImpl, path: `/pulls/${operation.pullRequestNumber}`, timeoutMs })
  ]);
  const repository = REPOSITORY.toLowerCase();
  return mainRef?.object?.sha === outcome.mergeSha
    && pullRequest?.number === operation.pullRequestNumber
    && pullRequest.state === "closed"
    && pullRequest.merged === true
    && pullRequest.merge_commit_sha === outcome.mergeSha
    && pullRequest.head?.ref === SOURCE_BRANCH
    && pullRequest.head?.sha === operation.integrationSha
    && pullRequest.head?.repo?.full_name?.toLowerCase() === repository
    && pullRequest.base?.ref === DESTINATION_BRANCH
    && pullRequest.base?.sha === operation.mainSha
    && pullRequest.base?.repo?.full_name?.toLowerCase() === repository;
}

export async function reconcileCaptainWorkbenchRelease({
  db,
  fetchImpl = globalThis.fetch,
  githubRequestTimeoutMs = DEFAULT_GITHUB_REQUEST_TIMEOUT_MS,
  manifestPath = CAPTAIN_WORKBENCH_RELEASE_MANIFEST_PATH,
  spoolRoot = CAPTAIN_WORKBENCH_RELEASE_SPOOL_ROOT,
  resultTimeoutMs = DEFAULT_RESULT_TIMEOUT_MS,
  now = () => new Date().toISOString()
}) {
  const operation = getLatestCaptainOperation(db);
  if (!operation || operation.status !== "executing") return operation;

  let manifest;
  let paths;
  try {
    manifest = readCaptainWorkbenchReleaseManifest(manifestPath);
    paths = prepareSpool(spoolRoot);
  } catch {
    return completeCaptainOperationExecution(db, operation.id, operation.executionClaimId, {
      status: "rejected",
      errorCode: "operation_contract_invalid",
      errorDetail: "The Captain release contract is unavailable or invalid."
    });
  }
  if (!operationMatchesManifest(operation, manifest)) {
    return completeCaptainOperationExecution(db, operation.id, operation.executionClaimId, {
      status: "rejected",
      errorCode: "operation_contract_invalid",
      errorDetail: "The approved operation no longer matches the Captain release contract."
    });
  }

  const requestBytes = requestBytesForOperation(operation, manifest);
  const requestSha256 = crypto.createHash("sha256").update(requestBytes).digest("hex");
  const resultPath = resultPathForOperation(paths, operation);
  if (resultPath && fs.existsSync(resultPath)) {
    let result;
    try {
      result = readStrictResult(resultPath, operation, requestSha256);
    } catch {
      quarantineResult(resultPath, paths.quarantine);
      return completeCaptainOperationExecution(db, operation.id, operation.executionClaimId, {
        status: "rejected",
        errorCode: "captain_result_invalid",
        errorDetail: "Captain returned a result that did not match the exact dispatched request."
      });
    }
    if (result.outcome.status === "applied") {
      try {
        const verified = await verifyAppliedResult(
          operation,
          result.outcome,
          fetchImpl,
          githubRequestTimeoutMs
        );
        if (!verified) {
          return completeCaptainOperationExecution(db, operation.id, operation.executionClaimId, {
            status: "blocked",
            errorCode: "captain_result_verification_mismatch",
            errorDetail: "Captain's applied result did not match current GitHub merge evidence."
          });
        }
      } catch {
        const startedAt = Date.parse(operation.executionStartedAt || "");
        const deadline = Number.isFinite(startedAt) ? startedAt + resultTimeoutMs : Number.NaN;
        const elapsed = Date.parse(now()) - startedAt;
        if (Number.isFinite(elapsed) && elapsed >= resultTimeoutMs) {
          return completeCaptainOperationExecution(db, operation.id, operation.executionClaimId, {
            status: "blocked",
            errorCode: "captain_result_verification_timeout",
            errorDetail: "Independent GitHub verification did not recover before the bounded deadline."
          });
        }
        return {
          ...operation,
          verificationStatus: "verifying",
          ...(Number.isFinite(deadline) ? { verificationDeadlineAt: new Date(deadline).toISOString() } : {})
        };
      }
      return completeCaptainOperationExecution(db, operation.id, operation.executionClaimId, {
        status: "applied",
        mergeSha: result.outcome.mergeSha,
        evidenceUrl: result.outcome.evidenceUrl
      });
    }
    return completeCaptainOperationExecution(db, operation.id, operation.executionClaimId, {
      status: result.outcome.status,
      errorCode: result.outcome.code,
      errorDetail: result.outcome.detail
    });
  }

  const elapsed = Date.parse(now()) - Date.parse(operation.executionStartedAt || "");
  if (Number.isFinite(elapsed) && elapsed >= resultTimeoutMs) {
    return completeCaptainOperationExecution(db, operation.id, operation.executionClaimId, {
      status: "blocked",
      errorCode: "captain_result_timeout",
      errorDetail: "Captain did not return a result before the bounded handoff timeout."
    });
  }
  return operation;
}

export async function dispatchCaptainWorkbenchRelease({
  db,
  operationId,
  passcodeHash,
  fetchImpl = globalThis.fetch,
  githubRequestTimeoutMs = DEFAULT_GITHUB_REQUEST_TIMEOUT_MS,
  claimStaleAfterMs = 5 * 60 * 1000,
  manifestPath = CAPTAIN_WORKBENCH_RELEASE_MANIFEST_PATH,
  spoolRoot = CAPTAIN_WORKBENCH_RELEASE_SPOOL_ROOT,
  workerPath = CAPTAIN_WORKBENCH_RELEASE_WORKER_PATH,
  resultTimeoutMs = DEFAULT_RESULT_TIMEOUT_MS,
  execFileImpl = nodeExecFile,
  now = () => new Date().toISOString()
}) {
  await reconcileCaptainWorkbenchRelease({
    db,
    fetchImpl,
    githubRequestTimeoutMs,
    manifestPath,
    spoolRoot,
    resultTimeoutMs,
    now
  });
  const claim = claimCaptainOperationExecution(db, operationId, {
    staleAfterMs: claimStaleAfterMs,
    now: now()
  });
  if (claim.kind === "already_applied") {
    return {
      httpStatus: 200,
      body: { ok: true, executed: false, queued: false, idempotent: true, operation: claim.operation }
    };
  }
  if (claim.kind === "already_executing") {
    return {
      httpStatus: 409,
      body: {
        ok: false,
        executed: false,
        queued: false,
        error: "This Workbench release operation already has an active Captain handoff.",
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
        queued: false,
        error: "This Workbench release operation is not executable.",
        code: "operation_not_executable",
        operation: claim.operation
      }
    };
  }

  const operation = claim.operation;
  let manifest;
  let paths;
  try {
    manifest = readCaptainWorkbenchReleaseManifest(manifestPath);
    paths = prepareSpool(spoolRoot);
  } catch {
    return finishFailure(
      db,
      operation,
      "rejected",
      "operation_contract_invalid",
      "The Captain release contract is unavailable or invalid.",
      409
    );
  }
  if (!operationMatchesManifest(operation, manifest)) {
    return finishFailure(
      db,
      operation,
      "rejected",
      "operation_contract_invalid",
      "The approved operation no longer matches the Captain release contract.",
      409
    );
  }

  let release;
  try {
    release = await readWorkbenchRelease({ passcodeHash, fetchImpl, githubRequestTimeoutMs });
  } catch {
    return finishFailure(
      db,
      operation,
      "blocked",
      "github_unavailable",
      "Current GitHub release evidence is temporarily unavailable.",
      503
    );
  }
  if (!candidateMatchesManifest(release.candidate, manifest)) {
    const transient = transientCandidate(release.candidate);
    return finishFailure(
      db,
      operation,
      transient ? "blocked" : "rejected",
      transient ? (release.candidate?.reason?.code || "candidate_not_ready") : "candidate_stale",
      transient
        ? "The fixed Workbench release candidate is temporarily unavailable."
        : "The approved Workbench release candidate no longer matches exact GitHub evidence.",
      transient ? 503 : 409
    );
  }

  const requestBytes = requestBytesForOperation(operation, manifest);
  const requestPath = path.join(paths.requests, `${operation.id}.${operation.executionClaimId}.json`);
  try {
    atomicWrite(requestPath, requestBytes);
  } catch {
    return finishFailure(
      db,
      operation,
      "blocked",
      "captain_request_write_failed",
      "CIC could not write the bound Captain handoff request.",
      503
    );
  }

  const callback = (error) => {
    void reconcileCaptainWorkbenchRelease({
      db,
      fetchImpl,
      githubRequestTimeoutMs,
      manifestPath,
      spoolRoot,
      resultTimeoutMs,
      now
    }).then((current) => {
      if (!error || current?.status !== "executing" || current.executionClaimId !== operation.executionClaimId) return;
      completeCaptainOperationExecution(db, operation.id, operation.executionClaimId, {
        status: "blocked",
        errorCode: "captain_worker_spawn_failed",
        errorDetail: "CIC could not start the fixed Captain release worker."
      });
    }).catch(() => {
      // GET reconciliation or a fresh owner retry remains the fail-closed recovery seam.
    });
  };

  try {
    execFileImpl(process.execPath, [workerPath, "process", requestPath], {
      shell: false,
      env: scrubbedEnvironment(),
      windowsHide: true,
      encoding: "utf8",
      maxBuffer: 64 * 1024
    }, callback);
  } catch {
    return finishFailure(
      db,
      operation,
      "blocked",
      "captain_worker_spawn_failed",
      "CIC could not start the fixed Captain release worker.",
      503
    );
  }

  return {
    httpStatus: 202,
    body: {
      ok: true,
      executed: false,
      queued: true,
      operation: getLatestCaptainOperation(db, operation.id)
    }
  };
}
