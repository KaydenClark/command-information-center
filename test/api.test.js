import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createApp } from "../server/app.js";

async function startTestServer(overrides = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-"));
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash: "",
    port: 0,
    // Neutralize any real credentials from a local .env so tests stay hermetic.
    spotifyAccessToken: "",
    spotifyRefreshToken: "",
    spotifyClientId: "",
    spotifyClientSecret: "",
    gmailRefreshCommand: "",
    platformHealthReport: "",
    ...overrides
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

test("state returns dashboard data and seeded tasks", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const response = await fetch(`${baseUrl}/api/state`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.dashboard.meta);
    assert.ok(Array.isArray(body.tasks));
    assert.ok(body.tasks.length > 0);
    assert.deepEqual(body.atlas, { configuredUrl: "" });
    assert.equal(body.platformHealth.status, "not_configured");
  } finally {
    server.close();
  }
});

test("work-items route rebuilds and returns the FUID-primary SQLite projection", async () => {
  const projectionSources = [{
    key: "P-001",
    path: "/canonical/alpha",
    revision: "a".repeat(40),
    observedAt: "2026-08-18T12:00:00.000Z",
    status: "current",
    detail: "Fixture capture.",
    specs: [{
      fuid: "000001", alias: "P-001/S-001", title: "Alpha", status: "active",
      priority: "1", owner: "Codex", blockers: "none", nextGate: "Complete TK-001.",
      created: "2026-08-10", lastWorked: "2026-08-18",
      tickets: [{
        fuid: "000002", alias: "P-001/S-001/TK-001", title: "Ship alpha",
        status: "ready", blockers: "none", created: "2026-08-10", lastWorked: "2026-08-18"
      }]
    }]
  }];
  const { server, baseUrl } = await startTestServer({
    portfolioBuilder: () => ({ status: "ok", scopes: [], work: [], projectionSources }),
    projectionNow: () => "2026-08-18T12:05:00.000Z"
  });
  try {
    const response = await fetch(`${baseUrl}/api/work-items`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, "ok");
    assert.equal(body.specs[0].fuid, "000001");
    assert.equal(body.specs[0].tickets[0].alias, "P-001/S-001/TK-001");
    assert.equal(body.specs[0].tickets[0].column, "todo");
    assert.equal(body.sources[0].revision, "a".repeat(40));
  } finally {
    server.close();
  }
});

test("task lifecycle supports create, move, and dismiss", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const created = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Write release notes", priority: "P2", status: "Inbox" })
    });
    assert.equal(created.status, 201);
    const task = await created.json();
    assert.equal(task.status, "Inbox");

    const moved = await fetch(`${baseUrl}/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Write updated release notes",
        notes: "Verify changelog entries and links.",
        dueDate: "01/06/2026",
        priority: "P1",
        status: "Done"
      })
    });
    assert.equal(moved.status, 200);
    const updated = await moved.json();
    assert.equal(updated.title, "Write updated release notes");
    assert.equal(updated.notes, "Verify changelog entries and links.");
    assert.equal(updated.dueDate, "01/06/2026");
    assert.equal(updated.priority, "P1");
    assert.equal(updated.status, "Done");
    assert.ok(updated.completedAt);

    const dismissed = await fetch(`${baseUrl}/api/tasks/${task.id}/dismiss`, { method: "POST" });
    assert.equal(dismissed.status, 200);
  } finally {
    server.close();
  }
});

test("invalid task input fails closed", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const response = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "", status: "BadColumn" })
    });
    assert.equal(response.status, 400);
  } finally {
    server.close();
  }
});

test("unknown api routes return json instead of the app shell", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const response = await fetch(`${baseUrl}/api/intelligence/not-a-route`);
    assert.equal(response.status, 404);
    assert.match(response.headers.get("content-type") || "", /application\/json/);

    const body = await response.json();
    assert.equal(body.error, "API route not found.");
  } finally {
    server.close();
  }
});

// ---- auth routes ----

test("auth status reports not required when no passcode is configured", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const response = await fetch(`${baseUrl}/api/auth/status`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.authRequired, false);
    assert.equal(body.authenticated, true);
  } finally {
    server.close();
  }
});

test("auth status reports required and unauthenticated when passcode is configured", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-auth-"));
  const { sha256 } = await import("../server/config.js");
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash: sha256("secret"),
    port: 0
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    const response = await fetch(`${baseUrl}/api/auth/status`);
    const body = await response.json();
    assert.equal(body.authRequired, true);
    assert.equal(body.authenticated, false);
  } finally {
    server.close();
  }
});

test("auth login accepts the correct passcode and sets session cookie", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-auth-"));
  const { sha256 } = await import("../server/config.js");
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash: sha256("correct-pass"),
    port: 0
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: "correct-pass" })
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.ok(response.headers.get("set-cookie")?.includes("mc_session="));
  } finally {
    server.close();
  }
});

test("auth login rejects wrong passcode with 401", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-auth-"));
  const { sha256 } = await import("../server/config.js");
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash: sha256("correct-pass"),
    port: 0
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: "wrong-pass" })
    });
    assert.equal(response.status, 401);
  } finally {
    server.close();
  }
});

test("auth middleware blocks /api routes when passcode is set and no session", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-auth-"));
  const { sha256 } = await import("../server/config.js");
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash: sha256("secret"),
    port: 0
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    const response = await fetch(`${baseUrl}/api/state`);
    assert.equal(response.status, 401);
  } finally {
    server.close();
  }
});

test("auth middleware blocks Spotify OAuth routes when passcode is set and no session", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-auth-"));
  const { sha256 } = await import("../server/config.js");
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash: sha256("secret"),
    spotifyClientId: "client-id",
    spotifyClientSecret: "client-secret",
    spotifyRedirectUri: "http://127.0.0.1/auth/spotify/callback"
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  try {
    const login = await fetch(`http://127.0.0.1:${port}/auth/spotify/login`, { redirect: "manual" });
    assert.equal(login.status, 401);
    assert.deepEqual(await login.json(), { error: "Passcode required." });

    const callback = await fetch(`http://127.0.0.1:${port}/auth/spotify/callback?code=test&state=test`);
    assert.equal(callback.status, 401);
    assert.deepEqual(await callback.json(), { error: "Passcode required." });
  } finally {
    server.close();
  }
});

