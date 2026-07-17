# Command Information Center - Blueprint

> Generated from LLM Workbench v2.3. See `RUNBOOK.md` -> Upgrading The Harness.

**Last reviewed:** 2026-07-17
**Status:** active
**Source root:** this repository

This is the stable reference for what Command Information Center is. Current
capability truth and proof live in stable specs, active work is projected into
`TASKBOARD.md`, shared terms live in `LEXICON.md`, and exact operations live in
`RUNBOOK.md`.

## Spec Catalog

<!-- spec-catalog:start -->
| Spec | Description | Status |
|---|---|---|
| [S-001 - Operational Dashboard Baseline](specs/S-001-operational-dashboard-baseline/SPEC.md) | Preserve the verified CIC dashboard, trust, task, freshness, and platform-health baseline delivered under Workbench v2.1. | complete |
| [S-002 - Workbench v2.3 Adoption](specs/S-002-workbench-v2-3-adoption/SPEC.md) | Adopt the current spec-centered Workbench while preserving CIC product, privacy, branch, and verification contracts. | complete |
| [S-004 - Workbench Release Control](specs/S-004-workbench-release-control/SPEC.md) | Let Kayden inspect, approve, and execute a fixed, evidence-bound Workbench integration-to-main release from CIC without exposing a generic remote executor. | complete |
| [S-005 - Mobile Workbench Release Workflow](specs/S-005-mobile-workbench-release-workflow/SPEC.md) | Let Kayden safely approve and execute the fixed Workbench integration-to-main release from one private, phone-ready CIC card. | active |
| [S-006 - Captain Workbench Release Handoff](specs/S-006-captain-workbench-release-handoff/SPEC.md) | Replace CIC's direct GitHub merge executor with a credential-free, exact-request handoff to the fixed GPT_OS Captain worker. | complete |
| [S-007 - Spec-Grouped Project Tickets](specs/S-007-spec-grouped-project-tickets/SPEC.md) | Group the Projects view by each project's specs with expandable tickets, adopt ticket terminology, rename the personal board to Taskboard, and unmask the workbench passphrase fields. | complete |
| [S-008 - Project Deployment Portfolio](specs/S-008-project-deployment-portfolio/SPEC.md) | Show canonical GPT_OS projects and honest local release readiness on Deployments, while recognizing an already-promoted Workbench release as healthy instead of blocked. | complete |
| [S-009 - Stable Project Numbers](specs/S-009-stable-project-numbers/SPEC.md) | Give every canonical GPT_OS project a stable P-### identity and show composite P-###/S-### references on the CIC Projects board. | complete |
| [S-010 - Human-Facing Operations Surface](specs/S-010-human-facing-operations-surface/SPEC.md) | Preserve CIC's credential-free, responsive human-facing shell and focused operational views as one durable capability. | complete |
| [S-011 - Personal Task Workspace](specs/S-011-personal-task-workspace/SPEC.md) | Preserve CIC's validated SQLite-backed personal task workflow without confusing it with canonical repository taskboards. | complete |
| [S-012 - Canonical Project Interaction](specs/S-012-canonical-project-interaction/SPEC.md) | Let Kayden inspect and safely request project changes from CIC while stable specs remain canonical and generated Taskboards remain projections. | active |
| [S-013 - Source Freshness And Platform Health](specs/S-013-source-freshness-and-platform-health/SPEC.md) | Make cached feed health, update attempts, successful refresh age, and platform-health evidence explicit for every CIC source. | active |
| [S-014 - Private Authenticated Operation And Privacy](specs/S-014-private-authenticated-operation-and-privacy/SPEC.md) | Keep CIC usable from authenticated private desktop and mobile routes while secrets and sensitive summaries remain protected. | active |
| [S-015 - Source-Backed Intelligence](specs/S-015-source-backed-intelligence/SPEC.md) | Give Kayden useful briefing, insight, retrieval, chart, and question-answer views with explicit sources, freshness, privacy, and deterministic fallback. | active |
| [S-016 - Runtime Deployment Identity](specs/S-016-runtime-deployment-identity/SPEC.md) | Show which reviewed CIC source SHA the private service is actually running and distinguish runtime freshness from repository release state. | active |
| [S-017 - Bounded Connector Actions](specs/S-017-bounded-connector-actions/SPEC.md) | Keep non-project owner actions narrow, authenticated, source-specific, bounded, and honest about durable outcomes. | active |
| [S-018 - Scheduled Prescient Assessment](specs/S-018-scheduled-prescient-assessment/SPEC.md) | Run a bounded, observable, privacy-safe scheduled OpenAI assessment that reconciles system-flagged Prescient tasks in the configured OpenBrain Supabase backend. | active |
<!-- spec-catalog:end -->

