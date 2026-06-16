import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { priorityForGmailTag, loadMissionData } from "../server/dataFeed.js";

test("priorityForGmailTag maps DEADLINE to P1", () => {
  assert.equal(priorityForGmailTag("DEADLINE"), "P1");
});

test("priorityForGmailTag maps HEALTH to P1", () => {
  assert.equal(priorityForGmailTag("HEALTH"), "P1");
});

test("priorityForGmailTag maps MONEY to P2", () => {
  assert.equal(priorityForGmailTag("MONEY"), "P2");
});

test("priorityForGmailTag maps all other tags to P3", () => {
  assert.equal(priorityForGmailTag("INFO"), "P3");
  assert.equal(priorityForGmailTag("WORK"), "P3");
  assert.equal(priorityForGmailTag(undefined), "P3");
  assert.equal(priorityForGmailTag(""), "P3");
});

test("loadMissionData returns fallback when file does not exist", () => {
  const result = loadMissionData("/nonexistent/path/data.js");
  assert.equal(result.briefing.headline, "Command Information Center data feed is unavailable.");
  assert.ok(Array.isArray(result.sources));
  assert.ok(Array.isArray(result.gmail.threads));
});

test("loadMissionData returns fallback with error source when file is invalid", () => {
  const p = path.join(os.tmpdir(), `cic-feed-${Math.random().toString(36).slice(2)}.js`);
  fs.writeFileSync(p, "this is not valid js }{{{");
  try {
    const result = loadMissionData(p);
    assert.ok(result.sources.some((s) => s.status === "offline"));
  } finally {
    fs.unlinkSync(p);
  }
});

test("loadMissionData returns CIC_DATA from a valid data file", () => {
  const p = path.join(os.tmpdir(), `cic-feed-${Math.random().toString(36).slice(2)}.js`);
  fs.writeFileSync(p, `
    window.CIC_DATA = {
      meta: { version: 1, generatedAt: "2026-01-01T00:00:00Z", generatedAtLocal: "now" },
      sources: [{ id: "github", name: "GITHUB", status: "online", detail: "" }],
      briefing: { headline: "All systems nominal.", summary: "", actions: [] },
      gmail: { windowDays: 7, inboxThreadEstimate: 0, threads: [] },
      calendar: { window: "", events: [], note: "" },
      github: { user: "test", openPrCount: 0, batchNote: "", prs: [] },
      vercel: { projects: [] },
      drive: { recent: [], note: "" },
      money: { events: [], accounts: [] },
      spotify: { nowPlaying: null, nowPlayingNote: "", library: {}, topArtists: [], recentAdds: [] },
      projects: { items: [] },
      wiki: { entries: [] },
      ifttt: { applets: [] }
    };
  `);
  try {
    const result = loadMissionData(p);
    assert.equal(result.briefing.headline, "All systems nominal.");
    assert.equal(result.sources[0].id, "github");
    assert.equal(result.meta.version, 1);
  } finally {
    fs.unlinkSync(p);
  }
});

test("loadMissionData enforces 1-second VM timeout on slow scripts", async () => {
  const p = path.join(os.tmpdir(), `cic-feed-${Math.random().toString(36).slice(2)}.js`);
  fs.writeFileSync(p, "while(true){}");
  try {
    const result = loadMissionData(p);
    assert.ok(result.sources.some((s) => s.status === "offline"), "should return error fallback for infinite loop");
  } finally {
    fs.unlinkSync(p);
  }
});
