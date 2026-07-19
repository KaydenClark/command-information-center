# Spec Diary

A running, one-at-a-time log of raw UI/UX issues and questions from Kayden's
walkthroughs of the CIC dashboard (or other in-scope surfaces). This is a
capture format, not a proof archive: items here are unfiltered observations,
not triaged tickets. Promote an item into a spec/ticket once it's actioned;
do not delete the diary entry when that happens — mark it instead.

Format: logged verbatim, one at a time, in session order. No editorializing
at capture time. A future skill should formalize this flow (see entry below).

## Session 2026-07-19 — Dashboard walkthrough

1. Dashboard → System Health — ClickUp shows yellow, but it's never been
   connected. Question: why is it on the health list at all if unused?
2. Same panel — Linear also yellow. Same question: why listed if unused?
3. Same panel — Notion also yellow. Same question.
4. Same panel — Slack also yellow. Same question.
5. IFTTT shows green. Kayden believes this is the system used to trigger
   commands, but questions whether it's ever actually been used.
6. "GPT OS FS" (or similar label) shows green — unclear what this is.
   Kayden's guess: possibly "our mesh net"? Needs clarification on what this
   indicator actually represents.
7. Intelligence Brief widget currently generates on-demand (burning API
   tokens live) — should be pre-loaded/pre-computed from backend data
   instead, since there's already enough backend intelligence to not need a
   live generation call.
8. Intelligence Brief assistant — answers are noticeably more detailed now
   (improvement noted). But it's still not connected to any personal
   information about Kayden — needs that data connection.
9. All boxes on the dashboard have the small orange squares Kayden dislikes
   (recurring visual element to remove/change).
10. System Health panel — "Personal Intelligence Platform" shows
    stale/yellow, but its components (Contract, OpenBrain, CIC) all show
    healthy. Inconsistent — the rollup status contradicts its own children.
11. "Priority Task" widget surfaced "triage 24 open GitHub PRs" as the top
    task — worth a gut check on whether that's actually the right
    priority-selection logic, or just noise.
12. Dashboard — Gmail Suggestions widget: refresh button doesn't work
    (no-op/broken).
13. Same widget — "7d" label underneath is unclear. Kayden's guess: does it
    mean "over the last 7 days"? Needs a tooltip/clarification or
    confirmation.
14. "Money Snapshot" widget only reflects money-related mentions parsed
    from Gmail — it's not actually connected to a real financial source
    (e.g. the Budgeting sheet), so the number is misleading rather than an
    actual balance/snapshot.

## Session 2026-07-19 — Intelligence tab

15. Intelligence tab — clicking into the tab re-triggers a fresh
    Intelligence Briefing generation (duplicate API call/cost) even though
    it's the same content already generated on the Dashboard tab. Should
    reuse the cached result instead of regenerating.
16. Intelligence tab — that briefing is the only content on the entire tab,
    and it doesn't even fit the page properly on Kayden's monitor
    (layout/sizing issue). Given how much more intelligence data actually
    exists, either this tab should be removed or rebuilt into something
    substantially more useful — it's currently a near-empty, redundant page.

## Session 2026-07-19 — Briefing tab

17. Briefing tab — also doesn't use the full monitor space (Kayden notes
    he's on a very large monitor, but the layout should scale/fill better
    regardless).
18. Briefing tab — "Priority Actions" ranking logic is unclear/questionable.
    Kayden specifically disputes priority #2 being DigitalTome-related —
    doesn't feel like that should rank that high right now. Needs
    visibility into (or a fix to) how priority is scored.

## Session 2026-07-19 — Taskboard tab

19. Taskboard tab — praised as well done: correctly fills the whole monitor
    and resizes appropriately. (Positive note — no fix needed.)
20. Taskboard tab — the inbox/queue is meant to surface items actually
    blocked on Kayden, but it's instead functioning as a second Gmail
    inbox: 135 inbox items, vast majority just Gmail messages. Kayden
    acknowledges he hasn't been triaging it, but the underlying issue is
    Gmail items shouldn't be flooding in as Taskboard items in the first
    place — needs filtering/scoping so this stays a real blocked-on-me task
    view, not a mirrored inbox.
21. Taskboard/mirror reconciliation gap — moving a ticket on the CIC
    Taskboard (e.g., to a "done" column) is currently ambiguous or wrongly
    treated as the task being done in the actual workspace. Since CIC is a
    mirror and not the canonical brain, a move should instead mean "agent
    needs to verify/complete this in the real workspace" — not "this is
    already done." Needs a defined reconciliation system between mirror
    state and actual workspace state.
    - 21a. Related — no way to attach intent/instructions when moving a
      ticket. Example: a "doctor's appointment reminder" email sat in the
      inbox instead of auto-getting added to the calendar, because there
      was no mechanism for Kayden to tell the agent what action to take on
      it. Need: when a ticket is moved, Kayden should be able to specify
      the desired action (e.g., "add to calendar") so the agent can pick it
      up and execute — unless the right action is already
      unambiguous/intuitive from context.
22. Question — how long do "done" items stay visible/in the done column
    before they're cleared? (Needs an answer, not investigated yet — not
    yet looked up.)

## Promotion triage — 2026-07-19 (prep pass)

Diary items above are preserved verbatim (not deleted, per this file's rule).
Each is triaged into a stable spec below. Items marked ✎ are captured but not
yet actioned; they are covered by the spec's acceptance criteria and tickets.

| Diary items | Promoted to | Theme |
|---|---|---|
| 1, 2, 3, 4, 5, 6, 10 | S-010 (Honest System Health Inventory) | Health honesty: unwired connectors, opaque "GPT OS FS" label, rollup vs. children |
| 7, 8, 15 | S-011 (Precomputed, Personally-Grounded Intelligence Brief) | Brief cost/caching + personal grounding |
| 9, 16, 17 | S-012 (Full-Viewport Layout And Visual Cleanup) | Orange squares, non-filling tabs, redundant Intelligence tab |
| 11, 18 | S-013 (Transparent Priority Ranking) | Priority Task + Priority Actions ranking transparency |
| 12, 13, 14 | S-014 (Gmail Freshness And Money Snapshot Honesty) | Broken refresh, "7d" label, Money Snapshot honesty |
| 20, 21, 21a, 22 | S-015 (Taskboard Mirror Reconciliation And Inbox Scoping) | Mirror integrity, inbox scoping, move-intent, retention |
| 19 | none (positive note — Taskboard layout is the S-012 baseline) | — |

Process note / capture-skill request (below) is a harness/Forge concern, not a
CIC product spec; surfaced to the root prep summary rather than promoted here.

## Process note

Kayden wants a proper skill built for this reverse-grilling / one-at-a-time
capture flow (he talks, agent logs verbatim, /checkpoint-compatible). Not
built yet — this file is the manual stand-in for now.

<!-- Still on tab 4 of ~10 (Dashboard, Intelligence, Briefing, Taskboard done;
     tabs remaining as of this session). Resume by appending, not rewriting. -->
