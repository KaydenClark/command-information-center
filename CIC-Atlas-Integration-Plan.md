# Handoff: Wire CIC "Music" page to Spotify Atlas

Date: 06/15/2026
Goal: Make the Command Information Center (CIC) "Music" page a gateway into the Spotify Atlas app, and formalize the Spotify data plumbing so Atlas can pull CIC's Spotify feed when needed. Two separate apps stay separate; CIC links out to Atlas.

Decisions locked for this run (override before sending if you disagree):
- **Link style: link out.** Music page keeps its live player and adds an "Open Spotify Atlas" action that opens Atlas in a new tab. No iframe, no reverse proxy, no merge.
- **Connector scope: Spotify plumbing only.** Formalize the already-half-built Spotify credential sharing, and give Atlas a read path to CIC's `data.js` limited to the `spotify` slice. Wire the capability; do not consume the full feed and do not surface non-music data.

This doc is split:
- **Part 1, Codex scope:** everything inside the `GPT_OS` git repo (both project folders). Self-contained.
- **Part 2, Claude scope:** runtime/LAN, memory, and end-to-end verification Codex cannot reach. Run after Codex confirms done.

---

## Current state (verified 06/15/2026)

CIC (`Projects/Command Information Center/`), React + Vite + Express + SQLite, port 8787, binds `0.0.0.0`:
- Nav has a "Music" view (`src/main.jsx`) that renders the expanded `SpotifyPanel` (live now-playing + transport controls + a 3-stat library strip from `data.spotify.library`).
- Live player: `server/spotify.js` exposes `/api/spotify/player` and `/api/spotify/control`.
- `/api/state` (`server/app.js`, around line 118) returns `{ dashboard, tasks, sourceHealth, spotify, settings, refreshedAt }`. There is no `atlas` field yet.
- Connector feeds live in `data.js` as `window.CIC_DATA`, read server-side by `server/dataFeed.js` (`loadMissionData`, a `vm` sandbox eval). Refreshed daily by `refresh-skill/`.

Spotify Atlas (`Projects/Spotify/Spotify-Atlas/`), plain Node `http` server + static site, SQLite `data/spotify.db` + optional Supabase, port 8899, binds `127.0.0.1`:
- API: `GET /api/spotify/dashboard`, `GET /api/spotify/health`, `POST /api/spotify/sync`, plus its own `GET /api/spotify/player` and `POST /api/spotify/control`.
- API auth: optional bearer via `SPOTIFY_ATLAS_API_TOKEN` (`authorizeAtlasApi` in `server/atlasBackend.mjs`); when the token is unset the API is open.
- Credential sharing already exists: `loadSpotifyCredentials` in `server/spotifyClient.mjs` (lines 55 to 78) already falls back to `../Command Information Center/.env` as `cic-env`. The folder name is already post-rename and correct. No stale "Mission Control" references remain in Atlas.

---

## PART 1, CODEX SCOPE

Do A and B as one cohesive change set. Neither app may sit in a broken state at any commit. CIC's AGENTS.md coding rules apply (red/green TDD where practical; run `npm test`, `npm run build`, `npm audit --omit=dev`; verify desktop + mobile; preserve the palette).

### A. CIC side, Music page becomes an Atlas gateway

**A1. Config: add a resolvable Atlas URL.**
`server/config.js`, in the object returned by `getConfig()`, add:
```js
atlasUrl: process.env.ATLAS_URL || ""
```

**A2. Surface it in state.**
`server/app.js`, in the `/api/state` handler (the `res.json({ ... })` near line 118), add a top-level field:
```js
atlas: { configuredUrl: config.atlasUrl }
```

**A3. Frontend link-out.**
`src/main.jsx`, in the `activeView === "Music"` branch (currently around line 271, which renders `<SpotifyPanel ... expanded />`):
- Keep the existing live `SpotifyPanel` exactly as is.
- Below it, render an "Open Spotify Atlas" call to action (anchor with `target="_blank" rel="noopener noreferrer"`).
- Resolve the href in this order: `state.atlas?.configuredUrl` if non-empty, else derive client-side as `` `${window.location.protocol}//${window.location.hostname}:8899/dashboard.html` ``. Put the resolver in a small helper so it is unit-friendly.
- Add a one-line caption, e.g. "Full listening stats, history, and trends." Use the existing `Music` icon and palette. No new colors.

**A4. Document the env var.**
- `.env.example`: add `ATLAS_URL=` with a comment that empty means "derive from the browser host on port 8899."
- `README.md`: note `ATLAS_URL` under config and that the Music page links out to Atlas.

**A5. Tests.**
- Extend `test/api.test.js`: assert `/api/state` includes `atlas.configuredUrl` (empty string default is fine).
- Add a unit test for the URL resolver helper from A3 (configured value wins; otherwise host-derived `:8899` form).

### B. Atlas side, formalize Spotify plumbing + scoped CIC feed read

