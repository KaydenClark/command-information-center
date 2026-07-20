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

test("Projects shows stable project and composite spec references without overflow", async ({ page }) => {
  const summary = {
    name: "Command Information Center",
    slug: "command-information-center",
    projectId: "P-005",
    updatedAt: "2026-07-17T12:00:00.000Z",
    brief: ["Number projects across the workspace."],
    counts: { ready: 1, inProgress: 0, blocked: 0, deferred: 0, done: 0 },
    decisionCount: 0,
    taskCount: 1,
    specCount: 1
  };
  await page.route("**/api/project-taskboards", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ projects: [summary] })
  }));
  await page.route("**/api/project-taskboards/command-information-center", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      ...summary,
      decisions: [],
      groups: { ready: [], inProgress: [], blocked: [], deferred: [], done: [] },
      legacyTaskCount: 0,
      dailyReceipt: {
        status: "current",
        date: "2026-07-20",
        specId: "S-009",
        slice: { id: "TK-001", title: "Render references", status: "ready" },
        progress: "Composite references are visible.",
        tests: "Browser smoke passed.",
        auditMedic: "Independent Auditor passed.",
        docs: "README updated.",
        recovery: "Remote checkpoint abcdef1234567890abcdef1234567890abcdef12 is pushed and clean.",
        next: "Verify the composite reference.",
        sourceUpdatedAt: "2026-07-20T12:00:00.000Z"
      },
      specs: [{
        id: "S-009",
        title: "Stable Project Numbers",
        status: "active",
        priority: "0",
        owner: "Codex",
        updated: "2026-07-17",
        description: "Give projects stable identities.",
        blockers: "none",
        latestEvent: "TK-001 claimed.",
        nextGate: "Verify the composite reference.",
        tickets: [{ id: "TK-001", title: "Render references", status: "ready", blockers: "none", proof: "pending" }]
      }]
    })
  }));

  await page.getByRole("button", { name: "Projects" }).click();
  await expect(page.getByTestId("project-taskboards").getByText("P-005", { exact: true }).first()).toBeVisible();
  await expect(page.getByTestId("portfolio-daily-receipts").locator(".portfolio-receipt-card")).toHaveCount(1);
  await expect(page.getByText("P-005/S-009", { exact: true })).toBeVisible();
  await expect(page.getByTestId("daily-slice-receipt")).toContainText("Today’s slice");
  await expect(page.getByTestId("daily-slice-receipt")).toContainText("Independent Auditor passed.");
  await expect(page.getByTestId("daily-slice-receipt")).toContainText("pushed and clean");
  await page.getByPlaceholder("Filter specs and tickets").fill("P-005/S-009");
  await expect(page.getByText("Stable Project Numbers", { exact: true })).toBeVisible();

  const board = page.getByTestId("project-taskboards");
  const box = await board.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  const specRowLayout = await page.getByTestId("spec-section").locator(".spec-row").evaluate((row) => {
    const section = row.closest(".spec-section");
    const status = row.querySelector(".task-status");
    const chevron = row.querySelector("svg");
    const sectionBox = section.getBoundingClientRect();
    return {
      rowScrollWidth: row.scrollWidth,
      sectionClientWidth: section.clientWidth,
      statusRight: status.getBoundingClientRect().right,
      chevronRight: chevron.getBoundingClientRect().right,
      sectionRight: sectionBox.right
    };
  });
  expect(specRowLayout.rowScrollWidth).toBeLessThanOrEqual(specRowLayout.sectionClientWidth);
  expect(specRowLayout.statusRight).toBeLessThanOrEqual(specRowLayout.sectionRight);
  expect(specRowLayout.chevronRight).toBeLessThanOrEqual(specRowLayout.sectionRight);
});

test("Projects keeps stale, future, and partial daily receipts visibly honest", async ({ page }) => {
  const projects = [
    { name: "Stale Project", slug: "stale-project", projectId: "P-101", receipt: { status: "stale", date: "2026-07-19", reason: "The latest project evidence is not from today." } },
    { name: "Future Project", slug: "future-project", projectId: "P-102", receipt: { status: "future", date: "2026-07-21", reason: "The latest project evidence is not from today." } },
    { name: "Partial Project", slug: "partial-project", projectId: "P-103", receipt: { status: "current", date: "2026-07-20", progress: "A partial result was recorded.", tests: "Not recorded", auditMedic: "Not recorded", docs: "Not recorded", recovery: "Not recorded" } }
  ];
  const summary = (project) => ({
    name: project.name,
    slug: project.slug,
    projectId: project.projectId,
    updatedAt: "2026-07-20T12:00:00.000Z",
    brief: [],
    counts: { ready: 0, inProgress: 0, blocked: 0, deferred: 0, done: 0 },
    decisionCount: 0,
    taskCount: 0,
    specCount: 0,
    dailyReceipt: { ...project.receipt, reason: project.receipt.reason || "", sourceUpdatedAt: "2026-07-20T12:00:00.000Z" }
  });
  await page.route("**/api/project-taskboards", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ projects: projects.map(summary) })
  }));
  await page.route("**/api/project-taskboards/*", (route) => {
    const slug = route.request().url().split("/").at(-1);
    const project = projects.find((candidate) => candidate.slug === slug);
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...summary(project),
        decisions: [],
        groups: { ready: [], inProgress: [], blocked: [], deferred: [], done: [] },
        legacyTaskCount: 0,
        specs: []
      })
    });
  });

  await page.getByRole("button", { name: "Projects" }).click();
  const cards = page.getByTestId("portfolio-daily-receipts").locator(".portfolio-receipt-card");
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toContainText("stale");
  await expect(cards.nth(1)).toContainText("future");
  await expect(cards.nth(2)).toContainText("current");
  await cards.nth(2).click();
  await expect(page.getByTestId("daily-slice-receipt")).toContainText("A partial result was recorded.");
  await expect(page.getByTestId("daily-slice-receipt").getByText("Not recorded")).toHaveCount(5);
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
