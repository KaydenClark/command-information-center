# S-004 - Workbench Release Control

> Generated from LLM Workbench v2.3.

**Spec ID:** S-004
**Status:** active
**Priority:** 0
**Owner:** Kayden (product); Captain (coordination)
**Updated:** 2026-07-16
**Catalog description:** Let Kayden inspect and later approve a fixed, evidence-bound Workbench integration-to-main release from CIC without exposing a generic remote executor.
**Blockers:** none
**Latest event:** TK-002 is complete with a fixed, timing-safe, throttled, replay-resistant approval-intent API and durable append-only evidence; no executor exists.
**Next gate:** Independent review and owner acceptance; TK-003 requires separate authorization before any GitHub mutation.

## Outcome

CIC gives Kayden a narrow mobile release surface for the canonical Workbench
while keeping GitHub source truth, passcode protection, exact-SHA audit proof,
and the owner-only integration-to-main gate explicit.

## Current Verified State

CIC has an authenticated private-app boundary, a responsive read-only
Deployments candidate, and a server-only approval-intent route. The route stores
one fixed candidate operation and append-only audit event; no merge executor
exists.

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

## Decisions And Contracts

- Candidate fingerprint is SHA-256 of
  `repository | mainSha | integrationSha | prNumber | releaseGateStatusId`.
- Missing, stale, closed, draft, ambiguous, divergent, unmergeable, failed,
  unavailable, or timed-out evidence blocks readiness instead of being treated
  as healthy. Every GitHub read has a bounded timeout.
- Candidate reads and approval revalidation perform GitHub reads only. Neither
  route has a generic executor or remote mutation.
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

## Non-Goals

- Merging the Workbench release PR.
- Accepting an arbitrary repository, branch, command, or URL from the browser.
- Adding a Deployments approval UI; TK-002 establishes the authenticated server
  contract only.
- Making CIC remotely reachable or changing credentials.

## Dependencies And Blockers

- none

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Fixed read-only Workbench candidate API and mobile Deployments card | done | none | 15 focused API cases including detailed PR state and direct/detailed abort-signal proof; mobile browser proof; full Node/browser/build/audit/doctor green |
| TK-002 | SHA-bound one-time owner approval and durable Captain operation | done | none | red/green focused 65/65; full Node 191 pass + 6 existing TODO; browser 6 pass + 2 expected skips; build/audit/doctor/evaluator/diff green |
| TK-003 | Execute and verify the exact GitHub merge with replay protection | deferred | TK-002 and owner acceptance | pending |

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

## Verification Procedure

```bash
node --test test/workbenchRelease.test.js
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
| 2026-07-16 | TK-002 | Ticket closed | Focused 65/65; `npm test` 191 pass, 0 fail, 6 existing TODO; browser 6 pass with 2 intentional cross-project skips; build green; production audit 0 vulnerabilities; doctor, harness file/retired-plan/placeholder checks, evaluator 83.3/113 above controls, and diff check green | Owning docs updated; no UI change, passcode, database, generated build, or runtime data committed | Independent review and owner acceptance; TK-003 execution remains separately gated |

## Completion Result

TK-001 delivers the fixed read-only candidate and mobile card. TK-002 adds
durable, one-time approval intent with step-up authentication and revalidation.
No generic executor or GitHub mutation exists.

## Remaining Limitations Or Follow-Up Specs

- The mobile card remains intentionally read-only; TK-002 exposes only the
  authenticated server approval seam.
- Execution remains TK-003 with separate owner acceptance and must revalidate
  the exact candidate again before any GitHub mutation.

## Supersession

- Supersedes: none
- Superseded by: none
