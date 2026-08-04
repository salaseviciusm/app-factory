import { useState } from "react";
import { api } from "../api";
import type { RunDetail as RunDetailData, StepDocAttempts, StepDocKind, StepRow, WorkflowStep } from "../types";
import { usePolling } from "../hooks/usePolling";
import { NodeGraph } from "../graph/NodeGraph";
import { Badge } from "./Badge";
import {
  deriveNodes,
  fmtCost,
  fmtDuration,
  fmtTokens,
  fmtWhen,
  isTerminal,
  stateKind,
  stateLabel,
  stepStatusKind,
  usageLine,
} from "../format";

export function RunDetail({ runId, onBack }: { runId: string; onBack: () => void }) {
  const { data, error, loading, refresh } = usePolling(() => api.run(runId), 3000, [runId]);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  if (loading && !data) return <div className="empty-state">Loading {runId}…</div>;
  if (error && !data) return <div className="error-box">Failed to load {runId}: {error}</div>;
  if (!data) return null;

  const { run, workflow } = data;
  const nodes = deriveNodes(data);
  const usage = usageLine(run.usage);
  const selectedDef = workflow?.steps.find((s) => s.id === selectedStep) ?? null;

  return (
    <div className="run-detail">
      <div className="detail-header">
        <button className="btn btn-ghost back-btn" onClick={onBack}>
          ← Runs
        </button>
        <h2 className="run-id">{run.id}</h2>
        <div className="detail-badges">
          <Badge kind={stateKind(run.state)}>{stateLabel(run.state)}</Badge>
          <Badge kind="muted">{run.rig}</Badge>
          <Badge kind="muted">{run.workflow}</Badge>
          {run.auto && <Badge kind="muted">auto</Badge>}
          {run.stalled && (
            <Badge kind="warn" title="No state update in over 10 minutes — the executor may be dead.">
              stalled? try: factory-run resume {run.id}
            </Badge>
          )}
          {data.recovery && data.recovery.iterations > 0 && (
            <Badge kind="warn" title="Deploy found the base branch had advanced; the run branch was rebased and the gates re-ran.">
              recovery ×{data.recovery.iterations}
            </Badge>
          )}
          {run.worktreeMissing && <Badge kind="muted" title="The run's git worktree directory no longer exists">no worktree</Badge>}
          {run.source === "db" && <Badge kind="muted">telemetry only — run dir deleted</Badge>}
        </div>
        {usage && <div className="usage-line">{usage} · {run.usage?.pricedSteps} priced step(s)</div>}
        <p className="run-prompt">{run.prompt}</p>
        {run.parentRun && (
          <p className="run-links">
            spawned by <a href={`#/run/${run.parentRun}`}>{run.parentRun}</a>
          </p>
        )}
        {run.childRun && (
          <p className="run-links">
            spawned child <a href={`#/run/${run.childRun}`}>{run.childRun}</a>
          </p>
        )}
        {error && <div className="error-box">refresh failed: {error}</div>}
      </div>

      {run.state === "awaiting-approval" && <GatePanel runId={run.id} planMd={data.planMd} refresh={refresh} />}
      {!isTerminal(run.state) && run.state !== "awaiting-approval" && (
        <ActionBar runId={run.id} refresh={refresh} />
      )}

      {workflow ? (
        <section className="panel">
          <h3>Pipeline</h3>
          <NodeGraph workflow={workflow} nodes={nodes} selected={selectedStep} onSelect={setSelectedStep} />
          {selectedDef && (
            <StepSheet
              runId={run.id}
              def={selectedDef}
              rows={data.steps.filter((s) => s.step_id === selectedDef.id)}
              docs={data.stepDocs[selectedDef.id]}
              onClose={() => setSelectedStep(null)}
            />
          )}
        </section>
      ) : (
        <section className="panel">
          <h3>Pipeline</h3>
          <div className="empty-state">Workflow definition “{run.workflow}” not found — graph unavailable.</div>
        </section>
      )}

      {(data.recovery || data.conflictMd || data.escalationMd) && <RecoveryPanel data={data} />}
      <StepsTable rows={data.steps} />
      <Artifacts data={data} />
      <History data={data} />
      <Logs runId={run.id} available={data.logs} />
    </div>
  );
}

