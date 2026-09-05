# web-clock — Market check and viability report

**Compiled:** 2026-09-05 (second pass, after founder rejected the first ASO board).
**Roles applied:** product-lead (stage 2 owner), researcher duties (store mining, ASO
landscape), marketing-lead duties (distribution pilot), per `agents/` and
`orchestration/prompts/new-app-market-check.md`.
**Method:** iTunes Search/Lookup API, `country=us` unless marked GB, retrieved
2026-09-05; iTunes customer-review RSS (most recent 50) for the rivals that matter;
repo evidence (`apps/pullup/spikes`, `docs/marketing/**`). Rating counts are a
consistent proxy for installs, not a measure of them; read ratios, not levels.

Evidence tags: `[DOCUMENTED]` source given · `[ANECDOTAL]` real but unaudited ·
`[ASSUMPTION]` my inference · `[GAP]` looked and could not establish.

Companion files: `directions.md` (four listing directions), `canvases/aso.html` (the
visual board), `architecture.md` (what we would build).

---

## 0. What we are actually proposing

A camera-counted **20-minute AMRAP of 5 pull-ups / 10 push-ups / 15 air squats**
(the CrossFit benchmark "Cindy"), scored the way the workout is scored (rounds +
leftover reps), on a propped iPhone, on-device Apple Vision, no account. Framed and
sold as a **challenge** with a public target number, because the founder wants this
app to be the **distribution pilot** the studio has never run, and a challenge is
the only consumer-app shape whose marketing is also its product.

Nothing is built. Pose feasibility for pull-ups is `VALIDATED` in
`apps/pullup/spikes/001` and `002` `[DOCUMENTED]`. Push-up and squat detectors are
new work on the same seam. The three-moves-from-one-propped-frame question is open
until the founder's raw clips exist.

---

## 1. The store, in numbers

### 1.1 The clock is a proven wallet; the camera is not (yet)

| Lane | App | US ratings | Avg | Note |
|---|---|---|---|---|
| WOD clock | Interval Timer — HIIT Timer | **86,352** | 4.84 | generic |
| WOD clock | SmartWOD Timer — WOD Clock | **54,032** | 4.94 | the CrossFit default |
| WOD clock | Seconds Interval Timer | 23,600 | 4.69 | |
| WOD clock | PushPress Workout Timer | 5,775 | 4.82 | gym-tethered |
| WOD clock | Box Timer — Simple WOD Clock | 2,883 | 4.87 | |
| Named-WOD clock | **Cindy: Workout Timer & Counter** (2026-08-18) | **0** | — | exact WOD, tap only |
| Named-WOD clock | **NoRep: WOD & HIIT Timer** (2026-08-05) | **0** | — | |
| Named-WOD clock | The WOD Timer / WOD Timer / AMRAP Timer WOD HIIT (2026) | 0 / 0 / 0 | — | three more this year |
| Camera count | **Push Up Counter & Tracker** (WSFU) | **3,283** | 4.84 | the only camera counter that sold |
| Camera count | Push Up Counter GOLDEN PushUps | 72 | 4.58 | |
| Camera count | Squat Counter! — Auto Count | 31 | 4.65 | |
| Camera count | The Squat Counter AR | 13 | 4.38 | |
| Camera count | GOLDEN Bars — Pull ups & Dips | **7** | 4.29 | pull-up specialist, stalled |
| Camera count | Form Coach: Camera Rep Counter (2026-05) | 2 | 5.00 | |
| Camera count | Squat Counter — Auto counting (2025-11) | 1 | 4.00 | |
| Camera count | PushUp Counter — Auto Counting (2025-12) | 0 | — | |

`[DOCUMENTED]` iTunes Search API, US, 2026-09-05.

**Three inferences.**

1. **A timer alone is not a product.** Six named-WOD or AMRAP timers shipped in 2026,
   including one that *is* Cindy by name, and none has a single rating. We will not
   ship the seventh.