test("authenticated Spotify OAuth keeps callback state validation intact", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-auth-"));
  const { sha256 } = await import("../server/config.js");
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash: sha256("secret"),
    spotifyClientId: "client-id",
    spotifyClientSecret: "client-secret",
    spotifyRedirectUri: "http://127.0.0.1/auth/spotify/callback"
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    const auth = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: "secret" })
    });
    const cookie = auth.headers.get("set-cookie").split(";", 1)[0];
    const login = await fetch(`${baseUrl}/auth/spotify/login`, {
      headers: { Cookie: cookie },
      redirect: "manual"
    });
    assert.equal(login.status, 302);
    const state = new URL(login.headers.get("location")).searchParams.get("state");
    assert.ok(state);

    const callback = await fetch(`${baseUrl}/auth/spotify/callback?error=access_denied&state=${state}`, {
      headers: { Cookie: cookie }
    });
    assert.equal(callback.status, 400);
    assert.match(await callback.text(), /authorization failed: access_denied/i);
  } finally {
    server.close();
  }
});

test("auth logout clears the session cookie", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const response = await fetch(`${baseUrl}/api/auth/logout`, { method: "POST" });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.ok(response.headers.get("set-cookie")?.includes("Max-Age=0"));
  } finally {
    server.close();
  }
});

// ---- spotify routes ----

test("spotify player endpoint degrades when no token is configured", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const response = await fetch(`${baseUrl}/api/spotify/player`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.equal(body.degraded, true);
  } finally {
    server.close();
  }
});

test("spotify control endpoint returns 400 for unsupported action", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-spotify-"));
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash: "",
    spotifyAccessToken: "test-token",
    fetchImpl: async () => new Response(null, { status: 204 })
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    const response = await fetch(`${baseUrl}/api/spotify/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "shuffle" })
    });
    assert.equal(response.status, 400);
  } finally {
    server.close();
  }
});

test("spotify control sends play command to Spotify API", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-spotify-"));
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash: "",
    spotifyAccessToken: "live-token",
    spotifyAccessTokenExpiresAt: Date.now() + 3600_000
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  // controlSpotify uses globalThis.fetch directly (not the fetchImpl override which
  // is scoped to intelligence routes), so we intercept at the global level.
  // The mock must pass local-server calls through to the real fetch so the HTTP
  // request to the test server itself still works.
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    const urlStr = String(url);
    if (urlStr.includes("spotify.com")) {
      calls.push({ url: urlStr, method: opts?.method });
      return new Response(null, { status: 204 });
    }
    return originalFetch(url, opts);
  };
  try {
    const response = await fetch(`${baseUrl}/api/spotify/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "play" })
    });
    assert.equal(response.status, 200);
    assert.ok(calls.some((c) => c.url.includes("/me/player/play") && c.method === "PUT"));
  } finally {
    globalThis.fetch = originalFetch;
    server.close();
  }
});

// ---- gmail refresh route ----

test("gmail refresh endpoint returns ok result", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const response = await fetch(`${baseUrl}/api/refresh/gmail`, { method: "POST" });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(typeof body.created, "number");
  } finally {
    server.close();
  }
});

test("manual source update returns current attempt and success timestamps", async () => {
  const { server, baseUrl } = await startTestServer();
  try {
    const response = await fetch(`${baseUrl}/api/refresh/gmail`, { method: "POST" });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.source, "gmail");
    assert.equal(body.freshness.status, "ok");
    assert.match(body.freshness.lastAttemptAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.match(body.freshness.lastSuccessAt, /^\d{4}-\d{2}-\d{2}T/);

    const state = await fetch(`${baseUrl}/api/state`).then((result) => result.json());
    assert.equal(state.refreshFreshness.gmail.lastAttemptAt, body.freshness.lastAttemptAt);
  } finally {
    server.close();
  }
});

// ---- intelligence/sources and intelligence/kb routes ----

test("intelligence sources endpoint returns source list with openai and openbrain entries", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-intel-src-"));
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash: "",
    openAiApiKey: "",
    supabaseUrl: "",
    supabaseServiceRoleKey: ""
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    const response = await fetch(`${baseUrl}/api/intelligence/sources`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(Array.isArray(body.sources));
    assert.ok(body.sources.some((s) => s.id === "openai"));
    assert.ok(body.sources.some((s) => s.id === "openbrain"));
  } finally {
    server.close();
  }
});

test("intelligence kb endpoint returns tasks and openBrain fields", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-intel-kb-"));
  const app = createApp({
    dbPath: path.join(dir, "test.sqlite"),
    dataFeedPath: path.resolve("data.example.js"),
    passcodeHash: "",
    supabaseUrl: "",
    supabaseServiceRoleKey: ""
  });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    const response = await fetch(`${baseUrl}/api/intelligence/kb`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok("openBrain" in body);
    assert.ok("prescient" in body);
  } finally {
    server.close();
  }
});
