# ASO in 2026 — App Store & Play Store organic mechanics

Research date: **2026-08-05**. Companion to `landscape.md` (paid channels) and
`triggers.md` (spend decision rules).

This document covers what has *changed* and what is *mechanically true* in 2026, and
cross-checks the factory's existing `playbooks/aso.md` — see §9 for the delta report.
That playbook is **not edited here**; deltas are reported for the founder to action.

Claim tags: **[DOCUMENTED]** = Apple/Google primary source or large-sample dataset ·
**[ANECDOTAL]** = single operator · **[UNVERIFIED]** = secondary sources only.

---

## 1. The 2026 shift: from metadata matching to post-install behaviour

The single most important structural change since our playbook was written is that both
stores now weight **what happens after the install** as heavily as **what the listing
says**.

### Apple has now published how its ranker works

Apple ML Research, **February 2026**: *Scaling Search Relevance: Augmenting App Store
Ranking with LLM-Generated Judgments*
([Apple ML Research](https://machinelearning.apple.com/research/augmenting-app) ·
[arXiv 2602.23234](https://arxiv.org/abs/2602.23234) · SIGIR '26 ·
[9to5Mac coverage](https://9to5mac.com/2026/03/06/apple-ran-a-test-on-the-app-store-to-see-if-ai-could-improve-search-result-rankings/)). **[DOCUMENTED — Apple primary source]**

This is the closest thing to an official statement of App Store ranking mechanics we have
ever had. Apple states its ranker combines two complementary signals:

1. **Behavioral relevance** — "results users tend to click or download"
2. **Textual relevance** — "a result's *semantic fit* to the query"

Apple fine-tuned a 3B-parameter LLM on scarce human relevance judgments to generate
millions of textual-relevance labels, fed them into the production ranker, and measured a
**statistically significant +0.24% conversion-rate lift in A/B test**, with **"particularly
strong gains for tail queries where behavioral data is limited."**

**Three things follow directly, and they are the most actionable ASO facts in this
document:**

- **Semantic fit beats exact-match keyword stuffing, by Apple's own design.** The ranker
  now has a model of what your listing *means*, not just which strings it contains.
  Natural, specific, benefit-led copy is now the *optimising* strategy, not merely the
  polite one.
- **Long-tail is now structurally more winnable.** Apple explicitly improved tail queries
  where behavioural data is thin. A new app with zero download history is exactly the case
  this helps. Our playbook's "we win long-tail first" instinct is now backed by Apple's
  own published architecture.
- **Behavioural relevance (tap-through and download rate on a query) is a first-class
  ranking input.** Your conversion rate on a keyword is not just a business metric — it is
  a ranking input for that keyword.

### Google Play made the same move

Play's algorithm now weights retention, engagement, uninstall rate, and stability
alongside metadata relevance and install velocity
([MobileAction](https://www.mobileaction.co/blog/google-play-store-ranking-factors/),
[App Radar](https://appradar.com/academy/app-store-ranking-factors)). **[UNVERIFIED]** as
to relative weighting — no Google primary source states weights — but **[DOCUMENTED]** that
Android Vitals (crash rate, ANR rate) affect Play visibility, which Google does state in
Play Console documentation.

Practical consequence: **an app with poor D7 retention now has a lower organic ceiling
than one with fewer installs and better retention.** You cannot ASO your way past a
retention problem, and paid installs into a leaky app now actively damage rank.

> ⚠️ Widely circulated "ranking factor weight" tables — e.g. "Keyword Relevance 30%,
> Download Velocity 25%, Ratings 20%, Engagement 15%, Updates 10%" — appear across
> multiple SEO-farm ASO blogs with no source. **These are invented.** Neither Apple nor
> Google has published weights. Do not plan against them. **[UNVERIFIED — treat as false]**

---

## 2. Apple App Store — indexed fields, 2026

| Field | Limit | Indexed for search? | Notes |
|---|---|---|---|
| **App name / title** | 30 chars | ✅ Highest weight | Most heavily weighted text field |
| **Subtitle** | 30 chars | ✅ High weight | — |
| **Keyword field** | **100 chars** | ✅ | Comma-separated, no spaces, no plurals, no repeats of title/subtitle words |
| **Developer name** | — | ✅ | Often overlooked |
| **In-app events** | — | ✅ | Confirmed indexed, WWDC 2025 |
| **Custom Product Page keywords** | — | ✅ | CPPs now surface in organic search (since July 2025) |
| **Description** | 4,000 chars | ❌ **Not indexed** | Conversion asset only, on iOS |
| **Promotional text** | 170 chars | ❌ Not indexed | Updatable without review |
| **Screenshot caption text** | — | ⚠️ **Disputed** | See below |

Source: [AppTweak — App Store ranking factors](https://www.apptweak.com/en/aso-blog/app-store-ranking-factors). **[DOCUMENTED]**

**On screenshot text indexing:** sources conflict. AppTweak states plainly that screenshot
text influence is community-inferred and "there has been no official confirmation from
Apple." Several other 2026 ASO blogs assert it as "now confirmed." **I found no Apple
statement confirming it.** Treat as **[UNVERIFIED]**. Apple's own LLM-relevance paper
does not mention screenshot assets as a ranking input. Write screenshot captions for
*conversion*, and treat any ranking benefit as an unpriced bonus.

### Apple's AI-generated Tags — the genuinely new discovery surface

Announced at WWDC on **2025-06-11** ([TechCrunch](https://techcrunch.com/2025/06/11/at-wwdc-apple-says-it-will-use-ai-to-tag-apps-to-improve-discoverability-on-the-app-store)),
with tag management shipping in App Store Connect on **2025-07-16**
([ASO World](https://asoworld.com/blog/new-tag-management-feature-in-app-store-connect-enhances-discoverability/),
[Apple Developer — App tags API](https://developer.apple.com/documentation/appstoreconnectapi/app-tags)). **[DOCUMENTED]**

- Apple generates short descriptive tags for every app using an LLM over your submitted
  metadata, refined with human review
- Tags render as **tappable chips in search results and on product pages** — a new
  navigational layer parallel to keywords
- Developers can **view and remove** irrelevant tags in App Store Connect (roles: Account
  Holder, Admin, App Manager, Marketing). You cannot author them directly.
- Initially US-only at launch; broader rollout status as of 2026-08-05 **[UNVERIFIED]**

**What this means operationally:** your metadata is now *input to a model that decides how
Apple categorises you*. Vague, cute, or brand-only copy produces vague tags. Every listing
should state its concrete capabilities in plain nouns ("offline maps", "barcode scanner",
"interval timer") somewhere in indexed metadata, because that's the vocabulary Apple's
tagger reads. **And someone must check the generated tags after every launch** — an
irrelevant tag is free traffic pollution and a conversion-rate drag.

### Custom Product Pages (CPPs)

The most underused free lever Apple offers.

- Limit raised from **35 to 70** on **2025-10-29**
  ([MobileAction](https://www.mobileaction.co/blog/apple-doubles-the-custom-product-page-limit/)) **[DOCUMENTED]**
- Each CPP can have its **own screenshots, app preview videos, and promotional text**
  (not its own title/subtitle/icon)
- **CPPs can be assigned keyword sets and now appear in organic App Store search results**
  (change dated July 2025) — they are no longer paid-traffic-only **[DOCUMENTED]**
- CPPs can be **localised per market** while keeping brand identity consistent

**Measured effect, from the one dataset with a disclosed sample:** AppTweak's Apple Ads
benchmark shows US generic-keyword conversion at **56.4% with a CPP vs 52.2% without** —
a **~8% relative lift**. **[DOCUMENTED]**

> ⚠️ You will see "Apple reports a 156% conversion-rate lift from CPPs" and "23% more
> downloads on the same spend" repeated widely. I could not trace either to an Apple
> source or a disclosed methodology. **[UNVERIFIED]** — plan against the ~8% figure, not
> the 156% one.

### Product Page Optimization (PPO)

Apple's native A/B testing tool. **Up to 3 treatments tested against your default page**,
with traffic split and results reported in App Store Connect. **[DOCUMENTED]**
([Appbot guide](https://appbot.co/blog/product-page-optimization/))

**CPP vs PPO — the distinction our playbook doesn't make:**

- **PPO** = *test* which page is better for **everyone** → winner becomes the default
- **CPP** = *serve different pages* to **different audiences/keywords** simultaneously →
  no winner, permanent segmentation

They compose: use PPO to find the best default, then CPPs to segment paid and long-tail
organic traffic against it. **PPO is the mechanism our playbook's "listing changes are
experiments" rule should name explicitly.**

---

## 3. Google Play — indexed fields, 2026

| Field | Limit | Indexed? |
|---|---|---|
| **App title** | 30 chars | ✅ Highest weight |
| **Short description** | 80 chars | ✅ High weight |
| **Long description** | 4,000 chars | ✅ **Fully indexed** — unlike iOS |
| **Developer name** | — | ✅ |
| **Tags / category** | — | ✅ |
| **Android Vitals** (crash rate, ANR, startup time) | — | ⚠️ Visibility input |

**This asymmetry is the biggest cross-store ASO fact and our playbook currently misses
it:** on iOS the description is a pure conversion asset; on Play it is your primary
keyword real estate. **The same description text cannot be optimal for both stores.**
Play descriptions want keyword-dense natural prose across 4,000 characters; iOS
descriptions want a three-line pitch above the fold and scannable blocks below.

### Custom Store Listings (CSLs) — Play's answer to CPPs, and more powerful

- **Up to 50 custom store listings per app**, each with its own **app name, descriptions,
  icon, and graphic assets** — note this is *more* customisable than an iOS CPP, which
  cannot change title or icon
  ([AppTweak](https://www.apptweak.com/en/aso-blog/custom-store-listings),
  [MobileAction](https://www.mobileaction.co/blog/custom-store-listings-on-google-play/)) **[DOCUMENTED]**
- Can be triggered by **country, search keyword, Google Ads campaign, install state
  (new/lapsed user), or a dedicated URL**
- Google Play Console surfaces keyword suggestions for keyword-targeted CSLs

### Store Listing Experiments

- **5 concurrent experiments** on the main store listing per localisation
- **but 5 more per custom store listing** — so 50 CSLs × 5 = a very large testing surface
  ([AppTweak](https://www.apptweak.com/en/aso-blog/store-listing-experiments-a-guide-to-play-store-a-b-testing)) **[DOCUMENTED]**

Play's testing infrastructure is meaningfully better than Apple's (5+ concurrent vs 3
treatments), and it's free. **For a portfolio studio testing listing patterns across many
apps, Play is where you learn cheaply and port the winners to iOS.**

---

## 4. Screenshots and video — conversion impact

The highest-leverage listing asset, and the one where the factory's content pipeline
already produces the raw material.

**What's mechanically true:**

- **Frame 1 does most of the work.** Search-results browsing shows only the first 1–3
  screenshots (portrait) or 1 (landscape) without a tap.
- **App preview videos autoplay muted in search results on iOS.** They must read silently.
- The AppTweak dataset gives useful reference points for what "good" looks like: **median
  Apple Ads search-results conversion is 56%**, category range from Photo & Video 63% down
  to Shopping 41%. Organic search conversion runs lower but the category ordering holds.
  **[DOCUMENTED]**

**What I could not verify:** every "screenshots drive X% conversion lift" figure I found
traced to vendor marketing with no disclosed sample. **[UNVERIFIED]** The honest position:
screenshots are the highest-leverage variable *because PPO/Store Listing Experiments let
you measure your own lift for free* — not because a published benchmark says so. Measure
yours; don't cite anyone else's.

---

## 5. Ratings and ratings velocity

**The threshold effects are real and large:**

- Apps rated **under 3.5 stars have significantly reduced visibility** (AppTweak) **[DOCUMENTED]**
- Moving from **3 to 4 stars is associated with an ~89% conversion-rate increase** — the
  single most-cited ASO statistic, originating from Apptentive research
  ([AppFollow](https://appfollow.io/blog/app-rating-impact)). **[UNVERIFIED as to date]** —
  the underlying study predates 2022; the direction is certainly right, the precise
  magnitude is stale.
- **Playtika reported a 0.2-star increase on *Bingo Blitz* producing a 30% organic
  conversion increase — ~1,500 more installs and $135,000 additional monthly revenue.**
  **[ANECDOTAL — vendor-reported]** but it's a named app with a named number, which is
  more than most ASO claims offer.

**Velocity, not just level.** Both stores weight recent ratings more heavily than lifetime
average, and Apple lets you **reset your rating on a new version**. This matters
enormously for us: a bad launch is recoverable, and a stale 4.2 with no recent reviews is
weaker than a fresh 4.5.

**The rule that follows for the factory:** ratings are the **gate on paid spend**, not a
nice-to-have. Buying installs into a sub-4.0 listing means paying full CPI for a page that
converts ~30% instead of ~50% — you are burning roughly 40% of every pound at the door.
See `triggers.md` §2.

---

## 6. Featuring — the free channel our playbook omits entirely

Apple accepts **direct featuring nominations through App Store Connect**
([Apple Developer — Nominate your app for featuring](https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/)). **[DOCUMENTED]**

- Three nomination types: **App Launch**, **App Enhancements**, **New Content**
- Apple recommends a **minimum two weeks' lead time**; up to **three months ahead** for
  major launches
- Submit individually or by CSV (relevant for a portfolio studio)
- Editorial criteria emphasised: design quality, technical performance, high ratings,
  **adoption of new platform technologies**, in-app events, consistent updates

Practitioner guidance: **2–4 well-timed nominations per year per app**; nominating every
bugfix burns credibility with the editorial team
([AppTweak](https://www.apptweak.com/en/aso-blog/how-to-get-your-app-featured-on-the-app-store)). **[UNVERIFIED]**

**Why this matters more to us than to most:** the factory ships on a template. "Adoption
of new platform technologies" — widgets, Live Activities, App Intents, Control Center
controls, watch/visionOS support — is a **portfolio-level capability**, not a per-app
effort. Build a platform-feature once in the template, and every app in the portfolio
becomes independently nominatable. This is the highest ROI marketing work available to a
bootstrapped studio and it costs zero pounds.

---

## 7. How paid spend and organic rank interact

The mechanism, ordered by how confident we can be:

1. **Download velocity is a ranking signal, and paid downloads count toward it.**
   **[DOCUMENTED]** — universally agreed across ASO vendors.
2. **High tap-through on a paid keyword signals relevance for that query.** Given Apple's
   published use of *behavioral relevance* (clicks/downloads on a query), this is now
   mechanically plausible rather than folklore. **[DOCUMENTED by inference from Apple's paper]**
3. **Reported halo magnitude: 20–30% organic install lift for apps running active Apple
   Ads** (attributed to Mobile Action). **[UNVERIFIED]** — no methodology disclosed. Do not
   plan against this number; treat halo as an unpriced bonus, never as the justification
   for a campaign.
4. **The critical constraint:** the lift applies **only to keywords already in your
   metadata**. Paid amplifies organic positions you are already competing for; it does not
   create rankings for terms your metadata lacks. **[UNVERIFIED but mechanically consistent]**

**Two corollaries that should govern factory practice:**

- **ASO is a prerequisite for paid, not a parallel track.** Spending on a keyword absent
  from your metadata forfeits the halo entirely — you rent installs instead of buying an
  asset.
- **Negative halo is real.** Paid installs into an app with poor D7 retention now feed
  *worse* post-install signals into a ranker that weights them. On Google Play especially,
  badly-targeted paid UA can lower your organic rank. This is the mechanism behind the
  meditation-app failure in `case-studies.md` §9.

**And the pairing that actually pays:** Apple Ads keyword → matched Custom Product Page →
same keyword present in title/subtitle/keyword field. That triangle gets you the ~8% CPP
conversion lift, the download-velocity signal on a term you already rank for, and the
behavioural-relevance signal on that query. Any two out of three leaks value.

---

## 8. What has *not* changed

Worth stating, because a lot of 2026 ASO content implies everything is new:

- Title and subtitle are still the most heavily weighted text fields
- The iOS keyword field is still 100 characters and still the cheapest real estate in
  mobile marketing
- Long-tail still beats head terms for new apps — now more so
- Localisation still multiplies keyword surface
- Ratings still gate conversion harder than any other single variable
- One-variable-at-a-time testing discipline is still correct

Our playbook is right about all of these.

---

## 9. Delta report — `playbooks/aso.md` cross-check

Read at `/Users/morkus/src/app-factory/playbooks/aso.md` on 2026-08-05. **Not edited.**
The playbook is well-judged and its stage-mapping is sound. The gaps are almost all
*post-2024 store features* and *post-install ranking signals*.

### 🔴 Stale or materially incomplete

| # | Playbook says | 2026 reality | Impact |
|---|---|---|---|
| 1 | Ranking treated implicitly as metadata + conversion | **Both stores weight post-install retention/engagement as ranking inputs**; Apple has *published* that its ranker uses behavioral + semantic textual relevance ([Apple, Feb 2026](https://machinelearning.apple.com/research/augmenting-app)) | **High.** The playbook's model of "how ranking works" predates Apple's own disclosure. Retention is now an ASO metric, which means the analytics taxonomy and the ASO playbook are coupled. |
| 2 | Description described only as pitch + "scannable feature blocks" (§Listing assembly) | **iOS description is not indexed; Play's full 4,000-char description is.** | **High.** As written, the playbook produces a Play listing that forfeits its main keyword field. Needs a per-store split. |
| 3 | "Localize listing for top-5 markets ONLY when analytics show non-EN traction" | Defensible under cheapest-viable-step, but **CSL/CPP localisation is now near-free and localised CPPs surface in organic search** | **Medium.** The rule may now be leaving free keyword surface on the table. Worth revisiting, not obviously wrong. |
| 4 | "Icon tests only with real traffic volume" | Correct — but note **iOS CPPs cannot change the icon; Play CSLs can.** | Low, but a real cross-store trap. |

### 🟡 Thin — correct but missing the mechanism

| # | Gap | What's missing |
|---|---|---|
| 5 | **Custom Product Pages absent entirely** | 70 CPPs since 2025-10-29, keyword-assignable, appear in **organic** search, ~8% measured conversion lift. This is the single largest omission. |
| 6 | **Product Page Optimization absent** | §Post-launch loop says "listing changes are experiments, one variable at a time" — correct instinct, but never names Apple's native A/B tool (3 treatments) or Play's Store Listing Experiments (5 per listing × 50 CSLs). We're describing an experiment discipline with no experiment infrastructure. |
| 7 | **Apple AI-generated Tags absent** | New discovery surface live since 2025-07-16. Requires a post-launch check step (remove irrelevant tags) that exists nowhere in the stage flow. |
| 8 | **Google Play Custom Store Listings absent** | 50 per app, more customisable than CPPs (title + icon changeable), triggerable by keyword/country/campaign/install-state. |
| 9 | **Featuring absent entirely** | App Store Connect featuring nominations are free, portfolio-scalable via CSV, and reward platform-technology adoption — which is a *template-level* investment for us. Arguably the highest-ROI item in the whole marketing programme and it's not in the playbook. |
| 10 | **In-app events not mentioned** | Indexed for search relevance (WWDC 2025) and an explicit featuring criterion. |
| 11 | **Android Vitals not mentioned** | Crash/ANR rates affect Play visibility. This makes crash-free-sessions (already in the analytics taxonomy) an *ASO* metric, not just a quality metric. |
| 12 | **Ratings treated as review-response hygiene** | §Post-launch loop covers prompting and responding well. Missing: **sub-3.5 stars suppresses visibility**, the 3→4 star conversion cliff, that velocity outweighs lifetime average, and that **ratings gate paid spend** (`triggers.md` §2). |
| 13 | **No paid↔organic interaction** | Playbook and paid strategy are unconnected. The keyword → CPP → metadata triangle in §7 belongs somewhere. |
| 14 | Keyword field referenced without its limit | Title/subtitle limits are stated precisely (30/30); the **100-char** keyword field limit isn't. |

### ✅ Holds up well

- Naming pattern `<Brand>: <category keyword phrase>` — still correct, still the right
  balance of ownable and searchable
- "Mine competitor **review vocabulary** — what words do USERS use?" — this is *more*
  right in 2026, because Apple's ranker now scores **semantic fit**, and user vocabulary
  is the best available proxy for query semantics
- **"We win long-tail first, head terms later"** — now explicitly supported by Apple's
  published finding of strong gains on **tail queries where behavioural data is limited**
- The **differentiation statement** as an Apple 4.3 defence — genuinely good, and more
  important now that an LLM is reading our metadata to generate tags and relevance labels
- The **cadence guardrail** (2–4 releases/month, no burst-submitting near-identical apps)
  — subordinating everything to account trust is the correct hierarchy for a portfolio studio

### Suggested minimal patch

If only one change is made: **add a "Store surfaces" section** covering CPP/PPO (iOS) and
CSL/Store Listing Experiments (Play) at stage 8, plus a **featuring nomination step** and a
**tag review step** in the post-launch loop. That closes items 5–9, which are the ones
costing us free distribution today.
