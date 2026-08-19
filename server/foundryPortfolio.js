import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readTaskboardDirectory } from "./taskboards.js";

const MAX_INDEX_BYTES = 512 * 1024;
const COMMAND_TIMEOUT_MS = 5_000;

function cleanCell(value = "") {
  return String(value)
    .trim()
    .replace(/^`(.*)`$/, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}

function splitRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map(cleanCell);
}

function slug(value) {
  return String(value || "scope").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function repositoryName(remote) {
  const value = cleanCell(remote);
  const github = value.match(/(?:https:\/\/github\.com\/|git@github\.com:)?([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?$/);
  return github ? github[1] : value || null;
}

export function parseActivePortfolio(source) {
  const lines = String(source || "").split(/\r?\n/);
  const heading = lines.findIndex((line) => /^##\s+Active Portfolio Enrollment\s*$/.test(line));
  if (heading < 0) return [];
  let headers = null;
  const rows = [];
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
    const row = Object.fromEntries(headers.map((header, i) => [header, cells[i] || ""]));
    if (row.Lane && row["Canonical source"] && row["GitHub repositories"]) {
      const stableOwner = /^[PFM]-\d{3}$/.test(row["Registry owner"] || "")
        ? row["Registry owner"]
        : row.Lane === "The Forge" ? "F-001" : row["Registry owner"] || row.Lane;
      rows.push({
        id: slug(stableOwner),
        projectId: stableOwner,
        name: row.Lane,
        sourcePath: row["Canonical source"],
        remote: repositoryName(row["GitHub repositories"]),
        notes: row.Notes || ""
      });
    }
  }
  return rows;
}

function git(repo, args) {
  const result = spawnSync("git", ["-C", repo, ...args], {
    encoding: "utf8",
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
    timeout: COMMAND_TIMEOUT_MS,
    maxBuffer: 128 * 1024
  });
  return { ok: result.status === 0 && !result.error, output: String(result.stdout || "").trim() };
}

function inspectDeployment(scope, checkedAt) {
  const unavailable = (detail) => ({
    status: "unavailable",
    detail,
    repository: scope.remote,
    currentBranch: null,
    headSha: null,
    dirtyFiles: null,
    upstream: null,
    aheadBy: null,
    behindBy: null,
    evidence: "none",
    checkedAt
  });
  if (!scope.sourcePath || !fs.existsSync(scope.sourcePath)) return unavailable("Declared producer checkout is not present on this host.");
  const top = git(scope.sourcePath, ["rev-parse", "--show-toplevel"]);
  if (!top.ok) return unavailable("Declared producer path is not inside a readable Git checkout.");
  const branch = git(scope.sourcePath, ["symbolic-ref", "--short", "-q", "HEAD"]);
  const head = git(scope.sourcePath, ["rev-parse", "HEAD"]);
  const status = git(scope.sourcePath, ["status", "--porcelain=v1", "--untracked-files=normal"]);
  const origin = git(scope.sourcePath, ["remote", "get-url", "origin"]);
  const upstream = git(scope.sourcePath, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]);
  const counts = upstream.ok ? git(scope.sourcePath, ["rev-list", "--left-right", "--count", `HEAD...${upstream.output}`]) : { ok: false, output: "" };
  const [aheadBy, behindBy] = counts.ok ? counts.output.split(/\s+/).map(Number) : [null, null];
  const observedRepository = origin.ok ? repositoryName(origin.output) : null;
  const exactCheckout = path.resolve(top.output) === path.resolve(scope.sourcePath);
  const repositoryMatches = Boolean(observedRepository && scope.remote
    && observedRepository.toLowerCase() === scope.remote.toLowerCase());
  const declaredCheckout = exactCheckout && repositoryMatches;
  const result = {
    status: head.ok ? (repositoryMatches ? "observed" : "partial") : "unavailable",
    detail: declaredCheckout
      ? "Branch read from the declared repository checkout."
      : `Branch belongs to ${observedRepository || "an unidentified containing workspace"}; no checkout of the declared ${scope.remote || "product"} remote is present at this source path.`,
    repository: scope.remote,
    observedRepository,
    repositoryMatches,
    currentBranch: branch.ok ? branch.output : "detached",
    headSha: head.ok ? head.output : null,
    dirtyFiles: status.ok ? (status.output ? status.output.split(/\r?\n/).filter(Boolean).length : 0) : null,
    upstream: upstream.ok ? upstream.output : null,
    aheadBy: Number.isSafeInteger(aheadBy) ? aheadBy : null,
    behindBy: Number.isSafeInteger(behindBy) ? behindBy : null,
    evidence: declaredCheckout ? "declared_checkout" : "containing_workspace",
    checkedAt
  };
  if (scope.installedPath && path.resolve(scope.installedPath) !== path.resolve(scope.sourcePath)) {
    result.installed = inspectDeployment({ ...scope, sourcePath: scope.installedPath, installedPath: null }, checkedAt);
  }
  const runtimePathsAgree = scope.runtimeRoot && scope.serverSourceRoot && scope.processCwd && scope.installedPath
    && [scope.runtimeRoot, scope.serverSourceRoot, scope.processCwd]
      .every((candidate) => path.resolve(candidate) === path.resolve(scope.installedPath));
  if (runtimePathsAgree) {
    result.runtime = {
      status: "observed",
      pid: process.pid,
      source: "installed product",
      evidence: "runtime root, executing source root, and process working directory agree",
      currentBranch: result.installed?.currentBranch || null,
      headSha: result.installed?.headSha || null,
      checkedAt
    };
  }
  return result;
}

export function runWorkbenchNext(scope) {
  const localTool = path.join(scope.sourcePath, "tools", "spec-workbench.mjs");
  const rootTool = scope.projectId === "GPT_OS"
    ? path.join(scope.sourcePath, "Foundry", "Halls", "Forge", "tools", "spec-workbench.mjs")
    : null;
  const toolPath = fs.existsSync(localTool) ? localTool : rootTool;
  if (!toolPath || !fs.existsSync(toolPath)) return { status: "unavailable", detail: "No local LLM Workbench selector is installed for this scope." };
  const prefix = scope.projectId === "GPT_OS" ? ["--path", scope.sourcePath] : [];
  const doctor = spawnSync(process.execPath, [toolPath, "doctor", ...prefix], {
    cwd: scope.sourcePath,
    encoding: "utf8",
    timeout: COMMAND_TIMEOUT_MS,
    maxBuffer: 256 * 1024
  });
  if (doctor.status !== 0 || doctor.error) {
    return { status: "unavailable", detail: "The scope's LLM Workbench doctor did not pass." };
  }
  const args = scope.projectId === "GPT_OS"
    ? [toolPath, "next", "--path", scope.sourcePath, "--json"]
    : [toolPath, "next", "--json"];
  const result = spawnSync(process.execPath, args, {
    cwd: scope.sourcePath,
    encoding: "utf8",
    timeout: COMMAND_TIMEOUT_MS,
    maxBuffer: 256 * 1024
  });
  if (result.status !== 0 || result.error) return { status: "unavailable", detail: "The authoritative Workbench selector did not complete successfully." };
  try {
    const selected = JSON.parse(result.stdout);
    if (!selected?.specId || !selected?.ticketId) return { status: "clear", detail: "No actionable ticket is currently selected." };
    return {
      status: "ok",
      specId: selected.specId,
      ticketId: selected.ticketId,
      title: selected.slice || selected.title || "Selected work",
      state: selected.status || "unknown",
      nextGate: selected.nextGate || "",
      owner: selected.owner || "",
      source: "spec-workbench next --json"
    };
  } catch {
    return { status: "unavailable", detail: "The authoritative Workbench selector returned invalid JSON." };
  }
}

function readScopeBoard(scope, now) {
  if (!scope.sourcePath || !fs.existsSync(path.join(scope.sourcePath, "TASKBOARD.md"))) return null;
  try {
    return readTaskboardDirectory(scope.sourcePath, {
      name: scope.name,
      slug: scope.id,
      projectId: scope.projectId,
      now: now()
    });
  } catch {
    return null;
  }
}

function workFreshness(updated, checkedAt) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updated || "")) return "unknown";
  const ageDays = Math.floor((Date.parse(checkedAt) - Date.parse(`${updated}T00:00:00Z`)) / 86_400_000);
  if (!Number.isFinite(ageDays) || ageDays < 0) return "unknown";
  return ageDays <= 7 ? "current" : "stale";
}

