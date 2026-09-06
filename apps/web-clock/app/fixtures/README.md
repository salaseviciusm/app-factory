# Fixtures

Keypoint tracks only — never video. Safe to commit, safe to share.

```
fixtures/<move>/<name>.json          # produced by tools/csv-to-fixture.mjs
fixtures/<move>/<name>.expect.json   # what actually happened in the clip (the golden)
fixtures/negative/<name>.json        # a movement no detector should count (rows, burpees…)
fixtures/negative/<name>.expect.json # { "maxCounted": { "pullup": 0, "pushup": 1 }, "note": … }
```

Snippets cut from a longer clip carry a `window` (`fromSec`/`toSec` in the source video)
so the moment can be found again. Whole-clip fixtures are for `npm run scan`, not for
committing.

`tests/goldens.test.ts` replays every fixture with an expect file through the detector
for its folder. Expect file shape:

```json
{
  "counted": 5,
  "tolerance": 0,
  "plan": { "pullup": "jumping" },
  "maxRejects": 2,
  "rejectsMustInclude": ["hang-short"],
  "note": "front/¾, phone on a shelf at hip height, 2.5 m"
}
```

Current fixtures come from the pullup spike (Coverr CC0 clips). Founder footage lands
here after the footage session — see `../../tuning.md`.
