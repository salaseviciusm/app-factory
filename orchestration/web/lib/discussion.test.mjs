/* Tests for discussion.mjs (discussion-step pure core) — run with `node --test orchestration/web/lib/*.test.mjs`. */
import test from "node:test";
import assert from "node:assert/strict";

import {
  DISCUSSION_DEFAULTS,
  GATE_REMINDERS,
  assembleConversation,
  effectiveSince,
  lastActivityAt,
  parseReplyLines,
  pendingReplies,
  remindersDue,
  resolveOutcome,
} from "./discussion.mjs";

const TURNS = [
  { attempt: 1, at: "2026-01-01T00:00:00.000Z", text: "opening: verdict + questions" },
  { attempt: 2, at: "2026-01-01T02:00:00.000Z", text: "answer to the founder" },
];

test("parseReplyLines keeps valid lines in order and skips garbage", () => {
  const lines = [
    '{"at":"2026-01-01T01:00:00.000Z","text":"first"}',
    "not json at all",
    '{"at":"2026-01-01T01:30:00.000Z"}', // no text
    '{"text":"   "}', // blank text
    '{"text":42}', // non-string text
    "[1,2,3]", // array, not a reply object
    '{"text":"second, no timestamp"}',
    "",
  ];
  assert.deepEqual(parseReplyLines(lines), [
    { at: "2026-01-01T01:00:00.000Z", text: "first" },
    { at: null, text: "second, no timestamp" },
  ]);
});

test("assembleConversation returns the opening sentinel when empty", () => {
  assert.equal(assembleConversation([], []), "(no discussion yet — this is the opening turn)");
});

test("assembleConversation interleaves founder replies between the turns they arrived between", () => {
  const replies = [
    { at: "2026-01-01T01:00:00.000Z", text: "founder question after turn 1" },
    { at: "2026-01-01T03:00:00.000Z", text: "founder follow-up after turn 2" },
  ];
  const c = assembleConversation(TURNS, replies);
  const order = [
    "**Agent (turn 1):**",
    "founder question after turn 1",
    "**Agent (turn 2):**",
    "founder follow-up after turn 2",
  ].map((s) => c.indexOf(s));
  assert.ok(order.every((i) => i !== -1), c);
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
});

test("assembleConversation puts replies with no parseable time after the last turn", () => {
  const c = assembleConversation(TURNS, [{ at: null, text: "untimed reply" }]);
  assert.ok(c.indexOf("**Agent (turn 2):**") < c.indexOf("untimed reply"));
});

test("assembleConversation puts a pre-first-turn reply first", () => {
  const c = assembleConversation(TURNS, [{ at: "2025-12-31T23:00:00.000Z", text: "early bird" }]);
  assert.ok(c.indexOf("early bird") < c.indexOf("**Agent (turn 1):**"));
});

test("pendingReplies counts only replies after the last turn", () => {
  const replies = [
    { at: "2026-01-01T01:00:00.000Z", text: "answered by turn 2" },
    { at: "2026-01-01T02:30:00.000Z", text: "pending" },
    { at: null, text: "untimed counts as pending" },
  ];
  assert.equal(pendingReplies(TURNS, replies), 2);
  assert.equal(pendingReplies([], replies), 3); // no turns yet: everything pending
  assert.equal(pendingReplies(TURNS, []), 0);
});

test("lastActivityAt picks the newest of turns and replies", () => {
  assert.equal(lastActivityAt(TURNS, []), "2026-01-01T02:00:00.000Z");
  assert.equal(
    lastActivityAt(TURNS, [{ at: "2026-01-01T05:00:00.000Z", text: "late reply" }]),
    "2026-01-01T05:00:00.000Z"
  );
  assert.equal(lastActivityAt([], [{ at: null, text: "untimed" }]), null);
});

// A live discussion inside the turn cap with no founder decision yet.
const BASE = {
  decision: null,
  pendingReplies: 0,
  turnsUsed: 2,
  maxTurns: 8,
};

test("resolveOutcome: approve resolves go-ahead", () => {
  assert.deepEqual(resolveOutcome({ ...BASE, decision: { decision: "approve" } }), { outcome: "go-ahead" });
});

test("resolveOutcome: reject resolves dont-build with the feedback", () => {
  assert.deepEqual(resolveOutcome({ ...BASE, decision: { decision: "reject", feedback: "market too thin" } }), {
    outcome: "dont-build",
    feedback: "market too thin",
  });
  assert.deepEqual(resolveOutcome({ ...BASE, decision: { decision: "reject" } }), {
    outcome: "dont-build",
    feedback: null,
  });
});

