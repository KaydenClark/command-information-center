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
| [S-005](specs/S-005-mobile-workbench-release-workflow/SPEC.md) | TK-002: Private phone acceptance over Meshnet (blocked) | Kayden (owner acceptance) | Owner Meshnet phone acceptance | Reviewed Integration build `79e04de` is running from the registered private-service worktree; the service restarted successfully and serves the new project-portfolio and released-Workbench UI. | Kayden opens the authenticated private CIC service from a phone over Meshnet and completes the under-one-minute acceptance demo. |
| [S-024](specs/S-024-daily-project-slice-receipts/SPEC.md) | TK-001: Parse a fail-honest daily receipt from each project's active spec, selected ticket, latest evidence row, source timestamp, and next gate. (ready) | CIC Engineer | none | Kayden authorized `/make-it-so` for the portfolio-wide daily slice loop and required visible CIC progress or a truthful reason for every enrolled project. | Claim TK-001 and derive the receipt model from project-owned taskboard/spec evidence. |
| [S-023](specs/S-023-foundry-harness-flow/SPEC.md) | TK-003: Replace the fixture reader with Audit Engine's sanitized live-export adapter. (blocked) | CIC Engineer | Audit Engine S-003 TK-003 | TK-001 and TK-002 delivered fixture-driven on `codex/s-023-harness-flow` per owner direction to not wait for the live Audit Engine reader. | Swap the injected fixture reader for Audit Engine S-003 TK-003's sanitized export adapter. |
| [S-022](specs/S-022-skill-catalog-visibility/SPEC.md) | TK-001: Read-only skill catalog source with provenance and drift detection (ready) | CIC Engineer; Kayden (catalog acceptance) | none | Kayden requested a CIC skills view on 2026-07-18 after a make-it-so/save-plan/save-work redesign session required repeated manual GitHub and filesystem checks. | TK-001 read-only catalog source with provenance and fail-closed reads. |
<!-- hot-specs:end -->

Completed specs disappear from this projection. Their requirements, decisions,
acceptance, proof, completion, and supersession remain in the stable spec.

## Owner Decisions

| Spec | Decision | Options | Recommendation | Cost / impact | Owner | Next gate |
|---|---|---|---|---|---|---|
| none | No active owner decision. | n/a | n/a | none | Kayden | none |
