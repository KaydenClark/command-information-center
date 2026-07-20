# S-024 - Daily Project Slice Receipts

> Generated from LLM Workbench v2.3. This stable path never moves.

**Spec ID:** S-024
**Status:** active
**Priority:** 0
**Owner:** CIC Engineer
**Updated:** 2026-07-20
**Catalog description:** Show one freshness-linked daily slice receipt for every enrolled project without creating a second task or proof store.
**Blockers:** none
**Latest event:** Kayden authorized `/make-it-so` for the portfolio-wide daily slice loop and required visible CIC progress or a truthful reason for every enrolled project.
**Next gate:** Claim TK-001 and derive the receipt model from project-owned taskboard/spec evidence.

## Outcome

The CIC Projects surface shows one daily receipt card for every enrolled
project. Each card answers what today's slice is, what visibly changed or why
it could not, how it was tested and audited, whether docs and remote recovery
are sound, how fresh the source is, and what comes next.

## Why It Matters

The scheduled Captain pass can currently finish without giving Kayden a visual,
per-project explanation. A single selected project can appear busy while CIC,
OpenBrain, the Forge, or another enrolled project silently receives no work.

## Decisions And Contracts

- Project Markdown and Git remain canonical. CIC derives a receipt from the
  project's current spec/ticket metadata and latest append-only evidence; it
  does not write a receipt, task, claim, audit, or repair record.
- The existing enrolled Projects model remains the membership source. CIC
  shows exactly one card for each returned project and does not silently omit a
  project because today's receipt is absent or malformed.
- A receipt exposes: date/freshness, selected slice, visible progress or
  evidence-backed blocker/no-action reason, tests, independent audit/Combat
  Medic result, docs, remote recovery/clean closeout, and next slice or gate.
- Missing, stale, future-dated, or incomplete evidence is visibly unavailable;
  CIC never fills absent proof with a healthy default.
- This feature is read-only and uses no SQLite table, private cache, or second
  project queue.

## Non-Goals

- Planning, claiming, testing, auditing, repairing, merging, or closing a slice.
- Replacing project Taskboards, stable specs, Git evidence, or root S-009.
- Adding a recurring CIC scheduler or requiring Discord delivery credentials.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Parse a fail-honest daily receipt from each project's active spec, selected ticket, latest evidence row, source timestamp, and next gate. | ready | none | Fixture tests cover complete, absent, stale, future-dated, and partial project evidence without a new store. |
| TK-002 | Render one compact receipt card per enrolled project in the Projects view, with desktop/mobile visual proof and explicit unavailable fields. | blocked | TK-001 | React/browser tests and screenshots prove exact membership, readable proof fields, freshness, and no horizontal overflow. |

## Acceptance Criteria

- [ ] Every project returned by the canonical Projects endpoint has exactly one
  daily receipt card, even when no actionable slice or current evidence exists.
- [ ] Complete cards show slice, progress/blocker, tests, audit/Medic, docs,
  recovery, freshness, and next slice/gate from project-owned source evidence.
- [ ] Missing, stale, future-dated, and partial evidence renders honestly and
  cannot appear as passed or healthy.
- [ ] The feature registers no receipt write endpoint and stores no receipt in
  SQLite or a CIC-owned task/proof file.
- [ ] Desktop and 375px mobile proof are readable without page overflow.

## Testing Seams

- Temporary project roots containing Taskboards and stable specs with complete,
  missing, stale, future-dated, and partial latest evidence rows.
- Model tests for exactly one receipt per listed project and deterministic
  field provenance.
- React/server-render and browser fixtures for card membership, unavailable
  states, labels, and narrow-screen containment.

## Documentation Impact

- `BLUEPRINT.md` owns the read-only derived-view boundary and spec catalog.
- `README.md` and `RUNBOOK.md` document the visible receipt and operator check.
- Root S-009 owns Captain scheduling, project receipt production, audit/Medic,
  and recovery behavior.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-20 | spec | Promoted the approved daily per-project receipt surface as a new CIC-owned capability. | Existing Projects API/model/UI and test seams were inspected; no existing CIC spec owned this behavior and no runtime behavior is claimed by this planning row. | Added S-024 and its Blueprint catalog entry. | Implement TK-001 and TK-002, then capture desktop/mobile proof. |

## Completion Result

Pending.

## Supersession

- Supersedes: none.
- Refines: S-007 Spec-Grouped Project Tickets and root S-009 AFK Autonomous Operations.
