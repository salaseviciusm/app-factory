/*
 * Sleep-proof spawn wrapping + agent-step failure classification, the pure
 * core shared by the engine (bin/factory-run, via require(esm) like
 * discussion.mjs) and `node --test`. Pure — no process, platform, or
 * filesystem access; callers feed in `process.platform` and the observed
 * spawnSync outcome.
 *
 * Why: when the Mac sleeps mid-step, the agent's in-flight API call dies and,
 * on wake, spawnSync's wall-clock timer fires immediately — hours of
 * nearly-complete work lost and reported as a misleading "timed out after
 * Nm". Two defenses:
 *   sleepProofSpawn          — hold a power assertion for the child's whole
 *                              lifetime so idle/system sleep cannot kill it;
 *   classifyAgentStepFailure — when sleep still happens (lid close, forced
 *                              sleep — caffeinate cannot block those), name
 *                              the real cause instead of a fake timeout.
 */

/** Wrap a long-lived spawn in a macOS power assertion scoped to the child's
 *  lifetime: `caffeinate -is <cmd> <args...>` blocks idle and system sleep
 *  while the child runs and releases the assertion on any exit path (success,
 *  timeout kill, executor crash) because caffeinate itself exits then.
 *  caffeinate execs the utility verbatim (argv, stdio, env untouched) and
 *  exits with its status, so callers' timeout/ETIMEDOUT/exit-status handling
 *  is unaffected. Non-darwin platforms pass through untouched. */
export function sleepProofSpawn(platform, cmd, args) {
  if (platform !== "darwin") return { cmd, args };
  return { cmd: "caffeinate", args: ["-is", cmd, ...args] };
}

/** The sleep-kill signature observed in run self-weekly-self-review-find-2:
 *  the transcript's result event carries terminal_reason "api_error" and a
 *  result text naming the sleep ("Your computer went to sleep mid-response"). */
function hasSleepSignature(result) {
  return Boolean(
    result &&
      result.terminal_reason === "api_error" &&
      typeof result.result === "string" &&
      /computer went to sleep/i.test(result.result)
  );
}

/**
 * Classify a finished agent-step spawn. Inputs are what runAgentStep observed:
 *   stepId         — workflow step id (for the summary)
 *   timeoutMinutes — the timeout the spawn actually used
 *   errorCode      — res.error?.code from spawnSync ("ETIMEDOUT" on timeout)
 *   status         — res.status (0 on success, non-zero/null otherwise)
 *   stderr         — res.stderr (sliced into the exit summary)
 *   result         — the transcript's extracted result event object, or null
 *
 * Returns null when the step succeeded, else {kind, summary}:
 *   "sleep"   — the sleep signature is present on either failure branch
 *               (ETIMEDOUT or non-zero exit): the machine slept mid-step and
 *               the evidence is decisive, so the summary names system sleep,
 *               never a timeout;
 *   "timeout" — ETIMEDOUT without the signature (the existing summary shape);
 *   "exit"    — non-zero/absent exit status (the existing summary shape).
 * The summary string flows unchanged to run.json history (setState detail),
 * telemetry (tStep), and the Slack FAILED notification.
 */
export function classifyAgentStepFailure({ stepId, timeoutMinutes, errorCode, status, stderr, result }) {
  const timedOut = errorCode === "ETIMEDOUT";
  if (!timedOut && status === 0) return null;
  if (hasSleepSignature(result)) {
    return {
      kind: "sleep",
      summary: `agent step '${stepId}' was killed by system sleep — the machine slept mid-step and the in-flight API call died on wake (terminal_reason api_error), not a genuine ${timeoutMinutes}m timeout`,
    };
  }
  if (timedOut) {
    return { kind: "timeout", summary: `agent step '${stepId}' timed out after ${timeoutMinutes}m` };
  }
  return { kind: "exit", summary: `agent step '${stepId}' exited ${status}: ${(stderr || "").slice(0, 500)}` };
}
