import crypto from "node:crypto";
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { projectRoot, getConfig, setEnvValue, sha256 } from "./config.js";
import { openDb, seedFromMissionData, listTasks, createTask, updateTask, dismissTask, listSourceStatus, listRefreshFreshness, upsertSources } from "./db.js";
import { loadMissionData } from "./dataFeed.js";
import { refreshGmailSuggestions } from "./gmail.js";
import { createIntelligenceRouter } from "./intelligence.js";
import { buildSpotifyAuthorizeUrl, controlSpotify, exchangeSpotifyCode, getSpotifyPlayer } from "./spotify.js";

const sessions = new Set();
const spotifyOAuthStates = new Map();
const SPOTIFY_STATE_TTL_MS = 10 * 60 * 1000;

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((part) => part.trim().split("=")).filter((pair) => pair[0]));
}

function authMiddleware(config) {
  return (req, res, next) => {
    if (!config.passcodeHash || req.path.startsWith("/api/auth/")) return next();
    const token = parseCookies(req.headers.cookie).mc_session;
    if (token && sessions.has(token)) return next();
    res.status(401).json({ error: "Passcode required." });
  };
}

export function createApp(overrides = {}) {
  const config = { ...getConfig(), ...overrides };
  const db = overrides.db || openDb(config.dbPath);
  const missionData = loadMissionData(config.dataFeedPath);
  seedFromMissionData(db, missionData);

  const app = express();
  app.locals.db = db;
  app.locals.config = config;
  app.locals.fetchImpl = overrides.fetchImpl || globalThis.fetch;
  app.use(express.json({ limit: "1mb" }));
  const privateAppAuth = authMiddleware(config);

  app.get("/api/auth/status", (req, res) => {
    const token = parseCookies(req.headers.cookie).mc_session;
    res.json({ authRequired: Boolean(config.passcodeHash), authenticated: !config.passcodeHash || sessions.has(token) });
  });

  app.post("/api/auth/login", (req, res) => {
    if (!config.passcodeHash) return res.json({ ok: true });
    if (sha256(req.body?.passcode || "") !== config.passcodeHash) {
      return res.status(401).json({ error: "Invalid passcode." });
    }
    const token = crypto.randomBytes(24).toString("hex");
    sessions.add(token);
    res.setHeader("Set-Cookie", `mc_session=${token}; HttpOnly; SameSite=Lax; Max-Age=604800; Path=/`);
    res.json({ ok: true });
  });

  app.post("/api/auth/logout", (req, res) => {
    const token = parseCookies(req.headers.cookie).mc_session;
    if (token) sessions.delete(token);
    res.setHeader("Set-Cookie", "mc_session=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/");
    res.json({ ok: true });
  });

  app.get("/auth/spotify/login", privateAppAuth, (req, res, next) => {
    try {
      if (!config.spotifyClientId || !config.spotifyClientSecret || !config.spotifyRedirectUri) {
        return res.status(503).send("Spotify client ID, client secret, and redirect URI are required in local .env.");
      }
      const state = crypto.randomBytes(16).toString("hex");
      spotifyOAuthStates.set(state, Date.now());
      res.redirect(buildSpotifyAuthorizeUrl(config, state));
    } catch (error) {
      next(error);
    }
  });

  app.get("/auth/spotify/callback", privateAppAuth, async (req, res, next) => {
    try {
      const state = String(req.query.state || "");
      const issuedAt = spotifyOAuthStates.get(state);
      spotifyOAuthStates.delete(state);
      if (!issuedAt || Date.now() - issuedAt > SPOTIFY_STATE_TTL_MS) {
        return res.status(400).send("Spotify authorization state expired. Start the connection again from Command Information Center.");
      }
      if (req.query.error) return res.status(400).send(`Spotify authorization failed: ${req.query.error}`);
      if (!req.query.code) return res.status(400).send("Spotify authorization code was missing.");

      const token = await exchangeSpotifyCode(config, String(req.query.code));
      if (token.refresh_token) {
        setEnvValue("SPOTIFY_REFRESH_TOKEN", token.refresh_token);
      }
      res.type("html").send(`
        <!doctype html>
        <html lang="en">
          <head><meta charset="utf-8"><title>Spotify Connected</title></head>
          <body style="font-family: system-ui; background: #0A0A0A; color: #F7F5F2; padding: 32px;">
            <h1>Spotify connected</h1>
            <p>Command Information Center can now read playback state and send play, pause, previous, and next commands.</p>
            <p><a style="color: #1ABCBD;" href="/">Return to Command Information Center</a></p>
          </body>
        </html>
      `);
    } catch (error) {
      next(error);
    }
  });

  app.use("/api", privateAppAuth);
  app.use("/api/intelligence", createIntelligenceRouter({ db, config, fetchImpl: app.locals.fetchImpl }));

  app.get("/api/state", async (req, res) => {
    const data = loadMissionData(config.dataFeedPath);
    upsertSources(db, data.sources || []);
    const sourceHealth = listSourceStatus(db);
    const spotify = await getSpotifyPlayer(config).catch((error) => ({
      ok: false,
      degraded: true,
      detail: error.message,
      player: null
    }));
    res.json({
      dashboard: data,
      tasks: listTasks(db),
      sourceHealth,
      refreshFreshness: listRefreshFreshness(db),
      spotify,
      atlas: {
        configuredUrl: config.atlasUrl
      },
      settings: {
        lanHost: `${req.hostname}:${config.port}`,
        authRequired: Boolean(config.passcodeHash),
        gmailRefreshIntervalMinutes: config.gmailRefreshIntervalMinutes
      },
      refreshedAt: new Date().toISOString()
    });
  });

  app.post("/api/tasks", (req, res, next) => {
    try {
      res.status(201).json(createTask(db, req.body || {}));
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/tasks/:id", (req, res, next) => {
    try {
      res.json(updateTask(db, req.params.id, req.body || {}));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/tasks/:id/dismiss", (req, res, next) => {
    try {
      res.json(dismissTask(db, req.params.id));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/refresh/gmail", async (req, res) => {
    const result = await refreshGmailSuggestions({ db, config });
    res.status(result.ok ? 200 : 503).json({
      ...result,
      source: "gmail",
      freshness: listRefreshFreshness(db).gmail
    });
  });

  app.get("/api/spotify/player", async (req, res) => {
    res.json(await getSpotifyPlayer(config));
  });

  app.post("/api/spotify/control", async (req, res, next) => {
    try {
      res.json(await controlSpotify(config, req.body?.action));
    } catch (error) {
      next(error);
    }
  });

  app.use("/api", (req, res) => {
    res.status(404).json({ error: "API route not found." });
  });

  const distPath = path.join(projectRoot, "dist");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get(/.*/, (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.use((error, req, res, next) => {
    res.status(error.status || 500).json({ error: error.message || "Unexpected error." });
  });

  return app;
}
