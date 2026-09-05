# S-031 - Workbench v3.1.1 Adoption

> Generated from LLM Workbench v3.1.1. This stable path never moves.

**Spec ID:** S-031
**Status:** active
**Priority:** 0
**Owner:** Claude
**Stance:** Builder
**Updated:** 2026-09-04
**Catalog description:** Move CIC from the LLM Workbench v2.3 root layout onto the v3.1.1 manifest-declared support root, retire the local harness fork, and keep the portfolio readers working across both layouts.
**Blockers:** none
**Latest event:** TK-001 closed; the migration, control reconciliation, and cross-layout portfolio readers are green.
**Next gate:** Independent separate-context review of the immutable candidate, then merge into `Integration`.

## Outcome

CIC runs on LLM Workbench v3.1.1: one `workbench/manifest.json` support-path
authority, receipt-backed managed runtime tools, the seven reconciled root
controls, and a room brain in the wiki lane. CIC's portfolio and taskboard
readers continue to serve enrolled scopes on either the v2 root layout or the
v3 support root.

## Why It Matters

CIC was the last room in the Foundry still steering agents from the v2.3 root
layout while carrying a private fork of the lifecycle tool. That fork was
diverging from the released harness, the support paths had no single authority,
and CIC's own portfolio readers were hard-coded to the v2 paths — so any room
that upgraded would have started reading as unavailable.

## Current Verified State

At adoption the base is `origin/Integration` at `a601df7`. The source release is
`https://github.com/KaydenClark/LLM_Workbench` v3.1.1 at commit
`fa04e27261497ad5aa2f62085764fb6581b2e7e1`, recorded in
`workbench/tools/.workbench-tools.json`.

Before the change, CIC carried:

- root `specs/`, `MEMORY.md`, and `HARNESS_FEEDBACK.md` with no manifest;
- a forked `tools/spec-workbench.mjs` extending the released tool with the
  eight-column FUID lifecycle schema delivered by S-028;
- `server/taskboards.js` reading stable specs only from `<scope>/specs`;
- `server/foundryPortfolio.js` resolving the selector only at
  `<scope>/tools/spec-workbench.mjs`.

Phase 0 baseline on `origin/Integration`: `npm test` 326 tests, 320 pass, 0 fail,
6 todo.

## Desired Behavior

1. `workbench/manifest.json` is the only active support-path authority, at
   schema 2 with all six lanes and seven collections.
2. The managed runtime tools live in `workbench/tools/` and verify against their
   receipt.
3. The seven root controls carry the v3.1.1 contract: reduced entry route,
   instruction authority separate from state resolution, portable stances, the
   Governance Core, session records and checkpoints, and branch completion.
4. Stable specs use the five-column ticket contract so the managed selector can
   claim and close them without corrupting a row.
5. CIC's portfolio and taskboard readers resolve both the v3 `workbench/specs`
   and `workbench/tools` lanes and the legacy v2 root paths.
6. Nothing the project already owned is lost: retired material is archived or
   moved into its declared lane, never deleted outright.

## Decisions And Contracts

- The owner chose conformance over keeping a local harness fork. CIC's spec
  ticket tables drop the FUID, Created, and Last worked columns and the matching
  spec-level fields, and the forked `tools/spec-workbench.mjs`,
  `tools/test-spec-workbench.mjs`, and `tools/markdown-table.mjs` are retired.
- The consequence is accepted and visible, not hidden: `toProjectionSource` in
  `server/foundryPortfolio.js` already fails closed, so CIC's own room now
  reports as an `unavailable` Work-item Projection source with the honest detail
  "Canonical Specs are not fully migrated to FUID lifecycle metadata." Enrolled
  scopes still carrying the FUID schema project normally. S-028's capability is
  retained for those scopes and retired for this room.
- `tools/protected-checkouts.json` is CIC-owned project policy, not a harness
  tool, and stays at the root `tools/` directory with its regression test.
- Root `CONTRACT.md` is a product integration reference and root `SPEC_DIARY.md`
  is an untriaged capture log. Neither is a control; the Lexicon records the
  distinction against the Governance Core's Workbench Contract.
- Layout discovery prefers the v3 lane and falls back to the legacy path, so a
  half-migrated scope is never read from a directory the migration left behind.

## Non-Goals

- Extending the released Workbench parser to accept optional FUID columns. That
  path was offered and declined; it remains available as a later linked spec.
- Re-plumbing S-028's SQLite Work-item Projection, intent ledger, or kanban.
  Their contracts are unchanged.
- Any product surface, route, styling, or connector change.

## Dependencies And Blockers

- none

## Vertical Implementation Slices

