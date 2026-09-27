/*
 * Cleanup ancestry-guard integration test for bin/factory-run (offline: an
 * executable `gh` shim first on PATH injects GitHub's verdict, notifications
 * disabled, preflight skipped, scratch rig with NO origin remote in a
 * throwaway sandbox orchestration dir — so `git fetch origin` fails
 * best-effort and the origin/<default> probe fails, the conservative path).
 *
 * Pins D34: a merged PR licenses `git branch -D` on the run branch only when
 * the branch TIP is an ancestor of the PR head, the merge commit, or origin's
 * default branch. The branch NAME being engine-owned proves nothing — an
 * unrelated commit parked on factory/<id> (the pose-parity spike, lost four
 * times) must survive every cleanup pass:
 *  - diverged tip → `skip` with "branch tip diverged from merged PR", the
 *    branch still points at the unrelated commit, and engine.log records the
 *    `cleanup: kept` line with its sha;
 *  - tip == PR head (squash-merged, so no local ancestry to main) → `clean`,
 *    branch gone, engine.log records `cleanup: deleting branch ... -D` with
 *    the full tip sha before the delete;
 *  - --dry-run on the diverged fixture is `skip`, never `would-clean`;
 *  - gh failing → the pre-existing conservative "branch not merged into
 *    default branch" skip.
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
const RUN_ID = "feature-android-pose-parity-spike";
const BRANCH = `factory/${RUN_ID}`;

function makeSandbox(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "factory-cleanup-diverged-test-"));
  t.after(() => {
    try {
      fs.rmSync(root, { recursive: true, force: true });
    } catch {}
  });
  const orch = path.join(root, "orchestration");
  for (const d of ["bin", "web/lib", "workflows", "prompts", "worktrees", "runs"]) {
    fs.mkdirSync(path.join(orch, d), { recursive: true });
  }
  fs.copyFileSync(path.join(REAL_ORCH, "bin", "factory-run"), path.join(orch, "bin", "factory-run"));
  fs.chmodSync(path.join(orch, "bin", "factory-run"), 0o755);
  for (const lib of ["discussion.mjs", "plan-md.mjs", "retry.mjs", "watchdog.mjs", "github.mjs", "agent-spawn.mjs"]) {
    fs.copyFileSync(path.join(REAL_ORCH, "web", "lib", lib), path.join(orch, "web", "lib", lib));
  }

  // Scratch rig, deliberately without an `origin` remote.
  const rig = path.join(root, "rig");
  fs.mkdirSync(rig);
  execFileSync("git", ["init", "-q", "-b", "main", rig], { stdio: "pipe" });
  const git = (...args) => execFileSync("git", ["-C", rig, ...args], { stdio: "pipe" }).toString().trim();
  git("config", "user.email", "cleanup-test@example.invalid");
  git("config", "user.name", "Cleanup Test");
  const commitFile = (name, msg) => {
    fs.writeFileSync(path.join(rig, name), `${name}\n`);
    git("add", name);
    git("commit", "-q", "-m", msg);
    return git("rev-parse", "HEAD");
  };
  commitFile("README.md", "init");

  // B: the PR's head commit, on its own branch off main (never merged locally).
  git("checkout", "-q", "-b", "pr-head");
  const headB = commitFile("pr-work.txt", "PR #3 work");
  git("checkout", "-q", "main");
  // M: the squash commit on main — B is NOT an ancestor of main.
  const mergeM = commitFile("squash.txt", "PR #3 squash merge");
  assert.notEqual(git("merge-base", headB, "main"), headB, "fixture: B must not be an ancestor of main");

  fs.writeFileSync(
    path.join(orch, "rigs.json"),
    JSON.stringify({ rigs: { scratch: { path: rig, defaultBranch: "main", setup: [] } } }, null, 2)
  );

  // gh shim: prints <root>/gh-response.json when present, else fails like an
  // unauthenticated/offline gh. First on PATH so no real gh is ever reached.
  const stubDir = path.join(root, "stubbin");
  fs.mkdirSync(stubDir);
  const responseFile = path.join(root, "gh-response.json");
  fs.writeFileSync(
    path.join(stubDir, "gh"),
    `#!/bin/bash\nif [ -f ${JSON.stringify(responseFile)} ]; then cat ${JSON.stringify(responseFile)}; exit 0; fi\necho "gh: offline shim" >&2\nexit 1\n`
  );
  fs.chmodSync(path.join(stubDir, "gh"), 0o755);

  const env = {
    ...process.env,
    PATH: `${stubDir}:${process.env.PATH}`,
    FACTORY_RUN_NO_PREFLIGHT: "1",
    FACTORY_RUN_NO_NOTIFY: "1",
  };
  return { root, orch, rig, git, env, headB, mergeM, responseFile };
}

function ghSays(sb, { state = "MERGED", headRefOid = sb.headB, mergeCommit = sb.mergeM } = {}) {
  fs.writeFileSync(
    sb.responseFile,
    JSON.stringify({ state, mergedAt: "2026-08-12T10:00:00Z", mergeCommit: { oid: mergeCommit }, headRefOid })
  );
}

function ghUnavailable(sb) {
  fs.rmSync(sb.responseFile, { force: true });
}

/** X: unrelated single-copy work committed off main~1 — not an ancestor of
 *  B, M, or main. Returned as the sha the run branch will be parked on. */
