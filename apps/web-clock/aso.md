# web-clock — ASO brief

Companion to the visual board at `canvases/aso.html`. Playbooks:
`playbooks/aso.md`, `docs/marketing/platforms/paid/aso.md` (2026). US iTunes
pulls 2026-09-05.

## Naming

| Field | Value | Chars |
|---|---|---|
| Brand / home label | Web Clock | 9 |
| iOS title | Web Clock: AMRAP Counter | 24 / 30 |
| iOS subtitle | Camera reps. 20-min clock. | 26 / 30 |
| Primary phrase | amrap counter | — |
| Bundle | com.salaseviciusm.webclock | permanent |
| Scheme | webclock | — |

Rejected for store use: Spider-Man, Spiderman, Holland, Brand New Day, any
web-shooter icon. Apple’s AI tags must be reviewed at launch; delete cinematic
or Marvel-adjacent tags.

Collision check: “Web Clock” hits employee time-clock apps, not fitness.
“Cindy” is already taken by `Cindy: Workout Timer & Counter` (id 6797837670).
“5-10-15” is the fallback if the founder wants the workout in the name.

## Keyword field (iOS, 96/100)

```
pullup,pushup,squat,wod,cindy,timer,vision,pose,fitness,bodyweight,rounds,score,hiit,form,strict
```

No spaces, no plurals, no repeats of title/subtitle tokens (`web`, `clock`,
`amrap`, `counter`, `camera`, `reps`).

## Play short description (71/80)

```
Camera counts 5-10-15. Pull-ups, push-ups, squats. You watch the clock.
```

iOS description is conversion-only (not indexed). Play long description is
indexed — write it separately, with the same three-line pitch on top.

## Screenshot captions (benefit-first)

1. It counts. You just move.
2. Won’t start until the frame is honest.
3. It advances when you do.
4. If it’s unsure, it doesn’t count.
5. Rounds and leftovers. That’s the sport.
6. Same three moves. A number you can beat.

Frame 1 is the live HUD. If we cannot film a frame, it does not ship on the
listing.

## 4.3 defense

Not a reskinned WOD timer and not another N-exercise AI counter. Custom value:
on-device Vision detectors for the 5-10-15 circuit, Cindy scoring, framing
gate, undercount-when-unsure.

## Competitive snapshot (US)

| App | Ratings | Note |
|---|---|---|
| Cindy: Workout Timer & Counter | 0 | Tap Cindy clock, Aug 2026 |
| CindyMax | 0 | Same |
| SmartWOD Timer | 54,032 / 4.94 | Category clock, no pose |
| WSFU Push Up Counter | 3,124 / 4.84 | Camera count can sell |
| GOLDEN Bars | 7 / 4.29 | Pull-up camera, stalled |

## Post-launch (not this pass)

CPP for query `cindy workout` vs `pull up counter`. PPO on frame-1 caption.
Featuring nomination only after Live Activities / a real listing exist. Ratings
gate paid spend at 4.0.
