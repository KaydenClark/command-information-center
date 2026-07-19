# S-022 - Captain Pass Visibility

> Generated from LLM Workbench v2.3.

**Spec ID:** S-022
**Status:** active
**Priority:** 2
**Owner:** CIC Engineer; Kayden (machine-local source enrollment and live acceptance)
**Updated:** 2026-07-19
**Catalog description:** Show the Captain's next scheduled daily pass, a bounded CIC-derived selection preview, and the last pass's recorded outcome read-only with explicit source and freshness.
**Blockers:** none for TK-001; live acceptance requires a completed real Captain pass and Kayden's approval
**Latest event:** Spec created from Kayden's settled request for pass visibility without querying an agent; verified schedule, registry, and machine-state sources recorded.
**Next gate:** Claim TK-001 and establish the validated read-only schedule and registry adapter.

## Outcome

Kayden can open one CIC view and answer, without asking an agent: when does the
next scheduled Captain pass run and under what policy, which project and slices
that pass will most likely select, and what the last pass actually did. Every
panel names its source and freshness, and CIC never becomes the canonical
record of Captain state.

## Why It Matters

Today the Captain's daily coordination pass is invisible between runs. The
schedule lives in a machine-local automation config, the selection policy lives
in `Scheduled/Captain/CAPTAIN_DAILY.md`, and the outcome lives in machine-local
state and memory files. Kayden's only way to learn "what happens next / what
happened last" is to ask an agent to go read those files. CIC already renders
per-project ready/blocked tickets on the Projects view; surfacing the pass
around them turns CIC into the operator's actual morning answer instead of a
partial one.

## Current Verified State

Verified 2026-07-19 on the Mac Mini:

- The active schedule is `~/.codex/automations/captain-daily/automation.toml`:
  id `captain-daily`, kind `cron`, status `ACTIVE`,
  `rrule = FREQ=DAILY;BYHOUR=0;BYMINUTE=30;BYSECOND=0`, model `gpt-5.6-sol`,
  low reasoning, cwd `/Users/kayden/GPT_OS`.
- The pass contract is `/Users/kayden/GPT_OS/Scheduled/Captain/CAPTAIN_DAILY.md`
  with registry `/Users/kayden/GPT_OS/Scheduled/Captain/workflows.json`
  (version 4, model policy, six allowlisted legacy workflows). Selection is
  bounded: one focus project by default and at most three compatible slices.
- The pass keeps reconstructable machine state at
  `~/.codex/automations/captain-daily/captain-state.json` (schemaVersion 1.0
  envelope written by root `tools/captain-automation.mjs`). That file does not
  exist yet on this machine: no pass has run `bootstrap` since the path was
  settled. The adjacent `memory.md` holds dated per-pass closeout notes and is
  currently the only durable Sitrep-shaped record.
- The names `DAILY_LUNA.md` and `captain-daily-luna` appear in the requesting
  conversation but exist nowhere on disk; the verified names above are
  canonical. If a Luna-named schedule is created later, enrollment is a
  configuration change, not a code change.
- CIC has no schedule, automation, or machine-state reader. `server/taskboards.js`
  already parses `Projects/INDEX.md` enrollment and per-project stable specs
  with bounded file reads. The platform-health precedent (S-013) reads a cached
  machine-local report server-side with explicit staleness and never executes
  the producer from a browser request.
- S-020 (Discord operations notifications) and S-021 (Discord agent handoff)
  own Sitrep *delivery and request* through Discord and are unimplemented;
  neither owns an in-CIC read-only pass view.

## Desired Behavior

- A dedicated Captain view (desktop and mobile) presents three panels:
  schedule, selection preview, and last pass.
- **Schedule panel:** shows whether the daily pass automation is active, its
  cadence and computed next scheduled start, the Captain model/reasoning
  policy, and the registry summary (workflow count, runtime-enabled count,
  registry version). Sources are the automation config and
  `Scheduled/Captain/workflows.json`, each with its own freshness.
- **Selection preview panel:** a CIC-derived forecast of what the next pass
  will choose from: per enrolled canonical project, the ready tickets of its
  active stable specs (already parsed for the Projects view), reduced by the
  pass bounding rules — one default focus project and at most three compatible
  slices — plus the projects the pass would classify as claimed, owner-gated,
  or without eligible work. The panel is explicitly labeled a forecast: the
  Captain's own per-project doctor/`next --json` run at pass time remains
  authoritative, and CIC must not present the preview as a claim or dispatch.
