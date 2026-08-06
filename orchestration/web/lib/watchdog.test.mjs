/* Tests for the watchdog pure core — run with `node --test orchestration/web/lib/*.test.mjs`. */
import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTIVE_THRESHOLD_HOURS,
  WAITING_THRESHOLD_HOURS,
  COOLDOWN_HOURS,
  classifyWatchdog,
  composeWatchdogMessage,
  formatQuiet,
  suggestedAction,
  watchdogTier,
} from "./watchdog.mjs";

const T0 = "2026-01-01T00:00:00.000Z";
const HOUR = 3600000;
const at = (hours) => Date.parse(T0) + hours * HOUR;

/** A failed feature-dev run last touched at T0. */
function run(overrides = {}) {
  return {
    id: "feature-x",
    rig: "skip-hero",
    workflow: "feature-dev",
    state: "failed",
    stepIndex: 2,
    createdAt: "2025-12-31T00:00:00.000Z",
    updatedAt: T0,
    baseBranch: "main",
    ...overrides,
  };
}

test("watchdogTier: active states, waiting states, and the never-alert set", () => {
  for (const state of ["queued", "setup", "approved", "running:implement", "running:resolve-conflicts", "deploying", "recovering"]) {
    assert.equal(watchdogTier(run({ state })), "active", state);
  }
  for (const state of ["awaiting-approval", "awaiting-merge", "failed"]) {
    assert.equal(watchdogTier(run({ state })), "waiting", state);
  }
  assert.equal(watchdogTier(run({ state: "done", deployHeld: true })), "waiting");
  for (const state of ["done", "killed", "cancelled", "rejected"]) {
    assert.equal(watchdogTier(run({ state })), null, state);
  }
  assert.equal(watchdogTier(run({ state: null })), null);
});

test("a failed run quiet past 24h alerts; the same run quiet 1h does not", () => {
  const stale = classifyWatchdog(run(), null, at(25));
  assert.equal(stale.alert, true);
  assert.equal(stale.tier, "waiting");
  assert.equal(stale.thresholdHours, WAITING_THRESHOLD_HOURS);
  const fresh = classifyWatchdog(run(), null, at(1));
  assert.equal(fresh.alert, false);
  assert.match(fresh.reason, /under the 24h threshold/);
});

test("never-alert states stay silent regardless of age", () => {
  for (const state of ["done", "killed", "cancelled", "rejected"]) {
    const d = classifyWatchdog(run({ state }), null, at(24 * 365));
    assert.equal(d.alert, false, state);
    assert.match(d.reason, /not watchdog-alertable/);
  }
});

test("founder-wait states alert past 24h, including a held-deploy done", () => {
  for (const state of ["awaiting-approval", "awaiting-merge"]) {
    assert.equal(classifyWatchdog(run({ state }), null, at(25)).alert, true, state);
    assert.equal(classifyWatchdog(run({ state }), null, at(23)).alert, false, state);
  }
  assert.equal(classifyWatchdog(run({ state: "done", deployHeld: true }), null, at(25)).alert, true);
});

test("engine-active states alert past 6h", () => {
  const d = classifyWatchdog(run({ state: "running:implement" }), null, at(7));
  assert.equal(d.alert, true);
  assert.equal(d.tier, "active");
  assert.equal(d.thresholdHours, ACTIVE_THRESHOLD_HOURS);
  assert.equal(classifyWatchdog(run({ state: "running:implement" }), null, at(5)).alert, false);
});

test("--hours overrides both tier thresholds uniformly", () => {
  const opts = { hours: 2 };
  assert.equal(classifyWatchdog(run({ state: "running:implement" }), null, at(3), opts).alert, true);
  assert.equal(classifyWatchdog(run(), null, at(3), opts).alert, true);
  assert.equal(classifyWatchdog(run(), null, at(1), opts).alert, false);
  assert.equal(classifyWatchdog(run(), null, at(3), opts).thresholdHours, 2);
  // Garbage overrides fall back to the tier defaults.
  assert.equal(classifyWatchdog(run(), null, at(25), { hours: NaN }).thresholdHours, WAITING_THRESHOLD_HOURS);
  assert.equal(classifyWatchdog(run(), null, at(25), { hours: -1 }).thresholdHours, WAITING_THRESHOLD_HOURS);
});

test("a matching prior-alert snapshot suppresses the re-alert", () => {
  const prior = { state: "failed", stepIndex: 2, updatedAt: T0, alertedAt: new Date(at(25)).toISOString() };
  const d = classifyWatchdog(run(), prior, at(26));
  assert.equal(d.alert, false);
  assert.match(d.reason, /already alerted 1h ago .*cooldown 72h/);
});

