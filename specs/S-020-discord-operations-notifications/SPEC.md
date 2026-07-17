# S-020 - Discord Operations Notifications

> Generated from LLM Workbench v2.3.

**Spec ID:** S-020
**Status:** active
**Priority:** 2
**Owner:** CIC Engineer; Kayden (Discord configuration, routing decision, and private live acceptance)
**Updated:** 2026-07-17
**Catalog description:** Deliver bounded, privacy-safe CIC operations alerts to Kayden's existing Discord without making Discord a source of truth or a remote-control surface.
**Blockers:** none for TK-001; Kayden must choose GitHub event routing before GitHub notifications; private Discord webhook and mention configuration for live acceptance
**Latest event:** Kayden selected Discord, which they already use, over Slack for CIC alerts and agent-operation notifications.
**Next gate:** After higher-priority CIC trust repairs, claim TK-001 and establish the fixed notification event and policy contract.

## Outcome

Kayden receives useful, configurable Discord alerts when CIC has a failure,
approval request, critical operations issue, completion, or daily digest, while
CIC remains the authoritative dashboard and record of work. Discord messages
link back to the corresponding CIC state; they neither become a second task
store nor execute actions.

## Why It Matters

CIC currently presents operations state but does not provide a notification
surface. Kayden already uses Discord, so a private Discord alert layer avoids
adding Slack solely for agent, GitHub, service, and CIC notifications. The
alert channel must be useful without leaking private data, producing routine
noise, or implying that a Discord post proves an underlying operation happened.

## Current Verified State

- CIC is a private React/Express operations surface with authenticated routes,
  source-specific connector actions, and explicit degraded states.
- The committed source has no Discord, Slack, webhook, or notification-router
  implementation. `data.example.js` contains only a synthetic
  `GitHub -> Chat` applet label; it is not an integration.
- Existing Gmail and Spotify mutations are separately bounded by S-017; source
  freshness is owned by S-013; private auth and secret boundaries are owned by
  S-014; and Workbench release handoff is owned by S-004 through S-006.
- CIC owns the human-facing monitoring/control surface, not canonical project
  task state, durable Wiki memory, or GitHub release mutation credentials.

## Desired Behavior

- Stage 1 sends server-originated, one-way Discord webhook messages only for
  explicitly allowlisted CIC notification events and fixed configured
  destinations.
- Each event has a stable severity, project/source reference when applicable,
  concise sanitized summary, timestamp, deduplication identity, and a link to
  the relevant CIC view or durable source record.
- Normal completions and commit/PR informational events post silently to the
  mapped project channel. Failures and approval requests post to their mapped
  alert channel and mention Kayden. Critical operations issues post to the
  critical channel and mention Kayden. Routine heartbeats stay in CIC; the
  system sends at most one configured daily digest.
- CIC records a bounded sanitized delivery attempt/outcome and shows an honest
  pending, delivered, suppressed, skipped, failed, or unavailable state. A
  successful Discord response is notification evidence only, never evidence
  that the underlying source refreshed, GitHub changed, or an action completed.
- Disabled or missing Discord configuration leaves CIC fully usable, sends no
  outbound request, and visibly reports that notifications are unavailable.
- Stage 2, if separately approved, may introduce a Discord bot for fixed
  commands such as opening an existing CIC task or submitting an approval
  request. CIC must reauthenticate, validate, execute, and record any action;
  Discord never receives a generic command runner.

## Decisions And Contracts

- Discord is an alert surface; CIC and the linked canonical project/source
  remain the source of truth.
- Stage 1 uses Discord incoming webhooks, not a bot token, OAuth flow, browser
  transport, or user-supplied URL/channel/mention target.
- Webhook URLs and the optional numeric Discord user/role mention identifier
  are server-only, ignored configuration. Tests use synthetic endpoints and
  sentinel values. They never enter browser payloads, logs, SQLite detail,
  screenshots, evidence, or commits.
- Configuration maps a finite named notification class to one fixed webhook
  destination. It is not a general HTTP client, chat relay, arbitrary webhook
  proxy, or cross-service command endpoint.
- The server bounds payload size, outbound request count, timeout, retry and
  backoff policy, and duplicate suppression by a stable event identity. A
  transport failure must not block or retry the underlying CIC action.