## What This Project Is

Command Information Center (CIC) is a React + Express dashboard for viewing an
operational feed, managing a local task board, inspecting connector health, and
querying an OpenBrain-style retrieval backend. The repository is a safe public
reference implementation: it runs with synthetic data and no credentials, while
real deployments keep private feeds, databases, and service credentials local.

Core promise:

> Give the operator one honest control surface for current work and connected
> information without fabricating live state or leaking private credentials.

Primary users:

- An operator using CIC on its authenticated private host.
- Agents and maintainers extending the dashboard, API, and backend adapters.

## Non-Goals

This project is not trying to:

- Become the durable OpenBrain memory or vector-retrieval backend.
- Commit or publish a real operator feed, database, credentials, or OAuth tokens.
- Fabricate AI or connector results when a dependency is missing.
- Replace project-owned source files with a second hidden task database.

## Current Product Shape

When the project is working, a user can:

- Run a fully rendered synthetic demo without credentials.
- Review briefing, tasks, calendar, projects, deployments, inbox, finance, and
  music panels from one responsive interface.
- Create, update, move, complete, and dismiss SQLite-backed task cards.
- Ask source-backed questions through the Intelligence surface when OpenAI and
  OpenBrain-style retrieval are configured, with deterministic partial states
  when they are not.
- Inspect source health and use Spotify playback controls when authorized.
- Inspect canonical GPT_OS project release relationships from bounded local Git
  evidence without promoting duplicate worktrees or claiming production health.
- Track repository-local specs unambiguously through stable `P-###` project IDs
  and composite `P-###/S-###` references from generated `Projects/INDEX.md`.
- Inspect project specs and tickets from their canonical files. The current
  legacy priority route still rewrites `TASKBOARD.md` directly and therefore
  must not be treated as a valid write path for an adopted v2.3 project; S-012
  owns its fail-closed repair and spec-centered replacement.
- Inspect the latest Personal Intelligence Platform compatibility and health
  report without letting the browser execute operator commands.
- Inspect a fixed Workbench `integration` to `main` release candidate and its
  exact-SHA Auditor evidence from the mobile Deployments view.
- Record a fingerprint-bound approval and separately hand its durable operation
  to Captain from that card with a fresh step-up passphrase for each stage.
- Run the supported Gmail update on demand and see its last attempt, last success,
  and age without mistaking page-load time for connector freshness.

The most important quality bar is source truth with privacy: stale, offline, or
unconfigured sources must be visible as such, and privileged data must stay on
the server or in ignored local files.

## Direction And Build Order

Current phase:

- Staging consolidation and operator-trust hardening on the `Integration`
  branch.

Build order:

1. Protect the existing app contracts: auth, API JSON behavior, task
   persistence, deterministic demo mode, test health, and a reproducible build.
2. Make freshness explicit: distinguish loading cached state from performing a
   real update and show source age/last success.
3. Deepen task workflows: evolve the board toward richer grouped list/board
   operations without creating a second canonical project queue.
4. Expand browser-level verification and connector hardening before promoting
   `Integration` to `main`.

