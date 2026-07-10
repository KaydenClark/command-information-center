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
  await page.getByRole("button", { name: "Kanban" }).click();
  const title = `Browser smoke ${Date.now()}`;
  await page.getByTestId("add-task-inbox").fill(title);
  await page.getByTestId("submit-task-inbox").click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: `Move ${title} right` }).click();
  await expect(page.getByTestId("column-today").getByText(title, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "List" }).click();
  await page.getByRole("textbox", { name: "Search tasks" }).fill(title);
  await expect(page.getByTestId("list-today").getByText(title, { exact: true })).toBeVisible();
  await expect(page.getByText("1 of", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Intelligence" }).click();
  await expect(page.getByText("No knowledge chunks returned from OpenBrain.")).toBeVisible();
  await expect(page.getByText("Ask a source-backed question.")).toBeVisible();
});

test("dashboard and Update now remain usable at the project viewport", async ({ page }) => {
  const update = page.getByRole("button", { name: /Update now/ });
  await expect(update).toBeVisible();
  const box = await update.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  await update.click();
  await expect(page.getByRole("button", { name: /Update now Updated just now/ })).toBeVisible();
});
