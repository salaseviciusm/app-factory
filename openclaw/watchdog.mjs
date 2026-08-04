#!/usr/bin/env node
/*
 * watchdog.mjs — Slack connectivity watchdog: an end-to-end liveness check that
 * runs OUTSIDE the gateway (launchd LaunchAgent, see setup-watchdog.sh), because a
 * watchdog scheduled by the process it watches can't recover that process.
 *
 * Why: twice in two days (2026-08-03/04) the gateway's Socket Mode connection went
 * zombie — `openclaw status` said "connected, healthy" while the bot was deaf. The
 * watchdog therefore NEVER consults `openclaw status`; every verdict comes from
 * behavioral evidence: the gateway's own log lines and a real probe send.
 *
 * Two-tier check (so the probe channel isn't spammed when things are fine):
 *   Tier 1 (passive): newest `Inbound … slack:` event in the gateway log. Fresh
 *     inbound traffic proves the socket end-to-end — exit 0, nothing sent.
 *   Tier 2 (active, only when tier 1 is stale/inconclusive):
 *     a. Probe send: `openclaw message send --channel slack --target channel:<id>
 *        --message … --json` to ${FACTORY_WATCHDOG_CHANNEL}. A network-down failure
 *        (ENOTFOUND slack.com et al., the 08-04 signature) is classified as an
 *        OUTAGE: no restart (it can't fix a dead network), exit 3.
 *     b. Gateway socket-state verdict from the log (signatures live-verified, see
 *        below): if the newest socket lifecycle event is a failure with no
 *        subsequent "connected" and the failure streak is older than a grace
 *        window — or the gateway process is gone — the socket is WEDGED.
 *   Recovery: `openclaw gateway restart` (the known fix), poll the log for a fresh
 *   "slack socket mode connected", re-probe, then post one recovery notice to
 *   ${FACTORY_BUILDS_CHANNEL}. A state file caps restarts at one per 30 minutes.
 *
 * Live-test evidence for the chosen tier-2 signal (2026-08-04, OpenClaw 2026.7.1-2):
 *   - The plan's preferred signal — "gateway log shows the probe's send confirmation
 *     with matching message ID" — does NOT exist for CLI sends: `openclaw message
 *     send` is handled by core with payload `via: "direct"` (bypasses the gateway);
 *     a live probe (messageId 1785872860.752439, --json stdout) left ZERO lines in
 *     /tmp/openclaw/openclaw-2026-08-04.log. The `✅ Sent via Slack. Message ID: …`
 *     lines there are gateway-origin deliveries only.
 *   - No inbound self-echo exists either: Bolt drops the bot's own messages, so a
 *     bot-authored probe can never appear as an `Inbound …` event (verified: no
 *     Inbound line for any of the day's sends, including the live probe).
 *   - What the log DOES emit (all live-observed): `Inbound app_mention slack:T…`,
 *     `slack socket mode connected`, `slack socket disconnected (…); reconnecting`,
 *     `slack socket mode failed to start; retry N/∞ …`, `socket-mode:socket-mode
 *     Failed to retrieve a new WSS URL …`, `socket-mode:socket-mode http request
 *     failed getaddrinfo ENOTFOUND slack.com`. Both real incidents produced loud,
 *     persistent failure streaks of exactly these signatures — that is the wedge
 *     detector. Known limitation: a totally silent zombie (socket dead, log clean)
 *     is undetectable from outside with a single bot identity; probes can't echo.
 *   - This watchdog deliberately matches NO `health-monitor:` lines — the gateway's
 *     internal flap-loop detector is owned by a separate bug-fix run.
 *
 * Usage:
 *   node watchdog.mjs               one full check; may restart/notify
 *   node watchdog.mjs --check-only  tiers 1–2 only; never restarts, never posts
 *
 * Exit codes: 0 healthy (or recovered) · 1 unhealthy (wedged/cooldown/probe or
 * restart failure) · 2 configuration error · 3 network outage (stand down).
 *
 * Files: gateway log /tmp/openclaw/openclaw-<YYYY-MM-DD>.log (local date; previous
 * day's file is also read to survive rotation), decisions appended to
 * /tmp/openclaw/watchdog.log, cooldown state in /tmp/openclaw/watchdog-state.json.
 * Channel IDs resolve from env or openclaw/secrets.env — never hardcoded.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
// Override only for testing against synthetic logs; production is /tmp/openclaw.
const OPENCLAW_TMP = process.env.WATCHDOG_OPENCLAW_DIR || "/tmp/openclaw";
const WATCHDOG_LOG = path.join(OPENCLAW_TMP, "watchdog.log");
const STATE_FILE = path.join(OPENCLAW_TMP, "watchdog-state.json");

// Tunables (env-overridable; seconds).
const INBOUND_FRESH_S = num("WATCHDOG_INBOUND_FRESH_SECONDS", 900);
const FAILURE_GRACE_S = num("WATCHDOG_FAILURE_GRACE_SECONDS", 180);
const RESTART_COOLDOWN_S = num("WATCHDOG_RESTART_COOLDOWN_SECONDS", 1800);
const RECONNECT_TIMEOUT_S = num("WATCHDOG_RECONNECT_TIMEOUT_SECONDS", 90);

// Gateway-log signatures (live-verified 2026-08-04 — see header).
const reInbound = /^Inbound \S+ slack:/;
const reSocketConnected = /slack socket mode connected/;
const reSocketFailures = [
  /slack socket disconnected/,
  /slack socket mode failed to start/,
  /Failed to retrieve a new WSS URL/,
  /socket-mode http request failed/,
];
// Probe failures that mean "the network is down", not "the gateway is sick".
const reNetworkDown = /ENOTFOUND|EAI_AGAIN|ENETDOWN|ENETUNREACH|EHOSTUNREACH|ETIMEDOUT/;

function num(key, dflt) {
  const v = Number(process.env[key]);
  return Number.isFinite(v) && v > 0 ? v : dflt;
}

function nowIso() {
  return new Date().toISOString();
}

fs.mkdirSync(OPENCLAW_TMP, { recursive: true });

/** Every decision goes to stdout (launchd captures it) AND /tmp/openclaw/watchdog.log. */
function wlog(event, detail) {
  const line = `${nowIso()} ${event}${detail ? `: ${detail}` : ""}`;
  console.log(line);
  try {
    fs.appendFileSync(WATCHDOG_LOG, line + "\n");
  } catch {}
}

