# Command Information Center - Blueprint

> Generated from LLM Workbench v2.3. See `RUNBOOK.md` -> Upgrading The Harness.

**Last reviewed:** 2026-08-18
**Status:** active
**Source root:** this repository

This is the stable reference for what Command Information Center is. Current
capability truth and proof live in stable specs, active work is projected into
`TASKBOARD.md`, shared terms live in `LEXICON.md`, and exact operations live in
`RUNBOOK.md`.

## Spec Catalog

<!-- spec-catalog:start -->
| FUID | Spec alias | Description | Status | Created | Last worked |
|---|---|---|---|---|---|
| 00005K | [S-001 - Operational Dashboard Baseline](specs/S-001-operational-dashboard-baseline/SPEC.md) | Preserve the verified CIC dashboard, trust, task, freshness, and platform-health baseline delivered under Workbench v2.1. | complete | 2026-07-15 | 2026-07-15 |
| 00005M | [S-002 - Workbench v2.3 Adoption](specs/S-002-workbench-v2-3-adoption/SPEC.md) | Adopt the current spec-centered Workbench while preserving CIC product, privacy, branch, and verification contracts. | complete | 2026-07-15 | 2026-07-15 |
| 00005O | [S-004 - Workbench Release Control](specs/S-004-workbench-release-control/SPEC.md) | Let Kayden inspect, approve, and execute a fixed, evidence-bound Workbench integration-to-main release from CIC without exposing a generic remote executor. | complete | 2026-07-16 | 2026-07-16 |
| 00005S | [S-005 - Mobile Workbench Release Workflow](specs/S-005-mobile-workbench-release-workflow/SPEC.md) | Let Kayden safely approve and execute the fixed Workbench integration-to-main release from one private, phone-ready CIC card. | active | 2026-07-16 | 2026-08-18 |
| 00005V | [S-006 - Captain Workbench Release Handoff](specs/S-006-captain-workbench-release-handoff/SPEC.md) | Replace CIC's direct GitHub merge executor with a credential-free, exact-request handoff to the fixed GPT_OS Captain worker. | complete | 2026-07-16 | 2026-07-16 |
| 00005X | [S-007 - Spec-Grouped Project Tickets](specs/S-007-spec-grouped-project-tickets/SPEC.md) | Group the Projects view by each project's specs with expandable tickets, adopt ticket terminology, rename the personal board to Taskboard, and unmask the workbench passphrase fields. | complete | 2026-07-16 | 2026-07-16 |
| 000063 | [S-008 - Project Deployment Portfolio](specs/S-008-project-deployment-portfolio/SPEC.md) | Show canonical GPT_OS projects and honest local release readiness on Deployments, while recognizing an already-promoted Workbench release as healthy instead of blocked. | complete | 2026-07-16 | 2026-07-16 |
| 000065 | [S-009 - Stable Project Numbers](specs/S-009-stable-project-numbers/SPEC.md) | Give every canonical GPT_OS project a stable P-### identity and show composite P-###/S-### references on the CIC Projects board. | complete | 2026-07-17 | 2026-07-17 |
| 000067 | [S-022 - Skill Catalog Visibility](specs/S-022-skill-catalog-visibility/SPEC.md) | Show Kayden's agent skill catalog in the CIC dashboard read-only, with source, freshness, and canon-versus-deployed drift, so he never digs through GitHub or the filesystem to see what his agents can run. | active | 2026-07-18 | 2026-07-21 |
| 00006B | [S-023 - Foundry Harness Flow](specs/S-023-foundry-harness-flow/SPEC.md) | Render a freshness-stamped root Foundry flow from Audit Engine evidence, with component drill-downs and no audit or repair authority in CIC. | active | 2026-07-19 | 2026-07-19 |
| 00006F | [S-024 - Daily Project Slice Receipts](specs/S-024-daily-project-slice-receipts/SPEC.md) | Show one freshness-linked daily slice receipt for every enrolled project without creating a second task or proof store. | complete | 2026-07-20 | 2026-07-20 |
| 00006I | [S-025 - Intelligence Synthesis Cost Control](specs/S-025-intelligence-synthesis-cost-control/SPEC.md) | Stop the AI Intelligence overview from calling paid OpenAI synthesis on every dashboard mount by adding a TTL cache, a manual force-refresh, and an auto-synthesis off switch, while preserving honest degraded and fallback states. | needs-review | 2026-07-20 | 2026-07-20 |
| 00006K | [S-026 - Awaiting You Owner Queue](specs/S-026-awaiting-you-owner-queue/SPEC.md) | Give Kayden one aggregated "Awaiting You" surface that names every owner decision and owner-gated blocker across all projects, with the exact decision needed and a direct jump to the item. | complete | 2026-07-20 | 2026-07-20 |
| 00006N | [S-027 - Foundry Control Surface v1.0.1](specs/S-027-foundry-control-surface-v1-0-1/SPEC.md) | Rebuild CIC v1.0.1 as the Foundry's honest operator surface: one registry-backed Master Taskboard, exact deployment branches, a Foundry/Schematic view, current skills, and a Foundry-first rework of every tab. | active | 2026-08-18 | 2026-08-18 |
| 000003 | [S-028 - FUID Work-item Projection And Intent](specs/S-028-fuid-work-item-projection-and-intent/SPEC.md) | Restore CIC's Spec-grouped five-column kanban from a rebuildable FUID work-item Projection and route movement through a separate validated Intent ledger. | active | 2026-08-18 | 2026-08-18 |
<!-- spec-catalog:end -->

