# S-004 - Workbench Release Control

> Generated from LLM Workbench v2.3.

**Spec ID:** S-004
**FUID:** 00005O
**Status:** complete
**Priority:** 0
**Owner:** Engineer TK-003
**Created:** 2026-07-16
**Last worked:** 2026-07-16
**Updated:** 2026-07-16
**Catalog description:** Let Kayden inspect, approve, and execute a fixed, evidence-bound Workbench integration-to-main release from CIC without exposing a generic remote executor.
**Blockers:** none
**Latest event:** Spec completed and removed from the hot board.
**Next gate:** none

## Outcome

CIC gives Kayden a narrow mobile release surface for the canonical Workbench
while keeping GitHub source truth, passcode protection, exact-SHA audit proof,
and the owner-only integration-to-main gate explicit.

## Current Verified State

CIC has an authenticated private-app boundary, a responsive read-only
Deployments candidate, a server-only approval-intent route, and a narrow
execution route for one recorded fixed operation. The executor remains unusable
without a server-only GitHub token and exposes no generic GitHub target.

## Desired Behavior

- `GET /api/captain/workbench-release` returns one fixed read-only candidate and
  the latest durable operation, if any.
- The only repository and branch direction is
  `KaydenClark/LLM_Workbench` `integration` to `main`.
- A candidate is ready only when the local passcode is configured, exactly one
  matching PR exists, its detailed state is open and non-draft, its head/base
  SHAs remain current, `main` is an
  ancestor of `integration`, GitHub reports the PR mergeable, and the exact
  integration SHA has a successful `gptos/workbench-release-gate` status.
- The release-gate status must include an evidence target URL and an Auditor
  summary. Its GitHub status ID binds the candidate fingerprint.
- The mobile Deployments view shows the candidate truth without offering any
  mutation or approval control in TK-001.
- `POST /api/captain/workbench-release/approval` accepts exactly the current
  fingerprint and a step-up passcode from an authenticated CIC session.
- Approval re-fetches and revalidates the fixed GitHub candidate before one
  durable operation is recorded; stale, replayed, blocked, invalid, or
  unavailable evidence records nothing.
- Repeated failed step-up attempts are throttled in a bounded per-session
  window. Passcodes are timing-safe verified and never persisted.
- `POST /api/captain/workbench-release/execution` accepts exactly one recorded
  operation ID and a step-up passcode from an authenticated CIC session.
- Execution atomically claims only an approved/blocked operation, re-fetches all
  exact candidate evidence immediately before mutation, and submits only a
  merge-commit request bound to the approved integration SHA.
- Applied retries are idempotent, active concurrent executors are rejected, and
  stale crash recovery recognizes an exact already-merged PR without issuing a
  second merge request.

## Decisions And Contracts

- Candidate fingerprint is SHA-256 of
  `repository | mainSha | integrationSha | prNumber | releaseGateStatusId`.
- Missing, stale, closed, draft, ambiguous, divergent, unmergeable, failed,
  unavailable, or timed-out evidence blocks readiness instead of being treated
  as healthy. Every GitHub read has a bounded timeout.
- Candidate reads and approval revalidation perform GitHub reads only. The
  separate execution route is the sole GitHub mutation path.
- Approval request fields are exactly `fingerprint` and `passcode`; repository,
  branch, command, URL, and execution fields fail closed.
- `captain_operations.candidate_fingerprint` is unique. The approved operation
  stores the fixed repository/branches, exact SHAs, PR/gate IDs, Auditor
  evidence, and timestamps from server-validated evidence.
- `captain_operation_events` is append-only, with database triggers rejecting
  update or deletion. The approval passcode is absent from both tables.
- Step-up verification hashes bounded input and always uses
  `crypto.timingSafeEqual` against a 32-byte buffer. Five failures per session
  in the default five-minute window throttle further attempts; the key map is
  capped at 1,000 entries.
- Execution request fields are exactly `operationId` and `passcode`. Repository,
  branch, PR, SHA, URL, command, merge mode, force, and branch deletion are not
  caller inputs.
