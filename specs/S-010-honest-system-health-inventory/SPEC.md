# S-010 - Honest System Health Inventory

> Generated from LLM Workbench v2.3.

**Spec ID:** S-010
**Status:** active
**Priority:** 2
**Owner:** CIC Engineer; Kayden (health acceptance)
**Updated:** 2026-07-19
**Catalog description:** Make the System Health panel list only connectors that are actually part of the system, label every indicator with a real meaning, and keep each rollup status consistent with its own children so the panel never contradicts itself.
**Blockers:** none
**Latest event:** 2026-07-19 dashboard walkthrough (SPEC_DIARY items 1-6, 10) found never-connected connectors shown yellow, an unexplained "GPT OS FS" indicator, and a Personal Intelligence Platform rollup that reads stale/yellow while all of its children read healthy.
**Next gate:** TK-001 health source that classifies unwired connectors distinctly and enforces rollup-versus-children consistency.

## Outcome

Kayden opens the dashboard System Health panel and every row is a source that
is genuinely part of his operating system, each indicator has a
plain-language meaning, an unwired connector reads as "not configured" rather
than "degraded," and no rollup indicator is ever worse than the worst of its
own healthy children.

## Why It Matters

CIC's core promise is source truth without fabrication. The health panel today
violates that in two ways. First, it lists connectors (ClickUp, Linear, Notion,
Slack) that were never wired to CIC, so they surface as yellow/degraded and
imply a broken part of the system that does not actually exist; IFTTT reads
green though Kayden is unsure it has ever fired, and a "GPT OS FS" indicator has
no legible meaning. Second, the "Personal Intelligence Platform" rollup reads
stale/yellow while its own children (Contract, OpenBrain, CIC) all read healthy,
so the panel contradicts itself. Both erode the operator trust the whole product
exists to protect.

## Current Verified State

- Source health rows are driven by the summarized feed
  (`window.CIC_DATA` sources; ignored `data.js` in real deployments,
  `data.example.js` in demo) and normalized by `server/sourceNormalizer.js`.
- The demo feed lists only synthetic sources; the connectors Kayden saw
  (ClickUp, Linear, Notion, Slack, IFTTT) come from the private runtime feed and
  have no executable CIC adapter, so their status is not derived from a real
  reachability check.
- The Personal Intelligence Platform rollup is produced by
  `server/platformHealth.js` from a cached validated report and is rendered as a
  single status by `src/main.jsx`; it does not currently guarantee the rollup is
  no worse than its component checks.
- Indicator labels are passed straight through from the feed/report, so an
  opaque label such as "GPT OS FS" renders with no definition.

## Desired Behavior

- Every System Health row declares whether it is: wired-and-checked,
  configured-but-unreachable, or not-configured. A source with no executable
  adapter or reachability check reads as "not configured / informational," never
  as degraded.
- Each indicator carries a short human-readable definition (what the indicator
  represents and how its status is derived), surfaced inline or on hover.
- A rollup indicator is never worse than the worst status among its own
  children; when the report is merely stale, that is shown as "stale evidence"
  distinctly from "a child is unhealthy," and never overrides healthy children.
- Sources Kayden confirms are not part of the system are removed from the health
  inventory rather than shown as perpetual degraded rows.

## Decisions And Contracts

- The feed and the cached platform report remain the only source of health
  truth; this spec adds classification and consistency, not fabricated
  reachability probes.
- Removing or reclassifying a source is a feed/report content and normalization
  change, not a new second health store.
- Rollup-versus-children consistency is enforced in normalization/rendering and
  covered by deterministic tests.

## Non-Goals

- Building live executable adapters/probes for ClickUp, Linear, Notion, or Slack
  (each real adapter is its own later spec).
- Redesigning the whole dashboard layout (owned by S-012).
- Changing what the platform verifier checks (owned by the Personal Intelligence
  Platform project).

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Health-source classification (wired/configured/not-configured) plus per-indicator definitions | ready | none | pending |
| TK-002 | Rollup-versus-children consistency and distinct "stale evidence" state | ready | none | pending |
| TK-003 | Prune/relabel confirmed non-system connectors from the health inventory | blocked | Kayden confirms which sources to drop | pending |

## Ticket Done Contracts

### TK-001 - Health-Source Classification And Definitions

Done when `server/sourceNormalizer.js` (and any health payload it feeds) tags
each source with an explicit `configured` / `wired` classification and a
short definition string, unwired sources render as "not configured /
informational" rather than degraded, and deterministic fixtures prove each
classification including a source with no adapter.

### TK-002 - Rollup Consistency And Stale-Evidence State

Done when the platform-health rollup can never render a status worse than the
worst of its own children, a merely stale report renders a distinct
"stale evidence" state that does not override healthy children, and fixtures
prove the previously contradictory case (children healthy, rollup yellow) now
resolves consistently.

### TK-003 - Prune Non-System Connectors

Done when the connectors Kayden confirms are not part of the system are removed
from or relabeled in the health inventory (feed/report + normalization), with
before/after evidence, and no perpetual degraded row remains for an unwired
connector.

## Acceptance Criteria

- [ ] Every health row shows its classification (wired/configured/not-configured)
      and a legible definition.
- [ ] No unwired connector renders as "degraded."
- [ ] No rollup indicator is ever worse than the worst of its healthy children.
- [ ] A stale report renders as "stale evidence," distinct from a child failure.
- [ ] The opaque "GPT OS FS" indicator either carries a real definition or is
      removed.
- [ ] Desktop and mobile proof artifacts are recorded in spec evidence.

## Testing Seams

- Fixture feeds with wired, configured-unreachable, and no-adapter sources.
- Fixture platform reports: all children healthy + fresh, all children healthy +
  stale, and one child unhealthy.
- Contract test asserting rollup status is bounded by children status.

## Verification Procedure

1. Run the CIC test suite including new normalization and rollup contract tests.
2. Load the dashboard against each fixture and confirm classification, labels,
   and rollup consistency.
3. Record desktop and mobile screenshots in this spec's evidence.

## Evidence

| Date | Ticket | Verification | Result |
|---|---|---|---|