test("resolveOutcome: a pending reply past the turn cap is turn-cap; the cap alone keeps waiting", () => {
  assert.deepEqual(resolveOutcome({ ...BASE, pendingReplies: 1, turnsUsed: 8 }), { outcome: "turn-cap" });
  // After the last allowed turn the founder can still approve/reject.
  assert.equal(resolveOutcome({ ...BASE, turnsUsed: 8 }), null);
});

test("resolveOutcome: founder silence never resolves — a parked gate waits indefinitely", () => {
  // No clock inputs exist at all: nothing time-based can end the wait. Any
  // legacy clock fields callers might still pass are ignored.
  assert.equal(resolveOutcome({ ...BASE }), null);
  assert.equal(
    resolveOutcome({ ...BASE, lastActivityAt: "2026-01-01T00:00:00.000Z", now: "2027-01-01T00:00:00.000Z", idleTimeoutMinutes: 240 }),
    null
  );
});

test("resolveOutcome: an active discussion keeps waiting; the decision outranks every bound", () => {
  assert.equal(resolveOutcome({ ...BASE }), null);
  assert.deepEqual(
    resolveOutcome({ ...BASE, decision: { decision: "approve" }, pendingReplies: 3, turnsUsed: 8 }),
    { outcome: "go-ahead" }
  );
  const rejected = resolveOutcome({ ...BASE, decision: { decision: "reject", feedback: "no" }, pendingReplies: 3, turnsUsed: 8 });
  assert.equal(rejected.outcome, "dont-build");
});

test("DISCUSSION_DEFAULTS carry the documented bounds (no idle timeout)", () => {
  assert.deepEqual(DISCUSSION_DEFAULTS, { maxTurns: 8 });
});

test("GATE_REMINDERS cadence is 4h then daily", () => {
  assert.deepEqual(GATE_REMINDERS, { firstAfterMinutes: 240, repeatEveryMinutes: 1440 });
});

test("remindersDue: none inside the first window, then one at 4h and one more per day", () => {
  const since = { sinceAt: "2026-01-01T00:00:00.000Z" };
  assert.equal(remindersDue({ ...since, now: "2026-01-01T00:00:00.000Z" }), 0);
  assert.equal(remindersDue({ ...since, now: "2026-01-01T03:59:59.000Z" }), 0);
  assert.equal(remindersDue({ ...since, now: "2026-01-01T04:00:00.000Z" }), 1);
  assert.equal(remindersDue({ ...since, now: "2026-01-02T03:59:00.000Z" }), 1);
  assert.equal(remindersDue({ ...since, now: "2026-01-02T04:00:00.000Z" }), 2);
  assert.equal(remindersDue({ ...since, now: "2026-01-04T04:00:00.000Z" }), 4);
});

test("remindersDue: custom cadence and unparseable inputs", () => {
  assert.equal(
    remindersDue({ sinceAt: "2026-01-01T00:00:00.000Z", now: "2026-01-01T00:03:00.000Z", firstAfterMinutes: 1, repeatEveryMinutes: 1 }),
    3
  );
  assert.equal(remindersDue({ sinceAt: null, now: "2026-01-01T00:00:00.000Z" }), 0);
  assert.equal(remindersDue({ sinceAt: "garbage", now: "2026-01-01T00:00:00.000Z" }), 0);
  assert.equal(remindersDue({ sinceAt: "2026-01-01T00:00:00.000Z", now: null }), 0);
});

test("effectiveSince: the newer of activity and the resume clock floor wins", () => {
  // Stale activity (e.g. a turn-file mtime hours old) is floored by the resume stamp…
  assert.equal(effectiveSince("2026-01-01T00:00:00.000Z", "2026-01-01T06:00:00.000Z"), "2026-01-01T06:00:00.000Z");
  // …and fresh activity (a founder reply) outranks an older floor.
  assert.equal(effectiveSince("2026-01-01T08:00:00.000Z", "2026-01-01T06:00:00.000Z"), "2026-01-01T08:00:00.000Z");
  assert.equal(effectiveSince(null, "2026-01-01T06:00:00.000Z"), "2026-01-01T06:00:00.000Z");
  assert.equal(effectiveSince("2026-01-01T08:00:00.000Z", null), "2026-01-01T08:00:00.000Z");
  assert.equal(effectiveSince(null, null), null);
});
