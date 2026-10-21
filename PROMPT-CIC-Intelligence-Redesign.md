# CIC Intelligence Tab Redesign — Claude Code Prompt

## Context

You are working inside `/Users/kayden/GPT_OS/Projects/Command Information Center`.

This is a local React + Express dashboard (CIC = Command Information Center) connected to a Supabase instance called **OpenBrain** (`ksijheqpqfmictqjnrlt`, us-west-2). OpenBrain stores wiki knowledge chunks via pgvector (`wiki_documents`, `wiki_chunks`). There is also a `thoughts` table with its own RPCs. Credentials are in `.env`.

**Current problem:** The Intelligence Tab fires OpenAI on every page load. `/api/intelligence/overview` embeds a query, calls `match_wiki_chunks`, then calls GPT to synthesize everything — 3 API calls per render. This is wrong. The Intelligence Tab should be a read of what is already IN OpenBrain, not a live AI synthesis.

**Mental model:** CIC is a website frontend. OpenBrain is the backend database. A website reads its database to render a page. It does not call an LLM to build the page every time.

---

## What to Build

### 1. New Supabase table: `prescient_tasks`

Write and apply a migration to add this table to OpenBrain:

```sql
CREATE TABLE IF NOT EXISTS prescient_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  detail text,
  area text,                          -- e.g. 'github', 'projects', 'finance'
  status text NOT NULL DEFAULT 'open', -- open | in_progress | stalled | done
  priority text NOT NULL DEFAULT 'P3', -- P1 | P2 | P3
  source_ids text[] DEFAULT '{}',
  kanban_stage text,                  -- where it currently sits on the board
  expected_stage text,                -- where it SHOULD be
  flagged_by text DEFAULT 'system',   -- 'system' or 'user'
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prescient_tasks_status_idx ON prescient_tasks(status);
CREATE INDEX IF NOT EXISTS prescient_tasks_priority_idx ON prescient_tasks(priority);
```

Apply this migration using the Supabase MCP (`apply_migration`). Project ID is `ksijheqpqfmictqjnrlt`.

---

### 2. New server endpoint: `GET /api/intelligence/kb`

Add this to `server/intelligence.js`. It must:
- Call `match_wiki_chunks` (or `search_wiki_keyword`) in OpenBrain to get the 8 most recent/relevant chunks using a generic query like `"current state tasks projects"`. No OpenAI embedding needed — use keyword search RPC if available, otherwise use the existing Supabase REST call.
- Query `prescient_tasks` where `status != 'done'`, ordered by priority then `updated_at` desc, limit 20.
- Return both as JSON: `{ kb: [...chunks], tasks: [...prescient_tasks], generatedAt }`.
- **No OpenAI calls.** This is a pure database read.

Add a helper in `server/db.js` (or a new `server/prescientTasks.js`) to query prescient_tasks from SQLite or Supabase — whichever is cleaner given the existing db pattern. Prescient tasks should live in Supabase alongside the wiki, not in the local SQLite.

---

### 3. Fix `GET /api/intelligence/overview`

Replace the current `overview` handler in `server/intelligence.js`. The new version must:
- Load `data.js` feed and source health (keep this, no change).
- Call `queryOpenBrain` with keyword search only (no embedding, no GPT synthesis).
- Return a **static structured response** — briefing headline/summary come from `data.js` (the `briefing` field already there), not from OpenAI.
- Do NOT call `generateOverviewWithOpenAI` or any OpenAI synthesis.
- Shape the response to match what the frontend already expects (`briefing`, `insights`, `sourceStatus`, `suggestedQuestions`). Hard-code 4 sensible suggested questions. Build `insights` from the top P1/P2 actions in `data.js` — no AI needed.

The `openaiSynthesisClient.js` and `generateOverviewWithOpenAI` can stay — they are used by `/ask`. Just remove them from the overview path.

---

### 4. New background task: nightly kanban check

