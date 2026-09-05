# S-026 - Awaiting You Owner Queue

> Generated from LLM Workbench v2.3. This stable path never moves.

**Spec ID:** S-026
**Status:** complete
**Priority:** 0
**Owner:** CIC Engineer; Kayden (queue acceptance)
**Updated:** 2026-07-20
**Catalog description:** Give Kayden one aggregated "Awaiting You" surface that names every owner decision and owner-gated blocker across all projects, with the exact decision needed and a direct jump to the item.
**Blockers:** none
**Latest event:** Spec completed and removed from the hot board.
**Next gate:** none

## Outcome

CIC shows a single top-level **Awaiting You** view that lists, across every
discovered project, the items that are blocked on Kayden: open Owner Decision
rows and owner-gated blocked tickets/specs. Each item states the exact decision
or acceptance being asked for, plus options, recommendation, cost/impact, and
the next gate where the source records them, and offers a one-tap jump to the
originating project spec. A sidebar and mobile badge shows the count. When
nothing awaits the owner, the view says so honestly instead of inventing work.

## Why It Matters

Owner-gated work is only visible per project today. The per-board "Decisions
needed" section renders one project at a time and, in practice, matches neither
the real `## Owner Decisions` table shape nor the way blocked specs record that
they wait on Kayden. To find what is blocked on him, Kayden must open every
project board and reverse-engineer which blockers are actually his to clear.
A single aggregated queue removes that scavenger hunt.

## Decisions And Contracts

- Project Markdown and Git remain canonical. CIC derives the queue from each
  project's `TASKBOARD.md` Owner Decisions table and stable `specs/*/SPEC.md`
  blocker/next-gate metadata. It writes no queue, task, claim, or approval.
- The queue scans exactly the projects the canonical Projects surface discovers;
  it never silently drops a project.
- An **owner decision** is an open row in a board's `## Owner Decisions` (or
  legacy `## Pending Decisions`) table whose reference and decision cells are
  present and not a none-sentinel, whose status (when present) is not resolved,
  and whose owner is Kayden or unspecified.
- An **owner-gated blocker** is a spec- or ticket-level blocker that names the
  owner or Kayden and is not already resolved (`on record`, `received`,
  `granted`, `waived`, `already …`). A blocker that only references other
  tickets, specs, or projects is a dependency, not an owner gate, and is
  excluded. Spec-level owner gates suppress duplicate ticket-level rows for the
  same spec.
- Each item exposes: project, spec/ticket id, the exact decision or blocker
  text, options, recommendation, cost/impact, next gate, and owner — quoted
  from the source so the owner never reverse-engineers the ask.
- The one-tap action is a safe, read-only deep link that opens the owning
  project spec in the Projects view. CIC does not fabricate an "approve" button:
  resolving an owner decision is a durable spec-document edit that goes through
  review, so an unattended dashboard mutation is out of contract.
- Missing or malformed owner metadata renders as an honest empty/degraded state;
  CIC never shows a healthy "nothing awaits you" when a board could not be read.

## Non-Goals

- Applying, approving, deciding, or closing any owner decision from CIC.
- Editing project specs, taskboards, or Git from the queue.
- Replacing the per-project Projects view, stable specs, or root scheduling.
- Adding a recurring CIC scheduler or new durable storage.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Aggregate open owner decisions and owner-gated blockers across all discovered boards/specs and expose one read-only GET `/api/awaiting-you` route. | done | none | server/awaitingYou.js collector + GET /api/awaiting-you route; test/awaitingYou.test.js 5 pass (classifier, cross-project aggregation, exact-decision detail, API route, honest empty); taskboards.js decision parser now reads the real Owner Decisions table; full node suite 282 pass, 3 pre-existing S-024 date-fixture failures unchanged; against live Modules root the queue surfaces OpenBrain S-007 owner gate only. |
| TK-002 | Render the top-level Awaiting You view with per-item exact-decision detail, safe deep-link action, honest empty state, sidebar + mobile badge count, and desktop/mobile proof. | done | TK-001 | src/awaitingYou.jsx view + NAV item + sidebar/mobile badge + deep-link into Projects (src/projectTaskboards.jsx focus props); test/browser/awaitingYou.spec.js 4 pass (items with exact decision text, badge count, deep link, honest empty) on desktop and iPhone 13; full browser suite 22 pass, 8 expected skips; full node suite 282 pass, 3 pre-existing S-024 date-fixture failures unchanged; production build clean; desktop/mobile screenshots artifacts/s-026-awaiting-you-desktop.png and -mobile.png. |

## Acceptance Criteria

- [x] The queue aggregates open Owner Decision rows and owner-gated blockers
  from every project the Projects surface discovers, in one response.
- [x] Owner decisions parse from the real `## Owner Decisions` table shape
  (Spec reference column, no Status column) and legacy Pending Decisions tables.
