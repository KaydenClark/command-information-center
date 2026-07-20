import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer as createViteServer } from "vite";
import { buildHarnessFlow } from "../server/harnessFlow.js";

const NOW = new Date("2026-07-19T12:00:00Z");
let vite;
let HarnessFlowContent;

test.before(async () => {
  vite = await createViteServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  ({ HarnessFlowContent } = await vite.ssrLoadModule("/src/harnessFlow.jsx"));
});

test.after(async () => {
  await vite?.close();
});

function report({
  label = "Foundry",
  kind = "root",
  generatedAt = "2026-07-19T11:30:00Z",
  coverage
} = {}) {
  return {
    schemaVersion: 1,
    generatedAt,
    scope: { label, kind },
    setup: {
      controls: [
        {
          id: `${kind}-agents`,
          path: "AGENTS.md",
          kind: "instructions",
          bytes: 2048,
          sha256: "a".repeat(64),
          runtime: "RECEIPT"
        }
      ]
    },
    run: {
      receipt: { status: "present", reason: null },
      surface: { value: "codex", evidenceState: "RECEIPT" },
      model: { value: "reported-model", evidenceState: "USER_REPORTED" },
      stages: {
        available: { value: 7, evidenceState: "RECEIPT" },
        eligible: { value: 6, evidenceState: "RECEIPT" },
        shown: { value: 5, evidenceState: "RECEIPT" },
        consulted: { value: 4, evidenceState: "USER_REPORTED" },
        actedThrough: { value: 2, evidenceState: "RECEIPT" },
        checked: { value: null, evidenceState: "INACCESSIBLE" }
      }
    },
    coverage: coverage || {
      limits: { maxEntries: 100 },
      inspectedEntries: 44,
      inspectedBytes: 2048,
      exclusions: [],
      limitReached: false
    }
  };
}

function envelope(reports, options = {}) {
  return buildHarnessFlow({
    readExport: () => ({
      status: "ok",
      source: "harness-flow-export.json",
      reports
    }),
    now: () => NOW,
    ...options
  });
}

function render(props) {
  return renderToStaticMarkup(React.createElement(HarnessFlowContent, props));
}

test("React renders the fresh root flow in the required order and keeps evidence explicit", () => {
  const html = render({ envelope: envelope([report()]) });
  assert.match(html, /data-status="fresh"/);
  assert.match(html, /Source harness-flow-export\.json/);
  assert.match(html, /USER_REPORTED/);
  assert.match(html, /INACCESSIBLE/);
  const labels = [
    "Available",
    "Eligible",
    "Shown",
    "Consulted",
    "Acted through",
    "Checked",
    "Accepted"
  ];
  let previous = -1;
  for (const label of labels) {
    const index = html.indexOf(`<strong>${label}</strong>`);
    assert.ok(index > previous, `${label} must render after the prior stage`);
    previous = index;
  }
  assert.match(html, /A listed control is not proof it shaped a run/);
});

test("React renders stale, unavailable, and malformed report reasons without a fabricated flow", () => {
  const stale = render({
    envelope: envelope([report({ generatedAt: "2026-07-19T08:00:00Z" })])
  });
  assert.match(stale, /data-status="stale"/);
  assert.match(stale, /stale after 90 minutes/);
  assert.match(stale, /Root flow/);

  for (const state of ["unavailable", "malformed"]) {
    const current = buildHarnessFlow({
      readExport: () => ({
        status: state,
        source: "fixture.json",
        reason: `${state} fixture reason`
      }),
      now: () => NOW
    });
    const html = render({ envelope: current });
    assert.match(html, new RegExp(`data-status="${state}"`));
    assert.match(html, new RegExp(`${state} fixture reason`));
    assert.doesNotMatch(html, /Root flow/);
  }
});

test("React component drill-down renders coverage, exclusions, and partial-limit state", () => {
  const current = envelope([
    report(),
    report({
      label: "Command Information Center",
      kind: "component",
      coverage: {
        limits: { maxEntries: 100, maxBytes: 1048576 },
        inspectedEntries: 100,
        inspectedBytes: 1048576,
        exclusions: [
          { path: "dist", reason: "generated output" },
          { path: "data/cic.sqlite", reason: "runtime state" }
        ],
        limitReached: true
      }
    })
  ]);
  const html = render({
    envelope: current,
    selectedComponent: "Command Information Center-0"
  });
  assert.match(html, /Component drill-down/);
  assert.match(html, /limit reached — coverage is partial/);
  assert.match(html, /Exclusions \(2\)/);
  assert.match(html, /data\/cic\.sqlite/);
  assert.match(html, /runtime state/);
});