- Event producers attach their own source identity and durable outcome. The
  router may summarize and deliver that evidence but may not infer success from
  a page load, cached state, or its own previous delivery result.
- GitHub routing remains an owner decision: either GitHub sends a limited
  direct webhook to Discord, or an explicitly bounded CIC/GitHub adapter emits
  CIC notifications. Implementation must not enable both paths for the same
  event class or guess a GitHub credential, webhook, or subscription.
- Notification channel layout is private and operator-configured. The intended
  policy has `critical-alerts`, `approvals-needed`, `failed-tasks`, project
  channels, `agent-completions`, and `daily-digest`; channel names are labels,
  not a hard-coded public contract.

## Non-Goals

- Installing Slack, creating a public Discord server, or requiring a new chat
  application.
- Moving CIC, project, Wiki, GitHub, or agent state into Discord.
- Discord-driven retries, approvals, pauses, cancellations, shell commands, or
  generic bot controls in Stage 1.
- Arbitrary outbound HTTP requests, inbound Discord webhooks, message-history
  ingestion, full email bodies, raw provider responses, OAuth tokens, or
  private financial/device/account data.
- Configuring GitHub repository webhooks or Discord credentials as part of
  synthetic implementation proof.

## Dependencies And Blockers

- S-013 provides freshness semantics for any notification that references a
  source update; S-017 provides source-action safety; S-014 provides shared
  authentication and secret-boundary proof.
- Kayden must choose direct GitHub-to-Discord delivery or CIC-mediated GitHub
  events before a GitHub notification slice begins. Recommendation: start with
  CIC-mediated event delivery only where CIC already owns the durable event;
  use direct GitHub delivery only for repository events CIC cannot prove or
  should not poll.
- Private live acceptance requires an existing private Discord server, one
  configured webhook per selected class, optional mention identifier, and
  Kayden's approval. It does not authorize creating credentials, exposing CIC,
  or changing a GitHub repository.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Fixed notification event, severity, policy, and server-only configuration contract | ready | none | pending |
| TK-002 | Bounded Discord webhook dispatcher with sanitized durable delivery evidence | blocked | TK-001 | pending |
| TK-003 | CIC presentation, desktop/mobile notification-state proof, and privacy regression checks | blocked | TK-002 | pending |
| TK-004 | GitHub event routing decision and one bounded implementation path | blocked | Kayden routing decision; TK-001 through TK-003 | pending |
| TK-005 | Owner-approved private Discord live acceptance | blocked | private configuration and approval; TK-002/TK-003 | pending |

## Ticket Done Contracts

### TK-001 - Fixed Notification Event, Severity, Policy, And Server-Only Configuration Contract

Done when an explicit server-side notification event schema accepts only
allowlisted classes and severities, maps each class to a finite policy, rejects
arbitrary destination/content/mention input, and has deterministic disabled,
suppressed, deduplicated, and eligible outcomes. The schema defines the
sanitized fields available to a Discord embed/message and the stable CIC/source
link boundary. `.env.example` documents only names and formats, never real
webhook values or identifiers.

Closing proof: focused unit/API tests prove validation, policy mapping,
duplicate identity, payload truncation, disabled configuration, mention
allowlisting, and secret-sentinel exclusion without sending a real request.

### TK-002 - Bounded Discord Webhook Dispatcher With Sanitized Durable Delivery Evidence

Done when the server sends at most one policy-approved outbound request for an
eligible event to its fixed configured webhook, with bounded timeout, retry,
and backoff behavior; maps Discord success, rate limit, malformed response,
network failure, and unexpected error to stable sanitized results; and preserves
the source event even when delivery fails. Delivery records retain only event
identity, class, severity, source reference, timestamps, retry count, and an
allowlisted status/detail code.

Closing proof: injected fetch/clock/store tests assert exact method/body,
no-browser transport, one-request/deduplication limits, timeout cleanup,
rate-limit handling, retry boundaries, durable result normalization, and no
URL, webhook, mention identifier, raw response, or private source field in
stored/browser/logged output.

### TK-003 - CIC Presentation, Desktop/Mobile Notification-State Proof, And Privacy Regression Checks

Done when CIC presents linked notification state without representing Discord
as operational truth and browser fixtures show delivered, suppressed,
unconfigured, failed, rate-limited, and duplicate states at desktop and mobile
sizes. Messaging makes clear which underlying source/action requires attention;
critical/approval styling is not the only signal. Bundle, DOM, storage, URL,
log, and screenshot checks find no secret or private payload.

