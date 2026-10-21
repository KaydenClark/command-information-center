# CIC Intelligence Redesign Finish Plan

Reviewed: 2026-06-18
Scope source: `/Users/kayden/GPT_OS/PROMPT-CIC-Intelligence-Redesign.md`
Project: `/Users/kayden/GPT_OS/Projects/Command Information Center`

## Current Answer

The redesign is mostly implemented and locally healthy. The server, frontend, migration file, prescient task data access, and nightly kanban check code all exist. Local tests, build, and audit pass. Live OpenBrain reads also work.

It is not fully finished until the remaining operational gates are closed:

- confirm the Supabase migration was formally applied through the intended Supabase migration workflow, not just present as a local SQL file
- verify in a browser that the Intelligence tab page load does not trigger OpenAI traffic, and that Ask triggers OpenAI only on explicit submit
- run or observe the startup kanban check and confirm it writes or reconciles `prescient_tasks`
- update README/wiki wording to match the new read-first Intelligence model
- clean up and checkpoint the repo's large uncommitted change set

## Completeness Check

| Requirement | Status | Evidence |
| --- | --- | --- |
| Add `prescient_tasks` migration | Mostly done | `supabase/migrations/20260616045133_create_prescient_tasks.sql` exists with table, indexes, `updated_at` trigger, and RLS. Live table is queryable through the server credentials. |
| Apply migration to OpenBrain | Partially verified | `prescient_tasks` returned 1 row from live Supabase, so the table exists. The actual `apply_migration` step was not verified in this session. |
| Add `GET /api/intelligence/kb` | Done | `server/intelligence.js` exposes `/kb`; live local probe returned 4 knowledge chunks and 1 task. |
| Make `/kb` AI-free | Done by code review | `/kb` calls `queryOpenBrainKeyword` and `listPrescientTasks`; no OpenAI client call is in that handler. |
| Fix `/api/intelligence/overview` to avoid OpenAI | Done by code review and probe | `/overview` calls keyword retrieval and `buildFallbackOverview`; live local probe returned `generatedBy: local`. |
| Keep `/api/intelligence/ask` OpenAI-backed | Done by code review | `/ask` still calls `queryOpenBrain` and `answerQuestionWithOpenAI` only after a POST question. |
| Add prescient task Supabase helper | Done | `server/prescientTasks.js` reads, inserts, and updates OpenBrain `prescient_tasks`. |
| Add nightly kanban check | Done in code | `server/kanbanCheck.js` exports `runKanbanCheck`; `server/index.js` schedules it after 10 seconds and every 24 hours when `OPENAI_API_KEY` is present. |
| Redesign Intelligence frontend | Done in code | `src/intelligence.jsx` loads `/api/intelligence/kb`, renders Knowledge Feed, Prescient Tasks, and the on-demand Assistant panel. |
| Remove page-load overview call from Intelligence tab | Done | `src/intelligence.jsx` calls `/api/intelligence/kb`; no `/overview` load path remains in that component. |
| Preserve out-of-scope files | Looks done | `dashboard.html`, `/ask`, `/sources`, `openaiSynthesisClient.js`, `openbrainClient.js`, and `dataFeed.js` remain present. |
| Verification suite | Mostly done | `npm test`, `npm run build`, and `npm audit --omit=dev` passed. Browser/OpenAI network checks remain. |

## Verification Run

- `npm test`: passed, 24 tests.
- `npm run build`: passed.
- `npm audit --omit=dev`: passed, 0 vulnerabilities.
- Live app root: `http://127.0.0.1:8787/` returned HTTP 200 and the built React app.
- Live `/api/intelligence/kb` probe through an auth-disabled local server: HTTP 200, 4 `kb` chunks, 1 `tasks` row, OpenBrain ready, prescient ready, about 826 ms.
- Live `/api/intelligence/overview` probe through an auth-disabled local server: HTTP 200, `generatedBy: local`, OpenBrain ready, 4 insights, 4 suggested questions, about 102 ms.

Prompt target mismatch:

- `/api/intelligence/kb` was expected to respond under 300 ms if Supabase is reachable. The live check took about 826 ms from this machine. This may be normal network latency, but it should be measured a few more times before calling the performance target met.

## Finish Plan

### 1. Add Missing Test Coverage

Goal: make the AI-free page-load contract enforceable.

- Add a `/api/intelligence/kb` server test that injects a fake `fetchImpl` and asserts:
  - the endpoint returns `kb`, `tasks`, and `generatedAt`
  - the only remote calls are Supabase keyword search and `prescient_tasks`
  - no OpenAI endpoint is called
- Add a `/api/intelligence/overview` regression test that fails if the route calls OpenAI synthesis.
- Add a `runKanbanCheck` unit test with a fake OpenAI response and fake Supabase calls covering:
  - insert new flagged task
  - update matching existing task
  - mark old system flags done only when the model returns a non-empty assessment
  - do not resolve existing flags after an unparsable response

### 2. Verify Supabase Migration State

