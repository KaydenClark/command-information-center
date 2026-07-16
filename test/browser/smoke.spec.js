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
  await page.getByRole("button", { name: "Personal To-Dos" }).click();
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

test("mobile Deployments shows the read-only Workbench release candidate without an action control", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile candidate layout is the TK-001 browser seam.");

  await page.getByRole("button", { name: "Deployments" }).click();
  const card = page.getByTestId("workbench-release-card");
  await expect(card).toBeVisible();
  await expect(card.getByText("LLM Workbench", { exact: true })).toBeVisible();
  await expect(card.getByText("Read only", { exact: true })).toBeVisible();
  await expect(card.getByText("Passcode protection required", { exact: true })).toBeVisible();
  await expect(card.getByRole("button")).toHaveCount(0);

  const box = await card.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
});

test("mobile Deployments presents ready exact-SHA Auditor evidence without a merge control", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile ready-candidate layout is the TK-001 browser seam.");

  await page.route("**/api/captain/workbench-release", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      contractVersion: 1,
      readOnly: true,
      candidate: {
        repository: "KaydenClark/LLM_Workbench",
        sourceBranch: "integration",
        destinationBranch: "main",
        status: "ready",
        reason: null,
        mainSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        integrationSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        pullRequest: {
          number: 42,
          url: "https://github.com/KaydenClark/LLM_Workbench/pull/42",
          headSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          baseSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          mergeable: true
        },
        releaseGate: {
          id: 991,
          context: "gptos/workbench-release-gate",
          state: "success",
          sha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          evidenceUrl: "https://github.com/KaydenClark/LLM_Workbench/actions/runs/991",
          auditorSummary: "Auditor passed the exact integration SHA."
        },
        fingerprint: "cb7424103ffe6f2217f89cd3a63003a061f31c8330226cb99771bc2a800092bc"
      },
      latestOperation: null
    })
  }));

  await page.getByRole("button", { name: "Deployments" }).click();
  const card = page.getByTestId("workbench-release-card");
  await expect(card.getByText("Ready", { exact: true })).toBeVisible();
  await expect(card.getByText("Release evidence is current and exact-SHA bound.", { exact: true })).toBeVisible();
  await expect(card.getByText("Auditor passed the exact integration SHA.", { exact: false })).toBeVisible();
  await expect(card.getByText("cb7424103ffe", { exact: true })).toBeVisible();
  await expect(card.getByRole("link", { name: "Open audit evidence" })).toHaveAttribute(
    "href",
    "https://github.com/KaydenClark/LLM_Workbench/actions/runs/991"
  );
  await expect(card.getByRole("button")).toHaveCount(0);
});
