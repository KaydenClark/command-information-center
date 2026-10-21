# Handoff: Publish Command Information Center as a clean public repo

**Goal:** Stand up a brand-new public GitHub repo containing a de-personalized copy of the
Command Information Center (CIC) dashboard — a reference React + Express frontend for an
OpenBrain-style RAG backend. A fresh repo (no shared git history) is intentional: it avoids
history-scrubbing entirely. **None of the source repo's git history comes along.**

- **Source (private, DO NOT push):** `/Users/kayden/GPT_OS/Projects/Command Information Center`
- **Staging dir to create:** `/Users/kayden/GPT_OS/Projects/cic-public/`
- **Suggested GitHub repo name:** `command-information-center` (public)
- **Hard rule:** build the staging tree by **allowlist** (copy only known-clean files). Never
  `cp -r` the whole source and delete afterward — that risks dragging in a stray blob.

---

## Definition of Done (the cold session must satisfy ALL of these)

1. `/Users/kayden/GPT_OS/Projects/cic-public/` exists with **only** the allowlisted files (table below) plus the new files in Phase 2.
2. Identifier scan over the staged tree returns **zero** hits (command in Phase 3, Step 1).
3. `git ls-files` in the staged repo contains **no** `data.js`, no `screenshots/`, no `archive/`, no `launchd/`, no `refresh-skill/`, no `AGENTS.md`, no `.env`.
4. `npm install && npm run build && npm test` all pass in the staged tree.
5. Built `dist/` contains no OpenAI keys, Supabase keys, or OpenBrain tokens (scan in Phase 3, Step 3).
6. A fresh clone runs in demo mode (`cp data.example.js data.js && npm start`) and the dashboard renders with synthetic data and **no** backend credentials configured.
7. Repo root has: public `README.md`, `LICENSE`, `CONTRACT.md`, `data.example.js`, `.env.example`, and `package.json` with an `engines` field requiring Node ≥ 22.
8. The new GitHub repo is **public**, the push succeeded, the README renders, and a clone-to-run from GitHub works (Phase 4, Step 4).
9. This handoff file (`PUBLIC_REPO_HANDOFF.md`) is **not** copied into the public repo.

---

## Phase 0 — Prereqs & decisions

- [ ] Confirm `gh auth status` is logged in and tools available: `node -v` (must be ≥ 22 — required by `node:sqlite`/`DatabaseSync` used in `server/db.js`), `npm`, `git`, `gh`.
- [ ] Decision (default chosen): **demo feed via `cp`.** `data.example.js` is tracked; real `data.js` is gitignored. A fresh clone has no `data.js`, so the README tells users to `cp data.example.js data.js`. (Alternative, not used: change the `dataFeedPath` default in `server/config.js` to `data.example.js`.)
- [ ] Decision (default chosen): keep the `prescient_tasks` migration in this repo under `supabase/migrations/` as "the one table CIC asks OpenBrain to add," and **also** describe it in `CONTRACT.md`. Authoritative wiki schema lives in the (separate) OpenBrain repo.

---

## Phase 1 — Scaffold the staging tree (allowlist copy)

Create exactly this structure under `/Users/kayden/GPT_OS/Projects/cic-public/`:

```
cic-public/
├── server/              ← copy ENTIRE dir from source (all .js; verified clean)
├── src/                 ← copy ENTIRE dir (then edit per Phase 2)
├── test/                ← copy ENTIRE dir
├── supabase/
│   └── migrations/      ← copy (contains the prescient_tasks migration)
├── .gitignore           ← copy, then add `data.js` (Phase 2)
├── .env.example         ← copy, then reconcile (Phase 2)
├── index.html           ← copy (title is "Command Information Center" — fine)
├── package.json         ← copy, then add `engines` (Phase 2)
├── package-lock.json    ← copy
├── vite.config.js       ← copy
├── data.example.js      ← CREATE NEW (Phase 2)
├── README.md            ← CREATE NEW public version (Phase 2)
├── LICENSE              ← CREATE NEW (Phase 2)
└── CONTRACT.md          ← CREATE NEW (Phase 2)
```

**Do NOT create or copy:** `data/` (sqlite; auto-created at runtime by `config.js` via `mkdirSync`), `node_modules/`, `dist/`, `logs/`.

### Allowlist / exclude reference

