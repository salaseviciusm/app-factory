/*
 * Retry pure core for failed & stuck runs: stall detection, executor-command
 * matching, and the retry eligibility/tier classifier shared by the engine
 * (bin/factory-run, via require(esm) like discussion.mjs), the web server, and
 * the web console. Pure — no filesystem, clock, or process access; callers
 * feed in run.json contents plus a context of observed facts.
 *
 * Two tiers, one decision:
 *   "resume" — first retry at the current step; a plain `factory-run resume`
 *              is the cheapest thing that can work.
 *   "triage" — a plain resume was already tried at this step, or the failure
 *              is one a resume cannot fix (preflight failure, escalation.md
 *              present, missing worktree); the run is handed to the OpenClaw
 *              chief of staff to investigate.
 */

// "killed" is the discussion step's don't-build ending: terminal and a
// SUCCESS (early kill = money saved), never rendered as a failure.
// "awaiting-merge" is a merge-policy "review" run that finished green: terminal
// (the engine is done; the founder merges the run's PR on GitHub), also a success.
// "closed" is an awaiting-merge run whose PR was closed without merging (via
// `factory-run sync`): terminal and settled — the worktree is torn down but the
// branch stays in git, so a follow-up run can restart the chain later.
export const TERMINAL_STATES = ["done", "failed", "rejected", "cancelled", "killed", "awaiting-merge", "closed"];

// A non-terminal, non-awaiting run with no state update for this long counts
// as stuck. A legitimately long agent step also trips this, which is why
// retry additionally checks executor liveness before acting.
export const STALL_MS = 10 * 60 * 1000;

/** True when a run counts as stuck: non-terminal, not parked at a founder
 *  gate, and no state update for more than STALL_MS. `now` is epoch ms. */
export function isStalled(state, updatedAt, now = Date.now()) {
  if (!state || TERMINAL_STATES.includes(state) || state === "awaiting-approval") return false;
  const t = Date.parse(updatedAt || "");
  return Number.isFinite(t) && now - t > STALL_MS;
}

/** True when a `ps -o command=` line is THIS run's detached executor
 *  (`node .../factory-run exec <run_id>`). The pid-reuse guard: a recorded
 *  pid only counts as a live executor when its command line still matches. */
export function matchesExecutor(command, runId) {
  const cmd = String(command || "").trim();
  return cmd.includes("factory-run") && cmd.endsWith(` exec ${runId}`);
}

/** Detail of the most recent history entry that set the run `failed`, or "".
 *  This is the summary setState recorded — the classifier pattern-matches it
 *  for failures a plain resume cannot fix. */
export function lastFailureDetail(history) {
  for (let i = (history || []).length - 1; i >= 0; i--) {
    const h = history[i];
    if (h && h.state === "failed" && h.detail) return h.detail;
  }
  return "";
}

// Failure summaries a plain resume would only replay: the executor re-runs
// preflight on resume (same verdict), so the failure needs investigation, not
// a restart. Prefixes come from the engine's own setState summaries.
const RESUME_CANNOT_FIX = [
  { re: /^preflight failed/, why: "preflight failed — a plain resume re-runs preflight and fails the same way" },
];

/**
 * Classify a retry request. `run` is the run.json object ({id, state,
 * updatedAt, stepIndex, retries, history}); `ctx` is what the caller observed:
 *   now                — epoch ms for the stall computation
 *   stepId             — current workflow step id (null when unresolvable)
 *   escalationPresent  — run dir has escalation.md
 *   worktreeMissing    — run.worktree is set but the directory is gone
 *   executorAlive      — the recorded executor pid is a live matching process
 *   executorPid        — that pid (for the refusal message)
 *   force              — founder confirmed killing a live executor
 *   lastFailure        — lastFailureDetail(run.history), precomputed or ""
 *
 * Returns {eligible, tier: "resume"|"triage"|null, reason} plus
 * `needsForce: true` when only a live executor blocks the retry, and
 * `killExecutor: true` on eligible results that must terminate the old
 * executor first (force given, executor alive).
 */
export function classifyRetry(run, ctx = {}) {
  const state = run.state;
  const stepId = ctx.stepId ?? null;
  if (state === "awaiting-approval") {
    return { eligible: false, tier: null, reason: "run is awaiting founder approval — approve, reject, or reply instead of retrying" };
  }
  if (TERMINAL_STATES.includes(state) && state !== "failed") {
    return { eligible: false, tier: null, reason: `run is ${state}; nothing to retry` };
  }
  if (state !== "failed" && !isStalled(state, run.updatedAt, ctx.now)) {
    return {
      eligible: false,
      tier: null,
      reason: `run is ${state} and updated within the last ${STALL_MS / 60000} minutes — not stuck; wait or cancel instead`,
    };
  }
  // Double-execute guard: resuming past a live executor would run the step
  // loop twice. Killing it is a founder decision (--force), never a default —
  // a long agent step legitimately trips the stall heuristic.
  if (ctx.executorAlive === true && ctx.force !== true) {
    return {
      eligible: false,
      tier: null,
      needsForce: true,
      reason: `executor (pid ${ctx.executorPid ?? "unknown"}) is still alive — a retry now would double-execute; pass --force to kill it and retry`,
    };
  }
  const killExecutor = ctx.executorAlive === true;
  const retries = Array.isArray(run.retries) ? run.retries : [];
  const atStep = retries.filter((r) => r && r.step === stepId);
  const last = atStep[atStep.length - 1];
  // One open triage session per run: while the run hasn't moved since the
  // handoff (updatedAt is stamped by the handoff itself, so "moved" means a
  // strictly later update), a second dispatch would duplicate the
  // investigation — refuse with a pointer to the open session.
  if (last && last.tier === "triage" && !(String(run.updatedAt || "") > String(last.at || ""))) {
    return {
      eligible: false,
      tier: null,
      reason: `triage session factory-triage-${run.id} is already investigating step '${stepId}' — follow up with the chief of staff instead of dispatching again`,
    };
  }
  const failure = ctx.lastFailure || "";
  for (const { re, why } of RESUME_CANNOT_FIX) {
    if (re.test(failure)) return { eligible: true, tier: "triage", reason: why, killExecutor };
  }
  if (ctx.escalationPresent) {
    return { eligible: true, tier: "triage", reason: "escalation.md present — an agent already asked for a human on this run", killExecutor };
  }
  if (ctx.worktreeMissing) {
    return { eligible: true, tier: "triage", reason: "run worktree is missing — a plain resume cannot execute steps without it", killExecutor };
  }
  if (last) {
    // A resume was already tried at this step (directly, or by a triage
    // session that fixed-and-resumed and the run failed here again) — another
    // plain resume is not the answer.
    return { eligible: true, tier: "triage", reason: `a retry was already tried at step '${stepId}' (${last.tier} tier) — handing to OpenClaw triage`, killExecutor };
  }
  return { eligible: true, tier: "resume", reason: `first retry at step '${stepId}' — plain resume`, killExecutor };
}