2. **Camera counting has sold exactly one thing: push-ups.** WSFU at 3,283 is the
   category proof; everything else (squats, pull-ups, jump rope — skip-hero's own
   research found 44 US ratings across five camera jump-rope apps) is single- or
   double-digit. **Do not lead with a single move.** The thing that has never been
   tried is the *circuit plus the score*: the camera doing what the 54k-rating clock
   does not, inside the clock those people already buy.
3. **The CrossFit/functional clock buyer is real and has grievances** (see §2). That
   is the audience with a demonstrated wallet next door to our wedge.

### 1.2 Search terms the challenge would ride, and who owns them on the store

| Query | Top result | Read |
|---|---|---|
| `spiderman workout` | BODi (298k), Camp Gladiator, Volt… | Nobody occupies it; Apple returns generic programs. This demand lives on TikTok/YouTube, not App Store search. |
| `tom holland workout` | Fitify, Muscle Monster, Volt… | Same. |
| `hero workout` | Hero WOD — Workouts Generator (**54**) | The CrossFit sense of "hero" is nearly empty. |
| `amrap counter` | Tally counters (13,633 …) | No fitness app owns the phrase. Open. |
| `cindy workout` | Cindy: Workout Timer (0), then generic programs | Open, tiny. |
| `no rep` | No Rep (0), NoRep timer (0), RepLock (40) | Name is taken twice at zero traction. |
| `30 day challenge workout` | 28k–58k-rating programs | Saturated; do not fight here. |
| `calisthenics` | Thenx **12,343**, Hybrid Calisthenics 2,550, Military Calisthenics 788 | Real audience; content-led, not camera-led. |

`[DOCUMENTED]` same method. **Implication:** the store cannot be where a
movie-adjacent challenge is *discovered*; it is where it *converts*. The listing has
to be built for someone arriving from a clip who already knows the number they want
to beat. That decides the screenshot order in every direction (`directions.md`).

---

## 2. Review mining — what rivals' users say

Most-recent 50 US reviews per app, 2026-09-05. `[DOCUMENTED]`

**Push Up Counter & Tracker (WSFU, 3,283).** The 1★/3★ pattern is one complaint:
*"often the thing just doesn't register your push ups… mid set and trying to get this
thing to register you"*, *"the counter just randomly stops working… throws you out of
your rhythm"*, *"Literally if camera doesn't track push up doesn't work"* (no manual
fallback), *"misses reps… I seem to go too fast for it"*, *"won't work in anything but
great lighting"*, *"sweat drops and lands on the end button… immediately ends the
round"*, *"should allow for a wider camera angle."* The 5★s are about motivation and
a leaderboard (*"I am a teenager… 300 pushups in 2 days… the leaderboard"*), and a
**lifetime purchase** is called out as *"outstanding."*

**GOLDEN PushUps (72).** *"easy to cheat… should see if your knees are touching the
ground… better scores than your friends on the leaderboard."* And, verbatim:
*"people create an app for squats that would be amazing."*

**SmartWOD (54,032 — the incumbent clock).** Recent reviews are a revolt: *"ads that
look like porn"*, *"full-screen takeover ads… couldn't be closed"*, *"I pay for
Premium… still get ads"*, *"automatic background music duck… had to change apps"*,
*"most recent update wiped out my workout history."*

**What this dictates (product requirements, not nice-to-haves):**

| Complaint | Requirement |
|---|---|
| Missed reps, frozen counter | Visible **"not counted"** state + **manual +1** always on screen. Undercount when unsure; never freeze silently. |
| Sweat hits End | No destructive control in the bottom third during a live set; hands-free finish gesture. |
| Cheatable, leaderboards poisoned | Strictness is the trust story (lockout, depth, chin-over-bar). **No public leaderboard in v1.** Share a *card*, not a rank. |
| Ads, music ducking, lost history | Zero ads ever. Never touch audio. Event log = history cannot be "wiped by an update." |
| "Make one for squats" | The circuit includes squats. Say so in frame 1. |
| Lifetime praised, paywall resented | Offer lifetime alongside annual. |

---

## 3. Why now

- **Spider-Man: Brand New Day** opened 2026-07-31 (US), grossed **$2.04bn**,
  highest-grossing film of 2026 `[DOCUMENTED — Wikipedia, retrieved 2026-09-05]`.
