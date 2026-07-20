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

test("intelligence ask sends the operator's actual question to OpenBrain", async () => {
  const calls = [];
  const question = "Which project needs my attention this week?";
  const { server, baseUrl } = await startTestServer({
    queryWikiUrl: "https://openbrain.example/query-wiki",
    queryWikiAccessToken: "test-token",
    fetchImpl: async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) });
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  });

  try {
    const response = await fetch(`${baseUrl}/api/intelligence/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://openbrain.example/query-wiki");
    assert.equal(calls[0].body.query, question);
    assert.notEqual(calls[0].body.query, "current state tasks projects");
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