## Blueprint-To-Spec Coverage Matrix

This matrix is the canonical canon-harvest record as of 2026-07-17. “Harvest
finding” records what the comparison found before this pass; “durable owner”
records where the capability now lives. Every settled capability has an owner.
The remaining unresolved rows are explicit owner gates, not uncovered work.

| Capability | Canonical evidence | Harvest finding | Durable owner / resolution |
|---|---|---|---|
| Credential-free synthetic demo | Product shape, architecture constraint, README quick start | implemented but missing a durable capability spec | S-010 complete |
| Responsive human-facing shell and focused views | Product shape; `src/main.jsx`; browser smoke | implemented but missing a durable capability spec | S-010 complete |
| Local Personal Taskboard persistence and workflow | Product shape; `server/db.js`; task UI/tests | implemented but missing a durable capability spec | S-011 complete |
| Stable-spec project and ticket inspection | Project route contract; spec-grouped UI | covered by a current stable spec | S-007 and S-009 |
| Canonical project priority/decision action | v2.3 ownership model versus current PATCH helper | contradicted by live source | S-012 active; TK-002 removes the invalid adopted-project write before TK-003/TK-004 add bounded lifecycle actions |
| Canonical project release portfolio | Product shape and bounded local Git contract | covered by a current stable spec | S-008 |
| Stable project IDs and composite references | Product shape and generated registry contract | covered by a current stable spec | S-009 |
| Gmail durable update freshness | Product shape; `refresh_runs`; Gmail adapter/tests | implemented but missing a durable capability spec | S-013 TK-001 records shipped proof |
| Scheduled Gmail refresh worker | `server/index.js`, `startGmailWorker`, interval config/tests | implemented but scheduler proof and operational canon were incomplete | S-013 TK-006 owns cadence, callback/failure evidence, command privacy, and verification |
| Cached Personal Intelligence Platform health | Product shape; cached report reader/tests | implemented but missing a durable capability spec | S-013 TK-002 records shipped proof |
| Uniform cached-versus-contacted source truth | Direction/build order and known risk | settled but not implemented and missing a spec | S-013 TK-003/TK-005 |
| Next non-Gmail live update adapter | Known risk says adapters are added source by source, but no source or credential boundary is selected | unresolved owner decision | S-013 TK-004 blocked until Kayden selects the source and boundary |
| Passcode-protected private host and OAuth boundary | Auth architecture/routes and API tests | implemented but missing a durable capability spec | S-014 TK-001 records shipped proof |
| Shared privacy blur and server-secret boundary | Core invariants; `src/privacy.js`; privacy tests | implemented but missing a durable capability spec | S-014 TK-002 records shipped proof |
| General authenticated desktop/mobile LAN/Meshnet operation | Primary-user direction and private-runtime contract | settled but not implemented and missing a spec | S-014 TK-003 plus owner-gated TK-004 |
| Intelligence overview, sources, insights, anomalies, and charts | Intelligence screen/routes and normalizer tests | implemented but missing a durable capability spec | S-015 TK-001 records shipped proof |
| OpenBrain retrieval and source-backed answers | Retrieval architecture, CONTRACT, adapter/API tests | implemented but missing a durable capability spec | S-015 TK-002 records shipped proof |
| Configured Intelligence provenance/privacy browser acceptance | Known browser-coverage risk | settled but not implemented and missing a spec | S-015 TK-003; live configured TK-004 remains owner-gated |
| Scheduled Prescient assessment and Supabase reconciliation | Startup scheduler, `kanbanCheck.js`, `prescientTasks.js`, and partial tests | implemented but missing a durable capability spec; timeout, scheduler, observability, and destructive-empty semantics are not proved | S-018 TK-001 through TK-004; live paid/write acceptance is owner-gated TK-005 |
| Source/runtime-root separation | Architecture constraint and S-005 evidence | covered by a current stable spec | S-005 |
| Recorded private-service SHA | S-005 metadata said `79e04de`; live launchd/process/Git state is clean detached `6284ecc` | contradicted by live source | S-005 corrected; S-016 owns runtime identity |
| In-app actual runtime SHA and staging/release comparison | No current API/UI identity seam | settled but not implemented and missing a spec | S-016 TK-001 through TK-003; promotion TK-004 is owner-gated |
| Fixed Workbench evidence, approval, and Captain handoff | Deployments and release contracts | covered by a current stable spec | S-004, S-005, and S-006 |
| Direct CIC-held GitHub merge executor | Historical S-004 TK-003 design | superseded | S-006 credential-free Captain handoff |
| Bounded Gmail and Spotify owner actions | Current routes/adapters/tests | implemented but missing a durable capability spec | S-017 TK-001/TK-002 record shipped proof; TK-003 adds shared browser safety proof |
| Live connector/device action acceptance | Requires current owner account/device state | unresolved owner decision | S-017 TK-004 owner-gated |
| Workbench v2.3 lifecycle and generated hot Taskboard | Project controls and lifecycle tool | covered by a current stable spec | S-002 |

