// S-022 TK-002: deterministic full-catalog fixture shared by the model,
// React SSR, and Playwright browser specs. It exercises the widened Skills
// view: multiple catalog entries in a fixed catalog order, every drift class,
// and both provenance sources (canonical `skills/README.md` catalog rows plus a
// deployed-only `.claude/skills/` folder). Frozen so ordering assertions stay
// deterministic across layers.

// Catalog order is intentionally NOT alphabetical so an ordering regression
// (e.g. an accidental sort) is caught.
export const FULL_CATALOG_ORDER = Object.freeze([
  "grilling",
  "ask-workbench",
  "make-it-so",
  "wayfinder",
  "orphan-skill"
]);

export function fullCatalogPayload(overrides = {}) {
  return {
    source: "skills/README.md",
    checkedAt: "2026-07-24T12:00:00.000Z",
    status: "ok",
    detail: "Read-only skill catalog with per-entry provenance and canon-versus-deployed drift.",
    catalog: {
      path: "skills/README.md",
      status: "ok",
      detail: "Parsed 4 catalog entries.",
      reflectedAt: "2026-07-24T11:00:00.000Z"
    },
    deployed: {
      root: ".claude/skills",
      status: "ok",
      detail: "Read-only comparison of deployed SKILL.md bodies against canon.",
      reflectedAt: "2026-07-24T11:00:00.000Z"
    },
    entries: [
      {
        name: "grilling",
        definition: "Question-at-a-time interview primitive.",
        lane: "Core rewrite",
        availability: "Active",
        expectedDeployed: true,
        drift: "in_sync",
        source: "skills/README.md",
        canon: { path: "skills/grilling/SKILL.md", reflectedAt: "2026-07-24T10:00:00.000Z" },
        deployed: { path: ".claude/skills/grilling/SKILL.md", present: true, reflectedAt: "2026-07-24T10:00:00.000Z" }
      },
      {
        name: "ask-workbench",
        definition: "Route a situation to the smallest skill.",
        lane: "Native",
        availability: "Active",
        expectedDeployed: true,
        drift: "drifted",
        source: "skills/README.md",
        canon: { path: "skills/ask-workbench/SKILL.md", reflectedAt: "2026-07-24T09:00:00.000Z" },
        deployed: { path: ".claude/skills/ask-workbench/SKILL.md", present: true, reflectedAt: "2026-07-23T09:00:00.000Z" }
      },
      {
        name: "make-it-so",
        definition: "Approved — build it and save it.",
        lane: "Native",
        availability: "Active",
        expectedDeployed: true,
        drift: "missing",
        source: "skills/README.md",
        canon: { path: "skills/make-it-so/SKILL.md", reflectedAt: "2026-07-24T08:00:00.000Z" },
        deployed: { path: ".claude/skills/make-it-so/SKILL.md", present: false, reflectedAt: null }
      },
      {
        name: "wayfinder",
        definition: "Reduce fog in large work.",
        lane: "Supporting rewrite",
        availability: "Pending rewrite",
        expectedDeployed: false,
        drift: "not_applicable",
        source: "skills/README.md",
        canon: { path: "skills/wayfinder/SKILL.md", reflectedAt: "2026-07-24T07:00:00.000Z" },
        deployed: null
      },
      {
        name: "orphan-skill",
        definition: null,
        lane: null,
        availability: null,
        expectedDeployed: false,
        drift: "deployed_only",
        source: ".claude/skills/",
        canon: null,
        deployed: { path: ".claude/skills/orphan-skill/SKILL.md", present: true, reflectedAt: "2026-07-24T06:00:00.000Z" }
      }
    ],
    counts: { total: 5, active: 3, pending: 1, inSync: 1, drifted: 1, missing: 1, deployedOnly: 1, unknown: 0, skippedRows: 0 },
    ...overrides
  };
}
