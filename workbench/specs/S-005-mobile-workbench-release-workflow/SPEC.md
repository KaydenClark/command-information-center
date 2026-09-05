# S-005 - Mobile Workbench Release Workflow

> Generated from LLM Workbench v2.3.

**Spec ID:** S-005
**Status:** active
**Priority:** 2
**Owner:** Kayden (owner acceptance)
**Updated:** 2026-08-18
**Catalog description:** Let Kayden safely approve and execute the fixed Workbench integration-to-main release from one private, phone-ready CIC card.
**Blockers:** none (owner phone acceptance received 2026-07-20)
**Latest event:** 2026-08-18: its remaining mechanical green gate is folded into S-027/TK-007 so v1.0.1 preserves the already-accepted private phone workflow while replacing the surrounding operator surface.
**Next gate:** Complete S-027/TK-007's full production green gate, then close this historical mobile workflow without a second deployment pass.

## Outcome

Kayden can use the existing CIC Workbench card from a phone to inspect current
exact-SHA evidence, approve that fixed candidate, and separately execute the
recorded approval without opening a generic GitHub control surface or exposing
CIC publicly.

## Why It Matters

S-004 delivered the fixed read, approval, and execution contracts, but did not
connect them to the mobile card. This capability makes the owner gate practical
away from the Mac Mini while preserving two deliberate authorizations, current
GitHub truth, and the private Meshnet boundary.

## Current Verified State

- S-004 is complete on `Integration` and exposes exactly these authenticated
  endpoints:
  - `GET /api/captain/workbench-release`
  - `POST /api/captain/workbench-release/approval`
  - `POST /api/captain/workbench-release/execution`
- The Deployments view now renders one responsive Workbench card with fixed
  identity, candidate evidence, Auditor link, fingerprint, latest operation,
  and one state-appropriate approval, execution, retry, or refresh action.
- The GET response includes the latest durable operation. Approval accepts only
  `{fingerprint, passcode}`; Captain handoff accepts only `{operationId, passcode}`.
- CIC runs on the always-on Mac Mini and is intended to be reached privately
  from Kayden's phone through NordVPN Meshnet, not a public deployment.
- `CIC_RUNTIME_ROOT` now provides a fail-fast bootstrap seam for serving code
  from an isolated worktree while `.env`, SQLite, feed, project discovery, and
  platform-health paths remain anchored to the canonical runtime directory.

## Desired Behavior

### One Existing Card

- Extend the existing Workbench card; do not add a second release card, modal
  workflow, operation-history surface, or separate deployment page.
- Keep four readable sections in the card:
  1. fixed identity: `KaydenClark/LLM_Workbench`, `integration` to `main`;
  2. current evidence: PR, short current SHAs, Auditor summary/link,
     fingerprint, and last successful refresh time;
  3. latest durable operation and its current status/evidence;
  4. exactly one state-appropriate action area.
- Every displayed target comes from the fixed GET response. No browser field or
  query parameter may select a repository, branch, PR, SHA, merge mode,
  command, URL, token, or operation history.

### Separate Owner Authorizations

- A ready, unapproved candidate shows one passphrase field and an action whose
  accessible name identifies the exact short integration SHA, for example
  `Approve exact SHA abc1234`.
- Approval submits only the displayed current fingerprint and that passphrase.
  Its success must say GitHub is unchanged and must not imply execution.
- After approval, clear the first passphrase from component state and the DOM.
  Show a new, distinct Captain handoff passphrase field and a `Send approved
  release to Captain` action bound only to `latestOperation.id`.
- One tap, form submission, callback, or retained secret must never both approve
  and execute. Execution always requires a fresh second passphrase entry.
- Clear passphrases after every response, on session loss, and when leaving the
  workflow. Never persist, log, place in a URL, include in analytics, or capture
  either passphrase in screenshots or demo evidence.

### State Matrix

