/* Tests for the retry pure core — run with `node --test orchestration/web/lib/*.test.mjs`. */
import test from "node:test";
import assert from "node:assert/strict";

import {
  STALL_MS,
  TERMINAL_STATES,
  classifyRetry,
  isStalled,
  lastFailureDetail,
  matchesExecutor,
} from "./retry.mjs";

const T0 = "2026-01-01T00:00:00.000Z";
const NOW_FRESH = Date.parse(T0) + 5 * 60 * 1000; // 5 min after the last update
const NOW_STALE = Date.parse(T0) + 11 * 60 * 1000; // 11 min — past the 10 min stall

/** A failed feature-dev run parked at `implement`, with ctx defaults a caller
 *  would observe on a healthy run dir (no escalation, worktree present, no
 *  live executor). */
function classify(runOverrides = {}, ctxOverrides = {}) {
  return classifyRetry(
    {
      id: "feature-x",
      state: "failed",
      updatedAt: T0,
      stepIndex: 2,
      retries: [],
      history: [],
      ...runOverrides,
    },
    {
      now: NOW_FRESH,
      stepId: "implement",
      escalationPresent: false,
      worktreeMissing: false,
      executorAlive: false,
      executorPid: null,
      force: false,
      lastFailure: "",
      ...ctxOverrides,
    }
  );
}

test("isStalled: only non-terminal, non-awaiting runs past the threshold", () => {
  assert.equal(isStalled("running:implement", T0, NOW_STALE), true);
  assert.equal(isStalled("running:implement", T0, NOW_FRESH), false);
  assert.equal(isStalled("running:implement", T0, Date.parse(T0) + STALL_MS), false); // exactly at the bound
  assert.equal(isStalled("awaiting-approval", T0, NOW_STALE), false);
  for (const s of TERMINAL_STATES) assert.equal(isStalled(s, T0, NOW_STALE), false);
  assert.equal(isStalled("queued", "not-a-date", NOW_STALE), false);
  assert.equal(isStalled(null, T0, NOW_STALE), false);
});

test("first retry of a failed run is the resume tier and records the step", () => {
  const d = classify();
  assert.equal(d.eligible, true);
  assert.equal(d.tier, "resume");
  assert.match(d.reason, /implement/);
  assert.equal(d.killExecutor, false);
});

test("a prior resume-tier retry at the same step escalates to triage", () => {
  const d = classify({ retries: [{ at: T0, tier: "resume", step: "implement" }] });
  assert.equal(d.eligible, true);
  assert.equal(d.tier, "triage");
});

test("a prior resume at a DIFFERENT step still gets a plain resume", () => {
  const d = classify({ retries: [{ at: T0, tier: "resume", step: "plan" }] });
  assert.equal(d.tier, "resume");
});

test("straight-to-triage causes skip the resume tier on the first retry", () => {
  assert.equal(classify({}, { lastFailure: "preflight failed: notify contract broken" }).tier, "triage");
  assert.equal(classify({}, { escalationPresent: true }).tier, "triage");
  assert.equal(classify({}, { worktreeMissing: true }).tier, "triage");
  // An ordinary step failure is not one of them.
  assert.equal(classify({}, { lastFailure: "agent step 'implement' exited 1" }).tier, "resume");
});

test("a stuck run (non-terminal, silent past the threshold) is retryable", () => {
  const d = classify({ state: "running:implement" }, { now: NOW_STALE });
  assert.equal(d.eligible, true);
  assert.equal(d.tier, "resume");
});

test("a recently-updated non-terminal run is refused — not stuck yet", () => {
  const d = classify({ state: "running:implement" }, { now: NOW_FRESH });
  assert.equal(d.eligible, false);
  assert.match(d.reason, /not stuck/);
});

test("terminal-success and awaiting-approval states are refused", () => {
  for (const state of ["done", "cancelled", "killed", "rejected"]) {
    const d = classify({ state });
    assert.equal(d.eligible, false);
    assert.match(d.reason, new RegExp(state));
  }
  const gate = classify({ state: "awaiting-approval" });
  assert.equal(gate.eligible, false);
  assert.match(gate.reason, /approve/);
});

test("a live executor blocks retry without --force and names the pid", () => {
  const d = classify({ state: "running:implement" }, { now: NOW_STALE, executorAlive: true, executorPid: 4242 });
  assert.equal(d.eligible, false);
  assert.equal(d.needsForce, true);
  assert.match(d.reason, /4242/);
});

test("--force past a live executor is eligible and flags the kill", () => {
  const d = classify({ state: "running:implement" }, { now: NOW_STALE, executorAlive: true, executorPid: 4242, force: true });
  assert.equal(d.eligible, true);
  assert.equal(d.tier, "resume");
  assert.equal(d.killExecutor, true);
});

test("an open triage session blocks a second dispatch until the run moves", () => {
  const dispatched = "2026-01-01T00:10:00.000Z";
  // updatedAt was stamped by the handoff itself: still open — refuse with the session id.
  const open = classify({ updatedAt: dispatched, retries: [{ at: dispatched, tier: "triage", step: "implement" }] }, { now: NOW_STALE });
  assert.equal(open.eligible, false);
  assert.match(open.reason, /factory-triage-feature-x/);
  // The run moved after the handoff (triage resumed it, it failed again): retryable again.
  const moved = classify(
    { updatedAt: "2026-01-01T00:20:00.000Z", retries: [{ at: dispatched, tier: "triage", step: "implement" }] },
    { now: Date.parse("2026-01-01T00:25:00.000Z") }
  );
  assert.equal(moved.eligible, true);
  assert.equal(moved.tier, "triage"); // resume can't have fixed it — triage again
});

test("lastFailureDetail returns the newest failed entry's detail", () => {
  assert.equal(lastFailureDetail([]), "");
  assert.equal(lastFailureDetail(undefined), "");
  assert.equal(
    lastFailureDetail([
      { state: "failed", detail: "old failure", at: T0 },
      { state: "running:implement", detail: null, at: T0 },
      { state: "failed", detail: "new failure", at: T0 },
    ]),
    "new failure"
  );
});

test("matchesExecutor accepts only this run's exec command line", () => {
  assert.equal(matchesExecutor("node /repo/orchestration/bin/factory-run exec feature-x", "feature-x"), true);
  assert.equal(matchesExecutor("  node /repo/orchestration/bin/factory-run exec feature-x \n", "feature-x"), true);
  // Another run, a prefix-colliding id, an unrelated reused pid, or no command at all.
  assert.equal(matchesExecutor("node /repo/orchestration/bin/factory-run exec feature-y", "feature-x"), false);
  assert.equal(matchesExecutor("node /repo/orchestration/bin/factory-run exec feature-x-2", "feature-x"), false);
  assert.equal(matchesExecutor("vim exec feature-x", "feature-x"), false);
  assert.equal(matchesExecutor("", "feature-x"), false);
  assert.equal(matchesExecutor(null, "feature-x"), false);
});
