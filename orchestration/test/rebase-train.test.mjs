/*
 * rebase-train integration test for bin/factory-run (offline: a fake `gh` and
 * a scripted `claude` on PATH, notifications disabled, preflight skipped, a
 * local bare origin + scratch rig clone + the REAL rebase-train workflow and
 * conflict-resolver prompt in a throwaway sandbox orchestration dir).
 *
 * Pins the rebase-train contract (D34):
 *  - `start --workflow rebase-train --pr <n>` needs no prompt, mints
 *    rebase-pr-<n>, records run.rebase.pr, and writes no run.branch; --pr on
 *    any other workflow, or a missing/malformed --pr, is a usage error;
 *  - the PR is resolved with `gh pr view` before any worktree exists; a
 *    refusal ends the run failed with no worktree created;
 *  - the worktree is `git fetch origin <base> <head>` + `git worktree add
 *    --detach … origin/<head>` (argv pinned in engine.log), no factory/ push;
 *  - a clean rebase skips resolve, re-runs the rig checks on the rebased
 *    tree, and force-pushes the PR branch with a lease pinned to the fetched
 *    head sha; the run ends done with headShaAfter, commitsAfter, a summary
 *    that says Not merged, and no merge/base-branch push anywhere;
 *  - a conflict stop runs the resolver: RESOLVED (verified) continues to a
 *    push with an unchanged commit count; ESCALATED aborts the rebase and
 *    fails the run at resolve with the escalation's first line, no push;
 *  - a lease failure (remote head moved after the fetch) fails the push step
 *    once, naming the branch and both shas, with no re-fetch and no retry;
 *  - cleanup of a terminal rebase-train run removes the detached worktree
 *    without touching branches or asking gh.
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
const HEAD_REF = "codex/x";
const PR = 88;

function gitIn(dir) {
  return (...args) => execFileSync("git", ["-C", dir, ...args], { stdio: "pipe", encoding: "utf8" }).trim();
}

/**
 * Sandbox: origin.git (bare) ← seed clone that publishes main + codex/x, a
 * rig clone (what rigs.json points at), the engine + real rebase-train
 * workflow/prompt, and PATH shims for gh (scripted from a JSON file) and
 * claude (behaviour from CLAUDE_STUB_MODE).
 *   conflict:false → codex/x adds feature.txt, main adds base.txt (clean rebase)
 *   conflict:true  → both sides rewrite shared.txt (rebase stops)
 */
