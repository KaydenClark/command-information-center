# S-000B - CIC Blueprint Teardown

> Generated from LLM Workbench v3.2.1. Lifecycle moves use the link-safe
> `move-spec` operation after its gates pass, never a manual folder move.

**Spec ID:** S-000B
**Status:** active
**Priority:** 1
**Owner:** Codex (continuing the Owner's exploration)
**Stance:** Builder
**Updated:** 2026-10-06
**Catalog description:** Replace CIC's stale eight-section Blueprint with the four-part short page, its Destination Decision Records and landmarks, confirmed through a saved grilling with the owner.
**Blockers:** none
**Latest event:** Owner confirmed project-supplied Priority and Value as the starting model, with an explicit rationale for exploring better ideas later; CIC's possible final-call role remains open.
**Next gate:** Continue the saved inquiry, reconcile the final concept and former Blueprint content, and preserve verification before closing either Task.

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

At preparation after S-000A (Workbench v3.2.1 Update), the room had
`notepads.mjs`, the `notepads` collection and an empty `docs/ddr` collection.
On 2026-10-06 the Owner continued the exploration in Codex and explicitly
authorized making decision records and finding landmarks during the session.
Eight records now preserve confirmed choices in the proposed lifecycle;
their acceptance and final Blueprint reconciliation remain separate work.
Three candidate landmark synthesis pages use the Wiki fallback: the installed
Tracker tool reports `tracker-undeclared` and the manifest has no
`landmarkTracker` block. No native landmark record is claimed.

Confirmed choices are discoverable through:

- [DDR-000A — CIC is the Owner's personal projection and command surface](../../docs/ddr/proposed/000A-cic-is-the-owner-s-personal-projection-and-command-surface.md).
- [DDR-000B — CIC serves the Owner and uses portable Owner terminology](../../docs/ddr/proposed/000B-cic-serves-the-owner-and-uses-portable-owner-terminology.md).
- [DDR-000C — CIC carries intent while receiving systems own execution](../../docs/ddr/proposed/000C-cic-carries-intent-while-receiving-systems-own-execution.md).
- [DDR-000D — CIC combines personal life and project work with decisions and commands](../../docs/ddr/proposed/000D-cic-combines-personal-life-and-project-work-with-decisions-and-commands.md).
- [DDR-000E — CIC opens on a homepage dashboard across projects](../../docs/ddr/proposed/000E-cic-opens-on-a-homepage-dashboard-across-projects.md).
- [DDR-000F — Progress is direct movement toward the destination](../../docs/ddr/proposed/000F-progress-is-direct-movement-toward-the-destination.md).
- [DDR-000G — Priority and Value guide attention on separate axes](../../docs/ddr/proposed/000G-priority-and-value-guide-attention-on-separate-axes.md).
- [DDR-000H — Owning projects supply Priority and Value as the starting model](../../docs/ddr/proposed/000H-owning-projects-supply-priority-and-value-as-the-starting-model.md).
- [Wiki router — candidate landmark synthesis pages](../../wiki/MEMORY.md#landmark-synthesis-pages).

The Blueprint's Non-Goals and Design Decisions sections were initial
destination sources; its Architecture, Directory Map, Main Contracts and
Core Logic sections are
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
7. The Owner's 2026-10-06 direction permits incremental decision records and
   candidate landmark synthesis during this main exploration. It does not
   confirm unasked choices, bypass the Tasks' completion gates or authorize
   CIC feature implementation. Existing Task state remains open while this
   owner-directed exploration continues.

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

- none (S-000A, Workbench v3.2.1 Update, merged into `Integration` at `0b09677`).

## Vertical Implementation Slices

Tasks are temporary tracer bullets reaching or repairing this scoped destination.

| Task | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-000B | Draft the short page, candidate decisions and landmarks from CIC's own context and load the decision map into a grilling notepad | in-progress | none | pending |
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
| 2026-10-06 | TK-000B | Owner-directed exploration continued in Codex on the existing claimed branch; seven confirmed choices were recorded incrementally and three candidate landmark syntheses were authored. Task state remains in-progress. | Documentation working tree based on `819f537`: DDR validation returned no findings; Wiki validation and touched-page semantic lint passed; layout validation passed; doctor retained only the two existing effect-none attention findings. `npm test` passed 325 tests with 6 TODOs after rerunning outside the sandbox because temporary HTTP listeners received EPERM. | Seven linked destination records, three routed candidate syntheses, Wiki router, this Spec, generated Taskboard and Tracker-availability feedback. | Inquiry, landmark grouping, final Blueprint/content reconciliation, record lifecycle acceptance and assembled review remain open. No product behavior or installed runtime was changed. |
| 2026-10-06 | TK-000B | Owner explicitly replaced tentative classification-authority treatment with a confirmed starting choice and supplied the exact reason for revisiting it as the destination becomes clearer. DDR-000H, Owning projects supply Priority and Value as the starting model, records that correction. | Documentation working tree based on `cb1117675a877c078e58847d04b7dcd0959995bb`: new record read-back matched; DDR validation returned no findings; Wiki validation and touched-page semantic lint passed; doctor retained its two existing effect-none attention findings; diff whitespace check passed. No runtime source changed, so the previous runtime suite was not rerun. | New linked decision record, Owner Direction candidate synthesis, this Spec and generated projections. | CIC's possible final-call role, cross-project attention ordering and the remaining exploration/reconciliation gates stay open. |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- Product Specs the destination implies are created only after the grilling, on
  the owner's direction.

## Supersession

- Supersedes: none
- Superseded by: none