| State | Evidence and action contract |
|---|---|
| checking | Show fixed identity plus a checking state; disable mutation controls. |
| refresh failed with prior evidence | Preserve the visibly stale prior evidence and latest operation; show the refresh failure and only a refresh action. |
| candidate blocked | Show the server reason and current evidence when present; offer refresh only and no approval/execution mutation. |
| ready, unapproved | Show exact current evidence, one step-up field, and `Approve exact SHA <short SHA>`; approval does not merge. |
| approved | Show the durable approved operation and explicit `GitHub unchanged`; clear approval secret, then show a separate execution field/action. |
| executing | Disable duplicate actions and poll GET sequentially with no overlapping requests for at most 60 seconds; after the bound, stop automatically and offer manual refresh. |
| execution blocked | Permit retry only when a fresh GET still has the same candidate fingerprint as the operation and after a new step-up entry; otherwise refresh/new approval is required. |
| rejected | Treat as terminal for that operation; explain that current evidence requires a new approval and never offer execution retry. |
| applied or already applied | Show the verified merge SHA/link from the durable operation and no second merge action. |
| session expired | Clear both passphrase states immediately and return the card to a locked/login-required state. |
| step-up throttled | Honor the server `Retry-After`, keep mutation disabled through the bounded wait, and never automatically resubmit a passphrase. |

Refreshing means one GET re-read. It must not approve, execute, or silently
replace a visible durable operation with an optimistic client-only state.

### Mobile And Accessibility Contract

- Primary interactive controls have at least a 44 by 44 CSS-pixel target;
  passphrase inputs render at 16 CSS pixels or larger to avoid iPhone zoom.
- The card, evidence links, forms, and status text do not overflow an iPhone 13
  viewport. Long SHAs/fingerprints wrap or truncate with an accessible full
  value.
- Every field has a visible label; focus moves to the result/status region after
  approval or execution; material async changes use an appropriate `aria-live`
  region without repeatedly announcing polling noise.
- Reuse the existing SLK visual language and Lucide icons. Do not use emoji as
  controls or invent a new mobile design system.

### Private Phone Acceptance

- Phone acceptance uses the Mac Mini's passcode-protected CIC service through
  NordVPN Meshnet only. Do not expose CIC through a public URL, public tunnel,
  router port-forward, or unauthenticated LAN address.
- Replace or neutralize user-facing `Local LAN` framing touched by this workflow
  so the documented phone route is private Meshnet access.
- TK-002 records a secret-free, under-one-minute owner demo artifact from the
  phone covering login, exact evidence, separate approval/execution steps, and
  the resulting durable state/merge link when an owner-approved live candidate
  is available. Automated tests continue to mock all merge requests.

## Decisions And Contracts

- S-005 consumes the S-004 fixed read, approval, storage, and atomic-claim
  contracts. S-006 replaces only S-004 TK-003's direct-token mutation with the
  credential-free Captain handoff; no endpoint, database schema, or target
  selector changes.
- Fixed target remains `KaydenClark/LLM_Workbench` `integration` to `main`.
- The GET response is the only card source of candidate and operation truth;
  client state owns only transient form, refresh, polling, focus, and countdown
  state.
- Approval and execution are two independently submitted step-up operations.
  A newly approved operation never triggers execution automatically.
- At most one request is in flight per action or poll lane. Buttons remain
  disabled while their request is unresolved.
- Sequential execution polling stops after 60 seconds. A timeout is an honest
  unresolved state, not failure or success, and requires manual refresh.
- A blocked operation is retryable only when the current fixed fingerprint
  still matches; rejected is terminal; applied/already-applied is idempotent and
  never presents another merge action.
- `Retry-After` controls the throttled wait. The client never guesses a shorter
  delay or automatically resubmits credentials.
- No token value, passphrase, generic target, or operation history is rendered
  or stored by the browser.
- `CIC_RUNTIME_ROOT` is injected before startup, must name an absolute existing
  directory, and never changes the source checkout used for code or built
  assets. Dotenv cannot set or redirect it; symlinks resolve once to the real
  directory, and later local environment writes stay pinned to that selected
  path. Invalid values fail without echoing the supplied path.

## Non-Goals