**B1. Make the CIC credential path overridable (keep current default).**
`server/spotifyClient.mjs`, `loadSpotifyCredentials`: keep behavior identical, but let the CIC env path come from `process.env.CIC_ENV_PATH` when set, falling back to the existing `../Command Information Center/.env` default. This removes the hard-coded sibling assumption without changing default behavior.

**B2. Add a scoped CIC feed reader.**
New module `server/cicFeed.mjs`:
- Locate CIC's `data.js` from `process.env.CIC_DATA_FEED_PATH`, default `../Command Information Center/data.js` (resolved off `projectRoot`).
- Evaluate it in a `node:vm` sandbox (mirror CIC's `loadMissionData` technique: `context = { window: {} }`, `runInContext` with a timeout) and read `window.CIC_DATA`.
- Export `readCicSpotifyFeed()` returning only `{ ok, generatedAt, spotify }` where `spotify` is the `CIC_DATA.spotify` slice. Missing file or parse error returns a graceful `{ ok: false, detail, spotify: null }`. Do not return any non-`spotify` keys.

**B3. Expose it as a token-protected endpoint.**
`server/index.mjs` + `server/atlasBackend.mjs`: add `GET /api/spotify/cic-feed`, guarded by the same `authorizeAtlasApi` flow as the other `/api/spotify/*` Atlas endpoints (so it respects `SPOTIFY_ATLAS_API_TOKEN`). Return the `readCicSpotifyFeed()` result. Do not call it from the dashboard UI; this is capability only.

**B4. Document new env + the bridge.**
- `.env.example`: add `CIC_ENV_PATH=` and `CIC_DATA_FEED_PATH=` with comments (empty means use the default sibling path).
- `README.md`: under "How it works," note the CIC bridge: shared Spotify credentials and the read-only `/api/spotify/cic-feed` Spotify slice.

**B5. Tests.**
- New `test/cicFeed.test.mjs` (node:test): point `CIC_DATA_FEED_PATH` at a fixture `data.js` defining `window.CIC_DATA = { spotify: {...}, gmail: {...} }`; assert the reader returns the `spotify` slice and omits `gmail`; assert missing file returns the graceful shape.
- Extend `test/atlasBackend.test.mjs` (or add an endpoint test): with a token configured, `/api/spotify/cic-feed` without a bearer returns 401; with the correct bearer returns the feed.

### Cross-cutting
- Keep both apps' existing architectures and ports (CIC 8787, Atlas 8899). Do not change Atlas's bind host in code.
- Do not commit `.env`, secrets, SQLite files, or tokens.
- Run for both apps: `npm test` (Atlas uses `node --test test/*.test.mjs`), and for CIC also `npm run build` and `npm audit --omit=dev`.

### Out of scope (do NOT do)
- No iframe embed, no reverse proxy, no merging Atlas under CIC's origin.
- No exposure of CIC's non-Spotify feeds (gmail, drive, github, money, etc.).
- No changes to `archive/static-v0/`, the Scheduled refresh task, or launchd plists.
- No new connectors and no Supabase schema changes.

---

## PART 2, CLAUDE SCOPE (after Codex confirms done)

1. **LAN reachability of the link.** The derived link uses the browser host on port 8899. Atlas binds `127.0.0.1` by default, so the link only resolves on the Mac itself. Decide with Kayden whether Atlas should run with `HOST=0.0.0.0` (and macOS firewall allow 8899) so the link works from his phone, or whether `ATLAS_URL` should point somewhere specific. This is a runtime choice, not a code change.
2. **Optional always-on Atlas.** If LAN access is wanted, consider a launchd plist for the Atlas server (it currently only has the poller LaunchAgent). Confirm before adding.
3. **Set `SPOTIFY_ATLAS_API_TOKEN`** in Atlas `.env` so `/api/spotify/cic-feed` is not open. Generate and store Mac-side.
4. **Memory + wiki.** Update the mission-control / CIC memory note and the CIC wiki page (`Wiki - Kayden/01 Projects/`) with the Atlas bridge; append a log entry (`Agent: Claude`).
5. **End-to-end verification:** open CIC at `localhost:8787`, go to Music, confirm the live player still works and "Open Spotify Atlas" opens the Atlas dashboard; then `curl -H "Authorization: Bearer <token>" localhost:8899/api/spotify/cic-feed` and confirm it returns only the Spotify slice.

---

## Acceptance criteria
- CIC `/api/state` returns `atlas.configuredUrl`; Music page shows the live player plus a working "Open Spotify Atlas" link.
- `ATLAS_URL` overrides the derived URL when set.
- Atlas serves `GET /api/spotify/cic-feed` returning only the CIC `spotify` slice, token-protected when a token is set, graceful when `data.js` is absent.
- Atlas credential path and CIC feed path are env-overridable with unchanged defaults.
- All tests, CIC build, and CIC audit pass. Both apps run independently as before.
