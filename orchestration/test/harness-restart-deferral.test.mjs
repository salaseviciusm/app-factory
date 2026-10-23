/*
 * Sync-time harness-restart deferral integration test for bin/factory-run
 * (offline: an executable `gh` shim injects GitHub's merged verdict, an
 * `openclaw` stub answers the gateway-activity probe from fixture JSON and
 * captures every argv, preflight skipped, scratch `harness-restart` rig with
 * NO origin remote in a throwaway sandbox orchestration dir — `git fetch
 * origin` fails best-effort and the merge commit is already on local main).
 *
 * Pins D35: the restart relaunches the gateway that may be running the very
 * turn that called sync (2026-10-22 killed the standup cutoff AND the sync's
 * own engine.log line + :tada: notify). So:
 *  - (a) a running task (the factory-standup-cutoff cron turn) defers: the
 *    run still ends `done`, run.json carries pendingHarnessRestart.sha = the
 *    merge commit, no `gateway restart` is invoked, and engine.log + the
 *    notify both say "deferred" and name `factory-run harness-restart`;
 *  - (b) once idle, `harness-restart` restarts exactly once for the rig even
 *    with two pending runs, clears both records, and each run's
 *    `harness restart applied` line is in engine.log BEFORE the restart;
 *  - (c) a Slack session touched 30s ago (no tasks) defers;
 *  - (d) a probe that exits non-zero defers (fail closed);
 *  - (e) policy.deploy hold defers with the approve hint even when idle;
 *    plain `harness-restart` still defers, `--approve` restarts;
 *  - (f) idle at sync time restarts immediately, with the `sync: … -> done`
 *    line and the :tada: notify both landing before the restart.
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
const SEP = "\n===ARGV===\n";

function makeSandbox(t, { policy } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "factory-harness-restart-test-"));
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

  // Scratch harness rig, deliberately without an `origin` remote. Each PR's
  // merge commit is already on local main (the founder pulled).
  const rig = path.join(root, "rig");
  fs.mkdirSync(rig);
  execFileSync("git", ["init", "-q", "-b", "main", rig], { stdio: "pipe" });
  const git = (...args) => execFileSync("git", ["-C", rig, ...args], { stdio: "pipe" }).toString().trim();
  git("config", "user.email", "harness-restart-test@example.invalid");
  git("config", "user.name", "Harness Restart Test");
  const commitFile = (name, msg) => {
    fs.writeFileSync(path.join(rig, name), `${name}\n`);
    git("add", name);
    git("commit", "-q", "-m", msg);
    return git("rev-parse", "HEAD");
  };
  commitFile("README.md", "init");

  fs.writeFileSync(
    path.join(orch, "rigs.json"),
    JSON.stringify(
      {
        rigs: {
          harness: {
            path: rig,
            defaultBranch: "main",
            setup: [],
            deploy: { type: "harness-restart" },
            ...(policy ? { policy } : {}),
          },
        },
        notify: { channel: "slack", to: "test-target" },
      },
      null,
      2
    )
  );

  const stubDir = path.join(root, "stubbin");
  fs.mkdirSync(stubDir);
  // gh shim: `gh pr view <n> …` prints <root>/gh-<n>.json.
  fs.writeFileSync(
    path.join(stubDir, "gh"),
    `#!/bin/bash\nf=${JSON.stringify(root)}/gh-$3.json\nif [ -f "$f" ]; then cat "$f"; exit 0; fi\necho "gh: offline shim" >&2\nexit 1\n`
  );
  fs.chmodSync(path.join(stubDir, "gh"), 0o755);

  // openclaw stub: capture every argv in call order; answer the probe from
  // fixture files the test rewrites; on `gateway restart`, snapshot every
  // run's engine.log so the test can prove what was logged BEFORE it.
  const capture = path.join(root, "openclaw.log");
  const snapshot = path.join(root, "engine-at-restart.txt");
  const tasksFile = path.join(root, "tasks.json");
  const sessionsFile = path.join(root, "sessions.json");
  const failFile = path.join(root, "probe-fail");
  fs.writeFileSync(
    path.join(stubDir, "openclaw"),
    [
      "#!/bin/bash",
      `printf '%s${SEP.replace(/\n/g, "\\n")}' "$*" >> ${JSON.stringify(capture)}`,
      'case "$1 $2" in',
      `  "tasks list") [ -f ${JSON.stringify(failFile)} ] && { echo "gateway unreachable" >&2; exit 1; }; cat ${JSON.stringify(tasksFile)} ;;`,
      `  "sessions --active") cat ${JSON.stringify(sessionsFile)} ;;`,
      `  "gateway restart") for f in ${JSON.stringify(path.join(orch, "runs"))}/*/engine.log; do echo "--- $f"; cat "$f"; done >> ${JSON.stringify(snapshot)}; echo "Scheduled LaunchAgent restart" ;;`,
      "  *) echo ok ;;",
      "esac",
      "",
    ].join("\n")
  );
  fs.chmodSync(path.join(stubDir, "openclaw"), 0o755);

  const env = {
    ...process.env,
    PATH: `${stubDir}:${process.env.PATH}`,
    FACTORY_RUN_NO_PREFLIGHT: "1",
  };
  const sb = { root, orch, rig, git, commitFile, env, capture, snapshot, tasksFile, sessionsFile, failFile };
  gatewayIdle(sb);
  return sb;
}

function gatewayIdle(sb) {
  fs.rmSync(sb.failFile, { force: true });
  fs.writeFileSync(sb.tasksFile, JSON.stringify({ count: 0, tasks: [] }));
  fs.writeFileSync(sb.sessionsFile, JSON.stringify({ sessions: [] }));
}

function gatewayCronRunning(sb) {
  gatewayIdle(sb);
  fs.writeFileSync(
    sb.tasksFile,
    JSON.stringify({
      count: 1,
      tasks: [{ taskId: "t1", runtime: "cron", label: "factory-standup-cutoff", status: "running", startedAt: Date.now() - 4 * 60 * 1000 }],
    })
  );
}

/** An awaiting-merge run whose PR #n GitHub reports merged at a fresh commit
 *  on local main. Returns {id, runDir, sha}. */
function makeRun(sb, n) {
  const id = `feature-harness-change-${n}`;
  const sha = sb.commitFile(`change-${n}.txt`, `PR #${n} merge`);
  fs.writeFileSync(
    path.join(sb.root, `gh-${n}.json`),
    JSON.stringify({ state: "MERGED", mergedAt: "2026-10-23T10:04:00Z", mergeCommit: { oid: sha }, headRefOid: sha })
  );
  const runDir = path.join(sb.orch, "runs", id);
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(runDir, "run.json"),
    JSON.stringify({
      id,
      workflow: "feature-dev",
      rig: "harness",
      prompt: "harness change",
      auto: false,
      parentRun: null,
      baseBranch: "main",
      branch: `factory/${id}`,
      worktree: path.join(sb.orch, "worktrees", id),
      state: "awaiting-merge",
      stepIndex: 9,
      pr: { number: n, url: `https://github.com/o/r/pull/${n}` },
      createdAt: "2026-10-23T08:00:00.000Z",
      updatedAt: "2026-10-23T09:00:00.000Z",
      history: [],
    })
  );
  return { id, runDir, sha };
}

