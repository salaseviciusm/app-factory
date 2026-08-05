# TikTok Audience — Who Is Actually There, and Which Apps Fit

**Scope:** TikTok only. Purpose: decide, per app, whether TikTok is where its buyers live — before we spend a single founder-hour recording.

---

## 1. The headline numbers (US-first, since that's where app revenue is)

| Fact | Number | Source | Confidence |
|---|---|---|---|
| US adults who use TikTok | **37%** (up from 21% in 2021) | [Pew, *Americans' Social Media Use 2025*, 20 Nov 2025](https://www.pewresearch.org/internet/2025/11/20/americans-social-media-use-2025/) | High — nationally representative survey |
| US adults using YouTube | 84% | Pew, same | High |
| US adults using Instagram | 50% | Pew, same | High |
| US teens (13–17) who use TikTok | ~63% ever use | [Pew, *Teens, Social Media and AI Chatbots 2025*, 9 Dec 2025](https://www.pewresearch.org/internet/2025/12/09/teens-social-media-and-ai-chatbots-2025/) | High |
| US adults 65+ using TikTok daily | 5% | Pew, Nov 2025 | High |
| US adults who regularly get **news** on TikTok | **20%** (3% in 2020) | [Pew, 25 Sep 2025](https://www.pewresearch.org/short-reads/2025/09/25/1-in-5-americans-now-regularly-get-news-on-tiktok-up-sharply-from-2020/) | High |
| Under-30 US adults who get news on TikTok | **43%** (9% in 2020) | Pew, same | High |
| TikTok users who regularly get news there | 55% | Pew, same | High |
| US TikTok users (headcount) | ~170M | Widely cited, incl. Statista Oct 2025 and the USDS JV coverage | Medium — vendor/press estimate |
| Global time spent | ~90+ min/day per user on social apps; TikTok #1 globally in downloads, IAP revenue **and** total time spent in 2025 | [Sensor Tower, *State of Mobile 2026*](https://sensortower.com/blog/state-of-mobile-2026), via [9to5Mac, 21 Jan 2026](https://9to5mac.com/2026/01/21/sensor-towers-state-of-mobile-2026-tiktok-dominates-ai-apps-surge-games-lose-ground/) | Medium-high |

**The most useful demographic fact for us, and it's counterintuitive:** TikTok is **not** a teen app any more. Pew's education finding — *"those with some college or less education are more likely to use TikTok than those with at least a college degree"* — is a better predictor of fit than age. TikTok skews toward **mass-market consumers, not toward the tech-literate professional class.**

Age distribution (vendor-aggregated, `[LOWER CONFIDENCE]` — no single authoritative breakdown exists and sources disagree): roughly a quarter of US users are 10–19, roughly a fifth each in the 20s, 30s, and 40s, ~11% are 50+. The 25–34 band is consistently reported as the largest *ad* audience segment. Sources: [DesignRush](https://www.designrush.com/agency/social-media-marketing/trends/tiktok-user-demographics), [Statista](https://www.statista.com/statistics/1299771/tiktok-global-user-age-distribution/). Directionally: **plan for a 20–40 core, not a 13–19 core.**

Gender: US skew is commonly reported as ~60/40 female; global skews slightly male. `[LOWER CONFIDENCE]`

---

## 2. Purchase behaviour — the part that decides whether views turn into installs

`[MEDIUM CONFIDENCE — survey data, secondary reporting, methodologies not disclosed]`

- **63.1%** say they discover new products/services/trends on TikTok, vs **38.1%** on Google Search — [The Influence Agency](https://theinfluenceagency.com/blog/tik-tok-for-product-discovery)
- **49%** of Gen Z name TikTok as their top product-discovery channel — [YouGov, 2026](https://yougov.com/en-us/articles/54186-tiktok-made-me-buy-it-whos-discovering-new-products-on-social-media-in-2026)
- **56%** open TikTok specifically to find "something new"; **1 in 4** searches within 30 seconds of opening the app — [TikTok Newsroom, *Watch it. Love it. Want it.*](https://newsroom.tiktok.com/watch-it-love-it-want-it-how-tiktok-is-blending-discovery-connection-and-commerce?lang=en-150) (TikTok's own commissioned research — self-interested, but it's their platform)
- Social platforms collectively account for **60%+ of product discovery**, surpassing Google

**What this actually means for an app studio, stated without the marketing gloss:**

TikTok excels at **creating demand for things people didn't know they wanted**, at a low price point, bought impulsively, alone, on a phone. That is a precise description of a **$5–30/year consumer subscription app**.

It is bad at:
- Considered purchases with a research phase
- Anything requiring a desktop
- Anything needing organisational approval
- Anything above roughly $100 without a long nurture sequence

**Price ceiling heuristic:** every documented TikTok-driven app win in `case-studies.md` sits at **$30/year or ~$4–10/week**. Cal AI: $30/year. Umax: ~$3.99/week. Quittr: annual subscription in the ~$50–190 range depending on market. If our app's price needs a justification paragraph, TikTok isn't the channel.

---

## 3. Where app demos actually land — the subcultures

TikTok's distribution is an **interest graph**, so the practical question isn't "is my audience on TikTok" but "**is there an existing content community whose language I can speak**." If there isn't, we're building an audience from zero, which the data in `algorithm.md` §4 says is now brutally slow for small accounts.

### Tier A — dense, active, proven to convert to app installs

| Community | Why it works for app demos | Evidence |
|---|---|---|
| **Fitness / calorie tracking / body composition** | Highest documented conversion of any app category on TikTok. Visual before/after, daily-habit product, cheap subscription, huge creator supply | Cal AI: 15M+ downloads, $30M revenue in 2025, sold to MyFitnessPal Mar 2026 ([Forbes](https://www.forbes.com/sites/zoyahasan/2026/03/06/this-u30-kept-launching-apps-until-one-worked-then-sold-it-to-myfitnesspal/)) |
| **ADHD / neurodivergent** | The single best-fit community for productivity apps. Extremely high engagement, strong peer-recommendation norms, and members actively search for tools. Reported engagement rates of **10–18%**, well above platform average of ~3.85% — `[ANECDOTAL, vendor-sourced]` [Sprout Social](https://sproutsocial.com/insights/niche-communities/) | Finch (self-care pet) is repeatedly named as the ADHD community's default app across independent review sites ([AuDHD Flourishing](https://www.audhdflourishing.com/post/finch-adhd-self-care-app), [Neurodivergent Coaching](https://www.neurodivergent-coaching.com/post/app-reviews-finch-self-care)). Note: I could **not** verify Finch's install numbers or that TikTok specifically drove them |
| **Self-improvement / habit-breaking / "quitting" something** | Intense personal stakes, shame-driven private purchase, subscription-native, enormous creator ecosystem | Quittr: 1M downloads and ~$500K MRR in 9 months, bootstrapped ([Starter Story](https://www.starterstory.com/quittr-breakdown), [LA Weekly](https://www.laweekly.com/from-broke-to-bold-how-alex-slater-built-quittr-into-a-1m-digital-wellness-powerhouse-at-19/)) |
| **Appearance / dating / social confidence (young male)** | Ruthlessly efficient. Insecurity + instant AI verdict + weekly paywall | Umax: reported ~7M downloads at ~$3.99/week ([Whop](https://whop.com/blog/looksmaxxing-blake-anderson/)). Ethically ugly — see §6 |
| **Students / StudyTok** | Study-planner, flashcard, note apps. Seasonal (Aug–Sep, Jan) | #StudyTok aggregates billions of views; low purchasing power but high install volume |
| **BookTok** | Reading trackers, TBR managers, annotation apps. Exceptional commercial proof: **50M+ books sold in Europe in 2025 attributed to #BookTok, ~€800M revenue** ([Accio](https://www.accio.com/business/book_tok_trend), `[MEDIUM]` — trade-body figure via secondary source) | Best evidence anywhere that a TikTok subculture moves real money |
| **Personal finance / FinTok** | Budget trackers, subscription cancellers, net-worth apps. #PersonalFinance reported at 4B+ views | High intent; heavy regulatory sensitivity on advice claims |

### Tier B — real communities, harder conversion

- **Cooking / meal prep** — huge, but the app has to be the *reason* the food exists, not an accessory
- **Photo/video editing tools** — works, but you're competing with CapCut, which is owned by ByteDance and natively integrated
- **Pets** — massive engagement, weak monetisation for apps
- **Hobby communities (running, climbing, knitting, plants, birding, TTRPG)** — small but extremely high trust; a niche tracker app can own one of these outright. Low ceiling, high conversion. **Good fit for a portfolio studio precisely because the ceiling doesn't matter if the cost is one founder-hour a week.**
- **Language learning** — Duolingo has trained this audience to expect entertainment-first brand content; the bar is high
- **Sleep / meditation** — crowded, ad-heavy, dominated by incumbents with ad budgets

### Tier C — do not build a TikTok strategy for these

- **B2B / developer tools / anything with a seat-based price.** The buyers exist on TikTok as *people*, but they don't buy there. Industry consensus is that TikTok is at best an awareness feeder into LinkedIn/email for B2B, not a conversion channel ([Stackmatix](https://www.stackmatix.com/blog/tiktok-advertising-saas-companies-2026), [Benly](https://benly.ai/learn/tiktok-ads/tiktok-ads-saas-marketing)). Our own failure case confirms it: **Tube2Blog got 1M views, 100K likes, 6K followers on TikTok and reported zero conversions** (see `case-studies.md`).
- **Enterprise / regulated / financial-advice products.**
- **Local services apps** — TikTok's distribution is interest-based, not geographic; you cannot reliably reach "people in Leeds."
- **Anything where the buyer is 55+.** Only 5% of US 65+ use TikTok daily.
- **Anything requiring a desktop to get value.** The install path is phone → App Store → open. A web app that needs a laptop loses the whole funnel.

---

## 4. The decision rule — "if your app targets X…"

Run each app through this before committing recording time:

**TikTok is the right primary channel if ALL of:**
1. The user is a **consumer**, aged roughly 16–45, paying with their own money
2. Price is **≤ $30/year or ≤ $10/week**, purchasable in under 60 seconds
3. Value is **visible on a phone screen in under 3 seconds** — a before/after, a score, a number going up, a mess becoming tidy
4. There is an **existing content community** using recognisable vocabulary we can search and enter
5. The purchase is **individual and impulsive**, not researched or approved

**TikTok is the wrong primary channel if ANY of:**
- The buyer is a business, a team, or a professional buying for work
- The product needs a demo, a trial, or an onboarding call
- Value only appears after weeks of use with nothing visible early
- The core audience is over 50
- The output looks like a spreadsheet

**Concrete calls for typical App Factory shapes:**

| If the app is… | Verdict |
|---|---|
| A running/pace tracker for casual runners | **Yes** — FitTok + hobby community, visible numbers, cheap sub. Strong fit |
| A calorie/nutrition tool | **Yes, but** — the most saturated, most creator-expensive niche on the platform. Cal AI's exit raised the price of entry. Only enter with a genuinely novel 3-second demo |
| An ADHD/executive-function planner | **Yes — highest-leverage fit for us.** Community actively searches for tools, peer recommendation is the norm, and our founder-recorded honest-demo style matches community expectations exactly |
| A habit-breaking / streak app | **Yes** — proven repeatedly |
| A hobby-specific tracker (climbing, plants, birding) | **Yes, at small scale** — cheap to own, low ceiling, excellent margin on effort |
| A budgeting / subscription-canceller | **Yes** — FinTok has intent; avoid advice-shaped claims |
| A dev tool, API, or internal-team app | **No.** Use it for founder-brand awareness only, and don't count installs |
| A B2B analytics dashboard | **No** |
| Anything priced above ~$100/yr | **No** as a direct-response channel |

---

## 5. What the audience data means for our content, specifically

1. **Assume viewers are not technical.** Pew's education skew is the key insight. "Syncs via CloudKit" is invisible. "Your phone dies and your stuff is still there" is not.
2. **Assume they're watching sound-on, one-handed, at speed.** TikTok's own ads guidance says design for sound-on and cap text at 5–10 words/second ([TikTok Ads creative best practices](https://ads.tiktok.com/help/article/creative-best-practices)).
3. **Assume they're in search mode a quarter of the time.** 1 in 4 users searches within 30 seconds of opening. That's the case for the search-inventory play in `algorithm.md` §6.
4. **Assume they treat TikTok as an information source, not entertainment only.** 55% of TikTok users regularly get news there (Pew). Explanatory, informational content is native here — it doesn't need to be a dance.
5. **Assume the community, not the algorithm, is the moat.** In Tier A niches the audience is already assembled and talking. Entering an existing conversation beats broadcasting into #fyp, every time.

---

## 6. An honest note on the highest-converting niches

The two best-documented conversion machines on TikTok for indie apps are **appearance-rating for teenage boys** (Umax) and **shame-driven habit-breaking** (Quittr). The first has drawn psychologists' warnings about worsening the youth mental-health crisis ([Fortune/Yahoo Finance](https://finance.yahoo.com/news/looksmaxxing-apps-rate-teen-boys-163942148.html)), and the FTC has already banned one TikTok-grown teen app (NGL) from serving under-18s entirely with a $5M settlement ([FTC, 9 Jul 2024](https://www.ftc.gov/news-events/news/press-releases/2024/07/ftc-order-will-ban-ngl-labs-its-founders-offering-anonymous-messaging-apps-kids-under-18-halt)).

TikTok converts best on **insecurity**. That's a real, measured property of the channel, and it's worth naming so we choose deliberately rather than drift there because the metrics are good. The ADHD/neurodivergent, hobby, and fitness-for-normal-people niches convert well *and* don't carry regulatory or reputational tail risk. That's where a studio that wants to still exist in three years should aim.

---

## Sources

- [Pew Research Center — Americans' Social Media Use 2025 (20 Nov 2025)](https://www.pewresearch.org/internet/2025/11/20/americans-social-media-use-2025/)
- [Pew Research Center — 1 in 5 Americans regularly get news on TikTok (25 Sep 2025)](https://www.pewresearch.org/short-reads/2025/09/25/1-in-5-americans-now-regularly-get-news-on-tiktok-up-sharply-from-2020/)
- [Pew Research Center — Teens, Social Media and AI Chatbots 2025 (9 Dec 2025)](https://www.pewresearch.org/internet/2025/12/09/teens-social-media-and-ai-chatbots-2025/)
- [Sensor Tower — State of Mobile 2026](https://sensortower.com/blog/state-of-mobile-2026) / [9to5Mac coverage](https://9to5mac.com/2026/01/21/sensor-towers-state-of-mobile-2026-tiktok-dominates-ai-apps-surge-games-lose-ground/)
- [TikTok Newsroom — Watch it. Love it. Want it.](https://newsroom.tiktok.com/watch-it-love-it-want-it-how-tiktok-is-blending-discovery-connection-and-commerce?lang=en-150)
- [YouGov — TikTok made me buy it (2026)](https://yougov.com/en-us/articles/54186-tiktok-made-me-buy-it-whos-discovering-new-products-on-social-media-in-2026)
- [Sprout Social — The future is niche: brand guide to niche communities](https://sproutsocial.com/insights/niche-communities/)
- [FTC — Order will ban NGL Labs from offering anonymous messaging to under-18s (9 Jul 2024)](https://www.ftc.gov/news-events/news/press-releases/2024/07/ftc-order-will-ban-ngl-labs-its-founders-offering-anonymous-messaging-apps-kids-under-18-halt)
- [Fortune via Yahoo Finance — Looksmaxxing apps and the youth mental health crisis](https://finance.yahoo.com/news/looksmaxxing-apps-rate-teen-boys-163942148.html)