- Changing the three API request bodies, SQLite schema, or auth/session model.
- Adding a generic GitHub client, arbitrary repository/branch/command controls,
  squash/rebase/force/delete options, or an operation-history browser.
- Combining approval and execution into one control or reusing the first
  passphrase for execution.
- Making CIC public, adding a public tunnel, or replacing Meshnet with open LAN
  access.
- Performing a live Workbench merge during TK-001 implementation, automated
  browser tests, or Planner verification.

## Dependencies And Blockers

- TK-001 depends on the complete S-004 GET, approval, and execution contracts
  already present on `Integration`.
- TK-002 depends on TK-001, S-006, the always-on Mac Mini service, phone Meshnet
  access, a configured CIC passcode, and current candidate readiness. Secrets
  are setup inputs, never test or evidence artifacts.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Mobile fixed-release control UI | done | none | Independent exact-range review PASS: 86bdaa5baa865901121b9061f7b6e185eddde3d2..6551e757db582f32eb23bc14519373e9c0aa1c6a; no unresolved in-scope findings. |
| TK-002 | Private phone acceptance over Meshnet | ready | none | Owner phone acceptance received 2026-07-20 (Kayden confirmed authenticated private Meshnet access from a phone in-session). Runtime-root review findings are repaired, S-006 is integrated, and the reviewed Integration build is running on the private service. Only the mechanical green-gate verification suite remains. |

## Ticket Done Contracts

### TK-001 - Mobile Fixed-Release Control UI

Done when the existing card implements the full state matrix and separate
approval/execution forms using only the three existing endpoints. Closing proof
must include mutation-sensitive browser mocks for every material state,
passphrase clearing/separation, no duplicate or automatic mutation, bounded
sequential polling, `Retry-After`, session expiry, fixed request bodies, and
iPhone 13 accessibility/overflow checks. No live merge is part of this ticket.

### TK-002 - Private Phone Acceptance Over Meshnet

Done when the completed workflow passes the full project gates and Kayden can
use the passcode-protected Mac Mini service privately from a phone over Meshnet.
Closing proof includes the Meshnet/private-route documentation, neutralized
`Local LAN` copy, and a secret-free under-one-minute owner demo artifact. Any
live approval/execution requires Kayden's current exact candidate and explicit
presence; no automated or unattended live merge is authorized.

## Acceptance Criteria

- [x] The existing Workbench card exposes fixed identity, current evidence,
      latest durable operation, last refresh, and one state-appropriate action.
- [x] The UI uses only the existing GET, approval, and execution endpoints with
      their exact fixed request bodies.
- [x] Ready approval and approved execution require two separate fresh
      passphrase entries; one tap cannot perform both operations.
- [x] Checking, refresh-failed, blocked, ready, approved, executing,
      execution-blocked, rejected, applied/already-applied, session-expired, and
      throttled states satisfy the state matrix without optimistic truth.
- [x] Candidate/operation mismatch removes execution retry; applied state shows
      verified merge evidence and cannot issue a second merge.
- [x] Polling is sequential, bounded to 60 seconds, and hands control to manual
      refresh without overlapping or silently continuing.
- [x] No token, passphrase, repository, branch, target, command, mode, URL, or
      operation-history input is exposed, persisted, logged, or captured.
- [x] Mobile controls, input sizing, focus, live status, long evidence, and
      iPhone 13 layout meet the accessibility and no-overflow contract.
- [x] Phone acceptance uses authenticated private Meshnet access to the Mac Mini
      with no public exposure. Owner accepted 2026-07-20 based on live in-session
      confirmation of authenticated private phone access; Kayden waived the
      separately recorded under-one-minute clip in favor of the in-session
      confirmation.
- [ ] Node, browser, build, production audit, spec doctor, harness, evaluator,
      diff, and secret-boundary checks are green before S-005 completion.

## Testing Seams

- Browser seam: Playwright mobile workflow with deterministic mocks for the GET,
  approval, and execution endpoints; request bodies and mutation counts are
  asserted directly.
