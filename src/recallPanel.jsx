import React, { useEffect, useState } from "react";
import { Database, MapPin, RefreshCw, ShieldCheck } from "lucide-react";

async function api(path) {
  const response = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.detail || `Request failed: ${response.status}`);
  }
  return response.json();
}

function freshnessLabel(freshness) {
  if (!freshness) return "Unknown";
  const state = freshness.state || "unknown";
  if (!freshness.asOf) return state;
  const date = new Date(freshness.asOf);
  if (Number.isNaN(date.getTime())) return state;
  return `${state} · ${date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
}

// S-014 TK-004: renders ONE recall value resolved THROUGH the K-001 socket
// contract, showing provenance + freshness. The badge makes the contract seam
// visible: the value arrived via the recall.query entrypoint, not a reach-around.
export function RecallSocketPanel() {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    setError("");
    try {
      setPayload(await api("/api/recall"));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const card = payload?.card;

  return (
    <section className="panel recall-panel" aria-label="Recall socket">
      <header className="panel-head recall-head">
        <div className="recall-title">
          <Database size={18} aria-hidden="true" />
          <h2>Recall socket</h2>
          <span className="recall-contract-badge">
            <ShieldCheck size={13} aria-hidden="true" />
            {payload?.contract ? `${payload.contract.socket} · ${payload.contract.entrypoint}` : "K-001 · recall.query"}
          </span>
          {payload?.demo ? <span className="recall-demo-badge">demo</span> : null}
        </div>
        <button type="button" className="recall-refresh" onClick={load} disabled={busy} aria-label="Refresh recall">
          <RefreshCw size={15} aria-hidden="true" className={busy ? "spin" : ""} />
        </button>
      </header>

      {error ? <p className="recall-error">{error}</p> : null}

      {card ? (
        <div className="recall-body">
          <p className="recall-query">Q: {card.query}</p>
          <p className="recall-value">{card.value ?? "No recall value available."}</p>
          <dl className="recall-meta">
            <div>
              <dt><MapPin size={13} aria-hidden="true" /> Provenance</dt>
              <dd>{card.provenance?.path || card.provenance?.title || "unknown source"}</dd>
            </div>
            <div>
              <dt>Freshness</dt>
              <dd className={`recall-freshness state-${card.freshness?.state || "unknown"}`}>
                {freshnessLabel(card.freshness)}
              </dd>
            </div>
            <div>
              <dt>Resolved via</dt>
              <dd>{card.resolvedVia} · {card.entrypoint}</dd>
            </div>
          </dl>
        </div>
      ) : (
        !error && <p className="recall-loading">Resolving through the K-001 contract…</p>
      )}
    </section>
  );
}