- The only mutation is GitHub's fixed PR merge endpoint with
  `merge_method: merge` and the approved integration SHA. Post-mutation evidence
  requires the exact PR merge commit to be current Workbench `main`.
- Atomic claim IDs and stale-claim recovery prevent two active executors from
  applying a second merge. Operation transitions and requested/approved/
  executing/applied/blocked/rejected evidence are durable; raw errors and
  secrets are never persisted.
- Inconclusive GitHub mergeability is retryable `blocked`, not terminal
  `rejected`. Unexpected persistence errors return a fixed
  `execution_internal_error` response rather than raw exception text.

## Non-Goals

- Accepting an arbitrary repository, branch, command, or URL from the browser.
- Adding a Deployments approval UI; TK-002 establishes the authenticated server
  contract only.
- Making CIC remotely reachable or changing credentials.
- Running a live Workbench merge as part of implementation or verification.

## Dependencies And Blockers

- none

## Vertical Implementation Slices

| Ticket | FUID | Slice | Status | Blockers | Created | Last worked | Proof |
|---|---|---|---|---|---|---|---|
| TK-001 | 00005P | Fixed read-only Workbench candidate API and mobile Deployments card | done | none | 2026-07-16 | 2026-07-16 | 15 focused API cases including detailed PR state and direct/detailed abort-signal proof; mobile browser proof; full Node/browser/build/audit/doctor green |
| TK-002 | 00005Q | SHA-bound one-time owner approval and durable Captain operation | done | none | 2026-07-16 | 2026-07-16 | red/green focused 65/65; full Node 191 pass + 6 existing TODO; browser 6 pass + 2 expected skips; build/audit/doctor/evaluator/diff green |
| TK-003 | 00005R | Execute and verify the exact GitHub merge with replay protection | done | none | 2026-07-16 | 2026-07-16 | Focused 77/77; full Node 205 pass plus 6 existing TODO; browser 6 pass plus 2 intentional desktop skips; build, audit, doctor, evaluator, diff green; immutable d63e25b..db61fe0 re-review no findings |

## Acceptance Criteria

- [x] The read endpoint uses only the fixed Workbench repository and branch direction.
- [x] Candidate readiness fails closed for missing passcode, divergence, missing, moved, closed, or draft PR, unmergeable PR, timed-out GitHub reads, and missing or failed exact-SHA Auditor status.
- [x] The successful candidate includes the specified fingerprint, evidence URL, and Auditor summary.
- [x] The mobile Deployments view presents candidate state without a mutation control.
- [x] GitHub and `main` remain unchanged by TK-001.
- [x] Approval requires a current session, timing-safe step-up passcode, and a
      valid current fingerprint; repeated failures are bounded and throttled.
- [x] POST accepts no repository, branch, command, URL, or executor field and
      performs only fixed GitHub reads before persistence.
- [x] Candidate blocking or fingerprint mismatch records no operation; unique
      fingerprint persistence rejects replay.
- [x] The approved operation stores fixed candidate identity and exact evidence
      while append-only events preserve the approval audit trail without the
      passcode.
- [x] GET exposes the latest durable operation; TK-002 performs no GitHub
      mutation or merge execution.
- [x] Execution accepts only a recorded operation ID and step-up passcode from
      an authenticated session and requires a server-only GitHub token.
- [x] Atomic claim/retry handling permits at most one active merge request and
      returns an already-applied operation without another mutation.
- [x] Immediately before mutation, execution revalidates the fixed repository,
      PR state, current exact SHAs, ancestry, mergeability, and exact-SHA gate.
- [x] The mutation uses merge-commit semantics and the approved head SHA only;
      squash, rebase, force, branch deletion, and arbitrary targets are absent.
- [x] Exact already-merged crash recovery records verified remote merge SHA and
      evidence without double-merging; failures are sanitized and fail closed.
- [x] Requested, approved, executing, applied, blocked, and rejected lifecycle
      evidence is append-only and contains no passcode or GitHub token.

