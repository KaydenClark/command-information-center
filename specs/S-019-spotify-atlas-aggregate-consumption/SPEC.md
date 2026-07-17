# S-019 - Spotify Atlas Aggregate Consumption

> Generated from LLM Workbench v2.3.

**Spec ID:** S-019
**Status:** active
**Priority:** 2
**Owner:** CIC Engineer; Spotify S-006 owns the producer contract; Kayden owns private configuration and live acceptance
**Updated:** 2026-07-17
**Catalog description:** Consume a versioned, bounded Spotify Atlas aggregate projection in CIC with explicit provenance, freshness, privacy, and degraded-state evidence.
**Blockers:** none for TK-001 synthetic contract work; Spotify S-006 producer endpoint for TK-002; private live configuration is intentionally deferred
**Latest event:** Kayden chose a clearly labeled fixture overview now, then a small live headline summary plus Atlas link-out after producer and consumer proof; no private Atlas read is approved yet.
**Next gate:** After higher-priority trust repairs, claim TK-001 and lock the versioned synthetic producer/consumer contract.

## Outcome

Kayden can inspect useful Spotify Atlas listening aggregates directly in CIC
with honest source, freshness, privacy, and failure state, while Spotify Atlas
remains the source-backed producer and CIC retains its existing playback
workflow and Atlas link-out.

## Why It Matters

CIC currently exposes Spotify playback plus library values from its summarized
feed and provides only an optional `ATLAS_URL` link to the deeper Atlas
experience. Spotify Atlas already owns a bounded aggregate dashboard direction,
but CIC has no server-side consumer, versioned compatibility contract, or
freshness/degradation proof for those aggregates. A dedicated capability owner
prevents a private listening-history integration from becoming an unbounded
proxy or an unlabeled fallback.

## Current Verified State

- CIC's Music surface reads playback from its Spotify adapter and library
  values from the summarized CIC feed.
- `ATLAS_URL` is exposed only as a browser link; CIC does not currently fetch
  Atlas aggregate data.
- Spotify Atlas currently binds to loopback by default and has health/dashboard
  routes that require bearer authorization only when
  `SPOTIFY_ATLAS_API_TOKEN` is configured, plus a five-second bounded
  server-side Supabase snapshot read and a synthetic dashboard contract.
- The current Atlas dashboard envelope exposes `generated_at`,
  `data_freshness`, `last_sync_status`, and a broader dashboard payload, but it
  is not yet the dedicated versioned CIC projection required by this spec.
- The checked-out Spotify project currently has S-001 through S-003. The
  producer-side S-006 named by the authorized cross-project plan is a future
  dependency and must reference this CIC checkpoint; it is not treated as
  already implemented.
- No private Atlas URL, bearer token, aggregate response, or live request was
  read during this Planner task.

## Desired Behavior

- Spotify Atlas exposes `GET /api/spotify/cic-aggregate` as a read-only,
  token-guarded producer contract with
  `contract_version: "spotify-atlas.cic-aggregate.v1"`.
- The producer envelope contains only `ok`, `contract_version`, `source`,
  `generated_at`, `data_freshness`, `last_sync_status`, and `aggregates`.
- `aggregates` contains bounded totals, `4w` and `all` summaries, at most five
  top artists and five top tracks per period, and at most twelve monthly
  play/minute points. Raw stream rows, recent individual plays, device data,
  playlist membership, account identifiers, provider tokens, and arbitrary
  extra fields are rejected.
- CIC contacts the exact server-configured Atlas API URL only from an
  authenticated server route, sends the bearer token only in the request
  header, and never derives the API target from browser input or `ATLAS_URL`.
- CIC validates the version, shape, types, timestamps, field allowlist,
  cardinality, and response-size ceiling before returning a smaller normalized
  browser payload.
- CIC records the Atlas contact attempt and last successful acceptance through
  the common S-013 freshness seam. `data_freshness` remains producer data age;
  CIC request or render time never replaces it.
