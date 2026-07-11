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
  await page.getByRole("button", { name: "Personal To-Dos" }).first().click();
  const title = `Browser smoke ${Date.now()}`;
  await page.getByTestId("add-task-inbox").fill(title);
  await page.getByTestId("submit-task-inbox").click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: `Move ${title} right` }).click();
  await expect(page.getByTestId("column-today").getByText(title, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Intelligence" }).first().click();
  // The credential-free smoke server serves the synthetic demo feed and an idle ask panel.
  await expect(page.getByRole("heading", { name: /Demo briefing/ })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Ask a source-backed question.")).toBeVisible();
});

test("dashboard refresh remains usable at the project viewport", async ({ page }) => {
  const refresh = page.getByRole("button", { name: /Refresh/ }).first();
  await expect(refresh).toBeVisible();
  const box = await refresh.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  await refresh.click();
  await expect(refresh).toBeEnabled();
});

test("project taskboards render decisions and editable task rows", async ({ page }) => {
  await page.getByRole("button", { name: "Projects" }).first().click();
  const boards = page.getByTestId("project-taskboards");
  await expect(boards).toBeVisible();
  await expect(boards.getByText("Project Taskboards").first()).toBeVisible();
  await expect(boards.getByText("Decisions needed")).toBeVisible();
  await expect(boards.getByText("Fresh from TASKBOARD.md", { exact: false })).toBeVisible();
});
