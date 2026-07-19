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
| [S-015](specs/S-015-taskboard-mirror-reconciliation-and-inbox-scoping/SPEC.md) | TK-001: Scope the inbox/queue to real blocked-on-owner items (filter/lane email-derived cards) (ready) | CIC Engineer; Kayden (workflow acceptance) | none | 2026-07-19 walkthrough (SPEC_DIARY items 20, 21, 21a, 22) found the inbox functioning as a second Gmail inbox (135 items, mostly raw email), a reconciliation gap where moving a card is wrongly read as the task being done in the real workspace, no way to attach intent/instructions on a move, and an open question about how long done items persist. | TK-001 scope the inbox/queue to real blocked-on-owner items instead of mirroring the Gmail inbox. |
| [S-010](specs/S-010-honest-system-health-inventory/SPEC.md) | TK-001: Health-source classification (wired/configured/not-configured) plus per-indicator definitions (ready) | CIC Engineer; Kayden (health acceptance) | none | 2026-07-19 dashboard walkthrough (SPEC_DIARY items 1-6, 10) found never-connected connectors shown yellow, an unexplained "GPT OS FS" indicator, and a Personal Intelligence Platform rollup that reads stale/yellow while all of its children read healthy. | TK-001 health source that classifies unwired connectors distinctly and enforces rollup-versus-children consistency. |
| [S-011](specs/S-011-precomputed-personal-intelligence-brief/SPEC.md) | TK-001: Server-side precomputed brief with persistence, freshness, and cooldown (ready) | CIC Engineer; Kayden (brief acceptance) | none | 2026-07-19 walkthrough (SPEC_DIARY items 7, 8, 15) found the brief generating on demand and burning API tokens on every Dashboard load, regenerating again when the Intelligence tab is opened, and still not connected to any personal information about Kayden. | TK-001 server-side precomputed brief with freshness and a cache reused across surfaces. |
| [S-014](specs/S-014-gmail-freshness-and-money-snapshot-honesty/SPEC.md) | TK-001: Honest Gmail refresh: real refresh when configured, explicit "not configured" otherwise (ready) | CIC Engineer; Kayden (acceptance) | none | 2026-07-19 walkthrough (SPEC_DIARY items 12, 13, 14) found the Gmail Suggestions refresh button a no-op, an unexplained "7d" label, and a Money Snapshot that reflects only money mentions parsed from Gmail rather than any real financial source. | TK-001 make the Gmail refresh honest (works or clearly reports why it cannot). |
| [S-012](specs/S-012-full-viewport-layout-and-visual-cleanup/SPEC.md) | TK-001: Full-viewport responsive layout for Briefing and Intelligence matching the Taskboard baseline (ready) | CIC Engineer; Kayden (visual acceptance) | none | 2026-07-19 walkthrough (SPEC_DIARY items 9, 16, 17; positive reference item 19) found the Briefing and Intelligence tabs failing to use the full monitor, an orange-square element on every box that Kayden dislikes, and an Intelligence tab that holds only the (redundant) brief and does not fit the screen. | TK-001 responsive layout that fills large viewports across tabs, matching the Taskboard baseline. |
| [S-013](specs/S-013-transparent-priority-ranking/SPEC.md) | TK-001: Documented scoring model with per-item rationale surfaced in the UI (ready) | CIC Engineer; Kayden (ranking acceptance) | none | 2026-07-19 walkthrough (SPEC_DIARY items 11, 18) questioned "triage 24 open GitHub PRs" surfacing as the top priority and disputed a DigitalTome item ranking #2 in Priority Actions, with no visibility into how priority is scored. | TK-001 expose the priority score/reasoning behind each ranked item. |
| [S-022](specs/S-022-skill-catalog-visibility/SPEC.md) | TK-001: Read-only skill catalog source with provenance and drift detection (ready) | CIC Engineer; Kayden (catalog acceptance) | none | Kayden requested a CIC skills view on 2026-07-18 after a make-it-so/save-plan/save-work redesign session required repeated manual GitHub and filesystem checks. | TK-001 read-only catalog source with provenance and fail-closed reads. |
<!-- hot-specs:end -->

Completed specs disappear from this projection. Their requirements, decisions,
acceptance, proof, completion, and supersession remain in the stable spec.

## Owner Decisions

| Spec | Decision | Options | Recommendation | Cost / impact | Owner | Next gate |
|---|---|---|---|---|---|---|
| none | No active owner decision. | n/a | n/a | none | Kayden | none |
