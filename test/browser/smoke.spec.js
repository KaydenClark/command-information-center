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
      deployment: { status: "observed", repository: "KaydenClark/GPT_OS", currentBranch: "integration", headSha: "a".repeat(40), dirtyFiles: 0, upstream: "origin/integration", aheadBy: 0, behindBy: 0, evidence: "declared_checkout", detail: "Branch read from declared checkout." },
      board: { updatedAt: "2026-08-18T20:00:00.000Z", counts: { ready: 1, inProgress: 1, blocked: 0, done: 4 }, specCount: 35, decisions: [] }
    },
    {
      id: "p-005", projectId: "P-005", name: "Command Information Center", remote: "KaydenClark/command-information-center", notes: "Interface Module producer.",
      next: { status: "ok", specId: "S-027", ticketId: "TK-002", title: "Deliver the Master Taskboard", state: "ready", nextGate: "Verify portfolio search." },
      deployment: { status: "observed", repository: "KaydenClark/command-information-center", currentBranch: "Integration", headSha: "b".repeat(40), dirtyFiles: 0, upstream: "origin/Integration", aheadBy: 0, behindBy: 0, evidence: "declared_checkout", detail: "Branch read from declared checkout." },
      board: { updatedAt: "2026-08-18T20:00:00.000Z", counts: { ready: 1, inProgress: 0, blocked: 1, done: 12 }, specCount: 14, decisions: [{ id: "D-027", decision: "Approve the operator surface", recommendation: "Inspect production." }] }
    },
    {
      id: "p-018", projectId: "P-018", name: "Foundry", remote: "KaydenClark/Foundry", notes: "Product checkout recovery pending.",
      next: { status: "unavailable", detail: "No local LLM Workbench selector is installed for this scope." },
      deployment: { status: "unavailable", repository: "KaydenClark/Foundry", currentBranch: null, headSha: null, dirtyFiles: null, upstream: null, aheadBy: null, behindBy: null, evidence: "none", detail: "Declared producer checkout is not present on this host." },
      board: null
    }
  ],
  work: [
    { scopeId: "gpt-os", projectId: "GPT_OS", projectName: "GPT_OS", specId: "S-035", ticketId: "TK-003", reference: "GPT_OS/S-035/TK-003", title: "Rebuild the CIC Foundry control surface", status: "in-progress", blockers: "none", priority: "0", owner: "Codex", freshness: "current", specTitle: "Foundry Reactivation", nextGate: "Ship reviewed v1.0.1.", updated: "2026-08-18", isNext: true },
    { scopeId: "p-005", projectId: "P-005", projectName: "Command Information Center", specId: "S-027", ticketId: "TK-002", reference: "P-005/S-027/TK-002", title: "Deliver the Master Taskboard", status: "ready", blockers: "none", priority: "0", owner: "Codex", freshness: "current", specTitle: "Foundry Control Surface v1.0.1", nextGate: "Verify portfolio search.", updated: "2026-08-18", isNext: true },
    { scopeId: "p-005", projectId: "P-005", projectName: "Command Information Center", specId: "S-027", ticketId: "TK-004", reference: "P-005/S-027/TK-004", title: "Embed the live Schematic", status: "blocked", blockers: "TK-002", priority: "0", owner: "Codex", freshness: "current", specTitle: "Foundry Control Surface v1.0.1", nextGate: "Complete Master Taskboard.", updated: "2026-08-18", isNext: false }
  ]
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
  await expect(page.locator('iframe[title="Live Foundry Schematic"]')).toBeVisible();
  await expect(page.getByText("FUTURE CAPABILITY", { exact: true })).toBeVisible();
});

test("Master Taskboard searches the whole portfolio and composes project and status filters", async ({ page }) => {
  await page.getByRole("button", { name: "Master Taskboard", exact: true }).click();
  const board = page.getByTestId("master-taskboard");
  const workList = board.locator(".master-work-list");
  await expect(workList.getByText("GPT_OS/S-035/TK-003", { exact: true })).toBeVisible();
  await expect(workList.getByText("P-005/S-027/TK-002", { exact: true })).toBeVisible();
  await board.getByLabel("Search master taskboard").fill("schematic");
  await expect(workList.getByText("P-005/S-027/TK-004", { exact: true })).toBeVisible();
  await expect(workList.getByText("GPT_OS/S-035/TK-003", { exact: true })).toHaveCount(0);
  await board.getByLabel("Search master taskboard").fill("");
  await board.getByLabel("Filter master taskboard by project").selectOption("P-005");
  await board.getByLabel("Filter master taskboard by status").selectOption("blocked");
  await expect(workList.getByText("P-005/S-027/TK-004", { exact: true })).toBeVisible();
  await expect(workList.getByText("P-005/S-027/TK-002", { exact: true })).toHaveCount(0);
});

test("Deployments reports exact branches and keeps missing checkouts unavailable", async ({ page }) => {
  await page.getByRole("button", { name: "Deployments", exact: true }).click();
  await expect(page.getByText("integration", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Integration", { exact: true }).first()).toBeVisible();
  const foundryRow = page.locator(".deployment-row").filter({ hasText: "P-018" });
  await expect(foundryRow).toContainText("unavailable");
  await expect(foundryRow).toContainText("Declared producer checkout is not present");
});
