# Command Information Center - Runbook

> Generated from LLM Workbench v2.1. See Upgrading The Harness below.

**Last reviewed:** 2026-07-06  
**Runtime owner:** Kayden  
**Environment:** private local / same-WiFi LAN

This file explains how to operate, verify, recover, and upgrade Command Information Center.

## Prerequisites

Required tools:

- Node.js with support for `node:sqlite`.
- npm.
- A normal macOS user shell for LaunchAgent installation/restart work.

Required accounts/services for full functionality:

- OpenAI API key for server-side Intelligence synthesis.
- Supabase/OpenBrain credentials or `query-wiki` access for memory retrieval.
- Spotify developer app credentials for playback controls.
- Connected connector sources when refreshing `data.js`.

Required local files:

- `.env` - ignored local runtime config and secrets.
- `data.js` - summarized dashboard feed.
- `data/cic.sqlite` - ignored runtime SQLite database, created automatically.

## Environment Configuration

Create local config from the example when needed:

```bash
cp .env.example .env
```

Required or optional variables:

| Variable | Purpose | Secret? | Example / Notes |
|---|---|---|---|
| `HOST` | Bind host for `npm start` | no | `::` or `0.0.0.0` for LAN-local access |
| `PORT` | Express port | no | defaults to `8787` |
| `CIC_PASSCODE` / `CIC_PASSCODE_HASH` | Local app passcode | yes | hash preferred when storing long-term |
| `CIC_DB` | SQLite path | no | defaults to `data/cic.sqlite` |
| `CIC_DATA_FEED` | Feed path | no | defaults to `data.js` |
| `GMAIL_REFRESH_COMMAND` | Optional local summarized Gmail refresh command | no/yes depending on command | empty means use current feed only |
| `OPENAI_API_KEY` | Server-side Intelligence synthesis | yes | never expose to browser |
| `OPENAI_MODEL` | OpenAI model for Intelligence | no | README currently documents `gpt-5.4-mini` |
| `OPENAI_REASONING_EFFORT` | OpenAI reasoning setting | no | README currently documents `low` |
| `OPENAI_EMBEDDING_MODEL` | Embedding model aligned to OpenBrain | no | `text-embedding-3-small` |
| `SUPABASE_URL` | OpenBrain/Supabase URL | no | project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase key | yes | never expose to browser |
| `QUERY_WIKI_URL` | OpenBrain query endpoint | no | optional route |
| `QUERY_WIKI_ACCESS_TOKEN` | OpenBrain query token | yes | server-side only |
| `ATLAS_URL` | Spotify Atlas link target | no | empty derives from current host on port `8899` |
| `SPOTIFY_CLIENT_ID` | Spotify OAuth client id | no | local developer app |
| `SPOTIFY_CLIENT_SECRET` | Spotify OAuth client secret | yes | server-side only |
| `SPOTIFY_REDIRECT_URI` | Spotify callback | no | `http://127.0.0.1:8787/auth/spotify/callback` |
| `SPOTIFY_REFRESH_TOKEN` | Spotify refresh token | yes | written to `.env` after OAuth |

Rules:

- Do not commit real `.env` files, tokens, local databases, logs, or private data.
- Keep secrets server-side or local-only.
- Prefer degraded states over fake data when an external source is unavailable.

## Install

```bash
npm install
```

Expected result:

- Dependencies install without modifying committed secrets or runtime data.

## Run Locally

```bash
npm start
```

Open:

- `http://localhost:8787`
- `http://<mac-local-hostname>.local:8787` or `http://<mac-lan-ip>:8787` from same-WiFi devices when host/firewall allow it.

Expected result:

- The Express server serves `/api/*` JSON routes and the built React app from `dist/` after `npm run build`.

## Test And Build

Fast check:

```bash
npm test
```

Full verification:

```bash
npm test
npm run build
npm audit --omit=dev
```

Expected result:

- Tests pass.
- Vite build completes.
- Production dependency audit has no unresolved vulnerabilities or records accepted risk.

For UI changes, also verify desktop and mobile rendering in a browser. For behavior changes, prefer red/green TDD: write or update the failing test first, confirm the expected failure, then implement the smallest fix.

### Feed Schema Check

After a routine refresh rewrites `data.js`, run:

```bash
node -e "global.window={};require('/Users/kayden/GPT_OS/Projects/Command Information Center/data.js');const d=window.CIC_DATA;for (const k of ['meta','sources','briefing','gmail','calendar','github','vercel','drive','money','spotify','projects','wiki','ifttt']) if (!(k in d)) throw new Error('missing '+k)"
```

Expected result:

- The command exits cleanly without missing top-level keys.

### API Checks

When touching API or auth behavior, check:

```bash
curl -i http://127.0.0.1:8787/api/auth/status
curl -i http://127.0.0.1:8787/api/state
```

Expected result:

- Auth status returns JSON.
- `/api/state` returns JSON when authenticated or a JSON passcode error when protected.
- Unknown `/api/*` routes return JSON `404`, not `dist/index.html`.