// ---------- config (mirrors factory-run's resolver: env, then openclaw/secrets.env) ----------

let _secretsEnv = null;
function envVar(key) {
  if (process.env[key]) return process.env[key];
  if (_secretsEnv === null) {
    _secretsEnv = {};
    const p = path.join(SCRIPT_DIR, "secrets.env");
    if (fs.existsSync(p)) {
      for (const line of fs.readFileSync(p, "utf8").split("\n")) {
        const m = line.match(/^(\w+)=(.*)$/);
        if (m) _secretsEnv[m[1]] = m[2];
      }
    }
  }
  return _secretsEnv[key] || "";
}

function requireChannel(key) {
  const v = envVar(key);
  if (!v || v.includes("REPLACE")) {
    wlog("config-error", `${key} is not set — fill it in openclaw/secrets.env or the environment`);
    process.exit(2);
  }
  return v;
}

// ---------- gateway log reading ----------

function localDateStr(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Parse today's gateway log plus the previous day's (rotation happens at local
 * midnight; a connection established yesterday only shows lifecycle lines there).
 * Malformed/partial JSON lines are skipped, never fatal.
 */
function readGatewayLog() {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 3600 * 1000);
  const entries = [];
  for (const d of [yesterday, today]) {
    const file = path.join(OPENCLAW_TMP, `openclaw-${localDateStr(d)}.log`);
    let raw;
    try {
      raw = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const line of raw.split("\n")) {
      if (!line) continue;
      let obj;
      try {
        obj = JSON.parse(line);
      } catch {
        continue;
      }
      const t = Date.parse(obj.time || (obj._meta && obj._meta.date) || "");
      if (!Number.isFinite(t)) continue;
      entries.push({ t, msg: String(obj.message ?? obj["0"] ?? "") });
    }
  }
  return entries;
}

// ---------- verdicts ----------

/** Tier 1: fresh inbound Slack traffic proves the socket end-to-end. */
function newestInbound(entries) {
  let newest = null;
  for (const e of entries) {
    if (reInbound.test(e.msg) && (!newest || e.t > newest.t)) newest = e;
  }
  return newest;
}

