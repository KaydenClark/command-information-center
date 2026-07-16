# S-006 - Captain Workbench Release Handoff

> Generated from LLM Workbench v2.3.

**Spec ID:** S-006
**Status:** active
**Priority:** 0
**Owner:** CIC Engineer
**Updated:** 2026-07-16
**Catalog description:** Replace CIC's direct GitHub merge executor with a credential-free, exact-request handoff to the fixed GPT_OS Captain worker.
**Blockers:** none
**Latest event:** Draft PR 18 is open to `Integration` from the remotely recovered handoff branch; no merge is authorized.
**Next gate:** Obtain independent immutable-head review of the final published head before Integration.

## Outcome

CIC remains the private owner control surface for two deliberate passcode steps,
but it never receives a GitHub mutation credential and never calls GitHub's
merge endpoint. The second step atomically dispatches one manifest-bound request
to the fixed GPT_OS Captain worker. CIC imports only the matching result and
independently verifies an applied result against current public GitHub evidence.

## Why It Matters

S-004 proved the fixed candidate, durable approval, and atomic execution claim,
but its TK-003 executor placed a GitHub mutation credential and merge call inside
CIC. Captain is the workspace authority that already owns release execution.
This capability restores that boundary without changing the fixed candidate,
owner gate, passcode/session model, or durable operation lifecycle.

## Current Verified State

- S-004 remains complete evidence for fixed candidate reads, approval intent,
  durable operation storage, and atomic claims.
- S-005 remains the owner-facing private phone workflow and is blocked only on
  this handoff, runtime deployment, and owner Meshnet acceptance.
- The root contract fixes one immutable Workbench PR 34 manifest, one absolute
  Captain worker path, and one machine-local request/result spool.
- Focused tests prove the new request/result and browser seams without invoking
  a real worker, reading credentials, changing runtime state, or mutating GitHub.

## Desired Behavior

- `POST /api/captain/workbench-release/execution` continues to accept exactly
  `{operationId, passcode}` after an authenticated session and a fresh second
  timing-safe step-up.
- CIC atomically claims only the approved/blocked durable operation and
  re-fetches the current fixed GitHub candidate before dispatch.
- The durable operation, execution claim, and every immutable manifest field
  must match exactly. Drift writes no request and starts no process.
- CIC writes one exact request through temp, file `fsync`, rename, and directory
  `fsync`; spool directories are `0700` and files are `0600`.
- Request filename is `<operationId>.<executionClaimId>.json` after strict ID
  validation. Request bytes contain only schema/version, task type, operation
  and claim IDs, approved/dispatched timestamps, and the immutable candidate.
- CIC starts only `node /Users/kayden/GPT_OS/tools/captain-workbench-release.mjs
  process <requestPath>` with `shell: false`; GitHub token variables are removed
  from the child environment.
- Passcodes and credentials never enter the request, result, SQLite events,
  client storage, URL, logs, or UI evidence.
- `GET /api/captain/workbench-release` reconciles an executing operation against
  only its exact result filename, request-byte SHA-256, operation/claim IDs,
  schema, allowlisted outcome, and bounded sanitized detail.
- Invalid or mismatched results are quarantined and terminally rejected. A
  missing result reaches a bounded retryable timeout. A worker spawn failure is
  sanitized and retryable with a fresh atomic claim.
- An `applied` result becomes durable only after CIC independently reads the
  exact PR and current `main`, verifies the approved head/base and merge commit,
  and matches the result's exact commit URL.
- The mobile card describes the second step as a Captain handoff, preserves
  separate secrets, polls sequentially for no more than 60 seconds, and shows
  only durable GET state.

## Decisions And Contracts

- Fixed worker: `/Users/kayden/GPT_OS/tools/captain-workbench-release.mjs`.
- Fixed manifest: `/Users/kayden/GPT_OS/Scheduled/Captain/workbench-release-pr34.json`.
- Shared result contract: `/Users/kayden/GPT_OS/Scheduled/Captain/workbench-release-contract.json`.
- Fixed spool: `/Users/kayden/GPT_OS/.local/captain-workbench-release` with
  `requests/`, `processing/`, `results/`, and `quarantine/`.