- **Last pass panel:** shows the validated machine-state envelope (per-workflow
  last outcome, reason, idle counter, pause/archive recommendation, state
  `updatedAt`) and the most recent dated closeout record from the pass's
  durable memory file, sanitized and bounded. A missing, never-bootstrapped,
  corrupt, or schema-mismatched state file is shown as exactly that, never as
  a healthy empty pass.
- Every panel shows a symbolic source label and age; with a daily cadence, a
  last-pass record older than 26 hours is visibly stale. Unconfigured
  machine-local roots leave CIC fully usable with an honest unavailable state.
- CIC performs bounded read-only file reads on the server. It never executes
  the Captain, `captain-automation.mjs`, any project's `spec-workbench.mjs`,
  or any other producer from a request, and it never writes to schedule,
  registry, state, or memory sources.

## Decisions And Contracts

- CIC displays Captain pass state; it never owns it. The automation config,
  registry, contract document, machine state, and owning project specs remain
  the source of truth. Nothing in this capability mutates them.
- The selection preview is computed by CIC from the same bounded spec parsing
  that feeds the Projects view, plus a deterministic vendored ordering that
  mirrors the pass bounding rules. It is a forecast with a recorded divergence
  risk: project-local spec-workbench versions may order eligible work
  differently, and the preview must say so rather than imply fidelity.
  Executing each project's own `next --json` is explicitly out of scope for
  this spec; if forecast divergence proves material in practice, a successor
  spec may add a cached producer-side selection report, following the
  platform-health pattern, as a separately approved capability.
- Machine-local sources outside the Projects root are enrolled only through
  validated absolute server-side configuration (a Captain schedule root and a
  Captain automation-state root), following the `CIC_RUNTIME_ROOT` /
  `CIC_PROJECTS_ROOT` precedent. Missing configuration is a visible
  unavailable state, not an error page and not a guessed path.
- All source reads are size-bounded and fail closed on malformed content: the
  RRULE parser accepts only the exact daily `FREQ=DAILY;BYHOUR=..;BYMINUTE=..;
  BYSECOND=..` shape and reports anything else as an unsupported schedule; the
  state reader accepts only the schemaVersion 1.0 envelope; the registry
  reader accepts only the versioned workflows shape.
- Browser payloads carry symbolic source identifiers, labels, and freshness,
  never raw machine-local absolute paths, prompt bodies, credentials, or
  unsanitized file contents. Memory/closeout text is truncated to a bounded
  length and stripped through the existing sanitization conventions.
- Reconciliation with S-020/S-021: this spec owns the in-CIC read-only pass
  view only. S-020 keeps ownership of any outbound Discord notification about
  a completed pass (as an allowlisted event class emitted by the producer that
  owns the durable evidence, and it may deep-link to this view). S-021 keeps
  ownership of CIC-originated `sitrep_request` handoffs. This view issues no
  Discord traffic and no handoffs, and neither S-020 nor S-021 delivery
  evidence can substitute for the machine-state and memory sources read here.
- The Projects view remains the drill-down surface for ticket detail; the
  preview links to it rather than duplicating full ticket rendering.

## Non-Goals

- Executing, scheduling, pausing, resuming, or editing the Captain pass or any
  automation from CIC.
- Running project-local lifecycle tooling (`spec-workbench.mjs` doctor/next) or
  `captain-automation.mjs` from a request path.
- Making CIC, its SQLite database, or this view a second canonical record of
  Captain state, project selection, or pass outcomes.
- Discord delivery of pass results (S-020) or agent handoff commands (S-021).
- Bootstrapping, repairing, or migrating `captain-state.json`; that remains the
  pass runner's job.
- Rendering full Sitrep prose with unredacted machine detail; the view shows a
  bounded sanitized summary and points at the durable sources.

## Dependencies And Blockers

- S-013 freshness semantics and S-014 auth/secret boundaries apply to the new
  route and panels.