function makeSandbox(t, { conflict = false, checks = ["test -f base.txt && test -f feature.txt"], setup = [] } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "factory-rebase-train-test-"));
  t.after(() => {
    try {
      fs.rmSync(root, { recursive: true, force: true });
    } catch {}
  });
  const orch = path.join(root, "orchestration");
  for (const d of ["bin", "web/lib", "workflows", "prompts", "worktrees"]) fs.mkdirSync(path.join(orch, d), { recursive: true });
  fs.copyFileSync(path.join(REAL_ORCH, "bin", "factory-run"), path.join(orch, "bin", "factory-run"));
  fs.chmodSync(path.join(orch, "bin", "factory-run"), 0o755);
  for (const lib of ["discussion.mjs", "plan-md.mjs", "retry.mjs", "watchdog.mjs", "github.mjs", "agent-spawn.mjs", "rebase.mjs"]) {
    fs.copyFileSync(path.join(REAL_ORCH, "web", "lib", lib), path.join(orch, "web", "lib", lib));
  }
  fs.copyFileSync(path.join(REAL_ORCH, "workflows", "rebase-train.json"), path.join(orch, "workflows", "rebase-train.json"));
  fs.copyFileSync(path.join(REAL_ORCH, "prompts", "conflict-resolver.md"), path.join(orch, "prompts", "conflict-resolver.md"));
  // A second workflow so the "--pr with another workflow" refusal is a real
  // workflow, not an unknown one.
  fs.writeFileSync(path.join(orch, "workflows", "feature-dev.json"), JSON.stringify({ name: "feature-dev", steps: [{ id: "noop", type: "manual" }] }));

  const origin = path.join(root, "origin.git");
  execFileSync("git", ["init", "-q", "--bare", "-b", "main", origin], { stdio: "pipe" });
  const seed = path.join(root, "seed");
  execFileSync("git", ["clone", "-q", origin, seed], { stdio: "pipe" });
  const sgit = gitIn(seed);
  sgit("config", "user.email", "rebase-train-test@example.invalid");
  sgit("config", "user.name", "Rebase Train Test");
  fs.writeFileSync(path.join(seed, "README.md"), "scratch rig\n");
  fs.writeFileSync(path.join(seed, "shared.txt"), "line one\nline two\n");
  sgit("add", "-A");
  sgit("commit", "-q", "-m", "init");
  sgit("push", "-q", "origin", "main");
  const baseBefore = sgit("rev-parse", "HEAD");
  // PR branch.
  sgit("checkout", "-q", "-b", HEAD_REF);
  if (conflict) fs.writeFileSync(path.join(seed, "shared.txt"), "line one\nPR rewrite of line two\n");
  else fs.writeFileSync(path.join(seed, "feature.txt"), "feature\n");
  sgit("add", "-A");
  sgit("commit", "-q", "-m", "pr work");
  sgit("push", "-q", "origin", HEAD_REF);
  const headBefore = sgit("rev-parse", "HEAD");
  // Base advances after the PR branched.
  sgit("checkout", "-q", "main");
  if (conflict) fs.writeFileSync(path.join(seed, "shared.txt"), "line one\nMAIN rewrite of line two\n");
  else fs.writeFileSync(path.join(seed, "base.txt"), "base\n");
  sgit("add", "-A");
  sgit("commit", "-q", "-m", "main moved on");
  sgit("push", "-q", "origin", "main");
  const baseSha = sgit("rev-parse", "HEAD");

  const rig = path.join(root, "rig");
  execFileSync("git", ["clone", "-q", origin, rig], { stdio: "pipe" });
  const rgit = gitIn(rig);
  rgit("config", "user.email", "rebase-train-test@example.invalid");
  rgit("config", "user.name", "Rebase Train Test");
  fs.writeFileSync(
    path.join(orch, "rigs.json"),
    JSON.stringify({ rigs: { scratch: { path: rig, defaultBranch: "main", setup, checks, tests: [] } } }, null, 2)
  );

  // gh shim: every call is logged; `pr view` prints the JSON file GH_PR_JSON
  // points at; everything else fails (there is no merge, list, or create).
  const stubDir = path.join(root, "stubbin");
  fs.mkdirSync(stubDir);
  const ghCalls = path.join(root, "gh-calls.log");
  const prJson = path.join(root, "pr.json");
  fs.writeFileSync(
    path.join(stubDir, "gh"),
    `#!/bin/bash\necho "$@" >> "$GH_CALLS"\nif [ "$1 $2" = "pr view" ]; then cat "$GH_PR_JSON"; exit 0; fi\nexit 1\n`
  );
  fs.chmodSync(path.join(stubDir, "gh"), 0o755);
  writePrJson(prJson, { headRefOid: headBefore });
  // claude shim: CLAUDE_STUB_MODE=resolve completes the stopped rebase (both
  // intents kept), =escalate aborts and writes escalation.md; either way it
  // emits a stream-json result event the engine reads as the agent's ending.
  fs.writeFileSync(
    path.join(stubDir, "claude"),
    [
      "#!/bin/bash",
      'RUN_DIR="$CLAUDE_STUB_RUN_DIR"',
      'if [ "$CLAUDE_STUB_MODE" = "resolve" ]; then',
      '  printf "line one\\nMAIN rewrite of line two\\nPR rewrite of line two\\n" > shared.txt',
      "  git add shared.txt",
      "  GIT_EDITOR=true git rebase --continue >/dev/null 2>&1",
      '  echo \'{"type":"result","subtype":"success","result":"RESOLVED","total_cost_usd":0.01,"usage":{"input_tokens":1,"output_tokens":1}}\'',
      'elif [ "$CLAUDE_STUB_MODE" = "escalate" ]; then',
      "  git rebase --abort",
      '  printf "Semantic conflict in shared.txt: both sides rewrote line two\\n\\nFounder must pick.\\n" > "$RUN_DIR/escalation.md"',
      '  echo \'{"type":"result","subtype":"success","result":"ESCALATED","total_cost_usd":0.01,"usage":{"input_tokens":1,"output_tokens":1}}\'',
      "else",
      '  echo \'{"type":"result","subtype":"success","result":"RESOLVED","total_cost_usd":0.01,"usage":{}}\'',
      "fi",
      "exit 0",
      "",
    ].join("\n")
  );
  fs.chmodSync(path.join(stubDir, "claude"), 0o755);

  const env = {
    ...process.env,
    PATH: `${stubDir}:${process.env.PATH}`,
    FACTORY_RUN_NO_PREFLIGHT: "1",
    FACTORY_RUN_NO_NOTIFY: "1",
    GH_CALLS: ghCalls,
    GH_PR_JSON: prJson,
    CLAUDE_STUB_MODE: "none",
  };
  return { root, orch, origin, seed, rig, sgit, rgit, env, ghCalls, prJson, headBefore, baseBefore, baseSha };
}

