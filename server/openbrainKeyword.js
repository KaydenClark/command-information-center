// Keyword-only OpenBrain retrieval for the Intelligence Tab page load.
//
// This is a pure database read: it calls the Postgres full-text RPC
// `search_wiki_keyword` over the Supabase REST API. No OpenAI embedding and no
// GPT synthesis run here, so the Intelligence Tab can render instantly.
//
// The embedding-based `queryOpenBrain` in openbrainClient.js is left untouched —
// it still backs the on-demand /ask endpoint where an OpenAI call is expected.

const DEFAULT_MATCH_COUNT = 8;

export function hasKeywordSearchConfig(config = {}) {
  return Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
}

export async function queryOpenBrainKeyword(config, query, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const cleanQuery = String(query || "").trim();
  if (!cleanQuery) {
    return { status: "empty", detail: "No query supplied.", results: [] };
  }
  if (!hasKeywordSearchConfig(config)) {
    return {
      status: "not_configured",
      detail: "OpenBrain keyword search requires SUPABASE_URL + a Supabase secret/service-role key.",
      results: []
    };
  }

  try {
    const endpoint = `${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/search_wiki_keyword`;
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.supabaseServiceRoleKey,
        Authorization: `Bearer ${config.supabaseServiceRoleKey}`
      },
      body: JSON.stringify({
        search_text: cleanQuery,
        result_count: boundedMatchCount(options.matchCount ?? config.openBrainMatchCount),
        filter_vault: options.filterVault ?? null
      })
    });

    const body = await safeJson(response);
    if (!response.ok) {
      throw new Error(`Supabase search_wiki_keyword ${response.status}: ${body?.message || body?.error || response.statusText}`);
    }

    const rows = Array.isArray(body) ? body : [];
    const results = rows.map(normalizeKeywordRow);
    return {
      status: results.length ? "ready" : "empty",
      detail: results.length ? `OpenBrain returned ${results.length} wiki chunks.` : "OpenBrain returned no keyword matches.",
      results
    };
  } catch (error) {
    return {
      status: "error",
      detail: error instanceof Error ? error.message : "OpenBrain keyword search failed.",
      results: []
    };
  }
}

// search_wiki_keyword returns { document_id, vault, path, title, snippet, rank }.
// Normalize to the chunk shape the frontend and fallback builders expect.
function normalizeKeywordRow(row) {
  return {
    id: row.document_id || `${row.vault || "wiki"}-${row.path || "result"}`,
    chunk_id: row.document_id || null,
    title: row.title || row.path || "OpenBrain result",
    vault: row.vault || "",
    path: row.path || null,
    content: stripHighlight(row.snippet || ""),
    similarity: typeof row.rank === "number" ? row.rank : null
  };
}

// ts_headline wraps matches in <b>…</b> and HTML-escapes the surrounding text.
function stripHighlight(snippet) {
  return String(snippet)
    .replace(/<\/?b>/gi, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function safeJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

function boundedMatchCount(value) {
  const count = Number(value || DEFAULT_MATCH_COUNT);
  if (!Number.isInteger(count)) return DEFAULT_MATCH_COUNT;
  return Math.min(20, Math.max(1, count));
}
