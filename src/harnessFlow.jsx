import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  RefreshCw,
  ShieldAlert,
  Workflow
} from "lucide-react";
import { buildHarnessFlowViewModel } from "./harnessFlowModel.js";

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

function EvidenceBadge({ state, tone }) {
  return (
    <span className={cx("harness-evidence", `harness-evidence-${tone}`)}>
      {state}
    </span>
  );
}

function StageRail({ stages }) {
  return (
    <ol className="harness-stage-rail" aria-label="Harness run stages">
      {stages.map((stage, index) => (
        <li
          key={stage.key}
          className={cx("harness-stage", `harness-stage-${stage.tone}`)}
        >
          <div className="harness-stage-head">
            <span className={cx("dot", stage.tone)} />
            <strong>{stage.label}</strong>
          </div>
          <span className="harness-stage-value">{stage.valueLabel}</span>
          <EvidenceBadge state={stage.evidenceState} tone={stage.tone} />
          {index < stages.length - 1
            ? <ChevronRight size={14} className="harness-stage-arrow" aria-hidden="true" />
            : null}
        </li>
      ))}
    </ol>
  );
}

function RunEvidence({ report }) {
  return (
    <div className="harness-run-evidence">
      <div className="harness-evidence-card">
        <strong>Receipt</strong>
        <span className={cx("harness-evidence", `harness-evidence-${report.receipt.tone}`)}>
          {report.receipt.status}
        </span>
        {report.receipt.reason ? <small>{report.receipt.reason}</small> : null}
      </div>
      <div className="harness-evidence-card">
        <strong>Surface</strong>
        <span className="harness-evidence-value">{report.surface.valueLabel}</span>
        <EvidenceBadge state={report.surface.evidenceState} tone={report.surface.tone} />
      </div>
      <div className="harness-evidence-card">
        <strong>Model</strong>
        <span className="harness-evidence-value">{report.model.valueLabel}</span>
        <EvidenceBadge state={report.model.evidenceState} tone={report.model.tone} />
      </div>
    </div>
  );
}