Tickets are temporary tracer bullets within this stable capability record.

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Migrate the room onto the v3.1.1 support root, reconcile the seven root controls, retire the local harness fork, and teach the portfolio and taskboard readers both layouts | done | none | Migration reported `status: complete`; `doctor` passes with one pre-existing attention finding; `npm test` 331 tests / 325 pass / 0 fail / 6 todo against a 326/320/0/6 baseline |

### TK-001 - Assigned task

**Stance:** Builder

Run the bounded Adoption migration seam, reconcile the controls, retire the
fork, and prove both layouts read correctly through red/green tests.

## Acceptance Criteria

- [x] `workbench/manifest.json` validates at schema 2 and declares all six lanes
      and seven collections.
- [x] `workbench/tools/` carries a receipt naming the exact source release and
      commit, and `workbench-tools.mjs verify` reports `valid`.
- [x] The seven root controls are filled ordinary files stamped v3.1.1 with no
      bracketed placeholder.
- [x] `workbench/wiki/` holds `MEMORY.md` with frontmatter plus the `SCHEMA.md`,
      `AGENTS.md`, and `design-concepts/README.md` contract files.
- [x] Root `specs/`, `MEMORY.md`, and `HARNESS_FEEDBACK.md` no longer exist; each
      moved to its declared lane.
- [x] `node workbench/tools/spec-workbench.mjs doctor` reports no blocking
      finding.
- [x] A scope on either layout yields stable specs and an authoritative next-work
      result, proved by failing-then-passing tests.
- [x] The full verification suite matches the Phase 0 baseline plus the new
      tests, with no regression.

## Testing Seams

- `readProjectSpecs` in `server/taskboards.js` — which directory supplies stable
  specs for a scope.
- `runWorkbenchNext` in `server/foundryPortfolio.js` — which selector path is
  executed for a scope.

## Verification Procedure

```bash
node --test test/taskboards.test.js test/foundryPortfolio.test.js
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node workbench/tools/spec-workbench.mjs doctor
node workbench/tools/workbench-layout.mjs validate --project "$PWD"
```

## Documentation Impact

- `AGENTS.md`, `BLUEPRINT.md`, `LEXICON.md`, `CLAUDE.md`, `README.md`,
  `RUNBOOK.md`, and `TASKBOARD.md` reconciled to v3.1.1.
- `workbench/wiki/MEMORY.md` reconciled from the v3.1.1 project router template.
- `workbench/feedback/REPORT_FORMAT.md` seeded from the release templates.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-09-04 | TK-001 | Adoption ran from the LLM Workbench v3.1.1 checkout at `fa04e27261497ad5aa2f62085764fb6581b2e7e1`. `specs/` moved to `workbench/specs/`, `MEMORY.md` to `workbench/wiki/MEMORY.md`, and `HARNESS_FEEDBACK.md` to `workbench/feedback/WORKBENCH_FEEDBACK.md`; the recovery record is at `workbench/sessions/checkpoints/adoption-recovery.json`. Spec ticket tables were reduced to the five-column contract across 17 specs, the forked `tools/spec-workbench.mjs`, `tools/test-spec-workbench.mjs`, and `tools/markdown-table.mjs` were retired, and `readProjectSpecs`/`runWorkbenchNext` learned both layouts. | Phase 0 baseline on `origin/Integration` `a601df7`: `npm test` 326 tests, 320 pass, 0 fail, 6 todo. After: `npm test` 331 tests, 325 pass, 0 fail, 6 todo — the five added tests each failed first for the expected reason (empty spec list; selector unavailable) and passed after the change. `node workbench/tools/spec-workbench.mjs doctor` reports no blocking finding, only the pre-existing S-027 `stale-claim` attention row. `workbench-layout.mjs validate` reports `status: valid`; `workbench-tools.mjs verify` reports `status: valid` with an empty `updateAvailable`. | All seven root controls, the wiki router and contract files, and the feedback report format reconciled to v3.1.1. | CIC's own room now reports as an `unavailable` Work-item Projection source because its specs no longer carry the FUID lifecycle schema. Independent review and the merge into `Integration` are still open. |

## Completion Result

Pending. TK-001 is delivered and green; completion waits on the separate-context
integration review and the merge into `Integration`.

## Remaining Limitations Or Follow-Up Specs

- CIC's own scope no longer feeds the FUID Work-item Projection. If the owner
  later wants this room back on the kanban, the two paths are (a) a linked spec
  extending the released Workbench parser to accept optional FUID columns, or
  (b) deriving ticket identity in the projection instead of reading it from the
  spec table. Neither is scheduled.
- The `stale-claim` attention finding on S-027 predates this work and is
  untouched.

## Supersession

- Supersedes: none
- Superseded by: none
