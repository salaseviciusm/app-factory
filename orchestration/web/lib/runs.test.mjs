/* Tests for runs.mjs step-document readers — run with `node --test orchestration/web/lib/*.test.mjs`. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getRunDetail, readRunLog, readStepDoc } from "./runs.mjs";

const RUN_ID = "feature-test-run";

/** Build a throwaway orchDir with one workflow and one run dir. */
function makeOrchDir(t, files = {}, runOverrides = {}) {
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
      ...runOverrides,
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

test("readStepDoc serves per-attempt transcripts with the larger tail cap", (t) => {
  // ~1.2 MB transcript: only the last 1 MB comes back (tail-capped), while the
  // 256 KB doc cap stays in force for prompts/outputs.
  const line = `{"type":"assistant","pad":"${"x".repeat(1000)}"}\n`;
  const big = line.repeat(1250);
  const orchDir = makeOrchDir(t, {
    "implement.transcript.jsonl": "attempt one transcript",
    "implement.2.transcript.jsonl": big,
  });
  assert.deepEqual(readStepDoc(orchDir, RUN_ID, "implement", "transcript", 1), { text: "attempt one transcript" });
  const latest = readStepDoc(orchDir, RUN_ID, "implement", "transcript");
  assert.equal(latest.text.length, 1024 * 1024);
  assert.equal(latest.text, big.slice(big.length - 1024 * 1024));
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

test("readStepDoc serves the synthetic resolve-conflicts step's documents", (t) => {
  const orchDir = makeOrchDir(t, {
    "resolve-conflicts.prompt.md": "resolve prompt",
    "resolve-conflicts.2.output.json": '{"result":"resolved"}',
  });
  // Not declared in the workflow, but allowlisted as an engine-synthetic step.
  assert.deepEqual(readStepDoc(orchDir, RUN_ID, "resolve-conflicts", "prompt"), { text: "resolve prompt" });
  assert.deepEqual(readStepDoc(orchDir, RUN_ID, "resolve-conflicts", "output", 2), { text: '{"result":"resolved"}' });
  assert.equal(readStepDoc(orchDir, RUN_ID, "resolve-conflicts", "output", 1).status, 404);
});

test("getRunDetail exposes recovery state, conflict/escalation docs, and resolve-conflicts docs", (t) => {
  const recovery = {
    iterations: 2,
    attempts: [
      { at: "2026-01-01T00:30:00.000Z", fromSha: "aaa", toSha: "bbb", conflicted: false, outcome: "reverify" },
      { at: "2026-01-01T00:45:00.000Z", fromSha: "bbb", toSha: "ccc", conflicted: true, outcome: "resolved" },
    ],
  };
  const orchDir = makeOrchDir(
    t,
    {
      "conflict.md": "conflicting files\n",
      "escalation.md": "needs a human\n",
      "resolve-conflicts.prompt.md": "p",
      "resolve-conflicts.output.json": "o",
    },
    { recovery }
  );
  const detail = getRunDetail(orchDir, RUN_ID);
  assert.deepEqual(detail.recovery, recovery);
  assert.equal(detail.conflictMd, "conflicting files\n");
  assert.equal(detail.escalationMd, "needs a human\n");
  assert.deepEqual(detail.stepDocs["resolve-conflicts"], { prompt: [1], output: [1], transcript: [] });
});

test("getRunDetail lists step docs, extra documents, and the extended logs", (t) => {
  const orchDir = makeOrchDir(t, {
    "plan.prompt.md": "p",
    "plan.output.json": "o",
    "implement.prompt.md": "p1",
    "implement.2.prompt.md": "p2",
    "implement.2.output.json": "o2",
    "implement.transcript.jsonl": "t1",
    "implement.2.transcript.jsonl": "t2",
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
    plan: { prompt: [1], output: [1], transcript: [] },
    implement: { prompt: [1, 2], output: [2], transcript: [1, 2] },
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
  assert.equal(detail.recovery, null);
  assert.equal(detail.conflictMd, null);
  assert.equal(detail.escalationMd, null);
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