// ---------- gate + steering controls ----------

function GatePanel({ runId, planMd, refresh }: { runId: string; planMd: string | null; refresh: () => void }) {
  const [mode, setMode] = useState<"idle" | "reject" | "steer">("idle");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(true);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setMode("idle");
      setText("");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel gate-panel">
      <h3>⏳ Awaiting your approval</h3>
      {planMd ? (
        <>
          <button className="btn btn-ghost" onClick={() => setPlanOpen(!planOpen)}>
            {planOpen ? "Hide plan" : "Show plan"}
          </button>
          {planOpen && <pre className="doc-view">{planMd}</pre>}
        </>
      ) : (
        <div className="empty-state">No plan file found in the run directory.</div>
      )}
      {mode === "idle" && (
        <div className="gate-actions">
          <button className="btn btn-approve" disabled={busy} onClick={() => act(() => api.approve(runId))}>
            ✓ Approve
          </button>
          <button className="btn btn-reject" disabled={busy} onClick={() => setMode("reject")}>
            ✗ Reject…
          </button>
          <button className="btn btn-steer" disabled={busy} onClick={() => setMode("steer")}>
            ↝ Steer…
          </button>
        </div>
      )}
      {mode !== "idle" && (
        <div className="gate-form">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={mode === "reject" ? "Why is this plan rejected? (required)" : "Instruction for the next agentic step (required)"}
            autoFocus
          />
          <div className="gate-actions">
            <button
              className={`btn ${mode === "reject" ? "btn-reject" : "btn-steer"}`}
              disabled={busy || !text.trim()}
              onClick={() =>
                act(() => (mode === "reject" ? api.reject(runId, text.trim()) : api.steer(runId, text.trim())))
              }
            >
              {mode === "reject" ? "Send rejection" : "Send steering"}
            </button>
            <button className="btn btn-ghost" disabled={busy} onClick={() => setMode("idle")}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <div className="error-box">{error}</div>}
    </section>
  );
}

