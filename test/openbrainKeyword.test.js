import test from "node:test";
import assert from "node:assert/strict";
import { hasKeywordSearchConfig, queryOpenBrainKeyword } from "../server/openbrainKeyword.js";

const BASE_CONFIG = {
  supabaseUrl: "https://example.supabase.co",
  supabaseServiceRoleKey: "service-role-key",
  openBrainMatchCount: 8
};

function jsonFetch(body, status = 200) {
  return async () => new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// ---- hasKeywordSearchConfig ----

test("hasKeywordSearchConfig returns false without credentials", () => {
  assert.equal(hasKeywordSearchConfig({}), false);
  assert.equal(hasKeywordSearchConfig({ supabaseUrl: "https://x.supabase.co" }), false);
  assert.equal(hasKeywordSearchConfig({ supabaseServiceRoleKey: "key" }), false);
});

test("hasKeywordSearchConfig returns true with url and service role key", () => {
  assert.equal(hasKeywordSearchConfig(BASE_CONFIG), true);
});

// ---- queryOpenBrainKeyword ----

test("queryOpenBrainKeyword returns empty for blank query", async () => {
  const result = await queryOpenBrainKeyword(BASE_CONFIG, "   ");
  assert.equal(result.status, "empty");
  assert.deepEqual(result.results, []);
});

test("queryOpenBrainKeyword returns not_configured without credentials", async () => {
  const result = await queryOpenBrainKeyword({}, "test query");
  assert.equal(result.status, "not_configured");
  assert.deepEqual(result.results, []);
});

test("queryOpenBrainKeyword calls search_wiki_keyword RPC and normalizes rows", async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, method: opts.method, body: JSON.parse(opts.body) });
    return new Response(JSON.stringify([
      { document_id: "doc-1", vault: "ops", path: "ops/runbook.md", title: "Runbook", snippet: "Deploy <b>procedure</b>", rank: 0.85 }
    ]), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const result = await queryOpenBrainKeyword(BASE_CONFIG, "deploy", { fetchImpl });
  assert.equal(result.status, "ready");
  assert.equal(result.results.length, 1);
  const [chunk] = result.results;
  assert.equal(chunk.id, "doc-1");
  assert.equal(chunk.vault, "ops");
  assert.equal(chunk.title, "Runbook");
  assert.equal(chunk.content, "Deploy procedure");
  assert.equal(chunk.similarity, 0.85);

  assert.equal(calls[0].method, "POST");
  assert.match(calls[0].url, /search_wiki_keyword/);
  assert.equal(calls[0].body.search_text, "deploy");
  assert.equal(calls[0].body.result_count, 8);
});

test("queryOpenBrainKeyword strips HTML highlight tags from snippets", async () => {
  const fetchImpl = jsonFetch([
    { document_id: "d1", vault: "v", path: "p", title: "T", snippet: "<b>bold</b> text &amp; more &lt;stuff&gt;", rank: 0.5 }
  ]);
  const result = await queryOpenBrainKeyword(BASE_CONFIG, "query", { fetchImpl });
  assert.equal(result.results[0].content, "bold text & more <stuff>");
});

test("queryOpenBrainKeyword returns empty status when RPC returns no rows", async () => {
  const result = await queryOpenBrainKeyword(BASE_CONFIG, "nothing", { fetchImpl: jsonFetch([]) });
  assert.equal(result.status, "empty");
  assert.deepEqual(result.results, []);
});

test("queryOpenBrainKeyword returns error when Supabase returns non-ok response", async () => {
  const result = await queryOpenBrainKeyword(BASE_CONFIG, "query", {
    fetchImpl: jsonFetch({ message: "relation does not exist" }, 400)
  });
  assert.equal(result.status, "error");
  assert.match(result.detail, /400/);
  assert.deepEqual(result.results, []);
});

test("queryOpenBrainKeyword returns error when fetch throws", async () => {
  const result = await queryOpenBrainKeyword(BASE_CONFIG, "query", {
    fetchImpl: async () => { throw new Error("network failure"); }
  });
  assert.equal(result.status, "error");
  assert.match(result.detail, /network failure/);
});

test("queryOpenBrainKeyword passes filter_vault option to RPC", async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push(JSON.parse(opts.body));
    return new Response(JSON.stringify([]), { status: 200 });
  };
  await queryOpenBrainKeyword(BASE_CONFIG, "query", { fetchImpl, filterVault: "personal" });
  assert.equal(calls[0].filter_vault, "personal");
});

test("queryOpenBrainKeyword clamps matchCount to valid range", async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push(JSON.parse(opts.body));
    return new Response(JSON.stringify([]), { status: 200 });
  };
  // Over max (20) is clamped to 20
  await queryOpenBrainKeyword(BASE_CONFIG, "query", { fetchImpl, matchCount: 999 });
  assert.equal(calls[0].result_count, 20);
  calls.length = 0;
  // Under min (1) but truthy — clamped to 1
  await queryOpenBrainKeyword(BASE_CONFIG, "query", { fetchImpl, matchCount: -5 });
  assert.equal(calls[0].result_count, 1);
  calls.length = 0;
  // 0 is falsy so falls through to DEFAULT_MATCH_COUNT (8)
  await queryOpenBrainKeyword(BASE_CONFIG, "query", { fetchImpl, matchCount: 0 });
  assert.equal(calls[0].result_count, 8);
});