- Request schema version and result schema version are both `1.0`; task type is
  `workbench_release`.
- Request digest is SHA-256 of the exact request file bytes, including their
  canonical trailing newline.
- CIC has no GitHub mutation method, merge endpoint, mutation token setting, or
  arbitrary worker/manifest/spool selector in production configuration.
- Manifest, worker, and spool overrides exist only as injected test seams. Tests
  use temporary topology and a fake worker process boundary.
- Existing SQLite tables and operation status names remain additive and
  compatible. No database migration or private runtime-data rewrite is needed.

## Non-Goals

- Running or testing a real Workbench merge.
- Adding a generic queue, arbitrary command, repository, branch, PR, SHA,
  worker, manifest, spool, or merge-mode control.
- Changing the approval endpoint, session cookie, passcode hash, database
  schema, remote-access topology, or owner-only `integration` to `main` gate.
- Deploying the task branch to the live Mac Mini service before independent
  review and Integration merge.

## Dependencies And Blockers

- Root GPT_OS owns and publishes the immutable manifest and fixed Captain worker.
- S-005 TK-002 resumes after S-006 passes review and reaches CIC `Integration`.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Credential-free Captain release handoff and reconciliation | in-progress | none | Red import failure for absent `server/captainHandoff.js`; green focused handoff 11/11; full Node 213 pass + 6 TODO; browser 11 pass + 7 intended skips; root worker contract tests green |

## Ticket Done Contract

### TK-001 - Credential-Free Captain Release Handoff And Reconciliation

Done when CIC contains no direct GitHub mutation or release token
configuration; the exact handoff/reconciliation, drift, atomic-mode, secret,
spawn/recovery, timeout, result binding, independent verification, and bounded
mobile polling seams are green; project and Workbench gates pass; documentation
is current; the remote task head is the recovery point; and an independent
immutable-head review has no unresolved in-scope finding.

## Acceptance Criteria

- [x] Two separate fresh passcode steps remain and the second accepts only the approved operation ID.
- [x] CIC has no direct GitHub mutation client or release-token configuration.
- [x] Drift prevents request creation and worker dispatch.
- [x] Request and result files are atomically written/bound with strict `0700`/`0600` modes.
- [x] Worker invocation uses fixed executable/arguments, `shell: false`, and scrubbed token variables.
- [x] Passcodes and credentials are absent from spool, durable events, UI storage, and logs.
- [x] Result schema, IDs, request digest, outcomes, and sanitized detail fail closed; invalid results are quarantined.
- [x] Spawn failure, stale claim, missing-result timeout, and fresh retry are bounded and recoverable.
- [x] CIC independently verifies current GitHub PR/main evidence before recording `applied`.
- [x] Mobile polling remains sequential, non-overlapping, and bounded to 60 seconds.
- [x] Full Node, browser, build, production audit, doctor, harness, evaluator, diff, and secret-boundary gates pass on the final head.
- [ ] Independent immutable-head review has no unresolved in-scope finding.

## Testing Seams

- Route seam: authenticated second step-up accepts only `{operationId, passcode}`
  and returns queued durable state without importing the secret into the spool.
- Spool/process seam: temporary manifest, fake worker, exact request bytes,
  filesystem modes, fixed argv, scrubbed environment, and atomic rename behavior.
- Evidence seam: deterministic read-only GitHub fixtures prove no dispatch on
  drift and independent PR/main verification after an exact result.
- Recovery seam: digest tamper quarantine, spawn failure, fresh claim retry,
  stale ownership, and bounded missing-result timeout.
- Browser seam: mocked iPhone 13 approval/handoff separation, durable state
  matrix, accessible controls, and bounded sequential GET polling.

## Verification Procedure