- Missing configuration, auth rejection, timeout/network failure, upstream
  failure, schema/version mismatch, oversized response, stale data, and
  non-successful producer sync each remain distinct, visible degraded states.
- A failed Atlas read does not break Spotify playback, the existing feed
  library summary, or the Atlas link. Any retained older aggregate keeps its
  original provenance and age and is never relabeled as current.
- Aggregate artist/track names and listening patterns use CIC's
  privacy-sensitive presentation and remain blur-compatible.

## Decisions And Contracts

- Spotify Atlas is the producer and canonical owner of listening-history
  aggregate calculation. CIC is a read-only consumer and does not recompute
  aggregates from raw exports or database rows.
- Spotify S-006 owns the matching producer endpoint, version, authentication,
  synthetic fixture, and compatibility proof. CIC S-019 owns the consumer,
  normalization, presentation, freshness, and degradation contract.
- `SPOTIFY_ATLAS_API_URL` is the exact server-side read endpoint and
  `SPOTIFY_ATLAS_API_TOKEN` is its bearer secret. Both are required for a live
  configured read; missing either returns `not_configured` without a request.
- `ATLAS_URL` remains a browser link only. It cannot supply the API target,
  credentials, or proof that Atlas data was contacted.
- The CIC request lifetime is five seconds and the accepted response body is at
  most 256 KiB. Tests inject fetch, clock, and abort seams; they do not contact
  private Atlas or Spotify services.
- The normalized CIC status vocabulary is `ready`, `stale`,
  `not_configured`, `auth_required`, `unavailable`, or `invalid`.
- S-013 owns common attempt/success/age semantics; S-014 owns authenticated
  private operation and blur-compatible privacy; S-017 retains Spotify OAuth
  and playback actions.
- CIC never exposes Atlas bearer credentials, producer response bodies, raw
  listening events, service-role configuration, or internal network details.

## Non-Goals

- Replacing the full Spotify Atlas dashboard or removing the Atlas link.
- Proxying `/api/spotify/dashboard`, `/api/spotify/sync`, Supabase, arbitrary
  Atlas paths, or raw listening-history queries through CIC.
- Adding a Spotify sync, playlist, playback, or account-write action.
- Reading private configuration or making a live request during planning,
  implementation fixtures, or automated verification.
- Persisting raw producer responses, individual listening events, or a second
  listening-history database in CIC.
- Claiming producer S-006 or configured live acceptance before its own proof
  and owner gate pass.

## Dependencies And Blockers

- Spotify S-006 must implement the exact
  `spotify-atlas.cic-aggregate.v1` producer contract and publish a synthetic
  compatibility fixture that references this CIC spec checkpoint.
- S-013 supplies durable source-attempt/success/age semantics.
- S-014 supplies private authentication and sensitive-content presentation.
- S-017 remains the exclusive owner of Spotify playback mutation safety.
- TK-005 requires Kayden to approve existing private endpoint/token use. No
  credential creation, secret edit, service deployment, or account write is
  implied.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Versioned CIC aggregate contract validator and synthetic compatibility fixture | ready | none | pending |
| TK-002 | Server-only bounded Atlas consumer with explicit config and degraded states | blocked | TK-001; Spotify S-006 producer endpoint and fixture | pending |
| TK-003 | Provenance-aware Atlas aggregate API and Music presentation without playback coupling | blocked | TK-002; S-013 freshness seam; S-014 privacy boundary | pending |
| TK-004 | Desktop/mobile compatibility, failure, freshness, privacy, and documentation proof | blocked | TK-003 | pending |
| TK-005 | Owner-approved private Atlas configuration and live read acceptance | blocked | TK-004; Kayden approval and existing private endpoint/token | pending |

## Ticket Done Contracts

### TK-001 - Versioned Contract Validator And Synthetic Fixture

