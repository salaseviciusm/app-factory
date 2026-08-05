#!/usr/bin/env bash
# Applies the Slack channel config to OpenClaw (README Step 4).
#
# One-time per install:
#   1. cp openclaw/secrets.env.example openclaw/secrets.env and fill it in
#   2. openclaw plugins install @openclaw/slack && openclaw gateway restart
#   3. this script
#   4. invite the bot to the hand-created channels (standup/approvals/builds) in
#      the Slack UI (manifest has no channels:join scope — manual invite is
#      expected). Channels this script creates on demand (#factory-status and
#      the per-repo run channels) need no invite: the bot is auto-member of
#      channels it creates.
#
# What it does, idempotently:
#   - resolves #factory-status + per-repo run channels by NAME via
#     lib/slack-channel.mjs, creating them on demand (channels:manage scope),
#     so the agent's channel allowlist covers founder replies in all of them;
#     re-run this script after stamping a new quickfire app
#   - renders slack.patch.json5 (${VAR} placeholders) with secrets.env values
#   - validates with `config patch --dry-run`, then applies
#   - makes the founder command owner (owner-only commands, exec approvals)
#   - ensures the daemon's service env file exports both Slack tokens
#     (the LaunchAgent does not inherit shell env; SecretRefs resolve from there)
set -euo pipefail

FACTORY_DIR="$(cd "$(dirname "$0")" && pwd)"
SECRETS="$FACTORY_DIR/secrets.env"
TEMPLATE="$FACTORY_DIR/slack.patch.json5"
SERVICE_ENV_FILE="$HOME/.openclaw/service-env/ai.openclaw.gateway.env"

[ -f "$SECRETS" ] || { echo "ERROR: $SECRETS missing — cp secrets.env.example secrets.env and fill it in"; exit 1; }
set -a; . "$SECRETS"; set +a
for v in SLACK_BOT_TOKEN SLACK_APP_TOKEN FACTORY_STANDUP_CHANNEL FACTORY_APPROVALS_CHANNEL FACTORY_BUILDS_CHANNEL FACTORY_FOUNDER_SLACK_ID; do
  eval "val=\${$v:-}"
  if [ -z "$val" ] || [[ "$val" == *REPLACE* ]]; then
    echo "ERROR: $v not set in secrets.env"
    exit 1
  fi
done

# Auto-created channels: resolve by name (creating on demand) so their IDs land
# in the agent's allowlist without ever being pasted into secrets.env. A pinned
# FACTORY_STATUS_CHANNEL in secrets.env wins over the name lookup.
echo "==> Resolving auto-created factory channels (name → ID, created on demand)"
if [ -z "${FACTORY_STATUS_CHANNEL:-}" ] || [[ "${FACTORY_STATUS_CHANNEL:-}" == *REPLACE* ]]; then
  FACTORY_STATUS_CHANNEL="$(node "$FACTORY_DIR/lib/slack-channel.mjs" factory-status)"
fi
FACTORY_PACE_CHANNEL="$(node "$FACTORY_DIR/lib/slack-channel.mjs" factory-pace)"
FACTORY_SKIPHERO_CHANNEL="$(node "$FACTORY_DIR/lib/slack-channel.mjs" factory-skiphero)"
FACTORY_APP_FACTORY_CHANNEL="$(node "$FACTORY_DIR/lib/slack-channel.mjs" factory-app-factory)"
export FACTORY_STATUS_CHANNEL FACTORY_PACE_CHANNEL FACTORY_SKIPHERO_CHANNEL FACTORY_APP_FACTORY_CHANNEL

# Quickfire apps existing at apply time get their #factory-app-<name> channel
# allowlisted too (rendered into the ${EXTRA_APP_CHANNELS} template slot).
EXTRA_APP_CHANNELS="// (no quickfire app channels at apply time)"
for d in "$FACTORY_DIR/../apps"/*/; do
  [ -d "$d" ] || continue
  app="$(basename "$d")"
  if id="$(node "$FACTORY_DIR/lib/slack-channel.mjs" "factory-app-$app")"; then
    EXTRA_APP_CHANNELS="$(printf '%s\n        "%s": { requireMention: false },' "$EXTRA_APP_CHANNELS" "$id")"
  else
    echo "WARNING: could not resolve/create #factory-app-$app; skipping its allowlist entry" >&2
  fi
done
export EXTRA_APP_CHANNELS

RENDERED="$(mktemp -t slack-patch.XXXXXX.json5)"
trap 'rm -f "$RENDERED"' EXIT
node -e "
const fs = require('fs');
const out = fs.readFileSync('$TEMPLATE', 'utf8').replace(/\\\$\{(\w+)\}/g, (_, k) => {
  const v = process.env[k];
  if (!v) throw new Error('missing env for placeholder: ' + k);
  return v;
});
fs.writeFileSync('$RENDERED', out);
"

# openclaw CLI calls need stdin detached — otherwise they sit on a TTY check
# and hang forever when run from scripts.
echo "==> Validating patch (dry-run)"
openclaw config patch --file "$RENDERED" --dry-run < /dev/null

echo "==> Applying patch"
openclaw config patch --file "$RENDERED" < /dev/null

echo "==> Setting command owner"
openclaw config set commands.ownerAllowFrom "[\"slack:${FACTORY_FOUNDER_SLACK_ID}\"]" < /dev/null

if [ -f "$SERVICE_ENV_FILE" ]; then
  for pair in "SLACK_BOT_TOKEN" "SLACK_APP_TOKEN"; do
    if ! grep -q "^export ${pair}=" "$SERVICE_ENV_FILE"; then
      eval "val=\${$pair}"
      printf 'export %s=%s\n' "$pair" "'$val'" >> "$SERVICE_ENV_FILE"
      echo "==> Added $pair to service env file"
    fi
  done
  chmod 600 "$SERVICE_ENV_FILE"
else
  echo "NOTE: $SERVICE_ENV_FILE not found — export SLACK_BOT_TOKEN/SLACK_APP_TOKEN"
  echo "      wherever the gateway daemon gets its env, then restart the gateway."
fi

echo "==> Restarting gateway"
openclaw gateway restart < /dev/null || true

cat <<EOF

Slack config applied. Remaining manual step: invite the bot to the hand-created
channels — standup/approvals/builds (/invite @OpenClaw in each; auto-created
channels like #factory-status and the per-repo run channels need no invite),
then verify:
  openclaw channels status --probe
  # and in Slack: DM the bot "status"
EOF
