import { test, expect } from "@playwright/test";

const PORTFOLIO = {
  status: "ok",
  detail: "Registry-backed read-only portfolio.",
  source: "GPT_OS + Projects/INDEX.md Active Portfolio Enrollment",
  checkedAt: "2026-08-18T20:00:00.000Z",
  scopes: [
    {
      id: "gpt-os", projectId: "GPT_OS", name: "GPT_OS", remote: "KaydenClark/GPT_OS", notes: "Master Producer Workspace.",
      next: { status: "ok", specId: "S-035", ticketId: "TK-003", title: "Rebuild the CIC Foundry control surface", state: "in-progress", nextGate: "Ship reviewed v1.0.1." },
      deployment: { status: "observed", repository: "KaydenClark/GPT_OS", observedRepository: "KaydenClark/GPT_OS", currentBranch: "integration", headSha: "a".repeat(40), dirtyFiles: 0, upstream: "origin/integration", aheadBy: 0, behindBy: 0, evidence: "declared_checkout", detail: "Branch read from declared checkout." },
      board: { updatedAt: "2026-08-18T20:00:00.000Z", counts: { ready: 1, inProgress: 1, blocked: 0, done: 4 }, specCount: 35, decisions: [] }
    },
    {
      id: "p-005", projectId: "P-005", name: "Command Information Center", remote: "KaydenClark/command-information-center", notes: "Interface Module producer.",
      next: { status: "ok", specId: "S-027", ticketId: "TK-002", title: "Deliver the Master Taskboard", state: "ready", nextGate: "Verify portfolio search." },
      deployment: { status: "observed", repository: "KaydenClark/command-information-center", observedRepository: "KaydenClark/command-information-center", currentBranch: "Integration", headSha: "b".repeat(40), dirtyFiles: 0, upstream: "origin/Integration", aheadBy: 0, behindBy: 0, evidence: "declared_checkout", detail: "Branch read from declared checkout." },
      board: { updatedAt: "2026-08-18T20:00:00.000Z", counts: { ready: 1, inProgress: 0, blocked: 1, done: 12 }, specCount: 14, decisions: [{ id: "D-027", decision: "Approve the operator surface", recommendation: "Inspect production." }] }
    },
    {
      id: "p-018", projectId: "P-018", name: "Foundry", remote: "KaydenClark/Foundry", notes: "Product checkout recovery pending.",
      next: { status: "unavailable", detail: "No local LLM Workbench selector is installed for this scope." },
      deployment: { status: "unavailable", repository: "KaydenClark/Foundry", observedRepository: null, currentBranch: null, headSha: null, dirtyFiles: null, upstream: null, aheadBy: null, behindBy: null, evidence: "none", detail: "Declared producer checkout is not present on this host." },
      board: null
    }
  ],
  work: [
    { scopeId: "gpt-os", projectId: "GPT_OS", projectName: "GPT_OS", specId: "S-035", ticketId: "TK-003", reference: "GPT_OS/S-035/TK-003", title: "Rebuild the CIC Foundry control surface", status: "in-progress", blockers: "none", priority: "0", owner: "Codex", freshness: "current", specTitle: "Foundry Reactivation", nextGate: "Ship reviewed v1.0.1.", updated: "2026-08-18", isNext: true },
    { scopeId: "p-005", projectId: "P-005", projectName: "Command Information Center", specId: "S-027", ticketId: "TK-002", reference: "P-005/S-027/TK-002", title: "Deliver the Master Taskboard", status: "ready", blockers: "none", priority: "0", owner: "Codex", freshness: "current", specTitle: "Foundry Control Surface v1.0.1", nextGate: "Verify portfolio search.", updated: "2026-08-18", isNext: true },
    { scopeId: "p-005", projectId: "P-005", projectName: "Command Information Center", specId: "S-027", ticketId: "TK-004", reference: "P-005/S-027/TK-004", title: "Embed the live Schematic", status: "blocked", blockers: "TK-002", priority: "0", owner: "Codex", freshness: "current", specTitle: "Foundry Control Surface v1.0.1", nextGate: "Complete Master Taskboard.", updated: "2026-08-18", isNext: false }
  ],
  projection: {
    status: "ok",
    source: "SQLite Work-item Projection; canonical repositories remain authoritative",
    refresh: { fuid: "00000A", completedAt: "2026-08-18T20:00:00.000Z", sourceCount: 2, itemCount: 5, outcome: "ok" },
    sources: [
      { key: "GPT_OS", path: "/canonical/gpt-os", revision: "a".repeat(40), status: "current" },
      { key: "P-005", path: "/canonical/cic", revision: "b".repeat(40), status: "current" }
    ],
    specs: [{
      fuid: "000001", sourceKey: "GPT_OS", alias: "GPT_OS/S-035", title: "Foundry Reactivation", status: "active", created: "2026-08-10", lastWorked: "2026-08-18",
      tickets: [{ fuid: "000002", alias: "GPT_OS/S-035/TK-003", title: "Rebuild the CIC Foundry control surface", status: "in-progress", column: "inProgress", created: "2026-08-10", lastWorked: "2026-08-18", blockers: "none", sourceRevision: "a".repeat(40), pendingIntent: null }]
    }, {
      fuid: "000003", sourceKey: "P-005", alias: "P-005/S-027", title: "Foundry Control Surface v1.0.1", status: "active", created: "2026-08-11", lastWorked: "2026-08-18",
      tickets: [
        { fuid: "000004", alias: "P-005/S-027/TK-002", title: "Deliver the Master Taskboard", status: "ready", column: "todo", created: "2026-08-11", lastWorked: "2026-08-18", blockers: "none", sourceRevision: "b".repeat(40), pendingIntent: null },
        { fuid: "000005", alias: "P-005/S-027/TK-004", title: "Embed the live Schematic", status: "blocked", column: "blocked", created: "2026-08-11", lastWorked: "2026-08-17", blockers: "TK-002", sourceRevision: "b".repeat(40), pendingIntent: null }
      ]
    }]
  }
};

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  page.__cicErrors = errors;
  await page.route("**/api/foundry-portfolio", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PORTFOLIO) }));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Command Information Center" })).toBeVisible();
});

