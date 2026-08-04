/* Tests for runs.mjs step-document readers — run with `node --test orchestration/web/lib/*.test.mjs`. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getRunDetail, readRunLog, readStepDoc } from "./runs.mjs";

const RUN_ID = "feature-test-run";

/** Build a throwaway orchDir with one workflow and one run dir. */
function makeOrchDir(t, files = {}) {
  const orchDir = fs.mkdtempSync(path.join(os.tmpdir(), "runs-test-"));
  t.after(() => fs.rmSync(orchDir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(orchDir, "workflows"));
  fs.writeFileSync(
    path.join(orchDir, "workflows", "feature-dev.json"),
    JSON.stringify({
      name: "feature-dev",
      steps: [
        { id: "plan", type: "agent", prompt: "planner" },
        { id: "plan-gate", type: "gate" },
        { id: "implement", type: "agent", prompt: "implementer" },
        { id: "review", type: "agent", prompt: "reviewer" },
      ],
    })
  );
  const runDir = path.join(orchDir, "runs", RUN_ID);
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(runDir, "run.json"),
    JSON.stringify({
      id: RUN_ID,
      workflow: "feature-dev",
      rig: "no-such-rig",
      prompt: "test run",
      state: "done",
      stepIndex: 4,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T01:00:00.000Z",
      history: [],
    })
  );
  for (const [name, text] of Object.entries(files)) {
    fs.writeFileSync(path.join(runDir, name), text);
  }
  return orchDir;
}

test("readStepDoc resolves unsuffixed, suffixed, and latest attempts", (t) => {
  const orchDir = makeOrchDir(t, {
    "implement.prompt.md": "prompt one",
    "implement.2.prompt.md": "prompt two",
    "implement.3.prompt.md": "prompt three",
    "implement.output.json": '{"result":"out one"}',
    "implement.2.output.json": '{"result":"out two"}',
  });
  // Explicit attempts: unsuffixed file is attempt 1, .N files are attempt N.
  assert.deepEqual(readStepDoc(orchDir, RUN_ID, "implement", "prompt", 1), { text: "prompt one" });
  assert.deepEqual(readStepDoc(orchDir, RUN_ID, "implement", "prompt", "2"), { text: "prompt two" });
  assert.deepEqual(readStepDoc(orchDir, RUN_ID, "implement", "output", 2), { text: '{"result":"out two"}' });
  // Omitted attempt resolves to the latest, independently per kind.
  assert.deepEqual(readStepDoc(orchDir, RUN_ID, "implement", "prompt"), { text: "prompt three" });
  assert.deepEqual(readStepDoc(orchDir, RUN_ID, "implement", "output"), { text: '{"result":"out two"}' });
});

test("readStepDoc treats pre-existing run dirs (unsuffixed only) as attempt 1", (t) => {
  const orchDir = makeOrchDir(t, { "plan.prompt.md": "old-style prompt" });
  assert.deepEqual(readStepDoc(orchDir, RUN_ID, "plan", "prompt"), { text: "old-style prompt" });
  assert.deepEqual(readStepDoc(orchDir, RUN_ID, "plan", "prompt", 1), { text: "old-style prompt" });
});

test("readStepDoc rejects invalid step ids, kinds, and attempts with 400", (t) => {
  const orchDir = makeOrchDir(t, { "implement.prompt.md": "secret" });
  const invalid = (r) => {
    assert.equal(r.status, 400);
    assert.equal(r.text, undefined);
    assert.ok(r.error);
  };
  // Traversal-shaped or undeclared step ids never reach the filesystem.
  invalid(readStepDoc(orchDir, RUN_ID, "../x", "prompt"));
  invalid(readStepDoc(orchDir, RUN_ID, "a/b", "prompt"));
  invalid(readStepDoc(orchDir, RUN_ID, "implement%2f..", "prompt"));
  invalid(readStepDoc(orchDir, RUN_ID, "not-a-step", "prompt"));
  invalid(readStepDoc(orchDir, "..", "implement", "prompt"));
  // Kind is a strict whitelist.
  invalid(readStepDoc(orchDir, RUN_ID, "implement", "log"));
  invalid(readStepDoc(orchDir, RUN_ID, "implement", "PROMPT"));
  invalid(readStepDoc(orchDir, RUN_ID, "implement", "prompt.md"));
  // Attempt must be a bounded positive integer.
  invalid(readStepDoc(orchDir, RUN_ID, "implement", "prompt", 0));
  invalid(readStepDoc(orchDir, RUN_ID, "implement", "prompt", -1));
  invalid(readStepDoc(orchDir, RUN_ID, "implement", "prompt", "abc"));
  invalid(readStepDoc(orchDir, RUN_ID, "implement", "prompt", "1e2"));
  invalid(readStepDoc(orchDir, RUN_ID, "implement", "prompt", "1.5"));
  invalid(readStepDoc(orchDir, RUN_ID, "implement", "prompt", 100000));
});