function engine(sb, args) {
  const res = spawnSync(process.execPath, [path.join(sb.orch, "bin", "factory-run"), ...args], {
    encoding: "utf8",
    env: sb.env,
    timeout: 60_000,
  });
  assert.equal(res.status, 0, `factory-run ${args.join(" ")} failed: ${res.stderr}\n${res.stdout}`);
  return res.stdout;
}

function readRun(r) {
  return JSON.parse(fs.readFileSync(path.join(r.runDir, "run.json"), "utf8"));
}

function engineLog(r) {
  try {
    return fs.readFileSync(path.join(r.runDir, "engine.log"), "utf8");
  } catch {
    return "";
  }
}

/** Captured openclaw argv strings, in call order. */
function calls(sb) {
  try {
    return fs.readFileSync(sb.capture, "utf8").split(SEP).filter((s) => s.trim());
  } catch {
    return [];
  }
}

const restarts = (sb) => calls(sb).filter((c) => c.startsWith("gateway restart"));
const sends = (sb) => calls(sb).filter((c) => c.startsWith("message send"));

function snapshotAtRestart(sb) {
  try {
    return fs.readFileSync(sb.snapshot, "utf8");
  } catch {
    return "";
  }
}

test("(a) busy gateway at sync: run is done, restart deferred and persisted; (b) idle pass restarts once per rig", (t) => {
  const sb = makeSandbox(t);
  const r1 = makeRun(sb, 11);
  const r2 = makeRun(sb, 12);
  gatewayCronRunning(sb);

  engine(sb, ["sync", r1.id]);
  engine(sb, ["sync", r2.id]);
  for (const r of [r1, r2]) {
    const run = readRun(r);
    assert.equal(run.state, "done");
    assert.equal(run.pendingHarnessRestart.sha, r.sha);
    assert.equal(run.pendingHarnessRestart.approved, false);
    assert.equal(run.pendingHarnessRestart.attempts, 1);
    assert.match(run.pendingHarnessRestart.reason, /factory-standup-cutoff \(cron\)/);
    const logText = engineLog(r);
    assert.match(logText, /sync: PR #\d+ merged -> done \(Harness restart deferred: .*factory-standup-cutoff/);
    assert.match(logText, /factory-run harness-restart/);
  }
  assert.equal(restarts(sb).length, 0, "no gateway restart while a task runs");
  const tada = sends(sb).filter((c) => c.includes(":tada:"));
  assert.equal(tada.length, 2);
  for (const m of tada) {
    assert.match(m, /Harness restart deferred/);
    assert.match(m, /reconcile pass/);
    assert.match(m, /factory-run harness-restart/);
  }

  // Still busy: the follow-up pass defers, bumps attempts, exits 0.
  const busyOut = engine(sb, ["harness-restart"]);
  assert.match(busyOut, /harness-restart harness: deferred \(2 pending/);
  assert.equal(busyOut.trim().split("\n").filter((l) => l.startsWith("harness-restart ")).length, 1, "one line per rig");
  assert.equal(readRun(r1).pendingHarnessRestart.attempts, 2);
  assert.equal(restarts(sb).length, 0);

  // (b) Idle: exactly one restart covers both runs.
  gatewayIdle(sb);
  engine(sb, ["harness-restart"]);
  assert.equal(restarts(sb).length, 1, "one gateway restart per rig");
  for (const r of [r1, r2]) {
    assert.equal(readRun(r).pendingHarnessRestart, undefined);
    assert.match(engineLog(r), /harness restart applied \(deferred since /);
  }
  const snap = snapshotAtRestart(sb);
  for (const r of [r1, r2]) {
    assert.match(snap, new RegExp(`harness restart applied \\(deferred since [^;]+; merge ${r.sha.slice(0, 12)}\\)`));
  }
  assert.match(snap, /harness-restart: restarting gateway \(merge /);

  // Nothing left: steady line, no further restart.
  assert.match(engine(sb, ["harness-restart"]), /^harness-restart: nothing pending$/m);
  assert.equal(restarts(sb).length, 1);
});

test("(c) a Slack session touched 30s ago defers the sync-time restart", (t) => {
  const sb = makeSandbox(t);
  const r = makeRun(sb, 21);
  fs.writeFileSync(
    sb.sessionsFile,
    JSON.stringify({ sessions: [{ key: "agent:main:slack:channel:c0test", kind: "group", updatedAt: Date.now() - 30_000, ageMs: 30_000 }] })
  );
  engine(sb, ["sync", r.id]);
  const run = readRun(r);
  assert.equal(run.state, "done");
  assert.equal(run.pendingHarnessRestart.sha, r.sha);
  assert.match(run.pendingHarnessRestart.reason, /session agent:main:slack:channel:c0test active/);
  assert.equal(restarts(sb).length, 0);
});

test("(d) a probe that exits non-zero defers (fail closed)", (t) => {
  const sb = makeSandbox(t);
  const r = makeRun(sb, 31);
  fs.writeFileSync(sb.failFile, "1");
  engine(sb, ["sync", r.id]);
  const run = readRun(r);
  assert.equal(run.state, "done");
  assert.match(run.pendingHarnessRestart.reason, /gateway idleness unknown \(probe failed\)/);
  assert.equal(restarts(sb).length, 0);
});

test("(e) policy.deploy hold defers until --approve, even when idle", (t) => {
  const sb = makeSandbox(t, { policy: { merge: "review", deploy: "hold" } });
  const r = makeRun(sb, 41);
  engine(sb, ["sync", r.id]);
  assert.equal(readRun(r).state, "done");
  assert.match(readRun(r).pendingHarnessRestart.reason, /factory-run harness-restart --approve/);
  assert.match(engineLog(r), /factory-run harness-restart --approve/);
  assert.equal(restarts(sb).length, 0);

  const plain = engine(sb, ["harness-restart"]);
  assert.match(plain, /deferred .*--approve/);
  assert.equal(restarts(sb).length, 0);

  // --dry-run --approve: decision only, nothing written, nothing restarted.
  const before = fs.readFileSync(path.join(r.runDir, "run.json"), "utf8");
  assert.match(engine(sb, ["harness-restart", "--approve", "--dry-run"]), /would-restart/);
  assert.equal(fs.readFileSync(path.join(r.runDir, "run.json"), "utf8"), before);
  assert.equal(restarts(sb).length, 0);

  engine(sb, ["harness-restart", "--approve"]);
  assert.equal(restarts(sb).length, 1);
  assert.equal(readRun(r).pendingHarnessRestart, undefined);
});

test("(f) idle at sync: restart runs only after the sync log line and the :tada: notify", (t) => {
  const sb = makeSandbox(t);
  const r = makeRun(sb, 51);
  engine(sb, ["sync", r.id]);
  const run = readRun(r);
  assert.equal(run.state, "done");
  assert.equal(run.pendingHarnessRestart, undefined);
  assert.equal(restarts(sb).length, 1);

  const order = calls(sb);
  const tadaAt = order.findIndex((c) => c.startsWith("message send") && c.includes(":tada:"));
  const restartAt = order.findIndex((c) => c.startsWith("gateway restart"));
  assert.ok(tadaAt !== -1 && tadaAt < restartAt, `notify must precede restart: ${JSON.stringify(order)}`);

  const snap = snapshotAtRestart(sb);
  assert.match(snap, /sync: PR #51 merged -> done \(harness restart: gateway idle — restarting now/);
  assert.match(snap, /notified Slack: :tada:/);
  assert.match(snap, /harness-restart: restarting gateway \(merge /);
});

test("a deferral older than 24h escalates once per 24h and never forces a restart", (t) => {
  const sb = makeSandbox(t);
  const r = makeRun(sb, 61);
  gatewayCronRunning(sb);
  engine(sb, ["sync", r.id]);
  const run = readRun(r);
  run.pendingHarnessRestart.deferredAt = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
  fs.writeFileSync(path.join(r.runDir, "run.json"), JSON.stringify(run));

  engine(sb, ["harness-restart"]);
  engine(sb, ["harness-restart"]);
  const esc = sends(sb).filter((c) => c.includes("harness restart for merge"));
  assert.equal(esc.length, 1, "deduped by escalatedAt");
  assert.match(esc[0], new RegExp(`Run ${r.id}`));
  assert.match(esc[0], new RegExp(r.sha.slice(0, 12)));
  assert.match(esc[0], /deferred 25h/);
  assert.match(esc[0], /factory-run harness-restart --approve/);
  assert.match(esc[0], /openclaw tasks audit/);
  assert.ok(readRun(r).pendingHarnessRestart.escalatedAt);
  assert.equal(restarts(sb).length, 0);
});