## Architecture

| Layer | Choice | Source / Notes |
|---|---|---|
| Runtime | Node.js 22+ | Required for built-in `node:sqlite`; `package.json` |
| Frontend | React 18, Vite 8, Lucide React | `src/main.jsx`, `src/intelligence.jsx`, `src/styles.css` |
| Backend | Express 5 | `server/app.js`, started by `server/index.js` |
| Local storage | SQLite plus a summarized JavaScript feed | `server/db.js`; ignored `data/cic.sqlite`; `data.example.js` contract |
| Auth | Optional passcode session cookie | `server/app.js`, `server/config.js` |
| Retrieval and synthesis | OpenBrain/Supabase adapters plus optional OpenAI synthesis | `server/openbrainClient.js`, `server/openbrainKeyword.js`, `server/openaiSynthesisClient.js` |
| Scheduled Prescient assessment | Optional OpenAI assessment after startup and every 24 hours, reconciling system flags to Supabase | `server/index.js`, `server/kanbanCheck.js`, `server/prescientTasks.js`; safety/proof gaps owned by S-018 |
| Platform health | Validated cached JSON report from Personal Intelligence Platform | `server/platformHealth.js`, rendered by `src/main.jsx` |
| Music | Spotify Web API and optional Atlas link | `server/spotify.js`, `src/atlasUrl.js` |
| Backend schema | Optional Supabase migration for prescient tasks | `supabase/migrations/` |
| Testing | Node test runner | `npm test` executes `test/*.test.js` |
| Delivery | Private Express host serving the Vite build | `npm run build`, `npm start` |

Architecture constraints:

- The committed repository must remain runnable without credentials.
- Source and runtime roots may differ only through a validated absolute
  `CIC_RUNTIME_ROOT`; code and built assets stay in the source checkout while
  ignored configuration, state, project discovery, and sibling health paths
  remain anchored to the canonical runtime directory.
- Real `.env`, `data.js`, SQLite, logs, and tokens remain ignored.
- Browser code must never receive server-side OpenAI, Supabase service-role,
  OpenBrain bearer, Spotify client-secret, or refresh-token values.
- Missing dependencies degrade visibly instead of producing fake live output.
- `main` is release; `Integration` is staging; task work enters through pull
  requests from short-lived branches.

## Directory Map

