---
name: mission-control-refresh
description: Refresh Kayden's Command Information Center dashboard data feed. Probes every connected MCP source (Gmail, Google Calendar, GitHub, Vercel, Google Drive, IFTTT, Spotify, ClickUp), rewrites data.js with live values only, marks failed sources offline, and regenerates the AI morning briefing with cross-referenced prioritized actions. Trigger on "refresh the dashboard", "refresh Command Information Center", "update my briefing".
---

# Command Information Center Refresh

Regenerates the data feed for `/Users/kayden/GPT_OS/Projects/Command Information Center/dashboard.html`.

## Hard rules

1. Rewrite ONLY `/Users/kayden/GPT_OS/Projects/Command Information Center/data.js`. NEVER edit `dashboard.html` during a routine refresh.
2. No mocked numbers. Every value must come from a live tool call made during this run.
3. Never break the page: keep the exact `window.CIC_DATA` top-level schema (`meta`, `sources`, `briefing`, `gmail`, `calendar`, `github`, `vercel`, `drive`, `money`, `spotify`, `projects`, `wiki`, `ifttt`). If a source fails, set its `sources[]` status to `offline` (errors) or `auth_required` (OAuth), keep the matching panel data present with empty arrays/null notes where possible, and move on. Page must always render.
4. Increment `meta.version`, set `meta.generatedAt` (UTC ISO) and `meta.generatedAtLocal` (MM/DD/YYYY h:mm AM/PM MST or MDT).
5. Money-tagged items keep `money: true` so the privacy blur works.
6. UI-shell changes are separate work. Do not edit `dashboard.html` unless Kayden explicitly asks for a UI change or a verified rendering bug requires it.

## Probe procedure (run all, tolerate failures)

| Source   | Call | Feed fields |
|----------|------|-------------|
| Gmail    | search_threads `in:inbox newer_than:7d`, pageSize 15 | inboxThreadEstimate, top ~6 actionable threads, tag DEADLINE/MONEY/HEALTH/INFO |
| Calendar | list_events today through +4 days, tz America/Denver | events[], empty-state note |
| GitHub   | get_me; search_pull_requests `author:KaydenClark is:open` (total_count = openPrCount, top ~9 PRs) | github.* |
| Vercel   | list_teams -> list_projects -> list_deployments per project | project name, state, target, commit, branch, deployed |
| Drive    | list_recent_files pageSize 10 | recent[] (tag money:true for financial/tax docs) |
| IFTTT    | my_applets | applets[] |
| Spotify  | get_currently_playing ({} = idle -> nowPlaying:null; error -> offline). Library stats from LOCAL export: parse Projects/Spotify/Liked_Songs.csv (track count, hours, top 6 artists, 4 recent adds) + count playlist CSVs in "Playlists 04.04.26" | spotify.* |
| Local FS | ls -lt GPT_OS/Projects (top ~8 by mtime); grep "^## " "Wiki - Kayden/log.md" (5 newest) | projects.*, wiki.* |
| ClickUp  | skip call if still unauthenticated -> auth_required |

## Briefing rules

Write `briefing.headline`, `briefing.summary`, and 3-6 `actions[]` with priority P1-P3, a due date (MM/DD/YYYY), `sources[]` listing every tool the action draws on (cross-reference at least two sources where possible, e.g. GitHub PR batch x empty Calendar runway, Gmail money events x Drive tax docs), and `money: true` when amounts are mentioned.

## Verify

After writing data.js, run this validation to confirm the file parses and the schema is intact before finishing:

```bash
node -e "global.window={};require('/Users/kayden/GPT_OS/Projects/Command Information Center/data.js');const d=window.CIC_DATA;for (const k of ['meta','sources','briefing','gmail','calendar','github','vercel','drive','money','spotify','projects','wiki','ifttt']) if (!(k in d)) throw new Error('missing '+k)"
```