## What This Project Is

Command Information Center (CIC) is the Foundry's human-facing,
freshness-visible Mirror and preferred Entrance. v1.0.1 is organized around
GPT_OS and active Foundry scopes: exact next work, stable-spec tickets, owner
gates, branch/deployment evidence, the live Schematic Projection, and installed
shared skills. The repository remains a safe public implementation; real feeds,
databases, credentials, and private runtime evidence stay local.

Core promise:

> Let the Captain see what is next, what is blocked, and what is actually
> deployed across the Foundry without copying Canon, fabricating Actuality, or
> leaking private credentials.

### v1.0.1 data plane

- `Projects/INDEX.md` Active Portfolio Enrollment owns the set of active
  remote-backed lanes; GPT_OS is added explicitly as the Master Producer
  Workspace and keeps the literal `GPT_OS` identity.
- Each readable scope's LLM Workbench `doctor` and `next --json` own its exact
  next-work result. Missing selectors stay visible as unavailable.
- Stable `specs/*/SPEC.md` files supply searchable ticket detail. CIC has no
  repository Taskboard write route.
- Canonical FUID, typed alias, Created, Last worked, lifecycle state, source
  revision, and source freshness are captured transactionally into a rebuildable
  SQLite Work-item Projection. SQLite is the query materialization, not Canon.
- Master Taskboard movement writes a validated Intent request and append-only
  Intent event in separate tables. The projected canonical status does not
  change until an authorized external Job Order updates Canon and capture runs
  again; CIC may render the request only as a pending overlay.
- Bounded, no-shell local Git reads report declared remote, observed checkout,
  branch, SHA, upstream relationship, dirtiness, and observation time without a
  fetch.
- The Foundry view embeds `servitor.local:5173` as a deterministic Canon
  Projection. It is not runtime truth and does not animate Job Orders in
  v1.0.1.
- Skills reads direct-child `SKILL.md` files from `~/.agents/skills` and exposes
  source mtime and availability without edit/deploy actions.

Primary users:

- An operator using CIC on its authenticated private host.
- Agents and maintainers extending the dashboard, API, and backend adapters.

## Non-Goals

This project is not trying to:

- Become the durable OpenBrain memory or vector-retrieval backend.
- Commit or publish a real operator feed, database, credentials, or OAuth tokens.
- Fabricate AI or connector results when a dependency is missing.
- Replace project-owned source files with a second hidden task database.
- Allocate canonical Project/Spec/Ticket FUIDs from SQLite or treat pending
  Intent as authorization.

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
- Query the Spec-grouped Master Taskboard across Backlog, To Do, In Progress,
  Blocked, and Complete with FUID first, typed alias second, Created, and Last
  worked; drag/drop creates pending Intent without moving canonical status.
