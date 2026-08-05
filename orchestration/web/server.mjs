#!/usr/bin/env node
/*
 * Factory web console server — zero npm dependencies (node:http, node:sqlite,
 * node:fs, node:child_process). Serves the built frontend from frontend/dist
 * and a token-gated JSON API over the orchestration layer.
 *
 * Reads:  orchestration/runs/<id>/run.json, telemetry.db (read-only),
 *         workflows/*.json, rigs.json (served verbatim — ${VAR} placeholders
 *         stay unresolved; openclaw/secrets.env is never read).
 * Writes: nothing directly — every mutation shells out to bin/factory-run
 *         (start/approve/reject/steer/cancel/resume/cleanup --discard) via
 *         execFile with an args array.
 *
 * Access model: binds 127.0.0.1 by default. For phone access keep the loopback
 * bind and put `tailscale serve` in front (TLS + tailnet-only). Binding any
 * non-loopback address requires a pre-existing FACTORY_WEB_TOKEN (env or
 * web/.token) and prints a loud warning. See bin/factory-web for the recipe.
 */
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";

import { listRuns, getRunDetail, readRunLog, readStepDoc, RUN_ID_RE, TERMINAL_STATES } from "./lib/runs.mjs";
import { openTelemetry, usageTotals } from "./lib/db.mjs";
import { contextStorage } from "./lib/storage.mjs";
import {
  loadToken,
  createToken,
  tokenEquals,
  bearerToken,
  isLoopbackHost,
  originAllowed,
  RateLimiter,
  audit,
} from "./lib/security.mjs";

const WEB_DIR = path.dirname(fileURLToPath(import.meta.url));
const ORCH_DIR = path.resolve(WEB_DIR, "..");
const DIST_DIR = path.join(WEB_DIR, "frontend", "dist");
const FACTORY_RUN = process.env.FACTORY_WEB_RUN_BIN || path.join(ORCH_DIR, "bin", "factory-run");

const BODY_CAP = 64 * 1024; // JSON body cap for mutations
const MUTATION_LIMIT = new RateLimiter(10, 60 * 1000); // 10 mutations/min per IP
const PROMPT_CAP = 20000;

// ---------- startup: host/port/token ----------

function argOf(argv, flag) {
  const i = argv.indexOf(flag);
  return i !== -1 ? argv[i + 1] : undefined;
}

const argv = process.argv.slice(2);
const HOST = argOf(argv, "--host") || process.env.FACTORY_WEB_HOST || "127.0.0.1";
const PORT = Number(argOf(argv, "--port") || process.env.FACTORY_WEB_PORT || 4620);

let TOKEN = loadToken(WEB_DIR);
if (!isLoopbackHost(HOST)) {
  if (!TOKEN) {
    console.error(
      `refusing to start: binding non-loopback address ${HOST} with no token configured.\n` +
        `Set FACTORY_WEB_TOKEN (or launch once on 127.0.0.1 so bin/factory-web persists one to web/.token).\n` +
        `Recommended instead: keep the default 127.0.0.1 bind and expose via 'tailscale serve'.`
    );
    process.exit(1);
  }
  console.warn(
    `\nWARNING: binding non-loopback address ${HOST} — the console (and its factory-run\n` +
      `mutations) is reachable beyond this machine. Prefer the default 127.0.0.1 bind\n` +
      `with 'tailscale serve' in front (TLS, tailnet-only).\n`
  );
} else if (!TOKEN) {
  TOKEN = createToken(WEB_DIR);
  console.log(
    `\nGenerated FACTORY_WEB_TOKEN (persisted to ${path.join(WEB_DIR, ".token")}, mode 0600).\n` +
      `Paste it into the console's login screen — shown this once:\n\n  ${TOKEN}\n`
  );
}

// ---------- small helpers ----------

function expandHome(p) {
  return p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p;
}

function readJsonFile(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(body);
}

function sendText(res, status, text, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(text);
}

function clientIp(req) {
  return req.socket.remoteAddress || "-";
}