test("readStepDoc returns 404 for valid input with no file", (t) => {
  const orchDir = makeOrchDir(t, { "implement.prompt.md": "prompt one" });
  const missing = (r) => {
    assert.equal(r.status, 404);
    assert.equal(r.text, undefined);
  };
  missing(readStepDoc(orchDir, RUN_ID, "implement", "prompt", 5));
  missing(readStepDoc(orchDir, RUN_ID, "implement", "output"));
  missing(readStepDoc(orchDir, RUN_ID, "review", "prompt"));
  missing(readStepDoc(orchDir, "feature-no-such-run", "implement", "prompt"));
});

test("getRunDetail lists step docs, extra documents, and the extended logs", (t) => {
  const orchDir = makeOrchDir(t, {
    "plan.prompt.md": "p",
    "plan.output.json": "o",
    "implement.prompt.md": "p1",
    "implement.2.prompt.md": "p2",
    "implement.2.output.json": "o2",
    "steering.md": "- steer left\n",
    "deviations.md": "none\n",
    "findings.md": "still failing\n",
    "engine.log": "engine\n",
    "checks.log": "checks\n",
    "deploy.log": "deploy\n",
    // Never a step doc: undeclared step / non-doc names must not appear.
    "rogue.prompt.md": "x",
    "qr.png": "x",
  });
  const detail = getRunDetail(orchDir, RUN_ID);
  assert.equal(detail.run.id, RUN_ID);
  assert.deepEqual(detail.stepDocs, {
    plan: { prompt: [1], output: [1] },
    implement: { prompt: [1, 2], output: [2] },
  });
  assert.equal(detail.steeringMd, "- steer left\n");
  assert.equal(detail.deviationsMd, "none\n");
  assert.equal(detail.findingsMd, "still failing\n");
  assert.deepEqual(detail.logs, ["engine", "checks", "deploy"]);
});

test("getRunDetail reports absent documents as null", (t) => {
  const orchDir = makeOrchDir(t);
  const detail = getRunDetail(orchDir, RUN_ID);
  assert.equal(detail.steeringMd, null);
  assert.equal(detail.deviationsMd, null);
  assert.deepEqual(detail.stepDocs, {});
  assert.deepEqual(detail.logs, []);
});

test("readRunLog serves the fixed whitelist and rejects everything else", (t) => {
  const orchDir = makeOrchDir(t, {
    "engine.log": "e",
    "setup.log": "s",
    "checks.log": "c",
    "tests.log": "t",
    "deploy.log": "d",
    "secrets.log": "nope",
  });
  assert.equal(readRunLog(orchDir, RUN_ID, "engine"), "e");
  assert.equal(readRunLog(orchDir, RUN_ID, "setup"), "s");
  assert.equal(readRunLog(orchDir, RUN_ID, "checks"), "c");
  assert.equal(readRunLog(orchDir, RUN_ID, "tests"), "t");
  assert.equal(readRunLog(orchDir, RUN_ID, "deploy"), "d");
  assert.equal(readRunLog(orchDir, RUN_ID, "executor"), null); // whitelisted but absent
  assert.equal(readRunLog(orchDir, RUN_ID, "secrets"), null);
  assert.equal(readRunLog(orchDir, RUN_ID, "../engine"), null);
});
