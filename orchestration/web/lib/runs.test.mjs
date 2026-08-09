/* Tests for runs.mjs step-document readers — run with `node --test orchestration/web/lib/*.test.mjs`. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { TERMINAL_STATES, classifyRunRetry, deriveChain, getRunDetail, readRunArtifact, readRunLog, readStepDoc, resolveGateArtifact } from "./runs.mjs";

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

test("awaiting-merge is a terminal success state, never stalled, with preview/deployHeld surfaced", (t) => {
  // A merge-policy "review" run parks here when green: the founder merges
  // factory/<id> by hand, so listings must close it out (terminal), never
  // flag it stalled, and the console needs the branch-shaped state visible.
  assert.ok(TERMINAL_STATES.includes("awaiting-merge"));
  const preview = {
    url: "https://expo.dev/accounts/a/projects/p/updates/g",
    qrPath: "/tmp/preview-qr.png",
    kind: "update",
    at: "2026-01-01T00:50:00.000Z",
    decision: { kind: "update", reasoning: "JS-only diff", evidence: ["src/App.tsx"], failSafe: false, at: "2026-01-01T00:40:00.000Z" },
  };
  const orchDir = makeOrchDir(t, {}, { state: "awaiting-merge", preview, deployHeld: true, updatedAt: "2026-01-01T01:00:00.000Z" });
  const detail = getRunDetail(orchDir, RUN_ID);
  assert.equal(detail.run.state, "awaiting-merge");
  assert.equal(detail.run.stalled, false);
  assert.deepEqual(detail.run.preview, preview);
  assert.equal(detail.run.deployHeld, true);
});

test("previewMode reflects preview-mode.json over the start flag, null when unset", (t) => {
  // Mid-run toggle file wins over run.json's start flag; absent both = rig default.
  const toggled = makeOrchDir(t, { "preview-mode.json": '{"mode":"off","at":"2026-01-01T00:30:00.000Z"}' }, { previewMode: true });
  assert.equal(getRunDetail(toggled, RUN_ID).previewMode, "off");
  const flagged = makeOrchDir(t, {}, { previewMode: true });
  assert.equal(getRunDetail(flagged, RUN_ID).previewMode, "on");
  const unset = makeOrchDir(t);
  assert.equal(getRunDetail(unset, RUN_ID).previewMode, null);
});

test("readRunArtifact serves only the QR whitelist", (t) => {
  const orchDir = makeOrchDir(t, {
    "qr.png": "deploy-qr-bytes",
    "preview-qr.png": "preview-qr-bytes",
    "secrets.png": "nope",
  });
  assert.equal(readRunArtifact(orchDir, RUN_ID, "qr.png").toString(), "deploy-qr-bytes");
  assert.equal(readRunArtifact(orchDir, RUN_ID, "preview-qr.png").toString(), "preview-qr-bytes");
  assert.equal(readRunArtifact(orchDir, RUN_ID, "secrets.png"), null);
  assert.equal(readRunArtifact(orchDir, RUN_ID, "../qr.png"), null);
  assert.equal(readRunArtifact(orchDir, "..", "qr.png"), null);
  assert.equal(readRunArtifact(orchDir, "feature-no-such-run", "qr.png"), null);
});

test("killed is a terminal state and a killed run never reads as stalled", (t) => {
  // A discussion don't-build ends the run in "killed": terminal (so listings
  // close it out) and a success — the console styles it like done, not failed.
  assert.ok(TERMINAL_STATES.includes("killed"));
  const orchDir = makeOrchDir(t, {}, { state: "killed", updatedAt: "2026-01-01T01:00:00.000Z" });
  const detail = getRunDetail(orchDir, RUN_ID);
  assert.equal(detail.run.state, "killed");
  assert.equal(detail.run.stalled, false);
});

test("run detail exposes retries, executor liveness, and the retry classification", (t) => {
  const retries = [{ at: "2026-01-01T00:30:00.000Z", tier: "resume", step: "implement" }];
  const orchDir = makeOrchDir(t, {}, {
    state: "failed",
    stepIndex: 2,
    retries,
    history: [{ state: "failed", detail: "agent step 'implement' exited 1", at: "2026-01-01T01:00:00.000Z" }],
  });
  const detail = getRunDetail(orchDir, RUN_ID);
  assert.deepEqual(detail.run.retries, retries);
  // executor.pid absent → probed (failed run) but definitively not alive.
  assert.equal(detail.run.executorAlive, false);
  // A resume was already tried at 'implement', so the next retry is triage.
  assert.equal(detail.retry.eligible, true);
  assert.equal(detail.retry.tier, "triage");
  // classifyRunRetry agrees (it backs the server's 409 pre-check)…
  const decision = classifyRunRetry(orchDir, RUN_ID, {});
  assert.deepEqual({ eligible: decision.eligible, tier: decision.tier }, { eligible: true, tier: "triage" });
  // …and reports unknown runs as missing.
  assert.equal(classifyRunRetry(orchDir, "feature-no-such-run", {}).missing, true);
});

test("terminal-success runs are not retryable and are not probed for liveness", (t) => {
  const orchDir = makeOrchDir(t); // state "done"
  const detail = getRunDetail(orchDir, RUN_ID);
  assert.deepEqual(detail.run.retries, []);
  assert.equal(detail.run.executorAlive, null);
  assert.equal(detail.retry.eligible, false);
  assert.match(detail.retry.reason, /done/);
});

/** Add a check-gate record + artifacts dir to a makeOrchDir run. */
function addCheckGate(orchDir, files) {
  const runDir = path.join(orchDir, "runs", RUN_ID);
  fs.writeFileSync(
    path.join(runDir, "check-gate.json"),
    JSON.stringify({
      cmd: "npm run golden:check",
      renderer: "skip-hero-golden",
      openedAt: "2026-01-01T00:30:00.000Z",
      status: "pending",
      summaryText: "Golden regression — 2 failing event(s)",
      mediaPath: "timeline.png",
    })
  );
  const gateDir = path.join(runDir, "check-gate");
  fs.mkdirSync(gateDir, { recursive: true });
  for (const [name, text] of Object.entries(files)) {
    fs.writeFileSync(path.join(gateDir, name), text);
  }
}

