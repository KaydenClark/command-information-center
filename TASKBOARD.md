# Command Information Center - Hot Taskboard

> Generated from LLM Workbench v2.3.

**Current focus:** Preserve operator trust while selecting the next evidence-backed capability.
**Owner:** Kayden (product); project agents (execution)
**Last updated:** 2026-07-28

This is an active execution projection, not a requirements store or proof archive.
Use `node tools/spec-workbench.mjs next --json` to select work.

## Active Specs

<!-- hot-specs:start -->
| Spec FUID | Spec alias | Current ticket | Owner | Blocker | Last worked | Latest meaningful event | Next gate |
|---|---|---|---|---|---|---|---|
| 00006N | [S-027](specs/S-027-foundry-control-surface-v1-0-1/SPEC.md) | 00006U / TK-007: Run the full green gate, obtain independent immutable-SHA review, publish the producer checkpoint, install the exact reviewed build into the Module product, restart port 8787, and prove authenticated desktop/mobile production behavior and deployment provenance. (ready) | Codex | none for TK-001; live Job Order animation remains a separate future capability blocked by the Grounding Journal, Gatehouse/Sandcastle receipts, and Announced Activation. | 2026-08-18 | TK-006 closed with proof. | Complete TK-007. |
| 000003 | [S-028](specs/S-028-fuid-work-item-projection-and-intent/SPEC.md) | 00000E / TK-002: Add validated Intent creation/listing with six-character FUID allocation, transition/source-revision/idempotency checks, append-only events, and no Projection mutation. (ready) | Codex | TK-001 | 2026-08-18 | TK-001 closed with proof; TK-002 is ready after its dependency passed. | Complete TK-002. |
| 00006B | [S-023](specs/S-023-foundry-harness-flow/SPEC.md) | 00006E / TK-003: Replace the fixture reader with Audit Engine's sanitized live-export adapter. (blocked) | CIC Engineer | Audit Engine S-003 TK-003 | 2026-07-19 | TK-001 and TK-002 delivered fixture-driven on `codex/s-023-harness-flow` per owner direction to not wait for the live Audit Engine reader. | Swap the injected fixture reader for Audit Engine S-003 TK-003's sanitized export adapter. |
| 00006I | [S-025](specs/S-025-intelligence-synthesis-cost-control/SPEC.md) | Acceptance / owner gate | CIC Engineer; Kayden (cost acceptance) | none | 2026-07-20 | 2026-07-20: tracer-bullet slice delivered — overview synthesis is TTL-cached on the server, a manual Refresh forces a fresh synthesis, and CIC_INTELLIGENCE_AUTOSYNTH=off serves the deterministic fallback at zero OpenAI cost; 14 intelligence tests green (7 new). | Owner reviews and merges the branch into Integration; owner accepts the reduced-cost behavior on the private runtime. |
| 00005S | [S-005](specs/S-005-mobile-workbench-release-workflow/SPEC.md) | 00005U / TK-002: Private phone acceptance over Meshnet (ready) | Kayden (owner acceptance) | none (owner phone acceptance received 2026-07-20) | 2026-08-18 | 2026-08-18: its remaining mechanical green gate is folded into S-027/TK-007 so v1.0.1 preserves the already-accepted private phone workflow while replacing the surrounding operator surface. | Complete S-027/TK-007's full production green gate, then close this historical mobile workflow without a second deployment pass. |
| 000067 | [S-022](specs/S-022-skill-catalog-visibility/SPEC.md) | 000069 / TK-002: Widen coverage: parse and render every catalog entry in catalog order with per-entry name, definition, lane, availability, provenance, and freshness (ready) | CIC Engineer; Kayden (catalog acceptance) | none | 2026-07-21 | 2026-07-21: TK-001 tracer bullet closed — one skill row flows end to end through server/skillCatalog.js (merged prior slice) → new GET /api/skills route → src/skillCatalogModel.js → src/skills.jsx Skills view, with an in-sync drift/freshness badge on desktop and mobile. | TK-002 — widen coverage to every catalog entry in order. |
<!-- hot-specs:end -->

Completed specs disappear from this projection. Their requirements, decisions,
acceptance, proof, completion, and supersession remain in the stable spec.

## Owner Decisions

| Spec | Decision | Options | Recommendation | Cost / impact | Owner | Next gate |
|---|---|---|---|---|---|---|
| none | No active owner decision. | n/a | n/a | none | Kayden | none |
