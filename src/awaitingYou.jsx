import React from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Gavel, RefreshCw, UserCheck } from "lucide-react";

function kindMeta(kind) {
  if (kind === "decision") return { label: "Decision", icon: Gavel, tone: "decision" };
  return { label: "Blocker", icon: AlertTriangle, tone: "blocker" };
}

function AwaitingField({ label, value }) {
  if (!value) return null;
  return (
    <div className="awaiting-field">
      <small>{label}</small>
      <span>{value}</span>
    </div>
  );
}

function AwaitingItem({ item, onOpenItem }) {
  const meta = kindMeta(item.kind);
  const Icon = meta.icon;
  const reference = item.ticketId ? `${item.specId} · ${item.ticketId}` : item.specId;
  return (
    <article className={`awaiting-item ${meta.tone}`} data-testid="awaiting-item">
      <div className="awaiting-item-head">
        <span className={`awaiting-kind ${meta.tone}`}><Icon size={13} /> {meta.label}</span>
        <span className="awaiting-project">
          <strong>{item.project}</strong>
          <small>{item.projectId || "Unnumbered"} · {reference}</small>
        </span>
      </div>

      {item.kind === "blocker" ? (
        <p className="awaiting-blocker"><small>Blocked on you</small><span>{item.blocker}</span></p>
      ) : null}

      <p className="awaiting-decision">
        <small>{item.kind === "decision" ? "Decision needed" : "Next gate"}</small>
        <span>{item.decision || "No decision text recorded in the source."}</span>
      </p>

      <div className="awaiting-fields">
        <AwaitingField label="Options" value={item.options} />
        <AwaitingField label="Recommendation" value={item.recommendation} />
        <AwaitingField label="Cost / impact" value={item.impact} />
        <AwaitingField label="Owner" value={item.owner} />
      </div>

      <div className="awaiting-actions">
        <button className="awaiting-open" onClick={() => onOpenItem(item)}>
          Open in Projects <ArrowUpRight size={14} />
        </button>
      </div>
    </article>
  );
}

export function AwaitingYouView({ awaiting, onOpenItem, onRefresh }) {
  const items = awaiting?.items || [];
  const total = awaiting?.counts?.total || 0;
  const decisions = awaiting?.counts?.decisions || 0;
  const blockers = awaiting?.counts?.blockers || 0;
  const ordered = [...items].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "decision" ? -1 : 1;
    return (a.project || "").localeCompare(b.project || "");
  });

  return (
    <section className="panel awaiting-panel" data-testid="awaiting-you">
      <div className="panel-title awaiting-title">
        <span className="panel-icon pink"><UserCheck size={17} /></span>
        <div>
          <h2>Awaiting You</h2>
          <small>Owner decisions and owner-gated blockers across every project</small>
        </div>
        <button className="awaiting-refresh" onClick={onRefresh} disabled={awaiting?.loading} aria-label="Refresh awaiting-you queue">
          <RefreshCw size={15} className={awaiting?.loading ? "spin" : ""} />
        </button>
      </div>

      {awaiting?.error ? <div className="error-banner">{awaiting.error}</div> : null}

      {awaiting?.loading && !items.length ? (
        <div className="awaiting-loading"><RefreshCw className="spin" size={22} /> Scanning project boards…</div>
      ) : total === 0 && !awaiting?.error ? (
        <div className="awaiting-empty" data-testid="awaiting-empty">
          <CheckCircle2 size={26} />
          <strong>Nothing is waiting on you.</strong>
          <p>Every owner decision and owner-gated blocker across your projects is clear. New items appear here the moment a board records one.</p>
        </div>
      ) : (
        <>
          <div className="awaiting-summary" aria-label="Awaiting-you counts">
            <span><strong>{total}</strong><small>Total</small></span>
            <span><Gavel size={13} /><strong>{decisions}</strong><small>Decisions</small></span>
            <span><AlertTriangle size={13} /><strong>{blockers}</strong><small>Blockers</small></span>
          </div>
          <div className="awaiting-list">
            {ordered.map((item) => (
              <AwaitingItem key={item.id} item={item} onOpenItem={onOpenItem} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
