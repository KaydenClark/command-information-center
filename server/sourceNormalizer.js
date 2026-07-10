const PRIORITIES = ["P1", "P2", "P3"];
const DEFAULT_QUESTIONS = [
  "What changed recently across my data?",
  "What should I work on today?",
  "Which sources need attention?",
  "What evidence supports this briefing?"
];

export function normalizeDashboardContext(data = {}, sourceHealth = []) {
  const sources = Array.isArray(sourceHealth) && sourceHealth.length ? sourceHealth : data.sources || [];
  const actions = data.briefing?.actions || [];
  const gmailThreads = data.gmail?.threads || [];
  const moneyEvents = data.money?.events || [];
  const projects = data.projects?.items || [];

  return {
    meta: data.meta || {},
    briefing: {
      headline: data.briefing?.headline || "Command Information Center briefing unavailable.",
      summary: data.briefing?.summary || "",
      actions: actions.map((action) => ({
        title: action.title,
        detail: action.detail,
        priority: action.priority,
        due: action.due,
        sources: action.sources || [],
        money: Boolean(action.money)
      }))
    },
    sourceStatus: normalizeFeedSources(sources),
    metrics: {
      actionCount: actions.length,
      p1Count: actions.filter((action) => action.priority === "P1").length,
      degradedSourceCount: sources.filter((source) => source.status !== "online").length,
      inboxThreadEstimate: data.gmail?.inboxThreadEstimate || 0,
      openPrCount: data.github?.openPrCount || 0,
      moneyEventCount: moneyEvents.length,
      projectCount: projects.length
    },
    areas: {
      projects: projects.slice(0, 8),
      github: data.github || {},
      calendar: data.calendar || {},
      gmail: gmailThreads.slice(0, 12),
      finance: { events: moneyEvents, accounts: data.money?.accounts || [] },
      music: data.spotify || {},
      wiki: data.wiki || {},
      drive: data.drive || {}
    }
  };
}

export function normalizeSourceStatus({ data = {}, sourceHealth = [], config = {}, openBrain = null, openAi = null } = {}) {
  const seen = new Set();
  const feedSources = (sourceHealth.length ? sourceHealth : data.sources || []).map((source) => {
    seen.add(source.id);
    return {
      id: source.id,
      name: source.name || source.id,
      status: source.status || "unknown",
      detail: source.detail || "",
      updatedAt: source.updated_at || source.updatedAt || null
    };
  });

  const synthetic = [
    {
      id: "openbrain",
      name: "OPENBRAIN",
      status: openBrain?.status || (hasOpenBrainConfig(config) ? "configured" : "not_configured"),
      detail: openBrain?.detail || (hasOpenBrainConfig(config) ? "Retrieval adapter configured." : "Set QUERY_WIKI_URL + QUERY_WIKI_ACCESS_TOKEN or Supabase server credentials.")
    },
    {
      id: "openai",
      name: "OPENAI",
      status: openAi?.status || (config.openAiApiKey ? "configured" : "not_configured"),
      detail: openAi?.detail || (config.openAiApiKey ? `Responses model ${config.openAiModel || "gpt-5.4-mini"} configured server-side.` : "Set OPENAI_API_KEY to enable server-side synthesis.")
    }
  ].filter((source) => !seen.has(source.id));

  return [...feedSources, ...synthetic];
}

export function buildFallbackOverview(context, { openBrain = null, openAi = null, config = {} } = {}) {
  const actions = context.briefing.actions || [];
  const degradedSources = context.sourceStatus.filter((source) => source.status !== "online" && source.status !== "configured");
  const topActions = actions.slice(0, 3);

  return {
    status: "partial",
    generatedBy: "local",
    generatedAt: new Date().toISOString(),
    briefing: {
      headline: context.briefing.headline,
      summary: context.briefing.summary || "OpenAI synthesis is not configured, so CIC is showing a deterministic summary from the current local feed."
    },
    insights: [
      ...topActions.map((action, index) => ({
        id: `action-${index + 1}`,
        area: (action.sources?.[0] || "briefing").toLowerCase(),
        title: action.title,
        summary: action.detail || "No detail supplied.",
        severity: action.priority || "P3",
        sources: (action.sources || ["cic-briefing"]).map(sourceId)
      })),
      {
        id: "source-health",
        area: "connectors",
        title: degradedSources.length ? `${degradedSources.length} sources need attention` : "Configured sources are nominal",
        summary: degradedSources.length ? degradedSources.map((source) => `${source.name}: ${source.status}`).join("; ") : "CIC did not report degraded connector state in the current feed.",
        severity: degradedSources.length ? "P2" : "P3",
        sources: degradedSources.length ? degradedSources.map((source) => sourceId(source.id)) : [sourceId("cic-sources")]
      }
    ],
    anomalies: degradedSources.map((source) => ({
      id: `source-${source.id}`,
      title: `${source.name} is ${source.status}`,
      detail: source.detail || "No detail reported.",
      sources: [sourceId(source.id)]
    })),
    recentChanges: buildRecentChanges(context),
    charts: buildCharts(context),
    suggestedQuestions: DEFAULT_QUESTIONS,
    sourceStatus: normalizeSourceStatus({ sourceHealth: context.sourceStatus, config, openBrain, openAi }),
    openBrain: summarizeOpenBrain(openBrain),
    errors: [
      ...(config.openAiApiKey ? [] : ["OpenAI server-side synthesis is not configured."]),
      ...(hasOpenBrainConfig(config) ? [] : ["OpenBrain retrieval is not configured for CIC."]),
      ...(openBrain?.status === "error" ? [openBrain.detail] : []),
      ...(openAi?.status === "error" ? [openAi.detail] : [])
    ]
  };
}

