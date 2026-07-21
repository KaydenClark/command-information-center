# Command Information Center - Hot Taskboard

> Generated from LLM Workbench v2.3.

**Current focus:** Preserve operator trust while selecting the next evidence-backed capability.
**Owner:** Kayden (product); project agents (execution)
**Last updated:** 2026-07-15

This is an active execution projection, not a requirements store or proof archive.
Use `node tools/spec-workbench.mjs next --json` to select work.

## Active Specs

<!-- hot-specs:start -->
| Spec | Current slice | Owner | Blocker | Latest meaningful event | Next gate |
|---|---|---|---|---|---|
| [S-005](specs/S-005-mobile-workbench-release-workflow/SPEC.md) | TK-002: Private phone acceptance over Meshnet (ready) | Kayden (owner acceptance) | none (owner phone acceptance received 2026-07-20) | 2026-07-20: Kayden confirmed authenticated private CIC access from a phone over Meshnet during a live session; owner acceptance recorded and the owner-acceptance blocker cleared. | Run the final green-gate verification suite (node/browser/build/audit/doctor/harness/evaluator/diff/secret) and complete S-005. No owner decision remains. |
| [S-023](specs/S-023-foundry-harness-flow/SPEC.md) | TK-003: Replace the fixture reader with Audit Engine's sanitized live-export adapter. (blocked) | CIC Engineer | Audit Engine S-003 TK-003 | TK-001 and TK-002 delivered fixture-driven on `codex/s-023-harness-flow` per owner direction to not wait for the live Audit Engine reader. | Swap the injected fixture reader for Audit Engine S-003 TK-003's sanitized export adapter. |
| [S-025](specs/S-025-intelligence-synthesis-cost-control/SPEC.md) | Acceptance / owner gate | CIC Engineer; Kayden (cost acceptance) | none | 2026-07-20: tracer-bullet slice delivered — overview synthesis is TTL-cached on the server, a manual Refresh forces a fresh synthesis, and CIC_INTELLIGENCE_AUTOSYNTH=off serves the deterministic fallback at zero OpenAI cost; 14 intelligence tests green (7 new). | Owner reviews and merges the branch into Integration; owner accepts the reduced-cost behavior on the private runtime. |
| [S-022](specs/S-022-skill-catalog-visibility/SPEC.md) | TK-001: Tracer bullet: one skill row end to end — catalog+deployed reader → Express route → React model → Skills view (desktop+mobile) → in-sync drift/freshness badge (ready) | CIC Engineer; Kayden (catalog acceptance) | none | 2026-07-20: open work re-cut from a horizontal backend-source / frontend-view split into dependency-ordered tracer-bullet slices; TK-001 now pierces the whole stack for one skill row end to end. | TK-001 tracer bullet — one skill row end to end (catalog+deployed reader → Express route → React model → Skills view desktop+mobile → in-sync drift/freshness badge). |
<!-- hot-specs:end -->

Completed specs disappear from this projection. Their requirements, decisions,
acceptance, proof, completion, and supersession remain in the stable spec.

## Owner Decisions

| Spec | Decision | Options | Recommendation | Cost / impact | Owner | Next gate |
|---|---|---|---|---|---|---|
| none | No active owner decision. | n/a | n/a | none | Kayden | none |