- State seam: component-visible checking, stale refresh, candidate, operation,
  throttled, session, polling, and focus transitions driven without live GitHub.
- Layout seam: iPhone 13 viewport bounding boxes, 44-pixel controls, 16-pixel
  passphrase inputs, long-SHA/fingerprint wrapping, and zero horizontal overflow.
- Safety seam: adversarial tests prove generic control fields and secrets never
  enter URLs, rendered history, storage, logs, screenshots, or a combined action.
- Acceptance seam: passcode-protected phone access through Mac Mini Meshnet with
  a secret-free under-one-minute owner-checkable artifact.

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

Also run the harness presence/retired-plan/placeholder checks and Workbench
static evaluator from `RUNBOOK.md`. TK-002 records the exact private phone URL
form without credentials and the owner demo artifact location in this spec.

## Documentation Impact

- Planning creates S-005 and its generated Blueprint catalog/Taskboard
  projection only.
- TK-001 owns Blueprint, README, and Runbook updates for the implemented mobile
  workflow; check Lexicon and CONTRACT and record when no change is needed.
- TK-002 owns private Meshnet phone instructions, replacement of touched `Local
  LAN` language, the isolated-source/canonical-runtime operation seam,
  owner-demo evidence, and final acceptance proof.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-16 | spec | Planner work packet created from exact `Integration` SHA `6636eaf` | Existing S-004 APIs, read-only card, browser seams, Blueprint, Lexicon, Runbook, and spec lifecycle inspected; scope contains exactly TK-001 and TK-002 | Created stable S-005; generated Blueprint catalog and Taskboard projection pending | Render/doctor/diff, remote Planner checkpoint, and draft PR remain |
