# S-015 - Source-Backed Intelligence

> Generated from LLM Workbench v2.3.

**Spec ID:** S-015
**Status:** active
**Priority:** 1
**Owner:** CIC Engineer; Kayden (live configured acceptance)
**Updated:** 2026-07-17
**Catalog description:** Give Kayden useful briefing, insight, retrieval, chart, and question-answer views with explicit sources, freshness, privacy, and deterministic fallback.
**Blockers:** none for TK-003; owner-approved live backend configuration for TK-004
**Latest event:** Canon harvest found implemented Intelligence APIs and UI without a cohesive durable capability owner or full browser proof.
**Next gate:** After S-012/TK-002, claim TK-003 for source/citation/privacy browser proof.

## Outcome

Kayden can ask CIC about current information and inspect briefings, insights,
anomalies, charts, suggested questions, retrieved context, and source-backed
answers while seeing when OpenBrain or OpenAI is unavailable.

## Why It Matters

Intelligence is a primary product view rather than a hidden backend seam.
Without a stable spec, partial-state behavior, source attribution, privacy, and
live-backend acceptance can drift independently.

## Current Verified State

- `server/intelligence.js` exposes overview, source, knowledge-base, and ask
  routes.
- Source normalization provides deterministic briefing, insight, anomaly,
  chart, and answer fallbacks.
- OpenBrain vector/function, Supabase keyword, prescient-task, and optional
  OpenAI synthesis adapters are server-side. Current tests prove input
  validation, selected match-count/threshold clamps, and normalized
  success/error seams, not bounded network request lifetimes; shared OpenAI and
  Prescient Supabase timeout proof remains open in S-018/TK-002.
- `src/intelligence.jsx` renders briefing, insight, chart, suggested-question,
  source, and answer surfaces with the shared privacy classifier.
- Unit/API tests cover fallback, configured adapter normalization, and error
  paths; browser smoke proves the partial state but not the full configured
  provenance flow.
- The scheduled Prescient assessment uses some Intelligence helpers but is a
  separate paid durable-write capability owned by S-018; S-015 proof does not
  establish its scheduler or Supabase mutation safety.

## Desired Behavior

- Overview and ask results always identify status and supporting sources.
- Configured retrieval uses bounded approved OpenBrain-style interfaces and
  keeps privileged credentials server-side.
- Missing, stale, empty, or failing retrieval/synthesis returns useful
  deterministic partial state, not fabricated source-backed claims.
- Answers, insights, and source drilldowns expose enough provenance and
  freshness for the operator to judge trust.
- Privacy-sensitive output uses the same classifier as the rest of CIC.
- Desktop and mobile views keep charts, citations, long text, forms, and status
  readable and accessible.

## Decisions And Contracts

- OpenBrain remains the separate provenance-bearing context backend; CIC is its
  consumer and view.
- Deterministic local output is labeled partial/local and never presented as a
  successful configured model/retrieval call.
- Browser code receives sanitized sources and answers, never service-role keys,
  bearer tokens, raw provider responses, or internal exception detail.
- Source freshness follows S-013; response generation time is not retrieval
  freshness.
- Interactive Intelligence reads/answers are S-015. Startup/24-hour
  system-flag reconciliation is S-018 and cannot inherit completed status from
  these read-path tests.

## Non-Goals

- Making CIC the canonical memory or embedding store.
- Hiding missing retrieval or model configuration.
- Selecting paid model usage, credentials, or production data without owner
  approval.
- Persisting raw private query history by default.

## Dependencies And Blockers

- S-013 owns common source freshness semantics.
- S-014 owns auth and privacy boundaries.
- TK-004 requires owner-approved live local configuration and may not read or
  commit credentials as planning evidence.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Deterministic overview, sources, insights, anomalies, and charts | done | none | Current source-normalizer, Intelligence, and API tests cover local partial behavior and configured normalization |
