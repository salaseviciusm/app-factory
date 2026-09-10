# Status — web-clock (Suit Up)

> Kept truthful; verified against git.

- **Stage:** implemented end to end; store-ready pending footage, a phone, and an
  Apple Developer account. **Never run on a device. No accuracy figure.**
- **Last updated:** 2026-09-05
- **Last verified:** 2026-09-10 18:00 (EOD sync). **This file is out of date on `main`
  and understates progress by a full pass.** `9463daf` (2026-09-06 — posture gate,
  inverted-row detector, 3D multi-view goldens) is pushed to
  `origin/web-clock/posture-multiview` and has **never been merged to `main`**, and it
  carries the corrected STATUS with it. Specifically: the "In-flight" and "Blocked"
  sections below still say the founder has yet to film clips — in fact his snippets
  (IMG_1151 / 1158 / 1159) are already in `app/fixtures/` on that branch. Read the
  branch's copy, not this one, until the branch lands. Nothing here was rewritten
  in place because that would collide with the branch on merge.
- **Codename:** `web-clock` · working name **Suit Up** · bundle `com.salaseviciusm.suitup`

## In-flight

Founder films the clips listed in `tuning.md` §1. Those become the first real
fixtures and goldens; thresholds are retuned against them before any build goes
to TestFlight.

## Blocked

- **Accuracy** — until founder footage is run through `tools/pose-extract.swift` on a
  Mac. The two goldens are the pullup spike's stock clips (2 and 4 reps).
- **Device checks** (`tuning.md` §5: mirroring, rotation, fps, thermal over 20:00) —
  need an iPhone with a development build.
- **Submission** (`store/submission-checklist.md` §1) — Apple Developer Program, App
  Store Connect record, `eas init`, hosted privacy policy URL, screenshots from a
  real build.
- **Four founder calls** from `aso.md` still open (name, Oct 1 cohort, hero-angle
  comfort line, free calendar). Defaults are what shipped in the build.

## Done this pass

- Stamped from `template/` (stamp script fixed: `tsconfig.base.json` copied, tsx import
  resolved). Example code stripped.
- Domain: pose types, `CycleMachine`, six detectors (pull-up rx/jumping, push-up
  rx/knee, squat rx/box), framing gate, Cindy, AMRAP clock, director with transition
  guard, challenge service, projections. 34 tests green, incl. golden runner.
- Native: `modules/apple-vision-pose` (Swift, AVCapture + Vision 2D, preview view).
- Adapters and composition root: SQLite event store, live/sim/fixture pose sources,
  expo-crypto ids, anonymous PostHog.
- Screens per the listing's six frames: home / calendar, pick, session HUD with
  framing gate and reason codes, day card + share, history, settings.
- Store: `app.json` (iOS 17, camera string, privacy manifest, OTA channel), `eas.json`,
  icon + splash, en-US metadata from `aso.md`, privacy policy, review notes,
  submission checklist, `tuning.md`.
- `expo prebuild` dry run and `expo-doctor` clean. `architecture.md` §19 records the
  as-built deltas; `decisions.md` P8–P12.

## Not done

- Any run on hardware. Any founder fixture. Any TestFlight build. Screenshots.
- Entitlements are grant-all (P11); RevenueCat is a Rank 0 task.
- Acquisition envelope / AdServices attribution (`market-check.md` §6).