```text
command-information-center/
|-- src/                    <- React views, privacy classification, brand styles
|-- server/                 <- Express API, SQLite, connectors, intelligence
|-- test/                   <- Node unit and API specifications
|-- supabase/migrations/    <- optional backend schema owned by explicit tasks
|-- data.example.js         <- synthetic public demo feed
|-- CONTRACT.md             <- OpenBrain-style consumer contract
|-- AGENTS.md               <- agent behavior and scope
|-- BLUEPRINT.md            <- stable product and architecture truth
|-- LEXICON.md              <- shared project vocabulary
|-- CLAUDE.md               <- thin Claude entry point
|-- README.md               <- public setup and usage
|-- RUNBOOK.md              <- operations and verification
|-- specs/                  <- stable capability records and proof
|-- tools/spec-workbench.mjs <- lifecycle tooling
`-- TASKBOARD.md            <- generated hot execution projection
```

## Main Contracts

### Routes / Screens

| Route or screen | Purpose | Status | Source |
|---|---|---|---|
| Dashboard | Operational overview, health, brief, tasks, calendar, inbox, projects, finance, and music | working | `src/main.jsx` |
| Intelligence | Briefing, source drilldown, charts, suggested questions, and source-backed answers | working with partial states | `src/intelligence.jsx`, `server/intelligence.js` |
| Briefing | Full summarized briefing and actions | working from feed | `src/main.jsx`, `data.example.js` |
| Kanban | Local task creation and status workflow | working | `src/main.jsx`, `server/db.js` |
| Calendar / Projects / Deployments / Inbox / Finance / Music | Focused operational panels; Projects shows stable project IDs and composite project/spec references; Deployments includes the fixed Workbench approval/Captain-handoff card plus the canonical read-only project release portfolio; calendar accepts `start`/`end` and legacy `when` fields | working or degraded by source availability | `src/main.jsx`, `src/projectTaskboards.jsx` |

### API Endpoints

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/api/auth/status` | no | Report passcode requirement/session state | `server/app.js` |
| POST | `/api/auth/login`, `/api/auth/logout` | no/current session | Manage local session | `server/app.js` |
| GET | `/api/state` | passcode when configured | Return dashboard feed, tasks, source and platform health, Spotify, and settings | `server/app.js` |
| GET | `/api/captain/workbench-release` | configured passcode plus current session | Return one fixed, read-only `KaydenClark/LLM_Workbench` `integration` to `main` candidate and latest durable operation | `server/workbenchRelease.js`, `server/db.js` |
| GET | `/api/project-deployments` | passcode when configured | Return bounded local Git release evidence for canonical entries in `Projects/INDEX.md`; performs no fetch or mutation | `server/projectDeployments.js` |
| GET | `/api/project-taskboards` | passcode when configured | Return project summaries with stable registry-backed `P-###` IDs or an explicit null identity | `server/taskboards.js` |
| GET | `/api/project-taskboards/:project` | passcode when configured | Return one repository taskboard and its local specs with the same project identity | `server/taskboards.js` |
| PATCH | `/api/project-taskboards/:project/tasks/:taskId/priority` | passcode when configured | Current legacy helper rewrites one matching `TASKBOARD.md` row. This contradicts adopted v2.3 ownership and is not a canonical action path; S-012 TK-002 makes adopted-project requests fail closed before the spec-centered replacement ships. | `server/app.js`, `server/taskboards.js` |
| POST | `/api/captain/workbench-release/approval` | current session plus timing-safe step-up passcode | Revalidate and record one fingerprint-bound approval intent; never execute a merge | `server/app.js`, `server/workbenchApproval.js`, `server/db.js` |
| POST | `/api/captain/workbench-release/execution` | current session plus a second timing-safe step-up passcode | Atomically claim one approved operation, revalidate its exact evidence, and enqueue one credential-free request to the fixed Captain worker | `server/app.js`, `server/captainHandoff.js`, `server/db.js` |
| POST/PATCH | `/api/tasks`, `/api/tasks/:id` | passcode when configured | Create or update task cards | `server/app.js`, `server/db.js` |
| POST | `/api/tasks/:id/dismiss` | passcode when configured | Dismiss a suggested task | `server/app.js`, `server/db.js` |
| POST | `/api/refresh/gmail` | passcode when configured | Re-read summarized Gmail suggestions | `server/app.js`, `server/gmail.js` |
| GET/POST | `/api/intelligence/*` | passcode when configured | Source status, retrieval, overview, and answers | `server/intelligence.js` |
| GET/POST | `/api/spotify/player`, `/api/spotify/control` | passcode when configured | Playback state and controls | `server/app.js`, `server/spotify.js` |
| GET | `/auth/spotify/login`, `/auth/spotify/callback` | passcode when configured plus OAuth state | Complete local Spotify authorization | `server/app.js` |

