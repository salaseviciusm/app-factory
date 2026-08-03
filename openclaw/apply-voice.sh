#!/usr/bin/env bash
# Enables Slack voice-note transcription in OpenClaw (README "voice" step).
#
# Needs one transcription provider key in openclaw/secrets.env:
#   GROQ_API_KEY   (recommended: fast + generous free tier, whisper-large-v3-turbo)
#   OPENAI_API_KEY (fallback: gpt-4o-transcribe)
#
# Idempotent. openclaw CLI calls have stdin detached (they hang on a TTY check
# otherwise).
set -euo pipefail

FACTORY_DIR="$(cd "$(dirname "$0")" && pwd)"
SECRETS="$FACTORY_DIR/secrets.env"
SERVICE_ENV_FILE="$HOME/.openclaw/service-env/ai.openclaw.gateway.env"

[ -f "$SECRETS" ] || { echo "ERROR: $SECRETS missing"; exit 1; }
set -a; . "$SECRETS"; set +a

if [ -n "${GROQ_API_KEY:-}" ] && [[ "${GROQ_API_KEY:-}" != *REPLACE* ]]; then
  PROVIDER=groq MODEL=whisper-large-v3-turbo KEYVAR=GROQ_API_KEY
elif [ -n "${OPENAI_API_KEY:-}" ] && [[ "${OPENAI_API_KEY:-}" != *REPLACE* ]]; then
  PROVIDER=openai MODEL=gpt-4o-transcribe KEYVAR=OPENAI_API_KEY
else
  echo "ERROR: set GROQ_API_KEY or OPENAI_API_KEY in openclaw/secrets.env first."
  exit 1
fi

echo "==> Configuring audio transcription via $PROVIDER/$MODEL"
openclaw config set tools.media.audio.enabled true < /dev/null
openclaw config set tools.media.audio.models "[{\"provider\":\"$PROVIDER\",\"model\":\"$MODEL\"}]" < /dev/null
openclaw config set tools.media.audio.echoTranscript true < /dev/null

if [ -f "$SERVICE_ENV_FILE" ]; then
  if ! grep -q "^export ${KEYVAR}=" "$SERVICE_ENV_FILE"; then
    eval "val=\${$KEYVAR}"
    printf 'export %s=%s\n' "$KEYVAR" "'$val'" >> "$SERVICE_ENV_FILE"
    echo "==> Added $KEYVAR to service env file"
  fi
  chmod 600 "$SERVICE_ENV_FILE"
fi

echo "==> Restarting gateway"
openclaw gateway restart < /dev/null || true

echo "Done. Test: send a Slack voice note to the bot saying 'status' — the transcript"
echo "should echo back in-thread, followed by the normal reply."
