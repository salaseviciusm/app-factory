#!/usr/bin/env bash
# Stamp a new app from the template + a brand pack.
#
# Usage: ./scripts/stamp-app.sh <codename> <path-to-app-workspace>
#   e.g. ./scripts/stamp-app.sh pace-timer ~/src/app-factory/apps/pace-timer
#
# Preconditions: the app workspace exists (created by the factory-new-app skill) and
# contains an approved brand-pack/ (founder gate 1 passed). Network required
# (create-expo-app downloads the current SDK template).
set -euo pipefail

CODENAME="${1:?usage: stamp-app.sh <codename> <app-workspace-dir>}"
WORKSPACE="${2:?usage: stamp-app.sh <codename> <app-workspace-dir>}"
TEMPLATE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$WORKSPACE/app"
BRAND_PACK="$WORKSPACE/brand-pack"

[ -f "$BRAND_PACK/tokens.json" ] || { echo "ERROR: $BRAND_PACK/tokens.json missing — brand pack incomplete"; exit 1; }
[ -f "$BRAND_PACK/identity.json" ] || { echo "ERROR: $BRAND_PACK/identity.json missing"; exit 1; }
[ -d "$APP_DIR" ] && { echo "ERROR: $APP_DIR already exists — stamping is one-time; refusing to overwrite"; exit 1; }

echo "==> Validating brand pack"
(cd "$TEMPLATE_DIR/tools" && npx tsx -e "
import { readFileSync } from 'node:fs';
import { validateBrandPack } from './src/brand-pack-schema.js';
const read = (f) => JSON.parse(readFileSync('$BRAND_PACK/' + f, 'utf8'));
validateBrandPack({ tokens: read('tokens.json'), identity: read('identity.json'), features: read('features.json') });
console.log('brand pack valid');
")

echo "==> Creating Expo app (current SDK)"
npx --yes create-expo-app@latest "$APP_DIR" --template default

echo "==> Applying factory overlay"
mkdir -p "$APP_DIR/src"
cp -R "$TEMPLATE_DIR/mobile-overlay/src/." "$APP_DIR/src/"

echo "==> Linking factory packages"
# Source packages, no build step: copy into the app repo so it is self-contained.
# (Upgrade path: template version bumps are scheduled tasks — see docs/04.)
mkdir -p "$APP_DIR/packages"
cp -R "$TEMPLATE_DIR/packages/core" "$APP_DIR/packages/core"
cp -R "$TEMPLATE_DIR/packages/analytics" "$APP_DIR/packages/analytics"
node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('$APP_DIR/package.json', 'utf8'));
p.dependencies = p.dependencies || {};
p.dependencies['@factory/core'] = 'file:./packages/core';
p.dependencies['@factory/analytics'] = 'file:./packages/analytics';
p.dependencies['zod'] = p.dependencies['zod'] || '^4.1.0';
fs.writeFileSync('$APP_DIR/package.json', JSON.stringify(p, null, 2) + '\n');
"

echo "==> Generating design tokens from brand pack"
(cd "$TEMPLATE_DIR/tools" && npm run --silent generate-tokens -- "$BRAND_PACK" "$APP_DIR/src/design/tokens.generated.ts")

echo "==> Recording template version"
TEMPLATE_VERSION=$(node -e "console.log(require('$TEMPLATE_DIR/package.json').version)")
echo "{ \"templateVersion\": \"$TEMPLATE_VERSION\", \"stampedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\" }" > "$APP_DIR/factory.json"

echo "==> Copying agent guide"
cp "$TEMPLATE_DIR/agent-guide.md" "$APP_DIR/agent-guide.md"
ln -sf agent-guide.md "$APP_DIR/AGENTS.md"
ln -sf agent-guide.md "$APP_DIR/CLAUDE.md"

echo "==> Installing dependencies"
(cd "$APP_DIR" && npm install)

cat <<EOF

Stamped: $APP_DIR (template v$TEMPLATE_VERSION, brand: $CODENAME)

Next (app-engineer 'template hardening' task):
  1. Set name/slug/scheme/bundleId in app.json from brand-pack/identity.json
  2. Strip Expo example screens; wire routes per brand-pack/features.json
  3. cd $APP_DIR && npx expo start   # verify it boots
  4. Add eas.json (development/preview/production ⇄ OTA channels) before first build
EOF