function flattenWork(scope, board, checkedAt) {
  if (!board) return [];
  return board.specs.flatMap((spec) => spec.tickets.map((ticket) => ({
    scopeId: scope.id,
    projectId: scope.projectId,
    projectName: scope.name,
    specId: spec.id,
    specFuid: spec.fuid,
    ticketId: ticket.id,
    fuid: ticket.fuid,
    reference: `${scope.projectId}/${spec.id}/${ticket.id}`,
    title: ticket.title,
    status: ticket.status,
    blockers: ticket.blockers,
    priority: spec.priority,
    owner: spec.owner || "Unassigned",
    freshness: workFreshness(ticket.lastWorked || spec.lastWorked || spec.updated, checkedAt),
    specTitle: spec.title,
    nextGate: spec.nextGate,
    created: ticket.created,
    lastWorked: ticket.lastWorked,
    updated: spec.lastWorked || spec.updated,
    isNext: false
  })));
}

function toProjectionSource(scope, board, deployment, checkedAt) {
  const specs = board?.specs || [];
  const completeIdentity = specs.every((spec) => spec.fuid && spec.created && spec.lastWorked
    && spec.tickets.every((ticket) => ticket.fuid && ticket.created && ticket.lastWorked));
  const status = !board || !completeIdentity ? 'unavailable' : deployment.headSha ? 'current' : 'stale';
  return {
    key: scope.projectId,
    path: scope.sourcePath || scope.remote || scope.projectId,
    revision: deployment.headSha || `unavailable:${board?.updatedAt || checkedAt}`,
    observedAt: checkedAt,
    status,
    detail: !board
      ? 'Canonical Workbench controls were unavailable.'
      : !completeIdentity
        ? 'Canonical Specs are not fully migrated to FUID lifecycle metadata.'
        : deployment.detail,
    specs: status === 'unavailable' ? [] : specs.map((spec) => ({
      fuid: spec.fuid,
      alias: `${scope.projectId}/${spec.id}`,
      title: spec.title,
      status: spec.status,
      priority: spec.priority,
      owner: spec.owner,
      blockers: spec.blockers,
      nextGate: spec.nextGate,
      created: spec.created,
      lastWorked: spec.lastWorked,
      tickets: spec.tickets.map((ticket) => ({
        fuid: ticket.fuid,
        alias: `${scope.projectId}/${spec.id}/${ticket.id}`,
        title: ticket.title,
        status: ticket.status,
        blockers: ticket.blockers,
        created: ticket.created,
        lastWorked: ticket.lastWorked
      }))
    }))
  };
}