- Men's Journal / AOL, **2026-07-30**: *"Try Tom Holland's Favorite CrossFit 'Cindy'
  Workout… 'I think my record is 27 rounds.' Think you can beat Holland's record?…
  we challenge you to give it a try."* `[DOCUMENTED]` The challenge framing and the
  target number already exist in mainstream press; we would be joining a conversation,
  not starting one.
- The reference Short (`eCL3aXcgU6U`) is one of many riding the same wave.
- Vision is good enough for gross reps (pullup spikes) and the template's pose seam,
  event core, and fixture-replay pattern exist. Detector work is the only new engineering.

**The honest counter-weight:** cultural interest around a film decays. `[GAP]` I have
no Google Trends access from this environment and will not invent a curve. Treat the
window as **open now, narrowing**, with a plausible second bump at digital/streaming
release `[ASSUMPTION]`. This is the strongest argument both *for* moving and *against*
over-investing before the first 30 posts have been read (§6).

---

## 4. Audiences — four candidates, one per direction

Each: who, size signal, want, hook, and the strongest reason it is wrong. Direction
letters map to `directions.md` and the board.

### A — The benchmark crowd (CrossFit / functional fitness) → direction **Twenty**
- **Size signal:** SmartWOD 54k, Box Timer 2.9k, PushPress 5.8k; Hero WOD 54. They
  buy clocks and pay for Premium. `[DOCUMENTED]`
- **Want:** their Cindy score without counting rounds in their head; history; no ads.
- **Hook:** *"What's your Cindy? Mine's 14+7, and I didn't count a single round."*
- **Wrong because:** many already have a box clock and a judge; kipping pull-ups are
  the norm and a strict detector will *no-rep* their whole set (§5 accuracy). Smallest
  reach of the four; highest intent.

### B — The movie-fitness / "I did X's workout" audience → direction **Rooftop**
- **Size signal:** the largest cultural surface of the four (a $2.04bn film; mainstream
  press issuing the exact challenge). `[DOCUMENTED]` App-store demand for the phrase
  is zero because it is a *content* audience, not a *search* one (§1.2).
- **Want:** a number to post. "27" gives them one. A card they can share without
  filming themselves.
- **Hook:** *"He does 27 rounds in 20 minutes. My phone counted mine. 9."*
- **Wrong because:** trend-shaped; intent is a novelty, not a habit; 16–25 male skew
  resents paywalls (WSFU reviews). This is the **distribution** audience, not the
  **revenue** audience — and that is exactly what a pilot wants.

### C — Calisthenics purists / the "was that a real rep?" argument → direction **Strict**
- **Size signal:** Thenx 12,343, Hybrid Calisthenics 2,550 `[DOCUMENTED]`;
  r/bodyweightfitness dense, promo-hostile (`platform-selection.md`, pullup).
- **Want:** a judge. GOLDEN's cheat review is the demand statement.
- **Hook:** *"It no-repped me six times. Watch."* Argument-bait is the documented
  unconnected-reach lever.
- **Wrong because:** a wrong no-rep on camera is worse than no readout (skip-hero
  A2 lesson); we have **no published accuracy figure** `[GAP]`; "No Rep" as a name is
  already taken twice.

### D — At-home beginners, 30-day-challenge shape → direction **Round One**
- **Size signal:** 30 Day Fitness 58k / 28k, Home Workout — No Equipments 124k
  `[DOCUMENTED]`. Largest headcount, best-converting store category (H&F D35 2.9%,
  `bootstrapped-baseline.md`).
- **Want:** permission to be bad at it; scaled moves; a streak.
- **Hook:** *"Day 1: 3 rounds. Day 30: 11. My phone counted every one."*
- **Wrong because:** this is a coaching-content business (Crossrope lesson); the lane
  has 100k-rating incumbents; scaled moves (knee push-ups, jumping pull-ups) are new
  detector variants before we have tuned the Rx three.

---

## 5. Platform selection — the six questions (`docs/marketing/synthesis/platform-selection.md`)

