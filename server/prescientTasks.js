// Data access for the prescient_tasks table, which lives in OpenBrain (Supabase)
// alongside the wiki knowledge base — not in CIC's local SQLite. The Intelligence
// Tab reads from here on load; the nightly kanban check (kanbanCheck.js) writes here.
//
// All access uses the Supabase secret/service-role key, which bypasses RLS, matching
// the openbrainClient.js pattern.

const SELECT_COLUMNS =
  "id,title,detail,area,status,priority,source_ids,kanban_stage,expected_stage,flagged_by,resolved_at,created_at,updated_at";

export function hasPrescientConfig(config = {}) {
  return Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
}

// Read for the /kb endpoint: everything not done, P1 first, freshest first, capped at 20.
export async function listPrescientTasks(config, options = {}) {
  if (!hasPrescientConfig(config)) {
    return { status: "not_configured", detail: "prescient_tasks requires Supabase server credentials.", tasks: [] };
  }
  try {
    const query = "status=neq.done&order=priority.asc,updated_at.desc&limit=20";
    const rows = await prescientRequest(config, "GET", query, null, options);
    return {
      status: "ready",
      detail: `Loaded ${rows.length} prescient task${rows.length === 1 ? "" : "s"}.`,
      tasks: rows
    };
  } catch (error) {
    return {
      status: "error",
      detail: error instanceof Error ? error.message : "Failed to load prescient tasks.",
      tasks: []
    };
  }
}

// Used by the kanban check to reconcile against what the system flagged previously.
export async function listSystemFlaggedOpen(config, options = {}) {
  const query = "flagged_by=eq.system&status=neq.done&order=updated_at.desc";
  return prescientRequest(config, "GET", query, null, options);
}

export async function insertPrescientTask(config, row, options = {}) {
  const rows = await prescientRequest(config, "POST", "", [row], options);
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function updatePrescientTask(config, id, patch, options = {}) {
  const rows = await prescientRequest(config, "PATCH", `id=eq.${encodeURIComponent(id)}`, patch, options);
  return Array.isArray(rows) ? rows[0] : rows;
}

async function prescientRequest(config, method, query, body, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const base = `${config.supabaseUrl.replace(/\/$/, "")}/rest/v1/prescient_tasks`;
  const url = query ? `${base}?${query}` : base;
  const headers = {
    apikey: config.supabaseServiceRoleKey,
    Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
    Accept: "application/json"
  };
  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
    headers.Prefer = "return=representation";
  } else {
    // PostgREST needs the select list on GET to scope returned columns.
    const sep = query ? "&" : "";
    return doFetch(fetchImpl, `${url}${sep}select=${SELECT_COLUMNS}`, { method, headers });
  }
  return doFetch(fetchImpl, url, { method, headers, body: body == null ? undefined : JSON.stringify(body) });
}

async function doFetch(fetchImpl, url, init) {
  const response = await fetchImpl(url, init);
  const payload = await safeJson(response);
  if (!response.ok) {
    throw new Error(`prescient_tasks ${response.status}: ${payload?.message || payload?.error || response.statusText}`);
  }
  return Array.isArray(payload) ? payload : payload ? [payload] : [];
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
