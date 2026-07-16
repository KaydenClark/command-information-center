import { test, expect } from "@playwright/test";

const FINGERPRINT = "cb7424103ffe6f2217f89cd3a63003a061f31c8330226cb99771bc2a800092bc";
const MAIN_SHA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const INTEGRATION_SHA = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

const READY_CANDIDATE = {
  repository: "KaydenClark/LLM_Workbench",
  sourceBranch: "integration",
  destinationBranch: "main",
  status: "ready",
  reason: null,
  mainSha: MAIN_SHA,
  integrationSha: INTEGRATION_SHA,
  pullRequest: {
    number: 42,
    url: "https://github.com/KaydenClark/LLM_Workbench/pull/42",
    headSha: INTEGRATION_SHA,
    baseSha: MAIN_SHA,
    mergeable: true
  },
  releaseGate: {
    id: 991,
    context: "gptos/workbench-release-gate",
    state: "success",
    sha: INTEGRATION_SHA,
    evidenceUrl: "https://github.com/KaydenClark/LLM_Workbench/actions/runs/991",
    auditorSummary: "Auditor passed the exact integration SHA."
  },
  fingerprint: FINGERPRINT
};

function operation(status, overrides = {}) {
  return {
    id: "operation-1",
    type: "workbench_release",
    status,
    repository: "KaydenClark/LLM_Workbench",
    sourceBranch: "integration",
    destinationBranch: "main",
    mainSha: MAIN_SHA,
    integrationSha: INTEGRATION_SHA,
    pullRequestNumber: 42,
    releaseGateStatusId: 991,
    evidenceUrl: READY_CANDIDATE.releaseGate.evidenceUrl,
    auditorSummary: READY_CANDIDATE.releaseGate.auditorSummary,
    candidateFingerprint: FINGERPRINT,
    approvedAt: "2026-07-16T10:00:00.000Z",
    createdAt: "2026-07-16T10:00:00.000Z",
    updatedAt: "2026-07-16T10:00:00.000Z",
    ...overrides
  };
}

function release(candidate = READY_CANDIDATE, latestOperation = null) {
  return { contractVersion: 1, readOnly: true, candidate, latestOperation };
}

function json(body, status = 200, headers = {}) {
  return { status, contentType: "application/json", headers, body: JSON.stringify(body) };
}

async function openDeployments(page) {
  await page.getByRole("button", { name: "Deployments" }).click();
  const card = page.getByTestId("workbench-release-card");
  await expect(card).toBeVisible();
  return card;
}

test.beforeEach(async ({ page, isMobile }) => {
  test.skip(!isMobile, "S-005/TK-001 uses the iPhone 13 browser seam.");
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.__cicErrors = errors;
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Command Information Center" })).toBeVisible();
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== "skipped") expect(page.__cicErrors).toEqual([]);
});

test("checking and blocked candidates expose fixed identity and refresh only", async ({ page }) => {
  let resolveCandidate;
  await page.route("**/api/captain/workbench-release**", async (route) => {
    await new Promise((resolve) => { resolveCandidate = resolve; });
    await route.fulfill(json(release({
      ...READY_CANDIDATE,
      status: "blocked",
      reason: { code: "release_gate_missing", detail: "Exact-SHA Auditor evidence is missing." },
      releaseGate: null,
      fingerprint: null
    })));
  });

  const card = await openDeployments(page);
  await expect(card.getByText("Checking", { exact: true })).toBeVisible();
  await expect(card.getByText("KaydenClark/LLM_Workbench", { exact: true })).toBeVisible();
  await expect(card.getByRole("textbox")).toHaveCount(0);
  resolveCandidate();
  await expect(card.getByText("Blocked", { exact: true })).toBeVisible();
  await expect(card.getByText("Exact-SHA Auditor evidence is missing.", { exact: true })).toBeVisible();
  await expect(card.getByRole("button", { name: "Refresh release evidence" })).toBeVisible();
  await expect(card.getByRole("textbox")).toHaveCount(0);
});

