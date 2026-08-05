/*
 * Start-then-cancel integration test for bin/factory-run (offline: stubbed
 * `claude` on PATH, notifications disabled, preflight skipped, scratch rig +
 * workflows in a throwaway sandbox orchestration dir).
 *
 * Pins the cancel contract:
 *  - cancel terminates the executor's whole process group (the stubbed agent
 *    and its grandchild included) within the grace window;
 *  - run.json becomes `cancelled` and STAYS cancelled after the interrupted
 *    step would have returned (no state clobber from the dead executor);
 *  - history and telemetry name the interrupted step with a non-ok row;
 *  - reject at a gate keeps today's behavior: state `rejected`, executor gone;
 *  - cancel while parked at a gate ends `cancelled`, never `rejected`.
 *
 * The engine under test is copied into the sandbox because factory-run
 * resolves runs/, workflows/, rigs.json relative to its own location.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REAL_ORCH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STUB_SLEEP_S = 10;

function makeSandbox(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "factory-cancel-test-"));
  t.after(() => {
    try {
      fs.rmSync(root, { recursive: true, force: true });
    } catch {}
  });
  const orch = path.join(root, "orchestration");
  for (const d of ["bin", "web/lib", "workflows", "prompts"]) fs.mkdirSync(path.join(orch, d), { recursive: true });
  fs.copyFileSync(path.join(REAL_ORCH, "bin", "factory-run"), path.join(orch, "bin", "factory-run"));
  fs.chmodSync(path.join(orch, "bin", "factory-run"), 0o755);
  fs.copyFileSync(path.join(REAL_ORCH, "web", "lib", "discussion.mjs"), path.join(orch, "web", "lib", "discussion.mjs"));

  const rig = path.join(root, "rig");
  fs.mkdirSync(rig);
  execFileSync("git", ["init", "-q", "-b", "main", rig], { stdio: "pipe" });
  const git = (...args) => execFileSync("git", ["-C", rig, ...args], { stdio: "pipe" });
  git("config", "user.email", "cancel-test@example.invalid");
  git("config", "user.name", "Cancel Test");
  fs.writeFileSync(path.join(rig, "README.md"), "scratch rig\n");
  git("add", "README.md");
  git("commit", "-q", "-m", "init");

  fs.writeFileSync(
    path.join(orch, "rigs.json"),
    JSON.stringify({ rigs: { scratch: { path: rig, defaultBranch: "main", setup: [] } } }, null, 2)
  );
  fs.writeFileSync(path.join(orch, "prompts", "stub.md"), "Stub task: {{PROMPT}}\n");
  fs.writeFileSync(
    path.join(orch, "workflows", "cancel-test.json"),
    JSON.stringify({
      name: "cancel-test",
      steps: [
        { id: "implement", type: "agent", prompt: "stub", timeoutMinutes: 5 },
        { id: "after", type: "manual", note: "must never run after cancel" },
      ],
    })
  );
  fs.writeFileSync(
    path.join(orch, "workflows", "gate-test.json"),
    JSON.stringify({
      name: "gate-test",
      steps: [
        { id: "gate", type: "gate" },
        { id: "after", type: "manual", note: "must never run after reject/cancel" },
      ],
    })
  );

  // Stub claude: long-running, with a background grandchild so the group kill
  // (not just the direct-child kill) is what the assertions exercise.
  const stubDir = path.join(root, "stubbin");
  fs.mkdirSync(stubDir);
  fs.writeFileSync(path.join(stubDir, "claude"), `#!/bin/bash\nsleep ${STUB_SLEEP_S} &\nsleep ${STUB_SLEEP_S}\nwait\n`);
  fs.chmodSync(path.join(stubDir, "claude"), 0o755);

  const env = {
    ...process.env,
    PATH: `${stubDir}:${process.env.PATH}`,
    FACTORY_RUN_NO_PREFLIGHT: "1",
    FACTORY_RUN_NO_NOTIFY: "1",
  };
  return { root, orch, env };
}

function engine(sb, args) {
  return spawnSync(process.execPath, [path.join(sb.orch, "bin", "factory-run"), ...args], {
    encoding: "utf8",
    env: sb.env,
    timeout: 60_000,
  });
}

function readRun(sb, id) {
  return JSON.parse(fs.readFileSync(path.join(sb.orch, "runs", id, "run.json"), "utf8"));
}

function groupAlive(pid) {
  try {
    process.kill(-pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitFor(fn, what, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    let v;
    try {
      v = fn();
    } catch {}
    if (v) return v;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await new Promise((r) => setTimeout(r, 250));
  }
}

function startRun(sb, t, workflow, extraArgs = []) {
  const start = engine(sb, ["start", "--rig", "scratch", "--workflow", workflow, "--prompt", "exercise cancel paths", ...extraArgs]);
  assert.equal(start.status, 0, `start failed: ${start.stderr}`);
  const id = start.stdout.trim().split("\n").pop();
  assert.ok(id, "start printed a run id");
  // Whatever happens, never leak the detached executor group past the test.
  t.after(() => {
    try {
      const pid = readRun(sb, id).executorPid;
      if (pid) process.kill(-pid, "SIGKILL");
    } catch {}
  });
  return id;
}

test("cancel mid agent step kills the whole process group and the state sticks", async (t) => {
  const sb = makeSandbox(t);
  const id = startRun(sb, t, "cancel-test", ["--auto"]);

  await waitFor(() => readRun(sb, id).state === "running:implement", "agent step to start");
  const stepStarted = Date.now();
  const { executorPid } = readRun(sb, id);
  assert.ok(Number.isInteger(executorPid), "executor pid recorded in run.json");
  t.after(() => {
    try {
      process.kill(-executorPid, "SIGKILL");
    } catch {}
  });

  const cancel = engine(sb, ["cancel", id]);
  assert.equal(cancel.status, 0, `cancel failed: ${cancel.stderr}`);

  // Acceptance 1: nothing in the executor's process group survives the grace
  // window (stub grandchild included — a group member, not a direct child).
  await waitFor(() => !groupAlive(executorPid), "executor process group to die", 12_000);

  let run = readRun(sb, id);
  assert.equal(run.state, "cancelled");
  assert.equal(run.executorPid, undefined, "cancel clears the recorded pid");
  // Acceptance 3: history names the interrupted step…
  assert.match(run.history[run.history.length - 1].detail || "", /implement/);
  // …and telemetry holds a non-ok row for it.
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(path.join(sb.orch, "telemetry.db"));
  const row = db.prepare("SELECT status, summary FROM steps WHERE run_id = ? AND step_id = 'implement'").get(id);
  db.close();
  assert.ok(row, "telemetry row exists for the interrupted step");
  assert.notEqual(row.status, "ok");
  assert.match(row.summary || "", /cancel/);

  // Acceptance 2: no clobber — wait until the stub's sleep would have ended;
  // pre-fix, the surviving executor finished the step and marched to 'done'.
  const remaining = stepStarted + (STUB_SLEEP_S + 2) * 1000 - Date.now();
  if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
  run = readRun(sb, id);
  assert.equal(run.state, "cancelled", "state must remain cancelled after the interrupted step would have returned");
  assert.ok(!run.history.some((h) => h.state === "done"), "workflow must not continue past a cancel");
});

test("a kept cancelled run resumes at the interrupted step and completes", async (t) => {
  const sb = makeSandbox(t);
  const id = startRun(sb, t, "cancel-test", ["--auto"]);

  await waitFor(() => readRun(sb, id).state === "running:implement", "agent step to start");
  const { executorPid } = readRun(sb, id);
  assert.equal(engine(sb, ["cancel", id]).status, 0);
  await waitFor(() => !groupAlive(executorPid), "executor process group to die", 12_000);
  assert.equal(readRun(sb, id).state, "cancelled");
  assert.equal(readRun(sb, id).stepIndex, 0, "cancel must not advance past the interrupted step");

  const resume = engine(sb, ["resume", id]);
  assert.equal(resume.status, 0, `resume failed: ${resume.stderr}`);
  assert.match(resume.stdout, /implement/, "resume restarts at the interrupted step");
  t.after(() => {
    try {
      process.kill(-readRun(sb, id).executorPid, "SIGKILL");
    } catch {}
  });
  // The stub agent now runs to completion; the workflow finishes normally.
  await waitFor(() => readRun(sb, id).state === "done", "resumed run to complete", 40_000);
  assert.ok(
    readRun(sb, id).history.some((h) => h.state === "running:implement"),
    "the interrupted step re-ran after resume"
  );
});

test("reject at a gate ends the run rejected with no surviving processes", async (t) => {
  const sb = makeSandbox(t);
  const id = startRun(sb, t, "gate-test");

  await waitFor(() => readRun(sb, id).state === "awaiting-approval", "plan gate");
  const { executorPid } = readRun(sb, id);
  assert.ok(Number.isInteger(executorPid), "executor pid recorded while waiting at the gate");

  const rej = engine(sb, ["reject", id, "not today"]);
  assert.equal(rej.status, 0, `reject failed: ${rej.stderr}`);

  // The gate poll loop notices the decision within ~15s and exits itself.
  await waitFor(() => readRun(sb, id).state === "rejected", "rejected state");
  await waitFor(() => !groupAlive(executorPid), "executor to exit after reject");
  const run = readRun(sb, id);
  assert.equal(run.executorPid, undefined, "executor clears its pid on the way out");
  assert.ok(!run.history.some((h) => h.state === "done"), "workflow must not continue past a reject");
});

test("cancel while parked at a gate ends the run cancelled, not rejected", async (t) => {
  const sb = makeSandbox(t);
  const id = startRun(sb, t, "gate-test");

  await waitFor(() => readRun(sb, id).state === "awaiting-approval", "plan gate");
  const { executorPid } = readRun(sb, id);

  const cancel = engine(sb, ["cancel", id]);
  assert.equal(cancel.status, 0, `cancel failed: ${cancel.stderr}`);
  await waitFor(() => !groupAlive(executorPid), "executor process group to die", 12_000);

  assert.equal(readRun(sb, id).state, "cancelled");
  // Pre-fix, the gate loop's next poll mapped the cancel to 'rejected' —
  // outlive one full poll interval to prove the state sticks.
  await new Promise((r) => setTimeout(r, 16_000));
  assert.equal(readRun(sb, id).state, "cancelled", "cancel at a gate must never be remapped to rejected");
});
