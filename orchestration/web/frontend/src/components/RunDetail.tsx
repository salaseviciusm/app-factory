import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type {
  CheckGate,
  RetryClassification,
  RetryEntry,
  RunDetail as RunDetailData,
  RunPreview,
  StepDocAttempts,
  StepDocKind,
  StepRow,
  WorkflowStep,
} from "../types";
import { usePolling } from "../hooks/usePolling";
import { NodeGraph } from "../graph/NodeGraph";
import { Badge } from "./Badge";
import { PlanView } from "./PlanView";
import { PlanEditor } from "./PlanEditor";
import { parsePlan } from "../markdown";
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
  const gateStep =
    workflow && run.stepIndex != null ? workflow.steps[Math.min(run.stepIndex, workflow.steps.length - 1)] : null;
  const previewGate =
    run.state === "awaiting-approval" && gateStep?.type === "gate" && gateStep?.skipWhen === "no-preview";
  const hasPreviewSteps = workflow?.steps.some((s) => s.skipWhen === "no-preview") ?? false;

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
            <Badge kind="warn" title="No state update in over 10 minutes — the executor may be dead. Use the Retry button below.">
              stalled?
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

      {run.state === "awaiting-merge" && <MergeBanner run={run} />}
      {run.deployHeld && <HeldDeployPanel runId={run.id} refresh={refresh} />}
      {run.state === "awaiting-approval" &&
        (workflow?.steps[run.stepIndex ?? -1]?.type === "commands" ? (
          // A commands step only parks on awaiting-approval for a founder-gated
          // check failure — the regression gate, not the plan gate.
          <CheckGatePanel runId={run.id} gate={data.checkGate} active refresh={refresh} />
        ) : (
          <GatePanel
            runId={run.id}
            planMd={data.planMd}
            isDiscussion={workflow?.steps[run.stepIndex ?? -1]?.type === "discussion"}
            previewGate={previewGate}
            preview={run.preview}
            refresh={refresh}
          />
        ))}
      {run.state !== "awaiting-approval" && data.checkGate && (
        <CheckGatePanel runId={run.id} gate={data.checkGate} active={false} refresh={refresh} />
      )}
      {!isTerminal(run.state) && run.state !== "awaiting-approval" && (
        <ActionBar runId={run.id} refresh={refresh} />
      )}
      {(run.state === "failed" || run.stalled) && data.retry && (
        <RetryPanel runId={run.id} retry={data.retry} retries={run.retries} refresh={refresh} />
      )}
      {run.state === "cancelled" && run.source !== "db" && <CancelledPanel runId={run.id} refresh={refresh} />}
      {(run.preview || hasPreviewSteps) && !previewGate && <PreviewPanel data={data} refresh={refresh} />}

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

/** Bearer-authenticated QR image: <img src> cannot carry the token, so the
 *  bytes come via fetch and render from an object URL. */
function QrImage({ runId, name, alt }: { runId: string; name: "qr.png" | "preview-qr.png"; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let revoked: string | null = null;
    api
      .artifactUrl(runId, name)
      .then((url) => {
        revoked = url;
        setSrc(url);
      })
      .catch(() => setSrc(null));
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [runId, name]);
  if (!src) return null;
  return <img className="qr-image" src={src} alt={alt} />;
}

/** The run finished green under merge policy "review": the founder merges by hand. */
function MergeBanner({ run }: { run: { id: string } }) {
  return (
    <section className="panel gate-panel">
      <h3>🔀 Awaiting your merge</h3>
      <p>
        This run finished green. Merge branch <code>factory/{run.id}</code> when happy:
      </p>
      <pre className="doc-view">git merge factory/{run.id}</pre>
      <p>
        Local merge only — the engine never pushes to origin. After you merge, the next cleanup reclaims the
        worktree and branch.
      </p>
    </section>
  );
}

