# S-024 - Daily Project Slice Receipts

> Generated from LLM Workbench v2.3. This stable path never moves.

**Spec ID:** S-024
**FUID:** 00006F
**Status:** complete
**Priority:** 0
**Owner:** codex
**Created:** 2026-07-20
**Last worked:** 2026-07-20
**Updated:** 2026-07-20
**Catalog description:** Show one freshness-linked daily slice receipt for every enrolled project without creating a second task or proof store.
**Blockers:** none
**Latest event:** Spec completed and removed from the hot board.
**Next gate:** none

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

| Ticket | FUID | Slice | Status | Blockers | Created | Last worked | Proof |
|---|---|---|---|---|---|---|---|
| TK-001 | 00006G | Parse a fail-honest daily receipt from each project's active spec, selected ticket, latest evidence row, source timestamp, and next gate. | done | none | 2026-07-20 | 2026-07-20 | taskboard model tests pass for complete and missing derived receipts |
| TK-002 | 00006H | Render one compact receipt card per enrolled project in the Projects view, with desktop/mobile visual proof and explicit unavailable fields. | done | none | 2026-07-20 | 2026-07-20 | npm test 271 pass and 6 TODO; browser 16 pass and 8 expected skips across desktop/mobile; production build clean; screenshot artifacts/s-024-daily-project-receipts.png |

## Acceptance Criteria

- [x] Every project returned by the canonical Projects endpoint has exactly one
  daily receipt card, even when no actionable slice or current evidence exists.
- [x] Complete cards show slice, progress/blocker, tests, audit/Medic, docs,
  recovery, freshness, and next slice/gate from project-owned source evidence.
- [x] Missing, stale, future-dated, and partial evidence renders honestly and
  cannot appear as passed or healthy.
- [x] The feature registers no receipt write endpoint and stores no receipt in
  SQLite or a CIC-owned task/proof file.
- [x] Desktop and 375px mobile proof are readable without page overflow.

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
| 2026-07-20 | TK-001 | Ticket closed | taskboard model tests pass for complete and missing derived receipts | Blueprint, README, RUNBOOK, and S-024 updated | TK-002 visual card proof |
| 2026-07-20 | TK-002 | Ticket closed | npm test 271 pass and 6 TODO; browser 16 pass and 8 expected skips across desktop/mobile; production build clean; screenshot artifacts/s-024-daily-project-receipts.png | Blueprint, README, RUNBOOK, and S-024 updated | none |
| 2026-07-20 | spec | Spec completed | Acceptance gates satisfied | Documentation impact recorded above | none |
| 2026-07-20 | TK-002 | Independent audit, Combat Medic, and re-audit | First immutable review rejected ticket/evidence mismatch, Taskboard-mtime freshness, and missing stale/future/partial coverage. Combat Medic bound receipts to evidence tickets and spec mtimes, preserved today's completed slice with the next actionable handoff, and added model/browser multi-project state coverage. Independent re-audit returned no findings at pushed branch `bb737fc`; full verification remained 274 pass, 6 TODO, 18 browser pass, 8 expected skips, clean build, and zero production vulnerabilities. | Existing Blueprint, README, Runbook, and S-024 contracts remain accurate. | none; remote checkpoint `bb737fc` is pushed and the checkout is clean. |
| 2026-07-20 | TK-001 | Hardened the receipt clock against wall-clock drift | Root-caused three date-brittle model tests: `receiptStatus()` compared evidence to the live `new Date()` while fixtures hardcoded 2026-07-20 as today, so the suite failed once the real clock passed 2026-07-20 (2026-07-20 evidence read as stale, 2026-07-21 as current). Added an injectable `now` clock to `receiptStatus`/`buildDailyReceipt`, threaded it through `readProjectTaskboard`/`listProjectTaskboards` (production defaults unchanged to real time), and pinned the affected tests to a fixed 2026-07-20 clock. `npm test` 280 pass, 0 fail, 6 TODO on a wall clock already past 2026-07-20; `node tools/spec-workbench.mjs doctor` passed. | No contract change; behavior identical at runtime. Blueprint/README/RUNBOOK unaffected. | none |

## Completion Result

The Projects view now provides one compact receipt per discovered enrolled
project and a detailed current/stale/missing receipt for the selected project.
All fields remain derived from project-owned Markdown evidence, with no CIC
write route or receipt persistence. Desktop/mobile proof is recorded at
`artifacts/s-024-daily-project-receipts.png`.

## Supersession

- Supersedes: none.
- Refines: S-007 Spec-Grouped Project Tickets and root S-009 AFK Autonomous Operations.
