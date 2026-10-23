/*
 * Rebase-train integration test for bin/factory-run (offline: notifications
 * disabled, preflight skipped, a fake `gh` on PATH that answers `pr view` from
 * a fixture file and logs every invocation, and a local bare repo as origin).
 *
 * Pins the D36 contract end to end:
 *  - clean run: detached checkout of gh's headRefOid, rebase onto
 *    origin/main, setup only before checks, lease force-push of the PR head,
 *    no refs/heads/* in the rig touched, Not merged;
 *  - conflict: aborted, worktree left clean at the original head, founder
 *    item summary, no setup, no push, no agent; cleanup is branchless;
 *  - lease failure: the remote head moves mid-run, the push fails once with
 *    no re-fetch and no retry;
 *  - no-op and dry run: done without pushing;
 *  - refusals and start usage errors leave no worktree / no run dir.
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
import { DatabaseSync } from "node:sqlite";

const REAL_ORCH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HEAD_REF = "codex/pace-chart";
const TERMINAL = ["done", "failed", "rejected", "cancelled", "killed", "awaiting-merge", "closed"];

function makeSandbox(t, { checks = [], tests = [] } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "factory-rebase-train-test-"));
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
  for (const lib of ["discussion.mjs", "plan-md.mjs", "retry.mjs", "watchdog.mjs", "github.mjs", "agent-spawn.mjs", "rebase.mjs"]) {
    fs.copyFileSync(path.join(REAL_ORCH, "web", "lib", lib), path.join(orch, "web", "lib", lib));
  }
  fs.copyFileSync(path.join(REAL_ORCH, "workflows", "rebase-train.json"), path.join(orch, "workflows", "rebase-train.json"));
  fs.writeFileSync(
    path.join(orch, "workflows", "feature-dev.json"),
    JSON.stringify({ name: "feature-dev", steps: [{ id: "noop", type: "manual", note: "noop" }] })
  );

  const g = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { stdio: "pipe" }).toString().trim();
  const ident = (cwd) => {
    g(cwd, "config", "user.email", "rebase-test@example.invalid");
    g(cwd, "config", "user.name", "Rebase Test");
  };
  const origin = path.join(root, "origin.git");
  execFileSync("git", ["init", "-q", "--bare", "-b", "main", origin], { stdio: "pipe" });
  const seed = path.join(root, "seed");
  execFileSync("git", ["clone", "-q", origin, seed], { stdio: "pipe" });
  ident(seed);
  g(seed, "checkout", "-q", "-b", "main");
  fs.writeFileSync(path.join(seed, "a.txt"), "line one\n");
  g(seed, "add", "a.txt");
  g(seed, "commit", "-q", "-m", "init");
  g(seed, "push", "-q", "origin", "main");

  // A fake gh: `pr view` answers from the fixture, everything else fails;
  // every invocation is logged so tests can prove what was (not) called.
  const fakeBin = path.join(root, "fakebin");
  fs.mkdirSync(fakeBin);
  const ghLog = path.join(root, "gh.log");
  const prJson = path.join(root, "pr.json");
  fs.writeFileSync(
    path.join(fakeBin, "gh"),
    `#!/bin/sh\necho "$*" >> "${ghLog}"\nif [ "$1" = "pr" ] && [ "$2" = "view" ]; then cat "${prJson}"; exit 0; fi\nexit 1\n`
  );
  fs.chmodSync(path.join(fakeBin, "gh"), 0o755);

  const env = {
    ...process.env,
    PATH: `${fakeBin}:${process.env.PATH}`,
    FACTORY_RUN_NO_PREFLIGHT: "1",
    FACTORY_RUN_NO_NOTIFY: "1",
  };
  const sb = { root, orch, origin, seed, g, ident, ghLog, prJson, env, rig: path.join(root, "rig") };
  sb.writeRigs = (over = {}) =>
    fs.writeFileSync(
      path.join(orch, "rigs.json"),
      JSON.stringify(
        { rigs: { scratch: { path: sb.rig, defaultBranch: "main", setup: ["echo setup-ran"], checks, tests, ...over } } },
        null,
        2
      )
    );
  sb.writeRigs();
  return sb;
}

/** Build the PR: a head branch off main, then (optionally) advance main.
 *  `conflict` makes both sides edit a.txt's only line. Clones the rig last
 *  and writes the gh fixture for the PR head as pushed. */
