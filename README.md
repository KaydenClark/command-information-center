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

## Commands

```bash
npm install
npm run build
npm start
npm test
```

`npm start` binds to `0.0.0.0:8787` by default so same-WiFi devices can reach it after macOS firewall/network rules allow the port.

## API

- `GET /api/state` returns dashboard state, Kanban cards, source health, Spotify player status, and refresh metadata.
- `POST /api/tasks` creates a task card.
- `PATCH /api/tasks/:id` updates task fields or moves the card.
- `POST /api/tasks/:id/dismiss` dismisses a suggested card.
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

## Privacy

- `.env`, SQLite files, logs, and generated runtime data are ignored.
- The local app passcode lives in `.env`; do not commit it.
- Money-sensitive rows keep the `money-val` class so the privacy blur can hide values.
- OAuth tokens and client secrets must stay out of the repo. Use macOS Keychain where practical, otherwise ignored `.env` values.

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

The old static dashboard remains available in `archive/static-v0/` as rollback material.
