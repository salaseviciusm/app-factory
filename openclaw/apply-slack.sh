#!/usr/bin/env bash
# Applies the Slack channel config to OpenClaw (README Step 4).
#
# One-time per install:
#   1. cp openclaw/secrets.env.example openclaw/secrets.env and fill it in
#   2. openclaw plugins install @openclaw/slack && openclaw gateway restart
#   3. this script
#   4. invite the bot to the three channels in the Slack UI (manifest has no
#      channels:join scope — manual invite is expected)
#
# What it does, idempotently:
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

Slack config applied. Remaining manual step: invite the bot to the three channels
(/invite @OpenClaw in each), then verify:
  openclaw channels status --probe
  # and in Slack: DM the bot "status"
EOF
