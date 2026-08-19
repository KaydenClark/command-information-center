import { test, expect } from "@playwright/test";

const PORTFOLIO = {
  status: "ok",
  source: "GPT_OS + Projects/INDEX.md Active Portfolio Enrollment",
  checkedAt: "2026-08-18T20:00:00.000Z",
  work: [
    { reference: "P-005/S-027/TK-004", projectId: "P-005", projectName: "Command Information Center", title: "Embed the live Schematic", status: "blocked", blockers: "TK-002" }
  ],
  scopes: [
    { id: "p-005", projectId: "P-005", name: "Command Information Center", next: { status: "ok" }, deployment: { status: "observed" }, board: { decisions: [{ id: "D-027", decision: "Approve the operator surface", recommendation: "Inspect production CIC." }] } },
    { id: "p-018", projectId: "P-018", name: "Foundry", next: { status: "unavailable", detail: "No local selector is installed." }, deployment: { status: "unavailable", detail: "Declared producer checkout is not present." }, board: null }
  ]
};

test("Awaiting You shows owner decisions, blocked work, and evidence gaps from portfolio controls", async ({ page }) => {
  await page.route("**/api/foundry-portfolio", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PORTFOLIO) }));
  await page.goto("/");
  await page.getByRole("button", { name: "Awaiting You", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Awaiting You", exact: true })).toBeVisible();
  await expect(page.getByText("Approve the operator surface", { exact: true })).toBeVisible();
  await expect(page.getByText("P-005/S-027/TK-004", { exact: true })).toBeVisible();
  await expect(page.getByText("No local selector is installed.", { exact: true })).toBeVisible();
});