## Data Operations

Routine connector refreshes:

- Rewrite only `data.js`.
- Preserve the top-level `window.CIC_DATA` keys documented in `refresh-skill/SKILL.md`.
- Mark unavailable sources as `offline` or `auth_required`.
- Keep the UI renderable with empty arrays/null notes where needed.
- Do not claim live connector values unless they came from a current connector call or local source read.

SQLite:

- Runtime DB defaults to `data/cic.sqlite`.
- Tables are created by `server/db.js` on app startup.
- Do not commit SQLite files, WAL files, or local backups.

Backup/restore:

```bash
cp data/cic.sqlite data/cic.sqlite.backup
```

Run backups only from the local machine and keep them ignored/private.

## Spotify Operations

Configure `.env`:

```bash
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8787/auth/spotify/callback
```

Start OAuth:

```text
http://127.0.0.1:8787/auth/spotify/login
```

Expected result:

- Spotify consent redirects back to `/auth/spotify/callback`.
- `SPOTIFY_REFRESH_TOKEN` is written to ignored `.env`.
- Playback state/control endpoints degrade honestly when no active device or authorization exists.

## Intelligence Operations

For full server-side synthesis, configure OpenAI plus OpenBrain/Supabase credentials in ignored `.env`.

Checks:

- Missing credentials should return deterministic partial states, not fake AI output.
- `/api/intelligence/ask` should reject empty or oversized questions.
- Valid assistant answers should include source references when synthesis succeeds.
- Built client assets must not contain OpenAI keys, Supabase service-role keys, or OpenBrain tokens.

## Deployment Or Startup

LaunchAgent template:

- `launchd/com.kayden.cic.plist`

Install from the Mac user's normal shell:

```bash
cp "/Users/kayden/GPT_OS/Projects/Command Information Center/launchd/com.kayden.cic.plist" "$HOME/Library/LaunchAgents/"
launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.kayden.cic.plist"
launchctl kickstart -k "gui/$(id -u)/com.kayden.cic"
```

Restart:

```bash
launchctl kickstart -k "gui/$(id -u)/com.kayden.cic"
```

Logs:

```bash
tail -n 100 logs/*.log
```

Expected healthy state:

- The service runs from `/Users/kayden/GPT_OS/Projects/Command Information Center`.
- The app is reachable on port `8787`.
- Logs stay under ignored `logs/`.

## Version Control

- Default branch in this checkout is currently `main`.
- Run `git status --short --branch` before editing and before handoff.
- Keep changes scoped; do not revert unrelated user or agent work.
- Never commit `.env`, SQLite files, logs, OAuth tokens, client secrets, build output, or generated runtime data.
- If asked to publish, create a task branch with the `codex/` prefix unless Kayden requests another branch name.
- Do not rewrite published history or force-push shared branches unless Kayden explicitly approves.

## Upgrading The Harness

These control docs were generated from LLM Workbench v2.1, recorded in the stamp at the top of each doc.

To upgrade:

1. Fetch the current `KaydenClark/LLM_Workbench` source.
2. Compare `templates/AGENTS.md`, `templates/BLUEPRINT.md`, `templates/TASKBOARD.md`, and `templates/RUNBOOK.md` against the filled CIC docs.
3. Re-copy only changed template sections; keep CIC's filled-in specifics.
4. Do not reintroduce `ROADMAP.md`, `GAMEPLAN.md`, or bracketed template placeholders unless the upstream harness explicitly changes direction and Kayden approves the naming change.
5. Update each doc's version stamp if the upstream harness version changed.
6. Run the full verification suite and record the upgrade in `TASKBOARD.md` Proof Log.

## Troubleshooting

| Symptom | Likely cause | Check | Fix |
|---|---|---|---|
| LAN URL fails but localhost works | Host binding, firewall, or IPv6 `.local` resolution | `HOST`, LaunchAgent env, `lsof -i :8787` | Bind to `::` or `0.0.0.0` and restart LaunchAgent |
| API returns HTML parser errors | Unknown `/api/*` route fell through to app shell | `curl -i /api/missing` | Keep JSON 404 handler before static fallback |
| Intelligence shows partial state | Missing OpenAI/OpenBrain/Supabase credentials or source outage | `/api/intelligence/sources`, `.env` | Add credentials or keep degraded state visible |
| Spotify controls disabled | Missing OAuth, expired token, or no active device | `/api/spotify/player` | Re-run OAuth or start Spotify on a device |
| Privacy blur misses sensitive text | New UI surface bypassed `privacyClass` / money markers | Browser privacy mode and tests | Route text through `src/privacy.js` or add `money: true` / `money-val` |
| Refresh breaks panels | `data.js` schema keys missing | feed schema check above | Restore required top-level keys and mark source degraded |

## Recovery And Rollback

If a change fails:

1. Identify the touched files and failing command.
2. Preserve unrelated user work.
3. Revert or amend only the smallest change needed.
4. Rerun the failing verification command.
5. Update `TASKBOARD.md` with the result and remaining gap.