## Testing Seams

- Public server seam: `GET /api/captain/workbench-release` with deterministic
  mocked GitHub REST responses.
- Browser seam: Deployments view at a narrow mobile viewport.
- Step-up seam: timing-safe digest verification plus bounded per-session
  failure-state transitions.
- Persistence seam: operation insert/replay and event update/delete rejection
  against temporary SQLite databases.
- Approval seam: authenticated POST with deterministic mocked GitHub reads and
  literal success, stale, blocked, generic-input, throttled, and replay results.
- Execution seam: authenticated POST with deterministic mocked GitHub reads and
  mutation covering exact success, generic-input rejection, missing auth/token,
  stale/tampered evidence, sanitized failures, concurrent replay, idempotent
  retry, and stale-claim already-merged recovery.

## Verification Procedure

```bash
node --test test/workbenchRelease.test.js
node --test test/workbenchExecution.test.js
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs doctor
```

## Documentation Impact

- Document the fixed route, eligibility contract, operational limitations, and
  mobile read-only surface in the owning project controls.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-16 | TK-001 | Claimed in isolated branch `feature/read-only-workbench-deployment` from `origin/Integration` at `47e12b5` | Pre-change spec doctor green; task branch and worktree clean | S-004 created and projected | Red/green implementation and proof remain |
