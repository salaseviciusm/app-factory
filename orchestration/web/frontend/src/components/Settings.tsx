import { useEffect, useState } from "react";
import { api } from "../api";
import type { SettingsResponse } from "../types";

/** Read-only view of rigs.json (verbatim — ${VAR} placeholders unresolved) and workflows. */
export function Settings() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .settings()
      .then(setSettings)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  if (error) return <div className="error-box">Failed to load settings: {error}</div>;
  if (!settings) return <div className="empty-state">Loading…</div>;

  return (
    <div className="settings">
      <section className="panel">
        <h3>Workflows</h3>
        {settings.workflows.map((w) => (
          <details key={w.name} className="wf-details">
            <summary>
              <strong>{w.name}</strong> — {w.steps.length} steps
            </summary>
            {w.description && <p className="field-hint">{w.description}</p>}
            <ol className="wf-steps">
              {w.steps.map((s) => (
                <li key={s.id}>
                  <code>{s.id}</code> <span className="wf-step-type">({s.type}</span>
                  {s.model && <span className="wf-step-type">, model {s.model}</span>}
                  {s.onFail && <span className="wf-step-type">, on fail → {s.onFail} ≤{s.maxLoops ?? 1}×</span>}
                  <span className="wf-step-type">)</span>
                </li>
              ))}
            </ol>
          </details>
        ))}
      </section>

      <section className="panel">
        <h3>rigs.json</h3>
        <p className="field-hint">
          Read-only, served verbatim — <code>{"${VAR}"}</code> placeholders resolve only inside the engine, never here.
        </p>
        <pre className="doc-view">{settings.rigsRaw}</pre>
      </section>
    </div>
  );
}
