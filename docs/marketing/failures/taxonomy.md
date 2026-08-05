# Failure Taxonomy — the reusable artifact

**Compiled:** 2026-08-05. Wave 2a. Distilled from [`post-mortems.md`](./post-mortems.md) and the
Wave 1 platform bundles.

**What this is for.** This is the one file in `docs/marketing/` that gets *run*, not read. It is
meant to be attached to every app the factory ships: check the gates before launch, watch the
signals weekly, and apply the counter-move when a signal trips.

**Design rule.** Every failure mode below has three things or it does not belong here:

1. **A signal** — something measurable, with a number, that we can actually observe.
2. **A trip threshold** — the value at which we act. Thresholds without a number are opinions.
3. **A counter-move that costs ≈£0 and ≈1 day.** If the fix requires budget we don't have, it is
   not a counter-move, it is a wish.

Evidence tags: `[DOCUMENTED]` = sourced in `post-mortems.md` or a Wave 1 bundle.
`[ANECDOTAL]` = pattern observed but not measured. `[DERIVED]` = arithmetic from documented
numbers, not itself observed.

---

## 0. The three gates — run before any content is produced

If any gate fails, **no content work starts.** These exist because four of the fifteen cases in
`post-mortems.md` died at a step that costs one day to check.

| Gate | Check | Fails because of |
|---|---|---|
| **G0. There is something to install** | Store listing live in every target locale, install path walked end-to-end on a device that has never seen the app, purchase completed with a real card | Tube2Blog (1M views, unshipped beta); LifePilot (Italian listing for US users) |
| **G1. The listing is localised and priced regionally** | Store listing translated for every target market; purchasing-power-parity pricing configured | Habit Pixel (5 flat months, then PPP + 12 languages broke it open); LifePilot (inverse) |
| **G2. The arithmetic closes** | `downloads needed = target monthly revenue ÷ (conversion rate × revenue per payer)`. Is that download number reachable by the channels we actually have? | SelfOS (needs ~100K downloads for $3K/mo; no channel in the plan gets there); Flowtab ($2/user/month against real acquisition cost) |

**G2 is the gate we will be most tempted to skip and the one that most often makes the whole plan
void.** Do the multiplication before choosing a channel, not after.

---

## The failure modes

---

### F1 — No distribution plan (the "built it and they came" failure)

**Description.** The app ships. There is no named channel, no named first hundred people, no
content produced. The founder diagnoses the resulting silence as a *product* problem and rebuilds.

