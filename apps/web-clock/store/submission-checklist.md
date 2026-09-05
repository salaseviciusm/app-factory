# Suit Up — App Store submission checklist

Everything the code can carry is in `app/`. The items below need the founder's Apple and
Expo accounts, a Mac or EAS Build, and the raw footage session. Tick in order.

## 0. Before any build — footage gate (spec §gates)

- [ ] Record raw clips (see `../tuning.md`): one clean front/¾ clip per movement, plus one
      full 20:00 with the phone propped exactly as a user would.
- [ ] Run them through `pose-extract` → `app/tools/csv-to-fixture.mjs` → goldens. Detectors
      count what you counted, on your setup, before we ship them.

## 1. Accounts and identifiers

- [ ] Apple Developer Program membership active; Team ID noted.
- [ ] App Store Connect: create the app record — bundle id `com.salaseviciusm.suitup`, SKU
      `suitup-ios`, primary language English (US), name "Suit Up: 30-Day Hero Workout".
- [ ] `npx eas init` in `app/` (logged in to the Expo account). Replace the two
      `00000000-…` placeholders in `app.json` (`extra.eas.projectId`, `updates.url`).
- [ ] `eas.json` → `submit.production.ios`: set `ascAppId` (from the App Store Connect URL)
      and `appleTeamId`.
- [ ] EAS secrets: `EXPO_PUBLIC_POSTHOG_KEY` for the pilot project (Gate 0 instrumentation).
      Without it the app runs with `NoopAnalytics` — fine for TestFlight, not for the pilot.

## 2. Build

- [ ] `cd app && npm ci && npm run check` — green.
- [ ] `npx eas build --platform ios --profile development` → install on the founder's phone
      → walk the framing gate, do a real set of each movement, confirm counts and rejects
      on the live camera. This is the first time the Swift module runs; expect one round
      of fixes (rotation, mirroring, permissions copy) and budget for it.
- [ ] `npx eas build --platform ios --profile preview` → TestFlight internal → 3 people run a
      full 20:00. Watch `framingLostMs` and `repsManual` on their cards.
- [ ] `npx eas build --platform ios --profile production` with `autoIncrement`.

## 3. App Store Connect — App Information

- [ ] Name / subtitle / keywords / promotional text / description from
      `metadata/en-US/*.txt` (character counts are already within limits).
- [ ] Category: Health & Fitness. Age rating: 4+. **No** in-app purchases in 1.0
      (decision P8) — do not list "Offers In-App Purchases".
- [ ] Privacy Policy URL: host `privacy-policy.md` (GitHub Pages or the marketing site) and
      paste the URL. Support URL: same site or a mailto page.
- [ ] App Privacy questionnaire: with PostHog key set → "Product Interaction", not linked
      to the user, not used for tracking, purpose Analytics. Without the key → "Data Not
      Collected". Must match the privacy manifest in `app.json`.
- [ ] Export compliance: the app sets `ITSAppUsesNonExemptEncryption = false` (HTTPS only).

## 4. Screenshots (6.7" — 1290×2796; 6.5" and 5.5" if the record demands them)

Film on device, in this order, per `../aso.md` §Screenshots. Text-only overlays, no faces:

1. Live HUD mid-session (13:52 · Day 1 · Round 3 · Jumping pull-ups 4/5).
2. Pick your version.
3. Calendar, Day 9 of 30, 7 lit.
4. "Not counted · Chin over the bar" with "+1 · it was clean".
5. Day card 11 + 4, day 1 → today.
6. Share sheet with the card.

- [ ] App preview video (10 s, muted) per `../aso.md` — optional for 1.0, required before
      the Oct 1 push.

## 5. Review notes

- [ ] Paste `metadata/en-US/review-notes.txt` into App Review Information → Notes. Camera
      apps that count movement get asked "how do we test this?"; the notes answer it.
- [ ] Sign-in: not required. Demo account: none.

## 6. Submit and release

- [ ] `npx eas submit --platform ios --profile production` (or upload from EAS dashboard).
- [ ] Release: **manual** release after approval, timed with the first post (Rank 0 gate in
      `../market-check.md` §6: store page, install path, and analytics live before content).
- [ ] After approval: `npx eas update --channel production --message "retune: …"` ships
      detector threshold changes over the air. Native module changes need a new build.

## 7. Known review risks and the answer

| Risk | Answer |
|---|---|
| 4.3 spam / "another fitness timer" | Fixed-length challenge verified by on-device pose detection for one benchmark; unique mechanic (review-notes.txt). |
| 5.1.1 camera purpose | Purpose string names the reason and states nothing is recorded; the Settings screen repeats it. |
| 2.1 crash on camera denial | Denial path shows a panel with "Open Settings" — never a blank screen. |
| "Cindy" / CrossFit® | Only in description as a generic benchmark; no ® marks, no gym brand in name/subtitle/keywords. |
| Marvel / performer IP | None on any owned surface (brand pack, permanent). |
