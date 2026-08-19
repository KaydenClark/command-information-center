import React, { useEffect, useMemo, useState } from "react";
import { buildWorkKanban, labelForColumn, statusForColumn, WORK_COLUMNS } from "./workKanbanModel.js";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  CircleDot,
  Cloud,
  Command,
  ExternalLink,
  Filter,
  FolderKanban,
  GitBranch,
  Layers3,
  ListChecks,
  RefreshCw,
  Search,
  ShieldCheck,
  TimerReset,
  Workflow
} from "lucide-react";

async function requestPortfolio() {
  const response = await fetch("/api/foundry-portfolio", { credentials: "include" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Portfolio request failed: ${response.status}`);
  }
  return response.json();
}

async function requestWorkIntent(input) {
  const response = await fetch('/api/work-intents', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Intent request failed: ${response.status}`);
  }
  return response.json();
}

function intentNonce() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function usePortfolio() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function reload() {
    setBusy(true);
    setError("");
    try {
      setPayload(await requestPortfolio());
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => { reload(); }, []);
  return { payload, error, busy, reload };
}

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function formatTime(value) {
  if (!value) return "not checked";
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function Header({ icon, eyebrow, title, detail, meta, busy, onReload }) {
  const Icon = icon;
  return (
    <header className="foundry-page-header">
      <div className="foundry-page-title">
        <span className="foundry-title-icon"><Icon size={20} /></span>
        <div>
          <small>{eyebrow}</small>
          <h2>{title}</h2>
          <p>{detail}</p>
        </div>
      </div>
      <div className="foundry-header-actions">
        {meta ? <span className="foundry-source-chip"><ShieldCheck size={14} />{meta}</span> : null}
        {onReload ? (
          <button className="status-button" onClick={onReload} disabled={busy}>
            <RefreshCw size={15} className={busy ? "spin" : ""} /> Refresh
          </button>
        ) : null}
      </div>
    </header>
  );
}

function PortfolioState({ payload, error, busy }) {
  if (error) return <div className="error-banner">{error}</div>;
  if (!payload) return <div className="foundry-loading"><RefreshCw className="spin" size={22} /> Reading live project controls…</div>;
  return (
    <div className={cx("portfolio-provenance", payload.status)}>
      <span className="dot ok" />
      <strong>{payload.status === "ok" ? "Portfolio grounded" : "Portfolio degraded"}</strong>
      <span>{payload.source}</span>
      <small>{busy ? "Refreshing…" : `Checked ${formatTime(payload.checkedAt)}`}</small>
    </div>
  );
}

function NextOrder({ scope, compact = false }) {
  const next = scope.next || {};
  return (
    <article className={cx("next-order", `next-${next.status || "unavailable"}`, compact && "compact")}>
      <div className="next-order-head">
        <span className="project-mark">{scope.projectId}</span>
        <strong>{scope.name}</strong>
        <span className={cx("status-label", next.status === "ok" ? "ok" : next.status === "clear" ? "neutral" : "bad")}>
          {next.status === "ok" ? next.state || "selected" : next.status || "unavailable"}
        </span>
      </div>
      {next.status === "ok" ? (
        <>
          <code>{scope.projectId}/{next.specId}/{next.ticketId}</code>
          <p>{next.title}</p>
          {!compact && next.nextGate ? <small><ArrowRight size={13} /> {next.nextGate}</small> : null}
        </>
      ) : <p>{next.detail || "No authoritative next-work evidence is available."}</p>}
    </article>
  );
}

export function CommandDeckView() {
  const state = usePortfolio();
  const scopes = state.payload?.scopes || [];
  const selected = scopes.filter((scope) => scope.next?.status === "ok");
  const unavailable = scopes.filter((scope) => scope.next?.status === "unavailable" || scope.deployment?.status === "unavailable");
  const blocked = (state.payload?.work || []).filter((item) => /blocked/i.test(item.status));
  return (
    <div className="foundry-page command-deck" data-testid="command-deck">
      <Header icon={Command} eyebrow="Captain's station" title="Command Deck" detail="The smallest truthful view of what is active, what is next, and what needs intervention." meta="Registry + Workbench + Git" busy={state.busy} onReload={state.reload} />
      <PortfolioState {...state} />
      {state.payload ? (
        <>
          <section className="command-metrics">
            <div><Boxes size={18} /><strong>{scopes.length}</strong><span>declared scopes</span></div>
            <div><CircleDot size={18} /><strong>{selected.length}</strong><span>actionable next orders</span></div>
            <div><AlertTriangle size={18} /><strong>{blocked.length}</strong><span>blocked tickets</span></div>
            <div><GitBranch size={18} /><strong>{unavailable.length}</strong><span>truth gaps</span></div>
          </section>
          <section className="foundry-section">
            <div className="section-header"><span>Captain's next orders</span><small>Selected by each scope's LLM Workbench</small></div>
            <div className="next-order-grid">{scopes.map((scope) => <NextOrder key={scope.id} scope={scope} />)}</div>
          </section>
        </>
      ) : null}
    </div>
  );
}

export function PortfolioAwaitingView() {
  const state = usePortfolio();
  const decisions = (state.payload?.scopes || []).flatMap((scope) => (scope.board?.decisions || []).map((decision) => ({ ...decision, scope })));
  const blocked = (state.payload?.work || []).filter((item) => /blocked/i.test(item.status));
  const gaps = (state.payload?.scopes || []).filter((scope) => scope.next?.status === "unavailable" || scope.deployment?.status === "unavailable");
  return (
    <div className="foundry-page">
      <Header icon={AlertTriangle} eyebrow="Owner gate" title="Awaiting You" detail="Decisions, blocked Job Orders, and missing operational evidence that need your attention." meta="No inbox-derived tasks" busy={state.busy} onReload={state.reload} />
      <PortfolioState {...state} />
      {state.payload ? (
        <div className="awaiting-ops-grid">
          <section className="foundry-section"><div className="section-header"><span>Owner decisions</span><small>{decisions.length}</small></div>{decisions.length ? decisions.map((item) => <article className="ops-row" key={`${item.scope.id}-${item.id}`}><span className="project-mark">{item.scope.projectId}</span><div><strong>{item.decision}</strong><small>{item.recommendation || item.options || "No recommendation recorded."}</small></div></article>) : <p className="empty-ops">No recorded owner decisions.</p>}</section>
          <section className="foundry-section"><div className="section-header"><span>Blocked work</span><small>{blocked.length}</small></div>{blocked.length ? blocked.map((item) => <article className="ops-row" key={item.reference}><code>{item.reference}</code><div><strong>{item.title}</strong><small>{item.blockers || "Blocker detail not recorded."}</small></div></article>) : <p className="empty-ops">No blocked tickets in enrolled controls.</p>}</section>
          <section className="foundry-section"><div className="section-header"><span>Evidence gaps</span><small>{gaps.length}</small></div>{gaps.map((scope) => <article className="ops-row" key={scope.id}><span className="project-mark">{scope.projectId}</span><div><strong>{scope.name}</strong><small>{scope.next?.detail || scope.deployment?.detail}</small></div></article>)}</section>
        </div>
      ) : null}
    </div>
  );
}

export function FoundryIntelligenceView() {
  const state = usePortfolio();
  const scopes = state.payload?.scopes || [];
  return (
    <div className="foundry-page">
      <Header icon={Layers3} eyebrow="Operational sensing" title="Foundry Intelligence" detail="Cross-project signals derived from live control surfaces, not email or personal activity." meta="Read-only" busy={state.busy} onReload={state.reload} />
      <PortfolioState {...state} />
      {state.payload ? <div className="intelligence-grid">
        <section className="foundry-section"><div className="section-header"><span>Control coverage</span><small>{scopes.length} scopes</small></div>{scopes.map((scope) => <div className="coverage-row" key={scope.id}><span>{scope.projectId}</span><strong>{scope.name}</strong><em className={scope.board ? "ok" : "bad"}>{scope.board ? `${scope.board.specCount} specs` : "no board"}</em><em className={scope.next?.status === "ok" ? "ok" : "bad"}>{scope.next?.status === "ok" ? "next selected" : "selector unavailable"}</em></div>)}</section>
        <section className="foundry-section"><div className="section-header"><span>Branch watch</span><small>local Git evidence</small></div>{scopes.map((scope) => <div className="coverage-row" key={scope.id}><span>{scope.projectId}</span><strong>{scope.deployment?.currentBranch || "unavailable"}</strong><em className={scope.deployment?.dirtyFiles === 0 ? "ok" : "warn"}>{scope.deployment?.dirtyFiles == null ? "unknown dirty state" : `${scope.deployment.dirtyFiles} changed`}</em></div>)}</section>
      </div> : null}
    </div>
  );
}

export function StewardsSummaryView() {
  const state = usePortfolio();
  return (
    <div className="foundry-page">
      <Header icon={ListChecks} eyebrow="Shift handoff" title="Steward's Summary" detail="A source-linked operational brief: current next orders first, unknowns kept visible." meta="Generated live" busy={state.busy} onReload={state.reload} />
      <PortfolioState {...state} />
      {state.payload ? <section className="steward-ledger">{state.payload.scopes.map((scope, index) => <div className="steward-line" key={scope.id}><span>{String(index + 1).padStart(2, "0")}</span><NextOrder scope={scope} compact /></div>)}</section> : null}
    </div>
  );
}

export function WorkKanbanBoard({ projection, query = '', projectId = 'all', onIntent, busy = false }) {
  const board = useMemo(() => buildWorkKanban(projection, { query, projectId }), [projection, query, projectId]);
  const tickets = useMemo(() => new Map((projection?.specs || []).flatMap((spec) => spec.tickets || []).map((ticket) => [ticket.fuid, ticket])), [projection]);
  const drop = (event, columnId) => {
    event.preventDefault();
    const ticket = tickets.get(event.dataTransfer.getData('text/work-fuid'));
    if (!ticket || ticket.column === columnId || ticket.pendingIntent || busy) return;
    onIntent?.(ticket, columnId);
  };
  return <section className="work-kanban" aria-label="Spec-grouped work kanban">
    {WORK_COLUMNS.map((column) => <section
      className={`work-column work-column-${column.id}`}
      data-column={column.id}
      key={column.id}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => drop(event, column.id)}
    >
      <header><div><span className="work-column-dot" /><h3>{column.label}</h3></div><strong>{board[column.id].count}</strong></header>
      <div className="work-column-body">
        {board[column.id].specs.map((spec) => <section className="work-spec-group" data-spec-fuid={spec.fuid} key={spec.fuid}>
          <header><strong>{spec.fuid}</strong><code>{spec.alias}</code><span>{spec.title}</span></header>
          <div>{spec.tickets.map((ticket) => <article
            className={`work-ticket-card${ticket.pendingIntent ? ' has-pending-intent' : ''}`}
            draggable={!ticket.pendingIntent && !busy}
            data-ticket-fuid={ticket.fuid}
            onDragStart={(event) => event.dataTransfer.setData('text/work-fuid', ticket.fuid)}
            key={ticket.fuid}
          >
            <div className="work-ticket-identity"><strong>{ticket.fuid}</strong><code>{ticket.alias}</code></div>
            <h4>{ticket.title}</h4>
            <dl><div><dt>Created</dt><dd>{ticket.created}</dd></div><div><dt>Last worked</dt><dd>{ticket.lastWorked}</dd></div></dl>
            {ticket.blockers && ticket.blockers !== 'none' ? <p><AlertTriangle size={13} />{ticket.blockers}</p> : null}
            {ticket.pendingIntent ? <div className="pending-intent"><CircleDot size={13} /><span>Pending → {labelForColumn(ticket.pendingIntent.pendingColumn)}</span><code>{ticket.pendingIntent.fuid}</code></div> : null}
          </article>)}</div>
        </section>)}
        {!board[column.id].count ? <p className="empty-work-column">No matching tickets</p> : null}
      </div>
    </section>)}
  </section>;
}