test("approval and execution are separate exact-body mutations with cleared secrets and no duplicates", async ({ page }) => {
  let currentRelease = release();
  let approvalCount = 0;
  let executionCount = 0;
  const approvalBodies = [];
  const executionBodies = [];

  await page.route("**/api/captain/workbench-release**", async (route) => {
    if (route.request().method() === "GET") return route.fulfill(json(currentRelease));
    if (route.request().url().endsWith("/approval")) {
      approvalCount += 1;
      approvalBodies.push(route.request().postDataJSON());
      await new Promise((resolve) => setTimeout(resolve, 80));
      const approved = operation("approved");
      currentRelease = release(READY_CANDIDATE, approved);
      return route.fulfill(json({ ok: true, executed: false, operation: approved }, 201));
    }
    if (route.request().url().endsWith("/execution")) {
      executionCount += 1;
      executionBodies.push(route.request().postDataJSON());
      await new Promise((resolve) => setTimeout(resolve, 80));
      const applied = operation("applied", {
        mergeSha: "cccccccccccccccccccccccccccccccccccccccc",
        mergeEvidenceUrl: "https://github.com/KaydenClark/LLM_Workbench/commit/cccccccccccccccccccccccccccccccccccccccc"
      });
      currentRelease = release(READY_CANDIDATE, applied);
      return route.fulfill(json({ ok: true, executed: true, operation: applied }));
    }
    return route.abort();
  });

  const card = await openDeployments(page);
  await expect(card.getByText("Ready", { exact: true })).toBeVisible();
  await card.getByLabel("Approval passphrase").fill("first-secret");
  await card.getByRole("button", { name: "Approve exact SHA bbbbbbb" }).evaluate((button) => {
    button.click();
    button.click();
  });

  await expect(card.getByText("Approved", { exact: true })).toBeVisible();
  expect(approvalCount).toBe(1);
  expect(executionCount).toBe(0);
  expect(approvalBodies).toEqual([{ fingerprint: FINGERPRINT, passcode: "first-secret" }]);
  await expect(card.getByTestId("workbench-release-result")).toContainText("GitHub unchanged");
  await expect(card.getByLabel("Approval passphrase")).toHaveCount(0);
  await expect(card.getByLabel("Execution passphrase")).toHaveValue("");
  await expect(card.getByTestId("workbench-release-result")).toBeFocused();

  await card.getByLabel("Execution passphrase").fill("second-secret");
  await card.getByRole("button", { name: "Execute approved release" }).evaluate((button) => {
    button.click();
    button.click();
  });
  await expect(card.getByText("Applied", { exact: true })).toBeVisible();
  expect(executionCount).toBe(1);
  expect(executionBodies).toEqual([{ operationId: "operation-1", passcode: "second-secret" }]);
  await expect(card.getByLabel("Execution passphrase")).toHaveCount(0);
  await expect(card.getByRole("link", { name: "Open verified merge" })).toHaveAttribute(
    "href",
    "https://github.com/KaydenClark/LLM_Workbench/commit/cccccccccccccccccccccccccccccccccccccccc"
  );
  await expect(card.getByRole("button", { name: "Execute approved release" })).toHaveCount(0);
  await expect(card.getByTestId("workbench-release-result")).toBeFocused();

  expect(page.url()).not.toContain("first-secret");
  expect(page.url()).not.toContain("second-secret");
  expect(await page.evaluate(() => JSON.stringify({ local: localStorage, session: sessionStorage }))).not.toContain("first-secret");
  expect(await page.evaluate(() => JSON.stringify({ local: localStorage, session: sessionStorage }))).not.toContain("second-secret");
  await expect(page.getByText("first-secret", { exact: false })).toHaveCount(0);
  await expect(page.getByText("second-secret", { exact: false })).toHaveCount(0);
});