test.afterEach(async ({ page }) => {
  expect(page.__cicErrors).toEqual([]);
});

test("v1.0.1 command deck and every primary Foundry tab render without horizontal overflow", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Command Deck" })).toBeVisible();
  await expect(page.getByText("GPT_OS", { exact: true }).first()).toBeVisible();
  const tabs = [
    ["Awaiting You", "Awaiting You"],
    ["Foundry Intelligence", "Foundry Intelligence"],
    ["Steward's Summary", "Steward's Summary"],
    ["Master Taskboard", "Master Taskboard"],
    ["Scheduling", "Scheduling"],
    ["Projects", "Projects"],
    ["Deployments", "Deployments"],
    ["Foundry", "Foundry"]
  ];
  for (const [button, heading] of tabs) {
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(page.getByRole("heading", { name: heading, exact: true }).first()).toBeVisible();
    const layout = await page.locator(".view-stack").evaluate((node) => ({ scroll: node.scrollWidth, client: node.clientWidth }));
    expect(layout.scroll).toBeLessThanOrEqual(layout.client + 1);
  }
  await expect(page.getByText("Projection boundary", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Operational Mirror")).toContainText("Activation state");
  await expect(page.getByLabel("Operational Mirror")).toContainText("Unavailable");
  await expect(page.locator('iframe[title="Live Foundry Schematic"]')).toBeVisible();
  await expect(page.getByText("FUTURE CAPABILITY", { exact: true })).toBeVisible();
});

test("Personal shelf keeps summarized email monitoring reachable without joining Foundry navigation", async ({ page }) => {
  const mobile = await page.locator(".mobile-tabs").isVisible();
  await expect(page.locator(mobile ? ".mobile-nav-divider" : ".nav-section-label")).toHaveText("Personal");
  await page.getByRole("button", { name: "Inbox", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Inbox", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh Gmail", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Finance", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Finance", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Music", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Spotify Atlas", exact: true })).toBeVisible();
});