export function filterPortfolioWork(work, { query = "", projectId = "all", status = "all", owner = "all", freshness = "all" } = {}) {
  const needle = String(query).trim().toLowerCase();
  return (work || []).filter((item) => {
    if (projectId !== "all" && item.projectId !== projectId) return false;
    if (status !== "all" && String(item.status).toLowerCase() !== status.toLowerCase()) return false;
    if (owner !== "all" && item.owner !== owner) return false;
    if (freshness !== "all" && item.freshness !== freshness) return false;
    if (!needle) return true;
    return [item.reference, item.projectName, item.specTitle, item.title, item.status, item.blockers, item.nextGate]
      .some((value) => String(value || "").toLowerCase().includes(needle));
  });
}

function loadDeclaredScopes(gptOsRoot, runtimeRoot, serverSourceRoot, processCwd) {
  const indexPath = path.join(gptOsRoot, "Projects", "INDEX.md");
  let enrolled = [];
  try {
    const stats = fs.statSync(indexPath);
    if (!stats.isFile() || stats.size > MAX_INDEX_BYTES) throw new Error("invalid index");
    enrolled = parseActivePortfolio(fs.readFileSync(indexPath, "utf8")).map((scope) => {
      if (scope.projectId === "P-005") {
        return {
          ...scope,
          installedPath: path.join(gptOsRoot, "Foundry", "Modules", "Command Information Center"),
          runtimeRoot,
          serverSourceRoot,
          processCwd
        };
      }
      if (scope.projectId === "P-010") {
        return { ...scope, installedPath: path.join(gptOsRoot, "Foundry", "Modules", "OpenBrain") };
      }
      return scope;
    });
  } catch {
    enrolled = [];
  }
  const scopes = [{
    id: "gpt-os",
    projectId: "GPT_OS",
    name: "GPT_OS",
    sourcePath: gptOsRoot,
    remote: "KaydenClark/GPT_OS",
    notes: "Master Producer Workspace."
  }, ...enrolled];

  const foundryTopology = path.join(gptOsRoot, "Foundry", "reactivation-topology.json");
  try {
    const surface = JSON.parse(fs.readFileSync(foundryTopology, "utf8")).surfaces
      ?.find((entry) => entry.id === "foundry-product");
    if (surface && !scopes.some((scope) => scope.remote?.toLowerCase() === String(surface.remote).toLowerCase())) {
      scopes.push({
        id: "p-018",
        projectId: "P-018",
        name: "Foundry",
        sourcePath: path.join(gptOsRoot, surface.targetPath || "Projects/Foundry"),
        remote: surface.remote,
        notes: "Declared product project; checkout recovery may still be pending."
      });
    }
  } catch {
    // Enrollment stays truthful when the optional topology projection is absent.
  }
  return scopes;
}

