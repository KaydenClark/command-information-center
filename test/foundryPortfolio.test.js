import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { buildFoundryPortfolio, filterPortfolioWork } from "../server/foundryPortfolio.js";

function git(repo, ...args) {
  return execFileSync("git", ["-C", repo, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "CIC Test",
      GIT_AUTHOR_EMAIL: "cic@example.test",
      GIT_COMMITTER_NAME: "CIC Test",
      GIT_COMMITTER_EMAIL: "cic@example.test"
    }
  }).trim();
}

function writeSpec(repo, id, ticket, title) {
  const dir = path.join(repo, "specs", `${id}-demo`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "SPEC.md"), `# ${id} - ${title}\n\n**Spec ID:** ${id}\n**Status:** ready\n**Priority:** 1\n**Next gate:** Run ${ticket}.\n\n## Vertical Implementation Slices\n\n| Ticket | Slice | Status | Blockers | Proof |\n|---|---|---|---|---|\n| ${ticket} | ${title} | ready | none | - |\n`);
}

test("portfolio includes GPT_OS and registered remotes with authoritative next-work evidence", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cic-portfolio-"));
  fs.mkdirSync(path.join(root, "Projects", "Alpha"), { recursive: true });
  git(root, "init", "-b", "integration");
  git(root, "remote", "add", "origin", "https://github.com/example/GPT_OS.git");
  fs.writeFileSync(path.join(root, "README.md"), "root\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "root");
  const alpha = path.join(root, "Projects", "Alpha");
  git(alpha, "init", "-b", "Integration");
  git(alpha, "remote", "add", "origin", "https://github.com/example/alpha.git");
  fs.writeFileSync(path.join(alpha, "TASKBOARD.md"), "# Alpha - Taskboard\n");
  writeSpec(alpha, "S-012", "TK-004", "Ship alpha");
  git(alpha, "add", ".");
  git(alpha, "commit", "-m", "alpha");
  fs.writeFileSync(path.join(root, "Projects", "INDEX.md"), `# Index\n\n## Active Portfolio Enrollment\n\n| Lane | Registry owner | Canonical source | GitHub repositories | Notes |\n|---|---|---|---|---|\n| Alpha | P-001 | \`${alpha}\` | \`example/alpha\` | Active. |\n`);

  const result = buildFoundryPortfolio({
    gptOsRoot: root,
    runNext: (scope) => scope.id === "p-001"
      ? { status: "ok", specId: "S-012", ticketId: "TK-004", title: "Ship alpha" }
      : { status: "unavailable", detail: "No Workbench control." },
    now: () => new Date("2026-08-18T20:00:00.000Z")
  });

  assert.equal(result.status, "ok");
  assert.deepEqual(result.scopes.map((scope) => scope.id), ["gpt-os", "p-001"]);
  assert.equal(result.scopes[0].deployment.currentBranch, "integration");
  assert.equal(result.scopes[0].deployment.repository, "KaydenClark/GPT_OS");
  assert.equal(result.scopes[0].deployment.observedRepository, "example/GPT_OS");
  assert.equal(result.scopes[0].deployment.status, "partial");
  assert.equal(result.scopes[0].deployment.repositoryMatches, false);
  assert.equal(result.scopes[1].deployment.currentBranch, "Integration");
  assert.equal(result.scopes[1].deployment.status, "observed");
  assert.equal(result.scopes[1].deployment.repositoryMatches, true);
  assert.equal(result.scopes[1].next.specId, "S-012");
  assert.equal(result.scopes[1].next.ticketId, "TK-004");
  assert.equal(result.work.some((item) => item.reference === "P-001/S-012/TK-004"), true);
});

test("portfolio search spans every project and filters by stable project identity", () => {
  const work = [
    { scopeId: "gpt-os", projectId: "GPT_OS", reference: "GPT_OS/S-015/TK-004", title: "Repair registry", status: "ready" },
    { scopeId: "p-005", projectId: "P-005", reference: "P-005/S-027/TK-002", title: "Master taskboard", status: "in-progress" }
  ];
  assert.deepEqual(filterPortfolioWork(work, { query: "master", projectId: "all" }).map((item) => item.reference), ["P-005/S-027/TK-002"]);
  assert.deepEqual(filterPortfolioWork(work, { query: "tk-004", projectId: "GPT_OS" }).map((item) => item.reference), ["GPT_OS/S-015/TK-004"]);
});
