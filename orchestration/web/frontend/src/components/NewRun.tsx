import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { SettingsResponse } from "../types";

/** Start a run: rig + workflow pickers from the registry, prompt, --auto toggle. */
export function NewRun({ onStarted }: { onStarted: (runId: string) => void }) {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rig, setRig] = useState("");
  const [customRig, setCustomRig] = useState("");
  const [workflow, setWorkflow] = useState("feature-dev");
  const [prompt, setPrompt] = useState("");
  const [auto, setAuto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .settings()
      .then(setSettings)
      .catch((e) => setLoadError(e instanceof Error ? e.message : String(e)));
  }, []);

  const rigNames = useMemo(() => {
    if (!settings) return [];
    try {
      const parsed = JSON.parse(settings.rigsRaw) as { rigs?: Record<string, unknown> };
      return Object.keys(parsed.rigs ?? {});
    } catch {
      return [];
    }
  }, [settings]);

  const workflows = settings?.workflows ?? [];
  const effectiveRig = rig === "__factory__" ? (customRig.trim() ? `factory:${customRig.trim()}` : "") : rig;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api.start({ rig: effectiveRig, workflow, prompt: prompt.trim(), auto });
      onStarted(r.runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  if (loadError) return <div className="error-box">Failed to load settings: {loadError}</div>;
  if (!settings) return <div className="empty-state">Loading registry…</div>;

  return (
    <form className="new-run panel" onSubmit={submit}>
      <h2>Start a run</h2>

      <label className="field">
        <span>Rig</span>
        <select value={rig} onChange={(e) => setRig(e.target.value)} required>
          <option value="" disabled>
            choose a rig…
          </option>
          {rigNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
          <option value="__factory__">factory:&lt;app&gt; (quickfire app)</option>
        </select>
      </label>
      {rig === "__factory__" && (
        <label className="field">
          <span>App name (apps/&lt;name&gt;)</span>
          <input
            type="text"
            value={customRig}
            onChange={(e) => setCustomRig(e.target.value)}
            placeholder="my-app"
            pattern="[a-z0-9-]+"
          />
        </label>
      )}

      <label className="field">
        <span>Workflow</span>
        <select value={workflow} onChange={(e) => setWorkflow(e.target.value)}>
          {workflows.map((w) => (
            <option key={w.name} value={w.name}>
              {w.name}
            </option>
          ))}
        </select>
      </label>
      {workflows.find((w) => w.name === workflow)?.description && (
        <p className="field-hint">{workflows.find((w) => w.name === workflow)!.description}</p>
      )}

      <label className="field">
        <span>Prompt</span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
          placeholder="What should this run build or fix?"
          required
        />
      </label>

      <label className="field field-check">
        <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
        <span>
          Auto mode — skip the plan approval gate (<code>--auto</code>)
        </span>
      </label>

      {error && <div className="error-box">{error}</div>}
      <button type="submit" className="btn btn-primary" disabled={busy || !effectiveRig || !prompt.trim()}>
        {busy ? "Starting…" : "Start run"}
      </button>
    </form>
  );
}
