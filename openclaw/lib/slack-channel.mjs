#!/usr/bin/env node
// Resolve a Slack channel NAME to its C... ID, creating the public channel on
// demand — the shared routing primitive behind the heartbeat (#factory-status)
// and factory-run's per-rig run channels (#factory-pace, #factory-app-<x>, ...).
//
//   node slack-channel.mjs <channel-name>   → prints the ID on stdout
//
// Non-zero exit + stderr on any failure; callers treat that as "unresolved" and
// fall back (factory-run) or abort (heartbeat). Token: SLACK_BOT_TOKEN from the
// environment, else openclaw/secrets.env. Creation uses conversations.create,
// covered by the channels:manage scope already in slack-app-manifest.json; the
// bot is auto-member of channels it creates, so no manual /invite is needed.
//
// Cache: ~/.openclaw/factory-slack-channels.json (name → id), so repeat callers
// never hit the paginated conversations.list. A cached id is trusted — a stale
// one surfaces as a send failure downstream; delete the cache file to heal.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CACHE_PATH = path.join(os.homedir(), ".openclaw", "factory-slack-channels.json");

/** Slack channel-name charset: lowercase, [a-z0-9_-], max 80 chars. */
function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function writeCache(cache) {
  try {
    fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
  } catch {
    /* a cache write failure must never fail resolution */
  }
}

function token() {
  if (process.env.SLACK_BOT_TOKEN) return process.env.SLACK_BOT_TOKEN;
  const secrets = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "secrets.env");
  if (fs.existsSync(secrets)) {
    for (const line of fs.readFileSync(secrets, "utf8").split("\n")) {
      const m = line.match(/^SLACK_BOT_TOKEN=(.+)$/);
      if (m && !m[1].includes("REPLACE")) return m[1];
    }
  }
  throw new Error("SLACK_BOT_TOKEN not set in the environment or openclaw/secrets.env");
}

async function api(method, tok, params) {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tok}`,
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    },
    body: new URLSearchParams(params).toString(),
    signal: AbortSignal.timeout(20000),
  });
  return res.json();
}

/** Paginated conversations.list lookup by name; null when absent. */
async function findByName(name, tok) {
  let cursor = "";
  do {
    const d = await api("conversations.list", tok, {
      types: "public_channel",
      exclude_archived: "true",
      limit: "200",
      ...(cursor ? { cursor } : {}),
    });
    if (!d.ok) throw new Error(`conversations.list failed: ${d.error || "no/invalid response"}`);
    const hit = (d.channels || []).find((c) => c.name === name);
    if (hit) return hit.id;
    cursor = (d.response_metadata && d.response_metadata.next_cursor) || "";
  } while (cursor);
  return null;
}

async function resolveOrCreate(name, tok) {
  const existing = await findByName(name, tok);
  if (existing) return existing;
  const created = await api("conversations.create", tok, { name });
  if (created.ok) return created.channel.id;
  if (created.error === "name_taken") {
    // Lost a create race; the channel exists now.
    const again = await findByName(name, tok);
    if (again) return again;
  }
  throw new Error(`conversations.create failed for #${name}: ${created.error || "no/invalid response"}`);
}

const name = normalizeName(process.argv[2]);
if (!name) {
  console.error("usage: slack-channel.mjs <channel-name>");
  process.exit(2);
}
const cache = readCache();
if (cache[name]) {
  console.log(cache[name]);
} else {
  try {
    const id = await resolveOrCreate(name, token());
    cache[name] = id;
    writeCache(cache);
    console.log(id);
  } catch (err) {
    console.error(`slack-channel: ${err.message}`);
    process.exit(1);
  }
}