test("stale evidence is preserved, session expiry locks, and Retry-After never resubmits", async ({ page }) => {
  await page.clock.install();
  let getCount = 0;
  let approvalCount = 0;
  let responseMode = "ready";
  await page.route("**/api/captain/workbench-release**", async (route) => {
    if (route.request().method() === "GET") {
      getCount += 1;
      if (responseMode === "stale") return route.fulfill(json({ error: "GitHub unavailable." }, 503));
      return route.fulfill(json(release()));
    }
    approvalCount += 1;
    if (responseMode === "throttled") {
      return route.fulfill(json({ error: "Try again later.", code: "step_up_throttled" }, 429, { "Retry-After": "3" }));
    }
    if (responseMode === "approve-then-stale") {
      responseMode = "stale";
      return route.fulfill(json({ ok: true, executed: false, operation: operation("approved") }, 201));
    }
    return route.fulfill(json({ error: "Passcode required." }, 401));
  });

  const card = await openDeployments(page);
  responseMode = "approve-then-stale";
  await card.getByLabel("Approval passphrase").fill("stale-secret");
  await card.getByRole("button", { name: "Approve exact SHA bbbbbbb" }).click();
  await expect(card.getByText("Stale evidence", { exact: true })).toBeVisible();
  await expect(card.getByText(FINGERPRINT, { exact: true })).toBeVisible();
  await expect(card.getByLabel("Approval passphrase")).toHaveCount(0);

  responseMode = "ready";
  await card.getByRole("button", { name: "Refresh release evidence" }).click();
  await card.getByLabel("Approval passphrase").fill("expired-secret");
  await card.getByRole("button", { name: "Approve exact SHA bbbbbbb" }).click();
  await expect(card.getByText("Login required", { exact: true })).toBeVisible();
  await expect(card.getByLabel("Approval passphrase")).toHaveCount(0);

  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  responseMode = "ready";
  const remountedCard = await openDeployments(page);
  responseMode = "throttled";
  await remountedCard.getByLabel("Approval passphrase").fill("throttled-secret");
  await remountedCard.getByRole("button", { name: "Approve exact SHA bbbbbbb" }).click();
  await expect(remountedCard.getByText("Try again in 3s", { exact: false })).toBeVisible();
  await expect(remountedCard.getByLabel("Approval passphrase")).toHaveValue("");
  await expect(remountedCard.getByRole("button", { name: "Approve exact SHA bbbbbbb" })).toBeDisabled();
  const countAtThrottle = approvalCount;
  await page.clock.fastForward(3_100);
  await expect(remountedCard.getByLabel("Approval passphrase")).toBeEnabled();
  await remountedCard.getByLabel("Approval passphrase").fill("fresh-secret");
  await expect(remountedCard.getByRole("button", { name: "Approve exact SHA bbbbbbb" })).toBeEnabled();
  expect(approvalCount).toBe(countAtThrottle);
  expect(getCount).toBeGreaterThanOrEqual(3);
  expect(page.__cicErrors.join(" ")).not.toContain("stale-secret");
  expect(page.__cicErrors.join(" ")).not.toContain("expired-secret");
  expect(page.__cicErrors.join(" ")).not.toContain("throttled-secret");
  page.__cicErrors.length = 0;
});