test("Master Taskboard groups FUID work under Specs and drag creates pending Intent without moving Canon", async ({ page }) => {
  let portfolio = structuredClone(PORTFOLIO);
  await page.unroute("**/api/foundry-portfolio");
  await page.route("**/api/foundry-portfolio", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(portfolio) }));
  let postedIntent = null;
  await page.route("**/api/work-intents", async (route) => {
    postedIntent = await route.request().postDataJSON();
    const pendingIntent = { fuid: "00000B", requestedStatus: postedIntent.requestedStatus, pendingColumn: "inProgress", status: "pending" };
    portfolio.projection.specs[1].tickets[0].pendingIntent = pendingIntent;
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(pendingIntent) });
  });
  await page.reload();
  await page.getByRole("button", { name: "Master Taskboard", exact: true }).click();
  const board = page.getByTestId("master-taskboard");
  await expect(board.locator(".work-column > header h3")).toHaveText(["Backlog", "To Do", "In Progress", "Blocked", "Complete"]);
  await expect(board.locator('[data-spec-fuid="000003"]').first()).toContainText("P-005/S-027");
  await expect(board.locator('[data-ticket-fuid="000004"]')).toContainText("P-005/S-027/TK-002");
  await expect(board.locator('[data-ticket-fuid="000004"]')).toContainText("2026-08-11");
  await board.getByLabel("Search master taskboard").fill("schematic");
  await expect(board.locator('[data-ticket-fuid="000005"]')).toBeVisible();
  await expect(board.locator('[data-ticket-fuid="000002"]')).toHaveCount(0);
  await board.getByLabel("Search master taskboard").fill("");
  await board.getByLabel("Filter master taskboard by project").selectOption("P-005");
  await board.locator('[data-ticket-fuid="000004"]').evaluate((source) => {
    const target = document.querySelector('[data-column="inProgress"]');
    const dataTransfer = new DataTransfer();
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }));
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
  });
  await expect.poll(() => postedIntent?.requestedStatus).toBe("in-progress");
  expect(postedIntent.targetFuid).toBe("000004");
  expect(postedIntent.sourceRevision).toBe("b".repeat(40));
  await expect(board.locator('[data-column="todo"] [data-ticket-fuid="000004"]')).toContainText("Pending → In Progress");
  await expect(board.locator('[data-column="inProgress"] [data-ticket-fuid="000004"]')).toHaveCount(0);
  const layout = await page.locator(".view-stack").evaluate((node) => ({ scroll: node.scrollWidth, client: node.clientWidth }));
  expect(layout.scroll).toBeLessThanOrEqual(layout.client + 1);
});

test("Deployments reports exact branches and keeps missing checkouts unavailable", async ({ page }) => {
  await page.getByRole("button", { name: "Deployments", exact: true }).click();
  const rootRow = page.locator('.deployment-row[data-project-id="GPT_OS"]');
  const cicRow = page.locator('.deployment-row[data-project-id="P-005"]');
  await expect(rootRow).toContainText("producer · KaydenClark/GPT_OS · integration");
  await expect(cicRow).toContainText("producer · KaydenClark/command-information-center · Integration");
  const foundryRow = page.locator('.deployment-row[data-project-id="P-018"]');
  await expect(foundryRow).toContainText("unavailable");
  await expect(foundryRow).toContainText("Declared producer checkout is not present");
});

test("Projects provides one selected Workshop drill-down", async ({ page }) => {
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await page.getByRole("button", { name: "Inspect P-005", exact: true }).click();
  const drilldown = page.getByTestId("project-drilldown");
  await expect(drilldown).toContainText("Selected Workshop");
  await expect(drilldown).toContainText("P-005/S-027/TK-002");
  await expect(drilldown).toContainText("KaydenClark/command-information-center");
});