- **Q1** consumer, own money, cheap → **yes**, short-form lane.
- **Q2** legible muted in 5 s → **yes, strongly**: clock running, count climbing,
  "ROUND 9", then the score card against 27. Cal AI shape.
- **Q3** assembled community → **yes**: FitTok, calisthenics, CrossFit IG, *and* right
  now the movie-workout genre. The last is the one with a clock on it.
- **Q4** ten honest search queries → **yes**: "tom holland workout", "cindy workout how
  many rounds", "what is a good cindy score", "cindy workout scaled", "how to do the
  spiderman workout", "20 minute bodyweight amrap", "how to count amrap rounds",
  "beginner cindy", "cindy vs murph", "pull ups push ups squats workout". The YouTube
  long-form lane is genuinely open.
- **Q5** shareable artifact → **yes, and this is the pilot's engine**: the score card
  (skeleton replay + number vs target). Build it in v1; it also solves the
  shirtless-garden footage problem the skip-hero research flagged.
- **Q6** paywall → see §7. For the pilot: freemium; state it, so we know we are
  organic-only by design.

**Routing:** IG Reels + YT Shorts + TikTok primary; YouTube long-form query answers
as the compounding lane; Reddit participation-only; never X/LinkedIn.

---

## 6. The distribution pilot — what we are buying, and how we read it

The founder's stated goal: learn distribution here so it transfers to pace and
skip-hero. Design the pilot so the *learning* is the deliverable even if the app
never earns.

**Gate 0 before any post** (`playbook.md` §6, skip-hero F8): store listing live in
every target storefront; hard-checked install path; `acquisition` envelope on every
event; AdServices token; installs-per-1,000-views computable by format. The LifePilot
failure (Italian listing, 11 downloads) is the failure we are most likely to repeat.

**Content unit:** one ~40-minute recording session → 8–15 distinct clips (never one
clip cut fifteen ways). Founder is the subject; shirt on or skeleton-replay framing.
Every comment answered within ~2 hours, every post.

**Formats to test (the pilot is a format A/B, not a channel A/B):**
1. The attempt: cold open on the propped phone, clock at 00:00, cut to the card.
2. The target: "27" on screen for 0.5 s, then my number. Comment-bait by construction.
3. The judge: a no-rep called live. Argument-bait.
4. The scaled attempt: same clock, knee push-ups, honest number.
5. The query answer (YouTube long-form, 6–8 min): "How many Cindy rounds is good?"

**Floor:** 30 posts per platform before any conclusion (taxonomy F5). Diagnostic
metric: **installs per 1,000 views by format**, then view→store→install→D7.

**Pre-agreed outcomes at review** (write them down now, not after):
- *Continue:* any format ≥ the ~0.5% view→install baseline with non-zero comments.
- *Reposition:* installs fine, D7 dead → the challenge landed, the product didn't;
  move the store face to **Twenty** (A) for the benchmark buyers.
- *Reprice:* installs and D7 fine, zero conversion → flip to hard paywall + 17–32 day
  trial (`bootstrapped-baseline.md` §7).
- *Kill:* 30 posts, zero comments, <1% link-click → the reveal is not landing; stop
  filming, keep the engine for skip-hero/pullup.

**What transfers to pace and skip-hero, regardless of outcome:** the *challenge
template* — a named public target number, a share card the product renders, daily
attempt content, comment-driven install path, Gate 0 instrumentation. Pace's
version is a sub-30 5k; skip-hero's is an unbroken-N count. This app is the cheapest
place to learn the template because the target number already exists in the press.

---

## 7. Monetization

- Category baseline: Health & Fitness D35 download→paid **2.9%**, D60 RPI **$0.66**
  — the best category in RevenueCat's data `[DOCUMENTED — bootstrapped-baseline.md §3]`.
- Hard paywall converts 5× (10.7% vs 2.1% D35) and trials of 17–32 days beat short
  ones (42.5% vs 25.5%) `[DOCUMENTED — same]`. That is the *revenue* answer.
