# S-000A - Workbench v3.2.1 Update

> Generated from LLM Workbench v3.2.1. Lifecycle moves use the link-safe
> `move-spec` operation after its gates pass, never a manual folder move.

**Spec ID:** S-000A
**Status:** active
**Priority:** 0
**Owner:** Claude
**Stance:** Builder
**Updated:** 2026-10-05
**Catalog description:** Update CIC from LLM Workbench v3.1.1 to v3.2.1 through the v3 room route, reconcile the root controls and Wiki contract files, and close the loop on the September adoption feedback.
**Baseline:** green - `npm test` 331 tests, 325 pass, 0 fail, 6 todo on `Integration` `981ab59`
**Blockers:** none
**Latest event:** TK-000A done: layout, tools and skills updated from `ec65203d`; controls and Wiki contract files reconciled; suite matches the baseline.
**Next gate:** Automated review of the assembled candidate at Verify, then merge into `Integration`.

## Outcome

CIC runs on LLM Workbench v3.2.1, the version stamped on the Workbench's
`integration` branch: the current layout (skills lane, notepads, recovery,
features and DDR collections), receipt-backed managed tools and core skills,
root controls and Wiki contract files carrying the current Contract, and a
declared `Integration` branch.

## Why It Matters

CIC reported four frictions from its v3.1.1 adoption on 2026-09-04. They were
fixed upstream but never came back to this room, which stayed on the version it
reported against. The owner asked on 2026-10-05 for CIC to be updated to the
Workbench's current version, with all of the most recent context applied, before
the Blueprint teardown grilling (S-000B, CIC Blueprint Teardown) starts. That
grilling needs the `notepads.mjs` runtime and the `docs/ddr` collection this
update installs.

## Current Verified State

Before the change, on `Integration` `981ab59` (S-031's adoption PR #35 merged
after its separate-context review passed): manifest schema 2 at v3.1.1 with
`provenance.source.commit` `unrecorded`, six lanes and seven collections, no
`git` block, eleven managed tools from `fa04e272`, no skills lane, and
`skillPolicy.required` naming the retired `to-tickets`. The release checkout was
a clean detached worktree of `KaydenClark/LLM_Workbench` `integration` at
`ec65203d3fcf4ff9973703357941aa07f581b14f` (stamped v3.2.1; `main` is at v3.2.0).

## Desired Behavior

1. The manifest validates at v3.2.1 with seven lanes, twelve collections, a
   `workbenchId`, a `git` block naming `main` and `Integration`, and the current
   27-skill `skillPolicy.required`.
2. `workbench/tools/` and `workbench/skills/` verify against receipts from
   `ec65203d`, and `.agents/skills` and `.claude/skills` resolve into the lane.
3. The root controls carry the v3.2.1 Contract, including the 2026-10-05 rules:
   a Task is judged by its merge answers with no separate-context review of its
   own; Automated review runs once per assembled Spec (sometimes a landmark or
   the Blueprint) at Verify, in a fresh context on the session's provider; and
   the same failure twice, or three attempts with no real progress, blocks and
   escalates.
4. CIC's filled specifics survive: scope, `Integration` branch flow, owner-visible
   completion at `servitor.local:8787`, product and privacy rules, SLK/Lucide
   visual direction, and every product operation in the Runbook.
5. Each 2026-09-04 feedback row is dispositioned, and this update's own friction
   is appended to the feedback lane.

## Decisions And Contracts

- Route: CIC is already on a v3 support root, so the update used
  `workbench-layout.mjs migrate` (run until `current`), `workbench-tools.mjs
  update --explicit-update`, `workbench-skills.mjs install` (no lane existed)
  and `record-source`, not `workbench-upgrade.mjs upgrade`, which is the
  one-time v2-root route. The assigning handoff named the latter; the skill's
  step 3 governs.
- Version: "LLM Workbench's current version" is taken as the `integration` tip
  `ec65203d`, stamped v3.2.1, because that is where the owner's current rules
  live; `main` is at v3.2.0.
- Provenance: `provenance.source` keeps the true historical adoption source
  (v3.1.1, `fa04e272`, previously `unrecorded`), as the Runbook's upgrade step
  says; `provenance.layout.source` and the two receipts record `ec65203d`. The
  resulting `unverified-provenance` attention finding is accepted and reported
  upstream.
- Controls were reconciled by a three-way merge (CIC's file, the v3.1.1 template
  as base, the v3.2.1 template) and each conflict resolved by hand.
  `control-fidelity.mjs` AGENTS.md lines still `dropped` or `changed` are
  decisions here: the bracketed Read/Edit Scope and branch placeholders are
  filled by CIC's own lists and `Integration`; CIC's fuller engineering,
  safety and visual wording replaces the template's shorter lines; Long Session
  Control takes the Workbench root's 2026-10-05 wording rather than the
  template's superseded two-failure stop rule.
- Runbook: three template operations-index rows (claims to test, evaluation
  design, evaluation commands) were dropped because their commands exist only in
  the template repository; five CIC product rows were added; the harness
  upgrade procedure was rewritten for the v3 route.
- The spec catalog moved out of `BLUEPRINT.md` into the generated
  `workbench/specs/CATALOG.md`; the rest of the Blueprint is untouched here and
  is S-000B's teardown target.
