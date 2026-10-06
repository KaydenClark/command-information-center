# S-000B - CIC Blueprint Teardown

> Generated from LLM Workbench v3.2.1. Lifecycle moves use the link-safe
> `move-spec` operation after its gates pass, never a manual folder move.

**Spec ID:** S-000B
**Status:** planned
**Priority:** 1
**Owner:** Claude; Kayden (destination answers)
**Stance:** Builder
**Updated:** 2026-10-05
**Catalog description:** Replace CIC's stale eight-section Blueprint with the four-part short page, its Destination Decision Records and landmarks, confirmed through a saved grilling with the owner.
**Blockers:** S-000A
**Latest event:** Spec captured.
**Next gate:** S-000A merged into `Integration`; then draft the decision map from CIC's own context and open the grilling notepad.

## Outcome

CIC has a confirmed destination: a four-part short-page `BLUEPRINT.md` (what
it is, who it serves, promised outcomes, non-goals), accepted Destination
Decision Records in `workbench/docs/ddr/`, and landmarks grouping them, each
written from answers the owner locked in a one-question-at-a-time grilling.

## Why It Matters

The owner asked on 2026-10-05 to tear down the CIC Blueprint and create its
decision records and landmarks the way the Workbench's own Blueprint teardown
did, and said everything on CIC can be assumed stale. The current 452-line
Blueprint, last reviewed 2026-08-18, mixes destination, architecture,
contracts and build order, and still describes CIC as a Foundry control
surface.

## Current Verified State

After S-000A (Workbench v3.2.1 Update), the room has `notepads.mjs`, the
`notepads` collection and an empty `docs/ddr` collection with `proposed/` and
`archive/`. No DDR, ADR or landmark record exists. The Blueprint's Non-Goals
and Design Decisions sections are the richest destination sources; its
Architecture, Directory Map, Main Contracts and Core Logic sections are
architecture or reference content whose new home the grilling decides.

## Desired Behavior

1. Setup drafts, grilling confirms: from CIC's own context only (Blueprint,
   specs, README, `CONTRACT.md`, `SPEC_DIARY.md`, `docs/`, tests), draft the
   short page, candidate destination decisions each with its CIC source, and
   candidate landmarks. Every candidate starts unconfirmed.
2. A grilling notepad in the declared notepads collection holds the decision
   map with every question open; answers, readbacks and corrections are saved
   as they arrive, and only an explicitly confirmed answer is locked.
3. Early questions include what CIC is for now, who it serves, and whether it
   still heads toward the Foundry control surface; that answer decides whether
   S-023, S-027, S-029 and S-030 continue, are superseded or are retired
   through the room's move routes.
4. Each locked destination answer becomes one DDR written with
   `adr.mjs new --kind ddr`: the locked words as the Decision, only the owner's
   confirmed reasons as the why, "None recorded" where the record holds
   nothing, exactly one landmark or Blueprint level named, and provenance (the
   grilling, question ID, lock date).
5. Landmarks use whatever representation the installed runtime provides; if it
   provides none, they are Design Concept articles in the Wiki naming their
   member DDRs, and the gap is reported in the feedback lane.
6. Blueprint content with no new home is superseded through a linked record,
   never silently deleted.

## Decisions And Contracts

- Workbench Canon that binds every room is not re-grilled: the four-part short
  page, DDRs beside ADRs, landmarks one size above Specs, and confirmation as
  the authorization to write a confirmed record.
- Review runs once, as an Automated review of this Spec's assembled candidate
  at Verify; its Tasks carry merge answers and get no review of their own.

## Non-Goals

- No product feature, and no Spec or Task for CIC product work.
- No Grill Board package unless the owner asks for package review.

## Dependencies And Blockers

- S-000A (Workbench v3.2.1 Update) merged into `Integration`.

## Vertical Implementation Slices

Tasks are temporary tracer bullets reaching or repairing this scoped destination.

| Task | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-000B | Draft the short page, candidate decisions and landmarks from CIC's own context and load the decision map into a grilling notepad | blocked | S-000A | pending |
| TK-000C | Run the grilling with the owner to a confirmed final readback, then write the DDRs, landmarks and short-page Blueprint from locked answers | blocked | TK-000B | pending |

## Acceptance Criteria

- [ ] Every DDR quotes a locked answer and names its provenance.
- [ ] `BLUEPRINT.md` is the four-part short page, stamped v3.2.1.
- [ ] Every landmark names its member DDRs.
- [ ] Former Blueprint content has a named new home or a linked supersession.
- [ ] `adr.mjs` validates the DDR collection and `doctor` reports no blocking
      finding.

## Testing Seams

- `adr.mjs` validation of the DDR collection; `doctor`; the Wiki lint of the
  touched pages.

## Verification Procedure

```bash
node workbench/tools/adr.mjs register --kind ddr
node workbench/tools/spec-workbench.mjs render
node workbench/tools/spec-workbench.mjs doctor
npm test
```

## Documentation Impact

- `BLUEPRINT.md`, `workbench/docs/ddr/`, landmark records or Wiki Design Concept
  articles, and any Wiki page whose claims the answers change.

## Append-Only Evidence And Execution Log

| Date | Task | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- Product Specs the destination implies are created only after the grilling, on
  the owner's direction.

## Supersession

- Supersedes: none
- Superseded by: none
