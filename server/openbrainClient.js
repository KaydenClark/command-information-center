const DEFAULT_MATCH_COUNT = 8;
const DEFAULT_MATCH_THRESHOLD = 0.2;

export function hasOpenBrainConfig(config = {}) {
  return Boolean(
    (config.queryWikiUrl && config.queryWikiAccessToken) ||
    (config.supabaseUrl && config.supabaseServiceRoleKey && config.openAiApiKey)
  );
}

export async function queryOpenBrain(config, query, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const cleanQuery = String(query || "").trim();
  if (!cleanQuery) {
    return { status: "empty", detail: "No query supplied.", results: [] };
  }
  if (!hasOpenBrainConfig(config)) {
    return { status: "not_configured", detail: "OpenBrain retrieval credentials are not configured.", results: [] };
  }

  try {
    if (config.queryWikiUrl && config.queryWikiAccessToken) {
      return await queryOpenBrainFunction(config, cleanQuery, fetchImpl, options);
    }
    return await queryOpenBrainSupabase(config, cleanQuery, fetchImpl, options);
  } catch (error) {
    return {
      status: "error",
      detail: error instanceof Error ? error.message : "OpenBrain retrieval failed.",
      results: []
    };
  }
}

async function queryOpenBrainFunction(config, query, fetchImpl, options) {
  const response = await fetchImpl(config.queryWikiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.queryWikiAccessToken}`
    },
    body: JSON.stringify({
      query,
      match_count: boundedMatchCount(options.matchCount ?? config.openBrainMatchCount),
      match_threshold: boundedThreshold(options.matchThreshold ?? config.openBrainMatchThreshold),
      filter_vault: options.filterVault ?? null
    })
  });

  const body = await safeJson(response);
  if (!response.ok) {
    throw new Error(`query-wiki ${response.status}: ${body?.error || body?.detail || response.statusText}`);
  }

  const results = Array.isArray(body?.results) ? body.results : [];
  return {
    status: results.length ? "ready" : "empty",
    detail: results.length ? `OpenBrain returned ${results.length} wiki chunks.` : "OpenBrain returned no matches.",
    results
  };
}

async function queryOpenBrainSupabase(config, query, fetchImpl, options) {
  const embedding = await embedQuery(config, query, fetchImpl);
  const endpoint = `${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/match_wiki_chunks`;
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.supabaseServiceRoleKey,
      Authorization: `Bearer ${config.supabaseServiceRoleKey}`
    },
    body: JSON.stringify({
      query_embedding: `[${embedding.join(",")}]`,
      match_count: boundedMatchCount(options.matchCount ?? config.openBrainMatchCount),
      filter_vault: options.filterVault ?? null,
      match_threshold: boundedThreshold(options.matchThreshold ?? config.openBrainMatchThreshold)
    })
  });

  const body = await safeJson(response);
  if (!response.ok) {
    throw new Error(`Supabase match_wiki_chunks ${response.status}: ${body?.message || body?.error || response.statusText}`);
  }

  const results = Array.isArray(body) ? body : [];
  return {
    status: results.length ? "ready" : "empty",
    detail: results.length ? `OpenBrain returned ${results.length} wiki chunks.` : "OpenBrain returned no matches.",
    results
  };
}

async function embedQuery(config, query, fetchImpl) {
  const response = await fetchImpl("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openAiApiKey}`
    },
    body: JSON.stringify({
      model: config.openAiEmbeddingModel || "text-embedding-3-small",
      input: query
    })
  });

  const body = await safeJson(response);
  if (!response.ok) {
    throw new Error(`OpenAI embeddings ${response.status}: ${body?.error?.message || body?.error || response.statusText}`);
  }
  const embedding = body?.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error("OpenAI returned an invalid embedding shape.");
  }
  return embedding;
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

function boundedThreshold(value) {
  const threshold = Number(value ?? DEFAULT_MATCH_THRESHOLD);
  if (!Number.isFinite(threshold)) return DEFAULT_MATCH_THRESHOLD;
  return Math.min(1, Math.max(0, threshold));
}
