# S-004 - Workbench Release Control

> Generated from LLM Workbench v2.3.

**Spec ID:** S-004
**Status:** active
**Priority:** 0
**Owner:** Kayden (product); Captain (coordination)
**Updated:** 2026-07-16
**Catalog description:** Let Kayden inspect and later approve a fixed, evidence-bound Workbench integration-to-main release from CIC without exposing a generic remote executor.
**Blockers:** TK-002 requires explicit implementation authorization after TK-001 review.
**Latest event:** TK-001 closed with fail-closed API proof, mobile browser proof, and no mutation surface.
**Next gate:** Review the draft PR into Integration; authorize TK-002 separately if the read-only contract is accepted.

## Outcome

CIC gives Kayden a narrow mobile release surface for the canonical Workbench
while keeping GitHub source truth, passcode protection, exact-SHA audit proof,
and the owner-only integration-to-main gate explicit.

## Current Verified State

CIC has an authenticated private-app boundary and a responsive Deployments
view, but it does not yet expose a Workbench release candidate. Workbench
release state currently requires manual GitHub inspection.

## Desired Behavior

- `GET /api/captain/workbench-release` returns one fixed read-only candidate and
  the latest durable operation, if any.
- The only repository and branch direction is
  `KaydenClark/LLM_Workbench` `integration` to `main`.
- A candidate is ready only when the local passcode is configured, exactly one
  matching open PR exists, its head/base SHAs remain current, `main` is an
  ancestor of `integration`, GitHub reports the PR mergeable, and the exact
  integration SHA has a successful `gptos/workbench-release-gate` status.
- The release-gate status must include an evidence target URL and an Auditor
  summary. Its GitHub status ID binds the candidate fingerprint.
- The mobile Deployments view shows the candidate truth without offering any
  mutation or approval control in TK-001.

## Decisions And Contracts

- Candidate fingerprint is SHA-256 of
  `repository | mainSha | integrationSha | prNumber | releaseGateStatusId`.
- Missing, stale, ambiguous, divergent, unmergeable, failed, or unavailable
  evidence blocks readiness instead of being treated as healthy.
- TK-001 performs GitHub reads only. It has no POST route, generic executor,
  remote mutation, or local operation persistence.
- `latestOperation` is `null` until a later ticket adds the durable Captain
  operation lifecycle.

## Non-Goals

- Merging the Workbench release PR.
- Accepting an approval, passphrase, arbitrary repository, branch, command, or
  URL from the browser.
- Making CIC remotely reachable or changing credentials.

## Dependencies And Blockers

- none

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Fixed read-only Workbench candidate API and mobile Deployments card | done | none | 11 focused API cases; 174/180 Node pass with 6 existing TODO; mobile browser proof; build/audit/doctor green |
| TK-002 | SHA-bound one-time owner approval and durable Captain operation | deferred | TK-001 and explicit implementation authorization | pending |
| TK-003 | Execute and verify the exact GitHub merge with replay protection | deferred | TK-002 and owner acceptance | pending |

## Acceptance Criteria

- [x] The read endpoint uses only the fixed Workbench repository and branch direction.
- [x] Candidate readiness fails closed for missing passcode, divergence, missing or moved PR, unmergeable PR, and missing or failed exact-SHA Auditor status.
- [x] The successful candidate includes the specified fingerprint, evidence URL, and Auditor summary.
- [x] The mobile Deployments view presents candidate state without a mutation control.
- [x] GitHub and `main` remain unchanged by TK-001.

## Testing Seams

- Public server seam: `GET /api/captain/workbench-release` with deterministic
  mocked GitHub REST responses.
- Browser seam: Deployments view at a narrow mobile viewport.

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

## Completion Result

TK-001 delivers the fixed read-only candidate and mobile card. It contains no
approval route, operation write, generic executor, or GitHub mutation.

## Remaining Limitations Or Follow-Up Specs

- TK-001 is intentionally read-only. Approval and execution remain separate
  future tickets with their own authorization and proof.

## Supersession

- Supersedes: none
- Superseded by: none
