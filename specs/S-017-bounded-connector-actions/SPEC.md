# S-017 - Bounded Connector Actions

> Generated from LLM Workbench v2.3.

**Spec ID:** S-017
**Status:** active
**Priority:** 2
**Owner:** CIC Engineer; Kayden (live device/account acceptance)
**Updated:** 2026-07-17
**Catalog description:** Keep non-project owner actions narrow, authenticated, source-specific, bounded, and honest about durable outcomes.
**Blockers:** none for TK-003; owner account/device state for TK-004
**Latest event:** Canon harvest created one action-safety owner for Gmail refresh and Spotify playback while preserving Workbench release in S-004 through S-006.
**Next gate:** After higher-priority canonical/freshness work, claim TK-003 for shared action-state and secret-boundary proof.

## Outcome

Kayden can invoke the supported Gmail update and Spotify playback controls from
CIC with fixed inputs, current auth, bounded external calls, and visible
success/degraded evidence without turning CIC into a generic connector executor.

## Why It Matters

Human-facing safe control is part of CIC's promise. Workbench release has a
deep dedicated contract, while Gmail and Spotify actions are implemented but
were covered only by the broad S-001 baseline and route documentation.

## Current Verified State

- Gmail refresh accepts no arbitrary browser command; the configured
  server-side command is parsed to executable/arguments without a shell and is
  bounded to 120 seconds.
- Spotify control accepts only `play`, `pause`, `next`, or `previous`, refreshes
  tokens server-side, and bounds playback API calls.
- Both routes are behind the app auth boundary when passcode protection is
  configured.
- Tests cover invalid actions, degraded state, token refresh, timeouts, and
  supported success paths.
- Workbench approval/handoff remains separately owned by S-004, S-005, and S-006.

## Desired Behavior

- Each connector action has a fixed allowlist and server-owned target/config.
- The UI shows pending, applied/success, degraded/failed, throttled or
  unavailable state based on server evidence.
- Duplicate clicks and overlapping requests are bounded.
- Tokens, configured commands, passcodes, raw provider responses, and private
  payloads never appear in URLs, browser storage, logs, screenshots, or
  persisted action detail.
- A connector failure affects only that action/source and preserves the prior
  known state or durable freshness evidence.

## Decisions And Contracts

- Gmail update and Spotify playback are separate source-specific adapters, not
  a generic action schema or command runner.
- Browser input cannot select executable, arguments, token, account, device ID,
  URL, method, or arbitrary Spotify action.
- S-013 owns freshness semantics for Gmail; this spec owns mutation safety and
  action-state presentation.
- S-004 through S-006 retain exclusive ownership of Workbench release actions.

## Non-Goals

- Generic connector automation, arbitrary HTTP requests, or shell execution.
- Adding new credentialed actions without a separate settled contract.
- Persisting full Gmail bodies, Spotify tokens, or private provider payloads.
- Claiming live account/device acceptance from mocked tests.

## Dependencies And Blockers

- S-013 for durable Gmail freshness semantics.
- S-014 for private authentication and secret boundaries.
- TK-004 requires owner account/device availability and may not create or
  expose credentials.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Fixed bounded Gmail update action | done | none | Archived v2.1 T-003/T-005 and current Gmail/API tests cover fixed config, shell-free parsing, timeout, failure, and durable result |
| TK-002 | Allowlisted Spotify OAuth and playback actions | done | none | Current Spotify/API tests cover scopes, session-gated OAuth, token refresh, allowlisted controls, timeout, and degraded state |
| TK-003 | Shared desktop/mobile action-state and secret-boundary proof | ready | TK-001, TK-002 | pending |
| TK-004 | Owner live Gmail/Spotify action acceptance | blocked | Owner account/device availability and approval | pending |

## Ticket Done Contracts

### TK-001 - Fixed Bounded Gmail Update Action

Done when the browser invokes only the fixed Gmail refresh route, the server
uses its configured shell-free executable/arguments with timeout, records
durable success/failure freshness, and persists no full message body or command
secret.

### TK-002 - Allowlisted Spotify OAuth And Playback Actions

Done when private OAuth preserves state/session, access refresh remains
server-side, playback accepts only four allowlisted actions, calls are bounded,
unsupported/no-device/no-token cases degrade explicitly, and no token reaches
the browser.

### TK-003 - Shared Desktop/Mobile Action-State And Secret-Boundary Proof

Done when desktop/mobile fixtures prove pending, success, failure, unavailable,
session-expired, and repeated-click behavior for both actions; mutation counts
are exact; inputs stay fixed; and bundle/storage/URL/log/screenshot scans contain
no command, passcode, token, or raw provider payload.

### TK-004 - Owner Live Gmail/Spotify Action Acceptance

Owner-gated. Done when Kayden elects to use already configured private
account/device state, observes one Gmail update result and one Spotify action
or honest unavailable state, and records a secret-free under-one-minute
artifact. This does not authorize credential creation or paid-service changes.

## Acceptance Criteria

- [x] Gmail update is fixed, shell-free, bounded, and durably evidenced.
- [x] Spotify OAuth/control is session-gated, server-secret, bounded, and allowlisted.
- [ ] Desktop/mobile action-state, duplicate, and secret-boundary proof is complete.
- [ ] Live account/device acceptance is owner-approved and secret-free.
- [ ] No generic connector executor or arbitrary target/input exists.

## Testing Seams

- Injected Gmail executable and Spotify fetch fixtures.
- API tests for exact request bodies and status/error boundaries.
- Desktop/mobile Playwright action mocks with mutation counts.
- Synthetic secret sentinels for bundle/storage/URL/log/screenshot scans.

## Verification Procedure

```bash
node --test test/gmail.test.js test/spotify.test.js test/api.test.js
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs doctor
```

## Documentation Impact

- Blueprint maps safe owner actions to Personal Tasks, canonical project
  actions, connector actions, and Workbench release owners.
- README and Runbook own supported connector action behavior and
  troubleshooting.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-17 | canon harvest | Created bounded connector-action owner from verified Gmail/Spotify behavior | Gmail, Spotify, auth, API, UI, and archive inspected; full Node/browser/build/audit plus control checks green | S-017, Blueprint coverage, Lexicon, and generated controls updated | TK-003 ready; TK-004 owner-gated |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- New connector actions require their own settled capability contract.

## Supersession

- Supersedes: connector-action portions of S-001's broad baseline
- Superseded by: none
