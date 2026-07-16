import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const INDEX_MAX_BYTES = 512 * 1024;
const GIT_TIMEOUT_MS = 1_000;
const GIT_MAX_BUFFER = 64 * 1024;

function cleanCell(value = "") {
  return String(value)
    .trim()
    .replace(/^`(.*)`$/, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\\\|/g, "|")
    .trim();
}

function splitRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map(cleanCell);
}

export function parseCanonicalProjectIndex(source) {
  const lines = String(source || "").split(/\r?\n/);
  const heading = lines.findIndex((line) => /^##\s+Canonical Project Repositories\s*$/.test(line));
  if (heading < 0) return [];
  const rows = [];
  let headers = null;
  for (let index = heading + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^##\s+/.test(line)) break;
    if (!line.trim().startsWith("|")) continue;
    if (!headers) {
      headers = splitRow(line);
      continue;
    }
    if (/^\s*\|?\s*:?-{3,}/.test(line)) continue;
    const cells = splitRow(line);
    const row = Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex] || ""]));
    if (row.Project && row["Canonical source"]) {
      rows.push({ name: row.Project, sourcePath: row["Canonical source"], remote: row.Remote || "" });
    }
  }
  return rows;
}

function git(repo, args) {
  const result = spawnSync("git", ["-C", repo, ...args], {
    encoding: "utf8",
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
    timeout: GIT_TIMEOUT_MS,
    maxBuffer: GIT_MAX_BUFFER,
    windowsHide: true
  });
  return {
    ok: result.status === 0 && !result.error,
    output: String(result.stdout || "").trim()
  };
}

function repositoryName(remote) {
  const value = String(remote || "").trim();
  if (!value || /^missing\b/i.test(value)) return null;
  const https = value.match(/^https:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/i);
  if (https) return https[1];
  const ssh = value.match(/^git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/i);
  return ssh?.[1] || null;
}

function resolveBranch(repo, names) {
  for (const name of names) {
    for (const ref of [`refs/remotes/origin/${name}`, `refs/heads/${name}`]) {
      const resolved = git(repo, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
      if (resolved.ok && resolved.output) return { name, ref, sha: resolved.output };
    }
  }
  return null;
}

function containedPath(root, candidate) {
  if (!path.isAbsolute(candidate)) return null;
  try {
    const canonicalRoot = fs.realpathSync(root);
    const canonicalCandidate = fs.realpathSync(candidate);
    const relative = path.relative(canonicalRoot, canonicalCandidate);
    if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) return canonicalCandidate;
  } catch {
    return null;
  }
  return null;
}

function unavailable(entry, checkedAt) {
  return {
    name: entry.name,
    repository: repositoryName(entry.remote),
    status: "unavailable",
    detail: "Canonical source is not an available Git repository.",
    currentBranch: null,
    releaseBranch: null,
    stagingBranch: null,
    releaseSha: null,
    stagingSha: null,
    aheadBy: 0,
    behindBy: 0,
    dirtyFiles: 0,
    checkedAt
  };
}

function inspectProject(entry, projectsRoot, checkedAt) {
  const repo = containedPath(projectsRoot, entry.sourcePath);
  if (!repo) return unavailable(entry, checkedAt);
  const topLevel = git(repo, ["rev-parse", "--show-toplevel"]);
  if (!topLevel.ok) return unavailable(entry, checkedAt);
  try {
    if (fs.realpathSync(topLevel.output) !== repo) return unavailable(entry, checkedAt);
  } catch {
    return unavailable(entry, checkedAt);
  }

  const currentBranch = git(repo, ["symbolic-ref", "--short", "-q", "HEAD"]);
  const status = git(repo, ["status", "--porcelain=v1", "--untracked-files=normal"]);
  const dirtyFiles = status.ok && status.output ? status.output.split(/\r?\n/).filter(Boolean).length : 0;
  const release = resolveBranch(repo, ["main", "master"]);
  const staging = resolveBranch(repo, ["Integration", "integration"]);
  let deploymentStatus = "no_staging";
  let detail = "No Integration or integration branch is available in local refs.";
  let aheadBy = 0;
  let behindBy = 0;

  if (!release) {
    deploymentStatus = "no_release_branch";
    detail = "No main or master release branch is available in local refs.";
  } else if (staging) {
    const counts = git(repo, ["rev-list", "--left-right", "--count", `${release.ref}...${staging.ref}`]);
    const [releaseOnly, stagingOnly] = counts.output.split(/\s+/).map(Number);
    if (!counts.ok || !Number.isSafeInteger(releaseOnly) || !Number.isSafeInteger(stagingOnly)) {
      deploymentStatus = "unavailable";
      detail = "Local branch relationship could not be read.";
    } else {
      behindBy = releaseOnly;
      aheadBy = stagingOnly;
      if (releaseOnly === 0 && stagingOnly === 0) {
        deploymentStatus = "synced";
        detail = "Staging and release resolve to the same commit.";
      } else if (stagingOnly === 0) {
        deploymentStatus = "released";
        detail = "All staging commits are already contained by release.";
      } else if (releaseOnly === 0) {
        deploymentStatus = "release_ready";
        detail = `${stagingOnly} staging commit${stagingOnly === 1 ? "" : "s"} not yet in release.`;
      } else {
        deploymentStatus = "diverged";
        detail = "Staging and release each contain unique commits.";
      }
    }
  }

  if (dirtyFiles > 0) detail = `${detail} Canonical checkout has ${dirtyFiles} uncommitted file${dirtyFiles === 1 ? "" : "s"}.`;
  return {
    name: entry.name,
    repository: repositoryName(entry.remote),
    status: deploymentStatus,
    detail,
    currentBranch: currentBranch.ok ? currentBranch.output : "detached",
    releaseBranch: release?.name || null,
    stagingBranch: staging?.name || null,
    releaseSha: release?.sha || null,
    stagingSha: staging?.sha || null,
    aheadBy,
    behindBy,
    dirtyFiles,
    checkedAt
  };
}

export function listProjectDeployments({ indexPath, projectsRoot, now = () => new Date() }) {
  const checkedAt = now().toISOString();
  let entries = [];
  try {
    const stats = fs.statSync(indexPath);
    if (!stats.isFile() || stats.size > INDEX_MAX_BYTES) throw new Error("invalid index");
    entries = parseCanonicalProjectIndex(fs.readFileSync(indexPath, "utf8"));
  } catch {
    return {
      source: "Projects/INDEX.md",
      checkedAt,
      status: "unavailable",
      detail: "Canonical project index is unavailable.",
      projects: []
    };
  }

  return {
    source: "Projects/INDEX.md",
    checkedAt,
    status: entries.length ? "ok" : "unavailable",
    detail: entries.length
      ? "Read-only local Git evidence; no fetch, deployment, or hosting-provider check was performed."
      : "Canonical project index contains no project entries.",
    projects: entries.map((entry) => inspectProject(entry, projectsRoot, checkedAt))
  };
}
