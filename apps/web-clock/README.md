# web-clock · Suit Up

Factory app and the factory's first distribution pilot: a 30-day challenge on the
20-minute 5-10-15 (Cindy), counted by on-device Apple Vision. The Expo app is
stamped and implemented end to end in `app/`; store assets and copy are in
`store/`. **It has not run on a phone yet and has no accuracy figure.** Founder
footage (see `tuning.md`) is the next input.

## Start here

- [`tuning.md`](tuning.md) — what to film tomorrow, footage → fixture → golden,
  how to read a failure, how to ship a retune over the air.
- [`store/submission-checklist.md`](store/submission-checklist.md) — every step
  from Apple Developer account to manual release, with the review risks answered.
- [`architecture.md`](architecture.md) — design (§1–18) and the as-built deltas
  (§19).
- [`decisions.md`](decisions.md) — P1–P12, all proposed until the founder gate.
- [ASO listing — Suit Up](canvases/aso.html) / [`aso.md`](aso.md) — the store page
  and the six-frame UI contract the screens were built to.
- [`market-check.md`](market-check.md), [`directions.md`](directions.md) — the
  viability report and the four directions considered before the pick.

## Run it

```sh
cd app
npm ci
npm run check                 # typecheck, prettier, 34 tests incl. goldens
npx expo prebuild -p ios      # local native module autolinks; needs a Mac
npx eas build -p ios --profile development
```

In Expo Go or the simulator the native module is absent and the app falls back to
the synthetic pose source; debug builds expose the source switch in Settings.

Serve `canvases/` with any static server (e.g. `python3 -m http.server`) to view
the listing boards; fonts load from Google Fonts.