Goal: prove the database is in the intended shape.

- Confirm `prescient_tasks` exists in project `ksijheqpqfmictqjnrlt`.
- Confirm columns match the migration.
- Confirm indexes exist on `status` and `priority`.
- Confirm the `updated_at` trigger works by updating a test row or using an existing non-sensitive row.
- Confirm RLS posture is intentional: server-side service role can read/write; browser/client credentials cannot.
- Record the migration application method in the project README or a small migration note.

### 3. Verify Kanban Background Job End to End

Goal: close the highest-risk runtime behavior.

- Start the server with real `.env` and observe the `[kanban-check]` startup log after the 10-second delay.
- Confirm the job uses only `briefing.actions` and project state context.
- Confirm it writes or updates rows in `prescient_tasks`.
- Confirm repeat runs do not create near-duplicate tasks.
- Confirm no key or task detail leaks into logs.
- Decide whether "skip silently" should mean no log line when OpenAI is missing; current scheduler fully skips when no key, but logs result details when the key exists.

### 4. Browser Verification

Goal: prove the UI behaves the way the prompt describes.

- Open `http://127.0.0.1:8787/` and log in.
- Navigate to the Intelligence tab.
- Confirm page-load Network traffic includes `/api/intelligence/kb`.
- Confirm page-load Network traffic does not include `/api/intelligence/overview`, OpenAI, or embedding calls.
- Confirm the top status line renders `OpenBrain · {chunks} chunks · {tasks} tasks · {timestamp}`.
- Confirm Knowledge Feed cards show title, vault, 120-character preview, and score when present.
- Confirm Prescient Tasks group by `stalled`, `in_progress`, and `open`, with the expected empty state if no tasks exist.
- Submit one Ask question and confirm OpenAI traffic occurs only then.
- Verify desktop and mobile layouts do not overlap or truncate important controls.

### 5. Performance Pass

Goal: decide whether the 300 ms target is realistic or needs mitigation.

- Measure `/api/intelligence/kb` five times against live Supabase.
- If median is still above 300 ms, choose one:
  - accept Supabase network latency and document a realistic target
  - cache the keyword feed and prescient tasks for 30-60 seconds server-side
  - reduce keyword payload or add a database-side optimization
- Keep the first implementation simple unless repeated measurements show the page feels slow.

### 6. Documentation Cleanup

Goal: make repo and wiki docs match the new architecture.

- Update `README.md`:
  - document `GET /api/intelligence/kb`
  - explain that Intelligence page load is database-read-first and AI-free
  - clarify `/overview` is deterministic/local plus keyword retrieval
  - clarify `/ask` and the nightly kanban check are the only OpenAI paths
- Update `Wiki - Kayden/01 Projects/Command Information Center.md`:
  - replace older "generated briefing / charts / source drilldowns" wording where it no longer matches the redesigned tab
  - add a 2026-06-18 verification snapshot for the redesign
- Update `Wiki - Machine/02 Source Maps/GPTCode Source Registry.md` count/description if the final file count changes.
- Append concise `Agent: Codex` log entries where the wiki maintenance rules expect them.

### 7. Repo Checkpoint

Goal: make the work handoff-safe.

- Review the current uncommitted changes and separate unrelated or older work from this redesign if needed.
- Remove or explain any generated artifacts that should not be committed.
- Confirm `.env`, SQLite files, logs, and tokens are ignored.
- Run the final verification set:
  - `npm test`
  - `npm run build`
  - `npm audit --omit=dev`
  - browser desktop and mobile smoke test
  - live `/api/intelligence/kb`
  - live `/api/intelligence/overview`
  - one explicit `/api/intelligence/ask`
- Commit or otherwise checkpoint only after the above gates are clean.

## Risks and Side Effects

- The current repo has many uncommitted changes, including files unrelated to this exact prompt. Finishing should avoid bundling unrelated work accidentally.
- The kanban check relies on parsing model output as JSON. Tests should lock down the tolerant parser and the non-destructive failure behavior.
- `prescient_tasks` uses a service-role key server-side. This is appropriate for the local private app, but browser bundles and logs must be checked for accidental exposure before any publishing work.
- `/api/intelligence/kb` currently depends on live Supabase latency. If the tab feels slow, short server-side caching is the least invasive fix.
- The prompt says "skip silently" when no OpenAI key exists. Current `server/index.js` does skip scheduling entirely when there is no key; with a key present, it logs check results and failures.

## Suggested Done Definition

This project is finished when:

- `/api/intelligence/kb` is tested, live, and AI-free
- `/api/intelligence/overview` is tested and does not call OpenAI
- Intelligence page load is browser-verified with no OpenAI network calls
- Ask is browser-verified to call OpenAI only after submit
- nightly kanban check is observed writing or reconciling `prescient_tasks`
- Supabase migration state is documented
- README/wiki/logs reflect the final architecture
- final test/build/audit/browser checks pass
- the repo has a clean, intentional checkpoint