function writePrJson(file, over = {}) {
  fs.writeFileSync(
    file,
    JSON.stringify({
      number: PR,
      url: `https://github.com/o/r/pull/${PR}`,
      title: "Add the thing",
      body: "PR body text",
      state: "OPEN",
      isCrossRepository: false,
      headRefName: HEAD_REF,
      baseRefName: "main",
      headRefOid: "",
      mergeable: "CONFLICTING",
      ...over,
    })
  );
}

function engine(sb, args, envOver = {}) {
  return spawnSync(process.execPath, [path.join(sb.orch, "bin", "factory-run"), ...args], {
    encoding: "utf8",
    env: { ...sb.env, ...envOver },
    timeout: 60_000,
  });
}

function readRun(sb, id) {
  return JSON.parse(fs.readFileSync(path.join(sb.orch, "runs", id, "run.json"), "utf8"));
}

function runFile(sb, id, name) {
  try {
    return fs.readFileSync(path.join(sb.orch, "runs", id, name), "utf8");
  } catch {
    return null;
  }
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

function startRebase(sb, t, envOver = {}) {
  const res = engine(sb, ["start", "--rig", "scratch", "--workflow", "rebase-train", "--pr", String(PR)], envOver);
  assert.equal(res.status, 0, `start failed: ${res.stderr}`);
  const id = res.stdout.trim().split("\n").pop();
  assert.ok(id.startsWith(`rebase-pr-${PR}`), `run id begins rebase-pr-${PR}: ${id}`);
  t.after(() => killGroup(execPid(sb, id)));
  return id;
}

const TERMINAL = ["done", "failed", "rejected", "cancelled", "killed", "awaiting-merge", "closed"];
const waitTerminal = (sb, id) => waitFor(() => (TERMINAL.includes(readRun(sb, id).state) ? readRun(sb, id) : null), `run ${id} to end`);

/** The forbidden shapes: no merge of any kind, no push naming the base branch. */
function assertNoMergeOrBasePush(sb, id) {
  for (const name of ["engine.log", "push.log", "rebase.log", "pr.log"]) {
    const text = runFile(sb, id, name) || "";
    assert.ok(!/gh pr merge/.test(text), `${name} has no gh pr merge`);
    assert.ok(!/git merge\b/.test(text), `${name} has no git merge`);
    assert.ok(!/git push[^\n]*(origin main\b|refs\/heads\/main\b)/.test(text), `${name} has no push naming main`);
    assert.ok(!/pushed factory\//.test(text), `${name} has no factory/ push`);
  }
  const gh = fs.existsSync(sb.ghCalls) ? fs.readFileSync(sb.ghCalls, "utf8") : "";
  assert.ok(!/pr merge/.test(gh), "gh was never asked to merge");
}

test("start: --pr parsing — rebase-train needs a valid --pr, nothing else accepts one", (t) => {
  const sb = makeSandbox(t);
  const bad = [
    ["--rig", "scratch", "--workflow", "feature-dev", "--pr", "88", "--prompt", "x"],
    ["--rig", "scratch", "--workflow", "rebase-train"],
    ["--rig", "scratch", "--workflow", "rebase-train", "--pr", "0"],
    ["--rig", "scratch", "--workflow", "rebase-train", "--pr", "abc"],
    ["--rig", "scratch", "--workflow", "rebase-train", "--pr", "1000000"],
  ];
  for (const args of bad) {
    const r = engine(sb, ["start", ...args]);
    assert.notEqual(r.status, 0, `exits non-zero: ${args.join(" ")}`);
    assert.match(r.stderr, /usage: factory-run start/);
  }
  assert.ok(!fs.existsSync(path.join(sb.orch, "runs")) || fs.readdirSync(path.join(sb.orch, "runs")).length === 0, "no run dir created");
});

test("clean rebase: detached PR worktree, resolve skipped, checks on the rebased tree, lease-pinned push, done", async (t) => {
  const sb = makeSandbox(t);
  const id = startRebase(sb, t);
  const fresh = readRun(sb, id);
  assert.equal(fresh.rebase.pr, PR);
  assert.equal(fresh.prompt, `Rebase PR #${PR} onto main`);
  assert.ok(!("branch" in fresh), "run.json carries no branch field");
  for (const k of ["baseSha", "headShaAfter", "conflicted", "commitsBefore", "commitsAfter"]) assert.equal(fresh.rebase[k], null, `${k} starts null`);

  const run = await waitTerminal(sb, id);
  const engineLog = runFile(sb, id, "engine.log") || "";
  assert.equal(run.state, "done", `run ended done:\n${engineLog}`);
  const rb = run.rebase;
  assert.equal(rb.url, `https://github.com/o/r/pull/${PR}`);
  assert.equal(rb.title, "Add the thing");
  assert.equal(rb.headRef, HEAD_REF);
  assert.equal(rb.baseRef, "main");
  assert.equal(rb.headShaBefore, sb.headBefore, "lease sha is the fetched PR head");
  assert.equal(rb.baseSha, sb.baseSha);
  assert.equal(rb.conflicted, false);
  assert.equal(rb.commitsBefore, 1);
  assert.equal(rb.commitsAfter, 1);
  // Worktree creation argv, pinned.
  assert.match(engineLog, new RegExp(`git fetch origin main ${HEAD_REF}`));
  assert.match(engineLog, new RegExp(`git worktree add --detach \\S+/${id} origin/${HEAD_REF}`));
  assert.match(engineLog, /step 'resolve': OK \(resolve skipped \(rebase was clean\)\)/);
  assert.equal(runFile(sb, id, "resolve.prompt.md"), null, "no resolve prompt was written");
  assert.match(runFile(sb, id, "rebase.log") || "", /\$ git rebase origin\/main/);
  // The push: lease pinned to the fetched head, fully qualified destination.
  const pushLog = runFile(sb, id, "push.log") || "";
  assert.match(pushLog, new RegExp(`git push --force-with-lease=refs/heads/${HEAD_REF}:${sb.headBefore} origin HEAD:refs/heads/${HEAD_REF}`));
  // origin's PR branch is the rebased head; main is untouched.
  const ogit = gitIn(sb.origin);
  assert.equal(ogit("rev-parse", `refs/heads/${HEAD_REF}`), rb.headShaAfter, "origin's PR branch is the pushed head");
  assert.equal(ogit("rev-parse", `${rb.headShaAfter}^`), sb.baseSha, "rebased commit sits on the new base");
  assert.equal(ogit("rev-parse", "refs/heads/main"), sb.baseSha, "main never moved");
  assert.notEqual(rb.headShaAfter, sb.headBefore);
  // No local branch of any kind was created in the rig.
  assert.equal(sb.rgit("branch", "--list", HEAD_REF), "");
  assert.equal(sb.rgit("branch", "--list", `factory/${id}`), "");
  // Summary: PR url + title, both heads, base@sha, outcome, Not merged.
  const summary = runFile(sb, id, "rebase-summary.md") || "";
  for (const bit of [rb.url, "Add the thing", sb.headBefore.slice(0, 12), rb.headShaAfter.slice(0, 12), `main@${sb.baseSha.slice(0, 12)}`, "Conflicts: none", "Checks: green", "Outcome: done", "Not merged"]) {
    assert.ok(summary.includes(bit), `summary carries ${bit}:\n${summary}`);
  }
  assertNoMergeOrBasePush(sb, id);
  // status surfaces the rebase record on the CLI and unchanged in --json.
  const st = engine(sb, ["status", id]);
  assert.match(st.stdout, new RegExp(`rebase: pr #${PR} ${HEAD_REF} — headShaBefore ${sb.headBefore.slice(0, 12)} headShaAfter ${rb.headShaAfter.slice(0, 12)} conflicted false`));
  const js = JSON.parse(engine(sb, ["status", id, "--json"]).stdout);
  assert.deepEqual(js[0].rebase, rb);
});

test("refused PR (MERGED): the run fails before any worktree exists", async (t) => {
  const sb = makeSandbox(t);
  writePrJson(sb.prJson, { state: "MERGED", headRefOid: sb.headBefore });
  const id = startRebase(sb, t);
  const run = await waitTerminal(sb, id);
  assert.equal(run.state, "failed");
  const detail = run.history.at(-1).detail;
  assert.match(detail, /PR #88 refused: PR is MERGED/);
  assert.ok(!fs.existsSync(path.join(sb.orch, "worktrees", id)), "no worktree directory created");
  assert.ok(!/git fetch/.test(runFile(sb, id, "engine.log") || ""), "nothing fetched");
  assert.match(runFile(sb, id, "rebase-summary.md") || "", /PR is MERGED/);
  assert.equal(run.rebase.headRef, null);
});

test("conflict + RESOLVED: conflict.md precedes the agent, the verified rebase is pushed with an unchanged commit count", async (t) => {
  const sb = makeSandbox(t, { conflict: true, checks: ["grep -q 'MAIN rewrite' shared.txt && grep -q 'PR rewrite' shared.txt"] });
  const runDir = path.join(sb.orch, "runs", `rebase-pr-${PR}`);
  const id = startRebase(sb, t, { CLAUDE_STUB_MODE: "resolve", CLAUDE_STUB_RUN_DIR: runDir });
  const run = await waitTerminal(sb, id);
  const engineLog = runFile(sb, id, "engine.log") || "";
  assert.equal(run.state, "done", `run ended done:\n${engineLog}`);
  assert.equal(run.rebase.conflicted, true);
  assert.deepEqual(run.rebase.conflictFiles, ["shared.txt"]);
  const conflictMd = runFile(sb, id, "conflict.md") || "";
  assert.match(conflictMd, /shared\.txt/);
  assert.match(conflictMd, /Add the thing/);
  assert.match(conflictMd, new RegExp(`${sb.baseBefore.slice(0, 12)}\\.\\.${sb.baseSha.slice(0, 12)}`), "base-side range is <merge-base>..<baseSha>");
  assert.match(engineLog, /step 'rebase': OK \(rebase stopped on 1 conflicting file\(s\): shared\.txt/);
  assert.match(engineLog, /step 'resolve': OK \(conflicts resolved by the agent: shared\.txt\)/);
  const prompt = runFile(sb, id, "resolve.prompt.md") || "";
  assert.match(prompt, /pull request #88 — "Add the thing"/);
  assert.match(prompt, /PR body text/);
  assert.equal(run.rebase.commitsAfter, run.rebase.commitsBefore);
  assert.equal(gitIn(sb.origin)("rev-parse", `refs/heads/${HEAD_REF}`), run.rebase.headShaAfter);
  assert.match(runFile(sb, id, "rebase-summary.md") || "", /Conflicts: 1 file\(s\) resolved by the conflict-resolver agent: shared\.txt/);
  assertNoMergeOrBasePush(sb, id);
});

test("conflict + ESCALATED: rebase aborted, run failed at resolve with the escalation line, nothing pushed, worktree kept", async (t) => {
  const sb = makeSandbox(t, { conflict: true });
  const runDir = path.join(sb.orch, "runs", `rebase-pr-${PR}`);
  const id = startRebase(sb, t, { CLAUDE_STUB_MODE: "escalate", CLAUDE_STUB_RUN_DIR: runDir });
  const run = await waitTerminal(sb, id);
  assert.equal(run.state, "failed");
  assert.equal(run.stepIndex, 1, "failed at the resolve step");
  const detail = run.history.at(-1).detail;
  assert.match(detail, /escalated to the founder: Semantic conflict in shared\.txt: both sides rewrote line two/);
  assert.equal(run.rebase.escalation, "Semantic conflict in shared.txt: both sides rewrote line two");
  assert.equal(run.rebase.headShaAfter, null);
  assert.equal(runFile(sb, id, "push.log"), null, "no push was attempted");
  const worktree = path.join(sb.orch, "worktrees", id);
  assert.ok(fs.existsSync(worktree), "worktree kept for the founder");
  const wgit = gitIn(worktree);
  assert.equal(wgit("rev-parse", "HEAD"), sb.headBefore, "rebase aborted: HEAD is back at the fetched PR head");
  assert.equal(wgit("status", "--porcelain"), "", "worktree clean after the abort");
  assert.equal(gitIn(sb.origin)("rev-parse", `refs/heads/${HEAD_REF}`), sb.headBefore, "origin's PR branch untouched");
  assert.match(runFile(sb, id, "rebase-summary.md") || "", /Conflicts: escalated — Semantic conflict/);
  assert.match(runFile(sb, id, "rebase-summary.md") || "", /Outcome: failed at resolve/);
  assertNoMergeOrBasePush(sb, id);
});

test("lease failure: remote head moved after the fetch — push fails once naming branch and both shas, no re-fetch, no retry; cleanup reclaims the worktree", async (t) => {
  // Move origin's PR branch during rig setup: after the engine's fetch
  // (worktree creation) and before its push.
  const mover = (root) => `git -C ${JSON.stringify(path.join(root, "seed"))} checkout -q ${HEAD_REF} && git -C ${JSON.stringify(path.join(root, "seed"))} commit -q --allow-empty -m moved && git -C ${JSON.stringify(path.join(root, "seed"))} push -q origin ${HEAD_REF}`;
  const sb = makeSandbox(t, { setup: [] });
  const rigs = JSON.parse(fs.readFileSync(path.join(sb.orch, "rigs.json"), "utf8"));
  rigs.rigs.scratch.setup = [mover(sb.root)];
  fs.writeFileSync(path.join(sb.orch, "rigs.json"), JSON.stringify(rigs, null, 2));
  const id = startRebase(sb, t);
  const run = await waitTerminal(sb, id);
  assert.equal(run.state, "failed", `run ended failed:\n${runFile(sb, id, "engine.log")}`);
  assert.equal(run.stepIndex, 4, "failed at the push step");
  const worktree = path.join(sb.orch, "worktrees", id);
  const localHead = gitIn(worktree)("rev-parse", "HEAD");
  const detail = run.history.at(-1).detail;
  assert.match(detail, /push refused by lease/);
  assert.ok(detail.includes(`origin/${HEAD_REF}`), "names the branch");
  assert.ok(detail.includes(sb.headBefore), "names the lease sha");
  assert.ok(detail.includes(localHead), "names the local rebased head");
  assert.equal(run.rebase.headShaAfter, null);
  const pushLog = runFile(sb, id, "push.log") || "";
  assert.equal((pushLog.match(/\$ git push/g) || []).length, 1, "exactly one push attempt");
  assert.equal(((runFile(sb, id, "engine.log") || "").match(/git fetch origin/g) || []).length, 1, "no re-fetch after the lease failure");
  const moved = sb.sgit("rev-parse", HEAD_REF);
  assert.equal(gitIn(sb.origin)("rev-parse", `refs/heads/${HEAD_REF}`), moved, "origin keeps the moved head");
  assertNoMergeOrBasePush(sb, id);

  // cleanup: removes the detached worktree, no branch delete, no gh call.
  const ghBefore = fs.readFileSync(sb.ghCalls, "utf8");
  const dry = engine(sb, ["cleanup", id, "--dry-run", "--json"]);
  assert.equal(dry.status, 0, dry.stderr);
  const dryRes = JSON.parse(dry.stdout).results[0];
  assert.equal(dryRes.action, "would-clean");
  assert.ok(dryRes.freedBytes > 0, "dry run reports bytes to free");
  const cl = engine(sb, ["cleanup", id, "--json"]);
  assert.equal(cl.status, 0, cl.stderr);
  const res = JSON.parse(cl.stdout).results[0];
  assert.equal(res.action, "clean", JSON.stringify(res));
  assert.ok(res.freedBytes > 0, "reports freed bytes");
  assert.ok(!fs.existsSync(worktree), "detached worktree removed");
  assert.equal(fs.readFileSync(sb.ghCalls, "utf8"), ghBefore, "cleanup asked gh nothing");
  assert.equal(sb.rgit("branch", "--list", HEAD_REF), "", "no local PR branch ever existed");
  assert.equal(sb.rgit("branch", "--list", `factory/${id}`), "", "no run branch ever existed");
});

test("cleanup --dry-run skips a non-terminal rebase-train run", (t) => {
  const sb = makeSandbox(t);
  const id = "rebase-pr-7";
  const runDir = path.join(sb.orch, "runs", id);
  fs.mkdirSync(runDir, { recursive: true });
  // A real detached worktree at origin/codex/x, as the executor would leave it.
  const worktree = path.join(sb.orch, "worktrees", id);
  sb.rgit("worktree", "add", "--detach", worktree, `origin/${HEAD_REF}`);
  fs.writeFileSync(
    path.join(runDir, "run.json"),
    JSON.stringify({ id, workflow: "rebase-train", rig: "scratch", prompt: "Rebase PR #7 onto main", state: "running:rebase", stepIndex: 0, rebase: { pr: 7 }, worktree, baseBranch: "main", history: [], createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" })
  );
  const dry = engine(sb, ["cleanup", id, "--dry-run", "--json"]);
  assert.equal(dry.status, 0, dry.stderr);
  const res = JSON.parse(dry.stdout).results[0];
  assert.equal(res.action, "skip");
  assert.match(res.reason, /not terminal/);
  assert.ok(fs.existsSync(worktree), "in-flight worktree untouched");
});
