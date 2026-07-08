import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeDashboardContext,
  normalizeSourceStatus,
  buildFallbackOverview,
  buildFallbackAnswer,
  buildCharts
} from "../server/sourceNormalizer.js";

const SAMPLE_DATA = {
  meta: { version: 1, generatedAt: "2026-01-01T00:00:00Z", generatedAtLocal: "now" },
  sources: [
    { id: "github", name: "GITHUB", status: "online", detail: "" },
    { id: "vercel", name: "VERCEL", status: "degraded", detail: "timeout" }
  ],
  briefing: {
    headline: "Two open PRs need review.",
    summary: "Action needed.",
    actions: [
      { title: "Review PR #42", detail: "Critical fix.", priority: "P1", sources: ["github"], money: false },
      { title: "Check deploy", detail: "Prod deploy pending.", priority: "P2", sources: ["vercel"], money: false },
      { title: "Follow up on invoice", detail: "Due Friday.", priority: "P3", sources: ["finance"], money: true }
    ]
  },
  gmail: { windowDays: 7, inboxThreadEstimate: 5, threads: [
    { subject: "Invoice due", from: "billing@acme.com", date: "Mon", tag: "MONEY" },
    { subject: "PR review request", from: "ci@github.com", date: "Tue", tag: "INFO" }
  ] },
  calendar: { window: "this week", events: [], note: "" },
  github: { user: "dev", openPrCount: 2, batchNote: "2 PRs open", prs: [] },
  vercel: { projects: [] },
  drive: { recent: [], note: "" },
  money: { events: [{ id: "e1", title: "Invoice" }], accounts: [] },
  spotify: { nowPlaying: null, nowPlayingNote: "", library: {}, topArtists: [], recentAdds: [] },
  projects: { items: [{ id: "p1", title: "Project Alpha" }, { id: "p2", title: "Project Beta" }] },
  wiki: { entries: [{ date: "2026-01-01", title: "Deployment notes" }] },
  ifttt: { applets: [] }
};

// ---- normalizeDashboardContext ----

test("normalizeDashboardContext structures data into expected shape", () => {
  const ctx = normalizeDashboardContext(SAMPLE_DATA);
  assert.ok(ctx.meta);
  assert.ok(ctx.briefing.headline);
  assert.ok(Array.isArray(ctx.briefing.actions));
  assert.ok(ctx.metrics);
  assert.ok(ctx.areas);
  assert.ok(ctx.sourceStatus);
});

test("normalizeDashboardContext computes correct metrics", () => {
  const ctx = normalizeDashboardContext(SAMPLE_DATA);
  assert.equal(ctx.metrics.actionCount, 3);
  assert.equal(ctx.metrics.p1Count, 1);
  assert.equal(ctx.metrics.degradedSourceCount, 1);
  assert.equal(ctx.metrics.inboxThreadEstimate, 5);
  assert.equal(ctx.metrics.openPrCount, 2);
  assert.equal(ctx.metrics.moneyEventCount, 1);
  assert.equal(ctx.metrics.projectCount, 2);
});

test("normalizeDashboardContext prefers sourceHealth arg over data.sources", () => {
  const healthOverride = [{ id: "custom", name: "CUSTOM", status: "online", detail: "" }];
  const ctx = normalizeDashboardContext(SAMPLE_DATA, healthOverride);
  assert.ok(ctx.sourceStatus.some((s) => s.id === "custom"));
  assert.ok(!ctx.sourceStatus.some((s) => s.id === "github"));
});

test("normalizeDashboardContext limits gmail to 12 and projects to 8", () => {
  const data = {
    ...SAMPLE_DATA,
    gmail: { threads: Array.from({ length: 20 }, (_, i) => ({ subject: `Thread ${i}` })) },
    projects: { items: Array.from({ length: 12 }, (_, i) => ({ id: String(i), title: `P ${i}` })) }
  };
  const ctx = normalizeDashboardContext(data);
  assert.equal(ctx.areas.gmail.length, 12);
  assert.equal(ctx.areas.projects.length, 8);
});

test("normalizeDashboardContext handles missing optional fields gracefully", () => {
  const ctx = normalizeDashboardContext({});
  assert.ok(Array.isArray(ctx.briefing.actions));
  assert.equal(ctx.metrics.actionCount, 0);
});

// ---- normalizeSourceStatus ----

test("normalizeSourceStatus includes feed sources and synthetic openai/openbrain entries", () => {
  const sources = normalizeSourceStatus({ data: SAMPLE_DATA, config: {} });
  assert.ok(sources.some((s) => s.id === "github"));
  assert.ok(sources.some((s) => s.id === "openai"));
  assert.ok(sources.some((s) => s.id === "openbrain"));
});

test("normalizeSourceStatus marks openai as configured when key is present", () => {
  const sources = normalizeSourceStatus({ config: { openAiApiKey: "sk-xxx", openAiModel: "gpt-5.4-mini" } });
  const openai = sources.find((s) => s.id === "openai");
  assert.equal(openai.status, "configured");
});

test("normalizeSourceStatus marks openbrain as configured when query-wiki creds are present", () => {
  const sources = normalizeSourceStatus({
    config: { queryWikiUrl: "https://example.com", queryWikiAccessToken: "token" }
  });
  const ob = sources.find((s) => s.id === "openbrain");
  assert.equal(ob.status, "configured");
});