function preparePr(sb, { conflict = false, advanceMain = true, pr = {} } = {}) {
  const { g, seed } = sb;
  g(seed, "checkout", "-q", "-b", HEAD_REF, "main");
  if (conflict) fs.writeFileSync(path.join(seed, "a.txt"), "line one (PR edit)\n");
  else fs.writeFileSync(path.join(seed, "b.txt"), "pr work\n");
  g(seed, "add", "-A");
  g(seed, "commit", "-q", "-m", "pr work");
  fs.appendFileSync(path.join(seed, "b2.txt"), "more pr work\n");
  g(seed, "add", "-A");
  g(seed, "commit", "-q", "-m", "more pr work");
  g(seed, "push", "-q", "origin", HEAD_REF);
  const headSha = g(seed, "rev-parse", "HEAD");
  g(seed, "checkout", "-q", "main");
  if (advanceMain) {
    if (conflict) fs.writeFileSync(path.join(seed, "a.txt"), "line one (main edit)\n");
    else fs.writeFileSync(path.join(seed, "c.txt"), "main moved on\n");
    g(seed, "add", "-A");
    g(seed, "commit", "-q", "-m", "main moved on");
    g(seed, "push", "-q", "origin", "main");
  }
  execFileSync("git", ["clone", "-q", sb.origin, sb.rig], { stdio: "pipe" });
  sb.ident(sb.rig);
  fs.writeFileSync(
    sb.prJson,
    JSON.stringify({
      number: 78,
      url: "https://github.com/o/r/pull/78",
      title: "Fix the pace chart",
      state: "OPEN",
      isDraft: false,
      isCrossRepository: false,
      headRefName: HEAD_REF,
      baseRefName: "main",
      headRefOid: headSha,
      ...pr,
    })
  );
  return { headSha, mainSha: g(seed, "rev-parse", "main") };
}

function engine(sb, args) {
  return spawnSync(process.execPath, [path.join(sb.orch, "bin", "factory-run"), ...args], {
    encoding: "utf8",
    env: sb.env,
    timeout: 60_000,
  });
}

const runDir = (sb, id) => path.join(sb.orch, "runs", id);
const readRun = (sb, id) => JSON.parse(fs.readFileSync(path.join(runDir(sb, id), "run.json"), "utf8"));
const readFile = (sb, id, f) => {
  try {
    return fs.readFileSync(path.join(runDir(sb, id), f), "utf8");
  } catch {
    return "";
  }
};
const originHead = (sb) => execFileSync("git", ["--git-dir", sb.origin, "rev-parse", `refs/heads/${HEAD_REF}`], { encoding: "utf8" }).trim();
const rigHeads = (sb) => sb.g(sb.rig, "for-each-ref", "--format=%(refname) %(objectname)", "refs/heads");
const ghCalls = (sb) => (fs.existsSync(sb.ghLog) ? fs.readFileSync(sb.ghLog, "utf8").split("\n").filter(Boolean) : []);

