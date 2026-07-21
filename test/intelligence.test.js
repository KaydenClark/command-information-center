import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "../server/app.js";
import { getConfig } from "../server/config.js";

async function startTestServer(overrides = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-intel-"));
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.js"),
    passcodeHash: "",
    port: 0,
    openAiApiKey: "",
    supabaseUrl: "",
    supabaseServiceRoleKey: "",
    queryWikiAccessToken: "",
    queryWikiUrl: "",
    ...overrides
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

function synthesizedOverviewBody() {
  return {
    briefing: { headline: "Cached priorities", summary: "A source-backed briefing." },
    insights: [],
    anomalies: [],
    recentChanges: [],
    charts: [],
    suggestedQuestions: ["What should I work on today?"]
  };
}

function countingOpenAi(counter) {
  return async (url) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    counter.calls += 1;
    return new Response(JSON.stringify({
      id: `resp_${counter.calls}`,
      model: "gpt-5.4-mini",
      output_text: JSON.stringify(synthesizedOverviewBody())
    }), { status: 200 });
  };
}

test("OpenAI synthesis defaults to the cheaper dashboard model", () => {
  const previousModel = process.env.OPENAI_MODEL;
  const previousReasoning = process.env.OPENAI_REASONING_EFFORT;
  delete process.env.OPENAI_MODEL;
  delete process.env.OPENAI_REASONING_EFFORT;

  try {
    const config = getConfig();
    assert.equal(config.openAiModel, "gpt-5.4-mini");
    assert.equal(config.openAiReasoningEffort, "low");
  } finally {
    if (previousModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = previousModel;
    if (previousReasoning === undefined) delete process.env.OPENAI_REASONING_EFFORT;
    else process.env.OPENAI_REASONING_EFFORT = previousReasoning;
  }
});

test("intelligence brief consumes the curated overview instead of raw knowledge chunks", () => {
  const source = fs.readFileSync(path.resolve("src/intelligence.jsx"), "utf8");

  assert.match(source, /api\("\/api\/intelligence\/overview"\)/);
  assert.doesNotMatch(source, /api\("\/api\/intelligence\/kb"\)/);
  assert.doesNotMatch(source, /OpenBrain Knowledge Feed/);
});

test("intelligence overview degrades cleanly without OpenAI or OpenBrain credentials", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const response = await fetch(`${baseUrl}/api/intelligence/overview`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "partial");
    assert.equal(body.generatedBy, "local");
    assert.ok(body.briefing.headline);
    assert.ok(Array.isArray(body.insights));
    assert.ok(body.insights.length > 0);
    assert.ok(Array.isArray(body.charts));
    assert.ok(body.charts.some((chart) => chart.id === "source-health"));
    assert.ok(body.suggestedQuestions.includes("What changed recently across my data?"));
    assert.ok(body.sourceStatus.some((source) => source.id === "openai" && source.status === "not_configured"));
    assert.ok(body.sourceStatus.some((source) => source.id === "openbrain" && source.status === "not_configured"));
  } finally {
    server.close();
  }
});

test("intelligence overview returns the configured synthesized briefing", async () => {
  const synthesized = {
    briefing: { headline: "Three priorities need attention", summary: "A concise source-backed briefing." },
    insights: [],
    anomalies: [],
    recentChanges: [],
    charts: [],
    suggestedQuestions: ["What should I work on today?"]
  };
  const { server, baseUrl } = await startTestServer({
    openAiApiKey: "test-key",
    fetchImpl: async (url) => {
      assert.equal(url, "https://api.openai.com/v1/responses");
      return new Response(JSON.stringify({
        id: "resp_test",
        model: "gpt-5.4-mini",
        output_text: JSON.stringify(synthesized)
      }), { status: 200 });
    }
  });
  try {
    const response = await fetch(`${baseUrl}/api/intelligence/overview`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "ready");
    assert.equal(body.generatedBy, "openai");
    assert.deepEqual(body.briefing, synthesized.briefing);
  } finally {
    server.close();
  }
});