- Spec tables keep the five-column execution-slice header (`Ticket | ...`) from
  the v3.1.1 adoption; the v3.2.1 tools read those rows as Tasks. Converting
  unfinished rows to Task records is not done here.

## Non-Goals

- No product code, dependency or data change.
- No Blueprint content change beyond removing the generated catalog region.
- No edit to the LLM Workbench repository; its defects are reported in the
  feedback lane.
- No change to S-027's stale claim or the Foundry-direction specs; the S-000B
  grilling decides them.

## Dependencies And Blockers

- none

## Vertical Implementation Slices

Tasks are temporary tracer bullets reaching or repairing this scoped destination.

| Task | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-000A | Update layout, managed tools and core skills from `ec65203d`, reconcile the root controls and Wiki contract files, and harvest feedback | done | none | `npm test` 331/325/0/6 matches the baseline; `doctor` no blocking finding; layout `valid`; tools and skills receipts verify |

### TK-000A - Update the room to v3.2.1

**Stance:** Builder

Run the v3 room update route from a clean release checkout, reconcile the
controls, render, diagnose and re-verify against the baseline.

## Acceptance Criteria

- [x] `workbench-layout.mjs validate` reports `valid` at v3.2.1 with the `git`
      block and twelve collections.
- [x] `workbench-tools.mjs verify` and `workbench-skills.mjs verify` from the
      release checkout report the receipts valid.
- [x] Root controls and Wiki contract files are stamped v3.2.1 with no bracketed
      placeholder and no unresolved merge marker.
- [x] `doctor` reports no blocking finding; `next --json` returns a genuinely
      eligible ready slice, with no status edited to produce it.
- [x] `npm test` matches the baseline.
- [x] The four 2026-09-04 feedback rows are dispositioned and new friction is
      appended.

## Testing Seams

- None new: no product behavior changed. The suite and the harness checks below
  are the regression net.

## Verification Procedure

```bash
npm test
node workbench/tools/spec-workbench.mjs render
node workbench/tools/spec-workbench.mjs doctor
node workbench/tools/spec-workbench.mjs next --json
node workbench/tools/workbench-layout.mjs validate --project "$PWD"
node "$LLM_WORKBENCH_ROOT/tools/workbench-tools.mjs" verify --project "$PWD"
node "$LLM_WORKBENCH_ROOT/tools/workbench-skills.mjs" verify --project "$PWD"
node "$LLM_WORKBENCH_ROOT/tools/control-fidelity.mjs" report --project "$PWD"
```

## Documentation Impact

- `AGENTS.md`, `RUNBOOK.md`, `LEXICON.md`, `README.md`, `TASKBOARD.md`,
  `CLAUDE.md` and `BLUEPRINT.md` (stamp and catalog region only) reconciled.
- `workbench/wiki/MEMORY.md`, `SCHEMA.md`, `AGENTS.md`,
  `design-concepts/README.md` and the new `features/README.md` reconciled to
  v3.2.1.
- `workbench/feedback/WORKBENCH_FEEDBACK.md` gains five rows.
- `workbench/specs/S-031-workbench-v3-1-1-adoption/SPEC.md` records its merge.

## Append-Only Evidence And Execution Log

| Date | Task | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-10-05 | TK-000A | Rehearsed the route on a scratch clone of CIC, then ran it on `claude/workbench-v3-2-1-update` from `Integration` `981ab59` with the release checkout at `ec65203d`: `migrate` twice (skills lane; then notepads, recovery, features and DDR collections and `workbenchId`), `workbench-tools.mjs update --explicit-update` (26 files changed; backup recorded in the receipt), `workbench-skills.mjs install` (27 core skills, both adapters), manifest stamp, `git` block and skill list by hand, `provenance.source` set to the true v3.1.1 adoption source. Controls and Wiki files reconciled by three-way merge; catalog moved to `workbench/specs/CATALOG.md`. | Baseline before editing: `npm test` 331 tests, 325 pass, 0 fail, 6 todo. After: `npm test` 331 tests, 325 pass, 0 fail, 6 todo. `doctor`: no blocking finding; attention only for the pre-existing S-027 `stale-claim` and the accepted `unverified-provenance`. `workbench-layout.mjs validate`: `valid`. `next --json`: S-005 TK-002 (ready). The v3.1.1 selector returned S-027 TK-007, the stale in-progress claim; the difference comes from the v3.2.1 selector, not from any status edit. | Controls, Wiki contract files, feedback lane, S-031. | Automated review at Verify and the merge into `Integration`. |

## Completion Result

Pending: Automated review of the assembled candidate, merge into `Integration`
and containment proof.

## Remaining Limitations Or Follow-Up Specs

- PR #35's review found non-blocking issues this update does not change:
  S-031's FUID, Created and Last-worked values were removed rather than
  archived (recoverable from `a601df7`); S-031 calls `tools/markdown-table.mjs`
  retired although it moved byte-identical into `workbench/tools/`; and
  `workbench/feedback/REPORT-v3-1-1-adoption-2026-09-05.md` carries an absolute
  home path.
- Unfinished spec table rows are not yet converted to Task records.
- `BLUEPRINT.md` is still the stale eight-section page; S-000B replaces it.

## Supersession

- Supersedes: none
- Superseded by: none
