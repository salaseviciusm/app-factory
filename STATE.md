# Factory State

> Maintained by the chief of staff. Humans may edit; agents must keep it truthful.
> Last updated: 2026-08-02 13:12 (first live standup posted — outbound Slack verified)

## Phase

**Phase 0 — Foundation, bring-up nearly complete.** OpenClaw 2026.7.1-2 onboarded
(Claude Max via `anthropic-cli`; model `anthropic/claude-opus-4-8`); gateway as
LaunchAgent on 127.0.0.1:18789; workspace verified (agent answers as Chief of Staff,
5 factory skills). Slack connected: `@openclaw/slack` plugin installed, socket mode
connected, 3 channels + founder allowlisted, command owner set, tokens in service
env. Crons registered (standup 08:00 / cutoff 11:00 isolated+announce delivery;
EOD 18:00 main-session system event). First live standup posted 13:12 and a duplicate
re-fire correctly self-suppressed (NO_REPLY). Runbook corrected against reality
throughout (D14 + README fixes).
Next milestone: **factory fully online** (founder confirmed standup visible in Slack
13:20). Awaiting: app #1 idea + O2 analytics decision (both asked in the standup).

## Active apps

_None yet. First app starts via the `factory-new-app` skill after the factory is online._

## Today

**2026-08-02 13:12 — First live standup posted to `#factory-standup`**
(msg `1785672736.968909`, deliveryStatus: sent — outbound Slack now verified end-to-end).
No engineering to allocate: Phase 0, no app chosen. Plan holds until founder steers:
on app #1 selection → kick off Stage 1 refinement via product-lead (DoD: one-page brief
for spec gate). Awaiting founder on: app #1 idea, analytics provider (default PostHog),
channel-invite/react confirmation. Standup fired late (13:09, not 08:00) so the 11:00
reply-cutoff is moot — proceeding on the posted proposal.

**2026-08-02 13:18 — Duplicate standup trigger suppressed.** The standup cron
re-fired 6 min after the 13:12 post; nothing changed (still Phase 0, no apps, nothing
to allocate). Did not double-post to avoid channel noise. Today's standup stands as the
13:12 message.

## Awaiting founder

- Invite the bot (`/invite @OpenClaw`) into `#factory-standup`, `#factory-approvals`, `#factory-builds` — then say so and the outbound smoke test + a live standup run finish verification
- DM the bot `status` in Slack for the conversational-loop check
- O2: analytics provider (leaning PostHog) — needed by Phase 1
- Pick the idea for app #1

## In-flight

_None._