/** OS-level fact, not gateway self-reporting: is a gateway process alive at all? */
function gatewayProcessRunning() {
  const r = spawnSync("pgrep", ["-f", "openclaw.* gateway"], { encoding: "utf8" });
  return r.status === 0;
}

/**
 * Tier 2b: socket-state verdict from log evidence. Wedged = the newest socket
 * lifecycle event is a failure, nothing reconnected after it, and the failure
 * streak has outlived the reconnect grace window (normal blips resolve in
 * seconds; both incidents ran for hours). No failure lines at all = no evidence
 * of trouble (a connection that predates both log files logs nothing — healthy).
 */
function assessSocket(entries) {
  if (!gatewayProcessRunning()) {
    return { wedged: true, reason: "no gateway process found (pgrep)" };
  }
  let lastConn = 0;
  let lastFail = null;
  for (const e of entries) {
    if (reSocketConnected.test(e.msg)) lastConn = Math.max(lastConn, e.t);
    else if (reSocketFailures.some((re) => re.test(e.msg)) && (!lastFail || e.t > lastFail.t)) lastFail = e;
  }
  if (!lastFail || lastFail.t < lastConn) {
    return { wedged: false, reason: lastConn ? `socket connected since ${new Date(lastConn).toISOString()}` : "no socket failures on record" };
  }
  let streakStart = lastFail.t;
  for (const e of entries) {
    if (e.t > lastConn && e.t < streakStart && reSocketFailures.some((re) => re.test(e.msg))) streakStart = e.t;
  }
  const streakAgeS = Math.round((Date.now() - streakStart) / 1000);
  if (streakAgeS < FAILURE_GRACE_S) {
    return { wedged: false, reason: `failure streak only ${streakAgeS}s old — reconnect may be in progress` };
  }
  return {
    wedged: true,
    reason: `socket failing since ${new Date(streakStart).toISOString()} (${streakAgeS}s) with no reconnect; last: ${lastFail.msg.slice(0, 120)}`,
  };
}

// ---------- Slack sends (probe + recovery notice share one argv builder) ----------

function sendArgs(channelId, text) {
  return ["message", "send", "--channel", "slack", "--target", `channel:${channelId}`, "--message", text, "--json"];
}

/** Returns { ok, messageId } | { ok:false, outage:true } | { ok:false, error }. */
function slackSend(channelId, text) {
  const r = spawnSync("openclaw", sendArgs(channelId, text), {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    timeout: 60_000,
    killSignal: "SIGKILL",
  });
  if (r.error && r.error.code === "ENOENT") return { ok: false, error: "openclaw CLI not found in PATH" };
  const out = `${r.stdout || ""}\n${r.stderr || ""}`;
  let messageId = null;
  try {
    messageId = JSON.parse(r.stdout).messageId || null;
  } catch {
    const m = out.match(/"messageId"\s*:\s*"([^"]+)"/);
    if (m) messageId = m[1];
  }
  if (r.status === 0 && messageId) return { ok: true, messageId };
  if (reNetworkDown.test(out) || (r.error && reNetworkDown.test(String(r.error.code)))) {
    return { ok: false, outage: true, error: (out.match(/.*(ENOTFOUND|EAI_AGAIN|ENETDOWN|ENETUNREACH|EHOSTUNREACH|ETIMEDOUT)[^\n]*/) || [out])[0].trim().slice(0, 200) };
  }
  return { ok: false, error: out.trim().slice(0, 200) || `exit ${r.status}` };
}

// ---------- state (restart cooldown) ----------

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeState(patch) {
  const next = { ...readState(), ...patch };
  const tmp = STATE_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2) + "\n");
  fs.renameSync(tmp, STATE_FILE);
}

// ---------- main ----------

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  console.log("Usage: watchdog.mjs [--check-only]   (see header comment for the full contract)");
  process.exit(0);
}
const checkOnly = argv.includes("--check-only");

