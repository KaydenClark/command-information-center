# S-023 - Foundry Harness Flow

> Generated from LLM Workbench v2.3. This stable path never moves.

**Spec ID:** S-023
**Status:** active
**Priority:** 1
**Owner:** CIC Engineer
**Updated:** 2026-07-20
**Catalog description:** Render a freshness-stamped root Foundry flow from Audit Engine evidence, with component drill-downs and no audit or repair authority in CIC.
**Blockers:** TK-003 awaits owner review; binding the live export awaits Audit Engine S-003 TK-003.
**Latest event:** TK-001 and TK-002 delivered fixture-driven on `feature/foundry-harness-flow` per owner direction to not wait for the live Audit Engine reader.
**Next gate:** Owner review of the fixture-driven Harness view, then the small reader-adapter swap when Audit Engine S-003 publishes the sanitized export contract.

## Outcome

Kayden opens CIC and sees a root-level Foundry flow from visible controls to
receipt-proven run stages, then drills into each Foundry component's coverage,
freshness, and gaps. CIC renders only the latest sanitized Audit Engine export
and never claims that unavailable evidence is healthy or that a repair is done.

## Why It Matters

The current dashboard shows health and project information, but it does not make
the relationship between Foundry controls, Codex/Claude runtime evidence, Audit
Engine findings, and downstream repair work visible.

## Decisions And Contracts

- Audit Engine owns the report and its repair recommendation. CIC is a derived,
  read-only consumer with visible source, scope, generation time, and freshness.
- The first view is a root Foundry flow and component drill-down; the portfolio
  summary follows later and does not block this vertical slice.
- The UI renders `INACCESSIBLE`, `USER_REPORTED`, stale, malformed, and absent
  evidence distinctly. It never promotes a static control to a proven run stage.
- CIC cannot apply a repair, close a finding, or invoke an audit through this
  slice. A repair remains pending until Audit Engine's matching rerun verifies it.
- All endpoint/file reads fail closed and expose their unavailable reason without
  leaking absolute paths, credentials, or raw report internals.

## Non-Goals

- Owning or modifying Audit Engine reports.
- Building the portfolio summary, periodic PIP projection, or an automatic
  repair control in this first flow slice.
- Rendering raw private control contents or client receipts.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Add a read-only, fail-closed Audit Engine export source with provenance and freshness classification (fixture-driven; live-export adapter still open). | done | — | `server/harnessFlow.js` + `test/harnessFlow.test.js`: 16 contract tests over fresh, stale, malformed, and unavailable fixtures |
| TK-002 | Render the root flow and component drill-down states on desktop and mobile. | done | — | `src/harnessFlowModel.js` + `test/harnessFlowModel.test.js` (9 state tests) plus live desktop/mobile browser proof of fresh, stale, unavailable, and drill-down states |
| TK-003 | Add a portfolio summary of the same canonical flow evidence. | blocked | owner review | source/freshness and portfolio grouping proof |

## Acceptance Criteria

- [x] CIC shows the report source, scope, generation time, age, and a visible
      stale/unavailable state when it cannot read a current export.
- [x] The root flow distinguishes static availability from every receipt-proven
      stage and exposes component coverage gaps.
- [x] Component drill-downs show evidence and do not reveal protected content.
- [x] CIC has no audit-run, repair, approval, or resolution-write endpoint.
- [x] Desktop and mobile proof demonstrate readable fresh, stale, and
      unavailable flow states.

## Testing Seams

- Injected Audit Engine export reader with valid, malformed, stale, and absent
  fixture payloads.
- API tests prove no write route is registered.
- React fixtures assert each evidence state and component drill-down state.

## Documentation Impact

- `BLUEPRINT.md` owns the CIC boundary and spec catalog entry.
- `README.md` and `RUNBOOK.md` receive the visible route and operator checks
  only when an executable source exists.
- Root S-013 owns cross-component sequencing; Audit Engine S-003 owns report
  generation and serialization.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-20 | spec | Promoted CIC's derived Harness Flow surface and its read-only boundary. | Existing CIC view composition and Audit Engine's absent export seam inspected. | Blueprint catalog and this spec created. | Await Audit Engine S-003 export contract before claiming TK-001. |
| 2026-07-20 | TK-001 | Owner unblocked fixture-driven delivery. Added `server/harnessFlow.js`: injected export reader seam (`createHarnessExportFixtureReader` over `harness-flow.example.json`, override `harnessExportReader` in `createApp`), strict-envelope/lenient-evidence normalization, path/digest sanitization, and `GET /api/harness-flow`. | `test/harnessFlow.test.js` (16 tests): fresh/stale/malformed/unavailable fixtures, absent-stage → `INACCESSIBLE`, controls never promoted to stages, no absolute paths or full hashes in payloads, and POST/PATCH/PUT/DELETE plus repair/audit/resolve suffixes 404. Full `npm test` 264 pass / 0 fail; `npm run build` clean. | README API table, RUNBOOK Harness Flow Check, BLUEPRINT routes/API/invariants, `.env.example` (`CIC_HARNESS_REPORT`). | Swap the fixture reader for the Audit Engine S-003 TK-003 sanitized export adapter. |
| 2026-07-20 | TK-002 | Added the Harness nav view: `src/harnessFlowModel.js` (pure view-model), `src/harnessFlow.jsx` (root stage rail Available → Eligible → Shown → Consulted → Acted through → Checked → Accepted, receipt/surface/model cards, setup-control table with static-availability disclaimer, coverage/exclusions, component drill-down), SLK styles with mobile stacking. | `test/harnessFlowModel.test.js` (9 tests) covers every banner and evidence state plus drill-down coverage; live browser proof on port 8791: desktop fresh, stale (19h-old fixture), unavailable (fixture removed → red banner, no fabricated flow), CIC component drill-down with `limit reached — coverage is partial`, and 375px mobile layout. One-command demo: `env PORT=8791 npm start` → Harness tab. | Docs covered under TK-001 row; nav set updated in `test/nav.test.js`. | TK-003 portfolio summary; visual re-proof after the live-export adapter lands. |

## Completion Result

Pending.

## Supersession

- Supersedes: none.
- Refines: S-008 Project Deployment Portfolio and S-022 Skill Catalog Visibility.