- See one freshness-linked daily slice receipt per enrolled project, derived
  from project-owned spec/ticket evidence rather than a CIC task or proof store.
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

## Architecture

| Layer | Choice | Source / Notes |
|---|---|---|
| Runtime | Node.js 22+ | Required for built-in `node:sqlite`; `package.json` |
| Frontend | React 18, Vite 8, Lucide React | `src/main.jsx`, `src/intelligence.jsx`, `src/styles.css` |
| Backend | Express 5 | `server/app.js`, started by `server/index.js` |
| Local storage | SQLite plus a summarized JavaScript feed | `server/db.js`; ignored `data/cic.sqlite`; `data.example.js` contract |
| Auth | Optional passcode session cookie | `server/app.js`, `server/config.js` |
| Retrieval and synthesis | OpenBrain/Supabase adapters plus optional OpenAI synthesis | `server/openbrainClient.js`, `server/openbrainKeyword.js`, `server/openaiSynthesisClient.js` |
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
| Awaiting You | Aggregated owner queue: every open owner decision and owner-gated blocker across all discovered projects, each stating the exact decision with a safe deep link to the item; sidebar/mobile badge shows the count; honest empty state when nothing awaits | working | `src/awaitingYou.jsx`, `server/awaitingYou.js` |
| Intelligence | Briefing, source drilldown, charts, suggested questions, and source-backed answers | working with partial states | `src/intelligence.jsx`, `server/intelligence.js` |
| Briefing | Full summarized briefing and actions | working from feed | `src/main.jsx`, `data.example.js` |
| Master Taskboard | Spec-grouped Work-item Projection in Backlog, To Do, In Progress, Blocked, and Complete; drag/drop creates pending Intent | implementation in S-028 | `src/foundryPortfolio.jsx`, `server/db.js` |
| Personal Tasks | Separate local task creation and status workflow | working | `src/main.jsx`, `server/db.js` |
| Harness | Derived read-only Foundry Harness Flow: freshness-stamped root flow (Available → Eligible → Shown → Consulted → Acted through → Checked → Accepted) plus component drill-downs with coverage and exclusions | working from injected fixture; live export adapter awaits Audit Engine S-003 TK-003 | `src/harnessFlow.jsx`, `src/harnessFlowModel.js` |
| Calendar / Projects / Deployments / Inbox / Finance / Music | Focused operational panels; Projects shows stable project IDs and composite project/spec references; Deployments includes the fixed Workbench approval/Captain-handoff card plus the canonical read-only project release portfolio; calendar accepts `start`/`end` and legacy `when` fields | working or degraded by source availability | `src/main.jsx`, `src/projectTaskboards.jsx` |

### API Endpoints