Done when red/green tests define
`spotify-atlas.cic-aggregate.v1`, commit a wholly synthetic producer fixture,
and validate the exact envelope, source, timestamps, sync status, numeric
totals, `4w`/`all` period summaries, five-item artist/track caps, twelve-item
monthly cap, 256 KiB ceiling, and rejection of unknown/raw-event fields. The
fixture and contract digest are suitable for Spotify S-006 to consume as its
producer compatibility checkpoint.

Closing proof: targeted contract tests fail before the validator exists, pass
after it is implemented, reject malformed/version-drift/oversized/private-field
fixtures, and pass the full CIC suite without reading a live source.

### TK-002 - Server-Only Bounded Atlas Consumer

Done when an injected-fetch adapter contacts only the exact configured endpoint,
requires URL plus bearer token, applies a five-second abort, accepts only the
TK-001 contract, and maps success, missing config, `401`/`403`, timeout/network,
upstream `4xx`/`5xx`, malformed JSON, version mismatch, oversized body, and
invalid shape to stable sanitized outcomes. No API URL, token, response body,
or internal error detail reaches the browser, logs, SQLite detail, or proof.

Closing proof: adapter/API tests assert exact URL/method/header/body behavior,
one request maximum, timeout cleanup, status mapping, response normalization,
secret sentinels, and compatibility with the exact synthetic fixture published
by Spotify S-006.

### TK-003 - Provenance-Aware CIC API And Music Presentation

Done when an authenticated fixed CIC route returns the smaller normalized
aggregate, source/version, producer generation and data-freshness timestamps,
last contact attempt/success, age, sync state, and honest normalized status.
The Music surface shows useful totals, `4w`/`all` top summaries, and monthly
trend without blending Atlas data into legacy feed values or playback state.
Playback controls and the Atlas link remain usable when the aggregate is
missing, stale, invalid, or unavailable.

Closing proof: API/component tests cover ready and every normalized degraded
state, prove S-013 attempt/success preservation, prove response/render time is
not source freshness, and show no request occurs from `/api/state` or page
render outside the fixed Atlas read route.

### TK-004 - Compatibility, Failure, Freshness, Privacy, And Docs Proof

Done when desktop/mobile browser fixtures show ready, stale, never configured,
auth required, unavailable with prior accepted aggregate, and invalid-version
states without overflow or false healthy labels. Artist, track, and listening
pattern fields are privacy-sensitive/blur-compatible, and bundle, DOM,
storage, URL, log, screenshot, and API scans contain no token, private URL,
raw event, account identifier, or unapproved producer field.

Closing proof: Playwright plus targeted/full Node, build, audit, contract
fixture/digest comparison, privacy sentinel, render, and doctor checks pass.
`.env.example`, README, Runbook, CONTRACT, Blueprint, and Lexicon document only
the implemented configuration, recovery, contract, ownership, and source-truth
behavior.

### TK-005 - Owner-Approved Private Live Acceptance

Owner-gated. Done when Kayden explicitly approves use of an existing private
Atlas endpoint/token, one bounded read returns the expected versioned aggregate,
the visible source/freshness/degraded behavior is checked in under one minute,
and a secret-free artifact records producer and CIC compatibility SHAs. This
ticket does not authorize credential creation/editing, producer deployment,
raw-data inspection, Spotify account writes, or cleanup of private state.

## Acceptance Criteria

- [ ] Spotify Atlas S-006 publishes and proves the exact
      `spotify-atlas.cic-aggregate.v1` producer contract against the CIC
      synthetic checkpoint.
- [ ] CIC validates, bounds, and normalizes the producer contract without
      exposing a generic proxy or raw listening history.
- [ ] Live configuration requires an exact server-owned URL and bearer token;
      browser input and `ATLAS_URL` cannot select the API target.
- [ ] Source, contract version, producer generation time, data freshness, sync
      status, last contact attempt/success, age, and stale state remain distinct.
