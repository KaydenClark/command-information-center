# Command Information Center - Runbook

> Generated from LLM Workbench v3.2.1. See Upgrading The Harness below.

**Last reviewed:** 2026-09-04
**Blueprint reviewed:** 2026-08-18
**Runtime owner:** repository owner / local operator
**Environment:** credential-free demo or authenticated private runtime

This file explains how to install, run, verify, recover, and safely publish
Command Information Center.

## Operations Index

Every session reads this index at entry, then follows only the rows its task
needs. Each row names an operation, when following it is worth it, and the
stable pointer to where its procedure lives.
A row that points to a skill in the tracked skills lane makes that skill part
of the Contract for its operation (`AGENTS.md` Instruction Authority), so a
change to a skill an index row points to, or to an index row, is reviewed as a
Contract change.

| Operation | Follow when | Pointer |
|---|---|---|
| Enter a session | Every session start or resume: check root, branch and dirty state, run doctor and load the assigned Spec. | [Ordinary Entry](#ordinary-entry) |
| Find the owner of a question | You need the file that owns a permission, meaning, work state, proof or procedure. | [Finding The Owner Of A Question](#finding-the-owner-of-a-question) |
| Route a truth to its owner | Work changed a durable truth and its owner must be updated, or nothing changed and that must be recorded. | [to-docs](workbench/skills/to-docs/SKILL.md#to-docs) |
| Cite a file that changes | A Spec, review or record cites a line of a file that later merges can move. | [to-docs](workbench/skills/to-docs/SKILL.md#citation-anchors) |
| Coordinate roles and stances | You plan, dispatch, monitor or verify work as a role or a named stance. | [Role And Stance Coordination](#role-and-stance-coordination) |
| Choose the behavior for a request | A request arrives in ordinary language and you must pick the skills and endpoint it authorizes. | [Behavior Selection](#behavior-selection) |
| Check prerequisites | A fresh machine or clone needs this project's required tools confirmed. | [Prerequisites](#prerequisites) |
| Configure the environment | Local configuration or required variables must be created or checked. | [Environment Configuration](#environment-configuration) |
| Install | You set up a fresh clone. | [Install](#install) |
| Run locally | You start the project on a local machine. | [Run Locally](#run-locally) |
| Run the tests | A change needs its fast check or the full verification. | [Test And Build](#test-and-build) |
| Preflight a source launch | Before claiming a source task that runs against the private adopting instance. | [Launch Preflight](#launch-preflight) |
| Smoke-check the running app | The demo or installed server is up and its state endpoint must answer. | [Runtime Smoke Check](#runtime-smoke-check) |
| Rebuild the Work-item Projection | The Projection or its refresh receipt must be rebuilt, demonstrated or recovered. | [Work-item Projection Rebuild, Demo, And Recovery](#work-item-projection-rebuild-demo-and-recovery) |
| Prove an owner-visible change is finished | An owner-visible CIC change must be installed, restarted and checked in the authenticated browser. | [Foundry v1.0.1 production check](#foundry-v101-production-check) |
| Check a Workbench release or project portfolio | You run the release check, slice receipts or canonical release portfolio views. | [Workbench Release Check, Approval, And Captain Handoff](#workbench-release-check-approval-and-captain-handoff) |
| Verify a behavior change | A behavior change needs its red/green test, its targeted test and the full verification suite before its result is claimed. | [implement](workbench/skills/implement/SKILL.md#engineering-and-verification); this room's suite: [Test And Build](#test-and-build) |
| Hold test coverage | You add or change tests, or judge whether coverage is enough. | [implement](workbench/skills/implement/SKILL.md#test-coverage-policy) |
| Run the Workbench runtime tools | You run doctor, selection, records, decision records or diagnostics from the installed tools lane. | [Workbench Lifecycle, Diagnostics, And Decision Records](#workbench-lifecycle-diagnostics-and-decision-records) |
| Write or accept a decision record | A decision record (ADR or DDR) is proposed, accepted, superseded, deprecated, read, linked or validated. | [to-docs](workbench/skills/to-docs/SKILL.md#decision-records) |
| Read a diagnostic and its blocking effect | A runtime tool reports a finding and you need its severity and what it blocks. | [workbench-runtime](workbench/skills/workbench-runtime/SKILL.md#diagnostics-and-blocking-effects) |
| Validate the Wiki | A Wiki page changed or must move to another collection, or doctor reports a Wiki finding. | [workbench-runtime](workbench/skills/workbench-runtime/SKILL.md#wiki-validation) |
| Lint the Wiki | A Wiki update is ending (lint the pages it touched), or a Spec's work is verified and its review begins (lint the whole Wiki). | [Wiki Lint](#wiki-lint) |
| Repair installed state | doctor reports installed state that a room command rewrites. | [workbench-runtime](workbench/skills/workbench-runtime/SKILL.md#installed-state-the-harness-wrote) |
| Deliver a Spec through its lifecycle | You pick up, deliver, review or close an assigned Spec and its Tasks. | [Spec Lifecycle And Retrieval](#spec-lifecycle-and-retrieval) |
| Pick, claim and close a Task | Every pickup or resume of assigned work: selection, claim, receipt, close and blocker rules. | [implement](workbench/skills/implement/SKILL.md#work-selection-and-lifecycle) |
| Work a Task as Worker | You select, claim, implement, record receipts for, self-check, close and hand back one Task. | [implement](workbench/skills/implement/SKILL.md#worker-selection-implementation-and-hand-back) |
| Review an assembled Spec | A Dispatcher assembles a candidate, or a separate Director reviews it and records the verdict before integration. | [dispatcher](workbench/skills/dispatcher/SKILL.md#dispatcher-and-separate-director-assembled-review) |
| Correct a failed review | A verdict or owner finding failed and its findings return to the still-open Spec. | [dispatcher](workbench/skills/dispatcher/SKILL.md#assembled-review-and-corrective-return) |
| Record owner Human QA and complete | The owner approves delivered work, or main containment must be proven before `complete`. | [director](workbench/skills/director/SKILL.md#owner-human-qa-and-main-before-complete); closure rules: [director](workbench/skills/director/SKILL.md#owner-closure-and-reconciliation) |
| Capture, retire or recover a completed Spec | After `complete`: feature capture, retirement, discard or recovery. | [director](workbench/skills/director/SKILL.md#documentation-feature-capture-retirement-and-recovery) |
| Allocate a visible identifier | You need a new Spec, Task, note or other visible identifier. | [workbench-runtime](workbench/skills/workbench-runtime/SKILL.md#visible-identifiers) |
| Use the Landmark Tracker | Concept understanding (DQCs, landmarks) changes, or the Tracker view is needed. | [notepad](workbench/skills/notepad/SKILL.md#landmark-tracker-accepted-design-and-available-operations) |
| Keep a JSON notepad | Meaningful work needs a local note created, resumed, appended, trimmed or cleaned up. | [notepad](workbench/skills/notepad/SKILL.md#runtime-reference) |
| Read frozen history or recovery receipts | A legacy checkpoint is cited, or a recovery receipt or backup is needed. | [checkpoint](workbench/skills/checkpoint/SKILL.md#frozen-history-and-operational-recovery) |
| Transport sessions privately | Private session transport is configured and selected collections must sync. | [save](workbench/skills/save/SKILL.md#optional-private-session-transport) |
| Save, promote or add a room-local skill | Authorized work must be saved to its owners, or the room adds its own skill. | [save](workbench/skills/save/SKILL.md#how-save-and-promote-compose); room-local skills: [workbench-runtime](workbench/skills/workbench-runtime/SKILL.md#room-local-skills) |
| Promote claims to an owner | Selected supported claims must reach their durable owner. | [promote](workbench/skills/promote/SKILL.md#command-reference) |
| Evaluate a harness change | You must show that a harness change is an improvement. | [Evaluation And Benchmarking](#evaluation-and-benchmarking); this room's checks: [Harness Verification](#harness-verification) |
| Transfer work through a handoff | Work goes to another agent or chat as a job, investigation, report or update. | [handoff](workbench/skills/handoff/SKILL.md#transfer-procedure) |
| Improve against a benchmark | Agent rules, control docs, evaluation criteria or process change and need a baseline first. | [implement](workbench/skills/implement/SKILL.md#benchmark-driven-improvement) |
| Return harness feedback | A lesson about the harness rules belongs in the feedback return channel. | [Harness Feedback Loop](#harness-feedback-loop) |
| Operate project data | The project has seed data, migrations, imports, local databases or generated feeds. | [Data Operations](#data-operations) |
| Deploy or start services | The project has deployment, scheduled jobs or service startup. | [Foundry v1.0.1 production check](#foundry-v101-production-check) |
| Branch and open a pull request | You create a task branch or open a PR into integration, or need this room's Git commands. | [implement](workbench/skills/implement/SKILL.md#version-control-procedures); this room's commands: [Version-Control Procedures](#version-control-procedures) |
| Merge, prove containment and clean up a branch | A Task's merge answers are validated, or an assembled Spec candidate's Verify review passed: merge, prove integration contains it and delete the merged branch. | [implement](workbench/skills/implement/SKILL.md#branch-completion); this room's closeout commands: [Version-Control Procedures](#version-control-procedures) |
| Upgrade the harness | The project moves to a newer Workbench version. | [Upgrading The Harness](#upgrading-the-harness) |
| Write a manual harness feedback report | A setup-only Round One check succeeded and an assessment is assigned. | [Manual Harness Feedback Reports](#manual-harness-feedback-reports) |
| Troubleshoot a known failure | A command fails with a symptom listed there. | [Troubleshooting](#troubleshooting) |
| Recover or roll back | A change fails and its touched files must be restored or reverted. | [implement](workbench/skills/implement/SKILL.md#recovery-and-rollback); this room's data rules: [Recovery And Rollback](#recovery-and-rollback) |
| Record operational proof | A command changed durable project state. | [Operational Proof](#operational-proof) |
| Size and continue work | You size a Task or leave work a fresh context can resume. | [Evidence And Continuation Practices](#evidence-and-continuation-practices); [notepad](workbench/skills/notepad/SKILL.md#continuing-after-a-save-or-handoff); [save](workbench/skills/save/SKILL.md#evidence-partitioning); [to-tasks](workbench/skills/to-tasks/SKILL.md#sizing-a-task) |
| Check the Workbench connection identity | The room's `workbenchId` is created, read or compared. | [workbench-runtime](workbench/skills/workbench-runtime/SKILL.md#workbench-connection-identity) |
| Check configured-host capabilities | A host is set up, or its lanes, skill discovery or tool execution are in doubt. | [workbench-runtime](workbench/skills/workbench-runtime/SKILL.md#configured-host-capability-checks) |
| Review a candidate independently | An assembled Spec or landmark is at its Verify step and needs separate-context review, or a main-readiness or incident-claim review is requested. | [code-review](workbench/skills/code-review/SKILL.md#independent-review-boundaries) |

## Ordinary Entry

Follow `AGENTS.md` -> this section -> `LEXICON.md` -> Task Routing. Inspect the
root, branch, upstream and dirty state; run the project-local spec doctor and
load the explicitly assigned spec. For owner-directed pickup, use `next --json`
and `show` to resolve that assignment. The spec and task set the normal
stance. Investigate within the task; do not invent a next task when blocked.
Load remaining Runbook sections only for the operation being performed.

For a setup-only Round One assignment, a fresh agent follows that route, checks
the manifest, relevant Wiki and ADRs, and runs read-only configuration checks.
Return the result in chat only: no feedback report, handoff, checkpoint,
self-created task, or other delivered prose artifact. Internal JSON capture
follows the meaningful-work rule and is reconciled at closeout; it does not
turn a chat-only setup check into a reporting assignment. Round One precedes
feedback testing.

### Finding The Owner Of A Question

1. Use [LEXICON -> Artifact Ownership Schema](LEXICON.md#artifact-ownership-schema)
   to identify the job: permission, meaning, destination, work state, proof,
   procedure, recovery or another listed responsibility.
2. Follow the named owner and resolve installed paths through the manifest.
   Consult only the relevant section and its linked sources. For a work-state
   question, follow the Taskboard row to the owning Spec before editing.
3. Separate the answer's status: accepted requirement, verified observation,
   proposal, unresolved question or historical claim. Apply AGENTS State
   Resolution if sources disagree; file location alone does not settle it.
4. When authorized work changes the answer, update its owner and refresh any
   derived view. If the route is missing, use bounded search and repair that
   route in scope. An unresolved decision stays in the existing work owner or
   objective note; a missing answer does not authorize a new task.

For example, a failed test has several owners: the Spec defines the expected
behavior, the source implements it, the result records the failure, and the
Spec records any resulting blocker. A Wiki explanation may clarify the cause;
it does not redefine acceptance. After interruption, the Runbook supplies the
recovery procedure while the Spec, source and saved context supply what to
recover. Execution and recovery therefore remain separate jobs.

### Role And Stance Coordination

Roles scope assignments; stances supply their job. Follow the Lexicon before
assigning Director (project/integration), Dispatcher (one Spec/branch) or Worker
(one Task). At flight launch, assign Spec Planner to plan small Tasks and safe
parallel groups from current Actuality; planning Workers may assist. Assign
Spec Manager to dispatch and monitor execution. Keep one writer for shared
Spec/projection state and route cross-Spec dependencies to the Director.

Use Reviewer or Auditor stance for the named verification job. Apply the
existing independent-review eligibility rules to the actual agent/context;
changing stance does not clear prior involvement. Normally Workers hand back
merge requests to the Dispatcher branch and the Dispatcher presents the
assembled candidate for review and merge into integration. Inspect the current
release owner for any bootstrap exception before selecting a target.

Reconcile accepted decisions, current progress, off-integration candidate
references and remaining gates into their existing tracked owners through
reviewed changes. Distinguish a documented decision, an unmerged candidate and
a delivered capability. Create no Tasks for a newly planned Spec until launch;
preserve already-authored Tasks and their evidence.

### Behavior Selection

After resolving the requested scope, compose the smallest behavior already
authorized by ordinary language; do not wait for a second skill invocation.

| User intent | Behavior and endpoint |
|---|---|
| Decide or stress-test an idea | `grill-me`, the entry composing `grilling` with `notepad`; save answers/corrections before continuing |
| Preserve or resume meaningful work | `notepad`; verify live state and returned revision |
| Reconcile agreed claims | `promote` with `to-docs` and `save`; no implied implementation |
| Write specifications only | `to-spec` and needed `to-tasks`; stop at the specified endpoint |
| Deliver assigned work | `carry` with `implement`, verification, Task merge answers, independent Verify review of the assembled Spec and `save` |
| Transfer a job or report to another context | core `handoff`; recipient purpose, instructions and context within assigned role scope |
| Review a candidate or readiness | `code-review`; report only, no implementation or main merge |

Every helper inherits the caller's narrower endpoint. Mention is not invocation
and invocation is not new authority. Optional routers and historical extension
skills are not prerequisites. For meaningful work, create/resume a JSON note,
read its revision, verify Actuality and correct stale state before dependent
work. Confirm successful append/current results after material changes and
validate/read back before voluntary pause or handoff. Runtime revision, privacy
and dependency checks enforce those operations; host-native interception of
arbitrary agent actions is not claimed.

## Prerequisites

Required tools:

- Node.js 22 or newer (`server/db.js` uses built-in `node:sqlite`).
- npm from the Node installation.
- Git and GitHub authentication for branch publication.

Optional accounts for live functionality:

- OpenAI for server-side synthesis and embeddings.
- A compatible Supabase/OpenBrain backend for retrieval.
- Spotify developer credentials for playback control.

Required local runtime files are created from committed examples:

- `.env` from `.env.example` when configuration is needed.
- `data.js` from `data.example.js` for the synthetic demo.
- `data/cic.sqlite`, created automatically on first server start.

All three are local/ignored. Never commit real values or runtime data.

## Launch Preflight

Use the GPT_OS Preflight implementation with the CIC Workbench selected
explicitly before claiming a source ticket:

```bash
node /ABSOLUTE/GPT_OS/tools/preflight.mjs \
  --root /ABSOLUTE/CIC_WORKTREE \
  --repo /ABSOLUTE/CIC_WORKTREE \
  --push-to BRANCH \
  --spec S-### \
  --ticket TK-### \
  --json
```

`tools/protected-checkouts.json` keeps CIC-local root selection public-safe.
CIC has no independently protected shared checkout, so the tracked policy does
not enroll the installed product, runtime, or any unrelated repository.

## Install

For a reproducible checkout:

```bash
npm ci
```

Expected result: dependencies match `package-lock.json` and npm completes
without a production vulnerability warning.

## Environment Configuration

Create the optional local files:

```bash
cp .env.example .env
cp data.example.js data.js
```

With no credentials filled in, CIC still runs in deterministic demo mode.

Configuration groups:

| Variables | Purpose | Secret? |
|---|---|---|
| `CIC_RUNTIME_ROOT`, `CIC_GPT_OS_ROOT`, `HOST`, `PORT`, `CIC_DB`, `CIC_DATA_FEED` | Local server, GPT_OS discovery, and storage paths | no |
| `CIC_SKILL_CATALOG_PATH`, `CIC_SKILL_DEPLOYED_ROOT` | Optional shared-skill root overrides; v1.0.1 defaults both to `~/.agents/skills` | no |
| `CIC_PASSCODE`, `CIC_PASSCODE_HASH` | Optional local app gate; required for Workbench release-candidate reads, approval, and execution | yes |
| `OPENAI_*` | Synthesis and embedding configuration | API key is secret |
| `CIC_INTELLIGENCE_TTL_MS`, `CIC_INTELLIGENCE_AUTOSYNTH` | AI overview cost controls (cache TTL and auto-on-mount toggle) | no |
| `SUPABASE_*`, `QUERY_WIKI_*`, `OPENBRAIN_*` | Retrieval backend | service/token values are secret |
| `SPOTIFY_*`, `ATLAS_URL` | Playback authorization and Atlas link | client secret/tokens are secret |
| `GMAIL_REFRESH_*` | Summarized Gmail suggestion refresh | command/path may be machine-sensitive |

Use `.env.example` for the complete variable list and `CONTRACT.md` for the
OpenBrain-compatible backend interface.

### Isolated Source Checkout

To run reviewed code from a registered worktree without moving or copying the
canonical runtime state, inject `CIC_RUNTIME_ROOT` before the Node process
starts:

```bash
CIC_RUNTIME_ROOT='/absolute/path/to/canonical-cic' npm start
```

The value is a bootstrap setting: do not rely on placing it inside `.env`,
because it selects which `.env` CIC loads; the dotenv loader ignores that key.
It must be an absolute existing directory. CIC resolves symlinks to the real
directory once during configuration and pins later local environment-file
writes to that selected path. Invalid, relative, missing, or non-directory
values stop startup with a fixed error that does not echo the supplied path.

With the setting present, CIC loads and updates `.env` at the runtime root;
resolves relative `CIC_DB`, `CIC_DATA_FEED`, and `PLATFORM_HEALTH_REPORT` paths
from that root; and discovers project taskboards from its parent. Source code
and the built `dist/` assets still come from the isolated checkout. This keeps
credentials, feeds, SQLite, sibling projects, and platform-health evidence in
their canonical topology without copying or reading them during deployment.

`GMAIL_REFRESH_COMMAND` is parsed into an executable and arguments without a
shell. Quote paths or arguments containing spaces, for example:

```bash
GMAIL_REFRESH_COMMAND='"/Users/me/Tools/Gmail Refresh" --mode "current inbox"'
```

Unmatched quotes fail the refresh explicitly; commands are terminated after
120 seconds and non-zero exits are recorded as degraded refresh runs.

### AI Intelligence Overview Cost Controls

The Intelligence overview (`GET /api/intelligence/overview`) is the only paid
OpenAI call on a normal dashboard mount. Three controls bound that cost:

- **TTL cache** — a successful synthesis is cached server-side, keyed on the
  meaningful normalized feed context, and reused until it expires. Repeated
  mounts and tab switches inside the window reuse it instead of re-calling
  OpenAI. Tune with `CIC_INTELLIGENCE_TTL_MS` (default `1800000`, 30 minutes).
  A cached response is returned with `cached: true` and keeps the original
  `generatedAt`, so the UI stays honest about when synthesis actually ran.
- **Manual Refresh** — the Intelligence panel's refresh control requests
  `?refresh=1`, which bypasses the cache and forces a fresh synthesis on demand.
- **Auto-synthesis toggle** — set `CIC_INTELLIGENCE_AUTOSYNTH=off` to stop
  auto-on-mount synthesis entirely. On-mount loads then serve the deterministic
  local fallback (`generatedBy: "local"`, `autosynth: "off"`) at zero OpenAI
  cost, while a manual Refresh still synthesizes on demand. Any other value
  keeps auto-synthesis enabled.

When OpenAI is not configured, or a synthesis call fails, the endpoint already
falls back to the deterministic local overview; these controls only change when
a paid synthesis is attempted, never the honesty of degraded states.

## Run Locally

Production-like local demo:

```bash
cp data.example.js data.js
npm run build
npm start
```

Open `http://127.0.0.1:8787`.

Development mode uses two terminals:

```bash
npm start
```

```bash
npm run dev
```

Open `http://127.0.0.1:5173`; Vite proxies `/api` to port `8787`.

## Test And Build

Fast check (the targeted test for a change):

```bash
npm test
```

Full verification is the one full verification suite list below. `AGENTS.md`
[Engineering And Verification](AGENTS.md#engineering-and-verification) requires
it to pass before a change's result is claimed; the red/green steps and their
order follow the
[`implement` skill](workbench/skills/implement/SKILL.md#engineering-and-verification).

```bash
npm test
npm run test:browser
npm run build
npm audit --omit=dev
node workbench/tools/spec-workbench.mjs doctor
node workbench/tools/workbench-layout.mjs validate --project "$PWD"
```

Expected result:

- all implemented tests pass; explicitly listed `test.todo` cases remain visible
  and are not counted as completed behavior;
- Playwright Chromium passes the desktop workflow and desktop/mobile responsive
  smoke checks, with temporary artifacts written outside the repository;
- Vite emits a production build under ignored `dist/`;
- the production dependency audit reports no unresolved advisory or the task
  records the exact accepted exception.

Treat tests as the project specification: if someone accidentally deletes a
meaningful line, at least one test or documented manual check fails, and tests
that are stale or pure bloat are removed. The coverage rules follow the
[`implement` skill](workbench/skills/implement/SKILL.md#test-coverage-policy).

### Runtime Smoke Check

With the demo feed prepared and no passcode configured:

```bash
npm start
```

In another terminal:

```bash
curl --fail --silent http://127.0.0.1:8787/api/state
```

Expected result: JSON containing `dashboard`, `tasks`, `sourceHealth`,
`platformHealth`, `refreshFreshness`, `spotify`, `settings`, and `refreshedAt`.

### Work-item Projection Rebuild, Demo, And Recovery

With CIC running and no passcode configured, one request performs a complete
transactional rebuild from the configured canonical Workbench sources and
returns the resulting Projection plus its FUID-bearing refresh receipt:

```bash
curl --fail --silent http://127.0.0.1:8787/api/work-items
```

Expected result: `source` names SQLite as a noncanonical Work-item Projection;
`refresh.outcome` is `ok`; each source records path, revision, and observation;
and `specs[].tickets[]` carries FUID, typed alias, Created, Last worked,
canonical status, and any pending Intent overlay. When passcode protection is
enabled, use the same route with an authenticated session cookie.

This room's own canonical Specs no longer carry FUID lifecycle metadata
(S-031, owner decision at the v3.1.1 adoption), so CIC itself reports as an
`unavailable` Work-item Projection source; enrolled scopes that still carry
the FUID schema project normally.

Run the hermetic desktop/mobile interaction demo in one command:

```bash
npm run test:browser -- --grep "Master Taskboard groups FUID work"
```

The demo uses a temporary SQLite path and mocked canonical portfolio payload.
It proves five columns, Spec grouping, identity/date search, responsive layout,
and that a drop creates pending Intent without moving the canonical card.

Recovery is a source-first rebuild: repair or restore the canonical repository
controls, then repeat `GET /api/work-items`. A validation or database failure
rolls back the transaction, preserves the last good Projection, and records a
failed refresh receipt when storage is available. Do not delete or edit
`work_items_projection`; do not treat it as Canon. Pending Intent is stored in
separate tables and survives a Projection rebuild.

### Foundry v1.0.1 production check

With the installed service running:

For every owner-visible CIC change, this is the completion gate: branch and
automated-test success alone are **not** a finished update. The exact reviewed
commit must be installed, the service restarted, and the authenticated browser
must show the changed behavior at `http://servitor.local:8787/`. Otherwise,
report the work as ready to install or in progress and state the missing proof.

```bash
curl --fail --silent http://127.0.0.1:8787/api/auth/status
curl --fail --silent -I http://servitor.local:8787/
curl --fail --silent -I http://servitor.local:5173/
```

Use an authenticated browser session for `/api/foundry-portfolio`, then verify
the under-one-minute operator check in `README.md`. The payload must include
`GPT_OS`; every scope must carry either an exact Workbench next result or a
specific unavailable state, and every declared remote must carry observed Git
evidence or a specific missing-checkout finding.

The Foundry iframe is a Projection. A successful load is not evidence that a
Job Order ran. Live Job Order motion remains unavailable until its event,
Grounding Journal, Gatehouse receipt, activation, socket-freshness, and Assay
contracts exist.

### Recall Socket Demo (K-001) — GPT_OS S-014 TK-004

Prove the recall→interface Foundry slice: CIC resolves one recall value THROUGH
the K-001 socket contract and renders provenance + freshness. With the server
running (no passcode configured):

```bash
curl --fail --silent http://127.0.0.1:8787/api/recall
```

Expected result: JSON with `card.value`, `card.provenance.path`,
`card.freshness.state`, `card.resolvedVia: "contract"`, `card.entrypoint:
"recall.query"`, and `contract: { socket: "K-001", entrypoint: "recall.query" }`.
Without OpenBrain credentials `demo` is `true` and a hermetic contract client
resolves a verifiable vault fact — still via the contract, never a filesystem
reach-around. The Dashboard view renders this as the **Recall socket** panel
(desktop + mobile). The no-reach-around gate is proven by
`node --test test/recallSocket.test.js` (a filesystem/database connection is
rejected before any query runs).

### Harness Flow Check

The Harness view renders a sanitized report export read-only:

```bash
curl --fail --silent http://127.0.0.1:8787/api/harness-flow
```

Expected result: JSON containing `source`, `checkedAt`, `status`
(`fresh | stale | malformed | unavailable`), `reason`, `generatedAt`,
`ageMinutes`, `root`, and `components`. When `CIC_HARNESS_REPORT` is unset,
CIC reads the committed synthetic `harness-flow.example.json`; a configured
relative path resolves from `CIC_RUNTIME_ROOT`.

The injected server adapter interface is:

```text
harnessExportReader():
  { status: "ok", source: string, reports: HarnessReport[] }
  | { status: "unavailable" | "malformed", source: string, reason: string }
```

Each `HarnessReport` uses the S-023 fixture contract exactly. The array carries
one root report and zero or more component reports. Replacing the fixture reader
with Audit Engine S-003 TK-003 changes only this server-side adapter. The route
accepts only GET; there is no audit, repair, agent-dispatch, approval, or
resolution write path.

### On-Demand Update Check

Use the dashboard's **Refresh Gmail suggestions** control or run:

```bash
curl -i -X POST http://127.0.0.1:8787/api/refresh/gmail
```

The response includes the current run's `freshness.lastAttemptAt`,
`lastSuccessAt`, status, and detail. When passcode protection is enabled, use
an authenticated browser session. Gmail is currently the only executable
update adapter; loading `/api/state` does not refresh external connectors. In
the UI, open **Personal → Inbox** (desktop or mobile) and use **Refresh Gmail**.
The Personal shelf is separate from Foundry primary navigation, so refreshed
email never changes portfolio, scheduling, or taskboard evidence.

For UI changes, additionally verify the affected workflow in a desktop browser
and a narrow mobile viewport. Record the viewport, visible result, and any
unverified interaction in the owning spec.

### Workbench Release Check, Approval, And Captain Handoff

Log in to a passcode-protected CIC session, open **Deployments**, and inspect the
LLM Workbench card. The server reads only the fixed public repository
`KaydenClark/LLM_Workbench`, source `integration`, and destination `main`.

The card presents fixed identity, current exact-SHA evidence, the latest durable
operation, and one state-appropriate action. A ready candidate accepts one
approval passphrase and confirms that GitHub is unchanged. The approved state
clears that value and presents a distinct Captain handoff passphrase field. The card
never accepts a repository, branch, PR, SHA, mode, command, token, URL, or
operation-history selector.

Blocked or stale candidate evidence offers refresh only. A terminally blocked
Captain result remains visible even after the promotion PR closes; a handoff can
be dispatched again only while a fresh GET still reports the operation's exact
fingerprint and the block is retryable. Verification mismatch and deadline
expiry are terminal blocks and cannot be redispatched. Rejected operations are
terminal for execution, but a still-current exact candidate may be explicitly
reapproved with a fresh approval passphrase. Approval expires after 15 minutes
and allows at most 60 seconds of future clock skew; reapproval retains prior
events and records a fresh approval event. Applied operations show their
verified merge link without another dispatch action. Handoff monitoring issues
sequential GET requests for at most 60 seconds and then hands control back to a
manual refresh. Session expiry clears both passphrases, and a throttled step-up
honors `Retry-After` without automatically resubmitting.

The underlying route is:

```text
GET /api/captain/workbench-release
```

`candidate.status` is `ready` only when exactly one pull request still matches
both current remote SHAs, its detailed GitHub state is open and non-draft,
`main` is an ancestor of `integration`, GitHub reports the PR mergeable, and
commit status context
`gptos/workbench-release-gate` is successful on that integration SHA with a
target evidence URL and Auditor summary. Its fingerprint is SHA-256 of
`repository | mainSha | integrationSha | prNumber | releaseGateStatusId`.

When no promotion PR is open, `candidate.status` is `released` only when the
GitHub comparison proves the current integration head has zero commits outside
main (`behind` or `identical`), or one exact closed-and-merged promotion PR
binds the current integration SHA to the current main merge SHA. The latter
recognizes exact squash merges such as Workbench PR #34 without weakening the
gate to any merely closed PR. This is an informational terminal state with no
approval or handoff action. Unreleased, divergent, ambiguous, or unavailable
evidence remains blocked.

Missing or malformed passcode configuration or any missing, stale, closed, draft, divergent,
ambiguous, failed, or unavailable evidence returns a blocked candidate. Every
GitHub read is aborted after 10 seconds and reports `github_timeout` rather than
leaving the request unresolved.

The approval-intent route is:

```text
POST /api/captain/workbench-release/approval
Content-Type: application/json

{"fingerprint":"<current 64-character fingerprint>","passcode":"<step-up passcode>"}
```

It requires the current CIC session, verifies the passcode with a timing-safe
digest comparison, and throttles repeated failures per session. It then reads
all fixed GitHub evidence again and records an `approved` Captain operation
only when the submitted fingerprint still matches. A fingerprint is one-time;
replay returns `candidate_already_approved`. Stale, blocked, invalid, or
unavailable evidence creates no operation.

This route accepts no repository, branch, command, or URL. It stores no
passcode and performs no GitHub mutation. The latest durable operation is
returned by the GET route for inspection.

The separately authorized Captain handoff route is:

```text
POST /api/captain/workbench-release/execution
Content-Type: application/json

{"operationId":"<approved operation ID>","passcode":"<step-up passcode>"}
```

It requires the current CIC session and a fresh timing-safe step-up passcode.
CIC atomically claims the recorded approval, re-fetches the fixed PR, current
`main` and `integration` SHAs, ancestry, mergeability, and exact-SHA
`gptos/workbench-release-gate`, then matches them to the immutable GPT_OS
manifest. CIC has no release-token setting and sends no GitHub mutation.

The fixed production paths are:

```text
manifest: /Users/kayden/GPT_OS/Scheduled/Captain/workbench-release-pr34.json
worker:   /Users/kayden/GPT_OS/tools/captain-workbench-release.mjs
spool:    /Users/kayden/GPT_OS/.local/captain-workbench-release
```

CIC writes one exact schema `1.0` request named
`<operationId>.<executionClaimId>.json` under `requests/` through a temporary
file, file `fsync`, atomic rename, and directory `fsync`. Spool directories are
`0700`; request/results are `0600`. The spool must resolve beneath the canonical
GPT_OS workspace and every ancestor below that workspace must be a real
directory, never a symlink. Requests are bounded to 64 KiB. Result import opens
only an ordinary `0600` non-symlink file with `O_NOFOLLOW`, caps it at 16 KiB,
and verifies the open descriptor still matches the inspected device, inode,
mode, and size before accepting its exact bytes. It starts only `node <fixed-worker> process
<request-path>` with `shell: false`. CIC removes the legacy Workbench credential
name and every `GH_` or `GITHUB_` environment key containing `TOKEN`, `PAT`, or
`AUTH`; `HOME` and `PATH` remain available so Captain can use the Mac Mini `gh`
Keychain session. The request contains no passcode, token, arbitrary target,
command, URL selector, or merge mode.

`GET /api/captain/workbench-release` reconciles an executing operation against
only the exact result filename and schema, operation and execution-claim IDs,
SHA-256 of the exact request bytes, and an allowlisted bounded outcome. Invalid
results move to `quarantine/` and reject the operation. Missing results reach a
bounded retryable timeout; worker spawn failure is sanitized and retryable with
a fresh claim. An applied result stays `executing` with UI state `Verifying`
when independent GitHub reads are temporarily unavailable. Startup reconciliation
and each GET reread the bound result and retry until five minutes after the
execution claim. Exact evidence mismatch or deadline expiry then becomes a
terminal visible `blocked` result; the result is not discarded. CIC records
`applied` only after independent read-only GitHub checks prove that the exact PR
is merged, current Workbench `main` is its exact merge commit, current
`integration` remains the approved head, and the merge commit has exactly two
ordered parents: approved old `main`, then approved `integration`.

An active claim returns `operation_already_executing`; an applied retry returns
the stored evidence without another dispatch. Unavailable evidence records
`blocked`; changed manifest/candidate/result evidence records terminal
`rejected`. Unexpected persistence errors return the fixed
`execution_internal_error` response without exposing raw database details.
Inspect the latest operation and append-only events; do not edit operation rows
or spool files to bypass a gate.

### Daily Project Slice Receipts

Open **Projects** to see one compact daily receipt per enrolled project. Select
a project to inspect the detailed slice, visible progress or blocker, tests,
independent audit/Combat Medic result, docs, remote recovery, source freshness,
and next slice/gate.

The receipt is derived from that project's current `TASKBOARD.md`, its stable
specs (the v3 `workbench/specs/` lane, or a legacy root `specs/` for a scope
still on v2), and latest append-only evidence row. CIC stores no receipt in
SQLite and registers no receipt write route. `missing`, `stale`, or `future`
means the project did not publish acceptable current evidence; repair the
project-owned controls and regenerate them rather than editing CIC data.

### Canonical Project Release Portfolio

`GET /api/project-deployments` reads only the **Canonical Project Repositories**
table in the generated `Projects/INDEX.md` under the GPT_OS root. With no
`CIC_RUNTIME_ROOT` override, the configured Projects root is discovered by
walking up from this checkout to the nearest ancestor holding
`Projects/INDEX.md` (`findGptOsRoot` in `server/config.js`), not assumed to be
"one directory up from wherever CIC is checked out" — that assumption broke
silently when CIC moved from `Projects/Command Information Center` to
`Foundry/Modules/Command Information Center` (S-007/TK-011) and was fixed
2026-07-20/21. An explicit `CIC_RUNTIME_ROOT` keeps the prior one-level-up
sibling convention for isolated/test deployments. For each enrolled path the
endpoint verifies that the path stays inside the configured Projects root and
is its own Git top level, then reads the current branch, dirty-file count,
`main`/`master` release ref, `Integration`/`integration` staging ref, and their
ahead/behind relationship. Git subprocesses are argument-only, bounded to one
second and 64 KiB, and run with optional locks disabled.

The endpoint performs no fetch, checkout, commit, push, merge, deployment, or
hosting-provider request. `checkedAt` is the inspection time, not the age of the
underlying refs. Refresh `Projects/INDEX.md` from the GPT_OS root when canonical
enrollment changes; refresh repository refs outside the HTTP request when newer
remote evidence is required. Missing or malformed entries degrade per card and
do not suppress healthy projects.

### Personal Intelligence Platform Health

By default CIC reads the discovered GPT_OS root's
`Foundry/Sockets/Personal Intelligence Platform/.local/platform-health.json`
(same `findGptOsRoot` discovery as the project deployment portfolio above); an
explicit `CIC_RUNTIME_ROOT` falls back to the sibling path
`../Personal Intelligence Platform/.local/platform-health.json`. Override the
report location directly with `PLATFORM_HEALTH_REPORT`; adjust the stale
threshold with `PLATFORM_HEALTH_MAX_AGE_MINUTES` (default 90). Missing,
malformed, and stale reports remain visible without crashing, and the browser
never runs the checker.

## Workbench Lifecycle, Diagnostics, And Decision Records

The project runs its own installed runtime tools from the manifest-declared
tools lane:

```bash
node workbench/tools/spec-workbench.mjs next --json
node workbench/tools/spec-workbench.mjs show S-###
node workbench/tools/spec-workbench.mjs claim S-### --agent NAME
node workbench/tools/spec-workbench.mjs close S-### --proof "..." --docs "..." --remaining-gap "..."
node workbench/tools/spec-workbench.mjs render
node workbench/tools/spec-workbench.mjs doctor
```

Selecting, claiming and closing work with these commands follows the
[`implement` skill](workbench/skills/implement/SKILL.md#work-selection-and-lifecycle).
`doctor` prints every registered finding with its severity and blocking effect;
what each finding means and blocks, including the `attention` findings that
stay visible without blocking, follows the
[`workbench-runtime` skill](workbench/skills/workbench-runtime/SKILL.md#diagnostics-and-blocking-effects),
and validating the wiki lane follows its
[Wiki Validation](workbench/skills/workbench-runtime/SKILL.md#wiki-validation) section.
Decision records live in `workbench/docs/adr/` and Destination Decision Records
in `workbench/docs/ddr/`; writing, accepting, superseding, deprecating, reading
and validating them follows the
[`to-docs` skill](workbench/skills/to-docs/SKILL.md#decision-records).

### Spec Lifecycle And Retrieval

Use this sequence for one assigned Spec and its Task records. Examples name
S-001/TK-001; substitute the actual IDs and quoted values. These are separate
role checkpoints, not one unattended script: a Worker supplies self-check,
the Dispatcher owns whole-Spec QA, a separate Director reviews the immutable
candidate, and only the owner supplies Human QA approval and main promotion.
Review and owner actions are separate responsibilities, never an unattended approval script.
Each role's procedure lives in the lane skill its subsection below points to.

#### Worker: selection, implementation and hand-back

Select, claim, implement, record receipts for, self-check, close and hand back
one Task through the procedure in the
[`implement` skill](workbench/skills/implement/SKILL.md#worker-selection-implementation-and-hand-back).

#### Dispatcher and separate Director: assembled review

Assemble a Spec candidate, review it in a separate context, record the verdict,
return failed findings and check the gate before integration through the
procedure in the
[`dispatcher` skill](workbench/skills/dispatcher/SKILL.md#dispatcher-and-separate-director-assembled-review).

#### Owner: Human QA and main-before-complete

Record the owner's actual Human QA decision and complete a Spec after main
containment through the procedure in the
[`director` skill](workbench/skills/director/SKILL.md#owner-human-qa-and-main-before-complete).

#### Documentation: feature capture, retirement and recovery

Capture feature knowledge, retire, discard and recover a completed Spec, and
recover a colliding Task identity, through the procedure in the
[`director` skill](workbench/skills/director/SKILL.md#documentation-feature-capture-retirement-and-recovery).

### Visible Identifiers

Allocate and widen the visible identifiers of Specs, Tasks, decision records
and notepads through the procedure in the
[`workbench-runtime` skill](workbench/skills/workbench-runtime/SKILL.md#visible-identifiers).

### Landmark Tracker: accepted design and available operations

The Landmark Tracker's accepted design and the operations available now are
carried by the
[`notepad` skill](workbench/skills/notepad/SKILL.md#landmark-tracker-accepted-design-and-available-operations).

### JSON Notepads

Create, resume, read, append to, trim, migrate or delete a local JSON notepad,
and allocate its visible identifier, through the procedure in the
[`notepad` skill](workbench/skills/notepad/SKILL.md#runtime-reference).

### Frozen History And Operational Recovery

Existing checkpoints stay frozen, and recovery receipts and backups live in the
ignored recovery collection; read or restore them through the procedure in the
[`checkpoint` skill](workbench/skills/checkpoint/SKILL.md#frozen-history-and-operational-recovery).

### Optional Private Session Transport

Configure, push, resume and reconcile optional private session transport
through the procedure in the
[`save` skill](workbench/skills/save/SKILL.md#optional-private-session-transport);
ordinary local notepad commands stay independent of it.

### Portable Save, Promote And Room-Local Skills

How `save` and `promote` compose is in the
[`save` skill](workbench/skills/save/SKILL.md#how-save-and-promote-compose).
Adding a room-local skill to the lane, and checking the lane it joins, follows
the [`workbench-runtime` skill](workbench/skills/workbench-runtime/SKILL.md#room-local-skills).
The core catalog rules follow.

The core machine catalog is `coreSkills` in the layout runtime; documentation
and tests derive its size from that catalog. The current candidate includes
save/promote while preserving checkpoint as a no-write compatibility notice.
The v3.1.4 eighteen-skill manifest policy remains readable as a frozen legacy
row; adding candidate source does not publish or stamp v3.2.0.

### Direct Owner Promotion

Reconcile selected supported claims into an existing durable owner with
`sessions.mjs promote` through the procedure in the
[`promote` skill](workbench/skills/promote/SKILL.md#command-reference).

### Wiki Lint

Lint is a reading job an agent performs; no command does it, and
`node workbench/tools/wiki.mjs validate` keeps
running on every change without replacing it. The obligation and its two
cadences are owned by [`AGENTS.md`](AGENTS.md#documentation-ownership-and-proof)
and [`workbench/wiki/SCHEMA.md`](workbench/wiki/SCHEMA.md#lint); this section
is the checklist, not a second statement of them.

**Small lint, at the end of every Wiki update, on the pages it touched:**

1. Run `wiki.mjs validate`. The touched pages add no finding: properties,
   collection shape, relative links and sources are the validator's, not the
   reader's.
2. Read each touched page against the pages it links to and the pages that
   link to it. It contradicts none of them.
3. Every claim still has its source. A claim checked in this operation is
   stated plainly; an inferred claim says `Inference:`; a dated one says its
   date. `last_verified` moved only for facts actually checked
   ([SCHEMA Update](workbench/wiki/SCHEMA.md#update)).
4. The router `workbench/wiki/MEMORY.md` links the page with a one-line
   summary, and the summary still says what the page now says.
5. Every identifier on the page carries the artifact's name and a little
   context. Add what is missing; never strip an identifier.
6. Each truth lives once: the page links to its owner (Spec, decision record,
   Lexicon, Runbook) instead of restating it, and copies no live task state.
7. No concept the page mentions lacks a page or a Lexicon row it should have.
8. An article in `design-concepts/` or `features/` has its `History` line for
   this operation, and a design concept's `authorized_by` names it.

Repair what the update itself can fix on the same branch. A finding not
resolved in the update becomes a corrective Task under the owning, still-open
Spec ([SCHEMA Lint](workbench/wiki/SCHEMA.md#lint)); it is not left unrecorded.

**Whole-Wiki lint, at Spec review when the Spec's work is verified:** the
agent doing the review reads every page against the current controls and the
question cards, asking the small-lint questions across the whole Wiki and
these:

- Does any page contradict `AGENTS.md`, the Lexicon, an active decision record
  or the schema?
- Is any page stale (marked `status: stale` and not repaired) or orphaned
  (not routed from the router, or with a link or source that no longer
  resolves)?
- Does every delivered capability have its article in `workbench/wiki/features/`?
- Does every router summary line still describe its page?
- Does each landmark's synthesis page still match its question cards' current
  answers?

Each finding becomes a corrective Task under the still-open Spec, following
the [assembled review and corrective return](workbench/skills/dispatcher/SKILL.md#assembled-review-and-corrective-return)
rule in `AGENTS.md`; it is not cleared by a green `validate`.

This room's specs still use the five-column execution-slice table from the
v3.1.1 adoption (`Ticket | Slice | Status | Blockers | Proof`); the
v3.2.1 tools read those rows as Tasks. New work uses Task wording.

## Evaluation And Benchmarking

Use this section to prove whether the workbench or project process is improving.
The goal is evidence, not taste.

### Handoff Transfer

Prepare a handoff for a specified receiving context and release a retaining
source through the procedure in the
[`handoff` skill](workbench/skills/handoff/SKILL.md#transfer-procedure), within
the [role boundaries](AGENTS.md#handoff-assignments-and-shared-context).

### Benchmark-Driven Improvement

Capture the available guardrail or benchmark baseline before changing agent
rules, control docs, evaluation criteria, or the working process. The procedure
follows the
[`implement` skill](workbench/skills/implement/SKILL.md#benchmark-driven-improvement).

### Harness Feedback Loop

This project's `workbench/feedback/WORKBENCH_FEEDBACK.md` is the return channel to the upstream
harness. Lessons logged there feed harness changes, which must clear the same
bar as any other "better" claim: a proposed template change is `c3_candidate`
above, tested against the current docs on the same task suite before it ships.
Feedback flows out; validated improvements flow back in as a harness upgrade
(Upgrading The Harness, above). Taste alone never closes the loop; evidence does.

### Harness Verification

Check the v3.2.1 control surface, support root, and retired-plan absence:

```bash
for file in AGENTS.md BLUEPRINT.md LEXICON.md CLAUDE.md README.md RUNBOOK.md TASKBOARD.md \
            workbench/manifest.json workbench/tools/spec-workbench.mjs \
            workbench/tools/notepads.mjs workbench/skills/.workbench-skills.json \
            workbench/wiki/MEMORY.md workbench/feedback/WORKBENCH_FEEDBACK.md; do
  test -f "$file" || exit 1
done
test ! -e specs
test ! -e MEMORY.md
test ! -e HARNESS_FEEDBACK.md
test ! -e ROADMAP.md
test ! -e GAMEPLAN.md
test ! -e GAME_PLAN.md
node "$LLM_WORKBENCH_ROOT/tools/workbench-tools.mjs" verify --project "$PWD"
node "$LLM_WORKBENCH_ROOT/tools/workbench-skills.mjs" verify --project "$PWD"
! rg -n '\[(PROJECT|ABSOLUTE|HARNESS|YYYY)[^]]*\]' \
  AGENTS.md BLUEPRINT.md CLAUDE.md README.md RUNBOOK.md TASKBOARD.md
```

When the canonical Workbench checkout is available, set its path and run the
static evaluator:

```bash
node "$LLM_WORKBENCH_ROOT/tools/evaluate-workbench.mjs" \
  --path "$PWD" --include-controls
```

The project should score above both evaluator controls and report no missing
high-value contract.

### Test Coverage Policy

Treat tests as executable specifications:

- add a failing regression test before a behavior fix when practical;
- keep boundary, validation, failure, and degraded-state assertions explicit;
- do not convert an unimplemented `test.todo` into a passing test without
  implementing and exercising the behavior;
- use browser smoke checks for layout and end-to-end interactions the Node suite
  cannot prove.

## Data Operations

The server creates its local SQLite database automatically. The synthetic feed
can be reset safely with:

```bash
cp data.example.js data.js
```

Do not delete, reset, or migrate a real SQLite database without an explicit
backup and owner approval. Supabase schema work must use a reviewed migration
under `supabase/migrations/` and requires a task-specific verification plan.

## Version-Control Procedures

Branching, pull requests, merge, containment proof and cleanup follow the
[`implement` skill](workbench/skills/implement/SKILL.md#version-control-procedures)
and its [branch completion](workbench/skills/implement/SKILL.md#branch-completion)
procedure; this section keeps this room's commands for them.

Git authority and policy live in `AGENTS.md` -> Git Rules. Keep executable
commands and expected results here:

- Release branch: `main`.
- Staging branch: `Integration`.
- Start task branches from current `Integration`:
```bash
git fetch origin
git switch Integration
git pull --ff-only origin Integration
git switch -c type/short-description
```

- Open normal task pull requests into `Integration`.
- Do not commit routine task work directly to `Integration` or `main`.
- Only the owner promotes `Integration` into `main`.
- Never force-push shared branches without explicit approval.
- Before committing, inspect `git status --short --branch`, stage explicit
  files, and verify no `.env`, `data.js`, database, log, credential, or build
  output is included.

Closeout, once the Task's merge answers are validated or the Spec candidate's
Verify review has passed. A pushed branch is
recoverable, not delivered; finish the merge and clean up after yourself:
```bash
(
set -eu
gh pr merge PR_NUMBER --merge --match-head-commit HEAD_SHA
git fetch origin
git merge-base --is-ancestor HEAD_SHA origin/Integration
)
```

After successful verification, if cleanup is authorized:

```bash
git branch -d type/short-description
git push origin --delete type/short-description
git worktree prune
```

Expected result: `Integration` contains the work; the merged branch is
deleted locally and remotely; unmerged work is never force-deleted.

### Local-Only Files

The primary checkout keeps a small number of local-only files that are
deliberately excluded from this public repository via that checkout's local
`.git/info/exclude` (not the committed `.gitignore`). Because that exclude
file lives inside one checkout's `.git/` directory, it is never cloned,
fetched, or copied by `git worktree add` — a fresh clone, a teammate's
checkout, or any registered worktree will never see these files or any trace
of them in `git log`/`git ls-files`. If a file referenced elsewhere looks
"missing" in your checkout, that may be why: do not recreate it, add it to
`.gitignore`, or try to track it. This RUNBOOK deliberately does not enumerate
which files or what they contain, since that detail is exactly what the
exclusion is meant to keep out of the public repo.

## Upgrading The Harness

This room runs LLM Workbench v3.2.1. `workbench/manifest.json` is the single
support-path authority and `workbench/tools/.workbench-tools.json` records the
exact release, commit, and file hashes the managed runtime tools came from.

Confirm the installed tools still match their receipt:

```bash
node "$LLM_WORKBENCH_ROOT/tools/workbench-tools.mjs" verify --project "$PWD"
```

To upgrade, from a clean LLM Workbench release checkout (`$LLM_WORKBENCH_ROOT`):

1. Check the release's changelog for what changed since the stamped version.
2. Add any missing layout lanes and collections with
   `node "$LLM_WORKBENCH_ROOT/workbench/tools/workbench-layout.mjs" migrate --project "$PWD" --version vX.Y.Z`
   (rerun until it reports `current`). Never rerun Adoption for this room.
3. Update managed runtime tools only with
   `node "$LLM_WORKBENCH_ROOT/tools/workbench-tools.mjs" update --project "$PWD" --home "$HOME" --explicit-update`
   and the managed core skills only with
   `node "$LLM_WORKBENCH_ROOT/tools/workbench-skills.mjs" update --project "$PWD" --home "$HOME" --explicit-update`;
   keep each receipt and backup as that component's recovery point.
4. Re-copy only the changed template sections; keep CIC's filled-in specifics.
   Never let bracketed placeholders leak back into filled docs, and land a
   changed operations index only after step 3 so every row points to a skill
   this room's lane holds. The control fidelity report
   (`node "$LLM_WORKBENCH_ROOT/tools/control-fidelity.mjs" report --project "$PWD"`)
   labels the template's changes apart from this room's own.
5. Update each doc's version stamp and the manifest `workbenchVersion`. Do not
   rewrite the manifest's historical adoption source (`provenance.source`) to
   impersonate the newly installed generation; the tools and skills receipts and
   `provenance.layout.source` record the current one.
6. Re-run the full verification suite, harvest friction into
   `workbench/feedback/WORKBENCH_FEEDBACK.md`, record the upgrade in its owning
   spec and publish through a task branch into `Integration`.

An update of the canonical Workbench itself also requires a separate
Workbench self-drift check before and after the change. Inspect the source
controls, Specs and projections, manifest, ADR/Wiki routes, procedures,
templates, managed artifacts and readable continuity metadata for stale
current-facing statuses, blockers, versions, paths and owners. A target-project
drift report, render, doctor or passing tests do not replace this check. In the
source Workbench, run `node workbench/tools/self-drift.mjs --phase pre --json`
and `--phase post --json` around the change, then record the bounded semantic
check. Machine output alone does not certify freshness; do not call the source
update clean while known current-facing
drift remains. Preserve explicitly bounded historical evidence.

The runtime tools in `workbench/tools/` are Workbench-managed: their receipt
(`.workbench-tools.json`) records the exact source release, commit, and file
hashes. Verify them with `node /PATH/TO/LLM_WORKBENCH/tools/workbench-tools.mjs verify --project .`
and replace them only through `update --explicit-update`, which backs up the
previous files and records a rollback path. Never hand-edit a managed tool.

This project's own `node workbench/tools/spec-workbench.mjs doctor` runs the
same receipt hash check from the tools this project carries, so a hand-edited
managed tool fails the check here with no release checkout present. It fails at
the `all` effect, which also makes `next` and `claim` refuse until the runtime
is repaired. The check runs only when `workbench/tools/` carries a receipt; a
receipt that cannot be read, records no file hashes, names a file outside that
lane, or does not account for every managed tool is reported as
`tools-receipt-missing` rather than switching the check off. That last one
matters because the drift report names the file it found: deleting that key
would otherwise switch the check off for exactly the hand-edited tool. The
authoritative list of what is managed ships inside the installed tools
themselves, so a receipt is checked against that list and not against whatever
the lane happens to hold - a managed tool deleted along with its key is still
named. Dotted entries are skipped.

The two coverage conditions have different repairs. A managed tool the receipt
does not account for is refreshed with `update --explicit-update` from the
release checkout, which rewrites the lost key and restores a deleted managed
file. A file the managed runtime does not include has to be moved out of the
lane instead: `update` cannot adopt it and reports `current`, and `install`
refuses a lane that already carries a receipt.

Without a release checkout `doctor` cannot say whether the receipt went stale
or the bytes were changed - it reports every drifted file as
`source-unavailable` - so run `verify` from the release checkout to classify
it. A deleted receipt is the readiness gate's finding, not this check's. A
deleted managed tool that another managed tool imports stops `doctor` from
loading at all, so what appears is a loader stack trace rather than a finding.

The source checkout must have a concrete `origin` and 40-character `HEAD`, and
its managed source lane must be clean; otherwise install/update refuses before
creating a receipt or backup.

Managed-tool updates and rollbacks reject symlinked lane ancestors, linked or
nonregular managed files, and unsafe backup entries before copying or creating
backups. Resolve the path collision while preserving its target, then retry the
explicit operation. Ordinary drift in a regular managed file still receives a
backup and can be restored.

Layout initialization and schema migration preserve existing session ignore
rules and reject linked destination paths before writes. ADR creation, register
rendering and direct owner promotion also reject unsafe destination chains and
use private temporary files; direct promotion refuses a `--from` source
outside the repository root, or one reached through a symbolic link, with
`invalid-note` and writes nothing. Legacy Wiki adoption moves existing
knowledge before seeding only the missing contract files.

Treat a harness upgrade like any other change: smallest correct diff, verified,
with proof. If a downstream lesson should flow *back* to the harness, capture it
per the project's `WORKBENCH_FEEDBACK` convention.

## Future Lighthouse And Flight Rack Acceptance

These surfaces are planned, not installed. Do not run this as a release
procedure until the private adopting instance activates exact child Job Orders.

1. Close S-027/TK-007 source, private install/restart, and authenticated
   desktop/mobile acceptance as separate orders.
2. For each public source slice, prove adapter/schema privacy and degraded
   states, run the full Node/build/browser gate, obtain independent exact-SHA
   PASS, and non-force land/read back only public `Integration`.
3. Install only the exact reviewed artifact with a recorded rollback SHA;
   compare producer, installed, and runtime digests and verify the service cwd,
   port, and auth-required boundary without recording credentials.
4. In an authenticated session, prove desktop and 375x812 mobile behavior,
   source/freshness, all required degraded states, no overflow, and no console
   errors. Keep screenshots and private feed evidence outside this public repo.
5. Lighthouse acceptance precedes Flight Rack implementation. Final acceptance
   must follow one genuine seven-stage Job Order and distinguish delivery from
   closure; HTTP 200 alone is never acceptance.

## Manual Harness Feedback Reports

Run this workflow after a setup-only Round One check succeeds. It assesses the
assigned target; it never authorizes a repair or invokes automated repair.

1. Resolve `lanes.feedback`, `lanes.specs` and the relevant collections through
   `workbench/manifest.json`. Pin the target revision and the assigned question.
2. Inspect only relevant controls, source and named proof. Test consequential
   claims, distinguish observation from inference, and disclose evidence limits.
3. Write `REPORT-topic-date.md` in the declared feedback lane using its
   `REPORT_FORMAT.md`. Include Target And Scope, Evidence And Limitations,
   Findings, Challenged Or Rejected Findings, Next Action And Open Questions,
   and Review Boundary. Every finding requires exactly one Lexicon disposition,
   recorded in its owning Spec with an evidence route; missing ownership stays
   an explicit gap. No findings is valid. Reports never live loose or in
   the Wiki. If the format is absent in an older installation, these sections
   are sufficient; explicit upgrades may copy it from the source templates.
4. Put accepted follow-up work in its existing linked spec; proposed repairs
   remain pending owner authorization. A report is not a work assignment.
5. At a meaningful continuation boundary, a fresh session should find the report,
   its linked spec, and the next executable action or owner gate using repository
   state only. No universal handoff or new self-created task is required.
6. At the Spec's Verify step, the assembled candidate's separate-context review
   challenges the report's consequential claims and recommendations along with
   the change.

## Troubleshooting

| Symptom | Likely cause | Check | Fix |
|---|---|---|---|
| `node:sqlite` import fails | Node is older than 22 | `node --version` | Install/use Node 22+ and rerun `npm ci` |
| Dashboard shows degraded feed | `data.js` missing or invalid | confirm `data.js` exists; check server response detail | copy `data.example.js` or repair the configured summarized feed |
| API returns `401` | passcode gate is configured without a valid session | `GET /api/auth/status` | log in through the UI or correct local `.env` |
| Workbench release card is blocked | Passcode is missing/malformed, GitHub is unavailable or timed out, unreleased work has no exact open PR, the detailed PR is draft/moved, branches diverged, or exact-SHA Auditor evidence is absent/failed | inspect `candidate.reason.code` from `GET /api/captain/workbench-release` in an authenticated session | repair the named source condition; a completed promotion should report `released`, never infer it manually |
| Project release portfolio is empty or unavailable | `Projects/INDEX.md` is missing, malformed, oversized, or has no canonical entries | run the GPT_OS project-index generator and inspect `GET /api/project-deployments` | repair the root routing index; do not fall back to raw folder scanning |
| Workbench approval returns `401`, `409`, or `429` | Step-up passcode failed, candidate changed/was already approved, or bounded throttle is active | inspect the response `code`; refresh the GET candidate after `candidate_stale`, and honor `Retry-After` after `step_up_throttled` | never retry with alternate repository/branch/command fields; repair the named gate or wait for the throttle window |
| Workbench Captain handoff returns `409`, `429`, or `503` | The operation is active/rejected, step-up is throttled, current evidence drifted, or the fixed manifest/worker/spool is unavailable | inspect `code`, the latest durable operation, and secret-free spool filenames; `Verifying` means startup/GET reconciliation is retrying an applied result until its bounded deadline; terminal `blocked` records mismatch or expiry | never edit operation identity or spool content; refresh during verification, repair a retryable fixed dependency, or approve a new exact candidate when current evidence permits |
| Intelligence is partial | OpenAI/OpenBrain variables are absent or backend is unavailable | `GET /api/intelligence/sources` | configure the optional service or accept deterministic demo mode |
| Spotify cannot control playback | OAuth, refresh token, or active device is missing | `GET /api/spotify/player` | complete local OAuth and activate a Spotify device |
| Spotify OAuth returns `401` | CIC has a passcode configured and the browser has no current app session | `GET /api/auth/status` | log in to CIC, then restart the Spotify connection flow |
| Vite client is not served by Express | production build is missing | `test -f dist/index.html` | run `npm run build` before `npm start` |

## Recovery And Rollback

Recover from a failed change through the procedure in the
[`implement` skill](workbench/skills/implement/SKILL.md#recovery-and-rollback).

Do not delete data, reset databases, rewrite history, or rotate secrets unless
the user explicitly approves that action.

If a task fails:

1. Identify the exact changed files and failing check.
2. Revert only the smallest task-owned change while preserving unrelated work.
3. Rerun the targeted failure, then full verification.
4. Update the taskboard with the result and remaining gap.

Do not reset databases, delete runtime files, rewrite published Git history, or
rotate credentials without explicit owner approval.

## Operational Proof

If a command changed durable project state, append evidence to the owning spec.
For routine read-only runs, a final response note is enough.

## Evidence And Continuation Practices

Sizing a Task follows the
[`to-tasks` skill](workbench/skills/to-tasks/SKILL.md#sizing-a-task).

Continuing after a save or a handoff follows the
[`notepad` skill](workbench/skills/notepad/SKILL.md#continuing-after-a-save-or-handoff),
and partitioning an evidence record follows the
[`save` skill](workbench/skills/save/SKILL.md#evidence-partitioning).

How the claim-age diagnostic counts a claim's age follows the
[`workbench-runtime` skill](workbench/skills/workbench-runtime/SKILL.md#diagnostics-and-blocking-effects).

Amending an existing decision record before adding a new one follows the
[`to-docs` skill](workbench/skills/to-docs/SKILL.md#decision-records).

Keep setup human-readable and staged through the documented Genesis, adoption
and explicit-upgrade routes. Verify every consumed source lane before mutation,
then installed behavior in the actual room. Project-owned schemas/templates and
promoted Wiki knowledge travel in project Git; optional private session transport
handles live working context separately. A clean upstream test is not downstream
acceptance. Recheck actual destination refs and preserve unknown remote state.

### Workbench connection identity

Assign, read and compare the room's `workbenchId` through the procedure in the
[`workbench-runtime` skill](workbench/skills/workbench-runtime/SKILL.md#workbench-connection-identity).

### Configured-host capability checks

Check what a configured host can actually do (writable lanes, native skill
discovery and invocation, managed-tool execution) through the procedure in the
[`workbench-runtime` skill](workbench/skills/workbench-runtime/SKILL.md#configured-host-capability-checks).

## Independent Review Boundaries

Verify review of an assembled Spec, main-readiness review and incident-claim evidence
follow the
[`code-review` skill](workbench/skills/code-review/SKILL.md#independent-review-boundaries).
