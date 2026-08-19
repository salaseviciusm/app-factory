/*
 * Setup revalidation integration test for bin/factory-run (offline: stubbed
 * `claude` and `gh` on PATH, notifications disabled, preflight skipped,
 * scratch rig + workflows in a throwaway sandbox orchestration dir).
 *
 * Pins the setupOk contract — provisioning completion is explicit run state,
 * never inferred from the worktree directory existing:
 *  - a rig.setup command that fails parks the run with a summary naming the
 *    failing command's position (`command N of M`) and the exact unrun tail,
 *    mirrored into setup.log; setupOk is never written on failure;
 *  - resuming that run re-runs every setup command, in order, before any
 *    workflow step — without re-creating the worktree — then records
 *    setupOk: true and a fresh setupDirtyPaths snapshot on run.json;
 *  - resuming a run whose setupOk is true executes zero setup commands
 *    (fast-resume preserved).
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

function makeSandbox(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "factory-setup-revalidation-test-"));
  t.after(() => {
    try {
      fs.rmSync(root, { recursive: true, force: true });
    } catch {}
  });
  const orch = path.join(root, "orchestration");
  for (const d of ["bin", "web/lib", "workflows", "prompts"]) fs.mkdirSync(path.join(orch, d), { recursive: true });
  fs.copyFileSync(path.join(REAL_ORCH, "bin", "factory-run"), path.join(orch, "bin", "factory-run"));
  fs.chmodSync(path.join(orch, "bin", "factory-run"), 0o755);
  for (const lib of ["discussion.mjs", "plan-md.mjs", "retry.mjs", "watchdog.mjs", "github.mjs"]) {
    fs.copyFileSync(path.join(REAL_ORCH, "web", "lib", lib), path.join(orch, "web", "lib", lib));
  }

  const rig = path.join(root, "rig");
  fs.mkdirSync(rig);
  execFileSync("git", ["init", "-q", "-b", "main", rig], { stdio: "pipe" });
  const git = (...args) => execFileSync("git", ["-C", rig, ...args], { stdio: "pipe" });
  git("config", "user.email", "setup-revalidation-test@example.invalid");
  git("config", "user.name", "Setup Revalidation Test");
  fs.writeFileSync(path.join(rig, "README.md"), "scratch rig\n");
  git("add", "README.md");
  git("commit", "-q", "-m", "init");

  // Synthetic 3-command setup. Each command appends its name to a ledger
  // outside the worktree (so the tree stays clean); command 2 fails while the
  // <root>/fail-setup-2 flag file exists — the mid-setup crash under test.
  const ranLog = path.join(root, "setup-ran.log");
  const setupCmds = [
    `echo one >> ${ranLog}`,
    `if [ -f ${root}/fail-setup-2 ]; then echo boom >&2; exit 1; fi; echo two >> ${ranLog}`,
    `echo three >> ${ranLog}`,
  ];
  fs.writeFileSync(
    path.join(orch, "rigs.json"),
    JSON.stringify({ rigs: { scratch: { path: rig, defaultBranch: "main", setup: setupCmds } } }, null, 2)
  );
  fs.writeFileSync(path.join(orch, "prompts", "stub.md"), "Stub task: {{PROMPT}}\n");
  fs.writeFileSync(
    path.join(orch, "workflows", "setup-test.json"),
    JSON.stringify({
      name: "setup-test",
      steps: [
        { id: "implement", type: "agent", prompt: "stub", timeoutMinutes: 5 },
        { id: "deploy", type: "deploy" },
      ],
    })
  );

  // Stub claude: commits its own work file so the deploy gate's ahead-count
  // check passes. Stub gh: always unavailable, so the PR phase degrades
  // offline instantly and the run parks awaiting-merge (worktree kept).
  const stubDir = path.join(root, "stubbin");
  fs.mkdirSync(stubDir);
  fs.writeFileSync(
    path.join(stubDir, "claude"),
    `#!/bin/bash\nset -e\necho work >> agent-work.txt\ngit add agent-work.txt\ngit commit -q -m "agent work"\n`
  );
  fs.chmodSync(path.join(stubDir, "claude"), 0o755);
  fs.writeFileSync(path.join(stubDir, "gh"), "#!/bin/bash\nexit 1\n");
  fs.chmodSync(path.join(stubDir, "gh"), 0o755);

  const env = {
    ...process.env,
    PATH: `${stubDir}:${process.env.PATH}`,
    FACTORY_RUN_NO_PREFLIGHT: "1",
    FACTORY_RUN_NO_NOTIFY: "1",
  };
  return { root, orch, env, setupCmds, ranLog };
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

function engineLog(sb, id) {
  try {
    return fs.readFileSync(path.join(sb.orch, "runs", id, "engine.log"), "utf8");
  } catch {
    return "";
  }
}

function ranLines(sb) {
  try {
    return fs.readFileSync(sb.ranLog, "utf8").split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function countMatches(text, re) {
  return (text.match(re) || []).length;
}

function execPid(sb, id) {
  try {
    return parseInt(fs.readFileSync(path.join(sb.orch, "runs", id, "executor.pid"), "utf8").trim(), 10) || null;
  } catch {
    return null;
  }
}

function killGroup(pid) {
  if (!Number.isInteger(pid) || pid < 2) return;
  try {
    process.kill(-pid, "SIGKILL");
  } catch {}
}

async function waitFor(fn, what, timeoutMs = 60_000) {
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

// `factory-run resume` refuses while the crashed executor's pid still looks
// alive (a brief window after the failed state lands) — retry until it takes.
async function resume(sb, id, t) {
  const res = await waitFor(() => {
    const r = engine(sb, ["resume", id]);
    return r.status === 0 ? r : null;
  }, `resume of ${id} to be accepted`);
  t.after(() => killGroup(execPid(sb, id)));
  return res;
}

test("mid-setup crash re-provisions on resume, then fast-resumes once setupOk is recorded", async (t) => {
  const sb = makeSandbox(t);
  fs.writeFileSync(path.join(sb.root, "fail-setup-2"), "");

  const start = engine(sb, ["start", "--rig", "scratch", "--workflow", "setup-test", "--prompt", "exercise setup revalidation", "--auto"]);
  assert.equal(start.status, 0, `start failed: ${start.stderr}`);
  const id = start.stdout.trim().split("\n").pop();
  assert.ok(id, "start printed a run id");
  t.after(() => killGroup(execPid(sb, id)));

  // (a) setup fails at command 2: the failure summary names the position and
  // the exact unrun tail, lands in setup.log too, and setupOk is never written.
  await waitFor(() => readRun(sb, id).state === "failed", "the mid-setup crash to park the run");
  let run = readRun(sb, id);
  const failure = run.history[run.history.length - 1].detail || "";
  assert.match(failure, /setup failed at command 2 of 3: /);
  assert.ok(failure.includes(sb.setupCmds[1]), "summary names the failing command");
  assert.match(failure, /1 command\(s\) never ran: /);
  assert.ok(failure.includes(sb.setupCmds[2]), "summary enumerates the unrun command");
  assert.match(failure, /\(see setup\.log\)/);
  assert.notEqual(run.setupOk, true, "no failure path writes setupOk");
  const setupLog = fs.readFileSync(path.join(sb.orch, "runs", id, "setup.log"), "utf8");
  assert.ok(setupLog.includes(failure), "the same summary line is appended to setup.log");
  assert.deepEqual(ranLines(sb), ["one"], "commands after the failure never ran");

  // (b) resume: all 3 setup commands re-run in order before any workflow step,
  // the worktree is not re-created, and setupOk + a fresh snapshot land on
  // run.json once the run goes green.
  fs.rmSync(path.join(sb.root, "fail-setup-2"));
  await resume(sb, id, t);
  await waitFor(() => readRun(sb, id).state === "awaiting-merge", "the resumed run to finish green");
  run = readRun(sb, id);
  assert.equal(run.setupOk, true, "setupOk recorded after all setup commands exited 0");
  assert.ok(Array.isArray(run.setupDirtyPaths), "post-setup snapshot re-taken on the resume");
  assert.deepEqual(ranLines(sb), ["one", "one", "two", "three"], "resume re-ran every setup command in order");
  let log = engineLog(sb, id);
  assert.equal(countMatches(log, /worktree created at /g), 1, "resume did not re-run git worktree add");
  assert.equal(countMatches(log, /] setup: /g), 5, "2 setup commands on the first attempt, 3 on the resume");
  assert.ok(
    log.indexOf("step 'implement'") > log.lastIndexOf("] setup: "),
    "re-provisioning finished before the first workflow step"
  );

  // (c) resume again: setupOk short-circuits provisioning entirely. The run
  // parked awaiting-merge (which refuses resume), so flip it to failed on disk
  // — the fast-resume contract is what's under test, not the terminal state.
  run = readRun(sb, id);
  run.state = "failed";
  fs.writeFileSync(path.join(sb.orch, "runs", id, "run.json"), JSON.stringify(run, null, 2));
  await resume(sb, id, t);
  await waitFor(() => readRun(sb, id).state === "awaiting-merge", "the second resume to finish green");
  assert.deepEqual(ranLines(sb), ["one", "one", "two", "three"], "no setup command re-ran");
  log = engineLog(sb, id);
  assert.equal(countMatches(log, /] setup: /g), 5, "the second resume executed zero setup commands");
  assert.equal(countMatches(log, /worktree created at /g), 1, "the worktree was never re-created");
});
