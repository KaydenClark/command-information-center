import { test, expect } from "@playwright/test";

const QUEUE = {
  generatedAt: "2026-07-20T12:00:00.000Z",
  projectCount: 2,
  counts: { decisions: 1, blockers: 1, total: 2 },
  items: [
    {
      id: "openbrain:S-007:decision",
      kind: "decision",
      project: "OpenBrain",
      projectSlug: "openbrain",
      projectId: "P-010",
      specId: "S-007",
      ticketId: "",
      title: "Choose the canonical vault-root model",
      decision: "Choose the canonical vault-root model",
      blocker: "",
      options: "Single whole-vault root / curated multi-root",
      recommendation: "Single whole-vault root",
      impact: "Determines the schema migration",
      nextGate: "Kayden selects the vault-root model",
      owner: "Kayden",
      action: { type: "open-project", projectSlug: "openbrain", specId: "S-007" }
    },
    {
      id: "command-information-center:S-005:spec",
      kind: "blocker",
      project: "Command Information Center",
      projectSlug: "command-information-center",
      projectId: "P-005",
      specId: "S-005",
      ticketId: "",
      title: "Private phone acceptance over Meshnet",
      decision: "Kayden opens the authenticated private CIC service from a phone over Meshnet.",
      blocker: "Owner Meshnet phone acceptance",
      options: "",
      recommendation: "",
      impact: "",
      nextGate: "Kayden opens the authenticated private CIC service from a phone over Meshnet.",
      owner: "Kayden (owner acceptance)",
      action: { type: "open-project", projectSlug: "command-information-center", specId: "S-005" }
    }
  ]
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

test("Awaiting You lists owner-gated items with exact decisions and a safe deep link", async ({ page }) => {
  await page.route("**/api/awaiting-you", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(QUEUE)
  }));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Command Information Center" })).toBeVisible();

  // Badge count reflects the queue total.
  await expect(page.getByTestId("awaiting-badge")).toHaveText("2");

  await page.getByRole("button", { name: "Awaiting You" }).click();
  const view = page.getByTestId("awaiting-you");
  await expect(view.getByRole("heading", { name: "Awaiting You" })).toBeVisible();

  // Exact decision and blocker text are quoted so nothing is reverse-engineered.
  await expect(view.getByText("Choose the canonical vault-root model", { exact: true })).toBeVisible();
  await expect(view.getByText("Single whole-vault root", { exact: true })).toBeVisible();
  await expect(view.getByText("Owner Meshnet phone acceptance", { exact: true })).toBeVisible();
  await expect(view.getByTestId("awaiting-item")).toHaveCount(2);

  // The queue stays inside the viewport on both desktop and iPhone layouts.
  const box = await view.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);

  // The one-tap action deep-links into the Projects view.
  await view.getByRole("button", { name: "Open in Projects" }).first().click();
  await expect(page.getByTestId("project-taskboards")).toBeVisible();
});

test("Awaiting You shows an honest empty state when nothing awaits the owner", async ({ page }) => {
  await page.route("**/api/awaiting-you", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ generatedAt: "2026-07-20T12:00:00.000Z", projectCount: 3, counts: { decisions: 0, blockers: 0, total: 0 }, items: [] })
  }));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Command Information Center" })).toBeVisible();

  // No badge is shown at zero.
  await expect(page.getByTestId("awaiting-badge")).toHaveCount(0);

  await page.getByRole("button", { name: "Awaiting You" }).click();
  await expect(page.getByTestId("awaiting-empty")).toContainText("Nothing is waiting on you.");
});
