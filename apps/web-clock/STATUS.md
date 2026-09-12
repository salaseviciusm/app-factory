# Status — web-clock (Suit Up)

> Kept truthful; verified against git.

- **Stage:** implemented end to end; store-ready pending footage, a phone, and an
  Apple Developer account. **Never run on a device. No accuracy figure.**
- **Last updated:** 2026-09-06
- **Codename:** `web-clock` · working name **Suit Up** · bundle `com.salaseviciusm.suitup`

## In-flight

Posture gate + inverted-row detector + 3D multi-view goldens landed (P13). Founder
snippets from IMG_1151 / 1158 / 1159 are in `app/fixtures/`. Still needed before
TestFlight: the remaining clips in `tuning.md` §1 (floor Rx, front/¾ hang, transitions,
a 20:00), a row-threshold retune (undercounts), and a phone.

## Blocked

- **Accuracy** — founder snippets exist, but there is still no published figure for a
  live Cindy. Spike clips A/B remain; row undercounts vs the video.
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
- 2026-09-06: posture gate, inverted-row detector, 3D `CAMERAS` grid, founder snippets
  from IMG_1151 / 1158 / 1159. P13 / architecture §20.

## Not done

- Any run on hardware. Any TestFlight build. Screenshots.
- Floor Rx push-ups, front/¾ dead-hang pull-ups, `transitions.mov`, a 20:00 Cindy.
- Entitlements are grant-all (P11); RevenueCat is a Rank 0 task.
- Acquisition envelope / AdServices attribution (`market-check.md` §6).