export function MasterTaskboardView() {
  const state = usePortfolio();
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("all");
  const [intentBusy, setIntentBusy] = useState(false);
  const [intentError, setIntentError] = useState('');
  const projection = state.payload?.projection || { specs: [], sources: [] };
  const total = (projection.specs || []).reduce((count, spec) => count + (spec.tickets || []).length, 0);
  async function createIntent(ticket, columnId) {
    setIntentBusy(true);
    setIntentError('');
    try {
      await requestWorkIntent({
        targetFuid: ticket.fuid,
        requestedStatus: statusForColumn(columnId),
        actor: 'CIC operator',
        sourceRevision: ticket.sourceRevision,
        idempotencyKey: `kanban-${ticket.fuid}-${columnId}-${intentNonce()}`
      });
      await state.reload();
    } catch (error) {
      setIntentError(error.message);
    } finally {
      setIntentBusy(false);
    }
  }
  return (
    <div className="foundry-page master-taskboard" data-testid="master-taskboard">
      <Header icon={FolderKanban} eyebrow="Work-item projection" title="Master Taskboard" detail="Canonical Tickets grouped under their Specs. Dragging requests movement; it does not rewrite Canon." meta="SQLite Projection · Intent-gated" busy={state.busy || intentBusy} onReload={state.reload} />
      <PortfolioState {...state} />
      {state.payload ? <>
        <div className="projection-boundary"><ShieldCheck size={16} /><span><strong>Projection, not Canon.</strong> Refresh rebuilds this board from repository controls. A drop creates pending Intent only.</span><small>{projection.refresh ? `Refresh ${projection.refresh.fuid} · ${formatTime(projection.refresh.completedAt)}` : 'Not captured'}</small></div>
        {intentError ? <div className="error-banner">{intentError}</div> : null}
        <section className="taskboard-controls">
          <label className="portfolio-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search FUID, alias, Spec, Ticket, blocker, or date" aria-label="Search master taskboard" /></label>
          <label><Filter size={15} /><select value={projectId} onChange={(event) => setProjectId(event.target.value)} aria-label="Filter master taskboard by project"><option value="all">All projects</option>{state.payload.scopes.map((scope) => <option value={scope.projectId} key={scope.id}>{scope.projectId} · {scope.name}</option>)}</select></label>
          <strong>{total} projected tickets</strong>
        </section>
        <WorkKanbanBoard projection={projection} query={query} projectId={projectId} onIntent={createIntent} busy={intentBusy} />
      </> : null}
    </div>
  );
}