function parkUnrelatedCommit(sb) {
  sb.git("checkout", "-q", "-b", "scratch-x", "main~1");
  fs.writeFileSync(path.join(sb.rig, "spike.txt"), "pose parity spike\n");
  sb.git("add", "spike.txt");
  sb.git("commit", "-q", "-m", "spike: unrelated single-copy work");
  const tipX = sb.git("rev-parse", "HEAD");
  sb.git("checkout", "-q", "main");
  sb.git("branch", "-D", "scratch-x");
  return tipX;
}

/** A `done` run whose PR #3 is recorded merged, with factory/<id> pointing at
 *  `tip` and no worktree on disk (the shape a long-finished run is in). */
function makeRun(sb, tip) {
  sb.git("branch", BRANCH, tip);
  const runDir = path.join(sb.orch, "runs", RUN_ID);
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(runDir, "run.json"),
    JSON.stringify({
      id: RUN_ID,
      workflow: "feature-dev",
      rig: "scratch",
      prompt: "pose parity spike",
      auto: false,
      parentRun: null,
      baseBranch: "main",
      branch: BRANCH,
      worktree: path.join(sb.orch, "worktrees", RUN_ID),
      state: "done",
      stepIndex: 3,
      pr: { number: 3, url: "https://github.com/o/r/pull/3", state: "merged" },
      createdAt: "2026-08-09T00:00:00.000Z",
      updatedAt: "2026-08-12T10:00:00.000Z",
      history: [],
    })
  );
  return runDir;
}

function cleanup(sb, args) {
  const res = spawnSync(process.execPath, [path.join(sb.orch, "bin", "factory-run"), "cleanup", RUN_ID, "--json", ...args], {
    encoding: "utf8",
    env: sb.env,
    timeout: 60_000,
  });
  assert.equal(res.status, 0, `cleanup failed: ${res.stderr}\n${res.stdout}`);
  // engine.log lines (via log()) also echo to stdout ahead of the JSON body.
  const jsonStart = res.stdout.indexOf("\n{");
  const body = JSON.parse(jsonStart >= 0 ? res.stdout.slice(jsonStart + 1) : res.stdout);
  assert.equal(body.results.length, 1);
  return body.results[0];
}

function branchTip(sb) {
  const res = spawnSync("git", ["-C", sb.rig, "rev-parse", "--verify", "--quiet", `refs/heads/${BRANCH}`], { encoding: "utf8" });
  return res.status === 0 ? res.stdout.trim() : null;
}

function engineLog(runDir) {
  try {
    return fs.readFileSync(path.join(runDir, "engine.log"), "utf8");
  } catch {
    return "";
  }
}

test("a merged PR does not license deleting an unrelated commit parked on the run branch", (t) => {
  const sb = makeSandbox(t);
  const tipX = parkUnrelatedCommit(sb);
  const runDir = makeRun(sb, tipX);
  ghSays(sb);

  const r = cleanup(sb, []);
  assert.equal(r.action, "skip");
  assert.match(r.reason, /branch tip diverged from merged PR/);
  assert.match(r.reason, new RegExp(`tip ${tipX.slice(0, 7)} is not an ancestor of PR head ${sb.headB.slice(0, 7)}`));
  assert.equal(branchTip(sb), tipX, "the unrelated commit is still on the branch");
  const logText = engineLog(runDir);
  assert.match(logText, new RegExp(`cleanup: kept ${BRANCH.replace(/\//g, "\\/")} at ${tipX}`));
  assert.doesNotMatch(logText, /cleanup: deleting branch/);
});

test("a squash-merged PR whose branch tip is the PR head is cleaned with a logged forced delete", (t) => {
  const sb = makeSandbox(t);
  const runDir = makeRun(sb, sb.headB);
  ghSays(sb);
  assert.notEqual(sb.git("merge-base", sb.headB, "main"), sb.headB, "fixture: no local ancestry to main");

  const r = cleanup(sb, []);
  assert.equal(r.action, "clean");
  assert.match(r.reason, /PR merged on GitHub \(squash\/rebase merge — forced local branch delete\)/);
  assert.equal(branchTip(sb), null, "branch deleted");
  const logText = engineLog(runDir);
  assert.match(logText, new RegExp(`cleanup: deleting branch ${BRANCH.replace(/\//g, "\\/")} at ${sb.headB} with git branch -D`));
  assert.doesNotMatch(logText, /cleanup: kept/);
});

test("--dry-run on the diverged fixture is skip, never would-clean, and touches nothing", (t) => {
  const sb = makeSandbox(t);
  const tipX = parkUnrelatedCommit(sb);
  const runDir = makeRun(sb, tipX);
  ghSays(sb);

  const r = cleanup(sb, ["--dry-run"]);
  assert.equal(r.action, "skip");
  assert.match(r.reason, /branch tip diverged from merged PR/);
  assert.equal(branchTip(sb), tipX);
  assert.match(engineLog(runDir), /cleanup: kept/);
  assert.doesNotMatch(engineLog(runDir), /cleanup: deleting branch/);
});

test("gh unavailable falls back to the conservative unmerged skip", (t) => {
  const sb = makeSandbox(t);
  const tipX = parkUnrelatedCommit(sb);
  const runDir = makeRun(sb, tipX);
  ghUnavailable(sb);

  const r = cleanup(sb, []);
  assert.equal(r.action, "skip");
  assert.equal(r.reason, "branch not merged into default branch");
  assert.equal(branchTip(sb), tipX);
  assert.doesNotMatch(engineLog(runDir), /cleanup: (kept|deleting branch)/);
});