test("getRunDetail surfaces the check gate with whitelisted artifacts only", (t) => {
  const orchDir = makeOrchDir(t, {}, { state: "awaiting-approval", stepIndex: 3 });
  addCheckGate(orchDir, {
    "timeline.png": "png-bytes",
    "timeline.svg": "<svg/>",
    "golden-report.json": "{}",
    "IMG_0446.debug.mov": "mov-bytes",
    "IMG_0446.debug-preview.png": "png-bytes",
    // Outside the whitelist: wrong extension / bad leading char.
    "evil.sh": "nope",
    ".hidden.png": "nope",
  });
  const detail = getRunDetail(orchDir, RUN_ID);
  assert.equal(detail.checkGate.cmd, "npm run golden:check");
  assert.equal(detail.checkGate.status, "pending");
  assert.equal(detail.checkGate.mediaPath, "timeline.png");
  assert.deepEqual(detail.checkGate.artifacts, [
    "IMG_0446.debug-preview.png",
    "IMG_0446.debug.mov",
    "golden-report.json",
    "timeline.png",
    "timeline.svg",
  ]);
});

test("getRunDetail reports no check gate as null", (t) => {
  const orchDir = makeOrchDir(t);
  assert.equal(getRunDetail(orchDir, RUN_ID).checkGate, null);
});