```bash
node --test test/captainHandoff.test.js test/workbenchExecution.test.js test/workbenchRelease.test.js
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs doctor
```

Also run the harness presence, retired-plan, placeholder, Workbench evaluator,
diff, direct-mutation, and secret-boundary checks from `RUNBOOK.md`.

## Documentation Impact

- S-006 owns the handoff requirements, proof, and partial supersession boundary.
- Blueprint, README, and Runbook describe the active architecture, API behavior,
  operator workflow, recovery, and troubleshooting.
- S-005 records the new dependency without rewriting its completed UI/runtime
  evidence. S-004's append-only evidence remains unchanged.
- Lexicon and CONTRACT are checked; no change is expected because shared terms
  and the OpenBrain consumer contract do not change.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-16 | TK-001 | Claimed in isolated branch `codex/s-006-captain-release-handoff` from exact remote `Integration` `1b74d9f127c7cba02f2fee22afc418013a224c32` | Pre-change spec doctor green; registered worktree clean; no live runtime, credential, database contents, Workbench remote, or CIC main changed | S-006 work packet created; owning docs identified | Red/green implementation, full verification, remote checkpoint, draft PR, and immutable review remained |
| 2026-07-16 | TK-001 | Credential-free handoff red/green completed | Red: focused test failed with `ERR_MODULE_NOT_FOUND` for absent `server/captainHandoff.js`; green: handoff 7/7, durable claim/migration 4/4, release/approval 23/23, and iPhone workflow 7 pass + 7 expected desktop skips | S-006, Blueprint, README, Runbook, S-005, and generated Taskboard updated; S-004 historical proof preserved; Lexicon and CONTRACT checked with no update needed | Full project/harness gates, remote checkpoint, draft PR, and independent exact-head review remain |
| 2026-07-16 | TK-001 review repair | Preserved durable executing/applied state after GitHub closes the promotion PR and removed symlink quarantine side effects | Red: 2 mobile cases showed a blocked current candidate hid Captain polling/applied evidence; one filesystem case showed quarantine chmod followed a result symlink. Green: both mobile cases and focused handoff 11/11 pass; symlink target content/mode remain unchanged | Updated S-006 proof and active UI contract; no endpoint, schema, or runtime configuration changed | Final full gates and cross-contract verification remained |
| 2026-07-16 | TK-001 | Final local and cross-contract gates green | Node 219 discovered: 213 pass, 6 existing TODO, 0 fail; Playwright 11 pass, 7 intended desktop skips; build green; production audit 0; doctor/harness/placeholder/retired-plan/diff/secret checks green; evaluator 83.3/113 above both controls; root worker tests green at repair `fb93a616`; CIC and root share the exact sorted failure-code, fixed argv, digest, and commit-evidence contracts | Updated Blueprint, README, Runbook, S-004 partial supersession, S-005 dependency, S-006, and generated Taskboard; Lexicon and CONTRACT checked with no update needed because shared vocabulary and the OpenBrain consumer contract did not change | Commit/push exact checkpoint, open draft Integration PR, and obtain independent immutable-head review |
| 2026-07-16 | TK-001 | Published for independent review | Draft PR 18 targets capital-I `Integration`, is mergeable, and initially bound remote implementation head `d68f6582149ff3c86a8392b833b34186b33942f4`; source base remains exact `1b74d9f127c7cba02f2fee22afc418013a224c32`; CIC `main`, live runtime, credentials, private database contents, and Workbench refs remain untouched | Publication evidence appended to S-006 and generated Taskboard | Push docs-only publication checkpoint and obtain independent immutable-head review; do not merge |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- Live owner acceptance remains S-005 TK-002 after the reviewed handoff reaches
  `Integration` and the Mac Mini service is migrated.
- The manifest is deliberately one release candidate, not a reusable arbitrary
  release queue.

## Supersession

- Supersedes: S-004 TK-003 direct-token/direct-merge executor only.
- Superseded by: none
