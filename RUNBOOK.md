# Command Information Center - Runbook

> Generated from LLM Workbench v2.3. See Upgrading The Harness below.

**Last reviewed:** 2026-07-15
**Runtime owner:** repository owner / local operator
**Environment:** credential-free demo or private local/LAN runtime

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
| `HOST`, `PORT`, `CIC_DB`, `CIC_DATA_FEED` | Local server and storage paths | no |
| `CIC_PASSCODE`, `CIC_PASSCODE_HASH` | Optional local app gate; required for Workbench release-candidate reads | yes |
| `OPENAI_*` | Synthesis and embedding configuration | API key is secret |
| `SUPABASE_*`, `QUERY_WIKI_*`, `OPENBRAIN_*` | Retrieval backend | service/token values are secret |
| `SPOTIFY_*`, `ATLAS_URL` | Playback authorization and Atlas link | client secret/tokens are secret |
| `GMAIL_REFRESH_*` | Summarized Gmail suggestion refresh | command/path may be machine-sensitive |

Use `.env.example` for the complete variable list and `CONTRACT.md` for the
OpenBrain-compatible backend interface.

`GMAIL_REFRESH_COMMAND` is parsed into an executable and arguments without a
shell. Quote paths or arguments containing spaces, for example:

```bash
GMAIL_REFRESH_COMMAND='"/Users/me/Tools/Gmail Refresh" --mode "current inbox"'
```

Unmatched quotes fail the refresh explicitly; commands are terminated after
120 seconds and non-zero exits are recorded as degraded refresh runs.

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
node tools/spec-workbench.mjs doctor
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

### On-Demand Update Check

Use the dashboard's **Refresh Gmail suggestions** control or run:

```bash
curl -i -X POST http://127.0.0.1:8787/api/refresh/gmail
```

The response includes the current run's `freshness.lastAttemptAt`,
`lastSuccessAt`, status, and detail. When passcode protection is enabled, use
an authenticated browser session. Gmail is currently the only executable
update adapter; loading `/api/state` does not refresh external connectors.

For UI changes, additionally verify the affected workflow in a desktop browser
and a narrow mobile viewport. Record the viewport, visible result, and any
unverified interaction in the owning spec.

### Read-Only Workbench Release Check

Log in to a passcode-protected CIC session, open **Deployments**, and inspect the
LLM Workbench card. The server reads only the fixed public repository
`KaydenClark/LLM_Workbench`, source `integration`, and destination `main`.

The underlying route is:

```text
GET /api/captain/workbench-release
```

`candidate.status` is `ready` only when exactly one open pull request still
matches both current remote SHAs, `main` is an ancestor of `integration`, GitHub
reports the PR mergeable, and commit status context
`gptos/workbench-release-gate` is successful on that integration SHA with a
target evidence URL and Auditor summary. Its fingerprint is SHA-256 of
`repository | mainSha | integrationSha | prNumber | releaseGateStatusId`.

Missing passcode configuration or any missing, stale, divergent, ambiguous, or
failed evidence returns a blocked candidate. TK-001 is read-only:
`latestOperation` is `null`, there is no approval route, and CIC performs no
GitHub mutation.

## Spec Lifecycle

```bash
node tools/spec-workbench.mjs doctor
node tools/spec-workbench.mjs next --json
node tools/spec-workbench.mjs show S-###
node tools/spec-workbench.mjs claim S-### --agent "Agent Name"
node tools/spec-workbench.mjs render
```

Close tickets and complete specs with the tool's required proof and documentation
arguments. `TASKBOARD.md` is generated; durable requirements and evidence belong
in the stable spec.

### Personal Intelligence Platform Health

By default CIC reads the sibling platform report at
`../Personal Intelligence Platform/.local/platform-health.json`. Override it
with `PLATFORM_HEALTH_REPORT`; adjust the stale threshold with
`PLATFORM_HEALTH_MAX_AGE_MINUTES` (default 90). Missing, malformed, and stale
reports remain visible without crashing, and the browser never runs the checker.

### Harness Verification

Check the v2.3 control surface and retired-plan absence:

```bash
for file in AGENTS.md BLUEPRINT.md LEXICON.md CLAUDE.md README.md RUNBOOK.md TASKBOARD.md HARNESS_FEEDBACK.md tools/spec-workbench.mjs; do
  test -f "$file" || exit 1
done
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

## Upgrading The Harness

The control files are stamped with their Workbench version. To upgrade:

1. Compare against the canonical current Workbench templates.
2. Port only changed reusable contracts; preserve filled CIC-specific facts.
3. Do not reintroduce bracketed placeholders or a combined roadmap/gameplan.
4. Update all version stamps together.
5. Run the full project and harness verification suites.
6. Append one proof row to `TASKBOARD.md` and publish through a task branch into
   `Integration`.

## Troubleshooting

| Symptom | Likely cause | Check | Fix |
|---|---|---|---|
| `node:sqlite` import fails | Node is older than 22 | `node --version` | Install/use Node 22+ and rerun `npm ci` |
| Dashboard shows degraded feed | `data.js` missing or invalid | confirm `data.js` exists; check server response detail | copy `data.example.js` or repair the configured summarized feed |
| API returns `401` | passcode gate is configured without a valid session | `GET /api/auth/status` | log in through the UI or correct local `.env` |
| Workbench release card is blocked | Passcode is not configured, GitHub is unavailable, PR/branch state moved, branches diverged, or exact-SHA Auditor evidence is absent/failed | inspect `candidate.reason.code` from `GET /api/captain/workbench-release` in an authenticated session | repair the named source condition; do not bypass or infer readiness |
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
