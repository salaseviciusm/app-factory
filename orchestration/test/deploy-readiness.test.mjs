/*
 * Deploy readiness gate integration test for bin/factory-run (offline: stubbed
 * `claude` and `gh` on PATH, notifications disabled, preflight skipped,
 * scratch rig + workflows in a throwaway sandbox orchestration dir).
 *
 * Pins the snapshot-and-subtract contract for setup-induced worktree churn:
 *  - a rig setup command that mutates a tracked file (lockfile-style churn)
 *    does not fail the deploy gate: the run passes it and parks awaiting-merge,
 *    with the tolerated path logged to engine.log (never a silent pass);
 *  - the post-setup snapshot is persisted on run.json (setupDirtyPaths);
 *  - dirt the agent left uncommitted fails the gate, and the failure summary
 *    names the offending path — not the setup-churned one;
 *  - a legacy run (no setupDirtyPaths field) keeps strict behavior: any dirty
 *    path fails the gate, named in the summary.
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "factory-deploy-readiness-test-"));
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
  git("config", "user.email", "deploy-readiness-test@example.invalid");
  git("config", "user.name", "Deploy Readiness Test");
  fs.writeFileSync(path.join(rig, "README.md"), "scratch rig\n");
  // The tracked file the rig's setup command churns — the npm-lockfile stand-in.
  fs.writeFileSync(path.join(rig, "generated.txt"), "pristine\n");
  git("add", "README.md", "generated.txt");
  git("commit", "-q", "-m", "init");

  fs.writeFileSync(
    path.join(orch, "rigs.json"),
    JSON.stringify(
      { rigs: { scratch: { path: rig, defaultBranch: "main", setup: ["echo churn >> generated.txt"] } } },
      null,
      2
    )
  );
  fs.writeFileSync(path.join(orch, "prompts", "stub.md"), "Stub task: {{PROMPT}}\n");
  fs.writeFileSync(
    path.join(orch, "workflows", "deploy-test.json"),
    JSON.stringify({
      name: "deploy-test",
      steps: [
        { id: "implement", type: "agent", prompt: "stub", timeoutMinutes: 5 },
        { id: "deploy", type: "deploy" },
      ],
    })
  );

  // Stub claude: commits its own work file (only that — the setup churn stays
  // uncommitted, exactly like a real implement agent that never touched it).
  // While <root>/stub-leave-dirty exists it also leaves an uncommitted file,
  // the "implementation never fully committed" case the gate must still catch.
  const stubDir = path.join(root, "stubbin");
  fs.mkdirSync(stubDir);
  fs.writeFileSync(
    path.join(stubDir, "claude"),
    `#!/bin/bash\nset -e\necho work >> agent-work.txt\ngit add agent-work.txt\ngit commit -q -m "agent work"\nif [ -f ${root}/stub-leave-dirty ]; then echo dirty > uncommitted.txt; fi\n`
  );
  fs.chmodSync(path.join(stubDir, "claude"), 0o755);
  // Stub gh: always unavailable, so the PR phase degrades offline instantly.
  fs.writeFileSync(path.join(stubDir, "gh"), "#!/bin/bash\nexit 1\n");
  fs.chmodSync(path.join(stubDir, "gh"), 0o755);

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

function engineLog(sb, id) {
  try {
    return fs.readFileSync(path.join(sb.orch, "runs", id, "engine.log"), "utf8");
  } catch {
    return "";
  }
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

function startRun(sb, t) {
  const start = engine(sb, ["start", "--rig", "scratch", "--workflow", "deploy-test", "--prompt", "exercise the deploy gate", "--auto"]);
  assert.equal(start.status, 0, `start failed: ${start.stderr}`);
  const id = start.stdout.trim().split("\n").pop();
  assert.ok(id, "start printed a run id");
  t.after(() => killGroup(execPid(sb, id)));
  return id;
}

test("setup-churned dirt is tolerated: the run passes the deploy gate, logged not silent", async (t) => {
  const sb = makeSandbox(t);
  const id = startRun(sb, t);

  // Green terminal for a deploy-step workflow under merge policy "review".
  await waitFor(() => readRun(sb, id).state === "awaiting-merge", "run to pass the deploy gate");

  const run = readRun(sb, id);
  // The post-setup snapshot is persisted on run.json with a content hash, so
  // resume-tier retries and follow-up runs make the same tolerance decision.
  assert.ok(Array.isArray(run.setupDirtyPaths), "setupDirtyPaths persisted on run.json");
  const snap = run.setupDirtyPaths.find((d) => d.path === "generated.txt");
  assert.ok(snap, "snapshot names the setup-churned path");
  assert.match(snap.hash || "", /^[0-9a-f]{40}$/, "snapshot records the post-setup blob hash");
  // Never a silent pass: engine.log names what setup churned and what the
  // gate tolerated, and why.
  const log = engineLog(sb, id);
  assert.match(log, /setup dirtied 1 tracked path\(s\): generated\.txt/);
  assert.match(log, /deploy gate tolerating dirty path generated\.txt: dirtied by setup, content unchanged since post-setup snapshot/);
});

test("agent-left dirt fails the gate naming the path; a snapshot-less legacy run stays strict", async (t) => {
  const sb = makeSandbox(t);
  fs.writeFileSync(path.join(sb.root, "stub-leave-dirty"), "");
  const id = startRun(sb, t);

  await waitFor(() => readRun(sb, id).state === "failed", "deploy gate to fail the run");
  let run = readRun(sb, id);
  const failure = run.history[run.history.length - 1].detail || "";
  // The summary names the agent's uncommitted path — and does not blame the
  // setup-churned file the gate tolerated.
  assert.match(failure, /uncommitted changes not attributable to setup/);
  assert.match(failure, /uncommitted\.txt/);
  assert.ok(!failure.includes("generated.txt"), "tolerated setup churn is not named in the failure");
  assert.match(engineLog(sb, id), /deploy gate tolerating dirty path generated\.txt/);

  // Legacy strictness: drop the snapshot field (as for runs created before the
  // fix) and clear the agent's dirt so only setup churn remains — the gate
  // must still fail, naming the remaining dirty path.
  fs.rmSync(path.join(sb.root, "stub-leave-dirty"));
  fs.rmSync(path.join(run.worktree, "uncommitted.txt"));
  delete run.setupDirtyPaths;
  fs.writeFileSync(path.join(sb.orch, "runs", id, "run.json"), JSON.stringify(run, null, 2));
  const before = run.history.length;

  const retry = engine(sb, ["retry", id]);
  assert.equal(retry.status, 0, `retry failed: ${retry.stderr}`);
  t.after(() => killGroup(execPid(sb, id)));
  await waitFor(() => {
    const r = readRun(sb, id);
    return r.state === "failed" && r.history.length > before;
  }, "legacy retry to fail the gate again");

  run = readRun(sb, id);
  const legacyFailure = run.history[run.history.length - 1].detail || "";
  assert.match(legacyFailure, /uncommitted changes not attributable to setup/);
  assert.match(legacyFailure, /generated\.txt/, "legacy strict failure names the dirty path");
});
