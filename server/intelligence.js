import express from "express";
import { loadMissionData } from "./dataFeed.js";
import { sha256 } from "./config.js";
import { listSourceStatus, upsertSources } from "./db.js";
import { queryOpenBrain } from "./openbrainClient.js";
import { queryOpenBrainKeyword } from "./openbrainKeyword.js";
import { listPrescientTasks } from "./prescientTasks.js";
import { answerQuestionWithOpenAI, generateOverviewWithOpenAI } from "./openaiSynthesisClient.js";
import {
  buildFallbackAnswer,
  buildFallbackOverview,
  normalizeDashboardContext,
  normalizeSourceStatus
} from "./sourceNormalizer.js";

// A generic, keyword-friendly query for the Intelligence Tab's knowledge feed.
// Used for the page-load reads only — no embedding, no GPT synthesis.
const KB_QUERY = "current state tasks projects";

export function createIntelligenceRouter({ db, config, fetchImpl = globalThis.fetch, now = () => Date.now() }) {
  const router = express.Router();

  // Overview synthesis is the only paid path on a normal dashboard mount, so it
  // is cached with a TTL keyed on the normalized context. A single-entry cache
  // is enough: when the feed changes the key changes and we re-synthesize.
  const overviewTtlMs = Number.isFinite(config.intelligenceTtlMs) ? config.intelligenceTtlMs : 30 * 60 * 1000;
  const autosynthEnabled = config.intelligenceAutosynth !== false;
  let overviewCache = null; // { key, payload, expiresAt }

  router.get("/sources", (req, res) => {
    const data = loadMissionData(config.dataFeedPath);
    upsertSources(db, data.sources || []);
    res.json({
      status: "ok",
      sources: normalizeSourceStatus({ data, sourceHealth: listSourceStatus(db), config }),
      generatedAt: new Date().toISOString()
    });
  });

  // The visible brief is synthesized from the current CIC feed and OpenBrain context.
  // If that service is unavailable, retain the deterministic local fallback instead
  // of exposing retrieval chunks directly in the UI.
  router.get("/overview", async (req, res) => {
    const force = parseForceRefresh(req.query);
    const data = loadMissionData(config.dataFeedPath);
    upsertSources(db, data.sources || []);
    const context = normalizeDashboardContext(data, listSourceStatus(db));
    const key = overviewCacheKey(context);

    // Serve a still-fresh cached synthesis unless the caller explicitly forces a
    // refresh. The cached copy keeps its original generatedAt so the UI stays
    // honest about when the synthesis actually ran.
    if (!force && overviewCache && overviewCache.key === key && now() < overviewCache.expiresAt) {
      return res.json({ ...overviewCache.payload, cached: true });
    }

    const openBrain = await queryOpenBrainKeyword(config, KB_QUERY, { fetchImpl });

    // Auto-on-mount synthesis can be turned off to guarantee zero OpenAI cost on
    // load: serve the deterministic fallback instead. A forced refresh remains an
    // explicit, user-initiated opt-in and still synthesizes below.
    if (!force && !autosynthEnabled) {
      return res.json({
        ...buildFallbackOverview(context, {
          openBrain,
          openAi: { status: "disabled", detail: "Auto-synthesis disabled (CIC_INTELLIGENCE_AUTOSYNTH=off). Use Refresh to synthesize on demand." },
          config
        }),
        autosynth: "off",
        cached: false
      });
    }

    const openAi = await generateOverviewWithOpenAI(config, context, openBrain, { fetchImpl });

    if (openAi.status === "ready") {
      const payload = {
        ...openAi.data,
        status: openBrain.status === "error" ? "partial" : "ready",
        generatedBy: "openai",
        generatedAt: new Date().toISOString(),
        cached: false,
        model: openAi.model,
        responseId: openAi.responseId,
        sourceStatus: normalizeSourceStatus({ data, sourceHealth: listSourceStatus(db), config, openBrain, openAi }),
        openBrain: {
          status: openBrain.status,
          count: openBrain.results?.length || 0,
          detail: openBrain.detail || ""
        },
        errors: openBrain.status === "error" ? [openBrain.detail] : []
      };
      overviewCache = { key, payload, expiresAt: now() + overviewTtlMs };
      return res.json(payload);
    }

    // Synthesis unavailable or failed: honest deterministic fallback, never cached.
    res.json({ ...buildFallbackOverview(context, { openBrain, openAi, config }), cached: false });
  });

  // Primary Intelligence Tab load: read OpenBrain knowledge chunks (keyword search)
  // and the open prescient tasks. Both are plain database reads, so this should
  // respond in well under a second with no OpenAI traffic.
  router.get("/kb", async (req, res) => {
    const [openBrain, prescient] = await Promise.all([
      queryOpenBrainKeyword(config, KB_QUERY, { fetchImpl }),
      listPrescientTasks(config, { fetchImpl })
    ]);
    res.json({
      kb: openBrain.results || [],
      tasks: prescient.tasks || [],
      generatedAt: new Date().toISOString(),
      openBrain: {
        status: openBrain.status,
        count: openBrain.results?.length || 0,
        detail: openBrain.detail || ""
      },
      prescient: {
        status: prescient.status,
        count: prescient.tasks?.length || 0,
        detail: prescient.detail || ""
      }
    });
  });

  router.post("/ask", async (req, res) => {
    const parsed = parseAskRequest(req.body || {});
    if (parsed.error) {
      return res.status(400).json({ error: parsed.error });
    }

    const data = loadMissionData(config.dataFeedPath);
    upsertSources(db, data.sources || []);
    const context = normalizeDashboardContext(data, listSourceStatus(db));
    const openBrain = await queryOpenBrain(config, parsed.question, { fetchImpl });
    const openAi = await answerQuestionWithOpenAI(config, {
      question: parsed.question,
      area: parsed.area,
      context,
      openBrain
    }, { fetchImpl });

    if (openAi.status === "ready") {
      return res.json({
        status: openBrain.status === "error" ? "partial" : "ready",
        generatedBy: "openai",
        answer: openAi.data.answer,
        area: parsed.area || "all",
        sources: openAi.data.sources,
        followUps: openAi.data.followUps,
        model: openAi.model,
        responseId: openAi.responseId,
        openBrain: {
          status: openBrain.status,
          count: openBrain.results?.length || 0,
          detail: openBrain.detail || ""
        }
      });
    }

    res.json(buildFallbackAnswer({
      question: parsed.question,
      area: parsed.area,
      context,
      openBrain,
      config
    }));
  });

  return router;
}

// Key the overview cache on the meaningful normalized context, ignoring the
// per-request source `updatedAt` churn that upsertSources rewrites on every load
// (otherwise the key would change every request and the cache would never hit).
function overviewCacheKey(context) {
  return sha256(JSON.stringify(context, (name, value) => (
    name === "updatedAt" || name === "updated_at" ? null : value
  )));
}

// A forced refresh bypasses both the TTL cache and the autosynth toggle.
// Accepts ?refresh / ?force with a truthy value (or a bare, valueless flag).
function parseForceRefresh(query = {}) {
  const raw = query.refresh ?? query.force;
  if (raw == null) return false;
  const value = String(Array.isArray(raw) ? raw[raw.length - 1] : raw).trim().toLowerCase();
  return value === "" || value === "1" || value === "true" || value === "yes";
}

function parseAskRequest(body) {
  if (typeof body.question !== "string" || !body.question.trim()) {
    return { error: "question must be a non-empty string" };
  }
  const question = body.question.trim();
  if (question.length > 1200) {
    return { error: "question must be 1200 characters or fewer" };
  }
  const area = body.area == null ? "" : String(body.area).trim().slice(0, 80);
  return { question, area };
}