Closing proof: API/component/Playwright cases cover policy and degraded states,
no-overflow rendering, source-link accuracy, and privacy sentinels.

### TK-004 - GitHub Event Routing Decision And One Bounded Implementation Path

Owner-gated. Done when Kayden selects either direct GitHub-to-Discord delivery
or CIC-mediated GitHub event delivery for an enumerated event list, and exactly
one documented/configured path emits each accepted event. The selected path
preserves GitHub as repository truth, avoids duplicate post loops, limits
events to the approved list, and provides clear setup/recovery documentation.
This ticket does not authorize a GitHub token, repository webhook, public
endpoint, or credential change without an additional explicit owner approval.

### TK-005 - Owner-Approved Private Discord Live Acceptance

Owner-gated. Done when Kayden explicitly approves existing private webhook and
mention configuration, observes one silent routine event and one attention
event in the expected private Discord channels, confirms the linked CIC state
under one minute, and records a secret-free artifact. This does not authorize
bot installation, new Discord accounts, public access, GitHub configuration,
or remote CIC deployment.

## Acceptance Criteria

- [ ] Discord is a one-way alert surface; CIC and linked durable sources remain
      authoritative.
- [ ] Only allowlisted server-originated event classes and fixed configured
      destinations can produce messages.
- [ ] Normal, attention, critical, suppressed, daily-digest, and disabled
      behavior follows the settled policy without routine-alert noise.
- [ ] Underlying actions/sources retain their own outcome and freshness truth;
      Discord delivery cannot fabricate it.
- [ ] Webhook URLs, mention identifiers, private payloads, provider responses,
      and credentials never reach clients, commits, proof, or logs.
- [ ] Duplicate, rate-limited, unavailable, malformed, and timed-out delivery
      outcomes are bounded and visible without blocking CIC.
- [ ] GitHub routing uses exactly one owner-selected path per event class.
- [ ] Desktop/mobile automated proof and owner-approved private live acceptance
      complete separately.
- [ ] No generic HTTP relay, inbound webhook handler, or Stage 1 Discord action
      surface exists.

## Testing Seams

- Synthetic event schema, policy map, destination configuration, and mention
  configuration fixtures.
- Injected fetch, abort timer, clock, retry scheduler, and temporary SQLite
  delivery-record store.
- Fixtures for disabled, silent, mention, duplicate, payload-overflow,
  malformed config, `429`, timeout, network, invalid response, and sanitized
  error states.
- API/component and desktop/mobile Playwright fixtures proving source links and
  notification state without a real Discord request.
- Bundle/DOM/storage/URL/log/screenshot secret and private-data sentinel scans.

## Verification Procedure

```bash
node --test test/notification*.test.js test/api.test.js test/freshness.test.js
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs render
node tools/spec-workbench.mjs doctor
```

Live acceptance is separate, owner-gated, and must use only approved existing
private Discord configuration.

## Documentation Impact

- Blueprint owns the alert-surface/source-of-truth boundary and the GitHub
  routing decision.
- Lexicon defines the bounded CIC notification event.
- `.env.example`, README, and Runbook document the implemented server-only
  configuration, policy, setup, troubleshooting, and recovery after TK-001 or
  later implementation; they must not advertise unimplemented webhooks now.
- TASKBOARD projects S-020 and the GitHub/private-acceptance owner gates after
  render.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-17 | planning | Created a stable Discord notification capability from Kayden's settled alert-surface request; preserved the direct-GitHub versus CIC-router conflict as an owner gate | CIC controls, S-013, S-014, S-017, current source search, render, and doctor inspected; no source, runtime, credential, or Discord request change | S-020, Blueprint catalog/coverage/boundary, Lexicon, and generated Taskboard updated; README, Runbook, CONTRACT, and environment docs intentionally wait for implementation | TK-001 ready; GitHub route and private live acceptance are owner-gated |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- Discord bot commands require a separately approved, action-specific
  capability after Stage 1 is accepted.
- Direct GitHub delivery and CIC-mediated delivery are mutually exclusive per
  event class until Kayden chooses the routing policy.

## Supersession

- Supersedes: no implemented CIC capability; it records the settled Discord
  alert-surface direction.
- Superseded by: none