test("intelligence synthesis cost controls read env with safe defaults", () => {
  const keys = ["CIC_INTELLIGENCE_TTL_MS", "CIC_INTELLIGENCE_AUTOSYNTH"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    delete process.env.CIC_INTELLIGENCE_TTL_MS;
    delete process.env.CIC_INTELLIGENCE_AUTOSYNTH;
    const defaults = getConfig();
    assert.equal(defaults.intelligenceTtlMs, 30 * 60 * 1000);
    assert.equal(defaults.intelligenceAutosynth, true);

    process.env.CIC_INTELLIGENCE_TTL_MS = "60000";
    process.env.CIC_INTELLIGENCE_AUTOSYNTH = "off";
    const overridden = getConfig();
    assert.equal(overridden.intelligenceTtlMs, 60000);
    assert.equal(overridden.intelligenceAutosynth, false);
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

test("intelligence overview caches the synthesized briefing within the TTL", async () => {
  const counter = { calls: 0 };
  const { server, baseUrl } = await startTestServer({
    openAiApiKey: "test-key",
    intelligenceTtlMs: 60_000,
    fetchImpl: countingOpenAi(counter)
  });
  try {
    const first = await (await fetch(`${baseUrl}/api/intelligence/overview`)).json();
    assert.equal(first.generatedBy, "openai");
    assert.equal(first.cached, false);

    const second = await (await fetch(`${baseUrl}/api/intelligence/overview`)).json();
    assert.equal(second.cached, true);
    assert.equal(second.generatedBy, "openai");
    // The cached copy keeps the ORIGINAL synthesis timestamp, so the UI can be honest.
    assert.equal(second.generatedAt, first.generatedAt);
    assert.deepEqual(second.briefing, first.briefing);
    assert.equal(counter.calls, 1, "the cached read must not spend a second OpenAI call");
  } finally {
    server.close();
  }
});

test("intelligence overview refresh=1 forces a fresh synthesis past the cache", async () => {
  const counter = { calls: 0 };
  const { server, baseUrl } = await startTestServer({
    openAiApiKey: "test-key",
    intelligenceTtlMs: 60_000,
    fetchImpl: countingOpenAi(counter)
  });
  try {
    await fetch(`${baseUrl}/api/intelligence/overview`);
    assert.equal(counter.calls, 1);

    const refreshed = await (await fetch(`${baseUrl}/api/intelligence/overview?refresh=1`)).json();
    assert.equal(refreshed.cached, false);
    assert.equal(refreshed.generatedBy, "openai");
    assert.equal(counter.calls, 2, "a forced refresh must bypass the cache and re-synthesize");
  } finally {
    server.close();
  }
});

test("intelligence overview re-synthesizes only after the TTL expires", async () => {
  const counter = { calls: 0 };
  let clock = 1_000;
  const { server, baseUrl } = await startTestServer({
    openAiApiKey: "test-key",
    intelligenceTtlMs: 5_000,
    intelligenceNow: () => clock,
    fetchImpl: countingOpenAi(counter)
  });
  try {
    await fetch(`${baseUrl}/api/intelligence/overview`);
    assert.equal(counter.calls, 1);

    clock += 4_000; // still inside the 5s TTL
    const stillCached = await (await fetch(`${baseUrl}/api/intelligence/overview`)).json();
    assert.equal(stillCached.cached, true);
    assert.equal(counter.calls, 1);

    clock += 2_000; // now past expiry
    const fresh = await (await fetch(`${baseUrl}/api/intelligence/overview`)).json();
    assert.equal(fresh.cached, false);
    assert.equal(counter.calls, 2);
  } finally {
    server.close();
  }
});

test("intelligence overview with autosynth disabled serves the deterministic fallback at zero OpenAI cost", async () => {
  const counter = { calls: 0 };
  const { server, baseUrl } = await startTestServer({
    openAiApiKey: "test-key",
    intelligenceAutosynth: false,
    fetchImpl: async () => {
      counter.calls += 1;
      return new Response("{}", { status: 200 });
    }
  });
  try {
    const body = await (await fetch(`${baseUrl}/api/intelligence/overview`)).json();
    assert.equal(body.generatedBy, "local");
    assert.equal(body.autosynth, "off");
    assert.equal(body.cached, false);
    assert.equal(body.status, "partial");
    assert.ok(Array.isArray(body.insights) && body.insights.length > 0);
    assert.equal(counter.calls, 0, "auto-on-mount synthesis must not call OpenAI when disabled");
  } finally {
    server.close();
  }
});

test("intelligence overview forced refresh still synthesizes even when autosynth is disabled", async () => {
  const counter = { calls: 0 };
  const { server, baseUrl } = await startTestServer({
    openAiApiKey: "test-key",
    intelligenceAutosynth: false,
    fetchImpl: countingOpenAi(counter)
  });
  try {
    const body = await (await fetch(`${baseUrl}/api/intelligence/overview?refresh=1`)).json();
    assert.equal(body.generatedBy, "openai");
    assert.equal(body.cached, false);
    assert.equal(counter.calls, 1, "an explicit refresh is opt-in and may synthesize");
  } finally {
    server.close();
  }
});

test("intelligence UI exposes a forced refresh that bypasses the overview cache", () => {
  const source = fs.readFileSync(path.resolve("src/intelligence.jsx"), "utf8");
  assert.match(source, /\/api\/intelligence\/overview\?refresh=1/);
  assert.match(source, /loadOverview\(true\)/);
});

test("intelligence ask validates question input", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const empty = await fetch(`${baseUrl}/api/intelligence/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: " " })
    });
    assert.equal(empty.status, 400);

    const tooLong = await fetch(`${baseUrl}/api/intelligence/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "x".repeat(1201) })
    });
    assert.equal(tooLong.status, 400);
  } finally {
    server.close();
  }
});

test("intelligence ask returns a source-backed local answer when AI is unavailable", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const response = await fetch(`${baseUrl}/api/intelligence/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "What should I work on today?", area: "projects" })
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "partial");
    assert.equal(body.generatedBy, "local");
    assert.ok(body.answer.includes("Based on the current CIC feed"));
    assert.ok(Array.isArray(body.sources));
    assert.ok(body.sources.some((source) => source.id === "cic-briefing"));
    assert.ok(body.followUps.length > 0);
  } finally {
    server.close();
  }
});

test("OpenBrain adapter reports unauthorized query-wiki responses", async () => {
  const { server, baseUrl } = await startTestServer({
    queryWikiUrl: "https://openbrain.example/query-wiki",
    queryWikiAccessToken: "test-token",
    fetchImpl: async () => new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 })
  });
  try {
    const response = await fetch(`${baseUrl}/api/intelligence/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "What does OpenBrain know about CIC?" })
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.openBrain.status, "error");
    assert.match(body.openBrain.detail, /401/);
  } finally {
    server.close();
  }
});
