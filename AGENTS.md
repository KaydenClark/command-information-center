# Command Information Center Agent Instructions

Command Information Center is a private local web app under `/Users/kayden/GPT_OS/Projects/Command Information Center`.

## Read Order

1. `README.md`
2. `server/`
3. `src/`
4. `refresh-skill/SKILL.md`
5. `data.js`
6. `archive/static-v0/` only for static-dashboard fallback context

## Web App Rules

- Keep the app LAN-local unless Kayden explicitly asks for remote access.
- Use the existing React + Vite + Express + SQLite architecture.
- Store runtime data under `data/` and logs under `logs/`.
- Do not commit `.env`, SQLite files, logs, OAuth tokens, or client secrets.
- Prefer degraded states over fake connector data.
- Keep Gmail task suggestions summarized; do not store full email bodies.
- Keep money-sensitive UI blur-compatible.

## Routine Data Refresh Rules

- Routine connector refreshes still rewrite only `data.js`.
- Do not claim live connector values unless they came from a current connector call or local source read.
- Preserve the top-level `window.CIC_DATA` keys documented in `refresh-skill/SKILL.md`.
- If a source is unavailable, mark it `offline` or `auth_required` and keep the UI renderable.

## Coding Rules

- Use red/green TDD for behavior changes where practical.
- Run `npm test`, `npm run build`, and `npm audit --omit=dev` before handoff.
- For UI changes, verify desktop and mobile rendering in a browser.
- Preserve Kayden's palette:
  - `#474747`, `#191919`, `#F7F5F2`, `#F7F7F7`, `#0A0A0A`
  - `#DE2B31`, `#885A89`, `#4DAA57`, `#3A7CA5`, `#E0BD3E`, `#CF4F84`, `#FF6201`, `#1ABCBD`

## Documentation Rules

- When behavior, location, schema, or refresh cadence changes, update the Command Information Center wiki page in `Wiki - Kayden/01 Projects/`.
- For machine/workspace changes, update the relevant `Wiki - Machine/` page.
- Append log entries with `Agent: Codex` or `Agent: Claude` as appropriate.
