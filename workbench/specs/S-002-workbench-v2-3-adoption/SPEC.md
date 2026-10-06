# S-002 - Workbench v2.3 Adoption

> Generated from LLM Workbench v2.3.

**Spec ID:** S-002
**Status:** complete
**Priority:** 0
**Owner:** Kayden (product); Codex (migration)
**Updated:** 2026-07-15
**Catalog description:** Adopt the current spec-centered Workbench while preserving CIC product, privacy, branch, and verification contracts.
**Blockers:** none
**Latest event:** CIC controls migrated from v2.1 to v2.3 without changing product source.
**Next gate:** none

## Outcome

CIC uses the current stable-spec lifecycle and generated hot Taskboard.

## Current Verified State

The v2.1 controls owned a combined queue and proof ledger. Product source and
tests were already healthy before this docs-and-tooling-only migration.

## Desired Behavior

- Stable specs own capability truth and proof.
- The Taskboard projects active execution only.
- The project retains its Integration staging, privacy, and verification rules.

## Decisions And Contracts

- The original v2.1 Taskboard is archived intact rather than maintained in parallel.
- Canonical lifecycle tooling is copied from the local Workbench v2.3 source.
- Tool-specific settings are omitted because plain portable controls are sufficient.

## Non-Goals

- Product behavior changes or selection of speculative feature work.

## Dependencies And Blockers

- none

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Migrate CIC controls and preserve historical proof | done | none | v2.3 controls, stable specs, canonical tool, generated projections |

## Acceptance Criteria

- [x] The v2.3 lifecycle can doctor, render, and select work deterministically.
- [x] Existing product, privacy, branch, and verification contracts remain explicit.
- [x] The old combined queue is archived and no competing roadmap is introduced.

## Testing Seams

- Spec doctor and render checks plus the unchanged product verification suite.

## Verification Procedure

```bash
node tools/spec-workbench.mjs render
node tools/spec-workbench.mjs doctor
npm test
npm run test:browser
npm run build
npm audit --omit=dev
```

## Documentation Impact

- Updated all control docs, added Lexicon and feedback channel, and archived the v2.1 Taskboard.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-15 | TK-001 | v2.3 adoption implemented | Doctor green; 163 pass, 6 TODO, 0 fail; 4 browser checks; build green; audit 0 | controls and archive updated | none |

## Completion Result

CIC now uses the Workbench v2.3 stable-spec lifecycle with no product source changes.

## Remaining Limitations Or Follow-Up Specs

- The next product capability is intentionally selected by evidence-backed discovery.

## Supersession

- Supersedes: v2.1 combined Taskboard lifecycle
- Superseded by: none