/** Read a request body up to `cap` bytes; rejects with {statusCode:413} beyond it. */
function readBody(req, cap) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > cap) {
        // Pause (don't destroy) so the 413 response can still reach the client;
        // the caller closes the connection after responding.
        req.pause();
        reject({ statusCode: 413, message: `body exceeds ${cap} byte cap` });
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", (err) => reject(err));
  });
}

/** Run bin/factory-run with an args array (no shell). Resolves {ok, stdout, stderr}. */
function factoryRun(args) {
  return new Promise((resolve) => {
    execFile(
      FACTORY_RUN,
      args,
      { timeout: 60 * 1000, maxBuffer: 4 * 1024 * 1024, encoding: "utf8" },
      (err, stdout, stderr) => {
        resolve({ ok: !err, stdout: stdout || "", stderr: stderr || "" });
      }
    );
  });
}

function loadRigsRaw() {
  return fs.readFileSync(path.join(ORCH_DIR, "rigs.json"), "utf8");
}

function listWorkflows() {
  const dir = path.join(ORCH_DIR, "workflows");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJsonFile(path.join(dir, f), null))
    .filter(Boolean);
}

/** Validate a rig name against the registry: rigs.json keys or factory:<app> with an existing dir. */
function rigExists(name) {
  const rigs = readJsonFile(path.join(ORCH_DIR, "rigs.json"), { rigs: {} });
  if (rigs.rigs && Object.prototype.hasOwnProperty.call(rigs.rigs, name)) return true;
  const m = /^factory:([a-z0-9-]+)$/.exec(name);
  if (m && rigs.factoryApps && rigs.factoryApps.basePath) {
    return fs.existsSync(path.join(expandHome(rigs.factoryApps.basePath), m[1]));
  }
  return false;
}

function workflowExists(name) {
  return /^[a-z0-9-]+$/.test(name) && fs.existsSync(path.join(ORCH_DIR, "workflows", `${name}.json`));
}

function currentRunState(id) {
  const run = readJsonFile(path.join(ORCH_DIR, "runs", id, "run.json"), null);
  return run && run.id ? run.state : null;
}

// ---------- API routes ----------