- [ ] Missing config, auth, timeout/network, upstream, invalid/version,
      oversized, stale, and failed-sync states degrade visibly and safely.
- [ ] Spotify playback, legacy feed summaries, and the Atlas link remain
      independent and usable when aggregate consumption fails.
- [ ] Artist, track, and listening-pattern aggregates are privacy-sensitive and
      no token, private URL, raw event, account identifier, or provider body
      reaches browser or proof.
- [ ] Desktop/mobile automated proof and owner-approved live acceptance pass
      separately.

## Testing Seams

- Synthetic `spotify-atlas.cic-aggregate.v1` producer fixtures with a stable
  digest shared across the CIC consumer and Spotify S-006 producer tests.
- Injected Atlas fetch, abort timer, clock, freshness threshold, and response
  body reader.
- Contract fixtures for valid, empty, stale, auth rejected, timed out,
  unavailable, malformed, version drift, oversized, unexpected field, and raw
  event sentinel states.
- Temporary SQLite freshness records for `spotify_atlas`; no aggregate or
  secret persistence fixture uses private data.
- API/component tests plus desktop/mobile Playwright fixtures for independent
  aggregate, playback, legacy feed, and link behavior.
- Bundle/DOM/storage/URL/log/screenshot privacy sentinel scans.

## Verification Procedure

```bash
node --test test/atlasUrl.test.js test/spotify.test.js test/freshness.test.js test/api.test.js
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs render
node tools/spec-workbench.mjs doctor
```

Producer compatibility verification runs in Spotify S-006 against the exact
CIC TK-001 fixture/digest. Live acceptance remains separate and owner-gated.

## Documentation Impact

- Blueprint owns the Atlas-producer/CIC-consumer boundary and coverage row.
- Lexicon owns the CIC-safe Atlas aggregate term.
- `.env.example`, README, Runbook, and CONTRACT update when the adapter and
  versioned route actually exist; they must not advertise unimplemented private
  configuration during planning.
- S-013 and S-014 are referenced, not duplicated, for shared freshness and
  privacy behavior.
- Taskboard projects S-019 and its private-configuration owner gate after
  render.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-17 | Cross-project planning | Created the CIC consumer owner and exact producer checkpoint without reading private configuration or implementing a live integration | CIC and Spotify controls, current URL-only Music path, synthetic Atlas contract/API/tests, S-013, S-014, and S-017 inspected; 26 targeted tests and full Node suite with 230 passed/6 TODO passed; build, zero-vulnerability audit, render, doctor, and diff checks passed; no private Atlas request or source change | S-019, Blueprint coverage, Lexicon, and generated Taskboard updated; README, Runbook, CONTRACT, and environment docs intentionally wait for implementation | TK-001 ready; Spotify S-006 blocks TK-002; TK-005 owner-gated |
| 2026-07-17 | Auditor remediation | Corrected the current producer auth description without weakening the proposed consumer contract | Atlas server bind, optional-token authorization source, and focused producer/CIC tests inspected; no source, config, or live request change | S-019 current verified state corrected; coverage and mandatory `cic-aggregate` bearer contract unchanged | TK-001 remains ready; Spotify S-006 must implement mandatory bearer auth for the proposed producer route |
| 2026-07-17 | owner decision checkpoint | Kayden selected a clearly labeled fixture overview now. After producer/consumer proof, CIC may show only a small headline summary and link to Atlas for detail; private live configuration remains deferred. | Conversation decision only; no Atlas endpoint, bearer token, live request, or source change occurred. | S-019 and generated Taskboard updated. | S-019/S-006 proof remains required before reconsidering a private live read. |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- The current producer route is broader and unversioned for CIC use; Spotify
  S-006 must implement the dedicated contract before CIC TK-002 can close.
- No live endpoint/token is configured or accepted by this planning checkpoint.

## Supersession

- Supersedes: any implication that `ATLAS_URL` alone satisfies CIC integration
  with Spotify Atlas aggregate data
- Superseded by: none
