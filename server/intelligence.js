import express from "express";
import { loadMissionData } from "./dataFeed.js";
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

export function createIntelligenceRouter({ db, config, fetchImpl = globalThis.fetch }) {
  const router = express.Router();

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
    const data = loadMissionData(config.dataFeedPath);
    upsertSources(db, data.sources || []);
    const context = normalizeDashboardContext(data, listSourceStatus(db));
    const openBrain = await queryOpenBrainKeyword(config, KB_QUERY, { fetchImpl });
    const openAi = await generateOverviewWithOpenAI(config, context, openBrain, { fetchImpl });

    if (openAi.status === "ready") {
      return res.json({
        ...openAi.data,
        status: openBrain.status === "error" ? "partial" : "ready",
        generatedBy: "openai",
        generatedAt: new Date().toISOString(),
        model: openAi.model,
        responseId: openAi.responseId,
        sourceStatus: normalizeSourceStatus({ data, sourceHealth: listSourceStatus(db), config, openBrain, openAi }),
        openBrain: {
          status: openBrain.status,
          count: openBrain.results?.length || 0,
          detail: openBrain.detail || ""
        },
        errors: openBrain.status === "error" ? [openBrain.detail] : []
      });
    }

    res.json(buildFallbackOverview(context, { openBrain, openAi, config }));
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
