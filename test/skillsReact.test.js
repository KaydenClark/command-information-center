import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer as createViteServer } from "vite";

let vite;
let SkillsContent;

test.before(async () => {
  vite = await createViteServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  ({ SkillsContent } = await vite.ssrLoadModule("/src/skills.jsx"));
});

test.after(async () => {
  await vite?.close();
});

function okPayload(overrides = {}) {
  return {
    source: "skills/README.md",
    checkedAt: "2026-07-21T11:58:00.000Z",
    status: "ok",
    detail: "Read-only skill catalog with per-entry provenance and canon-versus-deployed drift.",
    catalog: { path: "/canon/README.md", status: "ok", detail: "Parsed 1 catalog entries.", reflectedAt: "2026-07-21T10:00:00.000Z" },
    deployed: { root: "/deployed", status: "ok", detail: "Read-only comparison.", reflectedAt: "2026-07-21T09:00:00.000Z" },
    entries: [
      {
        name: "ask-workbench",
        definition: "Route a situation to the smallest skill.",
        lane: "Native",
        availability: "Active",
        expectedDeployed: true,
        drift: "in_sync",
        source: "skills/README.md",
        canon: { path: "/canon/ask-workbench/SKILL.md", reflectedAt: "2026-07-21T10:00:00.000Z" },
        deployed: { path: "/deployed/ask-workbench/SKILL.md", present: true, reflectedAt: "2026-07-21T09:00:00.000Z" }
      }
    ],
    counts: { total: 1, active: 1, pending: 0, inSync: 1, drifted: 0, missing: 0, deployedOnly: 0, unknown: 0, skippedRows: 0 },
    ...overrides
  };
}

test("SkillsContent renders the one-row in-sync happy path end to end", () => {
  const markup = renderToStaticMarkup(React.createElement(SkillsContent, { payload: okPayload() }));
  assert.match(markup, /ask-workbench/);
  assert.match(markup, /Route a situation to the smallest skill\./);
  assert.match(markup, /Native/);
  assert.match(markup, /Active/);
  assert.match(markup, /In sync/);
  assert.doesNotMatch(markup, /Unavailable/);
});

test("SkillsContent renders a visible unavailable state instead of a silently empty catalog", () => {
  const unavailable = {
    source: "skills/README.md",
    checkedAt: "2026-07-21T11:58:00.000Z",
    status: "unavailable",
    detail: "Canonical skill catalog is unavailable.",
    catalog: { path: "/canon/README.md", status: "unavailable", detail: "Canonical skill catalog is unavailable.", reflectedAt: null },
    deployed: { root: "/deployed", status: "unknown", detail: "Catalog unavailable; deployment not evaluated.", reflectedAt: null },
    entries: [],
    counts: { total: 0, active: 0, pending: 0, inSync: 0, drifted: 0, missing: 0, deployedOnly: 0, unknown: 0, skippedRows: 0 }
  };
  const markup = renderToStaticMarkup(React.createElement(SkillsContent, { payload: unavailable }));
  assert.match(markup, /Unavailable/);
  assert.match(markup, /skill catalog is currently unavailable/i);
});

test("SkillsContent surfaces a fetch error banner without throwing", () => {
  const markup = renderToStaticMarkup(React.createElement(SkillsContent, {
    payload: null,
    fetchError: "Request failed: 500"
  }));
  assert.match(markup, /Request failed: 500/);
});
