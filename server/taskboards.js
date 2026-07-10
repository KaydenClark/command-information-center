import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const GROUPS = new Map([
  ["ready", "ready"],
  ["in progress", "inProgress"],
  ["in-progress", "inProgress"],
  ["blocked", "blocked"],
  ["deferred", "deferred"],
  ["backlog", "deferred"],
  ["done", "done"]
]);
const PRIORITIES = new Set(["P1", "P2", "P3"]);

function httpError(message, status) {
  return Object.assign(new Error(message), { status });
}

function cleanMarkdown(value = "") {
  return String(value)
    .replace(/<!--.*?-->/g, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*`~]/g, "")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/\\\|/g, "|")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "project";
}

function splitMarkdownRow(line) {
  const source = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells = [];
  let cell = "";
  let escaped = false;
  for (const character of source) {
    if (escaped) {
      cell += character === "|" ? "\\|" : `\\${character}`;
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (character === "|") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }
  if (escaped) cell += "\\";
  cells.push(cell.trim());
  return cells;
}

function isDivider(line = "") {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function sectionsFrom(source) {
  const sections = [];
  let current = null;
  for (const line of source.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = { title: cleanMarkdown(heading[1]), lines: [] };
      sections.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }
  return sections;
}

function tablesFrom(lines) {
  const tables = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!lines[index].trim().startsWith("|") || !isDivider(lines[index + 1])) continue;
    const headers = splitMarkdownRow(lines[index]).map(cleanMarkdown);
    const rows = [];
    index += 2;
    while (index < lines.length && lines[index].trim().startsWith("|")) {
      if (!isDivider(lines[index])) {
        const cells = splitMarkdownRow(lines[index]);
        rows.push(Object.fromEntries(headers.map((header, cellIndex) => [header, cleanMarkdown(cells[cellIndex] || "")])));
      }
      index += 1;
    }
    index -= 1;
    tables.push({ headers, rows });
  }
  return tables;
}

function field(row, ...names) {
  const found = Object.entries(row).find(([key]) => names.some((name) => key.toLowerCase() === name));
  return found?.[1] || "";
}

function normalizePriority(value) {
  const match = cleanMarkdown(value).toUpperCase().match(/^P?([123])$/);
  return match ? `P${match[1]}` : null;
}

function isOpenDecision(row) {
  const status = field(row, "status").toLowerCase();
  return status && !/(decided|resolved|closed|done|complete|accepted)/.test(status);
}

function parseBoard(source, metadata) {
  const sections = sectionsFrom(source);
  const groups = { ready: [], inProgress: [], blocked: [], deferred: [], done: [] };
  const decisions = [];
  const briefSection = sections.find((section) => section.title.toLowerCase() === "executive brief");
  const brief = (briefSection?.lines || [])
    .filter((line) => /^\s*[-*]\s+/.test(line))
    .map((line) => cleanMarkdown(line.replace(/^\s*[-*]\s+/, "")))
    .filter(Boolean);

  for (const section of sections) {
    const normalizedTitle = section.title.toLowerCase();
    if (normalizedTitle === "pending decisions") {
      for (const table of tablesFrom(section.lines)) {
        for (const row of table.rows) {
          const id = field(row, "id");
          const decision = field(row, "decision");
          if (!id || id.toLowerCase() === "none" || !decision || !isOpenDecision(row)) continue;
          decisions.push({
            id,
            decision,
            options: field(row, "options"),
            recommendation: field(row, "recommendation", "resolution"),
            impact: field(row, "cost / impact", "impact"),
            owner: field(row, "owner"),
            status: field(row, "status")
          });
        }
      }
      continue;
    }

    const groupName = GROUPS.get(normalizedTitle);
    if (!groupName) continue;
    for (const table of tablesFrom(section.lines)) {
      for (const row of table.rows) {
        const id = field(row, "id");
        const title = field(row, "task", "task / area", "title");
        if (!id || id.toLowerCase() === "none" || !title) continue;
        groups[groupName].push({
          id,
          title,
          priority: normalizePriority(field(row, "priority")),
          status: field(row, "status") || section.title,
          owner: field(row, "owner"),
          lastUpdated: field(row, "last update", "completed", "started"),
          detail: field(
            row,
            "current note",
            "blocked on",
            "source / why now",
            "result",
            "deferred until",
            "why it matters",
            "proof required"
          ),
          section: section.title
        });
      }
    }
  }

  const counts = Object.fromEntries(Object.entries(groups).map(([key, tasks]) => [key, tasks.length]));
  return { ...metadata, brief, decisions, groups, counts, taskCount: Object.values(counts).reduce((sum, count) => sum + count, 0) };
}

function discoverProjects(projectsRoot) {
  if (!fs.existsSync(projectsRoot)) return [];
  const root = fs.realpathSync(projectsRoot);
  const projects = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
    .map((entry) => {
      const filePath = path.join(root, entry.name, "TASKBOARD.md");
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
      return { name: entry.name, slug: slugify(entry.name), filePath };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  const seen = new Map();
  for (const project of projects) {
    const count = seen.get(project.slug) || 0;
    seen.set(project.slug, count + 1);
    if (count) project.slug = `${project.slug}-${crypto.createHash("sha1").update(project.name).digest("hex").slice(0, 6)}`;
  }
  return projects;
}

function resolveProject(projectsRoot, slug) {
  const project = discoverProjects(projectsRoot).find((candidate) => candidate.slug === slug);
  if (!project) throw httpError("Project taskboard not found.", 404);
  return project;
}

export function readProjectTaskboard(projectsRoot, slug) {
  const project = resolveProject(projectsRoot, slug);
  const stats = fs.statSync(project.filePath);
  return parseBoard(fs.readFileSync(project.filePath, "utf8"), {
    name: project.name,
    slug: project.slug,
    updatedAt: stats.mtime.toISOString()
  });
}

export function listProjectTaskboards(projectsRoot) {
  return discoverProjects(projectsRoot).map((project) => {
    const board = readProjectTaskboard(projectsRoot, project.slug);
    return {
      name: board.name,
      slug: board.slug,
      updatedAt: board.updatedAt,
      brief: board.brief,
      counts: board.counts,
      decisionCount: board.decisions.length,
      taskCount: board.taskCount
    };
  });
}

export function updateProjectTaskPriority(projectsRoot, slug, taskId, priority) {
  const normalizedPriority = String(priority || "").toUpperCase();
  if (!PRIORITIES.has(normalizedPriority)) throw httpError("Priority must be P1, P2, or P3.", 400);
  const project = resolveProject(projectsRoot, slug);
  const source = fs.readFileSync(project.filePath, "utf8");
  const lines = source.split(/\r?\n/);
  let headers = null;
  let dividerExpected = false;
  const matches = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^##\s+/.test(line)) {
      headers = null;
      dividerExpected = false;
      continue;
    }
    if (!line.trim().startsWith("|")) {
      headers = null;
      dividerExpected = false;
      continue;
    }
    if (!headers) {
      headers = splitMarkdownRow(line).map(cleanMarkdown);
      dividerExpected = true;
      continue;
    }
    if (dividerExpected) {
      if (!isDivider(line)) headers = null;
      dividerExpected = false;
      continue;
    }

    const idIndex = headers.findIndex((header) => header.toLowerCase() === "id");
    const priorityIndex = headers.findIndex((header) => header.toLowerCase() === "priority");
    if (idIndex < 0 || priorityIndex < 0) continue;
    const cells = splitMarkdownRow(line);
    if (cleanMarkdown(cells[idIndex]) !== taskId) continue;
    matches.push({ index, cells, priorityIndex });
  }

  if (!matches.length) throw httpError("Task priority could not be updated.", 409);
  if (matches.length > 1) throw httpError("Task priority could not be updated because multiple matching rows were found.", 409);
  const [{ index, cells, priorityIndex }] = matches;
  const usesPrefix = /^P/i.test(cleanMarkdown(cells[priorityIndex]));
  cells[priorityIndex] = usesPrefix ? normalizedPriority : normalizedPriority.slice(1);
  lines[index] = `| ${cells.join(" | ")} |`;
  const nextSource = lines.join("\n");
  const temporaryPath = `${project.filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(temporaryPath, nextSource, { mode: fs.statSync(project.filePath).mode });
  fs.renameSync(temporaryPath, project.filePath);
  return { project: project.slug, taskId, priority: normalizedPriority, updatedAt: fs.statSync(project.filePath).mtime.toISOString() };
}