function execPid(sb, id) {
  try {
    return parseInt(fs.readFileSync(path.join(runDir(sb, id), "executor.pid"), "utf8").trim(), 10) || null;
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

async function waitFor(fn, what, timeoutMs = 45_000) {
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

/** Start a rebase-train run and wait for its terminal state. */
async function runTrain(sb, t, extra = []) {
  const res = engine(sb, ["start", "--rig", "scratch", "--workflow", "rebase-train", "--pr", "78", ...extra]);
  assert.equal(res.status, 0, `start failed: ${res.stderr}`);
  const id = res.stdout.trim().split("\n").pop();
  t.after(() => killGroup(execPid(sb, id)));
  await waitFor(() => TERMINAL.includes(readRun(sb, id).state), `run ${id} to finish`);
  return { id, run: readRun(sb, id) };
}

function assertNoMerge(sb, id) {
  for (const f of ["engine.log", "push.log", "rebase.log"]) {
    const text = readFile(sb, id, f);
    assert.ok(!/gh pr merge|git merge /.test(text), `${f} has no merge`);
    assert.ok(!/git push[^\n]*(origin main\b|refs\/heads\/main\b)/.test(text), `${f} never pushes main`);
  }
  assert.ok(!ghCalls(sb).some((c) => c.startsWith("pr merge")), "gh pr merge never called");
}

test("clean run: detached rebase, setup before checks, lease push of the PR head, Not merged", async (t) => {
  const sb = makeSandbox(t, { checks: ["test -f c.txt", "test -f b.txt"], tests: ["true"] });
  const { headSha, mainSha } = preparePr(sb);
  const headsBefore = rigHeads(sb);

  const { id, run } = await runTrain(sb, t);
  assert.match(id, /^rebase-pr-78/);
  assert.equal(run.state, "done", JSON.stringify(run.history));
  assert.equal(run.rebase.pr, 78);
  assert.ok(!("branch" in run) && !("pr" in run), "run.json has neither branch nor pr");
  assert.equal(run.rebase.headShaBefore, headSha);
  assert.equal(run.rebase.baseSha, mainSha);
  assert.equal(run.rebase.commitsBefore, 2);
  assert.ok(run.rebase.headShaAfter && run.rebase.headShaAfter !== headSha);
  assert.equal(run.rebase.headShaAfter, run.rebase.rebasedSha, "pushed exactly the rebased worktree HEAD");
  assert.equal(originHead(sb), run.rebase.headShaAfter, "origin's PR head is the rebased HEAD");
  assert.match(run.history.at(-1).detail, /^pushed codex\/pace-chart/);

  // The rebased head sits on origin/main with both PR commits replayed.
  execFileSync("git", ["--git-dir", sb.origin, "merge-base", "--is-ancestor", mainSha, run.rebase.headShaAfter]);
  assert.equal(execFileSync("git", ["--git-dir", sb.origin, "rev-list", "--count", `${mainSha}..${run.rebase.headShaAfter}`], { encoding: "utf8" }).trim(), "2");

  // Fetch/check/detached-add argv, then the literal rebase and lease push.
  const prLog = readFile(sb, id, "pr.log");
  assert.ok(prLog.includes(`$ git fetch origin main ${HEAD_REF}\n`));
  assert.ok(prLog.includes(`$ git worktree add --detach ${path.join(sb.orch, "worktrees", id)} ${headSha}\n`));
  assert.ok(readFile(sb, id, "rebase.log").includes("$ git rebase origin/main\n"));
  const pushLog = readFile(sb, id, "push.log");
  assert.ok(pushLog.includes(`$ git push --force-with-lease=refs/heads/${HEAD_REF}:${headSha} origin HEAD:refs/heads/${HEAD_REF}\n`));

  // Setup ran (once) only after the rebase, immediately before checks.
  const engineLog = readFile(sb, id, "engine.log");
  assert.ok(readFile(sb, id, "setup.log").includes("setup-ran"));
  assert.ok(engineLog.indexOf("rebase: git rebase") < engineLog.indexOf("setup: echo setup-ran"));
  assert.ok(engineLog.indexOf("setup: echo setup-ran") < engineLog.indexOf("step 'checks':"));
  assert.equal(run.setupOk, true);
  assert.deepEqual(run.setupDirtyPaths, []);
  assert.ok(!engineLog.includes("pushed factory/"));

  // No local branch created, moved, or deleted.
  assert.equal(rigHeads(sb), headsBefore);

  const summary = readFile(sb, id, "rebase-summary.md");
  for (const bit of ["https://github.com/o/r/pull/78", "Fix the pace chart", headSha.slice(0, 12), run.rebase.headShaAfter.slice(0, 12), `main@${mainSha.slice(0, 12)}`, "Checks: 2 checks command(s) green", "Tests: 1 tests command(s) green", "Not merged"]) {
    assert.ok(summary.includes(bit), `summary includes ${bit}:\n${summary}`);
  }
  assert.ok(engineLog.includes("step 'notify': OK"));

  const db = new DatabaseSync(path.join(sb.orch, "telemetry.db"));
  const art = db.prepare("SELECT value FROM artifacts WHERE run_id = ? AND step_id = 'push' AND type = 'pr_head'").all(id);
  db.close();
  assert.equal(art.length, 1);
  assert.equal(art[0].value, `${HEAD_REF} ${headSha}..${run.rebase.headShaAfter}`);

  assertNoMerge(sb, id);
  assert.ok(!fs.readdirSync(runDir(sb, id)).some((f) => f.endsWith(".prompt.md")), "no agent step ran");

  const status = engine(sb, ["status", id]);
  assert.match(status.stdout, new RegExp(`rebase: pr #78 headRef ${HEAD_REF} headShaBefore ${headSha} headShaAfter ${run.rebase.headShaAfter} outcome pushed`));
  const json = JSON.parse(engine(sb, ["status", id, "--json"]).stdout);
  assert.deepEqual(json[0].rebase, run.rebase);
});

test("conflict: aborted, clean at the original head, founder item, no setup/push/agent; cleanup is branchless", async (t) => {
  const sb = makeSandbox(t, { checks: ["true"], tests: ["true"] });
  const { headSha, mainSha } = preparePr(sb, { conflict: true });
  const headsBefore = rigHeads(sb);

  const { id, run } = await runTrain(sb, t);
  assert.equal(run.state, "failed");
  assert.equal(run.stepIndex, 0, "failed at rebase");
  const detail = run.history.at(-1).detail;
  assert.match(detail, /^conflict: needs founder/);
  assert.ok(detail.includes("a.txt"));
  assert.ok(detail.includes(`${run.rebase.mergeBase}..${mainSha}`));
  assert.equal(run.rebase.conflicted, true);
  assert.deepEqual(run.rebase.unmergedFiles, ["a.txt"]);
  assert.equal(run.rebase.headShaAfter, null);

  const wt = path.join(sb.orch, "worktrees", id);
  assert.equal(sb.g(wt, "rev-parse", "HEAD"), headSha, "worktree back at headShaBefore");
  assert.equal(sb.g(wt, "status", "--porcelain"), "", "worktree clean after abort");
  assert.ok(readFile(sb, id, "rebase.log").includes("$ git rebase --abort"));

  assert.ok(!fs.existsSync(path.join(runDir(sb, id), "setup.log")), "no setup on a conflicted run");
  assert.ok(!fs.existsSync(path.join(runDir(sb, id), "push.log")), "no push on a conflicted run");
  assert.ok(!fs.readdirSync(runDir(sb, id)).some((f) => f.endsWith(".prompt.md")), "no agent spawned");
  assert.match(readFile(sb, id, "rebase-summary.md"), /conflict: needs founder/);
  assert.equal(originHead(sb), headSha);
  assertNoMerge(sb, id);

  // Branchless cleanup: worktree removed, no branch delete, no PR probe.
  const ghBefore = ghCalls(sb).length;
  const c = engine(sb, ["cleanup", id]);
  assert.equal(c.status, 0, c.stderr);
  assert.match(c.stdout, /^clean\s+rebase-pr-78\S*: branchless run/m);
  assert.match(c.stdout, /freed [1-9][0-9.]* (B|kB|MB)/);
  assert.ok(!fs.existsSync(wt), "detached worktree removed");
  assert.equal(ghCalls(sb).length, ghBefore, "cleanup never calls gh");
  assert.ok(!readFile(sb, id, "engine.log").includes("deleting branch"));
  assert.equal(rigHeads(sb), headsBefore);
});

test("lease failure: the PR head moves mid-run, the push fails once, no re-fetch", async (t) => {
  const sb = makeSandbox(t);
  const mover = path.join(sb.root, "mover");
  sb.writeRigs({
    checks: [`git -C ${JSON.stringify(mover)} commit -q --allow-empty -m moved && git -C ${JSON.stringify(mover)} push -q origin HEAD:refs/heads/${HEAD_REF}`],
    tests: ["true"],
  });
  const { headSha } = preparePr(sb);
  execFileSync("git", ["clone", "-q", "-b", HEAD_REF, sb.origin, mover], { stdio: "pipe" });
  sb.ident(mover);

  const { id, run } = await runTrain(sb, t);
  assert.equal(run.state, "failed");
  const detail = run.history.at(-1).detail;
  assert.match(detail, /^push rejected for codex\/pace-chart/);
  assert.ok(detail.includes(headSha) && detail.includes(run.rebase.rebasedSha), "names both shas");
  const pushes = readFile(sb, id, "push.log").split("\n").filter((l) => l.startsWith("$ git push"));
  assert.equal(pushes.length, 1, "exactly one push attempt");
  assert.equal(run.rebase.headShaAfter, null);
  assert.notEqual(originHead(sb), run.rebase.rebasedSha, "origin keeps the mover's commit");
  assert.equal(sb.g(sb.rig, "rev-parse", `origin/${HEAD_REF}`), headSha, "no re-fetch after the rejection");
  assert.equal(readFile(sb, id, "pr.log").split("\n").filter((l) => l.startsWith("$ git fetch")).length, 1);
});

test("no-op: a head already on the base ends done without setup, checks, tests, or push", async (t) => {
  const sb = makeSandbox(t, { checks: ["false"], tests: ["false"] });
  const { headSha } = preparePr(sb, { advanceMain: false });
  const { id, run } = await runTrain(sb, t);
  assert.equal(run.state, "done", JSON.stringify(run.history));
  assert.equal(run.history.at(-1).detail, "already up to date");
  assert.ok(!fs.existsSync(path.join(runDir(sb, id), "setup.log")));
  assert.ok(!fs.existsSync(path.join(runDir(sb, id), "push.log")));
  assert.ok(!readFile(sb, id, "engine.log").includes("step 'checks'"));
  assert.equal(originHead(sb), headSha);
  assert.match(readFile(sb, id, "rebase-summary.md"), /already up to date/);
});

test("dry run: every step runs, nothing is pushed", async (t) => {
  const sb = makeSandbox(t, { checks: ["true"], tests: ["true"] });
  const { headSha } = preparePr(sb);
  const { id, run } = await runTrain(sb, t, ["--dry-run"]);
  assert.equal(run.state, "done", JSON.stringify(run.history));
  assert.equal(run.history.at(-1).detail, "dry run: not pushed");
  assert.equal(run.rebase.dryRun, true);
  assert.ok(readFile(sb, id, "setup.log").includes("setup-ran"));
  assert.ok(readFile(sb, id, "engine.log").includes("step 'tests': OK"));
  assert.ok(!fs.existsSync(path.join(runDir(sb, id), "push.log")));
  assert.equal(originHead(sb), headSha, "origin ref unchanged");
  assert.match(readFile(sb, id, "rebase-summary.md"), /Dry run/);
});

test("refused PR (draft) fails at rebase with no worktree", async (t) => {
  const sb = makeSandbox(t);
  preparePr(sb, { pr: { isDraft: true } });
  const { id, run } = await runTrain(sb, t);
  assert.equal(run.state, "failed");
  assert.equal(run.stepIndex, 0);
  assert.match(run.history.at(-1).detail, /^refused: PR #78 is a draft/);
  assert.ok(!fs.existsSync(path.join(sb.orch, "worktrees", id)), "no worktree directory");
  assert.match(readFile(sb, id, "rebase-summary.md"), /refused: PR #78 is a draft/);
  assert.deepEqual(ghCalls(sb), ["pr view 78 --json number,url,title,state,isDraft,isCrossRepository,headRefName,baseRefName,headRefOid"]);
});

test("PR head moved between gh and the fetch fails before the worktree", async (t) => {
  const sb = makeSandbox(t);
  preparePr(sb, { pr: { headRefOid: "1234567890abcdef1234567890abcdef12345678" } });
  const { id, run } = await runTrain(sb, t);
  assert.equal(run.state, "failed");
  assert.match(run.history.at(-1).detail, /^PR head moved: gh reported 1234567890abcdef/);
  assert.ok(!fs.existsSync(path.join(sb.orch, "worktrees", id)));
});

test("start validates --pr and creates no run dir on a usage error", (t) => {
  const sb = makeSandbox(t);
  const cases = [
    ["--workflow", "feature-dev", "--prompt", "x", "--pr", "78"],
    ["--workflow", "rebase-train"],
    ["--workflow", "rebase-train", "--pr", "0"],
    ["--workflow", "rebase-train", "--pr", "abc"],
  ];
  for (const extra of cases) {
    const res = engine(sb, ["start", "--rig", "scratch", ...extra]);
    assert.notEqual(res.status, 0, `rejects ${extra.join(" ")}`);
    assert.match(res.stderr, /usage: factory-run start/);
  }
  assert.ok(!fs.existsSync(path.join(sb.orch, "runs")) || fs.readdirSync(path.join(sb.orch, "runs")).length === 0, "no run dir created");
});

test("checks failure ends the run at checks; resume re-runs setup only when setupOk is absent", async (t) => {
  const sb = makeSandbox(t);
  const flag = path.join(sb.root, "checks-pass");
  sb.writeRigs({ checks: [`test -f ${JSON.stringify(flag)}`], tests: ["true"] });
  const { headSha } = preparePr(sb);
  const { id, run } = await runTrain(sb, t);
  assert.equal(run.state, "failed");
  assert.equal(run.stepIndex, 1, "failed at checks — no loop back");
  assert.match(run.history.at(-1).detail, /^checks failed at: test -f/);
  assert.equal(run.rebase.headShaAfter, null);
  assert.ok(!fs.existsSync(path.join(runDir(sb, id), "push.log")));
  assert.match(readFile(sb, id, "rebase-summary.md"), /failed at checks/);
  const setupRuns = () => (readFile(sb, id, "setup.log").match(/\$ echo setup-ran/g) || []).length;
  assert.equal(setupRuns(), 1);

  // setupOk present: resume at checks skips setup.
  fs.writeFileSync(flag, "");
  const execStart = () => {
    const r = engine(sb, ["resume", id]);
    assert.equal(r.status, 0, r.stderr);
  };
  sb.writeRigs({ checks: [`test -f ${JSON.stringify(flag)}`, "false"], tests: ["true"] });
  execStart();
  await waitFor(() => readRun(sb, id).state === "failed" && readRun(sb, id).history.at(-1).detail.includes("false"), "second checks failure");
  assert.equal(setupRuns(), 1, "setupOk present: no re-provision");

  // setupOk absent: the resume re-provisions before checks, then pushes.
  const r = readRun(sb, id);
  delete r.setupOk;
  fs.writeFileSync(path.join(runDir(sb, id), "run.json"), JSON.stringify(r, null, 2));
  sb.writeRigs({ checks: [`test -f ${JSON.stringify(flag)}`], tests: ["true"] });
  execStart();
  await waitFor(() => readRun(sb, id).state === "done", "resumed run to finish");
  assert.equal(setupRuns(), 2, "setupOk absent: re-provisioned once");
  assert.notEqual(originHead(sb), headSha);
  assert.equal(originHead(sb), readRun(sb, id).rebase.headShaAfter);
});
