# Suit Up — ASO brief (chosen direction D, 30-day challenge)

**2026-09-05.** Markdown twin of `canvases/aso.html`. Direction D from `directions.md`,
merged with B's off-store marketing angle (the hero workout) and the lock-in-season hook.
Founder pick recorded in `decisions.md` P5.

## Positioning

Every "lock in" app on the store is a checkbox. Ours is the one where the phone watches
you do the work. Thirty days of the 20-minute hero workout (5 pull-ups / 10 push-ups /
15 air squats, as many rounds as you can), scaled to where you start, counted by the
camera, scored on a card you can post.

**Wedge, one sentence:** a 30-day discipline challenge where you cannot tick the box —
the camera counted, or it didn't happen.

## Metadata (iOS)

| Field | Value | Chars |
|---|---|---|
| Name | Suit Up (alts: Round One · Proof of Work · Thirty) | — |
| Title | `Suit Up: 30-Day Hero Workout` | 28 / 30 |
| Subtitle | `The camera counts. Lock in.` | 27 / 30 |
| Keywords | `pullup,pushup,squat,amrap,cindy,challenge,rounds,timer,bodyweight,rep,winter,arc,discipline,streak` | 98 / 100 |
| Promotional text | Winter Arc starts Oct 1. Thirty days of the 20-minute hero workout, counted by your camera. Start scaled. Finish Rx. Post the card. | ≤ 170 |
| Category | Health & Fitness · 4+ · iOS 17+ · Offers IAP | |
| In-app event | **Winter Arc — 30 days, camera-counted.** Starts Oct 1. Pick your version on day 1. Post the card on day 30. | |
| Play short description (reserved) | 30-day bodyweight challenge. Camera counts pull-ups, push-ups, squats. | 71 / 80 |

Rules honoured: no title/subtitle words in keywords, no plurals, no CrossFit®, no
75 Hard®, no film IP. "Lock in" sits in the subtitle because it is the phrase behind a
26,542-rating app and it is a benefit line, not stuffing.

**Description, above the fold.** Thirty days. Twenty minutes a day. Five pull-ups, ten
push-ups, fifteen squats, as many rounds as you can. Knee push-ups and jumping pull-ups
count. The camera counts every rep — so a day is only lit when you actually did it. Day 30
is a card: your number vs day 1. No account. No ads. Nothing leaves your phone.

## Screenshots (6.7", portrait) — the UI contract

| # | Caption | Screen | Contract |
|---|---|---|---|
| 1 | Day 1. 3 rounds. **Counted.** | Live HUD: 13:52 · DAY 1 · ROUND 3 · JUMPING PULL-UPS 4/5 · +1 / PAUSE / FINISH | tabular clock, current move, reps in set, manual +1 always present |
| 2 | Start where you are. | Pick your version: pull-ups / jumping pull-ups · knee push-ups / push-ups · air squats → SUIT UP | scaled variants are first-class, chosen on day 1 |
| 3 | 30 days. You can't tick the box. | Calendar: DAY 9 OF 30, lit / rest / today; 7 counted · 2 rest · 3 → 6 rounds | a day is lit only when the camera saw a finished 20:00 |
| 4 | Not sure? Not counted. | NOT COUNTED · CHEST SHORT · DO IT AGAIN, with "+1 · it was clean" | visible reject with reason; never freeze silently |
| 5 | Day 30 vs day 1. | Card: 11 + 4 · DAY 1 · 3 · TARGET · 27 bar · +8 rounds · 26 days counted · Rx from day 19 | day-1 vs day-30 is the score; target optional |
| 6 | Post the card, not your face. | Share card: 3 → 11 · 30 DAYS · 26 COUNTED · skeleton replay | keypoints only; solves the footage problem |

Frames 1–3 are what search shows. If a frame cannot be filmed, it does not ship.

**Preview video (10 s, muted autoplay):** 0–1 phone propped · 1–2 gate green · 2–5
pull-ups 1→5 with the clock · 5–7 a calendar day lights · 7–10 the card 3 → 11. Text only.

## Marketing angles (off the store)

| Angle | First clip | Rides | Line not crossed |
|---|---|---|---|
| 1 · The hero workout | "The workout he says he does — 27 rounds. I'm starting at 3. Thirty days." | Men's Journal / AOL 2026-07-30: *"I think my record is 27 rounds… Think you can beat Holland's record?"*; film at $2.04bn | Content only. Never on store, icon, or in-app. No likeness, stills, logo, audio. Founder sets comfort. "27" is a number. |
| 2 · Lock-in season | "Lock-in season starts Oct 1. Every lock-in app is a checkbox. This one has a camera." | Lock In 26,542 · LOCKED 5,056 · Reload 1,262 · two Winter Arc apps in 2026; none verifies | Compare the shape, not a named app, on screen. |
| 3 · Day-N progress | "Day 1: 3 rounds. Day 30: 11. My phone counted every one." | Founder-as-subject; the card carries it | Shirt on or skeleton framing. |
| 4 · Query answers | "How many rounds of Cindy is good? I asked 30 days of my own data." | YouTube long-form; real queries ("tom holland workout how many rounds", "cindy scaled") | Honest numbers, including where the camera loses. |

**Calendar.** Now → Sep 30: Rank 0 (listing, install path, Gate 0), then tease. Oct 1:
Winter Arc cohort day 1, in-app event live. Oct 1–30: day-N content, every comment
answered within ~2 hours. Oct 30 → Nov: day-30 cards, then the read — installs per
1,000 views by format; one of four pre-agreed outcomes (`market-check.md` §6).

## Challenge rules (product must ship)

30 days · one workout (20:00 Cindy) · 5 of 7 days counted (rest is a rule, not a
failure) · scaled variants count and are named on the card · score = day-1 rounds vs
day-30 rounds, optional target (default 27) · share a card, never a rank (no public
leaderboard in v1).

## Identity

Palette: `#0F1013` graphite · `#16171C` panel · `#D4FF3F` volt (the only colour that
means "counted") · `#EEF0F4` frost · `#FF5F4A` reject. Type: Syne 800 display and
numerals, Inter body, IBM Plex Mono labels. Icon: thirty ticks around a "30", nine lit.
Voice: second person, short, no guilt — *counted, lit, day, rounds, scaled, Rx, card*;
never *grind, shred, AI, beast, cheat day*.

IP, permanent: no Marvel / Sony / performer names, likenesses, stills, webs, or
red-and-blue trade dress on any owned surface; no CrossFit® or 75 Hard® in metadata;
"Cindy" in keywords/description only. Bundle `com.salaseviciusm.suitup`, scheme `suitup`,
codename `web-clock`.

## Apple 4.3

A fixed-length bodyweight challenge whose completion is verified by on-device Vision
detectors for one three-movement benchmark — not a habit tracker, not a timer skin, not
an N-exercise AI counter.

## Founder calls

1. Name — default **Suit Up** (alts above; "Lock In" itself is taken at 26k).
2. Cohort date — default **Oct 1**; decides whether v1 ships scaled detectors or Rx +
   manual scaled mode.
3. How far the hero angle goes in content — default: report the public quote, nothing else.
4. Free calendar or paid — default **free**; Pro is history across arcs and the export.
