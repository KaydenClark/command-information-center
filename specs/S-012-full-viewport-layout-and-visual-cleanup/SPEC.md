# S-012 - Full-Viewport Layout And Visual Cleanup

> Generated from LLM Workbench v2.3.

**Spec ID:** S-012
**Status:** active
**Priority:** 3
**Owner:** CIC Engineer; Kayden (visual acceptance)
**Updated:** 2026-07-19
**Catalog description:** Make the Briefing and Intelligence tabs fill a large monitor the way the Taskboard already does, remove the disliked orange-square motif from dashboard boxes, and resolve the near-empty redundant Intelligence tab.
**Blockers:** none
**Latest event:** 2026-07-19 walkthrough (SPEC_DIARY items 9, 16, 17; positive reference item 19) found the Briefing and Intelligence tabs failing to use the full monitor, an orange-square element on every box that Kayden dislikes, and an Intelligence tab that holds only the (redundant) brief and does not fit the screen.
**Next gate:** TK-001 responsive layout that fills large viewports across tabs, matching the Taskboard baseline.

## Outcome

Every primary tab uses the available viewport the way the Taskboard tab already
does on Kayden's large monitor, the orange-square motif is gone from dashboard
boxes, and the Intelligence tab is either removed or rebuilt into something that
justifies its own tab rather than a near-empty duplicate of the Dashboard brief.

## Why It Matters

Kayden works on a very large monitor and several tabs waste most of it, while the
Intelligence tab shows only the same brief that already appears on the Dashboard
and does not even fit the page. The Taskboard tab is explicitly praised as
filling the monitor and resizing correctly (item 19), so it is the working
reference. The recurring orange squares are a persistent visual irritant. These
are polish/layout issues, not data-truth issues, but they degrade daily use.

## Current Verified State

- Layout and the orange-square accent live in `src/styles.css` and the tab
  containers in `src/main.jsx` / `src/intelligence.jsx`.
- The Taskboard tab already fills and resizes correctly and is the target
  baseline.
- The Intelligence tab (`src/intelligence.jsx`) currently renders essentially
  the brief only and shares content with the Dashboard (see S-011).

## Desired Behavior

- Briefing and Intelligence tabs fill the viewport and reflow responsively at
  large-desktop, laptop, and mobile widths, consistent with the Taskboard tab.
- The orange-square motif is removed (or replaced with an accent Kayden
  approves) across dashboard boxes.
- The Intelligence tab is resolved: either removed (folding its unique value
  into the Dashboard) or rebuilt to present the deeper intelligence data that
  already exists, not a second copy of the brief.

## Decisions And Contracts

- Visual work follows the existing SLK brand system in `src/styles.css`; no new
  house style is invented.
- The Intelligence-tab decision (remove vs. rebuild) is an owner decision
  recorded before implementation; default recommendation is rebuild only if it
  carries data the Dashboard does not, otherwise remove.
- Layout changes preserve existing functionality and the S-011 shared-brief
  contract.

## Non-Goals

- Changing brief generation/caching (owned by S-011).
- Changing health/priority/data semantics (owned by S-010, S-013).
- A full rebrand or new color system.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Full-viewport responsive layout for Briefing and Intelligence matching the Taskboard baseline | ready | none | pending |
| TK-002 | Remove/replace the orange-square motif across dashboard boxes | ready | none | pending |
| TK-003 | Resolve the Intelligence tab: remove or rebuild per owner decision | blocked | Owner decision (remove vs. rebuild) | pending |

## Ticket Done Contracts

### TK-001 - Full-Viewport Responsive Layout

Done when the Briefing and Intelligence tabs fill the viewport and reflow
correctly at large-desktop, laptop, and mobile widths, verified with browser
screenshots at each width against the Taskboard baseline.

### TK-002 - Remove Orange-Square Motif

Done when the orange-square accent is removed or replaced across dashboard boxes
with an owner-approved treatment, with before/after screenshots in evidence and
no remaining stray instances.

### TK-003 - Resolve The Intelligence Tab

Done when the Intelligence tab is either removed (with its unique value folded
into the Dashboard) or rebuilt to present distinct intelligence data, per the
recorded owner decision, with proof it is no longer a near-empty duplicate.

## Acceptance Criteria

- [ ] Briefing and Intelligence tabs fill the viewport and reflow at large,
      laptop, and mobile widths.
- [ ] No orange-square motif remains on dashboard boxes.
- [ ] The Intelligence tab is no longer a near-empty duplicate brief.
- [ ] No functional regression in the affected tabs.
- [ ] Desktop and mobile proof artifacts are recorded in spec evidence.

## Testing Seams

- Browser screenshots at defined breakpoints (large desktop, laptop, mobile).
- Visual scan for the orange-square selector's removal.

## Verification Procedure

1. Build and run CIC; open Briefing and Intelligence at each breakpoint.
2. Capture before/after screenshots for layout and the orange-square change.
3. Record the Intelligence-tab decision and its resulting state in evidence.

## Evidence

| Date | Ticket | Verification | Result |
|---|---|---|---|
