# S-014 - Gmail Freshness And Money Snapshot Honesty

> Generated from LLM Workbench v2.3.

**Spec ID:** S-014
**Status:** active
**Priority:** 2
**Owner:** CIC Engineer; Kayden (acceptance)
**Updated:** 2026-07-19
**Catalog description:** Fix the broken Gmail Suggestions refresh, make the "7d" freshness label self-explanatory, and stop the Money Snapshot from presenting Gmail-parsed mentions as if they were a real account balance.
**Blockers:** none
**Latest event:** 2026-07-19 walkthrough (SPEC_DIARY items 12, 13, 14) found the Gmail Suggestions refresh button a no-op, an unexplained "7d" label, and a Money Snapshot that reflects only money mentions parsed from Gmail rather than any real financial source.
**Next gate:** TK-001 make the Gmail refresh honest (works or clearly reports why it cannot).

## Outcome

The Gmail Suggestions refresh either performs a real refresh or clearly reports
why it cannot, the "7d" label is self-explanatory, and the Money Snapshot is
either connected to a real financial source or relabeled so it never reads as an
account balance.

## Why It Matters

These three items each make CIC quietly dishonest. A refresh button that does
nothing implies the feed updated when it did not. An unexplained "7d" leaves the
operator guessing what a number covers. A "Money Snapshot" that is really just
Gmail-parsed money mentions reads as a balance and misleads financial judgment.
All three violate the source-truth-with-privacy promise.

## Current Verified State

- `refreshGmailSuggestions` (`server/gmail.js`) only performs a real refresh
  when `GMAIL_REFRESH_COMMAND` is configured; without it the action does not
  meaningfully refresh, yet the UI still offers the button.
- The "7d" label is rendered near Gmail suggestions in `src/main.jsx` /
  `src/freshness.js` with no inline explanation.
- The finance/Money data is built from `data.money.events` in
  `server/sourceNormalizer.js`, which are money-tagged items parsed from the
  Gmail feed, not a connected financial account or the Budgeting source.

## Desired Behavior

- The Gmail refresh performs a real update when an adapter is configured and,
  when it is not, either hides the control or shows an explicit "refresh not
  configured" state instead of a silent no-op; refresh outcome (success/age) is
  recorded and visible via existing `refresh_runs`.
- The "7d" label reads unambiguously (e.g., "last 7 days") inline or via tooltip.
- The Money Snapshot is relabeled to reflect its true source (money mentions
  from email) unless/until a real financial source is connected; if connected,
  it reads from that source with visible provenance.

## Decisions And Contracts

- Freshness continues to derive from durable `refresh_runs`, never from page-load
  time (existing invariant).
- Money content stays summarized and privacy-blur-compatible; no full financial
  records are stored to make the snapshot "real."
- Connecting a real financial source (e.g., Budgeting) is optional and, if done,
  additive with visible provenance.

## Non-Goals

- Building a full financial integration/aggregator (a real-source connection, if
  pursued, is its own bounded ticket).
- Building new non-Gmail feed adapters (tracked as a known risk in BLUEPRINT).
- Changing the privacy classifier.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Honest Gmail refresh: real refresh when configured, explicit "not configured" otherwise | ready | none | pending |
| TK-002 | Self-explanatory freshness labels (replace bare "7d") | ready | none | pending |
| TK-003 | Relabel Money Snapshot to its true source, with an optional real-source connection path | ready | none | pending |

## Ticket Done Contracts

### TK-001 - Honest Gmail Refresh

Done when the refresh control performs a real refresh when an adapter is
configured and, when it is not, is either hidden or renders an explicit
"refresh not configured" state (never a silent no-op); tests prove both paths and
that the outcome is recorded in `refresh_runs`.

### TK-002 - Self-Explanatory Freshness Labels

Done when the bare "7d" label reads unambiguously (spelled out or with a
tooltip) wherever it appears, verified by a rendered screenshot.

### TK-003 - Money Snapshot Honesty

Done when the Money Snapshot no longer presents Gmail-parsed mentions as a
balance — it is relabeled to its true source with visible provenance, and if a
real financial source is connected it reads from that source; tests/fixtures
prove the label and provenance.

## Acceptance Criteria

- [ ] The Gmail refresh never silently no-ops; it refreshes or explains why not.
- [ ] The "7d" label is self-explanatory.
- [ ] The Money Snapshot cannot be mistaken for a real account balance.
- [ ] Freshness still derives from `refresh_runs`, not page-load time.
- [ ] Desktop and mobile proof artifacts are recorded in spec evidence.

## Testing Seams

- Injected `execFileImpl` for Gmail refresh: configured-success, configured-fail,
  and not-configured.
- Fixtures for the Money Snapshot label/provenance with and without a real
  source.

## Verification Procedure

1. Run the CIC test suite including refresh and Money Snapshot tests.
2. Load the dashboard for the configured and not-configured refresh states.
3. Record screenshots of the refresh states, the freshness label, and the
   relabeled Money Snapshot in evidence.

## Evidence

| Date | Ticket | Verification | Result |
|---|---|---|---|
