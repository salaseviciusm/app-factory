/*
 * Founder-gate parking integration test for bin/factory-run (offline: stubbed
 * `claude` and `openclaw` on PATH, preflight skipped, scratch rig + workflows
 * in a throwaway sandbox orchestration dir — same harness as
 * cancel-run.test.mjs, plus a capturing openclaw stub so notify() traffic is
 * assertable).
 *
 * Pins the founder direction of 2026-08-11 — gates must NEVER die on an idle
 * timeout:
 *  - a discussion gate parked with no founder activity far past the old
 *    240-minute budget stays `awaiting-approval` (no idle-timeout outcome,
 *    no decision file written) and is still resolvable by `approve`;
 *  - the parked gate re-pings Slack on the reminder cadence — naming the run,
 *    the step, the approve command, and its age — exactly once per due
 *    reminder, with no countdown-to-death language;
 *  - `status` surfaces the open gate with its age;
 *  - retrying a run that previously died the old idle-timeout death resumes
 *    it to `awaiting-approval` with a FRESH clock (never re-failed by the
 *    stale turn-file mtime — the 2ms-death regression) and re-posts the gate
 *    to Slack so it is never invisible.
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
const TEN_HOURS_MS = 10 * 60 * 60 * 1000; // far past the removed 240m budget

function makeSandbox(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "factory-discussion-test-"));
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
  git("config", "user.email", "discussion-test@example.invalid");
  git("config", "user.name", "Discussion Test");
  fs.writeFileSync(path.join(rig, "README.md"), "scratch rig\n");
  git("add", "README.md");
  git("commit", "-q", "-m", "init");

  // Notifications stay ENABLED (unlike cancel-run.test.mjs): the gate posts,
  // resume re-posts, and reminders are the contract under test. The capturing
  // openclaw stub below receives them.
  fs.writeFileSync(
    path.join(orch, "rigs.json"),
    JSON.stringify(
      {
        rigs: { scratch: { path: rig, defaultBranch: "main", setup: [] } },
        notify: { channel: "slack", to: "test-target" },
      },
      null,
      2
    )
  );
  fs.writeFileSync(path.join(orch, "prompts", "stub.md"), "Stub discussion turn: {{PROMPT}}\n\n{{DISCUSSION}}\n");
  fs.writeFileSync(
    path.join(orch, "workflows", "discussion-test.json"),
    JSON.stringify({
      name: "discussion-test",
      steps: [
        { id: "plan-discussion", type: "discussion", prompt: "stub", maxTurns: 8, timeoutMinutes: 5 },
        { id: "after", type: "manual", note: "runs only after the founder resolves the gate" },
      ],
    })
  );

  // Stub claude: instantly emits one stream-json result event (the turn text).
  const stubDir = path.join(root, "stubbin");
  fs.mkdirSync(stubDir);
  fs.writeFileSync(
    path.join(stubDir, "claude"),
    `#!/bin/bash\nprintf '{"type":"result","result":"Proposed plan: stub turn. Questions for the founder?"}\\n'\n`
  );
  fs.chmodSync(path.join(stubDir, "claude"), 0o755);
  // Stub openclaw: capture every invocation's argv (message included) so the
  // test can assert exactly what the founder would have seen in Slack.
  const notifyLog = path.join(root, "openclaw.log");
  fs.writeFileSync(
    path.join(stubDir, "openclaw"),
    `#!/bin/bash\nprintf '%s\\n===MSG===\\n' "$*" >> ${JSON.stringify(notifyLog)}\n`
  );
  fs.chmodSync(path.join(stubDir, "openclaw"), 0o755);

  const env = {
    ...process.env,
    PATH: `${stubDir}:${process.env.PATH}`,
    FACTORY_RUN_NO_PREFLIGHT: "1",
  };
  return { root, orch, env, notifyLog };
}

function engine(sb, args) {
  return spawnSync(process.execPath, [path.join(sb.orch, "bin", "factory-run"), ...args], {
    encoding: "utf8",
    env: sb.env,
    timeout: 60_000,
  });
}

function runJsonPath(sb, id) {
  return path.join(sb.orch, "runs", id, "run.json");
}

function readRun(sb, id) {
  return JSON.parse(fs.readFileSync(runJsonPath(sb, id), "utf8"));
}

function runDir(sb, id) {
  return path.join(sb.orch, "runs", id);
}

/** Captured openclaw invocations, one entry per send. */
function notifications(sb) {
  try {
    return fs.readFileSync(sb.notifyLog, "utf8").split("\n===MSG===\n").filter((s) => s.trim());
  } catch {
    return [];
  }
}