- The last-pass panel depends on the pass runner actually writing
  `captain-state.json`; until a real pass bootstraps it, the panel proves its
  missing-state honesty instead. This is a display dependency, not a blocker
  for implementation with fixtures.
- Live acceptance (TK-005) requires at least one completed real daily pass and
  Kayden's explicit approval of the machine-local root configuration.

## Vertical Implementation Slices

| Ticket | Slice | Status | Blockers | Proof |
|---|---|---|---|---|
| TK-001 | Validated read-only Captain schedule and registry adapter with the `/api/captain/daily-pass` route seam | ready | none | pending |
| TK-002 | Deterministic bounded selection-preview forecast over parsed canonical project specs | blocked | TK-001 | pending |
| TK-003 | Last-pass machine-state and closeout-record adapter with explicit missing/invalid states | blocked | TK-001 | pending |
| TK-004 | Captain view presentation with desktop/mobile browser proof and privacy checks | blocked | TK-002; TK-003 | pending |
| TK-005 | Owner-approved live acceptance against a real completed pass | blocked | TK-004; a real bootstrapped pass; Kayden approval | pending |

## Ticket Done Contracts

### TK-001 - Validated Read-Only Captain Schedule And Registry Adapter

Done when authenticated `GET /api/captain/daily-pass` returns a schedule
section built from two validated server-side configured roots: the automation
config (status, cadence, computed next scheduled start, model, reasoning) and
the Captain registry (version, workflow count, runtime-enabled count, model
policy summary). Unconfigured roots, missing files, oversized files, unknown
RRULE shapes, and malformed TOML/JSON each produce a distinct honest
unavailable/invalid state without throwing the route. The response carries
symbolic source identifiers and per-source freshness, never raw absolute paths
or the automation prompt body. The route performs no writes and spawns no
process.

Closing proof: unit/API tests with fixture roots cover the happy path, each
degraded state, size bounds, RRULE rejection, next-start computation across a
day boundary, path-validation failure, and a payload scan showing no
machine-local path or prompt text.

### TK-002 - Deterministic Bounded Selection-Preview Forecast

Done when the route's preview section lists, per enrolled canonical project,
its active-spec ready tickets (reusing the existing bounded spec parsing) and a
deterministic forecast that applies the pass bounding rules: choose one default
focus project, cap the forecast at three compatible slices, and classify the
remaining projects (claimed/in-progress, owner-gated, no eligible work,
unenrolled, unreadable lifecycle). The ordering rule is documented, stable, and
tested; ties never produce nondeterministic output. The payload marks the
entire section as a CIC-derived forecast with a divergence disclaimer field the
UI must render.

Closing proof: fixture projects proving focus selection, the three-slice cap,
classification of every category, deterministic tie-breaking, and that the
forecast never mutates any project file or invokes project tooling.

### TK-003 - Last-Pass Machine-State And Closeout-Record Adapter

Done when the route's last-pass section returns the validated schemaVersion 1.0
machine-state envelope reduced to bounded display fields (per-workflow last
outcome, sanitized reason, idle counter, archive readiness, state `updatedAt`)
plus the newest dated closeout record from the pass memory file truncated to a
bounded sanitized summary. Missing state (never bootstrapped), corrupt or
schema-mismatched state, missing memory, and stale records (older than the
26-hour daily threshold) are each distinct visible states; none of them renders
as a successful pass. No field exposes credentials, tokens, prompt bodies, or
raw machine paths.

Closing proof: fixture state/memory files covering valid, missing, corrupt,
wrong-schema, oversized, and stale cases; a truncation test; and a sanitization
sentinel test.

### TK-004 - Captain View Presentation And Browser Proof

Done when a Captain view renders the three panels with SLK styling and Lucide
icons, every panel shows its source label and age, the preview shows the
forecast disclaimer and links each slice to the Projects view drill-down, and
degraded/unavailable/stale states are visually distinct at desktop and mobile
sizes. Bundle, DOM, storage, and screenshot checks find no machine-local path,
prompt text, or secret.

Closing proof: component/API tests plus desktop and mobile browser evidence of
the healthy state and at least the missing-state and unconfigured states, and
a demo artifact Kayden can check in under one minute.

### TK-005 - Owner-Approved Live Acceptance