export function buildFoundryPortfolio({
  gptOsRoot,
  runtimeRoot = null,
  serverSourceRoot = null,
  processCwd = null,
  runNext = runWorkbenchNext,
  now = () => new Date()
}) {
  const checkedAt = now().toISOString();
  if (!gptOsRoot) {
    return { status: "unavailable", detail: "GPT_OS root is not configured.", checkedAt, scopes: [], work: [] };
  }
  const scopes = loadDeclaredScopes(gptOsRoot, runtimeRoot, serverSourceRoot, processCwd).map((scope) => {
    const board = readScopeBoard(scope, now);
    const next = runNext(scope);
    const deployment = inspectDeployment(scope, checkedAt);
    const work = flattenWork(scope, board, checkedAt).map((item) => ({
      ...item,
      isNext: next.status === "ok" && item.specId === next.specId && item.ticketId === next.ticketId
    }));
    return {
      id: scope.id,
      projectId: scope.projectId,
      name: scope.name,
      remote: scope.remote,
      notes: scope.notes,
      next,
      deployment,
      board: board ? {
        updatedAt: board.updatedAt,
        counts: board.counts,
        specCount: board.specs.length,
        decisions: board.decisions
      } : null,
      work,
      projectionSource: toProjectionSource(scope, board, deployment, checkedAt)
    };
  });
  const work = scopes.flatMap((scope) => scope.work);
  const projectionSources = scopes.map((scope) => scope.projectionSource);
  const publicScopes = scopes.map(({ projectionSource: _projectionSource, ...scope }) => scope);
  return {
    status: scopes.length > 1 ? "ok" : "degraded",
    detail: "Registry-backed, read-only portfolio. Next work comes from each scope's LLM Workbench selector; Git evidence is local and does not fetch.",
    source: "GPT_OS + Projects/INDEX.md Active Portfolio Enrollment",
    checkedAt,
    scopes: publicScopes,
    work,
    projectionSources
  };
}
