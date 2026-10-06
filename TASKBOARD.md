# Command Information Center - Hot Taskboard

> Generated from LLM Workbench v3.1.1.

**Current focus:** Preserve operator trust while selecting the next evidence-backed capability.
**Owner:** Kayden (product); project agents (execution)
**Last updated:** 2026-07-28

This is an active execution projection, not a requirements store or proof archive.
Use `node workbench/tools/spec-workbench.mjs next --json` to select work and
load only its linked spec. Commands live in `RUNBOOK.md`.

## Active Specs

<!-- hot-specs:start -->
| Spec | Current slice | Owner | Blocker | Latest meaningful event | Next gate |
|---|---|---|---|---|---|
| [S-027](workbench/specs/S-027-foundry-control-surface-v1-0-1/SPEC.md) | TK-007: Restore Inbox, Finance, and Music as an explicit secondary Personal shelf without returning them to Foundry primary navigation; then run the full green gate, obtain independent immutable-SHA review, publish the producer checkpoint, install the exact reviewed build into the Module product, restart the private service, and prove authenticated desktop/mobile production behavior and deployment provenance. (in-progress) | Codex | TK-007 execution is dependency-held by the adopting instance's exact source-completion order after the seven-stage workflow is live. | Live reconciliation confirmed the public source boundary while the adopting instance retained private install/runtime drift and still lacks authenticated desktop/mobile acceptance. | the adopting instance's exact source-completion order; no install, restart, or new feature work occurs in this planning checkpoint. |
| [S-031](workbench/specs/S-031-workbench-v3-1-1-adoption/SPEC.md) | Acceptance / owner gate | Claude | none | TK-001 closed; the migration, control reconciliation, and cross-layout portfolio readers are green. | Independent separate-context review of the immutable candidate, then merge into `Integration`. |
| [S-023](workbench/specs/S-023-foundry-harness-flow/SPEC.md) | TK-003: Replace the fixture reader with Audit Engine's sanitized live-export adapter. (blocked) | CIC Engineer | Audit Engine S-003 TK-003 | TK-001 and TK-002 delivered fixture-driven on `codex/s-023-harness-flow` per owner direction to not wait for the live Audit Engine reader. | Swap the injected fixture reader for Audit Engine S-003 TK-003's sanitized export adapter. |
| [S-025](workbench/specs/S-025-intelligence-synthesis-cost-control/SPEC.md) | Acceptance / owner gate | CIC Engineer; Kayden (cost acceptance) | none | 2026-07-20: tracer-bullet slice delivered — overview synthesis is TTL-cached on the server, a manual Refresh forces a fresh synthesis, and CIC_INTELLIGENCE_AUTOSYNTH=off serves the deterministic fallback at zero OpenAI cost; 14 intelligence tests green (7 new). | Owner reviews and merges the branch into Integration; owner accepts the reduced-cost behavior on the private runtime. |
| [S-005](workbench/specs/S-005-mobile-workbench-release-workflow/SPEC.md) | TK-002: Private phone acceptance over Meshnet (ready) | Kayden (owner acceptance) | none (owner phone acceptance received 2026-07-20) | 2026-08-18: its remaining mechanical green gate is folded into S-027/TK-007 so v1.0.1 preserves the already-accepted private phone workflow while replacing the surrounding operator surface. | Complete S-027/TK-007's full production green gate, then close this historical mobile workflow without a second deployment pass. |
| [S-022](workbench/specs/S-022-skill-catalog-visibility/SPEC.md) | TK-002: Widen coverage: parse and render every catalog entry in catalog order with per-entry name, definition, lane, availability, provenance, and freshness (ready) | CIC Engineer; Kayden (catalog acceptance) | none | 2026-07-21: TK-001 tracer bullet closed — one skill row flows end to end through server/skillCatalog.js (merged prior slice) → new GET /api/skills route → src/skillCatalogModel.js → src/skills.jsx Skills view, with an in-sync drift/freshness badge on desktop and mobile. | TK-002 — widen coverage to every catalog entry in order. |
<!-- hot-specs:end -->

Completed specs disappear from this projection. Their requirements, decisions,
acceptance, proof, completion, and supersession remain in the stable spec.

## Owner Decisions

| Spec | Decision | Options | Recommendation | Cost / impact | Owner | Next gate |
|---|---|---|---|---|---|---|
| none | No active owner decision. | n/a | n/a | none | Kayden | none |