| 2026-07-16 | spec | Planner work packet verified | `render`, `doctor`, `next --json`, and diff check green; next selects S-005/TK-001; no source, API, schema, environment, runtime, or test file changed | Blueprint catalog and Taskboard projection generated from S-005; README, Runbook, Lexicon, and CONTRACT checked with no update needed because behavior is not implemented in the Planner checkpoint | Commit/push exact Planner recovery point and open draft PR to `Integration` |
| 2026-07-16 | TK-001 | UI-only fixed-release state machine implemented and locally verified | Red failure observed against the read-only card; focused mocked iPhone 13 suite `6 passed`; full Playwright `10 passed, 6 skipped`; Node `205 passed, 6 todo`; targeted release `23 passed`; targeted execution `14 passed`; build and production audit green; no live merge or unmocked mutation ran | Updated Blueprint, README, Runbook, S-005, and generated Taskboard; neutralized visible `Local LAN` label to `Private host`; Lexicon and CONTRACT checked with no update needed because shared terms and public endpoint contracts are unchanged | Push immutable checkpoint, separate exact-SHA code review, and any review fixes; TK-002 owner phone acceptance remains deferred |
| 2026-07-16 | TK-001 review repair | Repaired both immutable review findings without changing API or server scope | Red browser proof reproduced a GET starting outside the 60-second window and missing terminal live announcements; focused repair suite `2 passed`; full Playwright `11 passed, 7 skipped`; Node `205 passed, 6 todo`; targeted release `23 passed`; targeted execution `14 passed`; build, production audit, harness, evaluator, and diff checks green | Updated S-005 and generated Taskboard; Blueprint, README, Runbook, Lexicon, and CONTRACT checked with no update needed because the established product and endpoint contracts are unchanged | Push the repaired immutable checkpoint and obtain separate exact-head re-review; TK-001 stays in progress and TK-002 stays deferred |
| 2026-07-16 | TK-001 | Ticket closed | Independent exact-range review PASS: 86bdaa5baa865901121b9061f7b6e185eddde3d2..6551e757db582f32eb23bc14519373e9c0aa1c6a; no unresolved in-scope findings. | Updated S-005 lifecycle evidence and generated Taskboard; Docs checked; no update needed for Blueprint, README, Runbook, Lexicon, or CONTRACT because reviewed behavior and public contracts are unchanged. | TK-002 private phone acceptance over Meshnet and final current-head docs recheck remain. |
| 2026-07-16 | TK-002 runtime blocker | Added a validated `CIC_RUNTIME_ROOT` seam so reviewed source can run from an isolated worktree while canonical ignored state and sibling topology stay in place | Red: three focused failures proved runtime paths, env writes, and invalid-root rejection were absent; green: config `17 passed`; Node `209 passed, 6 todo`; Playwright `11 passed, 7 skipped`; temporary isolated-runtime API smoke returned all eight required state fields and created SQLite only below the temporary runtime root; build, production audit, spec doctor, harness, evaluator `83.3/113` above both controls, and diff checks green | Updated `.env.example`, Blueprint, README, Runbook, S-005, and generated Taskboard; Lexicon and CONTRACT checked with no update needed because no shared vocabulary or public API changed | Push immutable checkpoint, obtain separate exact-head review, merge to `Integration`, then migrate the Mac Mini service and complete the private phone owner demo; TK-002 remains in progress |
| 2026-07-16 | TK-002 review repair | Repaired both immutable runtime-root findings: dotenv cannot import the process-only bootstrap, later environment writes require the selected config path, and symlink roots canonicalize before sibling derivation | Red: three focused failures reproduced dotenv redirect, mutable-root write redirect, and symlink-topology drift; green: config `20 passed`; Node `212 passed, 6 todo`; Playwright `11 passed, 7 skipped`; a symlinked temporary-runtime API smoke returned all eight required state fields and created SQLite only in the canonical target; build, production audit, spec doctor, harness, evaluator `83.3/113` above both controls, diff, and secret checks green | Clarified process-only, canonicalized, pinned-write semantics in README, Runbook, and S-005; `.env.example`, Blueprint, Lexicon, and CONTRACT checked with no update needed because the established variable, architecture, vocabulary, and public API remain unchanged | Push repaired exact head and obtain independent re-review; runtime migration and owner phone proof remain |
| 2026-07-16 | TK-002 dependency | Owner workflow routed through S-006 credential-free Captain handoff | Completed TK-001 UI proof and TK-002 runtime-root proof preserved; S-006 changes only the server execution boundary and corresponding UI wording | S-005 dependency, state, and next gate updated without rewriting completed evidence | Complete S-006 review/Integration, then resume runtime migration and owner phone proof |
| 2026-07-16 | TK-002 service migration | Advanced the registered `runtime-integration-v2` private-service worktree from `41063f1` to reviewed Integration build `79e04de` and restarted `com.kayden.cic` | Clean detached worktree; `npm ci` completed with zero audited vulnerabilities; production build emitted `index-B3-0VuFY.js`; LaunchAgent running as PID 6199; unauthenticated `/api/auth/status` correctly returned `authRequired: true`; served asset contains `Project Release Portfolio`, `No open PR needed`, and `already released on main` | Updated S-005 and generated Taskboard to remove the completed migration from the blocker and next gate | Owner phone acceptance over authenticated private Meshnet remains |
| 2026-07-20 | TK-002 owner acceptance | Kayden confirmed authenticated private CIC access from a phone over Meshnet during a live session; owner-acceptance blocker cleared | Owner acceptance is the acceptance authority for this gate. Confirmation is the owner's live in-session statement of authenticated private phone access; no separate under-one-minute clip was recorded (owner waived it). No green-gate verification suite was re-run in this session. | Cleared the `Blockers` field, TK-002 blocker, and the phone-access acceptance checkbox in S-005; updated latest event and next gate; regenerated the Taskboard projection. Promoted on branch `docs/s005-owner-phone-acceptance` (PR into `Integration`). | Mechanical green-gate verification suite (node/browser/build/audit/doctor/harness/evaluator/diff/secret) must run green before S-005 completion; this is an engineer task, not an owner decision |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- S-005 does not create an operation-history UI or general-purpose GitHub control.
- Additional mobile Captain actions, public deployment, or alternate remote
  access methods require separate settled specs.

## Supersession

- Supersedes: none
- Superseded by: none