test("durable operation states enforce retry, mismatch, terminal, and applied rules", async ({ page }) => {
  let currentRelease = release(READY_CANDIDATE, operation("approved"));
  let failRefresh = false;
  await page.route("**/api/captain/workbench-release**", (route) => route.fulfill(
    failRefresh ? json({ error: "GitHub unavailable." }, 503) : json(currentRelease)
  ));

  let card = await openDeployments(page);
  await expect(card.getByText("Approved", { exact: true })).toBeVisible();
  await expect(card.getByRole("button", { name: "Execute approved release" })).toBeVisible();

  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  currentRelease = release(READY_CANDIDATE, operation("blocked", {
    executionErrorCode: "github_unavailable",
    executionErrorDetail: "GitHub could not be reached."
  }));
  card = await openDeployments(page);
  await expect(card.getByText("Execution blocked", { exact: true })).toBeVisible();
  await expect(card.getByRole("button", { name: "Retry approved release" })).toBeVisible();

  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  currentRelease = release({ ...READY_CANDIDATE, fingerprint: "d".repeat(64) }, operation("blocked"));
  card = await openDeployments(page);
  await expect(card.getByText("New approval required", { exact: false })).toBeVisible();
  await expect(card.getByRole("button", { name: "Retry approved release" })).toHaveCount(0);

  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  currentRelease = release(READY_CANDIDATE, operation("rejected", {
    executionErrorDetail: "Exact GitHub evidence changed."
  }));
  card = await openDeployments(page);
  await expect(card.getByText("Rejected", { exact: true })).toBeVisible();
  await expect(card.getByText("new approval", { exact: false })).toBeVisible();
  await expect(card.getByLabel("Execution passphrase")).toHaveCount(0);

  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  currentRelease = release(READY_CANDIDATE, operation("applied", {
    mergeSha: "c".repeat(40),
    mergeEvidenceUrl: `https://github.com/KaydenClark/LLM_Workbench/commit/${"c".repeat(40)}`
  }));
  card = await openDeployments(page);
  await expect(card.getByText("Applied", { exact: true })).toBeVisible();
  await expect(card.getByRole("link", { name: "Open verified merge" })).toBeVisible();
  await expect(card.getByLabel("Execution passphrase")).toHaveCount(0);
  failRefresh = true;
  await card.getByRole("button", { name: "Refresh release evidence" }).click();
  await expect(card.getByText("Stale evidence", { exact: true })).toBeVisible();
  await expect(card.getByRole("link", { name: "Open verified merge" })).toBeVisible();
  page.__cicErrors.length = 0;
});

test("executing polls sequentially for no more than 60 seconds then hands off to refresh", async ({ page }) => {
  await page.clock.install();
  let inFlight = 0;
  let maxInFlight = 0;
  let getCount = 0;
  await page.route("**/api/captain/workbench-release**", async (route) => {
    getCount += 1;
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise((resolve) => setTimeout(resolve, 25));
    inFlight -= 1;
    return route.fulfill(json(release(READY_CANDIDATE, operation("executing"))));
  });

  const card = await openDeployments(page);
  await expect(card.getByText("Executing", { exact: true })).toBeVisible();
  await page.clock.runFor(60_500);
  await expect(card.getByTestId("workbench-release-result")).toContainText("Automatic monitoring stopped");
  await expect(card.getByRole("button", { name: "Refresh release evidence" })).toBeVisible();
  const countAtBound = getCount;
  await page.clock.runFor(10_000);
  expect(getCount).toBe(countAtBound);
  expect(maxInFlight).toBe(1);
});

test("iPhone 13 card has accessible controls, readable evidence, and no horizontal overflow", async ({ page }) => {
  await page.route("**/api/captain/workbench-release**", (route) => route.fulfill(json(release())));
  const card = await openDeployments(page);
  const input = card.getByLabel("Approval passphrase");
  const button = card.getByRole("button", { name: "Approve exact SHA bbbbbbb" });
  const [cardBox, inputBox, buttonBox, inputFontSize, pageWidths] = await Promise.all([
    card.boundingBox(),
    input.boundingBox(),
    button.boundingBox(),
    input.evaluate((element) => getComputedStyle(element).fontSize),
    page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }))
  ]);

  expect(cardBox.x).toBeGreaterThanOrEqual(0);
  expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(page.viewportSize().width);
  expect(inputBox.height).toBeGreaterThanOrEqual(44);
  expect(buttonBox.height).toBeGreaterThanOrEqual(44);
  expect(Number.parseFloat(inputFontSize)).toBeGreaterThanOrEqual(16);
  expect(pageWidths.document).toBeLessThanOrEqual(pageWidths.viewport);
  await expect(card.getByText(FINGERPRINT, { exact: true })).toHaveAttribute("title", FINGERPRINT);
  await expect(card.getByTestId("workbench-release-result")).toHaveAttribute("aria-live", "polite");
  await expect(page.getByText("Private host", { exact: true })).toBeVisible();

  await input.fill("leave-workflow-secret");
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  const remountedCard = await openDeployments(page);
  await expect(remountedCard.getByLabel("Approval passphrase")).toHaveValue("");
  expect(page.url()).not.toContain("leave-workflow-secret");
});
