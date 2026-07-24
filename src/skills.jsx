import React, { useEffect, useState } from "react";
import { Blocks, RefreshCw } from "lucide-react";
import { buildSkillsViewModel } from "./skillCatalogModel.js";

// S-022 read-only Skills view. Renders the GET /api/skills payload — every
// catalog entry, in catalog order, with name, definition, rewrite lane,
// availability, per-entry provenance, freshness, and canon-versus-deployed
// drift badge (TK-001 wired the tracer bullet; TK-002 widened it to the full
// catalog with per-entry provenance). CIC exposes no create/edit/sync/deploy
// action here.

async function requestJson(path) {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }
  return response.json();
}

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function SkillBadge({ label, tone }) {
  return <span className={cx("skill-badge", `skill-badge-${tone}`)}>{label}</span>;
}

function SkillEntry({ entry }) {
  const provenanceTitle = [entry.canonPath, entry.deployedPath].filter(Boolean).join(" · ");
  return (
    <article className="skill-entry" data-testid="skill-entry">
      <div className="skill-entry-head">
        <strong>{entry.name}</strong>
        <span className="skill-lane">{entry.lane}</span>
      </div>
      <p className="skill-definition">{entry.definition}</p>
      <div className="skill-entry-fields">
        <div className="skill-field">
          <small>Availability</small>
          <span>{entry.availability}</span>
        </div>
        <div className="skill-field">
          <small>Provenance</small>
          <span
            className="skill-provenance"
            data-testid="skill-provenance"
            title={provenanceTitle || entry.provenanceLabel}
          >
            {entry.provenanceLabel}
          </span>
        </div>
        <div className="skill-field">
          <small>Freshness</small>
          <span data-testid="skill-freshness">{entry.freshnessLabel}</span>
        </div>
        <div className="skill-field">
          <small>Canon vs. deployed</small>
          <span data-testid="skill-drift-badge">
            <SkillBadge label={entry.driftLabel} tone={entry.driftTone} />
          </span>
        </div>
      </div>
    </article>
  );
}

export function SkillsContent({ payload, fetchError = "", busy = false, onReload = () => {} }) {
  const vm = buildSkillsViewModel(payload);

  return (
    <section className="panel skill-panel" data-testid="skills-view">
      <div className="panel-title">
        <div className="page-header">
          <span className="panel-icon lavender"><Blocks size={17} /></span>
          <div>
            <h2>Skills</h2>
            <small>Read-only agent skill catalog, source, freshness, and canon-versus-deployed drift</small>
          </div>
        </div>
        <button className="status-button" onClick={onReload} disabled={busy} aria-label="Reload skill catalog">
          <RefreshCw size={15} className={busy ? "spin" : ""} />
          <span>Reload</span>
        </button>
      </div>

      <div className={cx("skill-banner", `skill-banner-${vm.tone}`)} data-status={vm.status}>
        <span className={cx("dot", vm.tone)} />
        <strong>{vm.statusLabel}</strong>
        <span className="skill-banner-meta">
          Source {vm.sourceLabel} · Checked {vm.checkedAtLabel}
        </span>
        {vm.detail ? <span className="skill-banner-reason">{vm.detail}</span> : null}
        {fetchError ? <span className="skill-banner-reason">{fetchError}</span> : null}
      </div>

      {vm.entries.length ? (
        <div className="skill-list">
          {vm.entries.map((entry) => <SkillEntry key={entry.name} entry={entry} />)}
        </div>
      ) : (
        <p className="skill-empty" data-testid="skills-empty">
          {vm.status === "ok"
            ? "The catalog is readable but has no entries."
            : "The skill catalog is currently unavailable; nothing is fabricated in its place."}
        </p>
      )}
    </section>
  );
}

export function SkillsView() {
  const [payload, setPayload] = useState(null);
  const [fetchError, setFetchError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    setFetchError("");
    try {
      setPayload(await requestJson("/api/skills"));
    } catch (error) {
      setFetchError(error.message);
      setPayload(null);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return <SkillsContent payload={payload} fetchError={fetchError} busy={busy} onReload={load} />;
}