export function OperationsScheduleView() {
  const state = usePortfolio();
  const queued = (state.payload?.scopes || []).filter((scope) => scope.next?.status === "ok");
  return <div className="foundry-page"><Header icon={TimerReset} eyebrow="Scheduling Hall view" title="Scheduling" detail="A dependency-safe queue of currently selected work. Time promises are withheld until a scheduler socket is connected." meta="Sequence, not calendar fiction" busy={state.busy} onReload={state.reload} /><PortfolioState {...state} />{state.payload ? <><div className="schedule-warning"><AlertTriangle size={16} /><span>No live Foundry scheduler feed is connected in v1.0.1. This view shows selection order only; it does not invent dates.</span></div><ol className="operations-sequence">{queued.map((scope, index) => <li key={scope.id}><span>{index + 1}</span><NextOrder scope={scope} compact /></li>)}</ol></> : null}</div>;
}

export function PortfolioProjectsView() {
  const state = usePortfolio();
  const [selectedId, setSelectedId] = useState("");
  const scopes = state.payload?.scopes || [];
  const selected = scopes.find((scope) => scope.id === selectedId) || scopes[0] || null;
  return <div className="foundry-page"><Header icon={Boxes} eyebrow="Enrollment" title="Projects" detail="Every active producer/module lane, including GPT_OS, with one selected Workshop drill-down into current control and deployment evidence." meta="Registry-backed" busy={state.busy} onReload={state.reload} /><PortfolioState {...state} />{state.payload ? <><div className="project-portfolio-grid">{scopes.map((scope) => <article className={cx("project-portfolio-card", selected?.id === scope.id && "selected")} key={scope.id}><div><span className="project-mark">{scope.projectId}</span><span className={cx("status-label", scope.next?.status === "ok" ? "ok" : "bad")}>{scope.next?.status}</span></div><h3>{scope.name}</h3><a href={`https://github.com/${scope.remote}`} target="_blank" rel="noreferrer">{scope.remote}<ExternalLink size={13} /></a><p>{scope.notes}</p><dl><div><dt>Stable specs</dt><dd>{scope.board?.specCount ?? "unavailable"}</dd></div><div><dt>Branch</dt><dd>{scope.deployment?.currentBranch || "unavailable"}</dd></div></dl><button className="project-inspect" onClick={() => setSelectedId(scope.id)}>Inspect {scope.projectId}</button></article>)}</div>{selected ? <section className="project-drilldown" data-testid="project-drilldown"><div><small>Selected Workshop</small><h3><span className="project-mark">{selected.projectId}</span>{selected.name}</h3><p>{selected.notes}</p></div><NextOrder scope={selected} /><dl><div><dt>Declared remote</dt><dd>{selected.remote}</dd></div><div><dt>Observed repository</dt><dd>{selected.deployment?.observedRepository || "unavailable"}</dd></div><div><dt>Branch / SHA</dt><dd>{selected.deployment?.currentBranch || "unavailable"} · {selected.deployment?.headSha?.slice(0, 12) || "—"}</dd></div><div><dt>Control coverage</dt><dd>{selected.board ? `${selected.board.specCount} stable specs` : "Taskboard unavailable"}</dd></div></dl></section> : null}</> : null}</div>;
}

