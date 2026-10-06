# S-025 - Intelligence Synthesis Cost Control

> Generated from LLM Workbench v2.3.

**Spec ID:** S-025
**Status:** needs-review
**Priority:** 1
**Owner:** CIC Engineer; Kayden (cost acceptance)
**Updated:** 2026-07-20
**Catalog description:** Stop the AI Intelligence overview from calling paid OpenAI synthesis on every dashboard mount by adding a TTL cache, a manual force-refresh, and an auto-synthesis off switch, while preserving honest degraded and fallback states.
**Blockers:** none
**Latest event:** 2026-07-20: tracer-bullet slice delivered — overview synthesis is TTL-cached on the server, a manual Refresh forces a fresh synthesis, and CIC_INTELLIGENCE_AUTOSYNTH=off serves the deterministic fallback at zero OpenAI cost; 14 intelligence tests green (7 new).
**Next gate:** Owner reviews and merges the branch into Integration; owner accepts the reduced-cost behavior on the private runtime.

## Outcome

Opening the CIC dashboard no longer triggers a paid OpenAI Responses call every
time. The AI Intelligence overview reuses a recent synthesis within a
configurable window, can be refreshed on demand, and can be switched to a
zero-cost deterministic mode — all without ever fabricating healthy state when
retrieval or synthesis is unavailable.

## Why It Matters

`DashboardView` is the default landing view and embeds the Intelligence panel,
which auto-called `GET /api/intelligence/overview` on mount. That endpoint ran a
live OpenAI `gpt-5.4-mini` Responses synthesis with no caching and no TTL, so
every app open — and every navigate-away-and-back that remounted the panel —
spent money. The retrieval/knowledge reads on the same surface are free database
reads; only the overview synthesis is paid, so the cost was pure, repeated waste
with no user benefit between feed changes.

## Current Verified State

- `server/intelligence.js` `GET /overview` now consults a single-entry TTL cache
  keyed on the normalized feed context before synthesizing. Fresh cache hits are
  returned with `cached: true` and the original `generatedAt`; the cache key
  ignores the per-request `updatedAt` churn that `upsertSources` rewrites.
- A forced refresh (`?refresh=1` / `?force=1`) bypasses both the cache and the
  auto-synthesis toggle and always attempts a fresh synthesis.
- `CIC_INTELLIGENCE_AUTOSYNTH=off` makes on-mount loads serve the deterministic
  `buildFallbackOverview` (`generatedBy: "local"`, `autosynth: "off"`) with zero
  OpenAI calls; a manual Refresh still synthesizes on demand.
- `server/config.js` exposes `intelligenceTtlMs` (default 1800000) and
  `intelligenceAutosynth` (default true), clamping malformed TTL values to the
  default so a bad env var cannot silently disable the cache.
- `src/intelligence.jsx` loads without forcing on mount, wires the existing
  Refresh control to a forced refresh, and shows an honest provenance line
  ("AI synthesis · cached", "Current feed · auto-synthesis off").
- When OpenAI is unconfigured or a synthesis call fails, the endpoint still
  returns the deterministic local overview, unchanged.

## Decisions And Contracts

- The overview synthesis is the only paid path on a normal mount; retrieval
  reads (`/kb`, `/sources`) stay free and uncached.
- Cost controls only change whether a paid synthesis is attempted; they never
  weaken the honesty of degraded, partial, or fallback states.
- A cached response preserves the original synthesis timestamp and is explicitly
  flagged `cached`, so the UI never implies a fresher synthesis than happened.
- Forced refresh is an explicit, user-initiated opt-in and may spend money even
  when auto-synthesis is disabled.
- The fallback overview is never stored in the synthesis cache.

## Non-Goals

- Caching the on-demand `/ask` answers (each is an explicit user action).
- Persisting the cache across process restarts or sharing it between instances.
- Changing the OpenAI model, schema, or prompt.
- Any new remote exposure or paid service.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Tracer bullet: TTL-cache the overview synthesis (config → server cache keyed on normalized context → honest cached/generatedAt), add a forced Refresh that bypasses the cache, and a CIC_INTELLIGENCE_AUTOSYNTH=off toggle that serves the deterministic fallback at zero OpenAI cost, wired end to end into the Intelligence panel | done | none | 14 intelligence tests green incl. 7 new (cache hit within TTL makes only 1 OpenAI call; refresh=1 forces a 2nd; TTL expiry re-synthesizes; autosynth off = 0 OpenAI calls with local fallback; forced refresh still synthesizes when autosynth off; env defaults). npm run build OK. |

## Ticket Done Contracts

### TK-001 - Tracer Bullet: Cache, Refresh, And Auto-Synthesis Toggle

Done when a normal dashboard mount reuses a recent overview synthesis instead of
calling OpenAI every time: `server/config.js` reads `CIC_INTELLIGENCE_TTL_MS`
and `CIC_INTELLIGENCE_AUTOSYNTH`; `server/intelligence.js` serves a still-fresh
cached synthesis (flagged `cached`, original `generatedAt`) keyed on the
normalized feed context, re-synthesizes after the TTL, serves the deterministic
fallback with zero OpenAI calls when auto-synthesis is off, and honors a forced
`?refresh=1` that bypasses both the cache and the toggle; and `src/intelligence.jsx`
loads cache-friendly on mount, force-refreshes from the Refresh control, and
labels provenance honestly. Deterministic tests with an injected fetch and clock
prove the OpenAI call count for each path, and unconfigured/failed synthesis
still falls back deterministically.

## Acceptance Criteria

- [x] A normal (unforced) overview load within the TTL returns a cached
      synthesis and makes no additional OpenAI call.
- [x] A cached response is flagged `cached: true` and keeps the original
      `generatedAt`.
- [x] A manual Refresh forces a fresh synthesis that bypasses the cache.
- [x] `CIC_INTELLIGENCE_AUTOSYNTH=off` serves the deterministic local fallback on
      mount with zero OpenAI calls; forced refresh can still synthesize.
- [x] The synthesis re-runs after the TTL expires.
- [x] Unconfigured or failed synthesis still returns the honest deterministic
      fallback.
- [x] `.env.example`, `BLUEPRINT.md`, and `RUNBOOK.md` document the controls.

## Testing Seams

- Injected `fetchImpl` counts OpenAI Responses calls per request path.
- Injected `now` clock (via `intelligenceNow`) drives TTL expiry deterministically.
- Config overrides (`intelligenceTtlMs`, `intelligenceAutosynth`) exercise both
  cache and toggle behavior without touching real env or credentials.

## Verification Procedure

```bash
node --test test/intelligence.test.js test/config.test.js
npm test
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs render
node tools/spec-workbench.mjs doctor
```

## Evidence

| Date | Ticket | Verification | Result |
|---|---|---|---|
| 2026-07-20 | TK-001 | `node --test test/intelligence.test.js` — 14/14 pass, including 7 new cost-control tests: cache hit within TTL (1 OpenAI call), forced `?refresh=1` (2nd call), TTL expiry re-synthesis, autosynth-off zero-cost local fallback, forced refresh under autosynth-off, and env default parsing. | pass |
| 2026-07-20 | TK-001 | `npm run build` production build. | pass (built, dist emitted) |
| 2026-07-20 | TK-001 | `npm test` full suite: 293 tests, 284 pass, 6 todo. The 3 failures are pre-existing on clean Integration in `test/taskboards.test.js` (date-relative daily-receipt classification), unrelated to this change. | pass (no new failures) |
