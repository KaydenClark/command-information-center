# S-013 - Transparent Priority Ranking

> Generated from LLM Workbench v2.3.

**Spec ID:** S-013
**Status:** active
**Priority:** 3
**Owner:** CIC Engineer; Kayden (ranking acceptance)
**Updated:** 2026-07-19
**Catalog description:** Make the "Priority Task" widget and the Briefing "Priority Actions" ranking explainable and correct, so Kayden can see why an item ranked where it did and dispute it.
**Blockers:** none
**Latest event:** 2026-07-19 walkthrough (SPEC_DIARY items 11, 18) questioned "triage 24 open GitHub PRs" surfacing as the top priority and disputed a DigitalTome item ranking #2 in Priority Actions, with no visibility into how priority is scored.
**Next gate:** TK-001 expose the priority score/reasoning behind each ranked item.

## Outcome

Every ranked item in the Priority Task widget and the Briefing Priority Actions
list shows why it ranked where it did (the factors and score behind it), and the
ranking reflects rules Kayden agrees with rather than an opaque or noisy signal.

## Why It Matters

The priority surfaces are supposed to tell Kayden what to do next, but he cannot
tell why "triage 24 open GitHub PRs" is #1 or why a DigitalTome item is #2, and
he disputes both. If the ranking is not transparent and defensible, the widget
is noise he learns to ignore, defeating its purpose.

## Current Verified State

- Task/suggestion priority is derived from a simple Gmail-tag mapping
  (`priorityForGmailTag` in `server/dataFeed.js`: MONEY -> P2, etc.) and stored
  per task (`server/db.js`), with priority values limited to P1/P2/P3.
- The "top priority" and Briefing "Priority Actions" surfaces select/order items
  from this data in `src/main.jsx`; there is no exposed scoring rationale and no
  richer signal than tag/priority ordering.
- There is no per-item "why this ranked here" explanation in the UI.

## Desired Behavior

- The ranking uses a defined, documented scoring model (the factors and their
  weights) rather than an implicit ordering.
- Each ranked item exposes its rationale: the factors that lifted or lowered it
  (e.g., priority tag, age, source, blocked-on-owner status).
- The model is tunable enough that Kayden's disputed cases (PR-triage as #1,
  DigitalTome as #2) resolve to rankings he accepts, and the model is recorded so
  changes are auditable.

## Decisions And Contracts

- The scoring model is documented in BLUEPRINT/spec so it is inspectable, not
  hidden in ad hoc UI ordering.
- Ranking consumes existing task/feed data; it does not invent new priority
  signals or a second task store.
- Owner-disputed rankings are treated as model bugs to fix, not one-off
  overrides.

## Non-Goals

- Rebuilding the task data model or the Taskboard mirror contract (owned by
  S-015).
- Auto-executing the top priority item.
- A machine-learned ranker; a transparent rule/weight model is sufficient.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Documented scoring model with per-item rationale surfaced in the UI | ready | none | pending |
| TK-002 | Tune the model so owner-disputed cases resolve to accepted rankings | blocked | TK-001; Kayden confirms desired ordering | pending |

## Ticket Done Contracts

### TK-001 - Scoring Model And Per-Item Rationale

Done when priority ordering is computed by a documented scoring function whose
factors and weights are recorded, each ranked item exposes its contributing
factors in the UI, and deterministic tests prove the ordering follows the
documented model for representative inputs.

### TK-002 - Resolve Owner-Disputed Rankings

Done when the disputed cases (PR-triage as top, DigitalTome as #2) are re-scored
under the tuned model to an ordering Kayden accepts, with the model change
recorded and covered by a regression test.

## Acceptance Criteria

- [ ] Each ranked item shows the factors behind its rank.
- [ ] The scoring model (factors + weights) is documented and inspectable.
- [ ] The disputed cases resolve to owner-accepted rankings.
- [ ] Ranking uses only existing task/feed data, no second store.
- [ ] Desktop and mobile proof artifacts are recorded in spec evidence.

## Testing Seams

- Fixture task/feed sets with known expected ordering.
- Regression fixtures for the disputed PR-triage and DigitalTome cases.

## Verification Procedure

1. Run the CIC test suite including ranking-model tests.
2. Load the dashboard and confirm per-item rationale renders.
3. Record screenshots of the ranked widgets with rationale in evidence.

## Evidence

| Date | Ticket | Verification | Result |
|---|---|---|---|
