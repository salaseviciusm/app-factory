# Integrations

## Slack (founder surface)

> Note: the original request referenced "claude-van-damn"; that repo doesn't exist on this
> machine. `fin-news` is the project here with a production Slack integration and is the
> pattern source. If claude-van-damn lives elsewhere, reconcile this doc against it.

**Sequencing (D10):** Phase 0–2 uses **OpenClaw's Slack channel plugin** — zero code,
immediate conversational access to the chief of staff; approvals are parsed text replies
("approve spec <app>"). The **dedicated Bolt service below is built in Phase 3**, when
interactive approval gates (buttons, structured threads) justify it.

When built, adopt fin-news's architecture wholesale — it solved exactly our problems:

- **`@slack/bolt` v4 in Socket Mode.** No HTTP endpoint, no public URL. Two tokens
  (`SLACK_BOT_TOKEN` xoxb-, `SLACK_APP_TOKEN` xapp- with `connections:write`), required
  at boot via a `requireEnv()` config module that throws immediately when missing.
- **Module-level `App` singleton** exported from `app.ts`; scheduled jobs import it and
  post via `app.client` outside any request context.
- **LLM output made Slack-safe at the LLM boundary**: fin-news's
  `markdownToSlackMrkdwn()` applied inside the model client, so every response is
  mrkdwn-ready at every call site. Reuse `slack/format.ts`, `slack/blocks.ts`
  (`splitText` at 2900 chars, `batchBlocks` at 50) and `slack/post.ts`
  (`postLongText` returns first `ts` for threading).
- **Threads as conversation memory**: conversation history keyed by `thread_ts` in
  SQLite; the bot only joins threads it started; DMs auto-thread. Loop prevention:
  drop events with `bot_id` or any `subtype`.
- **One slash command with subcommand dispatch** (`/factory standup|status|approve|apps|help`),
  `ack()` first, ephemeral hourglass placeholder, then run the job. Every job function
  takes `channelOverride?` so slash commands can redirect output.
- **`node-cron` scheduler**: expressions in typed config (not code), per-job timezones,
  every callback wrapped so a throw never kills the process, failure posts
  `:x: <job> failed` back to the channel.
- **Interactive buttons** (`app.action(...)`) for the approval gates: spec approval,
  submission approval, marketing calendar sign-off — approve/reject buttons on the
  gate message, decisions recorded to the decision log.

Channel plan:

| Channel | Purpose |
|---|---|
| `#factory-standup` | Daily standup thread; founder replies in-thread |
| `#factory-approvals` | Gate messages with approve/reject buttons |
| `#factory-builds` | CI/EAS build + submission status |
| `#app-<name>` | Per-app channel: progress, decisions, marketing previews |
| `#factory-portfolio` | Nightly analytics digest, weekly portfolio review |

## OpenClaw (orchestrator)

- Self-hosted gateway on the founder's home machine initially, VPS at Phase 3 (D12);
  chief-of-staff agent as primary.
- **Cron** drives: standup preparation, nightly analytics pull, marketing posting,
  weekly retro/calendar prep.
- **Skills** (workspace-level) encode factory procedures: dispatch-build-task,
  prepare-standup, stage-release, generate-brand-pack.
- Sub-agent sessions per app workspace for coding tasks (Claude Code / Agent SDK),
  monitored by the chief of staff.
- Hardening: channel allowlists, mention-required in groups, no store credentials in
  OpenClaw's environment (release credentials live only in the CI/EAS layer).
- Slack surface: OpenClaw's channel plugin through Phase 2, dedicated Bolt service from
  Phase 3 (D10 — see the Slack section above).

## Build & stores

- **EAS**: per-app `eas.json` with `development`/`preview`/`production` profiles mapped
  1:1 to OTA channels and `EXPO_PUBLIC_APP_VARIANT` (running-with-pace convention);
  `appVersionSource: remote`, production `autoIncrement`.
- **EAS Workflows** for build→TestFlight submission chains (running-with-pace's
  `submit-ios.yml` as reference); Google Play internal track equivalent.
- **GitHub Actions**: `npm run check` + Maestro on PR (factory addition — reference repos
  under-invest here, but a many-agent org needs a hard gate).
- Store metadata generated from the brand pack; submission always behind the founder gate.

## Analytics & revenue

- Typed analytics events defined at design time (stage 4) in `packages/analytics`.
- RevenueCat for subscriptions/IAP; store analytics + RevenueCat pulled nightly by the
  Data Engineer agent into the portfolio dashboard; digest posted to `#factory-portfolio`.
- Provider choice (PostHog vs Amplitude vs self-hosted) is an open decision — see log.