test("normalizeSourceStatus does not duplicate ids present in sourceHealth", () => {
  const sourceHealth = [{ id: "openai", name: "OPENAI", status: "custom", detail: "custom detail" }];
  const sources = normalizeSourceStatus({ sourceHealth, config: {} });
  const openaiEntries = sources.filter((s) => s.id === "openai");
  assert.equal(openaiEntries.length, 1);
});

// ---- buildFallbackOverview ----

test("buildFallbackOverview returns partial status with local generatedBy", () => {
  const ctx = normalizeDashboardContext(SAMPLE_DATA);
  const overview = buildFallbackOverview(ctx);
  assert.equal(overview.status, "partial");
  assert.equal(overview.generatedBy, "local");
  assert.ok(overview.generatedAt);
});

test("buildFallbackOverview includes top action items as insights", () => {
  const ctx = normalizeDashboardContext(SAMPLE_DATA);
  const overview = buildFallbackOverview(ctx);
  assert.ok(Array.isArray(overview.insights));
  const titles = overview.insights.map((i) => i.title);
  assert.ok(titles.includes("Review PR #42"));
});

test("buildFallbackOverview includes anomaly for each degraded source", () => {
  const ctx = normalizeDashboardContext(SAMPLE_DATA);
  const overview = buildFallbackOverview(ctx);
  const anomalyIds = overview.anomalies.map((a) => a.id);
  assert.ok(anomalyIds.some((id) => id.includes("vercel")));
});

test("buildFallbackOverview includes errors for missing AI config", () => {
  const ctx = normalizeDashboardContext(SAMPLE_DATA);
  const overview = buildFallbackOverview(ctx, { config: {} });
  assert.ok(overview.errors.some((e) => /OpenAI/.test(e)));
  assert.ok(overview.errors.some((e) => /OpenBrain/.test(e)));
});

test("buildFallbackOverview includes suggestedQuestions", () => {
  const ctx = normalizeDashboardContext(SAMPLE_DATA);
  const overview = buildFallbackOverview(ctx);
  assert.ok(Array.isArray(overview.suggestedQuestions));
  assert.ok(overview.suggestedQuestions.length > 0);
});

// ---- buildFallbackAnswer ----

test("buildFallbackAnswer includes cic-briefing as a source", () => {
  const ctx = normalizeDashboardContext(SAMPLE_DATA);
  const answer = buildFallbackAnswer({ question: "What is happening?", context: ctx });
  assert.ok(answer.sources.some((s) => s.id === "cic-briefing"));
});

test("buildFallbackAnswer returns partial local status", () => {
  const ctx = normalizeDashboardContext(SAMPLE_DATA);
  const answer = buildFallbackAnswer({ question: "What?", context: ctx });
  assert.equal(answer.status, "partial");
  assert.equal(answer.generatedBy, "local");
});

test("buildFallbackAnswer matches a briefing action for specific questions", () => {
  const ctx = normalizeDashboardContext(SAMPLE_DATA);
  const answer = buildFallbackAnswer({ question: "Tell me about the github PR review", context: ctx });
  assert.ok(answer.answer.includes("Review PR #42"));
});

test("buildFallbackAnswer includes OpenBrain retrieval sources when available", () => {
  const ctx = normalizeDashboardContext(SAMPLE_DATA);
  const openBrain = {
    status: "ready",
    detail: "2 results",
    results: [
      { chunk_id: "c1", title: "Wiki: Deploy", vault: "ops", path: "ops/deploy.md", similarity: 0.9 }
    ]
  };
  const answer = buildFallbackAnswer({ question: "Deploy process?", context: ctx, openBrain });
  assert.ok(answer.sources.some((s) => s.id === "c1"));
});

test("buildFallbackAnswer excludes the asked question from followUps", () => {
  const ctx = normalizeDashboardContext(SAMPLE_DATA);
  const question = "What changed recently across my data?";
  const answer = buildFallbackAnswer({ question, context: ctx });
  assert.ok(!answer.followUps.includes(question));
});

// ---- buildCharts ----

test("buildCharts returns source-health, action-priority, and inbox-categories charts", () => {
  const ctx = normalizeDashboardContext(SAMPLE_DATA);
  const charts = buildCharts(ctx);
  const ids = charts.map((c) => c.id);
  assert.ok(ids.includes("source-health"));
  assert.ok(ids.includes("action-priority"));
  assert.ok(ids.includes("inbox-categories"));
});

test("buildCharts source-health data reflects degraded count", () => {
  const ctx = normalizeDashboardContext(SAMPLE_DATA);
  const charts = buildCharts(ctx);
  const healthChart = charts.find((c) => c.id === "source-health");
  const degraded = healthChart.data.find((d) => d.label === "degraded");
  assert.ok(degraded && degraded.value >= 1);
});

test("buildCharts action-priority data always includes all three priority labels", () => {
  const ctx = normalizeDashboardContext(SAMPLE_DATA);
  const charts = buildCharts(ctx);
  const priorityChart = charts.find((c) => c.id === "action-priority");
  const labels = priorityChart.data.map((d) => d.label);
  assert.ok(labels.includes("P1"));
  assert.ok(labels.includes("P2"));
  assert.ok(labels.includes("P3"));
});