**Evidence.** `[DOCUMENTED]` Oliver King (10 weeks building, marketing absent from his own
post-mortem); Everpix (team's own words: *"spent way too much time on the product and not nearly
enough on growth and distribution"* — died at 50K users, 7K subscribers, $40K/mo); Daveyon Mayne
(*"The worst part? Marketing"*); Privacy-first Jobs (*"traffic... never really grew"*).

**Why it is hard to catch.** It is **invisible from the inside.** In three of four cases the
founder's own retrospective does not mention distribution. You cannot rely on noticing it.

**Signal.** Number of days between App Store approval and the first piece of published content.
**Trip threshold: > 3 days.**

**Counter-move (£0, 1 day).** The distribution plan is a **launch gate artifact**, written before
the first commit, containing exactly three things: (a) the single primary channel, (b) the named
first hundred people or the named community where they are, (c) the first ten pieces of content,
written as titles. If it cannot be written, the app is not ready to build.

---

### F2 — Wrong-intent audience (topic interest ≠ problem-right-now)

**Description.** The content reaches people interested in the *subject area* rather than people
with the *specific problem at the moment they see it*. Views are healthy. Nothing converts.

**Evidence.** `[DOCUMENTED]` Buildfield (67K views → 137 visitors → 0 paying); Tube2Blog (1M views,
0 conversions — content was clips of famous people talking about marketing generally).

**Signal — the single most important number in this document.** **Views → link clicks.**
**Trip threshold: < 1%.** Buildfield ran at **0.2%**.

**Secondary signal.** Comments per post. **Trip threshold: 0 comments across 10+ posts.** Zero
comments means nobody had a question, which means nobody was close to installing. Comment count is
a better conversion proxy than view count. `[DOCUMENTED — LifePilot]`

**Counter-move (£0, 1 day).** Rewrite the hook to open on the *moment of pain*, not the topic.
"Here's how I track habits" → topic. "It's 11pm and I forgot again" → moment. Then re-test with 10
posts. If CTR is still under 1% after the rewrite, the audience is wrong and no volume fixes it —
change platform (see F3), not cadence.

---

### F3 — Wrong platform for the purchase type

**Description.** A considered or B2B purchase promoted on an impulse-scroll platform, or vice
versa. The channel's native buying behaviour does not match the product's.

**Evidence.** `[DOCUMENTED]` Tube2Blog (B2B SaaS on TikTok); Buildfield (contractor invoicing tool
via consumer short-form video, buyer outreach aimed at accountants — a third audience).

**Signal.** Price point × decision-maker. **Trip threshold:** if the purchase requires
(a) more than one person's approval, (b) more than ~£15/month, or (c) any data migration,
short-form consumer video is the wrong top-of-funnel.

**Counter-move (£0).** Match the channel to the purchase shape:

| Purchase shape | Channel that fits |
|---|---|
| Impulse, < £40/yr, single user, instant value | TikTok / Reels / Shorts |
| Considered, hobby-adjacent, single user | The hobby's own community + YouTube |
| Technical/ideological, single user | One well-framed Hacker News post (one-shot) |
| B2B, multi-stakeholder | Not our category — do not build it |

---

### F4 — Broken funnel downstream of the content

**Description.** The content works at the expected rate. The loss happens after the click, on the
store page, in onboarding, or at the paywall — where the content platform's analytics cannot see it.

**Evidence.** `[DOCUMENTED]` LifePilot (App Store primary language set to Italian; 182 impressions,
9% store conversion, 11 downloads); Habit Pixel (early onboarding *"scared off users"*);
Habit Pixel again (12-language localisation measurably opened Europe).

**Signal.** **App Store impressions → downloads (store conversion rate).** This is the number the
content platform cannot tell you and the one that most often kills indie apps.
**Trip threshold: < 15%** for a listing with screenshots and any reviews. LifePilot ran at 9% with
zero reviews.

**Counter-move (£0, 1 day).** Instrument the *whole* funnel before posting:
`views → profile visits → link clicks → store impressions → store conversion → install → D1 open →
paywall view → purchase`. Any stage without a number is a stage that can fail silently. Then open
the live store listing on a clean device in every target storefront and try to buy.

---

### F5 — Sub-threshold volume (too little to learn anything)

**Description.** A handful of posts is treated as a test. It isn't. Short-form distribution is
extremely right-skewed: the median post does almost nothing and the payoff lives in the top
decile, so a small sample tells you nothing except that you drew from the median.

**Evidence.** `[DOCUMENTED]` LifePilot (8 videos, ~250 views each, treated as a verdict);
`platforms/tiktok/algorithm.md` (Buffer, 11.4M posts: median ~500 views, payoff at p90).
`[DOCUMENTED]` Playkit agency baseline: **600 videos per app per month** is professional scale
(`platforms/tiktok/case-studies.md` §6).

**Signal.** Posts published before drawing a conclusion. **Trip threshold: any conclusion drawn
at < 30 posts is void.**

**Counter-move (£0).** Set the learning budget as a *count*, not a duration: **30 posts minimum
before any strategy change, 90 before a kill decision.** This is precisely the constraint an AI
content pipeline exists to satisfy — it is the factory's structural advantage over a solo founder,
and it should be spent on reaching statistical validity, not on spreading thin across channels.

---

### F6 — Novelty cascade mistaken for a growth loop

**Description.** Acquisition is working spectacularly and none of it compounds. A cascade and a
loop look identical for about eight weeks.

**Evidence.** `[DOCUMENTED]` Peach (three tier-one press hits → dead in ~4 days); Vero (#1 in many
national stores → collapse); Poparazzi (6.2M installs → ~2,000 MAU, >99% decay); Gas (7.4M installs,
acquired, shut down); Lensa AI. Counter-case: Locket, where the product *required* recruiting 3–5
friends, so 100K views became ~2M signups.

**Signal.** D7 and D30 retention, measured before any push.
**Trip thresholds (2025–26 cross-industry medians, `[DOCUMENTED]` — Adjust/AppsFlyer via
[UXCam](https://uxcam.com/blog/mobile-app-retention-benchmarks/)): D1 ≈ 25–26%, D7 ≈ 11–13%,
D30 ≈ 5–7%.** Below median on D7 → do not push.

**The question to answer in writing before any push:** *what does the person who installs today do
that causes person #2 to install tomorrow?* If the honest answer is "nothing, they just like it,"
you have a cascade. Budget for it accordingly — a cascade is worth having, it is just not worth
planning around.

**Counter-move (£0).** Fix retention before buying reach. A viral moment measures how good the
*pitch* is, not how good the *product* is, and a bad D7 converts one shot at attention into a
permanently burned audience.

---

### F7 — Nothing to convert into at the moment of peak attention

**Description.** The attention arrives before the thing it should convert into exists or works.

**Evidence.** `[DOCUMENTED]` Tube2Blog (1M views spent while conversion waited on *"once the BETA
is ready"*); Vero (servers collapsed under the traffic its own offer created).

**Signal.** Binary. **Gate G0 above.** Additionally, for any offer with a scarcity mechanic
("free for the first N"), load-test first — Vero's demand was concentrated into hours against
infrastructure that had never been tested.

**Counter-move (£0).** **Views do not bank.** Never run a push before the install-and-purchase
path is walked end to end on a real device. There is no partial credit here.

---

### F8 — Channel-native rules violated → account death

**Description.** The content is fine; the *posting pattern* triggers platform enforcement.
Enforcement is often silent — suppressed rather than removed — so the founder concludes the
content failed.

**Evidence.** `[DOCUMENTED]` Redchecker (two Reddit accounts permanently banned in six weeks;
detection is **account-level pattern**, not per-post); MailTest (friends' upvotes silently
suppressed by same-IP spam filtering; simultaneous Reddit post auto-removed for account age);
Adam Lyttle (*"the downside was getting found out"*); ScrollGuard relaunches (HN is one-shot per
product — 690 pts, then 1 pt for the same app).

**Signal set — these are the patterns Reddit's classifier flags** `[DOCUMENTED — Redchecker]`:

| Pattern | Trip threshold |
|---|---|
| Share of posts mentioning one product | **> 60%** |
| Same/similar content across subreddits | **within 24–72 hours** |
| Share of activity containing links | **> 50%** |
| Account age at first self-promotion | **< 60 days** |
| Coordinated upvotes | any |

**This is the failure mode our architecture makes *more* likely, not less.** Volume across many
apps from shared infrastructure is the exact signature the classifiers are built to detect.

**Counter-move (£0, but it is a design constraint, not a tactic).** Build the content pipeline
around **per-account pattern budgets before volume**: topic diversity ≥ 10 subjects with ≤ 2
mentioning a product, ≥ 2 weeks between promotional posts per account, link ratio under 50%,
60-day account warm-up, no cross-posting inside 72 hours. And treat one-shot channels (Hacker
News, Product Hunt) as exactly that: **one product, one attempt, only if it genuinely fits.**

---

### F9 — Platform dependency (the channel becomes the product)

**Description.** The product's core function requires another platform's API or data on terms we
do not control. Profitability and popularity are no protection.

**Evidence.** `[DOCUMENTED]` GummySearch (135K users, 10K paying customers, always profitable,
closed 30 Nov 2025 by Reddit's API pricing); Apollo (~1.5M MAU, 100K+ five-star ratings, shut down
30 Jun 2023 by the same cause, two years earlier).

**Signal.** Binary, answered at spec time: *does this app break if a third party changes its API
pricing or terms?*

**Counter-move (£0).** **Use platforms as channels, never as dependencies.** This is a
product-spec gate, not a marketing one — by the time it is a marketing problem it is terminal.
Any factory app that reads, writes, or resells another platform's data is one pricing memo from
zero.

---

### F10 — Impressions without intent (the vanity channel)

**Description.** Spending real resource on reach that has no path to an install.

**Evidence.** `[DOCUMENTED]` HabitKit's Times Square billboard — the founder's own verdict:
*"Sadly, in terms of downloads and revenue, this wasn't a huge success."* Same year, an unsolicited
third-party YouTube review produced his best month ever.

**Signal.** Cost (in £ or founder-hours) per *measured link click*, not per impression.
**Trip threshold: if the channel cannot produce a click-through number at all, it is a brand
channel, and we do not have a brand budget.**

**Counter-move (£0).** Rank channels by *attributable clicks per hour of founder time*. The only
consistently high-value bootstrapped outcome is **coverage by someone who already has an
audience**, and the reliable way to cause it is continuous public findability — not outreach, not
paid reach. Röhl was found on Threads; he did not pitch.

---

### F11 — The arithmetic never closed

**Description.** The conversion rate and price are fine; the number of downloads required to reach
a survivable revenue figure was never reachable.

**Evidence.** `[DERIVED from DOCUMENTED numbers]` SelfOS: ~2.9% download-to-paid × ~$7.50/payer →
needs **~100,000 downloads for ~$3,000/month**; nothing in the founder's tested channel mix
approaches that. `[DOCUMENTED]` Flowtab: $1/order, ~2 orders/month, users don't revisit the same
venue → no reachable acquisition cost. `[DOCUMENTED]` Everpix: 14% signup-to-paid — better than
RevenueCat's 2026 hard-paywall median of 10.7% — and still died, because 14% of insufficient
top-of-funnel is insufficient.

**Signal.** Gate G2. **Trip threshold: if the required download count exceeds 10× what the primary
channel has ever delivered for us, the plan is void.**

**Counter-move (£0, 1 hour).** Change one of the three inputs *before* the campaign, not after:
raise the price, switch freemium → hard paywall (RevenueCat 2026: **10.7% vs 2.1% D35, ~5×**
`[DOCUMENTED]`), or change category. Note that a great conversion rate is evidence to spend *more*
on distribution, not evidence that distribution is solved.

---

### F12 — Geographic / audience concentration

**Description.** All the traction is in one country or one narrow cohort, and the ceiling arrives
without warning.

**Evidence.** `[DOCUMENTED]` Artifact — **44% of all downloads from the US, no other country above
4%**, shut down within a year despite an elite team and unanimous press. `[DOCUMENTED]` Gas —
grew school-by-school; once a school saturated, the loop had nowhere to go.

**Signal.** Share of downloads from the top country. **Trip threshold: > 60% with no second
country above 10%, at month 3.**

**Counter-move (£0–1 day).** Ask whether the international ceiling is **in the product or only in
the listing**. For a habit tracker it is the listing → localise and add PPP pricing (Habit Pixel:
immediate purchases from previously unreached markets). For a US-news aggregator it is the product
→ the ceiling is real and should have been priced into the plan at spec time.

---

### F13 — The growth mechanic is itself the liability

**Description.** The tactic that converts best is the one that draws regulatory, legal, or
app-store enforcement.

**Evidence.** `[DOCUMENTED]` NGL — 200M users, then a **$5M FTC/LA-DA settlement** and a ban on
offering anonymous messaging to under-18s; the alleged conduct (fake messages, ambiguous $9.99/week
recurring charges, teen targeting) *was* the growth strategy. `[DOCUMENTED]` Lifetime-deal reneging:
of 89 dead lifetime deals, ~12% were live companies that revoked the licence and pushed buyers onto
subscriptions.

**Signal.** Any of: minors in the target audience; ambiguous recurring billing; manufactured
engagement; a promise ("free forever", "lifetime") whose cost grows with success.

**Counter-move (£0).** Treat these as **prohibited**, not as risk-weighted. A bootstrapped studio
has no legal budget, and the FTC does not care that we were only doing what worked. Lifetime deals
are permitted only as a capped, fixed number of units for a specific cash reason — never as an open
offer or a repeatable growth channel.

---

### F14 — The messy middle (months 3–8)

**Description.** Launch produces a small spike, then months of flat. There is no crisis to react
to, founder attention drifts, and the app dies quietly without ever being killed.

**Evidence.** `[DOCUMENTED]` Habit Pixel — **1,300 downloads and $28 MRR at launch, then five flat
months (Jun–Oct 2025)** before four one-off changes took it to $1K MRR by January.
`[DOCUMENTED]` Privacy-first Jobs (slow flatline, two-sentence shutdown notice, 2 likes on the
obituary). `[ANECDOTAL]` Angel Cee: months 3–18 are *"where dreams die."*

**Signal.** MRR month-on-month change. **Trip threshold: < 10% growth for 2 consecutive months at
any point in months 3–8.**

**Counter-move (£0, decided in advance).** A written **month-3 review** with four pre-agreed
outcomes — *continue / change price / change positioning / kill* — scheduled at launch. This is the
single most valuable process artifact in this document for a portfolio studio, because the founder's
attention will be on the newest app and the decision will otherwise never get made.

**The ordered list of things to try in the dead zone**, from the documented cases, cheapest first:

1. PPP / regional pricing `[DOCUMENTED — Habit Pixel: immediate new-market purchases]`
2. Store-listing localisation `[DOCUMENTED — Habit Pixel: 12 languages → European downloads]`
3. Onboarding fix — first-run drop-off `[DOCUMENTED — Habit Pixel: onboarding "scared off users"]`
4. Freemium → hard paywall `[DOCUMENTED — RevenueCat: 10.7% vs 2.1% D35]`
5. Narrow the audience by 10× and re-test the hook (F2)
6. Micro-creator seeding at £50/creator `[DOCUMENTED — Blake Anderson: two × $50 → 200K downloads]`

---

### F15 — Founder-motivation collapse

**Description.** The founder can build and will not distribute, usually because promotion feels
like spam. The apps are fine. The pipeline stops.

**Evidence.** `[DOCUMENTED]` Daveyon Mayne (*"The fun part was making the apps. The worst part?
Marketing"*; felt *"like I was spamming a forum"*). `[ANECDOTAL]` Angel Cee: stack and
infrastructure work as *"a sophisticated form of procrastination."*

**Signal.** Content published per app per week. **Trip threshold: 0 for 2 consecutive weeks.**

**Counter-move — and this one is architectural, not tactical.** The App Factory's design already
removes both causes: the founder does not write the content (agents do), and the raw material is
him genuinely using his own app rather than pitching in a forum. **This should be treated as a
core design constraint to protect, not a happy accident.** Any process change that puts the founder
back in the position of manually writing promotional copy reintroduces the most common indie
failure mode in this entire corpus.

---

## The weekly scorecard

One table, per app, checked weekly. Every row maps to a failure mode above.

| Metric | Trip threshold | Failure mode |
|---|---|---|
| Days from store approval → first content | > 3 | F1 |
| Views → link clicks | < 1% | F2 |
| Comments per post (over 10+ posts) | 0 | F2 |
| Store impressions → downloads | < 15% | F4 |
| Posts published (before any conclusion) | < 30 | F5 |
| D7 retention | below ~11–13% median | F6 |
| Share of posts mentioning the product (per account) | > 60% | F8 |
| Link ratio per account | > 50% | F8 |
| Downloads needed vs channel capability | > 10× | F11 |
| Top-country share of downloads (month 3) | > 60% | F12 |
| MoM MRR growth, months 3–8 | < 10% for 2 months | F14 |
| Content published per week | 0 for 2 weeks | F15 |

---

## The five things this taxonomy is really saying

1. **Most failures are procedural and pre-launch.** Gates G0–G2 would have caught Tube2Blog,
   LifePilot, SelfOS's arithmetic, and Flowtab's unit economics — all before a single video was
   made.
2. **The one number to watch is views → clicks.** It separates "wrong audience" from "everything
   else" faster and cheaper than any other metric, and it is the number both Buildfield and a
   Times Square billboard got wrong.
3. **Narrow beats big by ~an order of magnitude, at every budget.** 28× CPI spread within one
   channel (SelfOS); two $50 micro-creators → 200K downloads (Anderson). This is the closest thing
   to a law in the whole corpus.
4. **Our structural advantage — volume — is also our largest specific risk (F8).** The pipeline
   must be designed around pattern budgets first and throughput second.
5. **The dangerous period is months 3–8, and the counter-move is a calendar entry, not a tactic.**
   Schedule the month-3 review at launch or it will not happen.
</content>
