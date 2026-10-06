# Command Information Center - Runbook

> Generated from LLM Workbench v3.1.1. See Upgrading The Harness below.

**Last reviewed:** 2026-09-04
**Runtime owner:** repository owner / local operator
**Environment:** credential-free demo or authenticated private runtime

This file explains how to install, run, verify, recover, and safely publish
Command Information Center.

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

Fast check:

```bash
npm test
```

Full verification:

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

## Spec Lifecycle

```bash
node workbench/tools/spec-workbench.mjs doctor
node workbench/tools/spec-workbench.mjs next --json
node workbench/tools/spec-workbench.mjs show S-###
node workbench/tools/spec-workbench.mjs claim S-### --agent "Agent Name"
node workbench/tools/spec-workbench.mjs render
```

Close tickets and complete specs with the tool's required proof and documentation
arguments. `TASKBOARD.md` is generated; durable requirements and evidence belong
in the stable spec at `workbench/specs/S-###-slug/SPEC.md`. Spec paths are stable
once declared; never move one between status folders.

Ticket tables use the five-column v3.1.1 contract
(`Ticket | Slice | Status | Blockers | Proof`). The eight-column FUID lifecycle
schema was retired from this room's specs at the v3.1.1 adoption.

### Session Records And Checkpoints

Live grilling notepads and handoffs stay untracked under
`workbench/sessions/grilling/` and `workbench/sessions/handoffs/`. Promote a
record into durable evidence only through the privacy-checked seam:

```bash
node workbench/tools/sessions.mjs checkpoint --from PATH --topic slug
```

The promotion stops and writes nothing if it hits secret-like content, an
absolute home path, or an email address.

### Decision Records

```bash
node workbench/tools/adr.mjs new --title "TITLE" --canonicalized-in AGENTS.md
node workbench/tools/adr.mjs render
```

An ADR owns rationale; its rule binds only where `canonicalized_in` points.

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

### Harness Verification

Check the v3.1.1 control surface, support root, and retired-plan absence:

```bash
for file in AGENTS.md BLUEPRINT.md LEXICON.md CLAUDE.md README.md RUNBOOK.md TASKBOARD.md \
            workbench/manifest.json workbench/tools/spec-workbench.mjs \
            workbench/wiki/MEMORY.md workbench/feedback/WORKBENCH_FEEDBACK.md; do
  test -f "$file" || exit 1
done
test ! -e specs
test ! -e MEMORY.md
test ! -e HARNESS_FEEDBACK.md
test ! -e ROADMAP.md
test ! -e GAMEPLAN.md
test ! -e GAME_PLAN.md
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

## Version Control

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

This room runs LLM Workbench v3.1.1. `workbench/manifest.json` is the single
support-path authority and `workbench/tools/.workbench-tools.json` records the
exact release, commit, and file hashes the managed runtime tools came from.

Confirm the installed tools still match their receipt:

```bash
node "$LLM_WORKBENCH_ROOT/tools/workbench-tools.mjs" verify --project "$PWD"
```

An explicit upgrade to a later release runs from the Workbench checkout against
a clean, committed tree:

```bash
node "$LLM_WORKBENCH_ROOT/tools/workbench-upgrade.mjs" upgrade \
  --project "$PWD" --home "$HOME" --version vX.Y.Z --explicit-update
```

Then:

1. Compare the root controls against the release templates.
2. Port only changed reusable contracts; preserve filled CIC-specific facts.
3. Do not reintroduce bracketed placeholders or a combined roadmap/gameplan.
4. Update all version stamps together.
5. Run the full project and harness verification suites.
6. Record the proof in the owning spec and publish through a task branch into
   `Integration`.

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

If a task fails:

1. Identify the exact changed files and failing check.
2. Revert only the smallest task-owned change while preserving unrelated work.
3. Rerun the targeted failure, then full verification.
4. Update the taskboard with the result and remaining gap.

Do not reset databases, delete runtime files, rewrite published Git history, or
rotate credentials without explicit owner approval.
