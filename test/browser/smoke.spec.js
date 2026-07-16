import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.__cicErrors = errors;
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Command Information Center" })).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(page.__cicErrors).toEqual([]);
});

test("primary navigation, task lifecycle, and Intelligence partial state work", async ({ page }) => {
  await page.getByRole("button", { name: "Taskboard" }).click();
  const title = `Browser smoke ${Date.now()}`;
  await page.getByTestId("add-task-inbox").fill(title);
  await page.getByTestId("submit-task-inbox").click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: `Move ${title} right` }).click();
  await expect(page.getByTestId("column-today").getByText(title, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Intelligence" }).click();
  await expect(page.getByRole("heading", { name: "Personal Data Intelligence" })).toBeVisible();
  await expect(page.getByText("Ask a source-backed question.")).toBeVisible();
});

test("dashboard platform health remains usable at the project viewport", async ({ page }) => {
  const platformHealth = page.getByText("Personal Intelligence Platform", { exact: true });
  await expect(platformHealth).toBeVisible();
  await expect(page.getByText("contract", { exact: true })).toBeVisible();
  await expect(page.getByText("openbrain", { exact: true })).toBeVisible();
  await expect(page.getByText("cic", { exact: true })).toBeVisible();
  const box = await platformHealth.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  await page.getByRole("button", { name: "Refresh dashboard state" }).click();
  await expect(platformHealth).toBeVisible();
});

test("Deployments shows the canonical project release portfolio without overflow", async ({ page }) => {
  await page.route("**/api/project-deployments", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      source: "Projects/INDEX.md",
      checkedAt: "2026-07-16T23:30:00.000Z",
      status: "ok",
      detail: "Read-only local Git evidence; no fetch, deployment, or hosting-provider check was performed.",
      projects: [{
        name: "Alpha",
        repository: "example/alpha",
        status: "release_ready",
        detail: "1 staging commit not yet in release.",
        currentBranch: "Integration",
        releaseBranch: "main",
        stagingBranch: "Integration",
        releaseSha: "a".repeat(40),
        stagingSha: "b".repeat(40),
        aheadBy: 1,
        behindBy: 0,
        dirtyFiles: 0,
        checkedAt: "2026-07-16T23:30:00.000Z"
      }]
    })
  }));

  await page.getByRole("button", { name: "Deployments" }).click();
  await expect(page.getByRole("heading", { name: "Project Release Portfolio" })).toBeVisible();
  const card = page.getByTestId("project-deployment-alpha");
  await expect(card.getByText("Release ready", { exact: true })).toBeVisible();
  await expect(card.getByText("example/alpha", { exact: true })).toBeVisible();
  const box = await card.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
});