### Data Model

| Entity | Key fields | Stored where | Notes |
|---|---|---|---|
| `tasks` | title, notes, source, priority, due date, status, suggestion/dismissal flags | local SQLite | mutable through task API |
| `task_events` | task id, event type, payload, timestamp | local SQLite | task audit trail |
| `source_status` | id, name, status, detail, updated time | local SQLite | reflects normalized feed state |
| `refresh_runs` | source, status, detail, start/finish | local SQLite | operational history |
| `app_settings` | key, value, updated time | local SQLite | local settings |
| `captain_operations` | fixed release identity, exact SHAs, PR/gate IDs, fingerprint, execution claim, status, merge/error evidence, timestamps | local SQLite | one operation per unique candidate fingerprint; additive columns preserve existing databases |
| `captain_operation_events` | operation id, event type, bounded payload, timestamp | local SQLite | append-only operation audit trail enforced by database triggers |
| `window.CIC_DATA` | summarized source panels and briefing | ignored `data.js`; example in `data.example.js` | public repo ships synthetic values only |
| `prescient_tasks` | flagged task state | optional Supabase backend | schema in `supabase/migrations/` |
| Platform health report | check time, mode, overall status, bounded component checks | ignored sibling `.local/platform-health.json` | read-only derived evidence; stale after 90 minutes |

## Core Logic And Invariants

- `/api/*` must return JSON errors rather than the frontend app shell.
- Task input is validated and normalized in `server/db.js`.
- Connector, retrieval, and synthesis failures produce explicit degraded or
  partial states.
- `/api/state.refreshFreshness` is derived from durable `refresh_runs`; the
  top-level `refreshedAt` remains response time and is not source freshness.
- `startGmailWorker` registers an interval-only background refresh at startup;
  it does not run immediately. The effective interval is at least 15 minutes,
  the default is 180 minutes, and S-013 TK-006 owns complete scheduler and
  failure-evidence proof.
- The synthetic example feed contains no real personal or account information.
- Gmail-derived task suggestions remain summarized and must not persist full
  message bodies.
- Privacy-sensitive content uses the shared classifier in `src/privacy.js`.
- The browser must not call privileged external services directly.
- CIC reads the cached platform report server-side and never executes the
  platform verifier from a browser request.
- The optional Prescient writer is a separate paid/privileged capability from
  interactive Intelligence. Current source schedules one assessment after
  10 seconds and every 24 hours when OpenAI is configured, then mutates only
  system-flagged Supabase rows; S-018 owns missing timeout, non-overlap,
  observability, reconciliation, privacy, and live-acceptance proof.
- Workbench release readiness is bound to one current, open, non-draft GitHub
  PR, exact branch SHAs, `main` ancestry, mergeability, and a successful exact-SHA
  `gptos/workbench-release-gate` status with evidence URL and Auditor summary.
- With no open promotion PR, Workbench reports `released` only when GitHub's
  comparison proves integration has no commits outside main or one exact
  closed-and-merged promotion PR binds the current integration SHA to the
  current main merge SHA. Unreleased, merely closed, divergent, ambiguous, or
  unavailable evidence remains blocked.
- The release-candidate fingerprint is SHA-256 of
  `repository | mainSha | integrationSha | prNumber | releaseGateStatusId`.
- Missing passcode configuration, stale, closed, draft, or ambiguous PR state,
  divergence, unmergeability, unavailable or timed-out GitHub evidence, and
  missing or failed Auditor evidence all block the candidate. GitHub reads have
  a bounded timeout. This read route performs no mutation.
