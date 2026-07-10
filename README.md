---
type: project-readme
status: active
source_paths:
  - /Users/kayden/GPT_OS/Projects/Command Information Center
last_reviewed: 2026-06-13
---

# Command Information Center

Command Information Center is Kayden's private local GPT_OS web app. It runs on the Mac Mini, stores local task state in SQLite, reads the summarized `data.js` dashboard feed, and serves the React UI plus `/api/*` from one Express process.

## Entry Points

- Web app: `http://localhost:8787`
- LAN pattern: `http://<mac-local-hostname>.local:8787` or `http://<mac-lan-ip>:8787`
- React app: `src/`
- Backend API: `server/`
- SQLite database: `data/cic.sqlite`
- Local config: `.env` (ignored)
- Static fallback archive: `archive/static-v0/`
- Design concepts: `design/`
- Screenshots: `screenshots/`
- Refresh contract: `refresh-skill/SKILL.md`
- Project blueprint: `BLUEPRINT.md`
- Live taskboard/proof log: `TASKBOARD.md`
- Operations runbook: `RUNBOOK.md`

## Commands

```bash
npm install
npm run build
npm start
npm test
```

`npm start` binds to `:::8787` by default so same-WiFi devices can reach it over both IPv4 and IPv6 after macOS firewall/network rules allow the port. Dual-stack binding keeps `.local` hostnames reliable on tablets that prefer IPv6.

## API

- `GET /api/state` returns dashboard state, Kanban cards, source health, Spotify player status, and refresh metadata.
- `GET /api/intelligence/overview` returns a current-state intelligence briefing, source-backed insight cards, anomaly/recent-change lists, chart-ready data, suggested questions, and partial/error state.
- `POST /api/intelligence/ask` accepts `{ "question": "...", "area": "optional" }` and returns an assistant answer with source references and follow-up questions.
- `GET /api/intelligence/sources` returns normalized CIC, OpenBrain, Supabase, OpenAI, and connector availability.
- `POST /api/tasks` creates a task card.
- `PATCH /api/tasks/:id` updates task fields or moves the card.
- `POST /api/tasks/:id/dismiss` dismisses a suggested card.
- `GET /api/project-taskboards` lists local GPT_OS projects with a canonical `TASKBOARD.md` and returns task/decision counts.
- `GET /api/project-taskboards/:project` returns the selected project's executive brief, open decisions, and Ready/In Progress/Blocked/Deferred/Done groups.
- `PATCH /api/project-taskboards/:project/tasks/:taskId/priority` changes one validated task priority in the canonical project `TASKBOARD.md`.
- `POST /api/refresh/gmail` creates summarized Gmail task suggestions from the current summarized feed, optionally after running `GMAIL_REFRESH_COMMAND`.
- `GET /api/spotify/player` returns Spotify playback state or a degraded state.
- `POST /api/spotify/control` sends `play`, `pause`, `next`, or `previous` when a Spotify access token and active device are available.

## Persistence

SQLite tables:

- `tasks`
- `task_events`
- `source_status`
- `refresh_runs`
- `app_settings`

The app seeds tasks from the existing briefing actions and summarized Gmail threads on first database creation. It does not store full email bodies.

## Personal And Project Taskboards

- **Personal To-Dos** is the renamed local board. It keeps Inbox, Today, Next, Waiting, and Done cards in CIC's SQLite database and includes a compact inbox/task summary.
- **Project Taskboards** discovers canonical `TASKBOARD.md` files directly under `GPT_OS/Projects`, shows the executive brief and open owner decisions, and groups work by taskboard status.
- Project priority edits are deliberately narrow: the server accepts only `P1`, `P2`, or `P3`, resolves only discovered project directories, and atomically rewrites only the matching row's Priority cell.
- Project tasks are not copied into CIC SQLite. Unsupported rows without a Priority column remain visible but read-only.
- Both taskboard surfaces use the icon-forward ScrubLordKay system: widened icon navigation, gold selected states, lavender project identity, semantic status icons, and compact focused-page utility controls.
- Dashboard and Deployments retain System Health; focused Personal To-Dos and Projects views start directly with their work surface.

## Privacy

- `.env`, SQLite files, logs, and generated runtime data are ignored.
- The local app passcode lives in `.env`; do not commit it.
- Money-sensitive rows keep the `money-val` class so the privacy blur can hide values.
- The privacy blur also hides rows/text classified as financial, purchase/order/device ownership, or medical/appointment content.
- Intelligence insight cards, assistant answers, source drilldowns, and generated summaries use the same privacy classifier so sensitive financial, medical, purchase, device, and behavioral clues remain blur-compatible.
- OAuth tokens and client secrets must stay out of the repo. Use macOS Keychain where practical, otherwise ignored `.env` values.

## Personal Data Intelligence

The Intelligence dashboard is a server-backed CIC view over the current local feed and OpenBrain retrieval. CIC remains the frontend and API surface. OpenBrain/Supabase/Postgres remains the durable memory and retrieval layer. Generated briefings, insight cards, charts, assistant answers, wiki pages, and graph views are derived output, not canonical storage.

