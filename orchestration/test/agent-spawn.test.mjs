/*
 * Tests for the sleep-proof spawn pure core (web/lib/agent-spawn.mjs):
 * caffeinate wrapping on darwin (argv preserved verbatim), pass-through on
 * every other platform, and the three failure classifications — sleep-kill
 * (the api_error + "computer went to sleep" signature, on both the ETIMEDOUT
 * and non-zero-exit branches), genuine timeout, and plain exit — plus the
 * success (null) case. Run with `node --test orchestration/test/`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { sleepProofSpawn, classifyAgentStepFailure } from "../web/lib/agent-spawn.mjs";

// The result event a sleep-killed transcript actually carries (run
// self-weekly-self-review-find-2): terminal_reason api_error + sleep text.
const SLEEP_RESULT = {
  type: "result",
  terminal_reason: "api_error",
  result: "API Error: Your computer went to sleep mid-response. Please try again.",
};

/** classifyAgentStepFailure with the fields a healthy failed step provides. */
function classify(overrides = {}) {
  return classifyAgentStepFailure({
    stepId: "implement",
    timeoutMinutes: 45,
    errorCode: undefined,
    status: 0,
    stderr: "",
    result: null,
    ...overrides,
  });
}

test("sleepProofSpawn wraps darwin spawns in caffeinate -is, argv preserved verbatim", () => {
  const args = ["-p", "do the thing", "--output-format", "stream-json", "--verbose"];
  const wrapped = sleepProofSpawn("darwin", "claude", args);
  assert.equal(wrapped.cmd, "caffeinate");
  assert.deepEqual(wrapped.args, ["-is", "claude", ...args]);
  // The wrapped argv after the "claude" element is the original array, untouched.
  assert.deepEqual(wrapped.args.slice(2), args);
  assert.deepEqual(args, ["-p", "do the thing", "--output-format", "stream-json", "--verbose"]);
});

test("sleepProofSpawn passes non-darwin platforms through untouched", () => {
  for (const platform of ["linux", "win32", "freebsd", ""]) {
    const args = ["-lc", "npm test"];
    const wrapped = sleepProofSpawn(platform, "bash", args);
    assert.equal(wrapped.cmd, "bash");
    assert.deepEqual(wrapped.args, ["-lc", "npm test"]);
  }
});

test("classify: success returns null", () => {
  assert.equal(classify(), null);
  assert.equal(classify({ result: { type: "result", terminal_reason: "success", result: "done" } }), null);
});

test("classify: sleep signature on the ETIMEDOUT branch names sleep, never a timeout", () => {
  const failure = classify({ errorCode: "ETIMEDOUT", status: null, result: SLEEP_RESULT });
  assert.equal(failure.kind, "sleep");
  assert.match(failure.summary, /'implement'/);
  assert.match(failure.summary, /system sleep/i);
  assert.ok(!failure.summary.includes("timed out"), `summary must not claim a timeout: ${failure.summary}`);
});

test("classify: sleep signature on the non-zero-exit branch also classifies as sleep", () => {
  const failure = classify({ status: 1, stderr: "api error", result: SLEEP_RESULT });
  assert.equal(failure.kind, "sleep");
  assert.match(failure.summary, /'implement'/);
  assert.match(failure.summary, /system sleep/i);
  assert.ok(!failure.summary.includes("timed out"));
});

test("classify: sleep text match is case-insensitive", () => {
  const failure = classify({
    errorCode: "ETIMEDOUT",
    status: null,
    result: { ...SLEEP_RESULT, result: "your COMPUTER WENT TO SLEEP mid-response" },
  });
  assert.equal(failure.kind, "sleep");
});

test("classify: ETIMEDOUT without the signature keeps the existing timeout summary verbatim", () => {
  for (const result of [
    null, // transcript truncated by the kill — no result event at all
    { type: "result", terminal_reason: "max_turns", result: "Your computer went to sleep mid-response" }, // wrong terminal_reason
    { type: "result", terminal_reason: "api_error", result: "API Error: overloaded" }, // api_error but not sleep
    { type: "result", terminal_reason: "api_error", result: 42 }, // non-string result text
  ]) {
    const failure = classify({ errorCode: "ETIMEDOUT", status: null, result });
    assert.equal(failure.kind, "timeout");
    assert.equal(failure.summary, "agent step 'implement' timed out after 45m");
  }
});

test("classify: non-zero exit without the signature keeps the existing exit summary shape", () => {
  const failure = classify({ status: 3, stderr: "boom\n".repeat(200) });
  assert.equal(failure.kind, "exit");
  assert.ok(failure.summary.startsWith("agent step 'implement' exited 3: boom"));
  // stderr is sliced to 500 chars, exactly the pre-existing bound.
  assert.equal(failure.summary, `agent step 'implement' exited 3: ${"boom\n".repeat(200).slice(0, 500)}`);
});

test("classify: spawn error without ETIMEDOUT (null status) still reports the exit shape", () => {
  const failure = classify({ errorCode: "ENOENT", status: null, stderr: "" });
  assert.equal(failure.kind, "exit");
  assert.equal(failure.summary, "agent step 'implement' exited null: ");
});