test("resolveGateArtifact serves whitelisted files and nothing else", (t) => {
  const orchDir = makeOrchDir(t);
  addCheckGate(orchDir, { "timeline.png": "png-bytes", "IMG_0446.debug.mov": "mov-bytes" });
  const png = resolveGateArtifact(orchDir, RUN_ID, "timeline.png");
  assert.equal(png.type, "image/png");
  assert.equal(png.size, "png-bytes".length);
  assert.equal(png.download, false);
  assert.equal(fs.readFileSync(png.path, "utf8"), "png-bytes");
  // The debug video downloads as an attachment.
  const mov = resolveGateArtifact(orchDir, RUN_ID, "IMG_0446.debug.mov");
  assert.equal(mov.type, "video/quicktime");
  assert.equal(mov.download, true);
  // Invalid names/extensions never reach the filesystem.
  const invalid = (r) => {
    assert.equal(r.status, 400);
    assert.equal(r.path, undefined);
  };
  invalid(resolveGateArtifact(orchDir, RUN_ID, "../run.json"));
  invalid(resolveGateArtifact(orchDir, RUN_ID, "a/b.png"));
  invalid(resolveGateArtifact(orchDir, RUN_ID, "evil.sh"));
  invalid(resolveGateArtifact(orchDir, RUN_ID, "x..png"));
  invalid(resolveGateArtifact(orchDir, "..", "timeline.png"));
  // Valid shape but absent → 404.
  assert.equal(resolveGateArtifact(orchDir, RUN_ID, "missing.png").status, 404);
  assert.equal(resolveGateArtifact(orchDir, "feature-no-such-run", "timeline.png").status, 404);
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

test("run summaries surface pr, branch, and prWarning (defaults for legacy runs)", (t) => {
  const pr = { number: 12, url: "https://github.com/o/r/pull/12", createdAt: "2026-01-01T00:40:00.000Z" };
  const withPr = makeOrchDir(t, {}, { state: "awaiting-merge", branch: "factory/feature-root", pr });
  const d = getRunDetail(withPr, RUN_ID);
  assert.deepEqual(d.run.pr, pr);
  assert.equal(d.run.branch, "factory/feature-root");
  assert.equal(d.run.prWarning, null);
  // Legacy run.json without the new fields: branch defaults to factory/<id>.
  const legacy = makeOrchDir(t, {}, { prWarning: "origin remote is not GitHub — no PR; merge the branch locally" });
  const dl = getRunDetail(legacy, RUN_ID);
  assert.equal(dl.run.branch, `factory/${RUN_ID}`);
  assert.equal(dl.run.pr, null);
  assert.match(dl.run.prWarning, /not GitHub/);
});

test("closed is a terminal state and a closed run never reads as stalled", (t) => {
  assert.ok(TERMINAL_STATES.includes("closed"));
  const orchDir = makeOrchDir(t, {}, { state: "closed", updatedAt: "2026-01-01T01:00:00.000Z" });
  const detail = getRunDetail(orchDir, RUN_ID);
  assert.equal(detail.run.state, "closed");
  assert.equal(detail.run.stalled, false);
  assert.equal(detail.retry.eligible, false);
});

test("deriveChain orders root -> tip from parentRun back-links, from any member", () => {
  const nodes = [
    { id: "feature-root", parentRun: null, createdAt: "2026-01-01T00:00:00Z" },
    { id: "feature-mid", parentRun: "feature-root", createdAt: "2026-01-02T00:00:00Z" },
    { id: "bug-tip", parentRun: "feature-mid", createdAt: "2026-01-03T00:00:00Z" },
    { id: "feature-unrelated", parentRun: null, createdAt: "2026-01-04T00:00:00Z" },
  ];
  const ids = (from) => deriveChain(nodes, from).map((n) => n.id);
  assert.deepEqual(ids("feature-root"), ["feature-root", "feature-mid", "bug-tip"]);
  assert.deepEqual(ids("feature-mid"), ["feature-root", "feature-mid", "bug-tip"]);
  assert.deepEqual(ids("bug-tip"), ["feature-root", "feature-mid", "bug-tip"]);
  assert.deepEqual(ids("feature-unrelated"), ["feature-unrelated"]);
  assert.deepEqual(deriveChain(nodes, "feature-nope"), []);
});

test("deriveChain survives the single-childRun overwrite (branching) and cycles", () => {
  // Two children of one root (the overwrite bug's shape): both appear, ordered
  // by createdAt. A parentRun cycle must not hang the walk.
  const branching = [
    { id: "feature-root", parentRun: null, createdAt: "2026-01-01T00:00:00Z" },
    { id: "feature-b", parentRun: "feature-root", createdAt: "2026-01-03T00:00:00Z" },
    { id: "feature-a", parentRun: "feature-root", createdAt: "2026-01-02T00:00:00Z" },
  ];
  assert.deepEqual(deriveChain(branching, "feature-b").map((n) => n.id), ["feature-root", "feature-a", "feature-b"]);
  const cyclic = [
    { id: "feature-x", parentRun: "feature-y", createdAt: "2026-01-01T00:00:00Z" },
    { id: "feature-y", parentRun: "feature-x", createdAt: "2026-01-02T00:00:00Z" },
  ];
  const chain = deriveChain(cyclic, "feature-x").map((n) => n.id);
  assert.ok(chain.includes("feature-x"));
  // A dangling parentRun (run dir deleted) roots the chain at the survivor.
  const dangling = [{ id: "feature-kid", parentRun: "feature-gone", createdAt: "2026-01-01T00:00:00Z" }];
  assert.deepEqual(deriveChain(dangling, "feature-kid").map((n) => n.id), ["feature-kid"]);
});

test("getRunDetail derives the chain across run dirs with per-entry state/prompt/pr", (t) => {
  const orchDir = makeOrchDir(t, {}, {
    state: "awaiting-merge",
    pr: { number: 3, url: "https://github.com/o/r/pull/3", createdAt: "2026-01-01T00:30:00.000Z" },
  });
  // A follow-up child run dir alongside the root.
  const childDir = path.join(orchDir, "runs", "bug-followup");
  fs.mkdirSync(childDir, { recursive: true });
  fs.writeFileSync(
    path.join(childDir, "run.json"),
    JSON.stringify({
      id: "bug-followup",
      workflow: "bug-fix",
      rig: "no-such-rig",
      prompt: "tighten the copy\nsecond line ignored in chain",
      state: "running:implement",
      parentRun: RUN_ID,
      branch: `factory/${RUN_ID}`,
      createdAt: "2026-01-02T00:00:00.000Z",
      updatedAt: "2026-01-02T00:10:00.000Z",
      history: [],
    })
  );
  const detail = getRunDetail(orchDir, RUN_ID);
  assert.deepEqual(detail.chain.map((n) => n.id), [RUN_ID, "bug-followup"]);
  assert.equal(detail.chain[0].pr.number, 3);
  assert.equal(detail.chain[1].state, "running:implement");
  assert.equal(detail.chain[1].prompt, "tighten the copy");
  // The child's detail shows the same chain.
  assert.deepEqual(getRunDetail(orchDir, "bug-followup").chain.map((n) => n.id), [RUN_ID, "bug-followup"]);
});
