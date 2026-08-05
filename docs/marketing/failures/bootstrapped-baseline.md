# The Bootstrapped Baseline — what "normal" actually looks like

**Compiled:** 2026-08-05. Wave 2a. Companion to [`post-mortems.md`](./post-mortems.md) and
[`taxonomy.md`](./taxonomy.md).

**Purpose.** Every number in the Wave 1 platform bundles is drawn from an app that *worked*. That
is unavoidable — the cases that generate documentation are the cases that succeeded. This file
exists to supply the denominator, so that the factory can tell the difference between "this app is
failing" and "this app is normal."

**The single most useful fact in this document, stated first:**

> **The median subscription app makes about $72 a month, one year after launch.**
> `[DOCUMENTED]` — [RevenueCat, State of Subscription Apps 2026](https://www.revenuecat.com/state-of-subscription-apps),
> n = 115,000+ apps.

Not $72,000. Not $7,200. **$72.** Every planning assumption in the factory should start there and
argue upward with evidence.

---

## 1. The distribution, not the average

RevenueCat's 2026 report is the best dataset that exists for this question: 115,000+ apps, real
transaction data rather than founder self-reports, and — critically — it reports **percentiles**
rather than averages. Averages in this field are meaningless; the distribution is
power-law-shaped and the mean is dragged by a handful of outliers.

**Monthly revenue, one year after launch** `[DOCUMENTED]`:

| Percentile | Monthly revenue |
|---|---|
| Median (p50) | **$72** |
| Top quartile (p75) | **$429+** |
| Top decile (p90) | **$2,574+** |

The p90 app earns **36× the median.** That ratio is the entire story of this market.

**Share of apps reaching revenue milestones within two years** `[DOCUMENTED]`:

| Milestone | Share of apps |
|---|---|
| $1,000 MRR | **17.3%** |
| $10,000 MRR | **4.6%** |
| $25,000 MRR | **1.7%** |

So: **more than four in five subscription apps never reach $1,000/month, ever.** And 95% never
reach $10,000/month — which is roughly the threshold at which one app supports one person.

**Growth rates, year on year** `[DOCUMENTED]`:

| Percentile | YoY MRR growth |
|---|---|
| Median | **+5.3%** |
| Top quartile | **+80%** |
| Top decile | **+306%** |
| Bottom quartile | **−33%** |

The median app is approximately flat. A quarter of apps are shrinking by a third a year. RevenueCat's
own framing: *"the subscription divide is accelerating."*

---

## 2. Time to the first milestones

**Median days to $1,000 MRR, by category** `[DOCUMENTED]`:

| Category | Days to $1K MRR |
|---|---|
| Gaming | 32 (fastest) |
| **All categories (median)** | **58** |
| Business | 113 (slowest) |
| All categories, to $10K MRR | 109 |

**Read this carefully — it is the most misleading number in the report.** These medians are
computed over apps *that reached the milestone*. Since only 17.3% ever reach $1K MRR, "58 days to
$1K" describes the top sixth of the market. For the other 83%, the correct figure is "never."

**A realistic bootstrapped timeline, triangulated from the documented indie cases**
`[DOCUMENTED — see §5]`:

| Milestone | Realistic expectation |
|---|---|
| First 1,000 downloads | Month 1, achievable from launch content alone (Habit Pixel: ~1,300 in May 2025) |
| First paying customer | Week 1–2 |
| $28–$150/month | Months 1–2 (Habit Pixel $28; SelfOS $150) |
| **The flat period** | **Months 2–7 — expect it, plan for it** (Habit Pixel: 5 months at ~$28) |
| $1,000 MRR | **Month 8 is a good outcome** (Habit Pixel: May 2025 → Jan 2026) |
| $10,000 MRR | Year 2+, and only for ~4.6% of apps (HabitKit reached it in 2024, several years in) |

---

## 3. Conversion, retention and per-user economics

These are the numbers the taxonomy's trip thresholds are built on.

**Download → paid, day 35** `[DOCUMENTED — RevenueCat 2026]`:

| Paywall type | Median D35 conversion |
|---|---|
| **Hard paywall** | **10.7%** |
| **Freemium** | **2.1%** |

Hard paywalls convert roughly **5×** better. Note this is a conversion figure, not a revenue
figure — freemium buys more installs. But for a bootstrapped app with a thin top of funnel, the
5× matters more than the volume.

**Download → paid by geography, D35** `[DOCUMENTED]`: North America 2.6% · Western Europe 2.0% ·
India/SEA 1.4%.

**Download → paid by category, D35** `[DOCUMENTED]`: Health & Fitness 2.9% · Business 2.6% ·
Gaming 1.0%.

**Trial → paid** `[DOCUMENTED]`: 17–32 day trials **42.5%** · 5–9 day trials **37.4%** ·
≤4 day trials **25.5%**. Longer trials convert ~70% better — **and the market is moving the wrong
way**: 46.5% of apps now use trials of ≤4 days, up 4.4pp YoY, while the 17–32 day bracket
(the best-converting) has declined to 5.0%.

**Trial cancellation timing** `[DOCUMENTED]`: **55% of 3-day-trial cancellations happen on Day 0.**
84% of 3-day trials that cancel do so by Day 1; 64% for 7-day trials. **The decision is made in the
first session.** Onboarding is monetisation.

**Realised lifetime value per payer, after one year** `[DOCUMENTED]`: global median **$23** ·
North America **$32** · India/SEA **$14** · high-priced apps **$62.19** vs low-priced **$10.69**.

**Revenue per install, D60** `[DOCUMENTED]`: Health & Fitness **$0.66** · Gaming **$0.14** ·
North America **$0.55** · India/SEA **$0.11**.

**Retention, cross-industry medians, 2025–26** `[DOCUMENTED]` —
[UXCam, compiling Adjust and AppsFlyer](https://uxcam.com/blog/mobile-app-retention-benchmarks/):

| Day | Median retention |
|---|---|
| D1 | **25–26%** |
| D7 | **11–13%** |
| D30 | **5–7%** |

**Median price points, 2026** `[DOCUMENTED]`: weekly **$5.00** · monthly **$10.00** · yearly
**$34.80** (up from $31.60). North America yearly median **$39.99**; India/SEA **$18.32**.

**The arithmetic this implies, for a factory app.** Take a plausible good case: hard paywall,
Health & Fitness-adjacent, North America, $39.99/year.

- 10.7% D35 download→paid × $23 median RLTV ≈ **$2.46 of realised first-year revenue per download**
  at best; at freemium's 2.1% it is **~$0.48**.
- To clear **$1,000/month** ≈ $12,000/year on those numbers requires roughly **5,000 downloads/year
  on a hard paywall**, or **25,000 on freemium**. `[DERIVED]`

That is the number to hold against any channel plan. It is reachable. It is also 10–50× what most
of the documented indie failures actually got.

---

## 4. The market context — it is getting harder, measurably

- **App Store downloads fell for the fifth consecutive year in 2025**: 106.9 billion globally,
  **down 2.7%** from 109.8bn in 2024, against a 2020 pandemic peak of 135bn. `[DOCUMENTED]` —
  [TechCrunch / Appfigures, 14 Jan 2026](https://techcrunch.com/2026/01/14/app-downloads-declined-again-in-2025-but-consumer-spending-soared-to-nearly-156b/)
- **Consumer spending rose 21.6% to ~$155.8 billion.** Non-game app spending was up **33.9%.**
  `[DOCUMENTED — same source]`
- **US downloads fell 4.2%** to 10 billion while US consumer spend rose 18.1%. `[DOCUMENTED]`
- **Apple received 557,000 new app submissions in 2025 — up 24% YoY.** `[DOCUMENTED]` —
  [Appfigures](https://appfigures.com/resources/insights/20251205?f=2)
- **New subscription-app launches went from ~2,000/month in 2022 to 14,700+/month in 2026** — a
  **7×** increase. iOS is now ~77% of launches, up from 67% in 2023. `[DOCUMENTED — RevenueCat 2026]`
- **Apps launched before 2020 generate 69% of all subscription revenue. Apps launched in 2025 or
  later generate 3%.** `[DOCUMENTED — RevenueCat 2026]`

**Put together: supply up 7×, demand down 2.7% five years running, revenue concentrated in
incumbents.** More apps competing for fewer downloads. Note the one genuinely encouraging line in
that set: spend per download is rising sharply. **The market is not paying for more installs; it is
paying more per install.** That favours a studio that can convert well over one that can only
acquire cheaply.

- `[ANECDOTAL, and dated]` The widely-repeated "90% of App Store apps are zombies" figure traces to
  an Adjust study several years old and should not be quoted as current. The comparable modern
  claim — that the top 1% of publishers drive ~80% of downloads — comes from
  [TechCrunch, 2019](https://techcrunch.com/2019/11/21/the-top-1-of-app-store-publishers-drive-80-of-new-downloads)
  and is likewise dated. Directionally consistent with the RevenueCat percentiles above, but do not
  cite the specific numbers as 2026 facts.

---

## 5. Survivorship bias — stated explicitly

**The bias is structural, not incidental.** Consider how a case study comes to exist:

1. An app succeeds.
2. A founder with an existing audience writes it up, or a journalist covers it.
3. Aggregators (Starter Story, Indie Hackers, Failory) index it.
4. We find it in a search.

Every step filters *toward* success and *toward founders who were already good at distribution.*
The Wave 1 bundles are, by construction, a sample of people who were unusually good at exactly the
thing we are trying to learn. **The apps we should most want to study — the 82.7% that never reach
$1,000/month — are almost entirely undocumented.**

**Three concrete demonstrations of the bias, from this corpus:**

1. **Privacy-first Jobs' shutdown notice received 2 likes and 2 comments.**
   `[DOCUMENTED — post-mortems.md §8]` The obituary of a failed indie product has essentially no
   audience. That is the shape of the missing data: not hidden, just unread.
2. **Pieter Levels — the most-cited indie hacker alive — worked on 70+ ventures, of which about 4
   became profitable and successful.** A hit rate of roughly **5%**, from the person everyone quotes
   as proof it works. `[DOCUMENTED]` —
   [Founderoo](https://www.founderoo.co/playbooks/pieter-levels-success-story),
   [DEV: I read all 751 of Pieter Levels' blog posts](https://dev.to/idonthaveapen/failures-behind-a-420kmonth-solo-founder-i-read-all-751-of-pieter-levels-blog-posts-1h3b).
   His "12 startups in 12 months" challenge produced Nomad List and Remote OK; **most of the twelve
   failed.** `[DOCUMENTED]` — [levels.io/12-startups-12-months](https://levels.io/12-startups-12-months)
3. **RevenueCat's own median is the correction.** $72/month at year one, from transaction data across
   115,000 apps, is what the *unfiltered* distribution looks like. Every founder-reported number is
   drawn from the right tail of that curve.

**Three specific ways this bias should change how we read the Wave 1 files:**

- **Founder-reported revenue is unaudited and selected.** There is no S-1 for an indie app. Numbers
  are reported when they are flattering; the Quittr MRR disagreement documented in
  `platforms/tiktok/case-studies.md` §2 ($50K vs $250K vs $500K, all "current") is the normal state
  of this evidence, not an aberration.
- **The tactic that "worked" is reported by the one person it worked for.** Blake Anderson's two $50
  micro-creators → 200K downloads is real and well-sourced. We do not know how many people spent
  $100 on two micro-creators and got nothing, because they did not write it up. **The tactic is a
  lottery ticket with unusually good odds, not a mechanism.**
- **Portfolio logic is the only honest response.** If the individual hit rate is ~5%, the correct
  strategy is not "find the tactic that guarantees a hit" — no such tactic is in evidence anywhere
  in this corpus — but **ship enough well-executed attempts that the 5% has room to happen, and
  make each attempt cheap enough that 95% failure is survivable.** That is, structurally, what the
  App Factory is. This is the strongest evidence-based argument for the model, and it is worth
  saying that it is an argument for the *model*, not a prediction about any individual app.

---

## 6. Counter-examples — bootstrapped apps that *did* work, and the actual mechanism

The important discipline here: for each one, name **the mechanism of break-out**, not the
narrative. Almost none of these broke out because of "consistent posting."

| # | App | Break-out mechanism | Status, Aug 2026 |
|---|---|---|---|
| 1 | Locket | **Product-embedded loop** | Alive, ~800K downloads/mo (modelled) |
| 2 | ScrollGuard | **One well-framed post in the right community** | Alive, 200K+ downloads |
| 3 | HabitKit | **Third-party authority review** | Alive, $10K MRR (2024) |
| 4 | Umax / RizzGPT | **Micro-creator seeding** | Alive |
| 5 | Delta | **Regulatory/platform window** | Alive, ~3.8M downloads in 2 weeks |
| 6 | Habit Pixel | **Pricing + localisation, after 5 flat months** | Alive, $1K+ MRR |
| 7 | Adam Lyttle's portfolio | **Portfolio compounding** | Alive, ~$100K+/yr |
| 8 | Cal AI | **3-second product legibility → paid creator scale** | Acquired by MyFitnessPal, Mar 2026 |
| 9 | Yuka | **Word of mouth, zero paid** | Alive, ~80M users |
| 10 | Plausible | **A published position the community already held** | Alive, $3.1M ARR, still no VC |

**The six mechanisms, in detail.**

**M1 — Product-embedded loop.** *Locket:* a founder's plain UI walkthrough got ~100,000 views and
produced **~2 million signups in two weeks**, #1 in 30+ countries. The ratio was not views→installs,
it was views→installs→**invitations**, because the widget is worthless without 3–5 friends.
`[DOCUMENTED — platforms/tiktok/case-studies.md §4; TechCrunch, 11 Jan 2022]` Still substantial in
2026: ~800K downloads and ~$300K revenue in a month (Sensor Tower modelled estimate).
**Transferable?** Only for products whose value is genuinely multi-player. Do not retrofit.

**M2 — One well-framed post in the right community.** *ScrollGuard:* the same developer posted the
same product to Show HN four times — **4 points, then 690, then 1, then 4.** The 690-point version
turned a dormant product into **200,000+ downloads**. The variable was the sentence, not the
product. `[DOCUMENTED — platforms/communities/case-studies.md §1]`
**Transferable? Yes — but exactly once per product.** This is a one-shot channel.

**M3 — Third-party authority review.** *HabitKit:* an MKBHD-adjacent YouTube channel found the app
**via Threads**, unsolicited, and featured it in December 2024 → *"a huge spike in downloads and
revenue"* and his best month since starting. `[DOCUMENTED — sebastianroehl.substack.com]` In the
same year his Times Square billboard produced approximately nothing.
**Transferable? Partially.** You cannot cause the review. You can cause being **findable**, which is
the necessary condition. Compare Apple editorial featuring, which produces an average **1,747%
download boost for apps and 792% for games** `[DOCUMENTED — TechCrunch, 24 Oct 2017 — dated, treat
as directional]` — but note the same reporting records an indie game featured in "10 Incredible
Indie Games" that *"barely registered a blip."* **The slot matters more than the fact of being
featured.**

**M4 — Micro-creator seeding.** *Blake Anderson:* **two relatively unknown dating-advice TikTok
creators, $50 each** → both videos went viral → **200,000 downloads in a week, $80,000 in month
one.** `[DOCUMENTED, founder-claimed — platforms/tiktok/case-studies.md §3]` Independently
corroborated in shape by SelfOS's **28× CPI advantage** for a 3K-subscriber Telegram channel over a
230K one. `[DOCUMENTED]`
**Transferable? Yes — this is the single most affordable mechanism in the corpus** and the one the
factory should test first. Caveat: survivorship applies (see §5).

**M5 — Regulatory / platform window.** *Delta* (Riley Testut): Apple changed its rules on retro game
emulators; Delta shipped into the gap and was **downloaded ~3.8 million times in two weeks**,
topping the App Store for about a fortnight, with essentially no marketing spend. `[DOCUMENTED]` —
[Wikipedia](https://en.wikipedia.org/wiki/Delta_(emulator)),
[TechCrunch, 3 May 2024](https://techcrunch.com/2024/05/03/retro-game-emulator-delta-app-store-ios),
[9to5Mac](https://9to5mac.com/2024/04/17/riley-testut-launches-delta-game-emulator-on-app-store-for-everyone-altstore-marketplace-for-eu/).
Related: UpScrolled, an indie Australian app, hit **#1 in US social networking** in January 2026 off
the TikTok US restructuring, with **40,000+ downloads in a few days** and servers that *"tapped
out."* `[DOCUMENTED]` —
[Al Jazeera](https://www.aljazeera.com/news/2026/1/29/whats-upscrolled-the-app-gaining-popularity-after-tiktoks-us-takeover/),
[Engadget](https://www.engadget.com/social-media/people-are-uninstalling-tiktok-and-downloading-an-indie-competitor-233345222.html)
**Transferable? Yes, and underrated.** Watching App Store policy changes and competitor collapses is
cheap, and being *ready to ship into a window* is a capability a factory has and a solo founder does
not. Worth an explicit factory process.

**M6 — Pricing and localisation, after the dead zone.** *Habit Pixel:* five flat months at ~$28 MRR,
then PPP pricing (*"almost immediately, I saw purchases from countries I'd never reached before"*),
12-language store localisation, a capped Black Friday lifetime offer, and building in public →
**$1,000+ MRR by month eight.** `[DOCUMENTED]`
**Transferable? Yes, entirely, and it is the cheapest of the six.** These are one-day engineering
tasks with permanent effects, automatable across a portfolio.

**Plus M7 — portfolio compounding**, which is not a break-out at all: *Adam Lyttle*, 50+ apps over
~4 years, grew 1,000 → 30,000 downloads/month on free channels, one app sold for $224,000, $100K+
in a recent year. His own arithmetic: *"You only need to get 1% of those viewers downloading your
app, and that's 2 downloads per video."* `[DOCUMENTED, founder-reported —
platforms/tiktok/case-studies.md §5]` **This is the closest documented analogue to the App Factory
and the most realistic model of what success looks like for us: unglamorous, slow, and real.**

---

## 7. The uncomfortable summary

**What normal looks like for a bootstrapped app in 2026:**

- ~1,300 downloads in launch month if the launch is competent
- $28–$150/month by month two
- **A flat stretch of three to six months** that is not a signal of failure
- $72/month at the one-year median across the whole market
- A **17.3% chance of ever reaching $1,000/month** and a **4.6% chance of $10,000**
- D7 retention around 11–13%; D30 around 5–7%
- ~$23 realised lifetime value per payer in year one

**What the success stories don't tell you:**

- They are the ~5% (Levels' own hit rate on 70+ ventures)
- Their numbers are self-reported and selected
- The tactic credited for the win was usually one of **six specific mechanisms**, most of which are
  either one-shot (M2), uncausable (M3), or windows of luck you can only be *ready* for (M5)
- The one mechanism that is repeatable, cheap, and available today is **micro-creator seeding at
  ~£50 a head** (M4) — and even that is documented from its winners

**What should change how the factory operates, from this file alone:**

1. **Set expectations at the median, not the case study.** An app at $150/month in month two is
   *above* market median and should not be killed.
2. **Budget for the dead zone.** Months 3–8 flat is the modal path, not a failure. Schedule the
   month-3 review (`taxonomy.md` F14) at launch.
3. **Do M6 on every app, always.** PPP pricing and full store localisation are one-day tasks with
   documented, immediate effects, and they are the only mechanism here that is fully automatable
   across a portfolio.
4. **Default to a hard paywall.** 10.7% vs 2.1% D35 is a 5× difference and it is the single largest
   documented lever on the conversion side.
5. **Make trials longer, against the market trend.** 17–32 days converts at 42.5% vs 25.5% for ≤4
   days, and the market is moving the wrong way — which makes it a cheap edge.
6. **Build a standing process for M5 windows.** Platform policy changes and competitor collapses are
   the one break-out mechanism where a multi-app factory has a genuine structural advantage over a
   solo founder.
7. **Judge the portfolio, not the app.** At a ~5% hit rate, the only coherent strategy is enough
   cheap, well-executed attempts that the 5% has room to land.

---

## Sources

**Primary dataset:** [RevenueCat — State of Subscription Apps 2026](https://www.revenuecat.com/state-of-subscription-apps) (115,000+ apps, transaction data) · [category breakdowns](https://www.revenuecat.com/state-of-subscription-apps-2026-business/) · [independent summary of the figures](https://tasu.ai/library/how-much-money-do-subscription-apps-make)
**Market size and direction:** [TechCrunch / Appfigures, 14 Jan 2026 — downloads declined again in 2025](https://techcrunch.com/2026/01/14/app-downloads-declined-again-in-2025-but-consumer-spending-soared-to-nearly-156b/) · [Appfigures — biggest release year in nearly a decade](https://appfigures.com/resources/insights/20251205?f=2) · [9to5Mac](https://9to5mac.com/2026/01/14/subscriptions-carried-app-economy-as-downloads-declined-in-2025-appfigures/)
**Retention benchmarks:** [UXCam, compiling Adjust + AppsFlyer 2025–26](https://uxcam.com/blog/mobile-app-retention-benchmarks/)
**Survivorship:** [Founderoo — Pieter Levels, 70 startups](https://www.founderoo.co/playbooks/pieter-levels-success-story) · [DEV — I read all 751 of Pieter Levels' blog posts](https://dev.to/idonthaveapen/failures-behind-a-420kmonth-solo-founder-i-read-all-751-of-pieter-levels-blog-posts-1h3b) · [levels.io — 12 startups in 12 months](https://levels.io/12-startups-12-months)
**Habit Pixel:** [Indie Hackers, Jan 2026](https://www.indiehackers.com/post/from-0-to-1k-mrr-in-8-months-bootstrapping-habit-pixel-as-a-solo-dev-53d8687d15)
**HabitKit:** [Sebastian Röhl — 2024 Year In Review](https://sebastianroehl.substack.com/p/2024-my-indie-app-business-year-in)
**SelfOS:** [Indie Hackers, 26 Mar 2026](https://www.indiehackers.com/post/the-indie-makers-dilemma-2-months-in-700-downloads-and-i-m-stuck-53db8107c1)
**Delta:** [Wikipedia](https://en.wikipedia.org/wiki/Delta_(emulator)) · [TechCrunch, 3 May 2024](https://techcrunch.com/2024/05/03/retro-game-emulator-delta-app-store-ios) · [9to5Mac, 17 Apr 2024](https://9to5mac.com/2024/04/17/riley-testut-launches-delta-game-emulator-on-app-store-for-everyone-altstore-marketplace-for-eu/)
**UpScrolled:** [Al Jazeera, 29 Jan 2026](https://www.aljazeera.com/news/2026/1/29/whats-upscrolled-the-app-gaining-popularity-after-tiktoks-us-takeover/) · [Engadget](https://www.engadget.com/social-media/people-are-uninstalling-tiktok-and-downloading-an-indie-competitor-233345222.html)
**Apple featuring:** [TechCrunch, 24 Oct 2017](https://techcrunch.com/2017/10/24/apples-app-of-the-day-featuring-boosts-downloads-by-1747-games-by-792/) `[dated — directional only]` · [Apple — Getting featured on the App Store](https://developer.apple.com/app-store/getting-featured/)
**Concentration (dated):** [TechCrunch, 21 Nov 2019 — top 1% of publishers drive 80% of downloads](https://techcrunch.com/2019/11/21/the-top-1-of-app-store-publishers-drive-80-of-new-downloads)
**Cross-referenced Wave 1 cases:** `platforms/tiktok/case-studies.md` (Cal AI, Locket, Blake Anderson, Adam Lyttle) · `platforms/communities/case-studies.md` (ScrollGuard, Plausible) · `platforms/youtube/case-studies.md` (HabitKit) · `platforms/paid/case-studies.md` (Yuka)
</content>