const watchdogChannel = requireChannel("FACTORY_WATCHDOG_CHANNEL");
const buildsChannel = requireChannel("FACTORY_BUILDS_CHANNEL");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const detectIso = nowIso();
  const entries = readGatewayLog();

  // Tier 1 — passive: fresh inbound traffic settles it, nothing is sent.
  const inbound = newestInbound(entries);
  const inboundAgeS = inbound ? Math.round((Date.now() - inbound.t) / 1000) : null;
  if (inbound && inboundAgeS <= INBOUND_FRESH_S) {
    wlog("tier1-healthy", `inbound event ${inboundAgeS}s ago (${inbound.msg.slice(0, 80)})`);
    return 0;
  }
  wlog("tier1-stale", inbound ? `newest inbound event ${inboundAgeS}s ago` : "no inbound events in today's or yesterday's log");

  // Tier 2a — active probe. Proves network + Slack API + bot token from outside
  // the gateway, and separates "network is down" from "gateway is wedged".
  const probe = slackSend(watchdogChannel, `🩺 watchdog probe ${detectIso} (automated liveness check)`);
  if (probe.outage) {
    wlog("outage", `probe send hit a network-down signature — standing down, no restart (${probe.error})`);
    writeState({ lastOutageAt: nowIso() });
    return 3;
  }
  if (!probe.ok) {
    // The CLI sends directly to Slack (gateway-independent, see header), so a
    // non-network failure here is a token/Slack problem a restart cannot fix.
    wlog("probe-failed", `openclaw message send failed (not a network signature): ${probe.error}`);
    return 1;
  }
  wlog("probe-sent", `message ${probe.messageId} -> watchdog channel`);

  // Tier 2b — gateway socket-state verdict from log evidence.
  const socket = assessSocket(entries);
  if (!socket.wedged) {
    wlog("tier2-healthy", `inbound stale but probe delivered and ${socket.reason}`);
    return 0;
  }
  wlog("wedged", socket.reason);

  if (checkOnly) {
    wlog("check-only", "wedged verdict — skipping restart and notices");
    return 1;
  }

  // Recovery — restart, but never more than once per cooldown window.
  const state = readState();
  const sinceRestartS = state.lastRestartAt ? (Date.now() - Date.parse(state.lastRestartAt)) / 1000 : Infinity;
  if (sinceRestartS < RESTART_COOLDOWN_S) {
    wlog("cooldown-skip", `still wedged but last restart was ${Math.round(sinceRestartS)}s ago (< ${RESTART_COOLDOWN_S}s) — not restarting`);
    return 1;
  }

  const restartIso = nowIso();
  writeState({ lastRestartAt: restartIso });
  wlog("restart", "running `openclaw gateway restart`");
  const restart = spawnSync("openclaw", ["gateway", "restart"], {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    timeout: 180_000,
    killSignal: "SIGKILL",
  });
  if (restart.status !== 0) {
    wlog("restart-failed", `exit ${restart.status}: ${(restart.stderr || restart.stdout || "").trim().slice(0, 200)}`);
    return 1;
  }

  // Re-verify: a fresh "slack socket mode connected" line, then a second probe.
  const restartAtMs = Date.parse(restartIso);
  let reconnected = null;
  const deadline = Date.now() + RECONNECT_TIMEOUT_S * 1000;
  while (Date.now() < deadline && !reconnected) {
    await sleep(5000);
    reconnected = readGatewayLog().find((e) => e.t >= restartAtMs && reSocketConnected.test(e.msg)) || null;
  }
  if (!reconnected) {
    wlog("reverify-failed", `no "slack socket mode connected" within ${RECONNECT_TIMEOUT_S}s of restart — will retry next tick (cooldown permitting)`);
    return 1;
  }
  const reprobe = slackSend(watchdogChannel, `🩺 watchdog post-restart probe ${nowIso()}`);
  if (!reprobe.ok) {
    wlog("reverify-failed", `socket reconnected but post-restart probe failed: ${reprobe.error}`);
    return 1;
  }
  wlog("recovered", `socket reconnected at ${new Date(reconnected.t).toISOString()}, post-restart probe ${reprobe.messageId}`);

  const notice = slackSend(
    buildsChannel,
    `🩺 Slack watchdog: the gateway's Socket Mode connection was wedged (detected ${detectIso}, ` +
      `${socket.reason}). Ran \`openclaw gateway restart\` at ${restartIso}; connection re-verified. ` +
      `Details: /tmp/openclaw/watchdog.log`
  );
  if (notice.ok) {
    wlog("notice-posted", `recovery notice ${notice.messageId} -> builds channel`);
    writeState({ lastNoticeAt: nowIso() });
  } else {
    wlog("notice-failed", notice.error);
  }
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    wlog("watchdog-error", String((err && err.stack) || err).slice(0, 300));
    process.exit(1);
  }
);