Create `server/kanbanCheck.js`. This module:
- Exports a single async function `runKanbanCheck(config, db)`.
- Reads the current action items and project states from `data.js`.
- Calls `answerQuestionWithOpenAI` (the existing function) with a focused question: `"Which tasks or projects appear stalled or in the wrong kanban stage based on this data?"`, passing only the `briefing.actions` and `areas.projects` slices of context (not the full context — keep token usage minimal).
- Parses the response and upserts flagged items into `prescient_tasks` in Supabase. Use the Supabase REST API directly (same pattern as `openbrainClient.js`).
- Sets `flagged_by = 'system'`, `status = 'open'`, and marks any previously-flagged tasks that are no longer stalled as `status = 'done'`.

In `server/index.js`, schedule this to run once at startup (with a 10-second delay) and then every 24 hours via `setInterval`. Gate it behind `config.openAiApiKey` — if no key, skip silently.

---

### 5. Update the Intelligence Tab frontend (`src/intelligence.jsx`)

Restructure the component:

**On mount:** call `/api/intelligence/kb` (not `/api/intelligence/overview`). This is the primary data load — fast, no AI.

**Layout (three sections):**

1. **Knowledge Feed** — display `kb` chunks from OpenBrain. Show title, vault, a truncated content preview (120 chars), and similarity score. Label the section "OpenBrain Knowledge Feed". Style similar to the existing `insight-card`.

2. **Prescient Tasks** — display `tasks` from the `/kb` response. Group by `status` (open / in_progress / stalled). Show title, area, priority badge, `kanban_stage → expected_stage` if both present, and `flagged_by`. Empty state: "No flagged tasks — system check runs nightly."

3. **Ask Assistant** (right panel) — keep exactly as-is. This still calls `/api/intelligence/ask` with OpenAI on user action. No changes needed here.

**Remove:** the `loadOverview` function that calls `/api/intelligence/overview` from within this component. The overview endpoint can still exist for other callers, but the Intelligence Tab no longer triggers it on load.

**Add a small status line** at the top of the tab: `"OpenBrain · {kb.length} chunks · {tasks.length} tasks · {generatedAt}"` — no AI status needed since no AI ran.

---

## What NOT to change

- `/api/intelligence/ask` — leave completely alone. OpenAI on user demand is correct.
- `/api/intelligence/sources` — leave alone, works fine.
- `openaiSynthesisClient.js` — leave alone, used by `/ask`.
- `openbrainClient.js` — leave alone, used by both `/ask` and the new `/kb`.
- `data.js` and `dataFeed.js` — leave alone.
- All other tabs (Overview, Sources, etc.) — not in scope.
- `dashboard.html` (static v0 archive) — do not touch.

---

## Verification

After implementation:

1. Run `node server/index.js` and confirm startup logs show no errors.
2. `curl http://localhost:8787/api/intelligence/kb` — should return JSON with `kb` and `tasks` arrays, no OpenAI latency (should respond in under 300ms if Supabase is reachable).
3. `curl http://localhost:8787/api/intelligence/overview` — should return a briefing response without calling OpenAI. Confirm no `OPENAI_API_KEY` network traffic on this call.
4. Open the browser, navigate to the Intelligence Tab — the page should load without triggering any OpenAI API calls (check Network tab in DevTools).
5. Type a question in the Ask panel and submit — OpenAI should fire only then.
6. Check Supabase `prescient_tasks` table after ~15 seconds to confirm the kanban check ran and wrote rows.

---

## File map

```
server/intelligence.js        — modify (overview route, add /kb route)
server/kanbanCheck.js         — create new
server/db.js                  — add prescient_tasks Supabase query helper (or new file)
server/index.js               — add kanbanCheck scheduler
src/intelligence.jsx          — modify (use /kb, restructure layout)
supabase/migrations/          — add prescient_tasks migration
```

Start with the Supabase migration, then work server-out to frontend.