export function PortfolioDeploymentsView() {
  const state = usePortfolio();
  return <div className="foundry-page"><Header icon={Cloud} eyebrow="Git and release evidence" title="Deployments" detail="Declared remote, producer checkout, installed product, runtime, exact SHA, dirtiness, and evidence boundary for every enrolled scope." meta="No fetch performed" busy={state.busy} onReload={state.reload} /><PortfolioState {...state} />{state.payload ? <section className="deployment-ledger"><div className="deployment-row deployment-head"><span>Project</span><span>Declared remote</span><span>Observed branches</span><span>Observed HEAD</span><span>State</span></div>{state.payload.scopes.map((scope) => { const deployment = scope.deployment || {}; const branchLabel = deployment.evidence === "declared_checkout" ? "producer" : "workspace"; return <article className="deployment-row" data-project-id={scope.projectId} key={scope.id}><div><span className="project-mark">{scope.projectId}</span><strong>{scope.name}</strong></div><a href={`https://github.com/${scope.remote}`} target="_blank" rel="noreferrer">{scope.remote}</a><div className="deployment-branches"><code><GitBranch size={13} />{branchLabel} · {deployment.observedRepository || "unidentified"} · {deployment.currentBranch || "unavailable"}</code>{deployment.installed ? <code><GitBranch size={13} />installed · {deployment.installed.observedRepository || scope.remote} · {deployment.installed.currentBranch || "unavailable"}</code> : null}{deployment.runtime ? <code><CircleDot size={13} />runtime · {deployment.runtime.currentBranch || "unavailable"}</code> : null}</div><code>{deployment.headSha?.slice(0, 12) || "—"}</code><div><span className={cx("status-label", deployment.status === "observed" ? "ok" : deployment.status === "partial" ? "warn" : "bad")}>{deployment.status}</span><small>{deployment.dirtyFiles == null ? "dirty unknown" : `${deployment.dirtyFiles} changed`} · {deployment.evidence}</small></div><p>{deployment.detail} {deployment.upstream ? `Upstream ${deployment.upstream}: ${deployment.aheadBy} ahead / ${deployment.behindBy} behind.` : "No upstream is configured for this checkout."}{deployment.installed ? ` Installed ${deployment.installed.headSha?.slice(0, 12) || "unavailable"}; ${deployment.installed.dirtyFiles ?? "unknown"} changed.` : ""}{deployment.runtime ? ` Runtime PID ${deployment.runtime.pid} is served from the installed product; ${deployment.runtime.evidence}.` : " Runtime execution source is not proven by this process."}</p></article>; })}</section> : null}</div>;
}

