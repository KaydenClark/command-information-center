import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { listProjectDeployments } from "../server/projectDeployments.js";

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

function commitFile(repo, name, content) {
  fs.writeFileSync(path.join(repo, name), content);
  git(repo, "add", name);
  git(repo, "commit", "-m", `add ${name}`);
}

test("deployment portfolio uses only canonical index entries and reports bounded local Git state", () => {
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cic-deployments-"));
  const alpha = path.join(projectsRoot, "Alpha");
  const missing = path.join(projectsRoot, "Missing");
  fs.mkdirSync(alpha);
  git(alpha, "init", "-b", "main");
  git(alpha, "remote", "add", "origin", "https://github.com/example/alpha.git");
  commitFile(alpha, "README.md", "alpha\n");
  git(alpha, "branch", "Integration");
  git(alpha, "switch", "Integration");
  commitFile(alpha, "feature.txt", "ready\n");

  const indexPath = path.join(projectsRoot, "INDEX.md");
  fs.writeFileSync(indexPath, `# Project Routing Index

## Canonical Project Repositories

| Project | Canonical source | Remote | Controls | Stable context |
|---|---|---|---|---|
| Alpha | \`${alpha}\` | https://github.com/example/alpha | current surface present | Alpha |
| Missing | \`${missing}\` | missing repository | missing | Missing |

## Non-Canonical Or Noncompliant Entries

| Entry | Path | Finding |
|---|---|---|
| Alpha-worktree | \`${path.join(projectsRoot, "Alpha-worktree")}\` | not canonical |
`);

  const result = listProjectDeployments({
    indexPath,
    projectsRoot,
    now: () => new Date("2026-07-16T23:30:00.000Z")
  });

  assert.equal(result.source, "Projects/INDEX.md");
  assert.equal(result.checkedAt, "2026-07-16T23:30:00.000Z");
  assert.equal(result.projects.length, 2);
  assert.deepEqual(result.projects.map((project) => project.name), ["Alpha", "Missing"]);
  assert.equal(result.projects[0].status, "release_ready");
  assert.equal(result.projects[0].currentBranch, "Integration");
  assert.equal(result.projects[0].releaseBranch, "main");
  assert.equal(result.projects[0].stagingBranch, "Integration");
  assert.equal(result.projects[0].aheadBy, 1);
  assert.equal(result.projects[0].behindBy, 0);
  assert.equal(result.projects[0].dirtyFiles, 0);
  assert.equal(result.projects[0].repository, "example/alpha");
  assert.equal(result.projects[1].status, "unavailable");
  assert.match(result.projects[1].detail, /not an available Git repository/i);
  assert.equal(JSON.stringify(result).includes(projectsRoot), false);
  assert.equal(JSON.stringify(result).includes("Alpha-worktree"), false);
});
