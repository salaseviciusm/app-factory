/*
 * Follow-up chain integration test for bin/factory-run (offline: notifications
 * disabled, preflight skipped, scratch rig + workflows in a throwaway sandbox
 * orchestration dir; the sandbox feature-dev workflow is a single manual step
 * so no claude CLI is needed).
 *
 * Pins the follow-up contract:
 *  - `factory-run followup` on a green terminal parent creates a child run
 *    with parentRun set that inherits the parent's branch and worktree — no
 *    factory/<child-id> branch is ever minted;
 *  - a closed parent (worktree torn down, branch kept) is restartable: the
 *    child's executor recreates the worktree FROM the existing branch;
 *  - the shared chain branch survives the child's terminal cleanup while the
 *    parent's worktree still has it checked out.
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
const PARENT_ID = "feature-parent";
const PARENT_BRANCH = `factory/${PARENT_ID}`;

function makeSandbox(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "factory-followup-test-"));
  t.after(() => {
    try {
      fs.rmSync(root, { recursive: true, force: true });
    } catch {}
  });
  const orch = path.join(root, "orchestration");
  for (const d of ["bin", "web/lib", "workflows", "prompts", "worktrees"]) {
    fs.mkdirSync(path.join(orch, d), { recursive: true });
  }
  fs.copyFileSync(path.join(REAL_ORCH, "bin", "factory-run"), path.join(orch, "bin", "factory-run"));
  fs.chmodSync(path.join(orch, "bin", "factory-run"), 0o755);
  for (const lib of ["discussion.mjs", "plan-md.mjs", "retry.mjs", "watchdog.mjs", "github.mjs"]) {
    fs.copyFileSync(path.join(REAL_ORCH, "web", "lib", lib), path.join(orch, "web", "lib", lib));
  }

  const rig = path.join(root, "rig");
  fs.mkdirSync(rig);
  execFileSync("git", ["init", "-q", "-b", "main", rig], { stdio: "pipe" });
  const git = (...args) => execFileSync("git", ["-C", rig, ...args], { stdio: "pipe" }).toString();
  git("config", "user.email", "followup-test@example.invalid");
  git("config", "user.name", "Followup Test");
  fs.writeFileSync(path.join(rig, "README.md"), "scratch rig\n");
  git("add", "README.md");
  git("commit", "-q", "-m", "init");

  fs.writeFileSync(
    path.join(orch, "rigs.json"),
    JSON.stringify({ rigs: { scratch: { path: rig, defaultBranch: "main", setup: [] } } }, null, 2)
  );
  // Chainable name (followup whitelists feature-dev|bug-fix); a single manual
  // step needs no claude and no deploy, so a green child parks in `done`.
  fs.writeFileSync(
    path.join(orch, "workflows", "feature-dev.json"),
    JSON.stringify({ name: "feature-dev", steps: [{ id: "noop", type: "manual", note: "noop" }] })
  );

  const env = { ...process.env, FACTORY_RUN_NO_PREFLIGHT: "1", FACTORY_RUN_NO_NOTIFY: "1" };
  return { root, orch, rig, git, env };
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

function execPid(sb, id) {
  try {
    return parseInt(fs.readFileSync(path.join(sb.orch, "runs", id, "executor.pid"), "utf8").trim(), 10) || null;
  } catch {
    return null;
  }
}

// kill(-pid) with a null pid would coerce to kill(0) — the caller's OWN
// process group, i.e. the test runner. Every cleanup kill goes through here.
function killGroup(pid) {
  if (!Number.isInteger(pid) || pid < 2) return;
  try {
    process.kill(-pid, "SIGKILL");
  } catch {}
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

/** Fabricate a green terminal parent whose branch (and, unless torn down,
 *  worktree) exists — the shape a review-policy run parks in. */
function makeParent(sb, { state = "awaiting-merge", tearDownWorktree = false } = {}) {
  const worktree = path.join(sb.orch, "worktrees", PARENT_ID);
  sb.git("worktree", "add", worktree, "-b", PARENT_BRANCH, "main");
  if (tearDownWorktree) {
    sb.git("worktree", "remove", "--force", worktree);
  }
  const runDir = path.join(sb.orch, "runs", PARENT_ID);
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(runDir, "run.json"),
    JSON.stringify({
      id: PARENT_ID,
      workflow: "feature-dev",
      rig: "scratch",
      prompt: "parent work",
      auto: false,
      parentRun: null,
      baseBranch: "main",
      branch: PARENT_BRANCH,
      worktree,
      state,
      stepIndex: 1,
      createdAt: "2026-08-09T00:00:00.000Z",
      updatedAt: "2026-08-09T00:00:00.000Z",
      history: [],
    })
  );
  return { worktree };
}

function followup(sb, t, prompt) {
  const res = engine(sb, ["followup", PARENT_ID, "--workflow", "feature-dev", "--prompt", prompt]);
  assert.equal(res.status, 0, `followup failed: ${res.stderr}`);
  const childId = res.stdout.trim().split("\n").pop();
  assert.ok(childId, "followup printed the child run id");
  t.after(() => killGroup(execPid(sb, childId)));
  return childId;
}

test("followup child inherits the parent's branch and worktree; no new branch is minted", async (t) => {
  const sb = makeSandbox(t);
  const { worktree } = makeParent(sb);

  const childId = followup(sb, t, "continue the parent work");
  const child = readRun(sb, childId);
  assert.equal(child.parentRun, PARENT_ID);
  assert.equal(child.branch, PARENT_BRANCH);
  assert.equal(child.worktree, worktree);
  assert.equal(child.baseBranch, "main");
  assert.equal(readRun(sb, PARENT_ID).childRun, childId, "parent records the spawned child");

  await waitFor(() => readRun(sb, childId).state === "done", "child run to finish");
  // The child worked on the chain branch: factory/<child-id> must not exist.
  assert.equal(sb.git("branch", "--list", `factory/${childId}`).trim(), "");
  // The shared chain branch survives the child's terminal cleanup (it is
  // still checked out in the parent's worktree).
  assert.notEqual(sb.git("branch", "--list", PARENT_BRANCH).trim(), "");
  assert.ok(fs.existsSync(worktree), "shared worktree still present");
});

test("followup on a closed parent recreates the worktree from the kept branch", async (t) => {
  const sb = makeSandbox(t);
  const { worktree } = makeParent(sb, { state: "closed", tearDownWorktree: true });
  assert.ok(!fs.existsSync(worktree), "closed parent's worktree is gone");

  const childId = followup(sb, t, "restart the parked chain");
  await waitFor(() => readRun(sb, childId).state === "done", "child run to finish");

  assert.ok(fs.existsSync(worktree), "executor recreated the worktree");
  const head = execFileSync("git", ["-C", worktree, "branch", "--show-current"], { encoding: "utf8" }).trim();
  assert.equal(head, PARENT_BRANCH, "worktree checked out the kept chain branch, not a new one");
  assert.equal(sb.git("branch", "--list", `factory/${childId}`).trim(), "");
});

test("followup refuses non-terminal and non-green parents without side effects", (t) => {
  const sb = makeSandbox(t);
  makeParent(sb, { state: "failed" });
  const res = engine(sb, ["followup", PARENT_ID, "--workflow", "feature-dev", "--prompt", "nope"]);
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /green terminal runs only/);
  // Nothing was created.
  const runs = fs.readdirSync(path.join(sb.orch, "runs"));
  assert.deepEqual(runs, [PARENT_ID]);
});
