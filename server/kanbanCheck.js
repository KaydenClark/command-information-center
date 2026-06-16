// Nightly kanban check.
//
// This is the ONLY place on the Intelligence path that calls OpenAI, and it runs in
// the background (scheduled from server/index.js) — never on a page load. It reads the
// current action items and project states from data.js, asks the model which look
// stalled or mis-staged, and persists the flagged items to prescient_tasks in OpenBrain.
// The Intelligence Tab then just reads those rows.

import { loadMissionData } from "./dataFeed.js";
import { answerQuestionWithOpenAI } from "./openaiSynthesisClient.js";
import {
  hasPrescientConfig,
  insertPrescientTask,
  listSystemFlaggedOpen,
  updatePrescientTask
} from "./prescientTasks.js";

const PRIORITIES = new Set(["P1", "P2", "P3"]);
const KANBAN_QUESTION =
  "Which tasks or projects appear stalled or in the wrong kanban stage based on this data? " +
  'Respond with ONLY a JSON array (no prose, no markdown fences) where each element is ' +
  '{"title": string, "detail": string, "area": string, "priority": "P1"|"P2"|"P3", ' +
  '"kanban_stage": string|null, "expected_stage": string|null}. ' +
  'Set "area" to the relevant domain (e.g. "github", "projects", "finance"), not "kanban". ' +
  "Use a short, stable title for each item so it can be matched across runs. " +
  "Return [] only if nothing is genuinely stalled or misplaced.";

export async function runKanbanCheck(config, db, options = {}) {
  if (!config.openAiApiKey) {
    return { status: "skipped", detail: "OPENAI_API_KEY is not configured." };
  }
  if (!hasPrescientConfig(config)) {
    return { status: "skipped", detail: "Supabase credentials for prescient_tasks are not configured." };
  }

  const data = loadMissionData(config.dataFeedPath);
  // Keep the prompt tight: only the action items and project states, nothing else.
  const context = {
    briefing: { actions: data.briefing?.actions || [] },
    areas: { projects: data.projects?.items || [] }
  };

  const openAi = await answerQuestionWithOpenAI(
    config,
    {
      question: KANBAN_QUESTION,
      area: "kanban",
      context,
      openBrain: { status: "skipped", detail: "Keyword/embedding retrieval not used for the kanban check.", results: [] }
    },
    options
  );

  if (openAi.status !== "ready") {
    return { status: "error", detail: openAi.detail || "OpenAI did not return a kanban assessment." };
  }

  const flagged = parseFlaggedItems(openAi.data?.answer);
  if (flagged === null) {
    // Couldn't parse — do NOT resolve existing flags off a bad read.
    return { status: "error", detail: "Could not parse the kanban assessment into flagged items." };
  }

  return reconcileFlags(config, flagged, options);
}

async function reconcileFlags(config, flagged, options) {
  const existing = await listSystemFlaggedOpen(config, options);
  const taken = new Set(); // existing row ids already matched this run

  let inserted = 0;
  let updated = 0;
  let resolved = 0;

  for (const item of flagged) {
    const title = String(item.title || "").trim();
    if (!title) continue;

    const patch = {
      detail: clip(item.detail, 4000),
      area: clip(item.area, 80) || null,
      priority: PRIORITIES.has(item.priority) ? item.priority : "P3",
      kanban_stage: clip(item.kanban_stage, 80) || null,
      expected_stage: clip(item.expected_stage, 80) || null,
      status: "open",
      flagged_by: "system"
    };

    // The model rephrases titles across runs ("dndclient merge choice" vs "merge
    // decision"), so match tolerantly to avoid spawning near-duplicate rows.
    const match = findExistingMatch(title, existing, taken);
    if (match) {
      taken.add(match.id);
      await updatePrescientTask(config, match.id, { ...patch, resolved_at: null }, options);
      updated += 1;
    } else {
      await insertPrescientTask(
        config,
        { title: clip(title, 200), ...patch, source_ids: dedupeStrings(item.source_ids || (item.area ? [item.area] : [])) },
        options
      );
      inserted += 1;
    }
  }

  // Anything we previously flagged that the model omits from a real assessment is no
  // longer stalled — resolve it. But only sweep when the model actually returned items:
  // an empty result is ambiguous (the LLM is non-deterministic and sometimes returns []
  // spuriously), and we don't want one quiet night to wipe legitimate open flags.
  if (flagged.length > 0) {
    const nowIso = new Date().toISOString();
    for (const row of existing) {
      if (taken.has(row.id)) continue;
      await updatePrescientTask(config, row.id, { status: "done", resolved_at: nowIso }, options);
      resolved += 1;
    }
  }

  return {
    status: "ready",
    detail: `Kanban check: ${inserted} new, ${updated} updated, ${resolved} resolved.`,
    flagged: flagged.length,
    inserted,
    updated,
    resolved
  };
}

// The model is asked for a bare JSON array, but tolerate stray prose or code fences.
function parseFlaggedItems(answer) {
  if (Array.isArray(answer)) return answer.filter(isObject);
  const text = String(answer || "").trim();
  if (!text) return [];

  const direct = tryParseArray(text);
  if (direct) return direct;

  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end > start) {
    const sliced = tryParseArray(text.slice(start, end + 1));
    if (sliced) return sliced;
  }
  return null;
}

function tryParseArray(text) {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.filter(isObject) : null;
  } catch {
    return null;
  }
}

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function normalizeKey(title) {
  return String(title || "").toLowerCase().replace(/\s+/g, " ").trim();
}

// Match a freshly-flagged title to an existing open row. Exact (normalized) match first,
// then fall back to significant-token overlap so re-phrasings collapse onto one row.
function findExistingMatch(title, existing, taken) {
  const key = normalizeKey(title);
  for (const row of existing) {
    if (!taken.has(row.id) && normalizeKey(row.title) === key) return row;
  }

  const tokens = significantTokens(title);
  if (!tokens.size) return null;
  let best = null;
  let bestScore = 0;
  for (const row of existing) {
    if (taken.has(row.id)) continue;
    const other = significantTokens(row.title);
    const shared = [...tokens].filter((t) => other.has(t)).length;
    const union = new Set([...tokens, ...other]).size;
    const score = union ? shared / union : 0;
    // Need real overlap (>=2 shared tokens) so short titles don't collide by accident.
    if (shared >= 2 && score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return bestScore >= 0.5 ? best : null;
}

function significantTokens(title) {
  return new Set(
    String(title || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 3)
  );
}

function clip(value, max) {
  if (value == null) return "";
  return String(value).slice(0, max);
}

function dedupeStrings(values) {
  return [...new Set((values || []).map((v) => String(v)).filter(Boolean))];
}