export function FoundryView() {
  const state = usePortfolio();
  const cic = state.payload?.scopes?.find((scope) => scope.projectId === "P-005") || null;
  const gptOs = state.payload?.scopes?.find((scope) => scope.projectId === "GPT_OS") || null;
  return (
    <div className="foundry-page foundry-schematic-view" data-testid="foundry-view">
      <Header icon={Workflow} eyebrow="Live projection" title="Foundry" detail="The Schematic is the live, deterministic projection of Canon—the blueprint to inspect while operating the Foundry." meta="Projection · never authority" />
      <div className="schematic-boundary"><ShieldCheck size={16} /><strong>Projection boundary</strong><span>This frame explains intended Foundry structure and flow. It does not claim runtime execution or authorize a Job Order.</span><a href="http://servitor.local:5173/" target="_blank" rel="noreferrer">Open full screen <ExternalLink size={13} /></a></div>
      <div className="foundry-projection-grid">
        <section className="schematic-frame-shell">
          <div className="schematic-frame-bar"><span className="dot ok" /><strong>servitor.local:5173</strong><span>Live Schematic</span></div>
          <iframe title="Live Foundry Schematic" src="http://servitor.local:5173/" loading="eager" />
        </section>
        <aside className="operational-mirror" aria-label="Operational Mirror">
          <div className="section-header"><span>Operational Mirror</span><small>observed separately</small></div>
          <div className="mirror-field"><small>CIC liveness evidence</small><strong className={cic?.deployment?.runtime ? "ok" : "warn"}>{cic?.deployment?.runtime ? "Runtime observed" : "Runtime unavailable"}</strong><span>{cic?.deployment?.runtime ? `PID ${cic.deployment.runtime.pid} · installed ${cic.deployment.runtime.currentBranch}` : "No executing-source proof in this response."}</span></div>
          <div className="mirror-field"><small>Activation state</small><strong className="warn">Unavailable</strong><span>No Announced Activation event feed is connected; CIC does not infer L0 or an active Job Order.</span></div>
          <div className="mirror-field"><small>Observed revisions</small><strong>{cic?.deployment?.runtime?.headSha?.slice(0, 12) || cic?.deployment?.headSha?.slice(0, 12) || "CIC unavailable"}</strong><span>GPT_OS {gptOs?.deployment?.headSha?.slice(0, 12) || "unavailable"}</span></div>
          <div className="mirror-field"><small>Source freshness</small><strong>{state.payload ? formatTime(state.payload.checkedAt) : "Unavailable"}</strong><span>{state.payload?.source || state.error || "Portfolio evidence has not loaded."}</span></div>
          <div className="mirror-caution"><AlertTriangle size={17} /><span>No active Job Orders are displayed. Projection and observed operation remain separate.</span></div>
        </aside>
      </div>
      <section className="job-flow-future"><Workflow size={22} /><div><strong>Live Job Order flow is the next victory condition.</strong><p>v1.0.1 deliberately stops at the live Schematic plus authoritative project work. No animation here pretends that active Job Orders are flowing through Halls yet.</p></div><span>FUTURE CAPABILITY</span></section>
    </div>
  );
}