- The *pilot* answer is different: a challenge app whose aha is behind a paywall
  produces no shareable cards and no clean funnel read. **Recommendation for v1:**
  free live count + today's card; **Pro** = history, PB, "vs target" progression,
  skeleton replay export. Annual ~$19.99 *and* lifetime ~$29.99 (reviews prize
  lifetime). Flip to hard-paywall + long trial at the *Reprice* outcome, not before.
- Frequency is 2–4×/week. If history is not why people return after 30 days, this is
  a one-time unlock, not a subscription (pullup spec's own conclusion).

---

## 8. IP, trademark, and Apple 4.3

- **No Marvel / Sony / Spider-Man / Holland strings, likenesses, or trade dress**
  anywhere on the store listing, icon, or in-app. Red-and-blue web motifs are trade
  dress; avoid. `[ASSUMPTION — not legal advice]`
- **Content** may report the publicly quoted workout and number as commentary the
  way Men's Journal did. The founder decides comfort; the listing never depends on it.
  **"27" is a number.**
- **CrossFit®** is a registered mark: never in title/subtitle/keywords. "Cindy" is a
  workout name in common use with two shipped apps using it; **moderate risk**,
  acceptable in subtitle/keywords, avoid as the brand `[ASSUMPTION]`. "AMRAP" is generic.
- **4.3 defense (one sentence):** an on-device Vision specialist for a single
  three-movement benchmark, scoring rounds + leftovers with a framing gate and
  visible no-reps — not a timer skin, not an N-exercise AI counter, not a fork of
  skip-hero's screens.

---

## 9. Reasons NOT to build this

Mandatory and honest. A kill here is a success.

1. **Camera counting has never sold anything but push-ups.** Five jump-rope counters
   share 44 ratings; the pull-up specialist has 7; squat counters are single-digit.
   We are betting the circuit + score is the missing half. That is a hypothesis with
   no precedent on the store.
2. **Trend chase.** The why-now is a film. If the native module, three detectors,
   footage tuning, listing, and Gate 0 land after interest has decayed, we have built
   a fourth camera counter into a lane that has already told us its size. Mitigation:
   the *engine* is reusable (pullup, skip-hero), and direction A is a trend-free fallback.
3. **Three moves from one propped camera is unproven.** Pull-ups want a bar in frame
   at ~¾ front; squats want full body with hips/knees; push-ups are low and
   foreshortened from a propped phone. Spike 002 says 3D hips carry no signal, so
   squats are 2D-only. If a single placement cannot hold all three, the workout
   becomes "reframe the phone twice per round," and that kills the reveal.
4. **Strictness cuts both ways.** A strict detector will no-rep the kipping pull-ups
   most people actually do. Direction C makes that the product; directions A/B/D need
   a *scaled* or *lenient* mode or they will be one-starred for "missing reps" —
   the exact WSFU complaint.
5. **Low frequency, weak subscription.** 2–4×/week. The category's revenue lever is a
   hard paywall we are deliberately not pulling during the pilot.
6. **Opportunity cost.** `open-questions.md` already recommends running the first
   90-day pipeline experiment on **skip-hero**. This app jumps the queue on the
   strength of a live cultural hook skip-hero lacks. That is a real argument; it is
   also the argument that this is a trend chase (2).
7. **We have no accuracy figure for any detector.** Goldens prove reproducibility, not
   correctness. A visibly wrong count on the founder's own clip is worse than no clip.

---

## 10. Verdict

**Build — as the distribution pilot, on the challenge angle, with three gates:**

1. **Footage gate:** the founder's raw clips, run through `pose-extract`, show all
   three movements detectable from one propped placement. If not, stop before the
   native module.
2. **Rank 0 gate:** listing, install path, and Gate 0 instrumentation live before the
   first post. No content before the store page exists.
3. **Read gate:** 30 posts per platform, then one of the four pre-agreed outcomes in
   §6. No conclusion earlier; no extension without a written reason.

Direction recommendation: **B (Rooftop)** for the store face and the pilot, with
**A (Twenty)** as the named fallback if the *Reposition* outcome fires. The engine
is identical across all four; only the listing, one HUD surface, and the first video
change. Rationale in `directions.md`.

VERDICT: build