| COPY (clean) | EXCLUDE (personal or generated) |
|---|---|
| `server/` (all files — scan confirmed clean) | `data.js` ← **real personal data** |
| `src/` (edit 2 strings in `main.jsx`) | `archive/` (old dashboard + data + screenshots) |
| `test/` | `screenshots/` (real Gmail/money/calendar) |
| `supabase/migrations/` | `design/` ← **eyeball mockups first**; copy only if generic |
| `index.html`, `vite.config.js` | `launchd/com.kayden.cic.plist` (hardcoded user/paths) |
| `package.json`, `package-lock.json` | `refresh-skill/SKILL.md` (personal workflow) |
| `.gitignore`, `.env.example` | `AGENTS.md`, `dashboard.html`, `.DS_Store`, `.env`, `PUBLIC_REPO_HANDOFF.md` |

---

## Phase 2 — De-personalize & add public files

### 2a. Edit `src/main.jsx` (two cosmetic strings — locate with grep, lines may drift)
Run `grep -n 'Kayden Ops Dashboard\|Robinhood' src/main.jsx`, then:
- `<p>Kayden Ops Dashboard</p>` (≈ line 385) → `<p>Operator Dashboard</p>`
- Empty-state `detail="Robinhood/live portfolio data is not called from this page."` (≈ line 952) → `detail="Brokerage/live portfolio data is not called from this page."`
- (Optional, benign) `test/spotify.test.js` mock device `name: "Mac Mini"` → `"Demo Device"`.
- Re-grep to confirm `server/` is clean (it was) and no other `Kayden`/`/Users/`/account handles remain.

### 2b. `.gitignore` — add `data.js`
Append a line so the personal feed can never be committed in this repo:
```
data.js
```
(Keep `data.example.js` tracked.)

### 2c. `package.json` — add engines
```json
"engines": { "node": ">=22" }
```
(`server/db.js` uses `node:sqlite` `DatabaseSync`, which needs Node 22+.)

### 2d. `.env.example` — reconcile with `server/config.js`
Ensure it lists every var `getConfig()` reads, with placeholder values and brief comments. At minimum: `PORT`, `HOST`, `CIC_DB`, `CIC_PASSCODE`, `CIC_DATA_FEED`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_REASONING_EFFORT`, `OPENAI_EMBEDDING_MODEL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (note the `SUPABASE_SECRET_KEY` alias), `QUERY_WIKI_URL`, `QUERY_WIKI_ACCESS_TOKEN`, `OPENBRAIN_MATCH_COUNT`, `OPENBRAIN_MATCH_THRESHOLD`, `SPOTIFY_*`, `ATLAS_URL`. **No real values.**

### 2e. CREATE `data.example.js` (synthetic demo feed)
- Derive the **structure** from the real `data.js` and the fallback object in `server/dataFeed.js` (the `window.CIC_DATA = { ... }` shape). Replace **all** values with obviously-fake demo content.
- Must include every top-level key the UI/seeding touches: `meta`, `sources[]`, `briefing{headline, summary, actions[]}`, `gmail{windowDays, inboxThreadEstimate, threads[]}`, `calendar`, `github{user, openPrCount, batchNote, prs[]}`, `vercel{projects[]}`, `drive{recent[], note}`, `money{events[], accounts[]}`, `spotify{...}`, `projects{items[]}`, `wiki{entries[]}`, `ifttt{applets[]}`.
- Include ≥ 3 `briefing.actions` (mix of P1/P2/P3) and a few `gmail.threads` so the seeded Kanban and UI look populated. Use fictional names/repos (e.g. "Demo User", "example/widgets"). No real emails, accounts, or financials.
- Verify shape: `node -e "global.window={};require('./data.example.js');const d=window.CIC_DATA;for(const k of ['meta','sources','briefing','gmail','calendar','github','vercel','drive','money','spotify','projects','wiki','ifttt'])if(!(k in d))throw new Error('missing '+k);console.log('ok')"`

### 2f. CREATE `LICENSE`
- Add MIT (recommended) with the current year and owner name. Confirm the license choice with the owner if unsure.