function reminders(sb) {
  return notifications(sb).filter((n) => n.includes("still awaiting founder review"));
}

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

function groupAlive(pid) {
  if (!Number.isInteger(pid) || pid < 2) return false;
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

function startRun(sb, t) {
  const start = engine(sb, ["start", "--rig", "scratch", "--workflow", "discussion-test", "--prompt", "exercise the parked gate"]);
  assert.equal(start.status, 0, `start failed: ${start.stderr}`);
  const id = start.stdout.trim().split("\n").pop();
  assert.ok(id, "start printed a run id");
  t.after(() => killGroup(execPid(sb, id)));
  return id;
}

/** Backdate the gate's whole clock (turn-file mtime + persisted floor) so the
 *  live wait loop sees a gate that has been quiet for `ms`. */
function backdateGate(sb, id, ms) {
  const dir = runDir(sb, id);
  const past = new Date(Date.now() - ms);
  fs.utimesSync(path.join(dir, "plan-discussion.output.json"), past, past);
  fs.writeFileSync(path.join(dir, "discussion-clock.json"), JSON.stringify({ startedAt: past.toISOString() }, null, 2) + "\n");
}

test("a parked discussion gate never times out, re-pings on the reminder cadence, and stays approvable", async (t) => {
  const sb = makeSandbox(t);
  const id = startRun(sb, t);

  await waitFor(() => readRun(sb, id).state === "awaiting-approval", "discussion gate to post");
  assert.ok(
    notifications(sb).some((n) => n.includes(id) && n.includes("turn 1/8")),
    "the opening turn reached Slack"
  );

  // Park the gate 10 hours deep — 2.5× the removed 240-minute budget.
  backdateGate(sb, id, TEN_HOURS_MS);

  // The live wait loop (15s poll) must now send the one due reminder.
  await waitFor(() => reminders(sb).length > 0, "the overdue-gate reminder", 45_000);
  const reminder = reminders(sb)[0];
  assert.ok(reminder.includes(id), "reminder names the run id");
  assert.ok(reminder.includes("plan-discussion"), "reminder names the step");
  assert.ok(reminder.includes(`factory-run approve ${id}`), "reminder carries the approve command");
  assert.match(reminder, /waiting 10h/, "reminder states the gate's age");
  assert.ok(reminder.includes("wait indefinitely"), "reminder says the run waits, with no deadline");
  assert.doesNotMatch(reminder, /times? out|timeout|expire/i, "no countdown-to-death language");

  // No guillotine: far past the old budget the run is still parked, with no
  // outcome written and no decision fabricated.
  assert.equal(readRun(sb, id).state, "awaiting-approval", "gate must never idle-timeout");
  assert.ok(!fs.existsSync(path.join(runDir(sb, id), "discussion-outcome.json")), "no outcome written while parked");
  assert.ok(!fs.existsSync(path.join(runDir(sb, id), "gate-decision.json")), "reminders never fabricate a decision");

  // Exactly once per due reminder: outlive another poll cycle and re-count.
  await new Promise((r) => setTimeout(r, 20_000));
  assert.equal(reminders(sb).length, 1, "the same due reminder is never re-sent");
  assert.equal(readRun(sb, id).state, "awaiting-approval", "still parked after further polls");

  // status surfaces the open gate with its AGE (never a time-to-timeout).
  const statusJson = engine(sb, ["status", id, "--json"]);
  assert.equal(statusJson.status, 0, `status --json failed: ${statusJson.stderr}`);
  const [entry] = JSON.parse(statusJson.stdout);
  assert.equal(entry.gate.kind, "discussion");
  assert.ok(entry.gate.waitingMs > 9 * 60 * 60 * 1000, "gate age is machine-readable and ~10h");
  assert.ok(entry.gate.since, "gate.since is set");
  assert.equal(entry.gate.timeoutAt, undefined, "no deadline field exists — gates do not expire");
  const statusHuman = engine(sb, ["status"]);
  assert.equal(statusHuman.status, 0);
  assert.match(statusHuman.stdout, /gate: discussion — awaiting founder for 10h/, "human status lists the open gate with its age");

  // The founder veto/approval still resolves the long-parked gate.
  assert.equal(engine(sb, ["approve", id]).status, 0);
  await waitFor(() => ["done", "awaiting-merge"].includes(readRun(sb, id).state), "approved run to finish", 40_000);
  const outcome = JSON.parse(fs.readFileSync(path.join(runDir(sb, id), "discussion-outcome.json"), "utf8"));
  assert.equal(outcome.outcome, "go-ahead");
});

test("retrying a run the old idle timeout killed resumes it visibly with a fresh clock", async (t) => {
  const sb = makeSandbox(t);
  const id = startRun(sb, t);

  await waitFor(() => readRun(sb, id).state === "awaiting-approval", "discussion gate to post");
  const firstExecutor = execPid(sb, id);
  killGroup(firstExecutor);
  await waitFor(() => !groupAlive(firstExecutor), "executor to die");

  // Prime the run as an old-world idle-timeout corpse: state failed, the
  // outcome file written, and every on-disk clock artifact 10 hours stale —
  // exactly what poisoned feature-jittery-compass-driven-map's resume into
  // re-failing 2ms after requeue.
  backdateGate(sb, id, TEN_HOURS_MS);
  fs.writeFileSync(
    path.join(runDir(sb, id), "discussion-outcome.json"),
    JSON.stringify({ outcome: "idle-timeout", turns: 1, at: new Date(Date.now() - TEN_HOURS_MS).toISOString() }, null, 2)
  );
  const corpse = readRun(sb, id);
  corpse.state = "failed";
  corpse.history.push({
    state: "failed",
    detail: "discussion idle timeout hit (240 minutes with no founder activity) — failing loudly, never auto-approving",
    at: new Date().toISOString(),
  });
  fs.writeFileSync(runJsonPath(sb, id), JSON.stringify(corpse, null, 2));

  const retryAt = Date.now();
  const retry = engine(sb, ["retry", id]);
  assert.equal(retry.status, 0, `retry failed: ${retry.stderr}`);
  assert.match(retry.stdout, /resume tier/, "first retry at the step plain-resumes");
  t.after(() => killGroup(execPid(sb, id)));

  await waitFor(() => readRun(sb, id).state === "awaiting-approval", "resumed gate to park awaiting-approval", 40_000);

  // The resumed gate is visible: the resume re-posted the conversation.
  assert.ok(
    notifications(sb).some((n) => n.includes(id) && n.includes("re-opened at turn 1/8")),
    "resume re-posts the gate to Slack"
  );
  // Fresh clock floor: stamped at resume, not inherited from the stale mtime.
  const clock = JSON.parse(fs.readFileSync(path.join(runDir(sb, id), "discussion-clock.json"), "utf8"));
  assert.ok(Date.parse(clock.startedAt) >= retryAt - 60_000, "resume stamped a fresh clock floor");

  // The 2ms-death regression: outlive several poll cycles — the resumed gate
  // must still be parked (never re-failed by the stale artifacts), and the
  // fresh clock means no reminder is due yet either.
  await new Promise((r) => setTimeout(r, 20_000));
  const resumed = readRun(sb, id);
  assert.equal(resumed.state, "awaiting-approval", "resumed gate stays parked — no re-fail from stale timestamps");
  assert.equal(reminders(sb).length, 0, "fresh clock: no reminder due right after resume");

  // And it is genuinely resumable: approve completes the run.
  assert.equal(engine(sb, ["approve", id]).status, 0);
  await waitFor(() => ["done", "awaiting-merge"].includes(readRun(sb, id).state), "approved run to finish", 40_000);
  const outcome = JSON.parse(fs.readFileSync(path.join(runDir(sb, id), "discussion-outcome.json"), "utf8"));
  assert.equal(outcome.outcome, "go-ahead", "the stale idle-timeout outcome is overwritten by the real resolution");
});