| TK-002 | Source-backed knowledge retrieval and question answering | done | none | Current OpenBrain keyword/vector, prescient-task, synthesis, Intelligence, and API tests cover server-side input validation, selected match-count/threshold clamps, and normalized success/error seams; network request lifetime is excluded and owned by S-018/TK-002 for shared OpenAI/Prescient calls |
| TK-003 | Desktop/mobile provenance, privacy, and degraded-state browser proof | ready | TK-001, TK-002 | pending |
| TK-004 | Owner-approved live OpenBrain/OpenAI acceptance | blocked | Owner-approved live backend configuration | pending |

## Ticket Done Contracts

### TK-001 - Deterministic Overview, Sources, Insights, Anomalies, And Charts

Done when unconfigured CIC returns useful labeled local/partial overview data,
visible source states, stable chart schemas, and no fabricated provider result.
Closing proof is focused unit/API coverage.

### TK-002 - Source-Backed Knowledge Retrieval And Question Answering

Done when configured adapters validate required input, clamp the supported
match-count/threshold parameters, normalize retrieved sources, sanitize errors,
and produce source-bearing answers or honest partial fallback without exposing
credentials or raw provider bodies. This completed slice does not claim bounded
network request lifetimes; shared OpenAI and Prescient Supabase timeout proof
remains open in S-018/TK-002.

### TK-003 - Desktop/Mobile Provenance, Privacy, And Degraded-State Browser Proof

Done when browser fixtures cover configured success, empty retrieval, model
failure, source failure, and local partial state; source labels/links,
freshness/status, answer privacy, chart readability, keyboard/focus behavior,
and mobile overflow are asserted.

### TK-004 - Owner-Approved Live OpenBrain/OpenAI Acceptance

Owner/configuration-gated. Done when the private runtime uses approved existing
configuration to return one source-backed answer and one intentional degraded
case, leaving a secret-free under-one-minute artifact with sources and freshness.
No credential creation, paid-service change, or private payload capture is
authorized by this planning ticket.

## Acceptance Criteria

- [x] Deterministic overview and answers remain useful when optional services are absent.
- [x] Retrieval/synthesis adapters are server-side and source-bearing; completed
      proof covers input validation and selected match-count/threshold clamps.
- [ ] Shared OpenAI and Prescient Supabase request lifetimes satisfy
      S-018/TK-002 before those bounds are claimed.
- [ ] Browser proof covers configured, empty, failing, and local partial states.
- [ ] Source status/freshness and privacy are visible in all material output.
- [ ] Live configured acceptance is owner-approved and secret-free.

## Testing Seams

- `test/sourceNormalizer.test.js`, `test/intelligence.test.js`,
  `test/openbrainKeyword.test.js`, API tests, and injected fetch fixtures.
- Desktop/mobile Playwright mocks for provenance and degraded-state behavior.
- Privacy sentinel strings that must be obscured without hiding source labels.

## Verification Procedure

```bash
node --test test/sourceNormalizer.test.js test/intelligence.test.js test/openbrainKeyword.test.js test/api.test.js
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs doctor
```

## Documentation Impact

- Blueprint owns Intelligence purpose, route, source, fallback, privacy, and
  freshness contracts.
- README and CONTRACT own configured backend integration; Runbook owns local
  verification and troubleshooting.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-17 | canon harvest | Created cohesive Intelligence capability owner from verified source/tests and Blueprint direction | UI/routes/adapters/tests, README, and CONTRACT inspected; full Node/browser/build/audit plus control checks green | S-015, Blueprint coverage, Lexicon, and generated controls updated | TK-003 ready; TK-004 owner-gated |
| 2026-07-17 | Auditor remediation | Separated interactive Intelligence proof from scheduled paid Prescient writes | Scheduler, assessment, Supabase access, and S-015 read-path tests inspected | S-015 boundary clarified; S-018 owns the writer | S-015 TK-003 remains ready |
| 2026-07-17 | Auditor remediation | Removed the false implication that functional read-path proof established bounded network lifetimes | OpenBrain, keyword, shared OpenAI synthesis, Prescient adapter source, and current tests inspected; no source or runtime change | S-015 current state, TK-002 proof/done contract, and acceptance narrowed | Shared OpenAI and Prescient Supabase timeout proof remains open in S-018/TK-002 |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- Live quality and value require owner-approved configured data and model access.

## Supersession

- Supersedes: Intelligence portions of S-001's broad baseline
- Superseded by: none
