export function hasOpenAiConfig(config = {}) {
  return Boolean(config.openAiApiKey);
}

export async function generateOverviewWithOpenAI(config, context, openBrain, options = {}) {
  if (!hasOpenAiConfig(config)) {
    return { status: "not_configured", detail: "OPENAI_API_KEY is not configured." };
  }

  return callResponsesJson(config, {
    name: "cic_intelligence_overview",
    instructions: [
      "You generate concise, source-backed personal operating dashboard JSON.",
      "Use only the provided CIC and OpenBrain context.",
      "Do not invent connector data, account balances, health details, or exact facts not present in the context.",
      "Preserve source attribution on every insight."
    ].join(" "),
    payload: {
      task: "Build a current-state dashboard briefing with insights, anomalies, recent changes, chart specs, and suggested questions.",
      context,
      openBrain: trimOpenBrain(openBrain)
    },
    schema: overviewSchema()
  }, options);
}

export async function answerQuestionWithOpenAI(config, { question, area, context, openBrain }, options = {}) {
  if (!hasOpenAiConfig(config)) {
    return { status: "not_configured", detail: "OPENAI_API_KEY is not configured." };
  }

  return callResponsesJson(config, {
    name: "cic_intelligence_answer",
    instructions: [
      "Answer questions about the operator's personal operating data using only the supplied CIC feed and OpenBrain retrieval context.",
      "Be direct and practical. Include source references for every concrete claim.",
      "If the context is partial or unavailable, say that clearly."
    ].join(" "),
    payload: {
      task: "Answer the dashboard assistant question.",
      question,
      area: area || "all",
      context,
      openBrain: trimOpenBrain(openBrain)
    },
    schema: answerSchema()
  }, options);
}

async function callResponsesJson(config, { name, instructions, payload, schema }, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  try {
    const response = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.openAiApiKey}`
      },
      body: JSON.stringify({
        model: config.openAiModel || "gpt-5.4-mini",
        reasoning: { effort: config.openAiReasoningEffort || "low" },
        input: [
          { role: "system", content: instructions },
          { role: "user", content: JSON.stringify(payload) }
        ],
        text: {
          format: {
            type: "json_schema",
            name,
            strict: true,
            schema
          }
        }
      })
    });

    const body = await safeJson(response);
    if (!response.ok) {
      throw new Error(`OpenAI Responses ${response.status}: ${body?.error?.message || body?.error || response.statusText}`);
    }

    const text = extractOutputText(body);
    if (!text) throw new Error("OpenAI response did not include output text.");
    return {
      status: "ready",
      generatedBy: "openai",
      data: JSON.parse(text),
      responseId: body?.id || null,
      model: body?.model || config.openAiModel
    };
  } catch (error) {
    return {
      status: "error",
      detail: error instanceof Error ? error.message : "OpenAI synthesis failed."
    };
  }
}

function extractOutputText(body) {
  if (typeof body?.output_text === "string") return body.output_text;
  for (const item of body?.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") return content.text;
    }
  }
  return "";
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

function trimOpenBrain(openBrain) {
  return {
    status: openBrain?.status || "not_configured",
    detail: openBrain?.detail || "",
    results: (openBrain?.results || []).slice(0, 8).map((result) => ({
      title: result.title,
      vault: result.vault,
      path: result.path,
      content: result.content,
      similarity: result.similarity
    }))
  };
}

function overviewSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["briefing", "insights", "anomalies", "recentChanges", "charts", "suggestedQuestions"],
    properties: {
      briefing: {
        type: "object",
        additionalProperties: false,
        required: ["headline", "summary"],
        properties: {
          headline: { type: "string" },
          summary: { type: "string" }
        }
      },
      insights: {
        type: "array",
        items: insightSchema()
      },
      anomalies: {
        type: "array",
        items: anomalySchema()
      },
      recentChanges: {
        type: "array",
        items: anomalySchema()
      },
      charts: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "title", "type", "data"],
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            type: { type: "string", enum: ["bar", "line", "timeline"] },
            data: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["label", "value"],
                properties: {
                  label: { type: "string" },
                  value: { type: "number" }
                }
              }
            }
          }
        }
      },
      suggestedQuestions: {
        type: "array",
        items: { type: "string" }
      }
    }
  };
}

function answerSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["answer", "sources", "followUps"],
    properties: {
      answer: { type: "string" },
      sources: {
        type: "array",
        items: sourceSchema()
      },
      followUps: {
        type: "array",
        items: { type: "string" }
      }
    }
  };
}

function insightSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["id", "area", "title", "summary", "severity", "sources"],
    properties: {
      id: { type: "string" },
      area: { type: "string" },
      title: { type: "string" },
      summary: { type: "string" },
      severity: { type: "string", enum: ["P1", "P2", "P3"] },
      sources: {
        type: "array",
        items: sourceSchema()
      }
    }
  };
}

function anomalySchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["id", "title", "detail", "sources"],
    properties: {
      id: { type: "string" },
      title: { type: "string" },
      detail: { type: "string" },
      sources: {
        type: "array",
        items: sourceSchema()
      }
    }
  };
}

function sourceSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["id", "label", "source", "path", "similarity"],
    properties: {
      id: { type: "string" },
      label: { type: "string" },
      source: { type: "string" },
      path: { type: ["string", "null"] },
      similarity: { type: ["number", "null"] }
    }
  };
}