function SetupControls({ controls }) {
  if (!controls.length) {
    return <p className="harness-note">No setup controls were reported for this scope.</p>;
  }
  return (
    <div className="harness-controls">
      <p className="harness-note">
        <ShieldAlert size={14} aria-hidden="true" />
        Setup controls are static availability only. A listed control is not proof it shaped a
        run; only the receipt-proven stages above carry run evidence.
      </p>
      <div className="harness-table-scroll">
        <table className="harness-controls-table">
          <thead>
            <tr>
              <th>Control</th>
              <th>Kind</th>
              <th>Size</th>
              <th>Digest</th>
              <th>Runtime evidence</th>
            </tr>
          </thead>
          <tbody>
            {controls.map((control, index) => (
              <tr key={`${control.name}-${index}`}>
                <td>{control.name}</td>
                <td>{control.kind}</td>
                <td>{control.bytesLabel}</td>
                <td>{control.sha256Prefix ? <code>{control.sha256Prefix}</code> : "—"}</td>
                <td>
                  <EvidenceBadge state={control.runtime} tone={control.runtimeTone} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CoveragePanel({ coverage }) {
  if (!coverage) return null;
  return (
    <div className="harness-coverage">
      <div className="harness-coverage-summary">
        <strong>Coverage</strong>
        <span>{coverage.inspectedLabel}</span>
        {coverage.limitReached ? (
          <span className="harness-evidence harness-evidence-warn">
            <AlertTriangle size={12} aria-hidden="true" />
            limit reached — coverage is partial
          </span>
        ) : null}
      </div>
      {coverage.limits.length ? (
        <div className="harness-coverage-limits">
          {coverage.limits.map((limit) => (
            <span key={limit.key}>
              <strong>{limit.key}</strong> {limit.value}
            </span>
          ))}
        </div>
      ) : null}
      {coverage.exclusions.length ? (
        <div className="harness-exclusions">
          <strong>Exclusions ({coverage.excludedCount})</strong>
          <ul>
            {coverage.exclusions.map((entry, index) => (
              <li key={`${entry.label}-${index}`}>
                <code>{entry.label}</code>
                {entry.reason ? <span> — {entry.reason}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="harness-note">No exclusions were reported.</p>
      )}
    </div>
  );
}

function ScopeReport({ report }) {
  return (
    <div className="harness-report">
      <div className="harness-report-meta">
        <span>Generated {report.generatedAtLabel}</span>
        <span>{report.ageLabel}</span>
      </div>
      <StageRail stages={report.stages} />
      <RunEvidence report={report} />
      <SetupControls controls={report.controls} />
      <CoveragePanel coverage={report.coverage} />
    </div>
  );
}

export function HarnessFlowContent({
  envelope,
  fetchError = "",
  busy = false,
  selectedComponent = null,
  onReload = () => {},
  onSelectComponent = () => {}
}) {
  const vm = buildHarnessFlowViewModel(envelope);
  const selected = vm.components.find((component) => component.key === selectedComponent) || null;

  return (
    <div className="panel harness-panel">
      <div className="panel-title">
        <div className="page-header">
          <span className="panel-icon gold"><Workflow size={18} /></span>
          <div>
            <h2>Foundry Harness Flow</h2>
            <small>Derived read-only view of the latest sanitized Audit Engine export</small>
          </div>
        </div>
        <button
          className="status-button"
          onClick={onReload}
          disabled={busy}
          aria-label="Reload harness flow"
        >
          <RefreshCw size={15} className={busy ? "spin" : ""} />
          <span>Reload</span>
        </button>
      </div>

      <div
        className={cx("harness-banner", `harness-banner-${vm.tone}`)}
        data-status={vm.status}
      >
        <span className={cx("dot", vm.tone)} />
        <strong>{vm.statusLabel}</strong>
        <span className="harness-banner-meta">
          Source {vm.sourceLabel} · Generated {vm.generatedAtLabel} · {vm.ageLabel}
        </span>
        {vm.reason ? <span className="harness-banner-reason">{vm.reason}</span> : null}
        {fetchError ? <span className="harness-banner-reason">{fetchError}</span> : null}
      </div>

      {vm.status === "loading" && !fetchError
        ? <p className="harness-note">Loading the latest harness report…</p>
        : null}

      {vm.root ? (
        <section className="harness-root">
          <div className="section-header">
            <span>Root flow — {vm.root.scopeLabel}</span>
            <small>
              Available → Eligible → Shown → Consulted → Acted through → Checked → Accepted
            </small>
          </div>
          <ScopeReport report={vm.root} />
        </section>
      ) : null}

      {vm.root || vm.components.length ? (
        <section className="harness-components">
          <div className="section-header">
            <span>Component drill-down</span>
            <small>{vm.components.length} component report(s)</small>
          </div>
          {vm.components.length ? (
            <div className="harness-component-list">
              {vm.components.map((component) => (
                <button
                  key={component.key}
                  className={cx(
                    "harness-component-chip",
                    component.status !== "ok" && "harness-component-chip-bad",
                    selectedComponent === component.key && "active"
                  )}
                  onClick={() => onSelectComponent(
                    selectedComponent === component.key ? null : component.key
                  )}
                  aria-expanded={selectedComponent === component.key}
                >
                  <FileCheck2 size={14} aria-hidden="true" />
                  <span>{component.label}</span>
                  {component.status !== "ok" ? <small>{component.status}</small> : null}
                </button>
              ))}
            </div>
          ) : (
            <p className="harness-note">The current export contains no component reports.</p>
          )}
          {selected ? (
            <div className="harness-drilldown">
              <div className="harness-drilldown-head">
                <button
                  className="icon-button"
                  onClick={() => onSelectComponent(null)}
                  aria-label="Close component drill-down"
                >
                  <ChevronLeft size={15} />
                </button>
                <strong>{selected.label}</strong>
              </div>
              {selected.report ? (
                <ScopeReport report={selected.report} />
              ) : (
                <p className="harness-malformed">
                  This component report is {selected.status}:{" "}
                  {selected.reason || "no readable evidence"}
                </p>
              )}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

export function HarnessFlowView() {
  const [envelope, setEnvelope] = useState(null);
  const [fetchError, setFetchError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);

  async function load() {
    setBusy(true);
    setFetchError("");
    try {
      setEnvelope(await requestJson("/api/harness-flow"));
    } catch (error) {
      setFetchError(error.message);
      setEnvelope(null);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <HarnessFlowContent
      envelope={envelope}
      fetchError={fetchError}
      busy={busy}
      selectedComponent={selectedComponent}
      onReload={load}
      onSelectComponent={setSelectedComponent}
    />
  );
}