- The project deployment portfolio enrolls only the generated canonical table
  in `Projects/INDEX.md`, rejects paths outside the configured Projects root,
  verifies each path is its own Git top level, and uses bounded argument-only
  local Git reads with optional locks disabled. It never fetches, writes, or
  claims hosting-provider or production-runtime health.
- Project taskboards read `P-###` identities from the generated canonical table,
  reject malformed or ambiguous assignments, and never infer identity from
  alphabetical directory order. Missing enrollment remains visibly unnumbered.
- The existing project-priority PATCH helper is bounded but writes rendered
  `TASKBOARD.md` rows. It is legacy behavior, not a valid adopted-project
  lifecycle action; S-012 owns removal and replacement through stable specs.
- Approval accepts only a fingerprint and step-up passcode from an authenticated
  session. It uses timing-safe verification with bounded per-session failure
  throttling, re-fetches the fixed candidate, rejects stale or replayed
  fingerprints, and records an approved Captain operation plus append-only
  event. Approval never runs a command or mutates GitHub.
- Execution accepts only an approved operation ID and a second step-up
  passcode. Repository, branches, PR, gate, and SHAs are loaded from the durable
  operation, matched to the immutable GPT_OS manifest, and revalidated before
  CIC writes one credential-free Captain handoff request. Approval is valid for
  15 minutes with at most 60 seconds of future clock skew; an expired or
  rejected exact candidate requires a fresh approval passcode and records a new
  approval event without erasing its prior history.
- CIC owns no GitHub mutation credential or merge method. It atomically writes
  an exact claim-bound request beneath the canonical GPT_OS spool after proving
  every path ancestor is a real directory, starts only the fixed GPT_OS Captain
  worker with token variables scrubbed, and imports only a protected ordinary
  `0600` result no larger than 16 KiB whose open-file identity still matches its
  pre-read identity. Invalid results are quarantined.
- Atomic claims prevent active duplicate handoffs. Spawn failure and missing
  results become bounded retryable states. An applied result is recorded only
  after CIC independently verifies current `main`, current `integration`, the
  exact PR state, and a merge commit with exactly two ordered parents — the
  approved old `main`, then approved `integration` — through separate read-only
  GitHub requests.
- `requested`, `approved`, `executing`, `applied`, `blocked`, and `rejected`
  lifecycle evidence is append-only. Persisted errors are allowlisted summaries;
  passcodes, tokens, raw GitHub errors, and response bodies are never stored.
- GitHub `mergeable: null` or other inconclusive mergeability evidence records a
  retryable blocked operation. Unexpected persistence failures return a fixed
  executor error and never expose a database or connector exception message.

Do not duplicate these contracts in new client-only connectors, ad hoc task
stores, or separate privacy classifiers.

## Trust, Privacy, And Safety Boundaries

Sensitive data includes runtime passcodes, private feeds, SQLite contents,
OpenAI/Supabase/OpenBrain credentials, Spotify OAuth values, and any real email,
calendar, finance, medical, purchase, or device information.

Rules:

- Never commit sensitive runtime data or include it in public test fixtures.
- Keep service-role credentials and synthesis/retrieval calls server-side.
- Require explicit approval before changing remote-access, auth, schema, paid
  services, or durable personal-data behavior.
- Treat the GitHub repository as public even when a deployment is private.

## Known Risks

