import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runKanbanCheck } from "../server/kanbanCheck.js";
import { openDb } from "../server/db.js";

function tempDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-kanban-"));
  return openDb(path.join(dir, "test.sqlite"));
}

const SUPABASE_CONFIG = {
  supabaseUrl: "https://example.supabase.co",
  supabaseServiceRoleKey: "service-key"
};

// answerQuestionWithOpenAI wraps the model output in { answer, sources, followUps }.
// parseFlaggedItems reads openAi.data.answer, so the mock must embed the JSON array
// as a string in the "answer" field of the structured response.
function openAiFetch(flaggedItems) {
  const answerPayload = { answer: JSON.stringify(flaggedItems), sources: [], followUps: [] };
  return async (url) => {
    if (String(url).includes("openai.com")) {
      return new Response(JSON.stringify({
        output: [{ content: [{ text: JSON.stringify(answerPayload) }] }]
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    // Supabase: return empty array for GET (listSystemFlaggedOpen), acknowledge POST/PATCH
    return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
  };
}

// ---- skips ----

test("runKanbanCheck skips when OPENAI_API_KEY is not configured", async () => {
  const db = tempDb();
  const result = await runKanbanCheck({ ...SUPABASE_CONFIG, openAiApiKey: "", dataFeedPath: "data.example.js" }, db);
  assert.equal(result.status, "skipped");
  assert.match(result.detail, /OPENAI_API_KEY/);
  db.close();
});

test("runKanbanCheck skips when Supabase credentials are not configured", async () => {
  const db = tempDb();
  const result = await runKanbanCheck({ openAiApiKey: "sk-xxx", supabaseUrl: "", supabaseServiceRoleKey: "", dataFeedPath: "data.example.js" }, db);
  assert.equal(result.status, "skipped");
  assert.match(result.detail, /Supabase/);
  db.close();
});

// ---- parse JSON response from model ----

test("runKanbanCheck returns ready status when model returns valid flagged items", async () => {
  const db = tempDb();
  const flagged = [
    { title: "Deploy stalled", detail: "Waiting for approval.", area: "vercel", priority: "P2", kanban_stage: "Waiting", expected_stage: "Done" }
  ];
  const result = await runKanbanCheck(
    { openAiApiKey: "sk-xxx", ...SUPABASE_CONFIG, dataFeedPath: "data.example.js" },
    db,
    { fetchImpl: openAiFetch(flagged) }
  );
  assert.equal(result.status, "ready");
  assert.equal(result.flagged, 1);
  assert.equal(result.inserted, 1);
  db.close();
});

test("runKanbanCheck returns ready with zero items when model returns empty array", async () => {
  const db = tempDb();
  const result = await runKanbanCheck(
    { openAiApiKey: "sk-xxx", ...SUPABASE_CONFIG, dataFeedPath: "data.example.js" },
    db,
    { fetchImpl: openAiFetch([]) }
  );
  assert.equal(result.status, "ready");
  assert.equal(result.flagged, 0);
  db.close();
});

test("runKanbanCheck returns error when model response cannot be parsed as JSON array", async () => {
  const db = tempDb();
  // The model returns prose inside the "answer" field instead of a JSON array
  const fetchImpl = async (url) => {
    if (String(url).includes("openai.com")) {
      const payload = { answer: "Sorry, I cannot help with that.", sources: [], followUps: [] };
      return new Response(JSON.stringify({
        output: [{ content: [{ text: JSON.stringify(payload) }] }]
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  };
  const result = await runKanbanCheck(
    { openAiApiKey: "sk-xxx", ...SUPABASE_CONFIG, dataFeedPath: "data.example.js" },
    db,
    { fetchImpl }
  );
  assert.equal(result.status, "error");
  assert.match(result.detail, /parse/i);
  db.close();
});

test("runKanbanCheck returns error when OpenAI call fails", async () => {
  const db = tempDb();
  const fetchImpl = async () => new Response(JSON.stringify({ error: { message: "rate limit" } }), { status: 429 });
  const result = await runKanbanCheck(
    { openAiApiKey: "sk-xxx", ...SUPABASE_CONFIG, dataFeedPath: "data.example.js" },
    db,
    { fetchImpl }
  );
  assert.equal(result.status, "error");
  db.close();
});

// ---- reconciliation: updates and resolves existing flags ----

test("runKanbanCheck updates an existing prescient task when title matches exactly", async () => {
  const db = tempDb();
  const calls = [];
  const existingId = "existing-uuid-1";

  const fetchImpl = async (url, opts) => {
    calls.push({ url: String(url), method: opts.method || "GET" });
    if (String(url).includes("openai.com")) {
      const payload = { answer: JSON.stringify([
        { title: "Deploy stalled", detail: "Still pending.", area: "vercel", priority: "P2" }
      ]), sources: [], followUps: [] };
      return new Response(JSON.stringify({
        output: [{ content: [{ text: JSON.stringify(payload) }] }]
      }), { status: 200 });
    }
    if (opts.method === "GET") {
      // Return one existing open row with a matching title
      return new Response(JSON.stringify([
        { id: existingId, title: "Deploy stalled", status: "open", flagged_by: "system" }
      ]), { status: 200 });
    }
    // PATCH
    return new Response(JSON.stringify([{ id: existingId }]), { status: 200 });
  };

  const result = await runKanbanCheck(
    { openAiApiKey: "sk-xxx", ...SUPABASE_CONFIG, dataFeedPath: "data.example.js" },
    db,
    { fetchImpl }
  );
  assert.equal(result.status, "ready");
  assert.equal(result.updated, 1);
  assert.equal(result.inserted, 0);
  db.close();
});

test("runKanbanCheck resolves previously flagged tasks not in new model output", async () => {
  const db = tempDb();
  const existingId = "stale-task-uuid";

  const fetchImpl = async (url, opts) => {
    if (String(url).includes("openai.com")) {
      const payload = { answer: JSON.stringify([
        { title: "New issue", detail: "Fresh flag.", area: "github", priority: "P3" }
      ]), sources: [], followUps: [] };
      return new Response(JSON.stringify({
        output: [{ content: [{ text: JSON.stringify(payload) }] }]
      }), { status: 200 });
    }
    if (opts.method === "GET") {
      return new Response(JSON.stringify([
        { id: existingId, title: "Old stale issue", status: "open", flagged_by: "system" }
      ]), { status: 200 });
    }
    // POST or PATCH
    return new Response(JSON.stringify([{ id: existingId }]), { status: 200 });
  };

  const result = await runKanbanCheck(
    { openAiApiKey: "sk-xxx", ...SUPABASE_CONFIG, dataFeedPath: "data.example.js" },
    db,
    { fetchImpl }
  );
  assert.equal(result.status, "ready");
  assert.equal(result.resolved, 1);
  assert.equal(result.inserted, 1);
  db.close();
});

// ---- test outlines for prescient tasks (red tests for new functionality) ----

test.todo("parseFlaggedItems tolerates stray markdown code fences around JSON array");
test.todo("parseFlaggedItems tolerates leading prose before JSON array");
test.todo("findExistingMatch uses token overlap for rephrased titles (>=2 shared tokens, >=0.5 Jaccard)");
test.todo("findExistingMatch prefers exact normalized match over fuzzy match");
test.todo("significantTokens filters out tokens shorter than 3 characters");
test.todo("runKanbanCheck does not resolve existing flags when model returns empty array");
