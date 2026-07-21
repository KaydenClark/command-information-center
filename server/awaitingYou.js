import { listProjectTaskboards, readProjectTaskboard } from "./taskboards.js";

// A blocker awaits the owner when it names the owner or Kayden and is not a
// dependency on other work and not already resolved. Blockers that only cite
// other tickets/specs/projects never mention the owner, so they fall through.
const OWNER_MENTION = /\b(owner|kayden)\b/i;
const RESOLVED = /\b(on record|received|granted|waived|cleared|no longer (needed|required|blocked)|already (granted|approved|accepted|confirmed|decided))\b/i;

export function isOwnerGatedBlocker(text) {
  const value = String(text || "").trim();
  if (!value || /^none\b/i.test(value)) return false;
  if (!OWNER_MENTION.test(value)) return false;
  if (RESOLVED.test(value)) return false;
  return true;
}

// Owner Decisions rows are the owner's by definition; treat an unassigned or
// Kayden-owned row as awaiting him, and skip rows explicitly owned elsewhere.
function ownerAwaitsDecision(owner) {
  const value = String(owner || "").trim().toLowerCase();
  return value === "" || value === "owner" || /\bkayden\b/.test(value);
}

function decisionItem(board, decision) {
  return {
    id: `${board.slug}:${decision.id}:decision`,
    kind: "decision",
    project: board.name,
    projectSlug: board.slug,
    projectId: board.projectId || null,
    specId: decision.id,
    ticketId: "",
    title: decision.decision,
    decision: decision.decision,
    blocker: "",
    options: decision.options || "",
    recommendation: decision.recommendation || "",
    impact: decision.impact || "",
    nextGate: decision.nextGate || "",
    owner: decision.owner || "",
    action: { type: "open-project", projectSlug: board.slug, specId: decision.id }
  };
}

function blockerItem(board, spec, ticket) {
  const isTicket = Boolean(ticket);
  return {
    id: `${board.slug}:${spec.id}:${isTicket ? ticket.id : "spec"}`,
    kind: "blocker",
    project: board.name,
    projectSlug: board.slug,
    projectId: board.projectId || null,
    specId: spec.id,
    ticketId: isTicket ? ticket.id : "",
    title: (isTicket ? ticket.title : spec.title) || spec.title || spec.id,
    decision: spec.nextGate || "",
    blocker: isTicket ? ticket.blockers : spec.blockers,
    options: "",
    recommendation: "",
    impact: "",
    nextGate: spec.nextGate || "",
    owner: spec.owner || "",
    action: { type: "open-project", projectSlug: board.slug, specId: spec.id }
  };
}

export function collectAwaitingYou(projectsRoot, { now = () => new Date() } = {}) {
  const summaries = listProjectTaskboards(projectsRoot);
  const items = [];
  for (const summary of summaries) {
    const board = readProjectTaskboard(projectsRoot, summary.slug);

    for (const decision of board.decisions) {
      if (!ownerAwaitsDecision(decision.owner)) continue;
      items.push(decisionItem(board, decision));
    }

    for (const spec of board.specs) {
      if (isOwnerGatedBlocker(spec.blockers)) {
        // A spec-level owner gate represents the whole spec; suppress the
        // duplicate ticket rows that restate the same gate.
        items.push(blockerItem(board, spec, null));
        continue;
      }
      for (const ticket of spec.tickets) {
        if (isOwnerGatedBlocker(ticket.blockers)) items.push(blockerItem(board, spec, ticket));
      }
    }
  }

  const decisions = items.filter((item) => item.kind === "decision").length;
  return {
    generatedAt: now().toISOString(),
    projectCount: summaries.length,
    counts: { decisions, blockers: items.length - decisions, total: items.length },
    items
  };
}
