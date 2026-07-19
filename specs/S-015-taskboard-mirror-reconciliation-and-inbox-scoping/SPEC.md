# S-015 - Taskboard Mirror Reconciliation And Inbox Scoping

> Generated from LLM Workbench v2.3.

**Spec ID:** S-015
**Status:** active
**Priority:** 1
**Owner:** CIC Engineer; Kayden (workflow acceptance)
**Updated:** 2026-07-19
**Catalog description:** Make the CIC Taskboard behave as a mirror of the real workspace, not a canonical store: scope the inbox to items genuinely blocked on Kayden, treat a card move as "agent, verify/complete this in the real workspace" (not "already done"), let Kayden attach an action when moving a card, and define done-item retention.
**Blockers:** none
**Latest event:** 2026-07-19 walkthrough (SPEC_DIARY items 20, 21, 21a, 22) found the inbox functioning as a second Gmail inbox (135 items, mostly raw email), a reconciliation gap where moving a card is wrongly read as the task being done in the real workspace, no way to attach intent/instructions on a move, and an open question about how long done items persist.
**Next gate:** TK-001 scope the inbox/queue to real blocked-on-owner items instead of mirroring the Gmail inbox.

## Outcome

The CIC Taskboard is a trustworthy mirror: its inbox shows only items actually
blocked on Kayden, moving a card signals intent to the agent ("verify/complete
this in the real workspace") rather than asserting completion, Kayden can attach
a desired action when moving a card, and done-item retention is defined and
visible.

## Why It Matters

The Taskboard tab is the best surface in CIC (item 19), which makes its
integrity failures the most costly. Today the inbox mirrors the Gmail inbox
(135 items, mostly raw messages) so the real "blocked on me" signal is buried;
and because CIC is a mirror rather than the canonical brain, treating a card move
as "done" desynchronizes CIC from the actual workspace. Kayden also had no way to
tell the agent what to do with an item (e.g., a doctor's-appointment email that
should have become a calendar event), so it just sat. Fixing the mirror contract
is the highest-value CIC change on the board.

## Current Verified State

- Tasks/cards are stored in local SQLite (`server/db.js`) and rendered by
  `src/main.jsx` / `src/taskViews.js`; card status is stored directly (e.g.,
  "Done") with no notion of "pending agent verification in the real workspace."
- Gmail suggestions are created as task cards by `server/gmail.js`, so the
  inbox/queue fills with email-derived items regardless of whether they are
  genuinely blocked on Kayden.
- There is no field to attach a requested action/instruction to a card on move.
- Done-item retention is undefined; item 22 is an open owner question.

## Desired Behavior

- The inbox/queue surfaces only items genuinely blocked on Kayden; email-derived
  items are filtered/scoped (or routed to a separate "email-derived" lane) so the
  queue is a real blocked-on-owner view, not a mirrored inbox.
- Moving a card to a "done"/advanced column sets a reconciliation state meaning
  "agent should verify/complete this in the real workspace," distinct from a
  confirmed-complete state that is only set after the workspace is reconciled.
- When Kayden moves a card he can attach a desired action/instruction (e.g.,
  "add to calendar"); when the correct action is unambiguous from context the
  agent may proceed without one.
- Done-item retention is defined (how long confirmed-done cards remain visible)
  and applied consistently.

## Decisions And Contracts

- CIC remains a mirror/control surface, never the canonical task brain; a card
  move never silently mutates the real workspace by itself.
- The reconciliation state machine is explicit: at minimum
  `blocked-on-owner` -> `owner-moved (pending agent action)` ->
  `agent-verified-complete`, with the middle state carrying any attached action.
- Move-intent is stored on the card's event trail (existing `task_events`
  pattern), not in a hidden second store.

## Non-Goals

- Building the agent side that executes the attached action (CIC records the
  intent; execution is the agent/workspace's job).
- Replacing canonical project Taskboards (BLUEPRINT already forbids a second
  canonical queue).
- Changing the Gmail summarization contract (owned by S-014); this spec scopes
  which Gmail items become blocked-on-owner cards.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Scope the inbox/queue to real blocked-on-owner items (filter/lane email-derived cards) | ready | none | pending |
| TK-002 | Reconciliation state machine: card move = pending agent verification, not done | ready | none | pending |
| TK-003 | Attach a desired action/instruction when moving a card | blocked | TK-002 | pending |
| TK-004 | Define and apply done-item retention | ready | Kayden confirms retention window | pending |

## Ticket Done Contracts

### TK-001 - Scope The Inbox To Blocked-On-Owner

Done when email-derived items no longer flood the blocked-on-owner queue — they
are filtered or moved to a distinct lane — and tests prove the queue contains
only genuinely blocked-on-owner cards for representative fixtures.

### TK-002 - Reconciliation State Machine

Done when moving a card to an advanced/done column sets a
"pending agent verification" state distinct from confirmed-complete, the model is
documented in BLUEPRINT, and tests prove a move never sets confirmed-complete
directly and emits the correct `task_events` trail.

### TK-003 - Attach Action On Move

Done when Kayden can attach a desired action/instruction when moving a card, it
is persisted on the card's event trail, and tests prove it is recorded and
surfaced for the agent to pick up.

### TK-004 - Done-Item Retention

Done when confirmed-done cards follow a defined retention window (owner-confirmed)
that is applied consistently and covered by a test.

## Acceptance Criteria

- [ ] The blocked-on-owner queue no longer mirrors the Gmail inbox.
- [ ] A card move sets "pending agent verification," never confirmed-complete
      directly.
- [ ] A move can carry an attached action recorded on the card.
- [ ] Done-item retention is defined and applied.
- [ ] CIC still stores no second canonical task queue.
- [ ] Desktop and mobile proof artifacts are recorded in spec evidence.

## Testing Seams

- Fixtures mixing genuinely blocked-on-owner items with email-derived items.
- State-machine tests for move transitions and `task_events` output.
- Retention test with clock control.

## Verification Procedure

1. Run the CIC test suite including inbox-scoping and reconciliation tests.
2. Load the Taskboard, move a card, and confirm the pending-verification state
   and attached-action capture.
3. Record desktop and mobile screenshots of the scoped queue and move flow in
   evidence.

## Evidence

| Date | Ticket | Verification | Result |
|---|---|---|---|
