# S-014 - Private Authenticated Operation And Privacy

> Generated from LLM Workbench v2.3.

**Spec ID:** S-014
**Status:** active
**Priority:** 1
**Owner:** CIC Engineer; Kayden (private-device acceptance)
**Updated:** 2026-07-17
**Catalog description:** Keep CIC usable from authenticated private desktop and mobile routes while secrets and sensitive summaries remain protected.
**Blockers:** none for TK-003; owner private-device acceptance over authenticated Meshnet for TK-004
**Latest event:** Kayden selected authenticated private Meshnet as the phone acceptance path; no public exposure is permitted.
**Next gate:** After S-012/TK-002, claim TK-003 for authenticated desktop/mobile coverage across the full surface.

## Outcome

Kayden can use CIC from a desktop or phone on an authenticated private
LAN/Meshnet route without exposing the app publicly, leaking server credentials,
or leaving sensitive summaries readable when Privacy mode is enabled.

## Why It Matters

Passcode auth, OAuth gating, responsive layout, and privacy blur are implemented,
but no cohesive stable spec owns the whole private operator boundary. S-005's
phone gate covers one Workbench card, not the rest of CIC.

## Current Verified State

- The live service listens on port 8787 and
  `/api/auth/status` reports `authRequired: true`.
- `server/app.js` gates API and Spotify OAuth routes behind the passcode session
  when configured.
- Session cookies are HttpOnly, SameSite=Lax, path-scoped, and cleared on logout.
- `src/privacy.js` classifies financial, purchase/device, and medical content;
  the shared class is used across main and Intelligence views.
- Browser tests cover public demo desktop/mobile flows and the Workbench card's
  authenticated mobile state matrix, but not a general authenticated
  full-surface phone workflow.

## Desired Behavior

- Private host/LAN/Meshnet access requires the configured app session before any
  private API or OAuth flow.
- Public exposure, public tunnels, router forwarding, and unauthenticated remote
  access are outside the supported path.
- Privacy mode consistently obscures all classified summaries and answers while
  ordinary operational labels remain usable.
- Server-only OpenAI, Supabase, OpenBrain, Spotify, GitHub/Keychain, runtime
  passcode, and local database values never enter client bundles, URLs,
  screenshots, logs, or committed fixtures.
- Desktop and mobile session expiry, login, logout, navigation, privacy mode,
  and safe action boundaries are repeatably testable.

## Decisions And Contracts

- Localhost may run without a passcode for synthetic development; a private
  remote host requires passcode protection.
- CIC is privately reachable, not publicly deployed.
- Privacy mode is a presentation safeguard, not encryption or authorization.
- Full raw personal feeds remain outside the committed repository and browser
  payload.
- S-005 TK-002 remains the Workbench-specific phone acceptance subset; one
  owner session may provide evidence for both gates when it covers both scopes.

## Non-Goals

- Public internet deployment or anonymous remote access.
- Treating Privacy mode as a substitute for authentication.
- Committing credentials, personal feeds, SQLite, browser state, or owner
  passphrases.
- Changing paid services or credential providers.

## Dependencies And Blockers

- A configured private runtime and passcode for owner acceptance.
- A private phone route supplied by the operator's LAN/Meshnet setup.
- TK-004 requires Kayden's actual device experience; automation may prepare but
  cannot claim that gate.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Passcode session and private OAuth boundary | done | none | Current API auth tests cover login, logout, session gating, and Spotify OAuth boundary |
| TK-002 | Shared sensitive-summary classification and Privacy mode | done | none | Current privacy unit tests plus source use across main and Intelligence views |
| TK-003 | General authenticated desktop/mobile workflow and secret-boundary proof | ready | TK-001, TK-002 | pending |
| TK-004 | Under-one-minute private phone owner acceptance | blocked | Owner private-device acceptance | pending |

## Ticket Done Contracts

### TK-001 - Passcode Session And Private OAuth Boundary

Done when auth status, login, logout, protected API, and OAuth entry/callback
behavior pass focused tests with and without configured passcode, and no
passcode value is persisted.

### TK-002 - Shared Sensitive-Summary Classification And Privacy Mode

Done when the shared classifier covers financial, purchase/device, and medical
content across Dashboard and Intelligence, Privacy mode obscures classified
content, and ordinary operations content remains readable.

### TK-003 - General Authenticated Desktop/Mobile Workflow And Secret-Boundary Proof

Done when protected fixture browser tests log in, navigate Dashboard,
Taskboard, Projects, Deployments, and Intelligence, toggle Privacy mode, exercise
one non-destructive action, expire/logout the session, and prove no protected
response is reachable unauthenticated. Bundle, storage, URL, screenshot, and
fixture scans must contain no runtime secrets.

### TK-004 - Under-One-Minute Private Phone Owner Acceptance

Owner-gated. Done when Kayden opens the current passcode-protected private
service from a phone over LAN/Meshnet, completes login/navigation/privacy and
one safe action in under one minute, and records a secret-free artifact. The
artifact may also satisfy S-005 TK-002 if it includes that release-card scope.

## Acceptance Criteria

- [x] Configured passcode protection gates private APIs and Spotify OAuth.
- [x] Shared privacy classification covers sensitive summary categories.
- [ ] Protected desktop/mobile browser workflows pass across the general CIC surface.
- [ ] Secret-boundary scans cover client bundle, browser storage, URLs, logs,
      screenshots, and fixtures.
- [ ] Kayden accepts the private phone workflow in under one minute.
- [ ] No public exposure is introduced.

## Testing Seams

- Temporary passcode-protected app fixture with isolated SQLite/feed.
- Auth API tests and desktop/mobile Playwright login/session flows.
- Privacy classifier tests plus rendered content checks.
- Static bundle/fixture secret-pattern scans using synthetic sentinels.

## Verification Procedure

```bash
node --test test/api.test.js test/privacy.test.js
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs doctor
```

## Documentation Impact

- Blueprint owns the private-host, auth, privacy, and secret boundaries.
- README and Runbook own private route/login/acceptance instructions without
  credentials.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-17 | canon harvest | Created general private-operation/privacy owner and preserved S-005's narrower release-card gate | Live auth status, source/tests, and S-005 inspected without secrets/private data; full Node/browser/build/audit plus control checks green | S-014, Blueprint coverage, Lexicon, and generated controls updated | TK-003 ready; TK-004 owner-gated |
| 2026-07-17 | owner decision checkpoint | Kayden selected authenticated private Meshnet for private-device acceptance. | Conversation decision only; no device session, credential, network exposure, or runtime change occurred. | S-014 and generated Taskboard updated. | TK-003/TK-004 proof and the private-device acceptance remain required. |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- Private reachability depends on owner-managed LAN/Meshnet state.
- Privacy mode does not replace access control.

## Supersession

- Supersedes: auth/privacy portions of S-001's broad baseline
- Superseded by: none