test("a state or step change re-alerts immediately", () => {
  const prior = { state: "running:implement", stepIndex: 2, updatedAt: T0, alertedAt: new Date(at(25)).toISOString() };
  const stateChanged = classifyWatchdog(run(), prior, at(26));
  assert.equal(stateChanged.alert, true);
  assert.match(stateChanged.reason, /moved since the last alert/);
  const stepChanged = classifyWatchdog(run({ stepIndex: 3 }), { ...prior, state: "failed" }, at(26));
  assert.equal(stepChanged.alert, true);
});

test("an advanced updatedAt (woke up, re-stalled) re-alerts immediately", () => {
  const prior = { state: "failed", stepIndex: 2, updatedAt: T0, alertedAt: new Date(at(1)).toISOString() };
  const restalled = classifyWatchdog(run({ updatedAt: new Date(at(2)).toISOString() }), prior, at(27));
  assert.equal(restalled.alert, true);
  assert.match(restalled.reason, /moved since the last alert/);
});

test("the cooldown re-alerts an unchanged snapshot; --cooldown-hours overrides it", () => {
  const prior = { state: "failed", stepIndex: 2, updatedAt: T0, alertedAt: new Date(at(25)).toISOString() };
  assert.equal(classifyWatchdog(run(), prior, at(25 + COOLDOWN_HOURS - 1)).alert, false);
  const cooled = classifyWatchdog(run(), prior, at(25 + COOLDOWN_HOURS + 1));
  assert.equal(cooled.alert, true);
  assert.match(cooled.reason, /still stale after the 72h cooldown/);
  assert.equal(classifyWatchdog(run(), prior, at(28), { cooldownHours: 2 }).alert, true);
  assert.equal(classifyWatchdog(run(), prior, at(26), { cooldownHours: 2 }).alert, false);
});

test("a prior alert with an unparseable alertedAt never suppresses", () => {
  const prior = { state: "failed", stepIndex: 2, updatedAt: T0, alertedAt: "not-a-date" };
  assert.equal(classifyWatchdog(run(), prior, at(25)).alert, true);
});

test("missing updatedAt falls back to createdAt; neither parseable skips", () => {
  const d = classifyWatchdog(run({ updatedAt: undefined, createdAt: T0 }), null, at(25));
  assert.equal(d.alert, true);
  const bad = classifyWatchdog(run({ updatedAt: undefined, createdAt: "garbage" }), null, at(25));
  assert.equal(bad.alert, false);
  assert.match(bad.reason, /cannot measure silence/);
});

test("suggestedAction maps each state class to a concrete next step", () => {
  assert.match(suggestedAction(run()), /factory-run retry feature-x/);
  assert.match(suggestedAction(run({ state: "running:implement" })), /factory-run retry feature-x/);
  assert.match(suggestedAction(run({ state: "awaiting-approval" })), /factory-run approve feature-x/);
  assert.match(suggestedAction(run({ state: "awaiting-approval" })), /reply/);
  const merge = suggestedAction(run({ state: "awaiting-merge" }));
  assert.match(merge, /factory\/feature-x/);
  assert.match(merge, /factory-run cleanup feature-x/);
  assert.match(suggestedAction(run({ state: "done", deployHeld: true })), /factory-run deploy feature-x/);
});

test("formatQuiet: minutes, hours, and days", () => {
  assert.equal(formatQuiet(0), "0m");
  assert.equal(formatQuiet(45 * 60000), "45m");
  assert.equal(formatQuiet(7.5 * HOUR), "7h 30m");
  assert.equal(formatQuiet(26 * HOUR), "26h");
  assert.equal(formatQuiet(74 * HOUR), "3d 2h");
  assert.equal(formatQuiet(72 * HOUR), "3d");
});

test("composeWatchdogMessage carries id, rig, state, step, duration, cost, action", () => {
  const msg = composeWatchdogMessage(run(), {
    stepId: "implement",
    quietMs: 74 * HOUR,
    thresholdHours: 24,
    usage: ":moneybag: Cost $31.70 · tokens in 1.2M (900k cached) / out 40k · 7 agent step(s)",
    action: suggestedAction(run()),
  });
  for (const bit of ["feature-x", "skip-hero", "`failed`", "*implement*", "3d 2h", "$31.70", "factory-run retry feature-x"]) {
    assert.ok(msg.includes(bit), `message missing ${bit}: ${msg}`);
  }
  // Outcome first: the first line says what is wrong.
  assert.match(msg.split("\n")[0], /needs attention: quiet for 3d 2h/);
});

test("composeWatchdogMessage degrades without a step id or usage line", () => {
  const msg = composeWatchdogMessage(run({ state: "queued" }), {
    stepId: null,
    quietMs: 7 * HOUR,
    thresholdHours: 6,
    usage: "",
    action: suggestedAction(run({ state: "queued" })),
  });
  assert.ok(!msg.includes("at step"));
  assert.equal(msg.split("\n").length, 2); // headline + action, no empty usage line
});