| Method | Path | Auth | Purpose | Source |
|---|---|---|---|---|
| GET | `/api/auth/status` | no | Report passcode requirement/session state | `server/app.js` |
| POST | `/api/auth/login`, `/api/auth/logout` | no/current session | Manage local session | `server/app.js` |
| GET | `/api/state` | passcode when configured | Return dashboard feed, tasks, source and platform health, Spotify, and settings | `server/app.js` |
| GET | `/api/captain/workbench-release` | configured passcode plus current session | Return one fixed, read-only `KaydenClark/LLM_Workbench` `integration` to `main` candidate and latest durable operation | `server/workbenchRelease.js`, `server/db.js` |
| GET | `/api/project-deployments` | passcode when configured | Return bounded local Git release evidence for canonical entries in `Projects/INDEX.md`; performs no fetch or mutation | `server/projectDeployments.js` |
| GET | `/api/harness-flow` | passcode when configured | Return the derived read-only Harness Flow envelope from the injected sanitized export reader; no write, audit, repair, dispatch, approval, or resolution route exists | `server/harnessFlow.js` |
| GET | `/api/project-taskboards` | passcode when configured | Return project summaries with stable registry-backed `P-###` IDs or an explicit null identity | `server/taskboards.js` |
| GET | `/api/project-taskboards/:project` | passcode when configured | Return one repository taskboard and its local specs with the same project identity | `server/taskboards.js` |
| GET | `/api/work-items` | passcode when configured | Return the rebuildable FUID-primary Work-item Projection grouped by Spec with aliases, dates, provenance, and pending Intent overlays | `server/workItems.js`, `server/db.js` |
| POST | `/api/work-items/refresh` | passcode when configured | Deterministically capture configured canonical sources into the Projection; never allocate canonical identity or mutate Canon | `server/workItems.js`, `server/db.js` |
| POST | `/api/work-intents` | passcode when configured | Validate and record one idempotent pending movement Intent plus append-only event; projected status remains unchanged | `server/workItems.js`, `server/db.js` |
| GET | `/api/awaiting-you` | passcode when configured | Aggregate open owner decisions and owner-gated blockers across every discovered project into one read-only queue; writes, approvals, and resolutions are out of contract | `server/awaitingYou.js`, `server/taskboards.js` |
| POST | `/api/captain/workbench-release/approval` | current session plus timing-safe step-up passcode | Revalidate and record one fingerprint-bound approval intent; never execute a merge | `server/app.js`, `server/workbenchApproval.js`, `server/db.js` |
| POST | `/api/captain/workbench-release/execution` | current session plus a second timing-safe step-up passcode | Atomically claim one approved operation, revalidate its exact evidence, and enqueue one credential-free request to the fixed Captain worker | `server/app.js`, `server/captainHandoff.js`, `server/db.js` |
| POST/PATCH | `/api/tasks`, `/api/tasks/:id` | passcode when configured | Create or update task cards | `server/app.js`, `server/db.js` |
| POST | `/api/tasks/:id/dismiss` | passcode when configured | Dismiss a suggested task | `server/app.js`, `server/db.js` |
| POST | `/api/refresh/gmail` | passcode when configured | Re-read summarized Gmail suggestions | `server/app.js`, `server/gmail.js` |
| GET/POST | `/api/intelligence/*` | passcode when configured | Source status, retrieval, overview, and answers. The overview synthesis is TTL-cached server-side (`CIC_INTELLIGENCE_TTL_MS`, default 30 min), can be disabled on mount (`CIC_INTELLIGENCE_AUTOSYNTH=off` serves the deterministic fallback), and is force-refreshed by `?refresh=1` | `server/intelligence.js` |
| GET | `/api/recall` | passcode when configured | Resolve one recall value THROUGH the K-001 socket contract (`recall.query`) and return a render card with provenance + freshness; a reach-around into OpenBrain's files/DB is rejected, never rendered (GPT_OS S-014 TK-004) | `server/recallSocket.js`, `server/openbrainClient.js` |
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
| `work_projection_sources` | canonical source key/path/revision, observed/captured times, status/detail | local SQLite | provenance/freshness for deterministic rebuilds; not Canon |
| `work_items_projection` | FUID, alias, kind, parent FUID, canonical lifecycle/dates, source revision | local SQLite | rebuildable query materialization; no independent status writes |
| `work_projection_refreshes` | refresh FUID, timing, counts, outcome, bounded error | local SQLite | append-only capture receipts |
| `intent_requests` | Intent FUID, target FUID, requested transition, actor, source revision, idempotency, state/timestamps | local SQLite | Intent-plane request store separate from Projection and personal tasks |
| `intent_events` | request FUID, event type, bounded payload, timestamp | local SQLite | append-only Intent trail enforced by triggers |
| `fuid_allocators` | plane-scoped width and last-issued value | local SQLite | allocates CIC-born Intent/refresh IDs only; never canonical work identity |
| `window.CIC_DATA` | summarized source panels and briefing | ignored `data.js`; example in `data.example.js` | public repo ships synthetic values only |
| `prescient_tasks` | flagged task state | optional Supabase backend | schema in `supabase/migrations/` |
| Platform health report | check time, mode, overall status, bounded component checks | ignored sibling `.local/platform-health.json` | read-only derived evidence; stale after 90 minutes |