Set these in ignored local `.env` to enable full server-side synthesis:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.4-mini
OPENAI_REASONING_EFFORT=low
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
QUERY_WIKI_URL=...
QUERY_WIKI_ACCESS_TOKEN=...
OPENBRAIN_MATCH_COUNT=8
OPENBRAIN_MATCH_THRESHOLD=0.2
```

The browser never receives OpenAI keys, Supabase service-role keys, or OpenBrain bearer tokens. `/api/intelligence/*` routes run behind the existing CIC API/auth middleware and either call `query-wiki` with `QUERY_WIKI_ACCESS_TOKEN` or call Supabase RPCs from the server. The Intelligence Brief uses `/api/intelligence/overview`: when configured, it renders server-side synthesis; otherwise it shows a deterministic partial state from the current CIC feed. It renders briefing and insight summaries with source labels, never raw OpenBrain chunk text, paths, or similarity scores.

Tuning points:

- Model and reasoning: `OPENAI_MODEL`, `OPENAI_REASONING_EFFORT`.
- Embeddings: `OPENAI_EMBEDDING_MODEL`, currently aligned to OpenBrain's 1536-dim `text-embedding-3-small` schema.
- Retrieval: `QUERY_WIKI_URL`, `OPENBRAIN_MATCH_COUNT`, `OPENBRAIN_MATCH_THRESHOLD`.
- Prompts/schemas: `server/openaiSynthesisClient.js`.
- Retrieval adapter: `server/openbrainClient.js`.
- Source normalization and chart mappings: `server/sourceNormalizer.js`.
- UI: `src/intelligence.jsx` and the intelligence styles in `src/styles.css`.

## Gmail Refresh

The standalone Node server cannot directly call Codex-only Gmail connectors. By default, `/api/refresh/gmail` reads the existing summarized `data.js` Gmail panel and stores summarized task suggestions only.

If a future local refresh script is added, set:

```bash
GMAIL_REFRESH_COMMAND=/absolute/path/to/refresh-command
```

The background worker runs every `GMAIL_REFRESH_INTERVAL_MINUTES` minutes; default is `180`.

## Spotify

Spotify player controls use Spotify's authorization-code flow. Set these in ignored local `.env`:

```bash
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8787/auth/spotify/callback
```

The Music page keeps the local live player and links out to Spotify Atlas for
full listening stats, history, and trends. Set `ATLAS_URL` in `.env` to pin that
link to a specific Atlas URL. If it is empty, the browser derives
`http://<current-host>:8899/dashboard.html`.

The redirect URI must exactly match an allowlisted Redirect URI in the Spotify developer app. Spotify requires loopback IP literals for local HTTP callbacks, so use `127.0.0.1` instead of `localhost`. Then open:

```text
http://127.0.0.1:8787/auth/spotify/login
```

After Spotify consent, Command Information Center writes `SPOTIFY_REFRESH_TOKEN` to `.env` and refreshes short-lived access tokens server-side. Required scopes:

- `user-read-playback-state`
- `user-read-currently-playing`
- `user-modify-playback-state`

If no authorization or active device exists, the UI shows a degraded state instead of fake controls.

The Music panel estimates playback progress locally once per second and refreshes Spotify through the Web API only when useful: just after a predicted track boundary, after local controls, when the tab becomes visible again, or during a gentle 15-second reconciliation. Command Information Center-triggered playback controls also schedule two short follow-up reads because Spotify's playback-state endpoint can lag immediately after skip/pause. Spotify API calls are capped with a short timeout so playback status does not make the rest of the dashboard wait.

## LaunchAgent

Template plist:

- `launchd/com.kayden.cic.plist`

Install it from the Mac user's normal shell, not from an agent sandbox, if autostart is wanted:

```bash
cp "/Users/kayden/GPT_OS/Projects/Command Information Center/launchd/com.kayden.cic.plist" "$HOME/Library/LaunchAgents/"
launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.kayden.cic.plist"
launchctl kickstart -k "gui/$(id -u)/com.kayden.cic"
```

Logs are written to `logs/`, which is ignored.

## Verification

Current implementation was verified with:

- `npm test`
- `npm run build`
- `npm audit --omit=dev`
- In-app browser desktop login and Kanban create/move test.
- In-app browser mobile viewport check at `390x844`.

For Intelligence changes, additionally validate:

- `/api/intelligence/overview` with missing credentials returns a clear partial state.
- `/api/intelligence/ask` rejects empty/oversized questions and includes source references for valid answers.
- OpenBrain retrieval succeeds or reports the exact credential/project blocker.
- Privacy mode blurs sensitive insight and assistant text.
- Built client assets do not contain OpenAI keys, Supabase service-role keys, or OpenBrain tokens.

The old static dashboard remains available in `archive/static-v0/` as rollback material.