| Risk | Impact | Mitigation / owner |
|---|---|---|
| Spotify OAuth depends on the browser retaining the app session through the provider redirect | A cleared or expired session prevents callback completion | Keep `SameSite=Lax`, require a current app session, and restart authorization after logging in |
| Only Gmail currently has an executable update adapter | Other feed sources can still be stale even when their cached health is online | Show freshness only for recorded refresh runs and add adapters source by source |
| Gmail's startup worker has only shallow timer tests | A scheduled callback or machine-sensitive command failure could become silent while on-demand freshness still appears healthy | S-013 TK-006 proves interval-first cadence, callback failures, bounded evidence, and command privacy |
| Most automated coverage is server/helper-level | Responsive layout and complete browser workflows can regress while Node tests stay green | Add repeatable desktop/mobile browser smoke coverage |
| The legacy project priority route writes generated Taskboards | An adopted project's apparent priority can drift from its owning stable spec and be overwritten on render | S-012 TK-002 fails closed first; later tickets apply exact changes through the project lifecycle |
| Repository release state does not identify the code currently served by launchd | CIC can report a clean/current repo while the private service runs an older reviewed SHA | S-016 adds immutable build identity and an authenticated runtime comparison; current live SHA is `6284ecc` |
| Scheduled Prescient writes use paid OpenAI and service-role Supabase access without complete timeout/scheduler observability proof | A hung or malformed run can consume resources, hide failures, or reconcile durable flags incorrectly | S-018 keeps the capability active until bounded requests, non-overlap, conditional resolution, sanitized evidence, and owner live acceptance pass |
| Configured external services can be unavailable or costly | Intelligence and music features may degrade or incur API spend | Keep optional configuration, visible source state, bounded calls, and deterministic fallback |
| Public GitHub release reads can be unavailable or rate-limited | Workbench candidate stays blocked even when the repository itself is healthy | Fail closed, preserve visibly stale prior evidence without mutation controls, and require an explicit refresh; no release action is inferred from stale data |
| Captain can finish after CIC loses the process callback | CIC could otherwise lose or duplicate the release outcome | Bind request/result bytes to the durable execution claim, reconcile through GET, and independently verify the exact PR merge commit as current `main` before recording applied |

## Design Decisions

| Decision | Rationale | Date / Source |
|---|---|---|
| Use the Workbench v2.3 spec-centered control surface | Keeps stable capability truth and proof out of the hot execution projection | 2026-07-15 / owner request and canonical local Workbench |
| Use `Integration` as the staging bridge | Task branches need a safe shared proving ground before release to `main` | 2026-07-10 / owner request |
| Keep CIC task cards separate from repository taskboards | Searchable Board/List views improve local operations without silently replacing canonical project files | 2026-07-10 / T-006 |
| Keep demo mode credential-free and deterministic | The repository can be evaluated safely without private services | `README.md`, `data.example.js` |
| Keep OpenBrain-style storage outside CIC | CIC is a consumer/control surface, not a second memory backend | `README.md`, `CONTRACT.md` |
| Prefer degraded states over fabricated data | Operational confidence depends on honest source status | `README.md`, server adapters |
| Read platform health from a cached validated report | Keeps CIC observable without granting browser-triggered command execution | 2026-07-12 / T-007 |
| Start Workbench release control with a fixed read-only candidate | Proves branch, PR, and Auditor evidence on mobile before adding any owner approval or remote mutation | 2026-07-16 / S-004 TK-001 |
| Hand only a recorded fixed Workbench approval to Captain | Keeps CIC credential-free and prevents it from becoming a GitHub executor while preserving the owner-authorized integration-to-main gate | 2026-07-16 / S-006 TK-001 |
| Require two mobile owner authorizations on one fixed card | Approval leaves GitHub unchanged; execution requires a new passphrase, current matching fingerprint, duplicate guard, and bounded durable-status monitoring | 2026-07-16 / S-005 TK-001 |

## Health Criteria

The project is healthy when:

- `npm test` passes with no unexpected failures;
- `npm run build` succeeds;
- `npm audit --omit=dev` reports no unresolved production advisory or an
  explicitly accepted exception;
- the synthetic demo starts and `/api/state` returns JSON;
- missing connector credentials render honest degraded/partial states;
- built client assets and committed files contain no real secrets or private
  feed data;
- UI changes receive desktop and mobile browser verification.

Verification commands live in `RUNBOOK.md`. Current work and proof live in
`TASKBOARD.md`.