export function buildFallbackAnswer({ question, area, context, openBrain = null, config = {} }) {
  const matchingAction = findMatchingAction(question, context.briefing.actions);
  const retrievalSources = (openBrain?.results || []).slice(0, 5).map((result) => ({
    id: result.chunk_id || result.id || `${result.vault || "wiki"}-${result.path || "result"}`,
    label: result.title || result.path || "OpenBrain result",
    source: result.vault ? `wiki:${result.vault}` : "openbrain",
    path: result.path || null,
    similarity: result.similarity ?? null
  }));
  const sources = [
    { id: "cic-briefing", label: "Current CIC briefing", source: "cic", path: null },
    ...retrievalSources
  ];

  const answerParts = [
    "Based on the current CIC feed,",
    matchingAction
      ? `the most relevant item is "${matchingAction.title}" (${matchingAction.priority || "priority not set"}). ${matchingAction.detail || ""}`
      : `${context.briefing.headline} ${context.briefing.summary || ""}`.trim()
  ];

  if (openBrain?.status === "ready" && retrievalSources.length) {
    answerParts.push(`OpenBrain returned ${retrievalSources.length} supporting source result${retrievalSources.length === 1 ? "" : "s"}.`);
  } else if (hasOpenBrainConfig(config) && openBrain?.status === "error") {
    answerParts.push(`OpenBrain retrieval could not be used: ${openBrain.detail}`);
  }

  return {
    status: "partial",
    generatedBy: "local",
    answer: answerParts.join(" ").replace(/\s+/g, " ").trim(),
    area: area || "all",
    sources,
    followUps: DEFAULT_QUESTIONS.filter((item) => item.toLowerCase() !== String(question).trim().toLowerCase()).slice(0, 3),
    openBrain: summarizeOpenBrain(openBrain)
  };
}

export function buildCharts(context) {
  const sourceCounts = countBy(context.sourceStatus, (source) => source.status || "unknown");
  const priorityCounts = countBy(context.briefing.actions || [], (action) => action.priority || "P3");
  const inboxCounts = countBy(context.areas.gmail || [], (thread) => thread.tag || "INFO");

  return [
    {
      id: "source-health",
      title: "Source Health",
      type: "bar",
      data: Object.entries(sourceCounts).map(([label, value]) => ({ label, value }))
    },
    {
      id: "action-priority",
      title: "Action Priority",
      type: "bar",
      data: PRIORITIES.map((label) => ({ label, value: priorityCounts[label] || 0 }))
    },
    {
      id: "inbox-categories",
      title: "Inbox Categories",
      type: "bar",
      data: Object.entries(inboxCounts).map(([label, value]) => ({ label, value })).slice(0, 6)
    }
  ];
}

function buildRecentChanges(context) {
  const changes = [];
  if (context.metrics.openPrCount) {
    changes.push({
      id: "github-prs",
      title: `${context.metrics.openPrCount} open PRs`,
      detail: context.areas.github.batchNote || "GitHub summary is available.",
      sources: [sourceId("github")]
    });
  }
  for (const entry of context.areas.wiki?.entries || []) {
    changes.push({
      id: `wiki-${entry.date}-${entry.title}`,
      title: entry.title,
      detail: entry.date,
      sources: [sourceId("wiki")]
    });
  }
  return changes.slice(0, 6);
}

function findMatchingAction(question, actions = []) {
  const queryWords = new Set(String(question).toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2));
  return actions
    .map((action) => ({
      action,
      score: String(`${action.title} ${action.detail} ${(action.sources || []).join(" ")}`)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => queryWords.has(word)).length
    }))
    .sort((a, b) => b.score - a.score)[0]?.action || actions[0] || null;
}

function countBy(items, getKey) {
  const result = {};
  for (const item of items || []) {
    const key = getKey(item);
    result[key] = (result[key] || 0) + 1;
  }
  return result;
}

function normalizeFeedSources(sources = []) {
  return sources.map((source) => ({
    id: source.id,
    name: source.name || source.id,
    status: source.status || "unknown",
    detail: source.detail || "",
    updatedAt: source.updated_at || source.updatedAt || null
  }));
}

function sourceId(id) {
  return {
    id,
    label: String(id).toUpperCase(),
    source: "cic",
    path: null
  };
}

function summarizeOpenBrain(openBrain) {
  if (!openBrain) return { status: "not_configured", count: 0, detail: "OpenBrain was not queried." };
  return {
    status: openBrain.status,
    count: openBrain.results?.length || 0,
    detail: openBrain.detail || ""
  };
}

function hasOpenBrainConfig(config = {}) {
  return Boolean(
    (config.queryWikiUrl && config.queryWikiAccessToken) ||
    (config.supabaseUrl && config.supabaseServiceRoleKey && config.openAiApiKey)
  );
}
