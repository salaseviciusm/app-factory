# pullup — Market notes (stage 2 evidence)

Raw evidence backing spec.md §2. Source: iTunes Search API + App Store customer-review
RSS feeds, pulled 2026-08-02 (US storefront). Ratings/counts are point-in-time.

## Competitor set (real listings)

### Direct — camera / on-device pose rep counters
| App | Dev | Rating (n) | Model | Notes |
|---|---|---|---|---|
| **GOLDEN Bars – Pull ups & Dips** (id 6738278657) | Stephan Duechtel | 4.29 (7) | Free + IAP (~$10/yr reported) | **Near-identical to our spark.** On-device AI pose, real-time pull-up + dip counting, "full range of motion and pace", adaptive plans, global + private leaderboards, video/photo journaling, widgets. Released 2024-12-17, min iOS 17. One-person team, tiny install base — first-mover but unproven at scale. |
| **GOLDEN Push Up Pushup Tracker** (id 6657950305) | Stephan Duechtel | 4.56 (68) | Free + IAP | Same dev's pushup version — the pose tech in the wild, more reviews to mine. Form tips, goals, public challenges, Apple Watch count. |
| **Push Up Counter & Tracker** (id 6470828037) | WSFU | **4.84 (3,124)** | Free + sub + lifetime | **The category-proof point.** Camera/motion pushup counter with a 100-pushup program, widgets, Apple Health/Fitness sync, lifetime-unlock option (praised). Retains and converts at volume. |
| Push Up Arena (id 6762318743) | Airix | 4.64 (942) | Free | Gamified camera pushup "arena"/fights — social/competitive angle works. |
| RepUp: Push-ups Pull-ups (id …) | Junhyeok Lee | 4.0 (2) | Free | Tiny; camera counter, pull-ups + push-ups. |
| Pushup Form Counter: AI Reps / PUSHUP – AI Rep Counter / Pushup AI: Form & Rep Counter | various | ~0–1 ratings | Free | A cluster of brand-new "AI form + rep" entrants — signals the category is being rushed by solo devs right now. |

### Adjacent — manual tap counters (no camera)
Pull Ups Counter (3.0, tap), Pull-Ups! by Pepi (4.65, 2.4k — grease-the-groove reminder/counter),
Tally/Counter+ apps (generic). These own the literal "pull up counter" phrase today but deliver
nothing on form/ROM.

### Adjacent — calisthenics programs (the wall; do NOT fight here)
Thenx (4.77, 12.3k), Muscle Booster (4.55, **136k**), Heria Pro (4.76, 7.5k),
RepCount (4.85, 12.9k), Hybrid Calisthenics (4.79, 2.3k), Calisteniapp (4.79, 1.6k).
Content/program apps with huge install bases. None do camera rep-quality analysis — different job.

## Review mining — what users of camera counters actually complain about

Pulled from WSFU Push Up Counter (3.1k ratings) and GOLDEN Push Up (the exact pose tech):

**1. Miscounting is the #1 killer.**
- "the new strict rep tracking is terrible and off… I'll do the same reps over and over and it will only count some of them" (3★)
- "Misses reps… I seem to go too fast for it" (3★)

**2. Reliability / freezing.**
- "The counter just randomly stops working. You do a push up and it is just frozen… this is with good lighting too" (1★)

**3. No manual fallback = hard dependency on the camera.**
- "Can't do manual tracking — literally if camera doesn't track push up doesn't work" (1★)

**4. Form judgment is shallow → trivially cheatable (kills leaderboards).**
- "Amazing app but easy to finesse the camera system" (1★)
- "easy to cheat… motion capture should see if your knees are touching the ground or not to count the rep. So it's easy to cheat and get better scores than your friends on the leaderboard" (1★)
- "easy to use… until I realized it's easy to cheat" (3★)

**5. Price sensitivity in a young demographic.**
- "only thing I don't like is having to pay for stuff", "can it be free", "makeitfree", refund/login complaints.
- Counter-signal: lifetime unlock is loved ("ability to have a lifetime purchase alone is outstanding").

**6. Edge-case UX matters (sweat, framing).**
- "sweat drops and lands on the end button… ends the round… when you're already 80 pushups in".

**What they love (the core value to protect):**
- Hands-free counting removes cognitive load: "gets rid of the stress of keeping track and using extra energy", "helps me count instead of focusing on counts."
- Motivation loops: streaks, widgets, leaderboards, goals, public challenges.
- Feature requests recur: **squats and other movements** ("make one for squats").

## ASO landscape

- **"pull up counter"** — exact phrase is *under-served*: the top result that does real AI (GOLDEN Bars)
  has 7 ratings; the rest are manual tap counters. Low-to-moderate competition on the exact phrase.
- **"push up counter"** — *proven money keyword* (WSFU 3.1k ratings) but more crowded. Pull-up is the
  softer, winnable variant.
- **"calisthenics" / "workout tracker"** — saturated by 10k–136k-rating incumbents. Do not target as primary.
- Implication: primary keyword phrase built around **pull up counter / form / range of motion**;
  push-ups + dips as secondary keyword surface later (same pose pipeline).

## Platform / tech reality check

- Apple Vision `VNDetectHumanBodyPoseRequest` (2D, 19 joints) / ARKit body tracking → on-device,
  free, private, offline. Correct tool; confirms iOS-native.
- **Pull-ups are the *hardest* bodyweight movement to track**: vertical full-body framing, overhead
  arm occlusion at the top, phone must be propped far back. The #1 review complaint (miscounts) is
  worse here than for push-ups. Capture ergonomics + count accuracy are the make-or-break risk →
  validate with an early spike before committing design.