Owner-gated. Done when, after a real daily pass has bootstrapped and written
machine state, Kayden opens the Captain view on the private host, confirms the
next-pass time matches the automation schedule, the preview is plausible
against the pass's own Sitrep, and the last-pass panel matches the recorded
state file, in under one minute, and approves the configured machine-local
roots. A secret-free artifact is recorded. This ticket does not authorize
changing the automation, its schedule, or its state.

## Acceptance Criteria

- [ ] One CIC view answers next-pass timing/policy, likely selection, and last
      pass outcome without querying an agent.
- [ ] All Captain sources are read server-side, size-bounded, validated, and
      never executed or written.
- [ ] The selection preview is deterministic, applies the one-focus-project and
      three-slice bounds, and is explicitly labeled a non-authoritative
      forecast with its divergence risk.
- [ ] Missing, corrupt, unconfigured, unsupported, and stale source states are
      each visibly distinct and never render as healthy pass output.
- [ ] Every panel exposes symbolic source identity and freshness; browser
      payloads contain no machine-local absolute paths, prompt bodies, or
      secrets.
- [ ] CIC state remains non-canonical: no Captain schedule, state, or memory
      data is persisted as a second durable record beyond bounded caching.
- [ ] S-020/S-021 boundaries hold: this view sends no Discord traffic and no
      handoffs, and Sitrep delivery ownership stays with those specs.
- [ ] Desktop/mobile browser proof and separate owner live acceptance complete.

## Testing Seams

- Fixture Captain roots: automation TOML variants (active, paused, malformed,
  unsupported RRULE, oversized), registry JSON variants, state-file variants
  (valid envelope, missing, corrupt, wrong schema), and dated memory files.
- Fixture canonical Projects roots with `INDEX.md` and stable-spec sets that
  exercise focus selection, slice caps, and every classification bucket.
- Injected clock for next-start computation and staleness thresholds.
- Payload scanners for machine-local paths, prompt text, and secret sentinels.
- Desktop/mobile browser fixtures for healthy, forecast-disclaimer, missing,
  unconfigured, and stale panel states.

## Verification Procedure

```bash
node --test test/captainPass*.test.js test/api.test.js
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node tools/spec-workbench.mjs render
node tools/spec-workbench.mjs doctor
```

Live acceptance is separate, owner-gated, and uses only existing machine-local
Captain sources; it changes none of them.

## Documentation Impact

- Blueprint owns the read-only/non-canonical boundary for Captain sources, the
  new route row, and the coverage-matrix row.
- Lexicon defines the Captain daily pass, the selection-preview forecast, and
  Captain machine state.
- `.env.example`, README, and RUNBOOK document the two configured machine-local
  roots and troubleshooting only when TK-001 lands; they must not advertise the
  view before implementation.
- TASKBOARD projects S-022 after render.

## Append-Only Evidence And Execution Log

| Date | Ticket | Event | Verification | Docs | Remaining gap |
|---|---|---|---|---|---|
| 2026-07-19 | planning | Created the Captain pass visibility capability from Kayden's settled request; verified the real schedule (`captain-daily`, daily 00:30, ACTIVE), registry v4, CAPTAIN_DAILY.md bounding rules, absent `captain-state.json`, and dated `memory.md` closeouts; recorded that the requested `DAILY_LUNA.md` / `captain-daily-luna` names do not exist on disk | Read-only inspection of automation config, registry, contract, state directory, `server/taskboards.js`, and S-012/S-013/S-018/S-020/S-021; `spec-workbench render` and `doctor` pass; no source, runtime, schedule, or state change | S-022 created; Blueprint catalog/coverage/boundary and Lexicon updated; generated Taskboard rerendered; README/RUNBOOK/`.env.example` intentionally wait for TK-001 | TK-001 ready; TK-005 needs a real bootstrapped pass and owner approval |

## Completion Result

Pending.

## Remaining Limitations Or Follow-Up Specs

- The selection preview is a forecast; if divergence from project-local
  `next --json` proves material, a successor spec may add a producer-side
  cached selection report following the platform-health pattern.
- A Discord "pass completed" digest remains owned by S-020 and is not part of
  this capability.

## Supersession

- Supersedes: no implemented CIC capability; it records the settled Captain
  pass visibility direction.
- Superseded by: none