### 2g. CREATE public `README.md` (rewrite — the source README is an operator manual)
Must cover: one-paragraph description (frontend for an OpenBrain-style RAG; works standalone in demo mode); **Quick start** (`npm install` → `cp data.example.js data.js` → `npm run build` → `npm start` → open `http://localhost:8787`); **Demo vs. live** (no creds = deterministic fallback UI, never fake AI); **Bring your own OpenBrain** section pointing at `CONTRACT.md` and the OpenBrain repo; **API** surface (`/api/state`, `/api/intelligence/{kb,overview,ask,sources}`, tasks, spotify); **Configuration** (link `.env.example`); Node ≥ 22 requirement; license. Strip all `/Users/kayden`, Mac-Mini, and launchd references.

### 2h. CREATE `CONTRACT.md` (what CIC expects from the backend)
Document the OpenBrain contract so someone can build a compatible backend:
- **Env vars** CIC reads to reach the backend (Supabase REST or the `query-wiki` edge function).
- **Tables:** `wiki_documents`, `wiki_chunks`, `prescient_tasks` (link the in-repo migration for the last one).
- **RPCs with signatures:**
  - `match_wiki_chunks(query_embedding vector, match_count int, filter_vault text, match_threshold float8)`
  - `search_wiki_keyword(search_text text, result_count int, filter_vault text)` → `TABLE(document_id, vault, path, title, snippet, rank)`
  - Optional `query-wiki` edge function: POST `{ query, match_count, match_threshold, filter_vault }` → `{ results: [...] }`.
- **Embeddings:** `text-embedding-3-small`, **1536 dims**.
- **`vault`** is currently an enum in the backend — note it should be treated as generic/configurable.
- State that authoritative backend build docs live in the **OpenBrain repo**; this file is the consumer-side summary.

---

## Phase 3 — Verify (all must pass before any push)

**Step 1 — Identifier scan (MUST return nothing):**
```bash
cd /Users/kayden/GPT_OS/Projects/cic-public
grep -rIn -iE 'kayden|/Users/|scrublordkay|feironkc|robinhood|galaxy tab|samsung|mac ?mini|kaydenclark|com\.kayden' \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git .
echo "exit: $?   (expect exit 1 = no matches found)"
```
Any printed line → **STOP**, fix, re-scan. (`data.example.js`/README/CONTRACT must also be clean.) `grep` exits 1 when there are no matches, which is what you want here.

**Step 2 — Build & test:**
```bash
npm install && npm run build && npm test
```
All green required.

**Step 3 — Built-asset secret scan (MUST return nothing):**
```bash
grep -rIE 'sk-[A-Za-z0-9]{20}|sb_secret_|service_role|eyJ[A-Za-z0-9_-]{20}' dist/ ; echo "exit: $?"
```

**Step 4 — Demo run smoke test:**
```bash
cp data.example.js data.js   # data.js is gitignored
npm start &                  # serves on :8787
sleep 2
curl -s localhost:8787/api/state | head -c 200   # expect dashboard JSON
# open http://localhost:8787 — Intelligence tab should render with synthetic data, no OpenAI calls
kill %1
```

---

## Phase 4 — Publish

**Step 1 — Fresh git history:**
```bash
cd /Users/kayden/GPT_OS/Projects/cic-public
git init
git add -A
git status   # CONFIRM: no data.js, no screenshots/, no archive/, no .env
git commit -m "Initial public release: Command Information Center RAG frontend"
```

**Step 2 — Final pre-push gate (re-confirm DoD #2–#5).**

**Step 3 — Create + push the public repo:**
```bash
gh repo create command-information-center --public --source=. --remote=origin --push
```

**Step 4 — Post-push verification:**
- Open the repo on GitHub; confirm README renders and **no** excluded files are present.
- Clone to a temp dir and run the demo: `git clone … /tmp/cic-check && cd /tmp/cic-check && npm install && cp data.example.js data.js && npm run build && npm start` → loads with synthetic data.

---

## STOP / rollback triggers (do not push if any are true)
- Identifier scan (Phase 3, Step 1) returns any hit.
- `git status`/`git ls-files` shows `data.js`, `.env`, `screenshots/`, `archive/`, `launchd/`, `refresh-skill/`, or `AGENTS.md`.
- `npm test` or `npm run build` fails.
- `dist/` secret scan returns any hit.
- Demo run can't render without backend credentials.

If already pushed when a leak is found: delete the GitHub repo (don't just force-push — the blob persists in forks/caches), fix locally, and re-publish from a fresh history.