| 2026-07-16 | TK-001 | Server red/green completed | Red: route returned 404; green: 11 focused API cases cover ready plus missing passcode, missing/moved PR, divergence, unmergeability, exact-SHA mismatch, absent/failed/incomplete gate evidence | Documented narrow response and fail-closed contract | Mobile seam and full suite remained |
| 2026-07-16 | TK-001 | Mobile red/green completed | Red: Workbench release card absent; green: iPhone 13 card visible within viewport, read-only label present, zero buttons | Updated Deployments workflow and styles | Full suite remained |
| 2026-07-16 | TK-001 | Ticket closed | `npm test`: 180 discovered, 174 pass, 0 fail, 6 existing TODO; browser: 5 pass, 1 intentional desktop skip; build green; production audit 0; spec doctor and harness file checks green; live public GitHub read honestly blocked on missing promotion PR at main `dd1ed32` and integration `80d9327` | Updated BLUEPRINT, LEXICON, README, RUNBOOK, generated TASKBOARD, and S-004; `CONTRACT.md` checked, no update needed because the OpenBrain consumer contract did not change | Approval, persistence, and merge execution remain deferred to TK-002/TK-003 |
| 2026-07-16 | TK-001 | Published for independent review | Draft PR 13 targets CIC `Integration`, is mergeable, and binds remote head `878efce`; CIC `main` remains `cd6b4d7`, CIC `Integration` remains `47e12b5`, Workbench `main` remains `dd1ed32`, and Workbench `integration` remains `80d9327` | S-004 publication proof appended | Independent Auditor review and Integration merge remain |
| 2026-07-16 | TK-001 | Ready-state mobile preflight strengthened | First ready-candidate browser check exposed misleading `Reading current GitHub evidence` copy after readiness; corrected to exact-SHA current evidence and proved Auditor summary, fingerprint, HTTPS evidence link, and zero buttons. Full browser suite: 6 pass, 2 intentional desktop skips. | S-004 proof updated; no additional contract doc change | Independent Auditor review and Integration merge remain |
| 2026-07-16 | TK-001 | Auditor findings remediated with detailed PR-state revalidation and bounded GitHub reads | Red: closed and draft detailed PR fixtures incorrectly returned ready, and an unresolved fetch outlived the 100 ms regression sentinel. Green: 14/14 focused; 177/183 full Node with 6 existing TODO; browser 6 pass and 2 intentional desktop skips; build green; production audit 0; doctor, harness file/retired-plan/placeholder checks, and diff check green. Static evaluator remained unchanged from audited head `3490195` at 83.3/113, above both controls, with the same pre-existing documentation advisories. | Updated BLUEPRINT, README, RUNBOOK, generated TASKBOARD, and S-004 for open/non-draft detail checks and the explicit 10-second timeout; CONTRACT and LEXICON checked, no update needed because their contracts and vocabulary did not change | Re-run independent Auditor review on the updated remote head; approval, persistence, and merge execution remain deferred to TK-002/TK-003 |
| 2026-07-16 | TK-001 | Abort-signal audit proof added for both GitHub read phases | Red mutation removed `controller.abort()` and failed both direct and detailed phase assertions (13 pass, 2 fail); green restoration passed 15/15 focused cases | S-004 proof and generated TASKBOARD refreshed; no public or operational contract changed | Re-run independent Auditor review on the updated remote head; approval, persistence, and merge execution remain deferred to TK-002/TK-003 |
| 2026-07-16 | TK-002 | Explicitly authorized and claimed from merged `origin/Integration` at `d78ecfa` | Pre-change doctor green; registered isolated worktree and feature branch clean | S-004 status and generated Taskboard updated | Red/green approval intent, durable operation proof, full verification, and draft PR remain |
| 2026-07-16 | TK-002 | Durable approval storage red/green | Red: DB test failed because Captain operation exports did not exist. Green: fixed candidate insert, unique fingerprint replay rejection, latest operation, one approved event, and database-enforced event update/delete rejection passed in the 40-case DB suite. | Owning schema and lifecycle docs identified | Step-up and approval API remained |
| 2026-07-16 | TK-002 | Step-up and bounded throttle red/green | Red: focused test failed because `workbenchApproval.js` did not exist. Green: valid/malformed hash behavior, timing-safe match, bounded input, two-failure test window, expiry/reset, and capped key storage passed. | Security contract documented in S-004 and operational docs | Approval API remained |
| 2026-07-16 | TK-002 | Fixed approval API red/green | Red: authenticated POST cases returned 404. Green: focused cases cover session gate, step-up throttle, exact request shape, fresh ready candidate, blocked/stale candidate, replay, latest operation, hidden history without auth, exact fingerprint recomputation, and no executor. | Updated Blueprint, Lexicon, README, Runbook, S-004, and generated Taskboard; CONTRACT checked with no update needed because OpenBrain integration did not change | Full verification and publication remained |
| 2026-07-16 | TK-002 | Ticket closed | Focused 65/65; `npm test` 191 pass, 0 fail, 6 existing TODO; browser 6 pass with 2 intentional skips; build green; production audit 0 vulnerabilities; doctor, harness file/retired-plan/placeholder checks, evaluator 83.3/113 above controls, and diff check green | Owning docs updated; no UI change, passcode, database, generated build, or runtime data committed | Independent review and owner acceptance; TK-003 execution remains separately gated |
| 2026-07-16 | TK-002 | Published for independent review | Draft PR 14 targets capital-I `Integration`, is mergeable, and initially bound remote head `173dafd`; CIC `main` remained `cd6b4d7` and `Integration` remained `d78ecfa` | Publication proof appended and generated Taskboard refreshed | Independent review and owner acceptance; no merge or TK-003 execution authorized |
| 2026-07-16 | TK-003 | Explicitly authorized and claimed from merged `origin/Integration` at `d63e25b` | Pre-change doctor green; registered isolated worktree and feature branch clean | S-004 and generated Taskboard moved TK-003 to in progress | Red/green executor and remote checkpoint remained |
| 2026-07-16 | TK-003 | Core executor lifecycle red/green completed | Red: the execution route returned 404 and a tampered durable operation incorrectly executed; green: 12 focused cases cover additive migration, atomic claim, claim-bound completion, fixed request/body/auth/credential boundaries, exact gate-before-mutation ordering, merge-commit-only payload, stale evidence rejection, sanitized blocking, concurrent replay, idempotent retry, and already-merged crash recovery; every GitHub mutation was mocked | In-progress schema, configuration, and execution contracts implemented; full docs remain | Publish truthful checkpoint, complete docs, full verification, and independent exact-head review |
| 2026-07-16 | TK-003 | Full implementation verification green | `npm test`: 209 discovered, 203 pass, 0 fail, 6 existing TODO; browser: 6 pass with 2 intentional desktop skips; explicit build green; production audit 0; doctor, harness file/retired-plan/placeholder checks, evaluator 83.3/113 above controls, stale-contract search, secret-boundary search, and diff check green; no live Workbench merge was run | Updated Blueprint, Lexicon, README, Runbook, environment template, S-004, and generated Taskboard; CONTRACT checked, no update needed because the OpenBrain consumer contract did not change | Push verified checkpoint and run independent immutable-SHA review |
| 2026-07-16 | TK-003 | First immutable-SHA review found two fail-closed gaps and both were remediated | Red: `mergeable: null` produced terminal `candidate_stale`, and a closed SQLite handle exposed `database is not open`; green: the two adversarial regressions pass, and the 77-case focused executor/release/database suite is green | Blueprint, Runbook, and S-004 clarify retryable mergeability and sanitized internal errors | Full gates, fixed checkpoint, and exact new-head re-review remain |
| 2026-07-16 | TK-003 | Review-fix full gate green | `npm test`: 211 discovered, 205 pass, 0 fail, 6 existing TODO; browser 6 pass with 2 intentional desktop skips; production audit 0; evaluator unchanged at 83.3/113 above controls; harness presence/retired-plan/placeholder, doctor, and diff checks green; every merge request remained mocked | Review-fix docs and generated Taskboard refreshed | Push fixed checkpoint and exact new-head re-review remain |
| 2026-07-16 | TK-003 | Independent immutable-SHA re-review approved fixed head `db61fe0` | No findings across exact range `d63e25b..db61fe0`; both prior findings confirmed fixed; focused exact-head regressions 2/2 green; local and remote heads matched and worktree remained clean | Docs checked; no update needed because the read-only review confirmed the existing S-004, Blueprint, and Runbook contracts | Close TK-003, push final evidence, and open draft PR to `Integration` |
| 2026-07-16 | TK-003 | Ticket closed | Focused 77/77; full Node 205 pass plus 6 existing TODO; browser 6 pass plus 2 intentional desktop skips; build, audit, doctor, evaluator, diff green; immutable d63e25b..db61fe0 re-review no findings | Updated BLUEPRINT.md, LEXICON.md, README.md, RUNBOOK.md, .env.example, S-004, and generated TASKBOARD.md; CONTRACT.md checked, no update needed because OpenBrain contract was unchanged | Live execution requires operator-provided WORKBENCH_GITHUB_TOKEN and an authenticated API client; no live Workbench merge was run |
| 2026-07-16 | spec | Spec completed | Acceptance gates satisfied | Documentation impact recorded above | none |
| 2026-07-16 | TK-003 | Published for owner review | Draft PR 15 targets capital-I `Integration`, is mergeable, and initially bound remote head `73587a2`; CIC `Integration` remains exact base `d63e25b`, and CIC `main` was not touched | Publication evidence appended to completed S-004; generated Taskboard remains empty because the spec is complete | Owner review and optional merge into `Integration`; live Workbench execution still requires local token configuration and a new exact approved operation |

## Completion Result

TK-001 delivers the fixed read-only candidate and mobile card. TK-002 adds
durable, one-time approval intent with step-up authentication and revalidation.
TK-003 adds an atomic, exact-head, merge-commit-only executor with verified
remote evidence and fail-closed recovery. No generic executor exists.

## Remaining Limitations Or Follow-Up Specs

- The mobile card remains read-only; invoking approval or execution currently
  requires an authenticated API client.
- TK-003's direct-token executor is preserved as completed historical evidence;
  S-006 replaces only that executor with the credential-free Captain handoff.

## Supersession

- Supersedes: none
- Superseded by: S-006 for TK-003 direct-token/direct-merge execution only; all
  fixed candidate, approval, storage, and atomic-claim evidence remains current.
