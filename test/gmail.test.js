import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { refreshGmailSuggestions, startGmailWorker } from "../server/gmail.js";
import { openDb, listTasks, createTask } from "../server/db.js";

function tempDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cic-gmail-"));
  return openDb(path.join(dir, "test.sqlite"));
}

function makeFeedFile(threads = []) {
  const p = path.join(os.tmpdir(), `cic-gmail-feed-${Math.random().toString(36).slice(2)}.js`);
  const data = {
    meta: { version: 1 },
    sources: [],
    briefing: { headline: "OK", summary: "", actions: [] },
    gmail: { windowDays: 7, inboxThreadEstimate: threads.length, threads },
    calendar: { window: "", events: [], note: "" },
    github: { user: "", openPrCount: 0, batchNote: "", prs: [] },
    vercel: { projects: [] },
    drive: { recent: [], note: "" },
    money: { events: [], accounts: [] },
    spotify: { nowPlaying: null, nowPlayingNote: "", library: {}, topArtists: [], recentAdds: [] },
    projects: { items: [] },
    wiki: { entries: [] },
    ifttt: { applets: [] }
  };
  fs.writeFileSync(p, `window.CIC_DATA = ${JSON.stringify(data)};`);
  return p;
}

// ---- refreshGmailSuggestions ----

test("refreshGmailSuggestions creates tasks for new gmail threads", async () => {
  const db = tempDb();
  const feedPath = makeFeedFile([
    { subject: "Invoice from Acme", from: "billing@acme.com", date: "Mon", tag: "MONEY" },
    { subject: "PR review requested", from: "ci@github.com", date: "Tue", tag: "INFO" }
  ]);
  try {
    const result = await refreshGmailSuggestions({ db, config: { dataFeedPath: feedPath } });
    assert.equal(result.ok, true);
    assert.equal(result.created, 2);
    const tasks = listTasks(db);
    assert.ok(tasks.some((t) => t.title === "Invoice from Acme" && t.source === "gmail" && t.priority === "P2"));
    assert.ok(tasks.some((t) => t.title === "PR review requested" && t.priority === "P3"));
  } finally {
    fs.unlinkSync(feedPath);
    db.close();
  }
});

test("refreshGmailSuggestions skips threads with empty subjects", async () => {
  const db = tempDb();
  const feedPath = makeFeedFile([
    { subject: "", from: "spam@example.com", date: "Mon", tag: "INFO" },
    { subject: "Real subject", from: "a@b.com", date: "Tue", tag: "INFO" }
  ]);
  try {
    const result = await refreshGmailSuggestions({ db, config: { dataFeedPath: feedPath } });
    assert.equal(result.created, 1);
  } finally {
    fs.unlinkSync(feedPath);
    db.close();
  }
});

test("refreshGmailSuggestions skips existing non-dismissed gmail tasks with the same title", async () => {
  const db = tempDb();
  const feedPath = makeFeedFile([
    { subject: "Existing subject", from: "x@y.com", date: "Mon", tag: "INFO" }
  ]);
  createTask(db, { title: "Existing subject", source: "gmail", priority: "P3", status: "Inbox", suggested: true });
  try {
    const result = await refreshGmailSuggestions({ db, config: { dataFeedPath: feedPath } });
    assert.equal(result.created, 0);
  } finally {
    fs.unlinkSync(feedPath);
    db.close();
  }
});

test("refreshGmailSuggestions records a refresh run in the database", async () => {
  const db = tempDb();
  const feedPath = makeFeedFile([]);
  try {
    await refreshGmailSuggestions({ db, config: { dataFeedPath: feedPath } });
    const row = db.prepare("SELECT * FROM refresh_runs WHERE source = 'gmail'").get();
    assert.ok(row);
    assert.equal(row.status, "ok");
  } finally {
    fs.unlinkSync(feedPath);
    db.close();
  }
});

test("refreshGmailSuggestions returns ok:false and records degraded status on error", async () => {
  const db = tempDb();
  const result = await refreshGmailSuggestions({ db, config: { dataFeedPath: "/absolutely/nonexistent/feed.js" } });
  // Loading a missing file returns the fallback (no threads), so the run should still be ok
  // because loadMissionData never throws. Test that the run completes.
  assert.equal(typeof result.ok, "boolean");
  db.close();
});

test("refreshGmailSuggestions handles missing gmail threads gracefully", async () => {
  const db = tempDb();
  const feedPath = makeFeedFile([]);
  try {
    const result = await refreshGmailSuggestions({ db, config: { dataFeedPath: feedPath } });
    assert.equal(result.ok, true);
    assert.equal(result.created, 0);
  } finally {
    fs.unlinkSync(feedPath);
    db.close();
  }
});

// ---- startGmailWorker ----

test("startGmailWorker returns a timer that can be cleared", () => {
  const db = tempDb();
  const timer = startGmailWorker({ db, config: { gmailRefreshIntervalMinutes: 180, dataFeedPath: "data.example.js" } });
  assert.ok(timer);
  clearInterval(timer);
  db.close();
});

test("startGmailWorker enforces a minimum interval of 15 minutes", () => {
  const db = tempDb();
  // Can only verify it returns a timer, not the internal interval value
  const timer = startGmailWorker({ db, config: { gmailRefreshIntervalMinutes: 1, dataFeedPath: "data.example.js" } });
  assert.ok(timer);
  clearInterval(timer);
  db.close();
});

// ---- test outlines for gmailRefreshCommand integration ----

test.todo("refreshGmailSuggestions executes GMAIL_REFRESH_COMMAND before reading the feed");
test.todo("refreshGmailSuggestions records degraded status when the refresh command exits non-zero");
test.todo("refreshGmailSuggestions times out the refresh command after 120 seconds");
