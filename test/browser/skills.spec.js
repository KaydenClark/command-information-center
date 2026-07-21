import { test, expect } from "@playwright/test";

const CATALOG = {
  source: "skills/README.md",
  checkedAt: "2026-07-21T12:00:00.000Z",
  status: "ok",
  detail: "Read-only skill catalog with per-entry provenance and canon-versus-deployed drift.",
  catalog: {
    path: "skills/README.md",
    status: "ok",
    detail: "Parsed 1 catalog entries.",
    reflectedAt: "2026-07-21T11:00:00.000Z"
  },
  deployed: {
    root: ".claude/skills",
    status: "ok",
    detail: "Read-only comparison of deployed SKILL.md bodies against canon.",
    reflectedAt: "2026-07-21T11:00:00.000Z"
  },
  entries: [
    {
      name: "ask-workbench",
      definition: "Route a situation to the smallest skill.",
      lane: "Native",
      availability: "Active",
      expectedDeployed: true,
      drift: "in_sync",
      source: "skills/README.md",
      canon: { path: "skills/ask-workbench/SKILL.md", reflectedAt: "2026-07-21T11:00:00.000Z" },
      deployed: { path: ".claude/skills/ask-workbench/SKILL.md", present: true, reflectedAt: "2026-07-21T11:00:00.000Z" }
    }
  ],
  counts: { total: 1, active: 1, pending: 0, inSync: 1, drifted: 0, missing: 0, deployedOnly: 0, unknown: 0, skippedRows: 0 }
};

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  page.__cicErrors = errors;
});

test.afterEach(async ({ page }) => {
  expect(page.__cicErrors).toEqual([]);
});

test("Skills view renders the one-row in-sync tracer bullet with freshness and drift badge", async ({ page }) => {
  await page.route("**/api/skills", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(CATALOG)
  }));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Command Information Center" })).toBeVisible();

  await page.getByRole("button", { name: "Skills" }).click();
  const view = page.getByTestId("skills-view");
  await expect(view.getByRole("heading", { name: "Skills" })).toBeVisible();

  // Exact catalog fields render through the whole stack for the one row.
  await expect(view.getByText("ask-workbench", { exact: true })).toBeVisible();
  await expect(view.getByText("Route a situation to the smallest skill.", { exact: true })).toBeVisible();
  await expect(view.getByText("Native", { exact: true })).toBeVisible();
  await expect(view.getByText("Active", { exact: true })).toBeVisible();
  await expect(view.getByTestId("skill-entry")).toHaveCount(1);
  await expect(view.getByTestId("skill-drift-badge")).toContainText("In sync");
  await expect(view.getByTestId("skill-freshness")).toBeVisible();

  // The panel stays inside the viewport on both desktop and iPhone layouts.
  const box = await view.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
});

test("Skills view fails closed with a visible unavailable state, never a silently empty catalog", async ({ page }) => {
  await page.route("**/api/skills", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      source: "skills/README.md",
      checkedAt: "2026-07-21T12:00:00.000Z",
      status: "unavailable",
      detail: "Canonical skill catalog is unavailable.",
      catalog: { path: "skills/README.md", status: "unavailable", detail: "Canonical skill catalog is unavailable.", reflectedAt: null },
      deployed: { root: ".claude/skills", status: "unknown", detail: "Catalog unavailable; deployment not evaluated.", reflectedAt: null },
      entries: [],
      counts: { total: 0, active: 0, pending: 0, inSync: 0, drifted: 0, missing: 0, deployedOnly: 0, unknown: 0, skippedRows: 0 }
    })
  }));
  await page.goto("/");
  await page.getByRole("button", { name: "Skills" }).click();
  const view = page.getByTestId("skills-view");
  await expect(view.getByText("Unavailable", { exact: true })).toBeVisible();
  await expect(view.getByTestId("skills-empty")).toContainText("unavailable");
  await expect(view.getByTestId("skill-entry")).toHaveCount(0);
});
