# S-023 - Foundry Harness Flow

> Generated from LLM Workbench v2.3. This stable path never moves.

**Spec ID:** S-023
**Status:** active
**Priority:** 1
**Owner:** CIC Engineer
**Updated:** 2026-07-20
**Catalog description:** Render a freshness-stamped root Foundry flow from Audit Engine evidence, with component drill-downs and no audit or repair authority in CIC.
**Blockers:** Audit Engine S-003 must publish the versioned sanitized export contract.
**Latest event:** Promoted from the GPT_OS Harness Observability decision record.
**Next gate:** Bind the read-only Audit Engine export source after its contract is available.

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
| TK-001 | Add a read-only, fail-closed Audit Engine export source with provenance and freshness classification. | blocked | Audit Engine S-003 TK-003 | server contract fixtures for fresh, stale, malformed, and unavailable exports |
| TK-002 | Render the root flow and component drill-down states on desktop and mobile. | blocked | TK-001 | React tests plus screenshot/demo proof |
| TK-003 | Add a portfolio summary of the same canonical flow evidence. | blocked | TK-002, owner review | source/freshness and portfolio grouping proof |

## Acceptance Criteria

- [ ] CIC shows the report source, scope, generation time, age, and a visible
      stale/unavailable state when it cannot read a current export.
- [ ] The root flow distinguishes static availability from every receipt-proven
      stage and exposes component coverage gaps.
- [ ] Component drill-downs show evidence and do not reveal protected content.
- [ ] CIC has no audit-run, repair, approval, or resolution-write endpoint.
- [ ] Desktop and mobile proof demonstrate readable fresh, stale, and
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

## Completion Result

Pending.

## Supersession

- Supersedes: none.
- Refines: S-008 Project Deployment Portfolio and S-022 Skill Catalog Visibility.
