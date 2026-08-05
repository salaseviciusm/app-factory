# TikTok Algorithm — How Distribution Actually Works (as of August 2026)

**Scope:** TikTok only. Written for a bootstrapped indie app studio posting founder-recorded screen demos, edited by agents.

**Evidence labelling used throughout:**
- `[DOCUMENTED]` — stated by TikTok in its own newsroom, support docs, Community Guidelines, Creator Academy, or ads help centre; or measured in a published study with a disclosed sample size.
- `[ANECDOTAL]` — creator folklore, agency blog inference, or vendor marketing. May still be true. Not confirmed.

**Source-quality warning:** the top 20 Google results for "TikTok algorithm 2026" are almost entirely SEO content farms that copy each other. Several widely-repeated numbers in this doc (the "200–500 view test batch", "75% completion threshold") trace back to no primary source at all. They are labelled accordingly. Do not build a strategy that only works if those numbers are literally true.

---

## 0. The 2026 structural change you must know about

The US TikTok business was restructured into **TikTok USDS Joint Venture LLC**, which launched **22 January 2026**, with Oracle and US investors holding control and a mandate to **retrain the recommendation algorithm on US-only engagement data**. `[DOCUMENTED — ownership/launch]` `[ANECDOTAL — ranking effects]`
- Source: [TikTok Newsroom — Announcement from the new TikTok USDS Joint Venture LLC](https://newsroom.tiktok.com/announcement-from-the-new-tiktok-usds-joint-venture-llc)
- Analysis: [eMarketer — TikTok's US overhaul gives advertisers greater certainty](https://www.emarketer.com/content/tiktok-s-us-overhaul-gives-advertisers-greater-certainty--though-questions-remain), [Forrester — US TikTok set to divest in 2026](https://www.forrester.com/blogs/the-tale-of-turmoil-ends-us-tiktok-set-to-divest-in-2026/)

**What this means for us:** nobody — including the agencies selling playbooks — has a clean 2026 model of US distribution yet. Any tactic that depends on a precise threshold is a guess. Tactics that depend on *retention and shares being good* are safe, because no plausible retraining inverts those. Treat all pre-2026 US benchmark data as **possibly stale** and re-baseline our own account metrics quarterly.

---

## 1. What TikTok itself says drives distribution

`[DOCUMENTED]` — [TikTok Newsroom: How TikTok recommends videos #ForYou](https://newsroom.tiktok.com/en-us/how-tiktok-recommends-videos-for-you)

Signals TikTok names:
1. **User interactions** — "videos you like or share, accounts you follow, comments you post, and content you create"
2. **Video information** — captions, sounds, hashtags
3. **Device and account settings** — language, country, device type; TikTok explicitly says these are **weighted lower** because they are not active choices

TikTok's own weighting statement: *"a strong indicator of interest, such as whether a user finishes watching a longer video from beginning to end, would receive greater weight than a weak indicator, such as whether the video's viewer and creator are both in the same country."*

**Explicitly NOT direct factors** `[DOCUMENTED]`:
> "neither follower count nor whether the account has had previous high-performing videos are direct factors in the recommendation system"

This is the single most important documented fact for us: **a new account with 0 followers is not structurally disadvantaged.** Every video is judged on its own. Our first video and our hundredth get the same entry conditions.

**Diversification is deliberate** `[DOCUMENTED]`: TikTok says the system avoids showing two videos in a row from the same creator or with the same sound, and deliberately injects content outside your expressed interests. Practical consequence: **you cannot dominate one user's feed**, and posting 6 near-identical videos in a day does not give you 6× the shot at the same viewers.

**Ineligible for recommendation** `[DOCUMENTED]`: graphic medical procedures, regulated goods, content still under review immediately after upload, and "spam or content that attempts to artificially increase traffic."

---

## 2. The signal hierarchy — what actually correlates with reach

TikTok has **never published a ranking weight table.** Everything below is inference from published engagement studies plus TikTok's own qualitative statement that completion is a "strong indicator."

| Signal | Status | Notes |
|---|---|---|
| Average watch time / completion rate | `[DOCUMENTED]` as a strong signal (TikTok's own wording), **not** `[DOCUMENTED]` as *the* top signal | TikTok says finishing a longer video is a strong indicator |
| Rewatch / loop | `[ANECDOTAL]` | Universally claimed; no primary source. Mechanically plausible since it inflates watch time |
| Shares | `[DOCUMENTED]` as an interaction signal; **rising fastest in measured data** | Socialinsider: shares/post up **13% YoY overall**, **+44% for 100K–1M accounts** ([2026 TikTok Benchmarks](https://www.socialinsider.io/social-media-benchmarks/tiktok), 2M videos / 214,507 profiles, Jan 2024–Dec 2025) |
| Saves / favourites | `[ANECDOTAL]` for weighting | Not named separately in TikTok's newsroom post |
| Comments | `[DOCUMENTED]` as an interaction signal | Socialinsider: comments up only 3% YoY overall |
| Follows from the video | `[ANECDOTAL]` for weighting | |
| Likes | `[ANECDOTAL]` that they are the *weakest* signal | Repeated everywhere, sourced nowhere |
| Follower count | `[DOCUMENTED]` — **not a direct factor** | |

**First-3-seconds retention.** TikTok's own advertising guidance is the closest thing to documentation: *"Prioritize your hook in the first 6 seconds"* and introduce the content proposition **within 3 seconds** for better recall. `[DOCUMENTED]` — [TikTok Ads Help: Creative best practices](https://ads.tiktok.com/help/article/creative-best-practices). Note TikTok's own number is **6 seconds for the hook, 3 seconds for the value prop** — the ubiquitous "3-second rule" is a creator simplification of ad guidance. The widely-quoted "the first 3 seconds determine 71% of whether users keep watching" figure has no traceable primary source. `[ANECDOTAL]`

**Practical translation for screen-recording app demos:** the app must be legible as a *thing that solves a problem* within 3 seconds. Cal AI's founder said exactly this about product design — *"making sure it had such a clean, simple, elegant design and feel, that it could be understood within three seconds of a TikTok"* ([Forbes, 6 Mar 2026](https://www.forbes.com/sites/zoyahasan/2026/03/06/this-u30-kept-launching-apps-until-one-worked-then-sold-it-to-myfitnesspal/)). That is a **product** constraint, not an editing constraint. If a demo needs 8 seconds of setup to make sense, the problem is the app's first screen.

---

## 3. The "traffic pool / graduation" model — treat as folklore

The near-universal claim: TikTok shows every new video to a test batch of ~200–500 users; if engagement clears a threshold it graduates to a 5–10× larger pool; repeat in waves.

**Status: `[ANECDOTAL]`.** TikTok has never described this. It is repeated by [Darkroom](https://www.darkroomagency.com/observatory/tiktok-algorithm-guide-2026-everything-we-know-about-how-videos-are-ranked), [Conbersa](https://www.conbersa.ai/learn/tiktok-algorithm-explained), and dozens of derivative blogs, none citing a primary source. I could find no debunking either — it is simply unverified.

**What IS documented about the underlying machinery:** ByteDance published its production recommender architecture, *Monolith*, at ACM RecSys 2022 — a collisionless-embedding-table system with **online training that updates from user feedback in near-real-time**, explicitly trading system reliability for real-time learning. `[DOCUMENTED]` — [arXiv:2209.07663](https://arxiv.org/abs/2209.07663), [github.com/bytedance/monolith](https://github.com/bytedance/monolith). This is consistent with a fast feedback loop where early engagement compounds, but it describes **continuous embedding updates**, not discrete "pools."

**How to use this:** the operationally useful part of the folklore is the part that would be true under almost any recsys design — **early retention on a small seed audience determines whether a video scales.** So: front-load the hook, and don't measure a video's fate at 50 views. Do **not** use "my video stuck at 480 views so I'm shadowbanned" as a diagnostic; that's the single most common creator misdiagnosis and there is no evidence for it.

**The real, measured baseline is bleaker than the folklore implies.** Buffer's study of **11.4M TikTok posts across 150,000+ accounts** (8 Oct 2025) found the **median TikTok post gets roughly 500 views regardless of how often you post.** `[DOCUMENTED]` — [Buffer: How often should you post on TikTok](https://buffer.com/resources/how-often-should-you-post-on-tiktok/). ~500 views is not a punishment. It is the normal outcome.

---

## 4. Posting cadence — the one place we have real numbers

**TikTok's official guidance** `[DOCUMENTED]`: post **1–4 times per day**, with fewer posts on weekdays and up to four on weekends. — [TikTok Creator Academy: Posting cadence best practices](https://www.tiktok.com/creator-academy/en/article/posting-cadence-best-practices-publishers)

**Buffer, 11.4M posts / 150k+ accounts, Oct 2025** `[DOCUMENTED]`:

| Posts per week | Avg. views/post vs 1×/week | 90th-percentile views |
|---|---|---|
| 1 | baseline | 3,722 |
| 2–5 | +17% | 6,983 |
| 6–10 | +29% | 10,092 |
| 11+ | +34% | 14,401 |

Median views stayed ~flat (~500) at every cadence. Buffer's conclusion: **frequency doesn't improve your typical post — it buys more lottery tickets on the breakout.** Gains held across account sizes.

**Socialinsider, 2M videos / 214,507 profiles, Jan 2024–Dec 2025** `[DOCUMENTED]` — and this is the number that should shape our expectations:

| Follower band | Avg. views/post 2024 | 2025 | Change |
|---|---|---|---|
| 1K–5K | 860 | **350** | **−59%** |
| 5K–10K | 1,575 | 945 | −40% |
| 10K–50K | 3,655 | 3,240 | −11% |
| 50K–100K | 8,688 | 9,900 | +14% |
| 100K–1M | 25,198 | 34,900 | +38% |

Meanwhile average posting frequency rose ~40% across all bands. **Small accounts are posting more and getting far less.** Engagement *rate by views* held up (4.40% for 1K–5K accounts, vs 3.95% for 100K–1M) — the audience still engages when it sees you; you just get seen less.

**Our cadence decision:** 2–3 posts/day per account is the defensible target — inside TikTok's own 1–4 guidance, in Buffer's top gain band, and sustainable for an agent-assisted pipeline. Going to 11+/week is justified by the data; going to 30+/week is not, and increases spam-classifier exposure (see `credibility.md`).

---

## 5. What actually suppresses reach

### 5.1 For You Feed ineligibility (the real list) `[DOCUMENTED]`

TikTok's Community Guidelines define content that is allowed to exist but is **not eligible for the For You feed**. — [TikTok Community Guidelines: For You feed Eligibility Standards](https://www.tiktok.com/community-guidelines/en/fyf-standards)

Categories that directly threaten an app-marketing account:

| Category | TikTok's wording | Our exposure |
|---|---|---|
| **Unoriginal** | "Account info or video content is copied from others or has **minimal original input or edits**" | **HIGH.** Re-cutting the same screen recording 40 ways is exactly this risk |
| **Low quality** | "includes split screens, meaningless reactions, low-quality images, or **slide videos**" | **HIGH.** Text-over-stock-footage AI edits; also note *slide videos* are named |
| **Clickbait** | "lacks meaningful value and is primarily designed to attract followers, likes, or advertisement clicks" | **MEDIUM.** "Wait for it" hooks with no payoff |
| **Advertising** | "Profile, account info contains personal or business contact information" | **MEDIUM.** Watch how we phrase the bio |

Also ineligible: content under review immediately post-upload, and spam intended to artificially inflate traffic ([Newsroom](https://newsroom.tiktok.com/en-us/how-tiktok-recommends-videos-for-you)).

### 5.2 The originality crackdown — the biggest 2025→2026 change

TikTok **escalated enforcement against unoriginal content from 15 September 2025**, adding violation points, monetisation freezes and reduced visibility on top of FYF removal. `[DOCUMENTED — policy exists]` `[ANECDOTAL — specific enforcement thresholds]`
- Policy: [TikTok Creator Academy — Originality policy](https://www.tiktok.com/creator-academy/article/tiktok-originality-policy)
- Enforcement date and consequences summary: [BigSeller, Sept 2025](https://www.bigseller.com/blog/articleDetails/3778/tiktok-unoriginal-content.htm) (secondary — treat date as reliable, penalty details as approximate)

Reported scope includes **re-uploading your own old content**, and explicitly: filters, overlays and minor edits **do not** make reused material original. TikTok's LIVE and video enforcement messaging now says content "may contain unoriginal or reproduced content" and is therefore "not eligible for recommendation and restricted in search results."

**This is the direct threat to an AI-edited pipeline.** A studio that takes one 90-second screen recording and produces 30 videos from it — different music, different captions, same footage — is describing TikTok's definition of unoriginal content back to it. Mitigation is in `credibility.md`; the algorithmic point here is that the penalty is **search restriction plus FYF ineligibility**, i.e. silent, not a visible ban.

### 5.3 Watermarks

"Unoriginal content (such as content uploaded **with a watermark** or a simple GIF)" appears in TikTok's FYF standards as summarised by [Hootsuite's algorithm guide](https://blog.hootsuite.com/tiktok-algorithm/). `[DOCUMENTED]`

**Practical rule:** never cross-post a video that still carries a CapCut, Instagram, or TikTok-download watermark. Export clean masters from the source project for every platform. This is the cheapest reach protection available and we control it entirely.

### 5.4 Off-platform links

- **Personal accounts** need **1,000 followers** to add a bio link. **Business accounts** can add one immediately. `[DOCUMENTED — feature gating]`
- I found **no evidence** that having a bio link suppresses reach. `[ANECDOTAL — the claim that it does]`
- The real cost is the **account-type tradeoff** (§7).
- Links in captions are not clickable and eat hook real estate. Links in comments are a spam-classifier risk and are not clickable either.

### 5.5 AI-generated content

`[DOCUMENTED]`: TikTok integrated **C2PA Content Credentials in Jan 2025**, has helped label **over 1.3 billion videos**, and from **19 November 2025** began adding **invisible watermarks** to content made with its own AI tools — watermarks that survive re-encoding and re-upload. It also began testing a **"Manage topics" control letting users dial down how much AIGC they see in their For You feed.** — [TikTok Newsroom: More ways to spot, shape and understand AI-generated content](https://newsroom.tiktok.com/more-ways-to-spot-shape-and-understand-ai-content?lang=en)

`[ANECDOTAL]`: claims that TikTok "deprioritises content flagged by its synthetic-media classifier" in FYP ranking, and the claim that the AIGC label is "a disclosure mechanism, not a distribution signal." Both circulate; neither is in TikTok's newsroom post.

**The user-control feature is the thing that matters to us, and it is documented.** Even if AI content isn't algorithmically demoted, TikTok is handing users a slider to see less of it. A studio whose output is classifiable as AIGC is opting into a shrinking addressable feed. Our footage is **real screen recordings of real software** — that's a genuine moat, and we should protect its realness (see `credibility.md`).

Context on the scale of the problem: a Kapwing analysis reported **59% of videos served to new TikTok accounts were AI slop, vs 21% on YouTube Shorts** ([reported by Tech Times, Jul 2026](https://www.techtimes.com/articles/320282/20260713/tiktok-has-labeled-3-billion-ai-videos-here-what-research-says-they-miss.htm)). `[ANECDOTAL — third-party methodology not independently verified]`

### 5.6 Things people believe suppress reach, with no evidence

All `[ANECDOTAL]`, all unsourced, all repeated constantly:
- Deleting a video hurts the account
- Editing the caption after posting kills reach
- Using #fyp triggers a penalty
- Posting at "bad times" caps distribution
- A stuck-at-500-views video means shadowban (see §3 — 500 is the *median*)
- Banned-word lists in captions

Do not spend engineering time on any of these. If we want to know, we run our own A/B across our own accounts and log it.

---

## 6. Search, SEO and hashtags — the highest-leverage under-exploited channel

TikTok is a **search engine for our category**, and this is where app demos have structural advantage: someone searching "app to track calories from a photo" has commercial intent that a For You scroller does not.

`[DOCUMENTED]`:
- **49% of US consumers use TikTok to search**, and 63.1% say they discover new products/services on TikTok vs 38.1% on Google Search — [The Influence Agency](https://theinfluenceagency.com/blog/tik-tok-for-product-discovery) (survey, secondary reporting — check methodology before quoting externally)
- TikTok's captions, sounds and hashtags are named by TikTok as **"video information"** ranking inputs — [Newsroom](https://newsroom.tiktok.com/en-us/how-tiktok-recommends-videos-for-you)
- Content is "restricted in search results" as an *originality* penalty — i.e. **search ranking is a separate, losable surface**

`[ANECDOTAL]` but consistent across sources: TikTok indexes **on-screen text and spoken audio (auto-transcription)**, not just captions. — [SEO Sherpa](https://seosherpa.com/tiktok-seo/), [Metricool](https://metricool.com/tiktok-seo/). Widely claimed, never confirmed by TikTok. **Cheap to comply with regardless**: say the search phrase out loud in the voiceover AND put it in on-screen text AND in the caption. Zero cost if wrong.

**Hashtags:** the claim that "hashtag-driven traffic jumped 114% YoY" is vendor-sourced and I could not verify it — treat as `[ANECDOTAL]`. The defensible guidance is TikTok's own: hashtags are a metadata input, not a magic multiplier. Use **3–5 specific ones matching real search phrases** (`#adhdapp`, `#studytok`, `#budgetapp`) over `#fyp #viral #foryou`, which carry no intent signal and edge toward the clickbait definition.

**Our concrete search play:** for each app, build a list of 20–30 "app for X" / "how do I X" queries, and produce one video per query whose *title text, spoken first line, and caption all contain the query verbatim*. These videos may never trend, but they are permanently discoverable inventory for high-intent traffic. This is the single most defensible organic tactic on the platform for a studio with a demo library.

---

## 7. Sound selection — and the account-type trap

`[DOCUMENTED]`:
- Sound is a named ranking input ("video information").
- TikTok deliberately **avoids serving two videos in a row with the same sound** — so a trending sound is *not* a free multiplier; it can put you in a rotation-limited bucket.
- TikTok's ads guidance: **sound/music is essential** to performance; design for sound-on. — [TikTok Ads creative best practices](https://ads.tiktok.com/help/article/creative-best-practices)
- **Business accounts are restricted to the Commercial Music Library (CML)** and cannot use trending copyrighted tracks in promotional content. TikTok updated its Music Terms and CML terms on **25 July 2025**. — corroborated across [Foxi](https://www.foximusic.com/blog/commercial-music-licensing-tiktok-guide/), [Status](https://brands.joinstatus.com/tiktok-commerical-music-library), [TokPortal](https://www.tokportal.com/post/us-music-on-tiktok-explained-commercial-library-vs-trending-sounds-and-what-brands-can-safely-use)

**The trap, stated plainly:**

| | Personal / Creator account | Business account |
|---|---|---|
| Bio link | Needs 1,000 followers | Immediate |
| Trending copyrighted sounds | Yes | **No — CML only** |
| Risk | Slow to monetise traffic | Muted videos / label action if you use trending audio commercially |

**Our recommendation:** run the **founder's personal/creator account** as the primary channel, use **original audio (founder voiceover) as the default**, and reach 1,000 followers for the link. Original voiceover sidesteps the CML question entirely, is more original under §5.2, and is required for the search/SEO play in §6 anyway. Keep a Business account only if we start running Spark Ads (§8), where CML is irrelevant because ads use licensed or original audio.

**Sound tactic that is actually ours:** use the app's *own* UI sounds and the founder's voice as the "sound." It is unambiguously original, cannot be muted, and if a video breaks out, other people using our original sound is a free distribution loop.

---

## 8. Comment mechanics and reply-videos

**Comment reply videos** are a first-class TikTok feature: replying to a comment with a video creates a **new post** carrying the original comment as a sticker overlay. `[DOCUMENTED — feature exists]` `[ANECDOTAL — that it gets a reach boost]`

Why it matters mechanically, independent of any boost:
1. It converts an objection into new inventory. "Does this work offline?" becomes a 15-second demo answering exactly that.
2. The comment sticker **is a hook** — it supplies context in frame 1, which is what §2 demands.
3. It is unambiguously original content under §5.2 — it cannot be a repost of anything.

**Comment velocity** is `[ANECDOTAL]` as a ranking signal, and note Socialinsider found comments are the **slowest-growing** engagement type (+3% YoY overall). Comment-bait for its own sake is low-yield and risks the clickbait category.

**The comment section is where app installs actually happen.** The Playkit agency writeup — [The Playbook by Suzanna](https://theplaybookbysuzanna.substack.com/p/how-150-creators-and-600-tiktoks) — reports conversion happens *primarily in comments*, where the creator answers "what's it called?" naturally. `[ANECDOTAL — agency self-reported]` But it is mechanically sound: organic TikTok has **no clickable link in the video**, so the comment thread is the only in-frame path to the App Store. Budget real time for it. A video with 400 comments we never answered is a video we monetised at zero.

---

## 9. Ads ↔ organic interaction

**Spark Ads** let you put paid spend behind an existing organic post — yours or a creator's — running from the **original handle**, keeping the original comments and likes. `[DOCUMENTED — mechanic]`

TikTok's own published lift claims for Spark vs standard In-Feed: **+134% completion rate, +157% 6-second view-through rate.** `[DOCUMENTED as a TikTok marketing claim, not independently verified]` Agency-reported figures (+66% watch time, +33% CVR, −27% CPI) are `[ANECDOTAL]` — [inBeat](https://inbeat.agency/blog/tiktok-spark-ads), [Stackmatix](https://www.stackmatix.com/blog/tiktok-spark-ads-guide).

**App-install CPI benchmarks — treat with suspicion.** Published 2026 ranges disagree wildly: $0.50–$1.80 ([UpStack](https://docs.upstackdata.com/reference/metrics/advertising/tiktok/tiktok-conversions/tiktok-app-installs-cost)) vs $1.75–$4.00 with a $1.72 global median ([TikAdTools](https://tikadtools.com/blog/tiktok-ads-app-install/)). None disclose methodology. **Assume $2–4 CPI for a non-gaming consumer app in a Tier-1 market until we have our own data.** `[ANECDOTAL]`

**The interaction that matters for us — the one every documented winner used:**
> Post organically at volume → identify the 1–3 posts with genuinely outlier retention and comment quality → put paid spend behind *those specific posts* via Spark Ads.

This is the model behind Cal AI's scale-up (organic/creator → $1M+/month ad spend against $5.7M monthly revenue by Jan 2026 — [Inc.](https://www.inc.com/ben-sherry/he-built-an-ai-app-in-high-school-made-40m-and-sold-to-myfitnesspal-now-hes-aiming-even-bigger/91307748)). Organic is not the growth channel; **organic is the creative-testing lab that tells you which creative is worth paying to distribute.** For a bootstrapped studio with no ad budget, that reframing still holds — it just means organic winners tell us which *app* deserves more of the founder's time.

**Do not** run ads to prop up an underperforming organic post. If it didn't hold attention for free, paid distribution buys worse attention.

---

## 10. Operating rules — what we actually do

1. **Hook in 3 seconds, product legible in 3 seconds.** If the app can't be understood that fast, that's a product bug, not an edit bug. `[DOCUMENTED basis]`
2. **2–3 posts/day, one primary founder account per app.** Inside TikTok's own guidance; inside Buffer's high-gain band. `[DOCUMENTED basis]`
3. **Expect ~500 median views.** Judge the pipeline on the 90th percentile and on installs-per-1,000-views, never on averages. `[DOCUMENTED basis]`
4. **Every video gets original footage or an original angle.** No re-cutting the same clip with new music. `[DOCUMENTED risk]`
5. **Zero watermarks. Ever.** Export clean masters per platform. `[DOCUMENTED risk]`
6. **Original founder voiceover as the default audio.** Sidesteps CML, maximises originality, feeds search indexing. `[DOCUMENTED basis]`
7. **Build a search-query inventory** — one video per real query, phrase verbatim in speech + on-screen text + caption. Highest-leverage under-exploited channel. `[MIXED]`
8. **Answer comments within the first 2 hours, and turn the best question into a reply-video.** The comment section is the install funnel. `[DOCUMENTED feature, ANECDOTAL boost, sound mechanics]`
9. **Personal/creator account until 1,000 followers**, then bio link. Business account only if/when we run Spark Ads. `[DOCUMENTED]`
10. **Re-baseline every quarter.** The US algorithm is being retrained on US-only data through 2026. `[DOCUMENTED]`

---

## Sources

- [TikTok Newsroom — How TikTok recommends videos #ForYou](https://newsroom.tiktok.com/en-us/how-tiktok-recommends-videos-for-you)
- [TikTok Community Guidelines — For You feed Eligibility Standards](https://www.tiktok.com/community-guidelines/en/fyf-standards)
- [TikTok Creator Academy — Originality policy](https://www.tiktok.com/creator-academy/article/tiktok-originality-policy)
- [TikTok Creator Academy — Posting cadence best practices](https://www.tiktok.com/creator-academy/en/article/posting-cadence-best-practices-publishers)
- [TikTok Ads Help — Creative best practices](https://ads.tiktok.com/help/article/creative-best-practices)
- [TikTok Newsroom — More ways to spot, shape and understand AI-generated content](https://newsroom.tiktok.com/more-ways-to-spot-shape-and-understand-ai-content?lang=en)
- [TikTok Newsroom — Announcement from the new TikTok USDS Joint Venture LLC](https://newsroom.tiktok.com/announcement-from-the-new-tiktok-usds-joint-venture-llc)
- [ByteDance — Monolith: Real Time Recommendation System With Collisionless Embedding Table (arXiv:2209.07663)](https://arxiv.org/abs/2209.07663)
- [Buffer — How often should you post on TikTok (11.4M posts, Oct 2025)](https://buffer.com/resources/how-often-should-you-post-on-tiktok/)
- [Socialinsider — 2026 TikTok Benchmarks (2M videos, 214,507 profiles)](https://www.socialinsider.io/social-media-benchmarks/tiktok)
- [Hootsuite — How the TikTok algorithm works in 2026](https://blog.hootsuite.com/tiktok-algorithm/)
- [eMarketer — TikTok's US overhaul gives advertisers greater certainty](https://www.emarketer.com/content/tiktok-s-us-overhaul-gives-advertisers-greater-certainty--though-questions-remain)
- [Forbes — This U30 kept launching apps until one worked (6 Mar 2026)](https://www.forbes.com/sites/zoyahasan/2026/03/06/this-u30-kept-launching-apps-until-one-worked-then-sold-it-to-myfitnesspal/)
