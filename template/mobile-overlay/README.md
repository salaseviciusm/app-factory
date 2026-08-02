# Mobile overlay

We deliberately do NOT vendor a full Expo app in the template — Expo moves fast and a
frozen copy would bit-rot (see ADR 0003). Instead, `scripts/stamp-app.sh` creates a
fresh app with `create-expo-app` at the current SDK and overlays these files on top.

The overlay is the factory's opinionated shell layer:

```
src/context/app-context.ts    # THE composition root — only file that news up impls
src/design/index.ts           # re-exports generated tokens; primitives land here
src/design/tokens.generated.ts# generated from brand-pack (stamp script runs generator)
src/impl/                     # adapters: storage, analytics provider, RevenueCat (added per app)
src/lib/observable.ts         # Cell/Stream for high-frequency live state (ADR 0002)
```

After stamping, the app-engineer's first task is "template hardening" against
`agent-guide.md`: strip the Expo example screens, wire expo-router routes for
onboarding/paywall/settings per features.json, and read the versioned Expo docs
before touching Expo APIs.
