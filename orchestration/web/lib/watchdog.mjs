/*
 * Watchdog pure core for stale-run detection: the alertable predicate, the
 * two-tier quiet thresholds, the re-alert/cooldown rule, and the Slack
 * message composer, shared by the engine (bin/factory-run watchdog, via
 * require(esm) like retry.mjs) and the tests. Pure — no filesystem, clock,
 * or process access; callers feed in run.json contents, the previously
 * recorded alert snapshot (runs/<id>/watchdog.json), and `now`.
 *
 * The activity clock is run.updatedAt: setState stamps it on every state and
 * step transition, discussion turns, and retry handoffs, so "quiet" means the
 * whole engine has been silent about this run — exactly the gap where a run
 * can sit failed for days with money spent and nobody told.
 */

// Engine-active states: something is supposed to be executing. The agent step
// timeout is 90 minutes, so 6 hours of silence means a dead executor, not a
// slow step.
export const ACTIVE_THRESHOLD_HOURS = 6;
// Founder-wait and resumable states: a human is the bottleneck (gate, merge,
// held deploy) or the run needs a retry decision. A day of silence is the
// point where a reminder beats patience.
export const WAITING_THRESHOLD_HOURS = 24;
// Re-alert cadence for a run that stays stale with an unchanged snapshot.
export const COOLDOWN_HOURS = 72;

const ACTIVE_STATES = ["queued", "setup", "approved", "deploying", "recovering"];
const WAITING_STATES = ["awaiting-approval", "awaiting-merge", "failed"];

/** Threshold tier for a run's current state: "active" (engine should be
 *  working), "waiting" (founder-wait or resumable), or null (never alert).
 *  `done` alerts only while its deploy is held — a released `done`, `killed`
 *  (early kill = success), `cancelled`, and `rejected` are settled outcomes,
 *  not silence. */
export function watchdogTier(run) {
  const state = String(run.state || "");
  if (/^running:/.test(state) || ACTIVE_STATES.includes(state)) return "active";
  if (WAITING_STATES.includes(state)) return "waiting";
  if (state === "done" && run.deployHeld === true) return "waiting";
  return null;
}

/** Human-compact duration for Slack/CLI: "45m", "7h 30m", "3d 2h". */
export function formatQuiet(ms) {
  const m = Math.max(0, Math.floor(Number(ms) / 60000));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return h % 24 ? `${d}d ${h % 24}h` : `${d}d`;
}

/** Concrete next step for a stale run, derived from its state. The watchdog
 *  only reports and suggests — remediation stays a founder action. */
export function suggestedAction(run) {
  const state = String(run.state || "");
  if (state === "awaiting-approval") {
    return `approve, reject, or reply: \`factory-run approve ${run.id}\` / \`factory-run reject ${run.id} "<feedback>"\` / \`factory-run reply ${run.id} "<text>"\``;
  }
  if (state === "awaiting-merge") {
    return `merge \`factory/${run.id}\` into ${run.baseBranch || "the base branch"}, then \`factory-run cleanup ${run.id}\``;
  }
  if (state === "done" && run.deployHeld === true) {
    return `release the held deploy: \`factory-run deploy ${run.id}\``;
  }
  // failed and silent-active states alike: retry picks resume vs triage.
  return `\`factory-run retry ${run.id}\` (first retry at a step plain-resumes; repeats hand off to OpenClaw triage)`;
}

/**
 * Decide whether a run deserves a stale alert right now. `run` is the
 * run.json object ({id, state, updatedAt, createdAt, stepIndex, deployHeld});
 * `priorAlert` is the recorded snapshot from the last successful alert
 * ({state, stepIndex, updatedAt, alertedAt}) or null; `now` is epoch ms.
 * `opts.hours` overrides BOTH tier thresholds uniformly; `opts.cooldownHours`
 * overrides the re-alert cooldown.
 *
 * Returns {alert, tier, quietMs, thresholdHours, reason}. A prior alert
 * suppresses re-alerting while its snapshot still matches the run (same
 * state, same stepIndex, updatedAt not advanced) and the cooldown has not
 * elapsed; any snapshot mismatch means the run moved (or woke up and
 * re-stalled) — that is news, so it alerts again immediately.
 */
export function classifyWatchdog(run, priorAlert, now, opts = {}) {
  const tier = watchdogTier(run);
  if (!tier) {
    return { alert: false, tier: null, quietMs: null, thresholdHours: null, reason: `state '${run.state}' is not watchdog-alertable` };
  }
  const last = Date.parse(run.updatedAt || run.createdAt || "");
  if (!Number.isFinite(last)) {
    return { alert: false, tier, quietMs: null, thresholdHours: null, reason: "no parseable updatedAt/createdAt — cannot measure silence" };
  }
  const thresholdHours =
    Number.isFinite(opts.hours) && opts.hours > 0
      ? opts.hours
      : tier === "active"
        ? ACTIVE_THRESHOLD_HOURS
        : WAITING_THRESHOLD_HOURS;
  const quietMs = now - last;
  if (quietMs <= thresholdHours * 3600000) {
    return { alert: false, tier, quietMs, thresholdHours, reason: `quiet ${formatQuiet(quietMs)} — under the ${thresholdHours}h threshold` };
  }
  if (priorAlert) {
    // Snapshot match mirrors the retry-tier "has the run moved" test:
    // updatedAt comparison is a strict string ordering on the ISO stamps.
    const moved =
      String(priorAlert.state || "") !== String(run.state || "") ||
      (priorAlert.stepIndex ?? 0) !== (run.stepIndex ?? 0) ||
      String(run.updatedAt || "") > String(priorAlert.updatedAt || "");
    const cooldownHours = Number.isFinite(opts.cooldownHours) && opts.cooldownHours > 0 ? opts.cooldownHours : COOLDOWN_HOURS;
    const alertedAt = Date.parse(priorAlert.alertedAt || "");
    const cooled = !Number.isFinite(alertedAt) || now - alertedAt > cooldownHours * 3600000;
    if (!moved && !cooled) {
      return {
        alert: false,
        tier,
        quietMs,
        thresholdHours,
        reason: `already alerted ${formatQuiet(now - alertedAt)} ago for this snapshot (cooldown ${cooldownHours}h)`,
      };
    }
    return {
      alert: true,
      tier,
      quietMs,
      thresholdHours,
      reason: moved
        ? `run moved since the last alert and is stale again (quiet ${formatQuiet(quietMs)} in '${run.state}')`
        : `still stale after the ${cooldownHours}h cooldown (quiet ${formatQuiet(quietMs)} in '${run.state}')`,
    };
  }
  return { alert: true, tier, quietMs, thresholdHours, reason: `quiet ${formatQuiet(quietMs)} in '${run.state}' — past the ${thresholdHours}h threshold` };
}

/** Outcome-first Slack message for one stale run. `info` carries what the
 *  caller observed: stepId (current workflow step id or null), quietMs,
 *  thresholdHours, usage (the engine's usageLine string, "" when nothing is
 *  priced yet), and action (suggestedAction output). One message per run,
 *  no digest. */
export function composeWatchdogMessage(run, info) {
  const stepBit = info.stepId ? ` at step *${info.stepId}*` : "";
  const lines = [
    `:hourglass_flowing_sand: Run ${run.id} (${run.rig}) needs attention: quiet for ${formatQuiet(info.quietMs)} in state \`${run.state}\`${stepBit} (threshold ${info.thresholdHours}h).`,
  ];
  if (info.usage) lines.push(info.usage);
  lines.push(`Next: ${info.action}`);
  return lines.join("\n");
}