function ActionBar({ runId, refresh }: { runId: string; refresh: () => void }) {
  const [mode, setMode] = useState<"idle" | "steer">("idle");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const act = async (fn: () => Promise<unknown>, note: string | null) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setMode("idle");
      setText("");
      setNotice(note);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel action-bar">
      {mode === "idle" ? (
        <div className="gate-actions">
          <button className="btn btn-steer" disabled={busy} onClick={() => setMode("steer")}>
            ↝ Steer…
          </button>
          <button
            className="btn btn-reject"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Cancel run ${runId}? The executor stops at the next step boundary.`)) {
                void act(() => api.cancel(runId), null);
              }
            }}
          >
            ■ Cancel run
          </button>
        </div>
      ) : (
        <div className="gate-form">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Instruction — applies from the next agentic step"
            autoFocus
          />
          <div className="gate-actions">
            <button
              className="btn btn-steer"
              disabled={busy || !text.trim()}
              onClick={() => act(() => api.steer(runId, text.trim()), "Steering recorded — applies from the next agentic step.")}
            >
              Send steering
            </button>
            <button className="btn btn-ghost" disabled={busy} onClick={() => setMode("idle")}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {notice && <div className="notice-box">{notice}</div>}
      {error && <div className="error-box">{error}</div>}
    </section>
  );
}

// ---------- step sheet + tables ----------

function StepSheet({
  runId,
  def,
  rows,
  docs,
  onClose,
}: {
  runId: string;
  def: WorkflowStep;
  rows: StepRow[];
  docs: StepDocAttempts | undefined;
  onClose: () => void;
}) {
  // Map telemetry rows to on-disk document attempts. New runs record the true
  // file-suffix attempt in telemetry; old runs can repeat attempt numbers
  // (the loop counter only advanced for the failing step), so fall back to
  // per-step row order there.
  const attemptsUnique = new Set(rows.map((r) => r.attempt)).size === rows.length;
  const docAttempt = (r: StepRow, i: number) => (attemptsUnique ? r.attempt : i + 1);
  const covered = new Set(rows.map(docAttempt));
  const orphanAttempts = [...new Set([...(docs?.prompt ?? []), ...(docs?.output ?? [])])]
    .filter((a) => !covered.has(a))
    .sort((a, b) => a - b);
  return (
    <div className="step-sheet">
      <div className="step-sheet-head">
        <h4>{def.id}</h4>
        <button className="btn btn-ghost" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="step-def">
        <span>type: {def.type}</span>
        {def.prompt && <span>prompt: {def.prompt}</span>}
        {def.model && <span>model: {def.model}</span>}
        {def.source && <span>source: {def.source}</span>}
        {def.timeoutMinutes && <span>timeout: {def.timeoutMinutes}m</span>}
        {def.onFail && <span>on fail → {def.onFail} (≤{def.maxLoops ?? 1}×)</span>}
        {def.note && <span>{def.note}</span>}
      </div>
      {rows.length === 0 && orphanAttempts.length === 0 ? (
        <div className="empty-state">No telemetry recorded for this step.</div>
      ) : (
        <ol className="attempt-list">
          {rows.map((r, i) => (
            <li key={i} className={`attempt attempt-${r.status}`}>
              <div className="attempt-head">
                <Badge kind={stepStatusKind(r.status)}>{r.status}</Badge>
                <span>attempt {r.attempt}</span>
                <span>{fmtWhen(r.started_at)}</span>
                <span>{fmtDuration(r.duration_s)}</span>
                {r.cost_usd != null && <span>{fmtCost(r.cost_usd)}</span>}
                {r.input_tokens != null && (
                  <span>
                    in {fmtTokens((r.input_tokens || 0) + (r.cache_read_tokens || 0) + (r.cache_creation_tokens || 0))} / out {fmtTokens(r.output_tokens)}
                  </span>
                )}
              </div>
              {r.summary && <div className="attempt-summary">{r.summary}</div>}
              <AttemptDocs runId={runId} stepId={def.id} attempt={docAttempt(r, i)} docs={docs} />
            </li>
          ))}
          {orphanAttempts.map((a) => (
            <li key={`doc-${a}`} className="attempt">
              <div className="attempt-head">
                <span>attempt {a}</span>
                <span>(no telemetry row)</span>
              </div>
              <AttemptDocs runId={runId} stepId={def.id} attempt={a} docs={docs} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Collapsible Prompt / Output viewers for one step attempt (fetch-on-expand). */
function AttemptDocs({
  runId,
  stepId,
  attempt,
  docs,
}: {
  runId: string;
  stepId: string;
  attempt: number;
  docs: StepDocAttempts | undefined;
}) {
  const [open, setOpen] = useState<StepDocKind | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const kinds = (["prompt", "output"] as const).filter((k) => docs?.[k].includes(attempt));
  if (kinds.length === 0) return null;

  const show = async (kind: StepDocKind) => {
    if (open === kind) {
      setOpen(null);
      return;
    }
    setBusy(true);
    try {
      setText(await api.stepDoc(runId, stepId, kind, attempt));
    } catch (e) {
      setText(`failed to load: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(false);
    }
    setOpen(kind);
  };

  return (
    <div className="attempt-docs">
      <div className="gate-actions">
        {kinds.map((k) => (
          <button key={k} className="btn btn-ghost" disabled={busy} onClick={() => void show(k)}>
            {open === k ? `hide ${k}` : k}
          </button>
        ))}
      </div>
      {open && <pre className="doc-view log-view">{text || "(empty)"}</pre>}
    </div>
  );
}

