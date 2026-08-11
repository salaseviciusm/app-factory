/*
 * Discussion-step pure core for the factory run engine: parse founder replies
 * (discussion-replies.jsonl), assemble the {{DISCUSSION}} conversation context
 * from agent turns + replies, and resolve the discussion outcome. Pure — no
 * filesystem or clock access; bin/factory-run (CJS, via require(esm)) feeds it
 * file contents and timestamps, and the web test suite exercises it directly.
 */

export const DISCUSSION_DEFAULTS = { maxTurns: 8 };

/** Founder-gate reminder cadence (founder direction 2026-08-11: gates never
 *  die on silence — a parked run waits indefinitely, so recurring reminders
 *  are the only pressure): first re-ping 4 hours after the last activity,
 *  then daily. */
export const GATE_REMINDERS = { firstAfterMinutes: 240, repeatEveryMinutes: 1440 };

/** How many reminders are due for a gate quiet since `sinceAt`: 0 before the
 *  first threshold, then one more per repeat interval. Callers compare against
 *  the count already sent for this `sinceAt` epoch — new founder activity
 *  moves `sinceAt`, which re-arms the cadence from zero. Unparseable
 *  timestamps mean no reminders, never a throw. */
export function remindersDue({ sinceAt, now, firstAfterMinutes = GATE_REMINDERS.firstAfterMinutes, repeatEveryMinutes = GATE_REMINDERS.repeatEveryMinutes }) {
  const since = Date.parse(sinceAt || "");
  const t = Date.parse(now || "");
  if (!Number.isFinite(since) || !Number.isFinite(t)) return 0;
  const elapsed = t - since;
  const first = firstAfterMinutes * 60 * 1000;
  if (elapsed < first) return 0;
  return 1 + Math.floor((elapsed - first) / (repeatEveryMinutes * 60 * 1000));
}

/** The newer of a gate's on-disk activity time and its persisted clock floor,
 *  as an ISO string (null when neither parses). The floor is stamped at every
 *  entry into the discussion step, so a resumed gate's age is measured from
 *  the resume — a stale turn-file mtime can never poison the clock. */
export function effectiveSince(activityAt, floorAt) {
  const a = Date.parse(activityAt || "");
  const f = Date.parse(floorAt || "");
  if (!Number.isFinite(a) && !Number.isFinite(f)) return null;
  if (!Number.isFinite(a)) return new Date(f).toISOString();
  if (!Number.isFinite(f)) return new Date(a).toISOString();
  return new Date(Math.max(a, f)).toISOString();
}

/** Parse discussion-replies.jsonl lines into [{at, text}]. A reply line is a
 *  JSON object with a non-empty string `text`; `at` is kept when it is a
 *  string, null otherwise. Garbage lines are skipped, never thrown. */
export function parseReplyLines(lines) {
  const replies = [];
  for (const line of lines) {
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    if (!ev || typeof ev !== "object" || Array.isArray(ev)) continue;
    if (typeof ev.text !== "string" || !ev.text.trim()) continue;
    replies.push({ at: typeof ev.at === "string" ? ev.at : null, text: ev.text });
  }
  return replies;
}

/** Slot index for a reply among turns: 0 = before turn 1, N = after turn N.
 *  A reply lands after the latest turn whose completion time is at or before
 *  the reply's; a reply with no parseable time lands after the last turn. */
function replySlot(turns, reply) {
  const t = Date.parse(reply.at || "");
  if (!Number.isFinite(t)) return turns.length;
  let slot = 0;
  for (let i = 0; i < turns.length; i++) {
    const turnAt = Date.parse(turns[i].at || "");
    if (Number.isFinite(turnAt) && turnAt <= t) slot = i + 1;
  }
  return slot;
}

/** Assemble the {{DISCUSSION}} conversation context: agent turns
 *  ([{attempt, at, text}], ordered) interleaved with the founder replies that
 *  arrived between them. Empty conversation returns an explicit opening-turn
 *  sentinel so the template can rely on the placeholder never being blank. */
export function assembleConversation(turns, replies) {
  if (turns.length === 0 && replies.length === 0) {
    return "(no discussion yet — this is the opening turn)";
  }
  const bySlot = new Map();
  for (const reply of replies) {
    const slot = replySlot(turns, reply);
    if (!bySlot.has(slot)) bySlot.set(slot, []);
    bySlot.get(slot).push(reply);
  }
  const parts = [];
  const pushReplies = (slot) => {
    for (const r of bySlot.get(slot) || []) parts.push(`**Founder:**\n\n${r.text}`);
  };
  pushReplies(0);
  turns.forEach((turn, i) => {
    parts.push(`**Agent (turn ${turn.attempt}):**\n\n${turn.text}`);
    pushReplies(i + 1);
  });
  return parts.join("\n\n");
}

/** Replies not yet answered by an agent turn: everything that arrived after
 *  the last turn completed (all of them when no turn ran yet). A reply with
 *  no parseable time counts as pending — the safe direction is answering. */
export function pendingReplies(turns, replies) {
  if (turns.length === 0) return replies.length;
  return replies.filter((r) => replySlot(turns, r) >= turns.length).length;
}

/** Most recent activity (turn completion or founder reply) as an ISO string,
 *  or null when nothing has a parseable timestamp. */
export function lastActivityAt(turns, replies) {
  let best = null;
  for (const x of [...turns, ...replies]) {
    const t = Date.parse(x.at || "");
    if (Number.isFinite(t) && (best === null || t > best)) best = t;
  }
  return best === null ? null : new Date(best).toISOString();
}

/**
 * Resolve the discussion outcome, or null to keep waiting. Priority order:
 * the founder's decision always wins (approve → go-ahead, reject →
 * dont-build), then the one loud bound — a pending reply that would need a
 * turn past maxTurns is turn-cap. The turn cap alone never resolves: after
 * the last allowed turn the founder can still approve or reject; only a reply
 * demanding another turn trips it. The bound never yields go-ahead.
 *
 * There is deliberately no clock input: silence never resolves a founder
 * gate (founder direction 2026-08-11 — no idle timeout, no auto-approval,
 * no expiry). A parked discussion waits indefinitely; remindersDue drives
 * the recurring re-pings instead.
 */
export function resolveOutcome({ decision, pendingReplies = 0, turnsUsed, maxTurns }) {
  if (decision && decision.decision === "approve") return { outcome: "go-ahead" };
  if (decision && decision.decision === "reject") return { outcome: "dont-build", feedback: decision.feedback || null };
  if (pendingReplies > 0 && turnsUsed >= maxTurns) return { outcome: "turn-cap" };
  return null;
}
