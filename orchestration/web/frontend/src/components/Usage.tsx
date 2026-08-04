import { useState } from "react";
import { api } from "../api";
import type { UsageWindow, UsageWindowKey } from "../types";
import { usePolling } from "../hooks/usePolling";
import { fmtBytes, fmtCost, fmtTokens } from "../format";

const WINDOWS: { key: UsageWindowKey; label: string }[] = [
  { key: "d31", label: "31d" },
  { key: "d7", label: "7d" },
  { key: "d1", label: "1d" },
];

/** Friendly repo-bucket names (bucket keys come from the server's repoBucket). */
const REPO_LABELS: Record<string, string> = {
  "running-with-pace": "pace",
  "skip-hero": "skip-hero",
  "app-factory": "app-factory (orchestration)",
  "factory-apps": "app-factory apps",
  unknown: "(runs deleted from telemetry)",
};

/** Accumulated cost (all-time + trailing windows, bucketed per repo) and the
 *  factory's context-storage footprint. Aggregates only — polling this page
 *  never moves transcript content over the wire. */
export function Usage() {
  // Aggregates change slowly; poll once a minute (paused while hidden).
  const { data, error, loading } = usePolling(() => api.usage(), 60000);
  const [windowKey, setWindowKey] = useState<UsageWindowKey>("d31");

  if (loading && !data) return <div className="empty-state">Loading usage…</div>;
  if (error && !data) return <div className="error-box">Failed to load usage: {error}</div>;
  if (!data) return null;

  const win = data.cost[windowKey];

  return (
    <div className="usage-page">
      <section className="panel">
        <h3>Accumulated cost</h3>
        <div className="usage-total">
          <span className="usage-total-cost">{fmtCost(data.cost.all.costUsd)}</span>
          <span className="usage-total-sub">
            all time · {data.cost.all.runs} run(s) · {data.cost.all.pricedSteps} priced step(s)
          </span>
        </div>
        <div className="gate-actions usage-windows">
          {WINDOWS.map((w) => (
            <button
              key={w.key}
              className={`btn ${windowKey === w.key ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setWindowKey(w.key)}
            >
              {w.label}
            </button>
          ))}
        </div>
        <WindowStats label={`trailing ${WINDOWS.find((w) => w.key === windowKey)?.label}`} win={win} />
        {error && <div className="error-box">refresh failed: {error}</div>}
      </section>

      <section className="panel">
        <h3>Context storage</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>category</th>
                <th>files</th>
                <th>size</th>
              </tr>
            </thead>
            <tbody>
              {data.storage.categories.map((c) => (
                <tr key={c.key}>
                  <td>{c.label}</td>
                  <td>{c.files}</td>
                  <td>{fmtBytes(c.bytes)}</td>
                </tr>
              ))}
              <tr className="usage-total-row">
                <td>total</td>
                <td>{data.storage.totalFiles}</td>
                <td>{fmtBytes(data.storage.totalBytes)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function WindowStats({ label, win }: { label: string; win: UsageWindow }) {
  return (
    <>
      <div className="usage-window-line">
        <strong>{fmtCost(win.costUsd)}</strong> {label} · {win.runs} run(s) · in {fmtTokens(win.inputTokens)} (
        {fmtTokens(win.cacheReadTokens)} cached) / out {fmtTokens(win.outputTokens)}
      </div>
      {win.repos.length > 0 ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>repo</th>
                <th>runs</th>
                <th>cost</th>
              </tr>
            </thead>
            <tbody>
              {win.repos.map((r) => (
                <tr key={r.repo}>
                  <td>{REPO_LABELS[r.repo] ?? r.repo}</td>
                  <td>{r.runs}</td>
                  <td>{fmtCost(r.costUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">No priced steps in this window.</div>
      )}
    </>
  );
}