- [x] Dependency-only blockers (other tickets/specs/projects) and already-
  resolved owner notes are excluded; genuine owner gates are included.
- [x] Each item states the exact decision/blocker, options, recommendation,
  cost/impact, next gate, and owner quoted from source.
- [x] A top-level Awaiting You view lists each item with a safe deep link to its
  project spec and shows an honest empty state when nothing awaits the owner.
- [x] Sidebar and mobile navigation show an accurate awaiting-count badge.
- [x] Desktop and 375px mobile proof are readable without page overflow.

## Testing Seams

- Temporary project roots with Owner Decisions tables (open, none-sentinel, and
  non-Kayden owner rows), owner-gated spec/ticket blockers, dependency-only
  blockers, and resolved owner notes.
- Model tests for the owner-gate classifier and the aggregate collector.
- API test for the GET route shape over a fixture projects root.
- React/server-render and browser fixtures for item detail, empty state, badge
  count, and narrow-screen containment.

## Documentation Impact

- `BLUEPRINT.md` owns the read-only derived-view boundary, the new route, and
  the owner-gate contract.
- `README.md` documents the Awaiting You surface and the operator check.
- This spec owns the classifier contract, proof, and completion.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-20 | spec | Opened S-026 to aggregate owner-gated work into one Awaiting You surface. | Inspected existing taskboards parser, Projects view, and real board/spec data; confirmed the current per-board decision parser matches neither the real Owner Decisions table shape nor how blocked specs record owner gates. No runtime behavior is claimed by this planning row. | Added S-026 and its Blueprint catalog entry. | Implement TK-001 collector/route and TK-002 view/badge, then capture desktop/mobile proof. |
| 2026-07-21 | TK-001 | Ticket closed | server/awaitingYou.js collector + GET /api/awaiting-you route; test/awaitingYou.test.js 5 pass (classifier, cross-project aggregation, exact-decision detail, API route, honest empty); taskboards.js decision parser now reads the real Owner Decisions table; full node suite 282 pass, 3 pre-existing S-024 date-fixture failures unchanged; against live Modules root the queue surfaces OpenBrain S-007 owner gate only. | S-026 evidence appended; Blueprint/README in TK-002. | TK-002 frontend view, sidebar badge, and desktop/mobile visual proof. |
| 2026-07-21 | TK-002 | Ticket closed | src/awaitingYou.jsx view + NAV item + sidebar/mobile badge + deep-link into Projects (src/projectTaskboards.jsx focus props); test/browser/awaitingYou.spec.js 4 pass (items with exact decision text, badge count, deep link, honest empty) on desktop and iPhone 13; full browser suite 22 pass, 8 expected skips; full node suite 282 pass, 3 pre-existing S-024 date-fixture failures unchanged; production build clean; desktop/mobile screenshots artifacts/s-026-awaiting-you-desktop.png and -mobile.png. | BLUEPRINT.md route/screen/endpoint/invariant and README.md Awaiting You section + API row updated; S-026 completion recorded. | none |
| 2026-07-21 | spec | Spec completed | Acceptance gates satisfied | Documentation impact recorded above | none |

## Completion Result

CIC now has a top-level **Awaiting You** view backed by
`GET /api/awaiting-you` (`server/awaitingYou.js`). The collector scans every
project the Projects surface discovers and returns two kinds of item: open Owner
Decision rows (parsed from the real `## Owner Decisions` table shape, which the
prior per-board parser never matched) and owner-gated blocked spec/ticket items,
while excluding dependency-only blockers and already-resolved owner notes. Each
item quotes the exact decision/blocker, options, recommendation, cost/impact,
next gate, and owner, and offers a read-only deep link into the owning project
spec — no approve/resolve mutation, honoring the review boundary. A sidebar and
mobile badge shows the count and the view has an honest empty state.

Verified: `test/awaitingYou.test.js` (5) and `test/browser/awaitingYou.spec.js`
(4, desktop + iPhone 13) pass; full node suite 282 pass / 6 todo with the 3
pre-existing S-024 date-fixture failures unchanged; full browser suite 22 pass /
8 expected skips; production build clean; `npm audit --omit=dev` clean; spec
doctor and render green. Desktop/mobile proof:
`artifacts/s-026-awaiting-you-desktop.png` and
`artifacts/s-026-awaiting-you-mobile.png`. Against the live `Foundry/Modules`
root the queue surfaces the genuine OpenBrain S-007 owner gate and correctly
excludes the already-accepted CIC S-005 and dependency-blocked specs.

The 3 pre-existing failures are date-brittle S-024 receipt fixtures (they
hardcode 2026-07-20 as "today"; the machine clock has advanced). They are
unrelated to this spec and were failing on the Integration baseline before this
work; flagged for a separate fix.

## Supersession

- Supersedes: none.
- Refines: S-007 Spec-Grouped Project Tickets and S-024 Daily Project Slice Receipts.