/** Deploy recovery: rebase cycles, conflict/escalation context, and the
 *  synthetic resolve-conflicts step's prompt/output documents (which live
 *  outside the workflow graph, so the StepSheet never shows them). */
function RecoveryPanel({ data }: { data: RunDetailData }) {
  const rec = data.recovery;
  const docs = data.stepDocs["resolve-conflicts"];
  const docAttempts = [...new Set([...(docs?.prompt ?? []), ...(docs?.output ?? [])])].sort((a, b) => a - b);
  return (
    <section className="panel">
      <h3>Deploy recovery</h3>
      {rec && (
        <p>
          {rec.iterations} recovery cycle(s) — the base branch advanced mid-run, so the run branch was rebased and the
          verification gates re-ran before merging.
        </p>
      )}
      {rec && rec.attempts.length > 0 && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>cycle</th>
                <th>when</th>
                <th>rebased onto</th>
                <th>rebase</th>
                <th>outcome</th>
              </tr>
            </thead>
            <tbody>
              {rec.attempts.map((a, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{fmtWhen(a.at)}</td>
                  <td>
                    <code>{a.fromSha.slice(0, 8)}</code> → <code>{a.toSha.slice(0, 8)}</code>
                  </td>
                  <td>
                    <Badge kind={a.conflicted ? "warn" : "ok"}>{a.conflicted ? "conflicted" : "clean"}</Badge>
                  </td>
                  <td>{a.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data.escalationMd && (
        <details open>
          <summary>escalation.md — the conflict-resolution agent needs a human</summary>
          <pre className="doc-view">{data.escalationMd}</pre>
        </details>
      )}
      {data.conflictMd && (
        <details>
          <summary>conflict.md — last conflict context</summary>
          <pre className="doc-view">{data.conflictMd}</pre>
        </details>
      )}
      {docAttempts.map((a) => (
        <div key={a}>
          <span className="step-def">resolve-conflicts attempt {a}</span>
          <AttemptDocs runId={data.run.id} stepId="resolve-conflicts" attempt={a} docs={docs} />
        </div>
      ))}
    </section>
  );
}

function StepsTable({ rows }: { rows: StepRow[] }) {
  return (
    <section className="panel">
      <h3>Step telemetry</h3>
      {rows.length === 0 ? (
        <div className="empty-state">No telemetry rows for this run.</div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>step</th>
                <th>attempt</th>
                <th>status</th>
                <th>duration</th>
                <th>cost</th>
                <th>tokens in</th>
                <th>tokens out</th>
                <th>summary</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.step_id}</td>
                  <td>{r.attempt}</td>
                  <td>
                    <Badge kind={stepStatusKind(r.status)}>{r.status}</Badge>
                  </td>
                  <td>{fmtDuration(r.duration_s)}</td>
                  <td>{fmtCost(r.cost_usd)}</td>
                  <td>
                    {r.input_tokens != null
                      ? fmtTokens((r.input_tokens || 0) + (r.cache_read_tokens || 0) + (r.cache_creation_tokens || 0))
                      : "—"}
                  </td>
                  <td>{fmtTokens(r.output_tokens)}</td>
                  <td className="cell-summary">{r.summary || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const BARE_SHA_RE = /^[0-9a-f]{7,40}$/;

/** GitHub page for an artifact (bare sha → commit, pr-ish number → pull), or null. */
function githubArtifactUrl(repoUrl: string | null, type: string, value: string): string | null {
  if (!repoUrl) return null;
  if (BARE_SHA_RE.test(value)) return `${repoUrl}/commit/${value}`;
  if (/(^|_)pr$/.test(type) && /^\d+$/.test(value)) return `${repoUrl}/pull/${value}`;
  return null;
}

function Artifacts({ data }: { data: RunDetailData }) {
  const { run, repoUrl, artifacts, review, findingsMd, steeringMd, deviationsMd } = data;
  const commits = artifacts.filter((a) => a.type === "commit");
  const other = artifacts.filter((a) => !["commit", "finding", "review_verdict"].includes(a.type));
  const empty =
    !run.artifactUrl && commits.length === 0 && other.length === 0 && !review && !findingsMd && !steeringMd && !deviationsMd;
  return (
    <section className="panel">
      <h3>Artifacts & review</h3>
      {empty && <div className="empty-state">Nothing yet.</div>}
      {run.artifactUrl && (
        <p>
          <a href={run.artifactUrl} target="_blank" rel="noreferrer" className="artifact-link">
            📦 Install / preview build
          </a>
        </p>
      )}
      {review?.verdict && (
        <p>
          Review verdict: <Badge kind={review.verdict === "PASS" ? "ok" : "fail"}>{review.verdict}</Badge>
        </p>
      )}
      {review?.findings && review.findings.length > 0 && (
        <ul className="finding-list">
          {review.findings.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}
      {findingsMd && (
        <details>
          <summary>Current findings.md</summary>
          <pre className="doc-view">{findingsMd}</pre>
        </details>
      )}
      {steeringMd && (
        <details>
          <summary>steering.md — founder mid-run instructions</summary>
          <pre className="doc-view">{steeringMd}</pre>
        </details>
      )}
      {deviationsMd && (
        <details>
          <summary>deviations.md — implementer plan deviations</summary>
          <pre className="doc-view">{deviationsMd}</pre>
        </details>
      )}
      {commits.length > 0 && (
        <details open>
          <summary>{commits.length} commit(s)</summary>
          <ul className="commit-list">
            {commits.map((c, i) => {
              const sp = c.value.indexOf(" ");
              const sha = sp === -1 ? c.value : c.value.slice(0, sp);
              const subject = sp === -1 ? "" : c.value.slice(sp + 1);
              const href = githubArtifactUrl(repoUrl, c.type, sha);
              return (
                <li key={i}>
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer">
                      <code>{sha.slice(0, 8)}</code>
                    </a>
                  ) : (
                    <code>{sha.slice(0, 8)}</code>
                  )}{" "}
                  {subject}
                </li>
              );
            })}
          </ul>
        </details>
      )}
      {other.map((a, i) => {
        const gh = githubArtifactUrl(repoUrl, a.type, a.value);
        return (
          <p key={i} className="artifact-row">
            {a.type}: {/^https?:\/\//.test(a.value) ? (
              <a href={a.value} target="_blank" rel="noreferrer">
                {a.value}
              </a>
            ) : gh ? (
              <a href={gh} target="_blank" rel="noreferrer">
                <code>{a.value}</code>
              </a>
            ) : (
              <code>{a.value}</code>
            )}
          </p>
        );
      })}
    </section>
  );
}

function History({ data }: { data: RunDetailData }) {
  if (data.history.length === 0) return null;
  return (
    <section className="panel">
      <h3>History</h3>
      <ol className="history-list">
        {data.history.map((h, i) => (
          <li key={i}>
            <span className="history-time">{new Date(h.at).toLocaleString()}</span>
            <Badge kind={stateKind(h.state)}>{stateLabel(h.state)}</Badge>
            {h.detail && <span className="history-detail">{h.detail}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}

function Logs({ runId, available }: { runId: string; available: string[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [text, setText] = useState<string>("");
  const [busy, setBusy] = useState(false);
  if (available.length === 0) return null;

  const show = async (name: string) => {
    if (open === name) {
      setOpen(null);
      return;
    }
    setBusy(true);
    try {
      setText(await api.log(runId, name));
      setOpen(name);
    } catch (e) {
      setText(`failed to load: ${e instanceof Error ? e.message : e}`);
      setOpen(name);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel">
      <h3>Logs</h3>
      <div className="gate-actions">
        {available.map((n) => (
          <button key={n} className="btn btn-ghost" disabled={busy} onClick={() => void show(n)}>
            {open === n ? `hide ${n}.log` : `${n}.log`}
          </button>
        ))}
      </div>
      {open && <pre className="doc-view log-view">{text || "(empty)"}</pre>}
    </section>
  );
}