/** Deploy parked by policy.deploy "hold" — one tap releases it. */
function HeldDeployPanel({ runId, refresh }: { runId: string; refresh: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  return (
    <section className="panel gate-panel">
      <h3>📦 Deploy held</h3>
      <p>This rig's policy holds the deploy for you to release.</p>
      <div className="gate-actions">
        <button
          className="btn btn-approve"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              const r = await api.deploy(runId);
              setNotice(r.message || "Deploy released — the artifact URL lands here when it finishes.");
              refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          🚀 Release deploy
        </button>
      </div>
      {notice && <div className="notice-box">{notice}</div>}
      {error && <div className="error-box">{error}</div>}
    </section>
  );
}

/** The release-decision agent's verdict, rendered beside the preview artifact
 *  so a wrong build-vs-update call is diagnosable. */
function DecisionCard({ preview }: { preview: RunPreview }) {
  const d = preview.decision;
  if (!d) return null;
  return (
    <div className="decision-card">
      <p>
        Release decision: <Badge kind={d.kind === "build" ? "warn" : "ok"}>{d.kind}</Badge>{" "}
        {d.failSafe && (
          <Badge kind="fail" title="The decision agent errored, timed out, or was ambiguous — defaulted to a full build so a native change can never silently ship as an OTA update.">
            fail-safe
          </Badge>
        )}
      </p>
      {d.reasoning && <p className="decision-reasoning">{d.reasoning}</p>}
      {d.evidence && d.evidence.length > 0 && (
        <details>
          <summary>decisive evidence ({d.evidence.length})</summary>
          <ul className="finding-list">
            {d.evidence.map((e, i) => (
              <li key={i}>
                <code>{e}</code>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/** Preview state + controls: the published artifact (link, QR, decision), the
 *  per-run preview-mode toggle (until the preview step runs), and on-demand
 *  publishing from the run's worktree. */
function PreviewPanel({ data, refresh }: { data: RunDetailData; refresh: () => void }) {
  const { run, workflow } = data;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const previewIdx = workflow ? workflow.steps.findIndex((s) => s.type === "preview") : -1;
  const toggleable = !isTerminal(run.state) && previewIdx !== -1 && (run.stepIndex ?? 0) <= previewIdx;
  // On-demand publish needs a live worktree to publish from; the CLI still
  // validates the rig's deploy mechanism.
  const canPublish = !run.worktreeMissing && run.source !== "db";
  const preview = run.preview;

  const act = async (fn: () => Promise<{ message?: string }>, note: string) => {
    setBusy(true);
    setError(null);
    try {
      const r = await fn();
      setNotice(r.message || note);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!preview && !toggleable && !canPublish) return null;
  return (
    <section className="panel">
      <h3>Preview</h3>
      {preview?.url && (
        <p>
          <a href={preview.url} target="_blank" rel="noreferrer" className="artifact-link">
            📱 Open preview ({preview.kind ?? "published"})
          </a>
        </p>
      )}
      {preview?.qrPath && <QrImage runId={run.id} name="preview-qr.png" alt={`Preview QR for ${run.id}`} />}
      {preview && <DecisionCard preview={preview} />}
      {toggleable && (
        <p>
          Preview mode:{" "}
          <strong>{data.previewMode ?? "rig default"}</strong>{" "}
          <button className="btn btn-ghost" disabled={busy} onClick={() => act(() => api.previewMode(run.id, "on"), "Preview mode on.")}>
            on
          </button>{" "}
          <button className="btn btn-ghost" disabled={busy} onClick={() => act(() => api.previewMode(run.id, "off"), "Preview mode off.")}>
            off
          </button>
        </p>
      )}
      {canPublish && (
        <div className="gate-actions">
          <button
            className="btn btn-steer"
            disabled={busy}
            onClick={() => act(() => api.preview(run.id), "Preview publish started — the release-decision agent picks build vs update.")}
          >
            📤 Publish preview now
          </button>
        </div>
      )}
      {notice && <div className="notice-box">{notice}</div>}
      {error && <div className="error-box">{error}</div>}
    </section>
  );
}

function GatePanel({
  runId,
  planMd,
  isDiscussion,
  previewGate,
  preview,
  refresh,
}: {
  runId: string;
  planMd: string | null;
  isDiscussion: boolean;
  previewGate: boolean;
  preview: RunPreview | null;
  refresh: () => void;
}) {
  const [mode, setMode] = useState<"idle" | "reject" | "steer" | "edit">("idle");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(true);
  const planEditable = useMemo(() => isDiscussion && !!planMd && parsePlan(planMd).ok, [isDiscussion, planMd]);

  const act = async (fn: () => Promise<unknown>, note: string | null = null) => {
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
    <section className="panel gate-panel">
      <h3>
        {previewGate
          ? "📱 Preview awaiting your approval"
          : isDiscussion
            ? "💬 Plan discussion — awaiting your reply"
            : "⏳ Awaiting your approval"}
      </h3>
      {previewGate ? (
        <>
          {preview?.url ? (
            <p>
              <a href={preview.url} target="_blank" rel="noreferrer" className="artifact-link">
                📱 Open preview ({preview.kind ?? "published"})
              </a>
            </p>
          ) : (
            <div className="empty-state">No preview URL captured — see deploy.log.</div>
          )}
          {preview?.qrPath && <QrImage runId={runId} name="preview-qr.png" alt={`Preview QR for ${runId}`} />}
          {preview && <DecisionCard preview={preview} />}
          <p>Approving merges and deploys per the rig's policy; rejecting ends the run without merging.</p>
        </>
      ) : planMd ? (
        mode === "edit" ? (
          <PlanEditor
            planMd={planMd}
            onSubmit={(reply) =>
              act(() => api.reply(runId, reply), "Plan edits sent — the discussion agent answers in its next turn.")
            }
            onCancel={() => setMode("idle")}
          />
        ) : (
          <>
            <button className="btn btn-ghost" onClick={() => setPlanOpen(!planOpen)}>
              {planOpen ? "Hide plan" : "Show plan"}
            </button>
            {planOpen && <PlanView markdown={planMd} />}
          </>
        )
      ) : (
        <div className="empty-state">No plan file found in the run directory.</div>
      )}
      {mode === "idle" && (
        <div className="gate-actions">
          <button className="btn btn-approve" disabled={busy} onClick={() => act(() => api.approve(runId))}>
            {previewGate ? "✓ Approve — merge & deploy" : "✓ Approve"}
          </button>
          {isDiscussion && (
            <button
              className="btn btn-steer"
              disabled={busy || !planEditable}
              title={planEditable ? "Edit the plan block by block; edits are sent as your reply" : "Plan is not editable (parse failed)"}
              onClick={() => {
                setNotice(null);
                setMode("edit");
              }}
            >
              ✎ Edit plan…
            </button>
          )}
          <button className="btn btn-reject" disabled={busy} onClick={() => setMode("reject")}>
            ✗ Reject…
          </button>
          <button className="btn btn-steer" disabled={busy} onClick={() => setMode("steer")}>
            ↝ Steer…
          </button>
        </div>
      )}
      {notice && mode === "idle" && <div className="notice-box">{notice}</div>}
      {(mode === "reject" || mode === "steer") && (
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

/** Founder-gated regression check gate: the rendered comparison (summary
 *  numbers, timeline image, report JSON, debug-video download) plus the three
 *  decisions — approve (harness re-baselines and re-runs checks), reject
 *  (ends the run), or a reply that steers the implementer. When `active` is
 *  false (gate already resolved) the same evidence renders read-only. */
function CheckGatePanel({
  runId,
  gate,
  active,
  refresh,
}: {
  runId: string;
  gate: CheckGate | null;
  active: boolean;
  refresh: () => void;
}) {
  const [mode, setMode] = useState<"idle" | "reject" | "reply">("idle");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState(active);

  // Prefer the Slack-attached PNG; fall back to the raw SVG (browsers render
  // it natively — rasterization is only needed for the Slack attachment).
  const image =
    gate?.artifacts.find((a) => a === gate.mediaPath) ??
    gate?.artifacts.find((a) => a === "timeline.png") ??
    gate?.artifacts.find((a) => a === "timeline.svg");
  // Annotated preview frame from the debug-video render, when it exists.
  const preview = gate?.artifacts.find((a) => a.endsWith(".debug-preview.png"));
  const videos = gate?.artifacts.filter((a) => a.endsWith(".mov")) ?? [];
  const reports = gate?.artifacts.filter((a) => a.endsWith(".json")) ?? [];

  const act = async (fn: () => Promise<unknown>, note: string | null = null) => {
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

  const downloadVideo = async (name: string) => {
    setBusy(true);
    setError(null);
    try {
      const blob = await api.gateArtifact(runId, name);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel gate-panel">
      <h3>{active ? "🚦 Regression gate — your judgment needed" : `🚦 Regression gate (${gate?.status ?? "unknown"})`}</h3>
      {gate ? (
        <>
          <p>
            Founder-gated check failed: <code>{gate.cmd}</code>.{" "}
            {active
              ? "Approve accepts the new behaviour (the harness re-baselines and re-runs the checks); reject ends the run; a reply steers the implementer."
              : gate.resolvedAt
                ? `Resolved ${new Date(gate.resolvedAt).toLocaleString()}${gate.feedback ? ` — ${gate.feedback}` : ""}.`
                : ""}
          </p>
          {!active && (
            <button className="btn btn-ghost" onClick={() => setOpen(!open)}>
              {open ? "Hide comparison" : "Show comparison"}
            </button>
          )}
          {open && (
            <>
              {gate.summaryText && <pre className="doc-view">{gate.summaryText}</pre>}
              {image && <GateImage runId={runId} name={image} />}
              {preview && <GateImage runId={runId} name={preview} />}
              {(videos.length > 0 || reports.length > 0) && (
                <div className="gate-actions">
                  {videos.map((v) => (
                    <button key={v} className="btn btn-ghost" disabled={busy} onClick={() => void downloadVideo(v)}>
                      ⬇ {v}
                    </button>
                  ))}
                  {reports.map((r) => (
                    <GateDocToggle key={r} runId={runId} name={r} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="empty-state">No check-gate record found in the run directory.</div>
      )}
      {active && mode === "idle" && (
        <div className="gate-actions">
          <button
            className="btn btn-approve"
            disabled={busy}
            onClick={() =>
              act(() => api.approve(runId), "Approved — the harness re-baselines, commits, and re-runs the checks.")
            }
          >
            ✓ Approve re-baseline
          </button>
          <button className="btn btn-reject" disabled={busy} onClick={() => setMode("reject")}>
            ✗ Reject…
          </button>
          <button className="btn btn-steer" disabled={busy} onClick={() => setMode("reply")}>
            ↝ Steer implementer…
          </button>
        </div>
      )}
      {notice && mode === "idle" && <div className="notice-box">{notice}</div>}
      {active && (mode === "reject" || mode === "reply") && (
        <div className="gate-form">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={
              mode === "reject"
                ? "Why is this behaviour change rejected? Ends the run. (required)"
                : "Instruction for the implementer — the run loops back with it injected (required)"
            }
            autoFocus
          />
          <div className="gate-actions">
            <button
              className={`btn ${mode === "reject" ? "btn-reject" : "btn-steer"}`}
              disabled={busy || !text.trim()}
              onClick={() =>
                act(() =>
                  mode === "reject" ? api.reject(runId, text.trim()) : api.reply(runId, text.trim())
                )
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

/** Auth-fetched check-gate image (an <img src> can't carry the token). */
function GateImage({ runId, name }: { runId: string; name: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let obj: string | null = null;
    let cancelled = false;
    api
      .gateArtifact(runId, name)
      .then((blob) => {
        if (cancelled) return;
        obj = URL.createObjectURL(blob);
        setUrl(obj);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [runId, name]);
  if (error) return <div className="error-box">timeline image failed to load: {error}</div>;
  if (!url) return <div className="empty-state">Loading timeline…</div>;
  return <img src={url} alt="golden-vs-run event timeline" style={{ maxWidth: "100%", border: "1px solid var(--border, #d0d7de)", borderRadius: 6 }} />;
}

/** Fetch-on-expand raw view of a check-gate JSON artifact (the full report). */
function GateDocToggle({ runId, name }: { runId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const show = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setBusy(true);
    try {
      setText(await (await api.gateArtifact(runId, name)).text());
    } catch (e) {
      setText(`failed to load: ${e instanceof Error ? e.message : e}`);
    } finally {
      setBusy(false);
    }
    setOpen(true);
  };
  return (
    <>
      <button className="btn btn-ghost" disabled={busy} onClick={() => void show()}>
        {open ? `hide ${name}` : name}
      </button>
      {open && <pre className="doc-view log-view">{text || "(empty)"}</pre>}
    </>
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
              if (
                window.confirm(
                  `Cancel run ${runId}? The executor and its in-flight agent are terminated immediately; afterwards you choose to resume, discard, or keep the run.`
                )
              ) {
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

/** One-tap recovery for failed/stalled runs. The server pre-classified which
 *  tier a retry would run (plain resume vs OpenClaw triage handoff) — the
 *  button states it up front; a still-live executor asks for confirmation
 *  before sending force: true (kill, then resume). */
function RetryPanel({
  runId,
  retry,
  retries,
  refresh,
}: {
  runId: string;
  retry: RetryClassification;
  retries: RetryEntry[];
  refresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const act = async (force: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const r = await api.retry(runId, force);
      setNotice(
        r.tier === "triage"
          ? "Handed to OpenClaw triage — it investigates, then fixes and resumes or posts options in Slack."
          : "Resumed — the executor restarts at the current step."
      );
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onRetry = () => {
    if (retry.needsForce) {
      if (window.confirm(`${retry.reason}\n\nForce retry kills the executor, then resumes. Continue?`)) {
        void act(true);
      }
      return;
    }
    void act(false);
  };

  return (
    <section className="panel action-bar">
      <h3>Retry</h3>
      {retry.eligible || retry.needsForce ? (
        <>
          <div className="gate-actions">
            <button className="btn btn-approve" disabled={busy} onClick={onRetry}>
              ↻ Retry{retry.needsForce ? " (force)…" : ""}
            </button>
          </div>
          <p className="run-links">
            {retry.needsForce
              ? "The executor is still alive — retrying asks for confirmation, then kills it and resumes."
              : retry.tier === "triage"
                ? `Will hand the run to OpenClaw triage: ${retry.reason}.`
                : `Will resume the run: ${retry.reason}.`}
          </p>
        </>
      ) : (
        <p className="run-links">Retry unavailable: {retry.reason}</p>
      )}
      {retries.length > 0 && (
        <p className="run-links">
          {retries.length} prior retr{retries.length === 1 ? "y" : "ies"}:{" "}
          {retries.map((r) => `${r.tier} at ${r.step ?? "?"} (${fmtWhen(r.at)})`).join(", ")}
        </p>
      )}
      {notice && <div className="notice-box">{notice}</div>}
      {error && <div className="error-box">{error}</div>}
    </section>
  );
}

/** A cancelled run's fate is an explicit founder choice, never silent: resume
 *  it (the executor picks up from the interrupted step, via the same
 *  factory-run resume path as the CLI and RetryPanel's resume tier), discard
 *  its worktree and branch, or do nothing and keep it — it stays listed
 *  either way. Distinct from RetryPanel: a cancel is a founder decision, not
 *  a failure, so there is no triage classification to run. */
function CancelledPanel({ runId, refresh }: { runId: string; refresh: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const act = async (fn: () => Promise<{ message?: string }>, fallback: string) => {
    setBusy(true);
    setError(null);
    try {
      const r = await fn();
      setNotice(r.message || fallback);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel gate-panel">
      <h3>■ Run cancelled — its fate is your call</h3>
      <p>
        Resume restarts the run at the step that was interrupted. Discard deletes its worktree and branch —
        uncommitted and unmerged work is lost permanently (the run record stays here). Doing nothing keeps
        everything as is.
      </p>
      <div className="gate-actions">
        <button
          className="btn btn-approve"
          disabled={busy}
          onClick={() => void act(() => api.resume(runId), "Resumed — the executor restarts at the interrupted step.")}
        >
          ▶ Resume run
        </button>
        <button
          className="btn btn-reject"
          disabled={busy}
          onClick={() => {
            if (
              window.confirm(
                `Discard ${runId}'s worktree and branch? Uncommitted and unmerged work is deleted permanently.`
              )
            ) {
              void act(() => api.discard(runId), "Worktree and branch discarded.");
            }
          }}
        >
          🗑 Discard worktree &amp; branch
        </button>
      </div>
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

/** Collapsible Prompt / Output / Transcript viewers for one step attempt.
 *  Everything is fetch-on-expand — transcripts especially are MBs and only
 *  cross the wire when the founder actually taps the button. */
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
  const kinds = (["prompt", "output", "transcript"] as const).filter((k) => docs?.[k].includes(attempt));
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
      {open === "transcript" ? (
        <TranscriptView raw={text} />
      ) : (
        open && <pre className="doc-view log-view">{text || "(empty)"}</pre>
      )}
    </div>
  );
}

// ---------- transcript timeline ----------

type TranscriptEntry =
  | { kind: "text"; text: string }
  | { kind: "tool"; name: string; input: string }
  | { kind: "tool-result"; text: string; isError: boolean }
  | { kind: "final"; text: string };

const TOOL_RESULT_PREVIEW = 1500;

function blockText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((b) => (b && typeof b === "object" && "text" in b ? String((b as { text: unknown }).text) : ""))
    .join("");
}

/** Parse stream-json transcript lines into a readable timeline. Unparseable
 *  lines (e.g. the first line cut by tail-capping) are skipped silently —
 *  same tolerance the engine's transcript readers use. */
function parseTranscript(raw: string): TranscriptEntry[] {
  const entries: TranscriptEntry[] = [];
  for (const line of raw.split("\n")) {
    let ev: unknown;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    if (!ev || typeof ev !== "object") continue;
    const e = ev as { type?: string; message?: { content?: unknown }; result?: unknown };
    if (e.type === "assistant" && Array.isArray(e.message?.content)) {
      for (const block of e.message.content as Array<Record<string, unknown>>) {
        if (!block || typeof block !== "object") continue;
        if (block.type === "text" && typeof block.text === "string" && block.text.trim()) {
          entries.push({ kind: "text", text: block.text });
        } else if (block.type === "tool_use" && typeof block.name === "string") {
          let input = "";
          try {
            input = JSON.stringify(block.input, null, 2) ?? "";
          } catch {
            /* unserializable input — leave empty */
          }
          entries.push({ kind: "tool", name: block.name, input });
        }
      }
    } else if (e.type === "user" && Array.isArray(e.message?.content)) {
      for (const block of e.message.content as Array<Record<string, unknown>>) {
        if (block && typeof block === "object" && block.type === "tool_result") {
          const text = blockText(block.content);
          entries.push({
            kind: "tool-result",
            text: text.length > TOOL_RESULT_PREVIEW ? `${text.slice(0, TOOL_RESULT_PREVIEW)}\n… (truncated)` : text,
            isError: block.is_error === true,
          });
        }
      }
    } else if (e.type === "result" && typeof e.result === "string") {
      entries.push({ kind: "final", text: e.result });
    }
  }
  return entries;
}

/** Parsed timeline of one attempt's transcript (assistant turns, tool calls
 *  with collapsed inputs, truncated tool results) with a raw-JSONL toggle. */
function TranscriptView({ raw }: { raw: string }) {
  const [showRaw, setShowRaw] = useState(false);
  const entries = parseTranscript(raw);
  return (
    <div className="transcript-view">
      <div className="gate-actions">
        <button className="btn btn-ghost" onClick={() => setShowRaw(!showRaw)}>
          {showRaw ? "parsed view" : "raw jsonl"}
        </button>
      </div>
      {showRaw ? (
        <pre className="doc-view log-view">{raw || "(empty)"}</pre>
      ) : entries.length === 0 ? (
        <div className="empty-state">No parseable events in this transcript.</div>
      ) : (
        <ol className="transcript-list">
          {entries.map((entry, i) => (
            <li key={i} className={`tr-entry tr-${entry.kind}`}>
              {entry.kind === "text" && <pre className="tr-text">{entry.text}</pre>}
              {entry.kind === "tool" && (
                <details>
                  <summary>
                    🔧 <code>{entry.name}</code>
                  </summary>
                  {entry.input && <pre className="doc-view log-view">{entry.input}</pre>}
                </details>
              )}
              {entry.kind === "tool-result" && (
                <details>
                  <summary>{entry.isError ? "⚠ tool result (error)" : "↩ tool result"}</summary>
                  <pre className="doc-view log-view">{entry.text || "(empty)"}</pre>
                </details>
              )}
              {entry.kind === "final" && (
                <details>
                  <summary>🏁 final result</summary>
                  <pre className="tr-text">{entry.text}</pre>
                </details>
              )}
            </li>
          ))}
        </ol>
      )}
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