## Core Logic And Invariants

- `/api/*` must return JSON errors rather than the frontend app shell.
- Task input is validated and normalized in `server/db.js`.
- Connector, retrieval, and synthesis failures produce explicit degraded or
  partial states.
- The AI Intelligence overview never calls OpenAI on every dashboard mount: a
  successful synthesis is TTL-cached (keyed on the normalized feed context) and
  reused with an honest `cached`/`generatedAt`; auto-on-mount synthesis can be
  disabled entirely; only a manual refresh forces a fresh paid synthesis.
- `/api/state.refreshFreshness` is derived from durable `refresh_runs`; the
  top-level `refreshedAt` remains response time and is not source freshness.
- The synthetic example feed contains no real personal or account information.
- Gmail-derived task suggestions remain summarized and must not persist full
  message bodies.
- Privacy-sensitive content uses the shared classifier in `src/privacy.js`.
- The browser must not call privileged external services directly.
- CIC reads the cached platform report server-side and never executes the
  platform verifier from a browser request.
- The Harness Flow source is injected as
  `harnessExportReader(): { status: "ok", source, reports } | { status:
  "unavailable" | "malformed", source, reason }`. Every `reports[]` entry uses
  the S-023 report contract; the array only aggregates one root and zero or
  more component scopes.
- Harness freshness comes from the root report's own generation time. Missing
  or unrecognized run evidence stays visibly `INACCESSIBLE`; static setup
  controls are never promoted into receipt-proven stages; and normalized
  output strips absolute paths, full digests, credential-shaped text, and raw
  report internals.
- CIC cannot run an audit, apply a repair, dispatch an agent, approve work, or
  resolve a finding through the Harness surface.
- The Awaiting You queue (`server/awaitingYou.js`) is derived read-only from the
  same projects the Projects surface discovers. An owner decision is an open row
  in a board's `## Owner Decisions`/`## Pending Decisions` table (reference and
  decision cells present, not a none-sentinel, status not resolved, owner Kayden
  or unspecified). An owner-gated blocker is a spec- or ticket-level blocker that
  names the owner/Kayden and is not already resolved; a blocker citing only other
  tickets/specs/projects is a dependency and is excluded, and a spec-level owner
  gate suppresses its duplicate ticket rows. The queue applies, approves, or
  resolves nothing; its only action is a read-only deep link into the owning
  project spec.
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
| Most automated coverage is server/helper-level | Responsive layout and complete browser workflows can regress while Node tests stay green | Add repeatable desktop/mobile browser smoke coverage |
| Configured external services can be unavailable or costly | Intelligence and music features may degrade or incur API spend | Keep optional configuration, visible source state, bounded calls, and deterministic fallback |
| Public GitHub release reads can be unavailable or rate-limited | Workbench candidate stays blocked even when the repository itself is healthy | Fail closed, preserve visibly stale prior evidence without mutation controls, and require an explicit refresh; no release action is inferred from stale data |
| Captain can finish after CIC loses the process callback | CIC could otherwise lose or duplicate the release outcome | Bind request/result bytes to the durable execution claim, reconcile through GET, and independently verify the exact PR merge commit as current `main` before recording applied |

## Design Decisions

| Decision | Rationale | Date / Source |
|---|---|---|
| Use the Workbench v2.3 spec-centered control surface | Keeps stable capability truth and proof out of the hot execution projection | 2026-07-15 / owner request and canonical local Workbench |
| Use `Integration` as the staging bridge | Task branches need a safe shared proving ground before release to `main` | 2026-07-10 / owner request |
| Keep CIC task cards separate from repository taskboards | Searchable Board/List views improve local operations without silently replacing canonical project files | 2026-07-10 / T-006 |
| Materialize canonical work and store movement Intent separately | SQLite makes Spec/Ticket work queryable and supports a living kanban without becoming Canon; a pending request cannot silently mutate projected status or authorize Actuality | 2026-08-18 / S-028 and owner request |
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