async function handleApi(req, res, pathname, query) {
  // Every /api/* request requires the token, reads included — run prompts and
  // telemetry are not for whoever happens to reach the port.
  if (!tokenEquals(bearerToken(req), TOKEN)) {
    sendJson(res, 401, { error: "missing or invalid token" });
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    if (pathname === "/api/health") return sendJson(res, 200, { ok: true, now: new Date().toISOString() });
    if (pathname === "/api/runs") return sendJson(res, 200, { runs: listRuns(ORCH_DIR) });
    let m;
    if ((m = /^\/api\/runs\/([^/]+)$/.exec(pathname))) {
      if (!RUN_ID_RE.test(m[1])) return sendJson(res, 400, { error: "invalid run id" });
      const detail = getRunDetail(ORCH_DIR, m[1]);
      if (!detail) return sendJson(res, 404, { error: `no such run: ${m[1]}` });
      return sendJson(res, 200, detail);
    }
    if ((m = /^\/api\/runs\/([^/]+)\/log\/([a-z]+)$/.exec(pathname))) {
      if (!RUN_ID_RE.test(m[1])) return sendJson(res, 400, { error: "invalid run id" });
      const text = readRunLog(ORCH_DIR, m[1], m[2]);
      if (text === null) return sendJson(res, 404, { error: "no such log" });
      return sendText(res, 200, text);
    }
    if ((m = /^\/api\/runs\/([^/]+)\/step\/([^/]+)\/([^/]+)$/.exec(pathname))) {
      // readStepDoc validates every segment (run id, workflow-declared step id,
      // kind whitelist, bounded attempt) and maps bad input to 400, missing
      // files to 404 — never a path lookup from unvalidated input.
      const doc = readStepDoc(ORCH_DIR, m[1], m[2], m[3], query.get("attempt") ?? undefined);
      if (doc.error) return sendJson(res, doc.status, { error: doc.error });
      return sendText(res, 200, doc.text);
    }
    if (pathname === "/api/usage") {
      // Aggregates only — no transcript/document content ever rides this route.
      return sendJson(res, 200, {
        cost: usageTotals(openTelemetry(ORCH_DIR)),
        storage: contextStorage(ORCH_DIR),
      });
    }
    if (pathname === "/api/workflows") return sendJson(res, 200, { workflows: listWorkflows() });
    if (pathname === "/api/settings") {
      // rigs.json is served verbatim: ${VAR} placeholders stay literal, secret
      // values never appear because secrets.env is never read anywhere here.
      return sendJson(res, 200, { rigsRaw: loadRigsRaw(), workflows: listWorkflows() });
    }
    return sendJson(res, 404, { error: "not found" });
  }

  if (req.method !== "POST") return sendJson(res, 405, { error: "method not allowed" });

  // ---- mutation hardening: content-type, origin, rate limit, body cap ----
  const ctype = String(req.headers["content-type"] || "");
  if (!/^application\/json\b/i.test(ctype)) {
    return sendJson(res, 415, { error: "Content-Type must be application/json" });
  }
  if (!originAllowed(req)) return sendJson(res, 403, { error: "cross-origin request rejected" });
  const ip = clientIp(req);
  if (!MUTATION_LIMIT.allow(ip)) return sendJson(res, 429, { error: "rate limit: 10 mutations/min" });

  let body;
  try {
    const raw = await readBody(req, BODY_CAP);
    body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
  } catch (err) {
    if (err && err.statusCode === 413) {
      res.once("finish", () => req.destroy());
      return sendJson(res, 413, { error: err.message });
    }
    return sendJson(res, 400, { error: "invalid JSON body" });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return sendJson(res, 400, { error: "body must be a JSON object" });
  }

  const tailscaleUser = req.headers["tailscale-user-login"] || null; // audit-only, never auth
  const logAudit = (action, target, detail) =>
    audit(WEB_DIR, { ip, tailscaleUser, action, target, detail });

  // ---- POST /api/runs : start ----
  if (pathname === "/api/runs") {
    const { rig, workflow, prompt, auto } = body;
    if (typeof rig !== "string" || !rigExists(rig)) {
      return sendJson(res, 400, { error: `unknown rig: ${String(rig).slice(0, 100)}` });
    }
    if (typeof workflow !== "string" || !workflowExists(workflow)) {
      return sendJson(res, 400, { error: `unknown workflow: ${String(workflow).slice(0, 100)}` });
    }
    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > PROMPT_CAP) {
      return sendJson(res, 400, { error: `prompt must be a non-empty string (max ${PROMPT_CAP} chars)` });
    }
    const args = ["start", "--rig", rig, "--workflow", workflow, "--prompt", prompt];
    if (auto === true) args.push("--auto");
    const r = await factoryRun(args);
    const runId = r.stdout.trim().split("\n").pop() || "";
    logAudit("start", runId || `${rig}/${workflow}`, r.ok ? "ok" : r.stderr.slice(0, 200));
    if (!r.ok || !RUN_ID_RE.test(runId)) {
      return sendJson(res, 502, { error: `factory-run start failed: ${(r.stderr || r.stdout).slice(0, 400)}` });
    }
    return sendJson(res, 201, { ok: true, runId });
  }

  // ---- POST /api/runs/<id>/(approve|reject|steer|cancel|resume|discard) ----
  const m = /^\/api\/runs\/([^/]+)\/(approve|reject|steer|cancel|resume|discard)$/.exec(pathname);
  if (!m) return sendJson(res, 404, { error: "not found" });
  const [, id, action] = m;
  if (!RUN_ID_RE.test(id)) return sendJson(res, 400, { error: "invalid run id" });
  const state = currentRunState(id);
  if (state === null) return sendJson(res, 404, { error: `no such run: ${id}` });

  // discard = the founder's explicit "clean this run up" choice: force-remove
  // the worktree and branch of one terminal run via cleanup --discard.
  const args = action === "discard" ? ["cleanup", id, "--discard"] : [action, id];
  if (action === "approve" || action === "reject") {
    if (state !== "awaiting-approval") {
      return sendJson(res, 409, { error: `run is '${state}', not awaiting-approval` });
    }
    if (action === "reject") {
      const feedback = typeof body.feedback === "string" ? body.feedback.trim() : "";
      if (!feedback || feedback.length > PROMPT_CAP) {
        return sendJson(res, 400, { error: "reject requires non-empty 'feedback'" });
      }
      args.push(feedback);
    }
  } else if (action === "steer") {
    if (TERMINAL_STATES.includes(state)) {
      return sendJson(res, 409, { error: `run is already ${state}` });
    }
    const instruction = typeof body.instruction === "string" ? body.instruction.trim() : "";
    if (!instruction || instruction.length > PROMPT_CAP) {
      return sendJson(res, 400, { error: "steer requires non-empty 'instruction'" });
    }
    args.push(instruction);
  } else if (action === "cancel") {
    if (TERMINAL_STATES.includes(state)) {
      return sendJson(res, 409, { error: `run is already ${state}` });
    }
  } else if (action === "resume") {
    // Console resume covers kept cancelled runs (the executor picks up at the
    // interrupted step). The failed/stuck retry flow
    // (feature-failed-stuck-workflow-runs) should widen this allowed set when
    // it lands — extend it here rather than adding a parallel control.
    if (state !== "cancelled") {
      return sendJson(res, 409, { error: `run is '${state}' — console resume currently covers cancelled runs only` });
    }
  } else if (action === "discard") {
    if (!TERMINAL_STATES.includes(state)) {
      return sendJson(res, 409, { error: `run is '${state}', not terminal — cancel it first` });
    }
  }

  const r = await factoryRun(args);
  logAudit(action, id, r.ok ? "ok" : r.stderr.slice(0, 200));
  if (!r.ok) {
    return sendJson(res, 502, { error: `factory-run ${action} failed: ${(r.stderr || r.stdout).slice(0, 400)}` });
  }
  return sendJson(res, 200, { ok: true, message: r.stdout.trim().slice(0, 400) });
}

