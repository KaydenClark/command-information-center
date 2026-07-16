# S-005 - Mobile Workbench Release Workflow

> Generated from LLM Workbench v2.3.

**Spec ID:** S-005
**Status:** active
**Priority:** 0
**Owner:** Engineer TK-001
**Updated:** 2026-07-16
**Catalog description:** Let Kayden safely approve and execute the fixed Workbench integration-to-main release from one private, phone-ready CIC card.
**Blockers:** none
**Latest event:** TK-001's two immutable review findings are repaired with green focused and full browser proof; the ticket remains in progress for exact-head re-review.
**Next gate:** Push the repaired checkpoint and obtain a green separate exact-head re-review; keep TK-001 in progress and TK-002 deferred.

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
  `{fingerprint, passcode}`; execution accepts only `{operationId, passcode}`.
- CIC runs on the always-on Mac Mini and is intended to be reached privately
  from Kayden's phone through NordVPN Meshnet, not a public deployment.

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
  Show a new, distinct execution passphrase field and an `Execute approved
  release` action bound only to `latestOperation.id`.
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

- S-005 consumes the S-004 contracts unchanged. It adds no endpoint, database
  schema, credential, target selector, or alternate execution path.
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

## Non-Goals

- Changing the three S-004 API contracts, SQLite schema, auth/session model, or
  server-side GitHub token configuration.
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
- TK-002 depends on TK-001, the always-on Mac Mini service, phone Meshnet access,
  a configured CIC passcode, and owner-controlled local GitHub token/candidate
  readiness. Secrets are setup inputs, never test or evidence artifacts.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Mobile fixed-release control UI | in-progress | none | pending |
| TK-002 | Private phone acceptance over Meshnet | deferred | TK-001 | pending |

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
- [ ] Phone acceptance uses authenticated private Meshnet access to the Mac Mini
      with no public exposure and leaves a secret-free owner demo under one minute.
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
  LAN` language, owner-demo evidence, and final acceptance proof.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-16 | spec | Planner work packet created from exact `Integration` SHA `6636eaf` | Existing S-004 APIs, read-only card, browser seams, Blueprint, Lexicon, Runbook, and spec lifecycle inspected; scope contains exactly TK-001 and TK-002 | Created stable S-005; generated Blueprint catalog and Taskboard projection pending | Render/doctor/diff, remote Planner checkpoint, and draft PR remain |
| 2026-07-16 | spec | Planner work packet verified | `render`, `doctor`, `next --json`, and diff check green; next selects S-005/TK-001; no source, API, schema, environment, runtime, or test file changed | Blueprint catalog and Taskboard projection generated from S-005; README, Runbook, Lexicon, and CONTRACT checked with no update needed because behavior is not implemented in the Planner checkpoint | Commit/push exact Planner recovery point and open draft PR to `Integration` |
| 2026-07-16 | TK-001 | UI-only fixed-release state machine implemented and locally verified | Red failure observed against the read-only card; focused mocked iPhone 13 suite `6 passed`; full Playwright `10 passed, 6 skipped`; Node `205 passed, 6 todo`; targeted release `23 passed`; targeted execution `14 passed`; build and production audit green; no live merge or unmocked mutation ran | Updated Blueprint, README, Runbook, S-005, and generated Taskboard; neutralized visible `Local LAN` label to `Private host`; Lexicon and CONTRACT checked with no update needed because shared terms and public endpoint contracts are unchanged | Push immutable checkpoint, separate exact-SHA code review, and any review fixes; TK-002 owner phone acceptance remains deferred |
| 2026-07-16 | TK-001 review repair | Repaired both immutable review findings without changing API or server scope | Red browser proof reproduced a GET starting outside the 60-second window and missing terminal live announcements; focused repair suite `2 passed`; full Playwright `11 passed, 7 skipped`; Node `205 passed, 6 todo`; targeted release `23 passed`; targeted execution `14 passed`; build, production audit, harness, evaluator, and diff checks green | Updated S-005 and generated Taskboard; Blueprint, README, Runbook, Lexicon, and CONTRACT checked with no update needed because the established product and endpoint contracts are unchanged | Push the repaired immutable checkpoint and obtain separate exact-head re-review; TK-001 stays in progress and TK-002 stays deferred |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- S-005 does not create an operation-history UI or general-purpose GitHub control.
- Additional mobile Captain actions, public deployment, or alternate remote
  access methods require separate settled specs.

## Supersession

- Supersedes: none
- Superseded by: none
