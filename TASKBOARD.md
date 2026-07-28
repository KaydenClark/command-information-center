# Command Information Center - Hot Taskboard

> Generated from LLM Workbench v2.3.

**Current focus:** Preserve operator trust while selecting the next evidence-backed capability.
**Owner:** Kayden (product); project agents (execution)
**Last updated:** 2026-07-28

This is an active execution projection, not a requirements store or proof archive.
Use `node tools/spec-workbench.mjs next --json` to select work.

## Active Specs

<!-- hot-specs:start -->
| Spec | Current slice | Owner | Blocker | Latest meaningful event | Next gate |
|---|---|---|---|---|---|
| [S-023](specs/S-023-foundry-harness-flow/SPEC.md) | TK-003: Replace the fixture reader with Audit Engine's sanitized live-export adapter. (blocked) | CIC Engineer | Audit Engine S-003 TK-003 | TK-001 and TK-002 delivered fixture-driven on `codex/s-023-harness-flow` per owner direction to not wait for the live Audit Engine reader. | Swap the injected fixture reader for Audit Engine S-003 TK-003's sanitized export adapter. |
| [S-025](specs/S-025-intelligence-synthesis-cost-control/SPEC.md) | Acceptance / owner gate | CIC Engineer; Kayden (cost acceptance) | none | 2026-07-20: tracer-bullet slice delivered — overview synthesis is TTL-cached on the server, a manual Refresh forces a fresh synthesis, and CIC_INTELLIGENCE_AUTOSYNTH=off serves the deterministic fallback at zero OpenAI cost; 14 intelligence tests green (7 new). | Owner reviews and merges the branch into Integration; owner accepts the reduced-cost behavior on the private runtime. |
| [S-005](specs/S-005-mobile-workbench-release-workflow/SPEC.md) | TK-002: Private phone acceptance over Meshnet (blocked) | Kayden (owner acceptance) | closure-only: final green-gate and secret-free demo proof missing | 2026-07-28: RETIRE S-005 as a new product implementation / ALREADY-DONE substantively. The audit records 39 targeted tests passed and owner phone acceptance on 2026-07-20; final green-gate and secret-free demo proof remain missing, so TK-002 stays non-done. | TK-002 — run the final green-gate and secret-boundary checks and capture the secret-free under-one-minute demo proof; close only after that evidence is recorded. |
| [S-022](specs/S-022-skill-catalog-visibility/SPEC.md) | TK-002: Widen coverage: parse and render every catalog entry in catalog order with per-entry name, definition, lane, availability, provenance, and freshness (blocked) | CIC Engineer; Kayden (catalog acceptance) | BLOCKED-STALE: reconcile `feature/s022-tk002-full-skill-catalog` at `0aed45f` with current checkout `c1e2fd2` before closure; no catalog schema change is needed | 2026-07-28: REVISE / BLOCKED-STALE. TK-002's full-catalog slice is on `feature/s022-tk002-full-skill-catalog` at `0aed45f`, while this checkout is `c1e2fd2`; reconcile before closure. TK-003 remains needed, and its source contract must move from Forge `skills/README.md` to `/Users/kayden/.agents/skills`. | TK-002 — reconcile `feature/s022-tk002-full-skill-catalog` at `0aed45f` with checkout `c1e2fd2`; then revise TK-003 against `/Users/kayden/.agents/skills`. No catalog schema change is needed. |
<!-- hot-specs:end -->

Completed specs disappear from this projection. Their requirements, decisions,
acceptance, proof, completion, and supersession remain in the stable spec.

## Owner Decisions

| Spec | Decision | Options | Recommendation | Cost / impact | Owner | Next gate |
|---|---|---|---|---|---|---|
| none | No active owner decision. | n/a | n/a | none | Kayden | none |