// ---------- static frontend (dist/ only, traversal-proof) ----------

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

function serveStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendJson(res, 405, { error: "method not allowed" });
  }
  if (!fs.existsSync(path.join(DIST_DIR, "index.html"))) {
    return sendText(res, 503, "frontend not built — run orchestration/bin/factory-web once to build it\n");
  }
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return sendText(res, 400, "bad request\n");
  }
  if (decoded.includes("\0")) return sendText(res, 404, "not found\n");
  // Traversal attempts (encoded or not) are rejected outright — no SPA fallback.
  if (decoded.split(/[\\/]/).includes("..")) return sendText(res, 404, "not found\n");
  // Resolve inside dist/ only; any traversal (encoded or not) falls out of the prefix.
  const resolved = path.resolve(DIST_DIR, "." + path.posix.normalize("/" + decoded));
  if (resolved !== DIST_DIR && !resolved.startsWith(DIST_DIR + path.sep)) {
    return sendText(res, 404, "not found\n");
  }
  let file = resolved;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    // Missing file-like paths (traversal attempts land here after URL
    // normalization) are a hard 404; only extension-less navigation paths get
    // the SPA shell (hash routing needs only /).
    if (path.extname(file)) return sendText(res, 404, "not found\n");
    file = path.join(DIST_DIR, "index.html");
  }
  const ext = path.extname(file).toLowerCase();
  const headers = {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=3600",
  };
  if (ext === ".html") {
    headers["Content-Security-Policy"] =
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; connect-src 'self'";
  }
  res.writeHead(200, headers);
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
}

// ---------- server ----------

const server = http.createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  } catch {
    return sendText(res, 400, "bad request\n");
  }
  const pathname = url.pathname;
  try {
    if (pathname === "/api" || pathname.startsWith("/api/")) {
      await handleApi(req, res, pathname, url.searchParams);
    } else {
      serveStatic(req, res, pathname);
    }
  } catch (err) {
    if (!res.headersSent) sendJson(res, 500, { error: String((err && err.message) || err).slice(0, 400) });
    else res.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`factory web console listening on http://${HOST}:${PORT}`);
  if (isLoopbackHost(HOST)) {
    console.log(
      `Phone access (recommended): keep this loopback bind and run\n` +
        `  tailscale serve --bg http://127.0.0.1:${PORT}\n` +
        `then open https://<machine-name>.<tailnet>.ts.net from any tailnet device.`
    );
  }
});
