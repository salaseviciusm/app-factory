/*
 * Security helpers for the factory web console: shared-token auth, Origin/Host
 * CSRF checks, per-IP rate limiting, and the mutation audit log.
 *
 * The mutating endpoints shell out to bin/factory-run, so an unauthenticated
 * hit is remote command execution against the factory — every layer here is
 * mandatory, not defense-in-depth garnish.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const TOKEN_FILE = ".token";

/** Load the shared token from env or the persisted token file. Null if neither. */
export function loadToken(webDir) {
  if (process.env.FACTORY_WEB_TOKEN && process.env.FACTORY_WEB_TOKEN.trim()) {
    return process.env.FACTORY_WEB_TOKEN.trim();
  }
  const p = path.join(webDir, TOKEN_FILE);
  if (fs.existsSync(p)) {
    const t = fs.readFileSync(p, "utf8").trim();
    if (t) return t;
  }
  return null;
}

/** Generate a fresh token and persist it with mode 0600. Returns the token. */
export function createToken(webDir) {
  const token = crypto.randomBytes(32).toString("hex");
  const p = path.join(webDir, TOKEN_FILE);
  fs.writeFileSync(p, token + "\n", { mode: 0o600 });
  fs.chmodSync(p, 0o600); // writeFileSync mode is masked by umask; enforce
  return token;
}

/** Constant-time token comparison (hash both sides to equalize length first). */
export function tokenEquals(given, expected) {
  if (typeof given !== "string" || !given || !expected) return false;
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

/** Extract the bearer token from an Authorization header, or null. */
export function bearerToken(req) {
  const m = (req.headers.authorization || "").match(/^Bearer\s+(\S+)$/i);
  return m ? m[1] : null;
}

export function isLoopbackHost(host) {
  return host === "127.0.0.1" || host === "localhost" || host === "::1" || host === "";
}

/**
 * CSRF check for mutations: when an Origin header is present it must match the
 * Host the request arrived on (the token-in-custom-header requirement already
 * defeats form CSRF; this catches misconfigured proxies and "null" origins).
 * Requests without an Origin header (curl, same-origin fetches in some UAs)
 * pass — they still need the token.
 */
export function originAllowed(req) {
  const origin = req.headers.origin;
  if (origin === undefined) return true;
  let originHost;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false; // includes the literal "null" origin
  }
  return originHost.length > 0 && originHost === (req.headers.host || "");
}

/** Sliding-window per-key rate limiter (mutations: 10/min per IP). */
export class RateLimiter {
  constructor(limit, windowMs) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.hits = new Map();
  }

  allow(key) {
    const cutoff = Date.now() - this.windowMs;
    const recent = (this.hits.get(key) || []).filter((t) => t > cutoff);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(Date.now());
    this.hits.set(key, recent);
    return true;
  }
}

/**
 * Append one line per accepted mutation: timestamp, remote address, Tailscale
 * identity when the request came through `tailscale serve` (informational —
 * never used for auth), action, target, detail.
 */
export function audit(webDir, { ip, tailscaleUser, action, target, detail }) {
  const line =
    [
      new Date().toISOString(),
      ip || "-",
      tailscaleUser || "-",
      action,
      target || "-",
      (detail || "").replace(/\s+/g, " ").slice(0, 300),
    ].join("\t") + "\n";
  fs.appendFileSync(path.join(webDir, "audit.log"), line);
}
