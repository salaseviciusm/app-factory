import type { RunDetail, RunSummary, StepRow, Usage, Workflow } from "./types";

export function fmtTokens(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(n);
}

export function fmtCost(n: number | null | undefined): string {
  return n == null ? "—" : `$${n.toFixed(n >= 10 ? 1 : 2)}`;
}

export function fmtBytes(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

export function fmtDuration(s: number | null | undefined): string {
  if (s == null) return "—";
  if (s < 90) return `${Math.round(s)}s`;
  if (s < 5400) return `${Math.round(s / 60)}m`;
  return `${(s / 3600).toFixed(1)}h`;
}

export function fmtWhen(iso: string | undefined | null): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  const diff = Date.now() - t;
  if (diff < 60e3) return "just now";
  if (diff < 3600e3) return `${Math.floor(diff / 60e3)}m ago`;
  if (diff < 86400e3) return `${Math.floor(diff / 3600e3)}h ago`;
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function usageLine(u: Usage | null): string | null {
  if (!u || !u.pricedSteps) return null;
  return `${fmtCost(u.costUsd)} · in ${fmtTokens(u.inputTokens)} (${fmtTokens(u.cacheReadTokens)} cached) / out ${fmtTokens(u.outputTokens)}`;
}

// "killed" is a discussion step's don't-build ending: terminal and a success
// (early kill = money saved), styled like done — never like failed.
export const TERMINAL_STATES = ["done", "failed", "rejected", "cancelled", "killed"];

export function isTerminal(state: string): boolean {
  return TERMINAL_STATES.includes(state);
}

/** CSS modifier for a run state badge. */
export function stateKind(state: string): string {
  if (state === "done") return "ok";
  if (state === "killed") return "ok";
  if (state === "failed") return "fail";
  if (state === "rejected") return "warn";
  if (state === "cancelled") return "muted";
  if (state === "awaiting-approval") return "gate";
  if (state.startsWith("running:") || state === "deploying" || state === "setup" || state === "queued" || state === "recovering") return "active";
  return "muted";
}

/** CSS modifier for a telemetry step-status badge ("recover" = deploy hit base
 *  drift and looped the gates back; "gate" = a founder-gated check parked the
 *  run on the check gate — neither is a step failure). */
export function stepStatusKind(status: string): string {
  if (status === "ok") return "ok";
  if (status === "recover" || status === "gate") return "warn";
  return "fail";
}

export function stateLabel(state: string): string {
  if (state.startsWith("running:")) return `running ${state.slice(8)}`;
  return state;
}

export type NodeStatus = "done" | "fail" | "active" | "gate" | "pending";

export interface NodeInfo {
  status: NodeStatus;
  attempts: number;
  last: StepRow | null;
}

/**
 * Per-workflow-step status for the node graph, derived from the run state,
 * stepIndex, and telemetry attempts (which may be absent — "no telemetry" is a
 * normal state, not an error).
 */
export function deriveNodes(detail: RunDetail): Record<string, NodeInfo> {
  const wf: Workflow | null = detail.workflow;
  const run: RunSummary = detail.run;
  const out: Record<string, NodeInfo> = {};
  if (!wf) return out;
  const stepIdx = run.stepIndex ?? (isTerminal(run.state) && run.state === "done" ? wf.steps.length : 0);
  wf.steps.forEach((step, i) => {
    const rows = detail.steps.filter((s) => s.step_id === step.id);
    const last = rows.length ? rows[rows.length - 1] : null;
    let status: NodeStatus = "pending";
    if (run.state === `running:${step.id}` || (run.state === "deploying" && step.type === "deploy")) {
      status = "active";
    } else if (
      run.state === "awaiting-approval" &&
      // "commands": a founder-gated check parked the run on its check gate.
      (step.type === "gate" || step.type === "discussion" || step.type === "commands") &&
      i === stepIdx
    ) {
      status = "gate";
    } else if (last && last.status === "recover") {
      // Deploy hit base drift and looped the gates back — it will run again.
      status = run.state === "failed" ? "fail" : "pending";
    } else if (last) {
      status = last.status === "ok" ? "done" : i < stepIdx ? "done" : "fail";
      // a step that failed and looped back may have later ok rows; last row wins
      if (last.status === "fail" && i >= stepIdx && !isTerminal(run.state)) status = "fail";
      if (last.status === "fail" && (run.state === "failed" || run.state === "rejected")) status = "fail";
    } else if (i < stepIdx) {
      status = "done";
    } else if (run.state === "failed" && i === stepIdx) {
      status = "fail";
    }
    out[step.id] = { status, attempts: rows.length, last };
  });
  return out;
}
