# S-023 - Foundry Harness Flow

> Generated from LLM Workbench v2.3. This stable path never moves.

**Spec ID:** S-023
**Status:** active
**Priority:** 1
**Owner:** CIC Engineer
**Updated:** 2026-07-20
**Catalog description:** Render a freshness-stamped root Foundry flow from Audit Engine evidence, with component drill-downs and no audit or repair authority in CIC.
**Blockers:** Binding the live export awaits Audit Engine S-003 TK-003.
**Latest event:** TK-001 and TK-002 delivered fixture-driven on `codex/s-023-harness-flow` per owner direction to not wait for the live Audit Engine reader.
**Next gate:** Swap the injected fixture reader for Audit Engine S-003 TK-003's sanitized export adapter.

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
| TK-001 | Add a read-only, fail-closed injected export source with provenance and freshness classification. | done | — | `server/harnessFlow.js` and `test/harnessFlow.test.js` |
| TK-002 | Render the root flow and component drill-down states on desktop and mobile. | done | — | `src/harnessFlowModel.js`, `src/harnessFlow.jsx`, and React/model tests |
| TK-003 | Replace the fixture reader with Audit Engine's sanitized live-export adapter. | blocked | Audit Engine S-003 TK-003 | Same injected reader contract passes unchanged server and React suites |

## Acceptance Criteria

- [x] CIC shows the report source, scope, generation time, age, and a visible
      stale/unavailable state when it cannot read a current export.
- [x] The root flow distinguishes static availability from every receipt-proven
      stage and exposes component coverage gaps.
- [x] Component drill-downs show evidence and do not reveal protected content.
- [x] CIC has no audit-run, repair, approval, dispatch, or resolution-write endpoint.
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
| 2026-07-20 | spec | Owner explicitly authorized fixture-driven root and component delivery without waiting for Audit Engine, and kept the portfolio summary outside this first slice. TK-003 now names the only remaining live-adapter swap. | Current request reconciled against the existing planning packet before implementation. | Spec scope and ticket lifecycle corrected. | Audit Engine S-003 TK-003. |
| 2026-07-20 | TK-001 | Owner unblocked fixture-driven delivery. Added a bounded fixture reader, injected `harnessExportReader` override, strict export envelope, lenient missing-evidence normalization, sanitized provenance, and `GET /api/harness-flow`. | Targeted server, model, and React-render tests: 28 pass / 0 fail. Full gates and browser proof recorded below after completion. | `BLUEPRINT.md`, `README.md`, `RUNBOOK.md`, `.env.example`. | Replace the fixture reader with Audit Engine S-003 TK-003's sanitized export adapter. |
| 2026-07-20 | TK-002 | Added the Harness navigation surface, required seven-stage rail, receipt/surface/model evidence, static-control disclaimer, coverage/exclusions, and component drill-down with responsive stacking. | React-render tests cover fresh, stale, unavailable, malformed, `INACCESSIBLE`, `USER_REPORTED`, ordered flow, and component coverage/exclusions. | Docs covered under TK-001. | Live-export adapter only. |
| 2026-07-20 | TK-001/TK-002 | Fixture-driven delivery gates completed. One-command demo: `env CIC_DATA_FEED=data.example.js PORT=8792 npm start`, then open Harness. | Targeted config/server/model/React suite: 49 pass; `npm test`: 267 pass, 6 explicit TODO, 0 fail; `npm run test:browser`: 16 pass, 8 expected skips; `npm run build`: clean; `npm audit --omit=dev`: 0 vulnerabilities; manual browser: desktop plus 375×812 mobile fresh flow/drill-down, injected stale/malformed/unavailable states, no page overflow, no console warnings/errors; spec render/doctor and `git diff --check`: clean. | Docs and generated Taskboard projection updated. | Audit Engine S-003 TK-003 live-export adapter only. |
| 2026-07-20 | TK-001/TK-002 | Immutable review hardening rejects future-dated reports, redacts path-like values after delimiters, preserves stale component reports with warnings, and contains the seven-stage rail at intermediate widths. | Red tests reproduced all four review findings before fixes. Final `npm test`: 271 pass, 6 explicit TODO, 0 fail; `npm run test:browser`: 16 pass, 8 expected skips; `npm run build`: clean; `npm audit --omit=dev`: 0 vulnerabilities; manual 821px and 900px checks show no page overflow and a contained scrollable rail. | Existing boundary and operator docs already cover these fail-closed behaviors; no additional doc update needed. | Audit Engine S-003 TK-003 live-export adapter only. |
| 2026-07-20 | TK-001 | Second immutable review found file-URI labels and Basic or URL credentials could survive the privacy boundary. Added route-level red/green coverage and sanitized URI, home-relative, authorization, and URL-userinfo forms across source, scope, controls, exclusions, and reasons. | Route test failed on the leaked `file:/Users/...` scope before the fix, then passed 18/18; `npm test`: 271 pass, 6 explicit TODO, 0 fail; `npm run test:browser`: 16 pass, 8 expected skips; `npm run build`: clean; `npm audit --omit=dev`: 0 vulnerabilities. | Docs checked; no update needed because the existing contract already requires fail-closed path and credential sanitization. | Audit Engine S-003 TK-003 live-export adapter only. |
| 2026-07-20 | TK-001 | Third immutable review extended the credential boundary to username-only and percent-encoded URL userinfo plus short standalone Basic tokens. | Route test reproduced the short-token leak before the fix, then passed 18/18; final `npm test`: 271 pass, 6 explicit TODO, 0 fail; `npm run test:browser`: 16 pass, 8 expected skips; `npm run build`: clean; `npm audit --omit=dev`: 0 vulnerabilities. | Docs checked; no update needed because this closes an existing privacy requirement without changing the adapter contract. | Audit Engine S-003 TK-003 live-export adapter only. |
| 2026-07-20 | TK-001 | Fourth immutable review narrowed standalone Basic detection to complete Base64 token shapes so legitimate relative labels and ordinary evidence prose remain intact. | Route test reproduced `docs/Basic Guide.md` corruption before the fix, then passed 18/18 while retaining short-token redaction; final `npm test`: 271 pass, 6 explicit TODO, 0 fail; `npm run test:browser`: 16 pass, 8 expected skips; `npm run build`: clean; `npm audit --omit=dev`: 0 vulnerabilities. | Docs checked; no update needed because the adapter and privacy contracts are unchanged. | Audit Engine S-003 TK-003 live-export adapter only. |

## Completion Result

The owner-requested fixture-driven root flow and component drill-down are
complete. This spec remains active only for TK-003, the injected reader swap
blocked on Audit Engine S-003 TK-003.

## Supersession

- Supersedes: none.
- Refines: S-008 Project Deployment Portfolio and S-022 Skill Catalog Visibility.
