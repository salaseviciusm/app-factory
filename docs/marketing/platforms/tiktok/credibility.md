# Credibility on TikTok — Posting at Volume Without Reading as Spam

**Scope:** TikTok only. This is the operational risk doc for an AI-assisted content pipeline. Read alongside `algorithm.md` §5 (what suppresses reach).

**The problem in one sentence:** App Factory's structural advantage — an agent pipeline that can turn one founder screen-recording into a lot of content, fast — is also the exact shape of the thing TikTok's 2025–26 enforcement was built to suppress.

---

## 1. The two hard constraints, both documented

### Constraint 1 — Originality enforcement

TikTok's **For You feed Eligibility Standards** make content ineligible for the FYP when it is:
- **Unoriginal** — *"copied from others or has minimal original input or edits"*
- **Low quality** — *"includes split screens, meaningless reactions, low-quality images, or slide videos"*
- **Clickbait** — *"lacks meaningful value and is primarily designed to attract followers, likes, or advertisement clicks"*

— [TikTok Community Guidelines: For You feed Eligibility Standards](https://www.tiktok.com/community-guidelines/en/fyf-standards) `[DOCUMENTED]`

TikTok **escalated enforcement from 15 September 2025**, adding violation points, monetisation freezes and reduced visibility on top of feed removal. Reported scope explicitly includes **re-uploading your own old content**, and states that **filters, overlays and minor edits do not make reused material original**. — [TikTok Creator Academy: Originality policy](https://www.tiktok.com/creator-academy/article/tiktok-originality-policy); enforcement date via [BigSeller](https://www.bigseller.com/blog/articleDetails/3778/tiktok-unoriginal-content.htm) `[DOCUMENTED policy, secondary date]`

The enforcement message users see is: *"not eligible for recommendation and restricted in search results because it may contain unoriginal or reproduced content."* **Note "restricted in search results"** — this kills the highest-leverage channel in `algorithm.md` §6, silently, with no ban notification.

**What this rules out for us, unambiguously:**
- Same screen recording, N different music tracks/captions → **unoriginal**
- Text-over-stock-footage with a synthetic voice → **low quality**
- Static slide decks exported as video → TikTok names *"slide videos"* by name
- Re-posting a video that underperformed → **unoriginal** (re-uploading your own content counts)

### Constraint 2 — AI content is being made visible and optional

`[DOCUMENTED]` — [TikTok Newsroom, 19 Nov 2025](https://newsroom.tiktok.com/more-ways-to-spot-shape-and-understand-ai-content?lang=en):
- C2PA Content Credentials integrated since **Jan 2025**; **1.3B+ videos labelled** to date
- **Invisible watermarks** added to content made with TikTok's own AI tools — and these **survive re-encoding and re-upload**
- TikTok is testing a **"Manage topics" control letting users choose how much AI-generated content appears in their For You feed**

Whether AIGC is *algorithmically* demoted is `[ANECDOTAL]` and disputed. **It doesn't matter.** TikTok is handing users a dial to see less of it, and a Kapwing analysis reported **59% of videos served to new TikTok accounts were AI slop vs 21% on YouTube Shorts** ([Tech Times, Jul 2026](https://www.techtimes.com/articles/320282/20260713/tiktok-has-labeled-3-billion-ai-videos-here-what-research-says-they-miss.htm), `[ANECDOTAL — methodology unverified]`). The audience is saturated and the platform is arming them.

**Our actual moat, and we should be deliberate about protecting it:** our raw material is **genuine screen recordings of software that really exists, narrated by the person who built it.** That is not AI slop and cannot be mistaken for it — *unless we launder it through an AI editing layer until it looks like everything else.*

---

## 2. What makes indie app content read as authentic vs. AI slop

TikTok's own advertising guidance is unusually blunt about this, and it applies doubly to organic:

> *"DIY or not overly polished style so that it fits in with the user-generated content on TikTok."* Feature **real people** — creators, employees, customers — rather than polished corporate content.
> — [TikTok Ads Help: Creative best practices](https://ads.tiktok.com/help/article/creative-best-practices) `[DOCUMENTED]`

### The authenticity checklist

| Reads as authentic | Reads as slop |
|---|---|
| A real human voice with hesitations, an accent, a room tone | ElevenLabs-standard synthetic narration |
| Hands visible on a real phone, real reflections, imperfect framing | Floating device mockup on a gradient |
| Naming a genuine limitation ("it doesn't do X yet") | Only benefits, no tradeoffs |
| Screen recording at real speed, including a loading spinner | Speed-ramped, zoom-punched, every frame "optimised" |
| Talking about the specific person you built it for | "Are you struggling with productivity?" |
| Showing a bug, a bad review, a rejection | A flawless narrative |
| One idea per video | Five features crammed in 20 seconds |
| Text that sounds spoken | Text that sounds like a landing page |

### The three signals that most reliably mark slop

1. **A stock synthetic voice.** The single fastest classifier a viewer runs. Founder voiceover is non-negotiable for our primary account — and it's also required for the search play (`algorithm.md` §6) and sidesteps the Commercial Music Library trap (`algorithm.md` §7). One decision, four benefits.
2. **Zero specificity.** Slop is generic because generation is cheap and specifics are expensive. "I built this because I kept forgetting to take my meds at 6pm and my partner was sick of reminding me" cannot be generated — it can only be reported. **Specificity is the cheapest anti-slop signal we have and the founder is the only source of it.**
3. **Format-perfect, substance-empty.** Correct hook, correct pacing, correct caption, nothing learned. This is where an agent pipeline fails most often: agents are very good at format and have nothing to say.

### Where AI belongs in our pipeline — and where it doesn't

**Explicitly exempt from TikTok's AI labelling requirements** `[DOCUMENTED — labelling rules only, not a reach guarantee]`: AI-generated captions, descriptions, suggested hashtags, text overlays, script assistance, and hooks written by an LLM. Labelling is required for *AI-generated visuals and audio depicting realistic people or scenes*. ([Storrito summary of 2026 rules](https://storrito.com/resources/tiktoks-2026-ai-labeling-rules-and-what-they-signal-for-platform-governance/), [Cinerads](https://www.cinerads.com/blog/tiktok-ai-content-policy) — secondary; verify against TikTok's policy page before relying on it commercially.)

| Agents SHOULD do | Agents SHOULD NOT do |
|---|---|
| Cut and trim founder footage | Generate the voice |
| Draft hook variants for the founder to say | Generate faces, people, or scenes |
| Write captions and search-optimised on-screen text | Produce b-roll that implies real events |
| Pick which raw take is strongest | Re-cut the same clip into 20 "different" videos |
| Draft comment replies for founder review | Auto-post comment replies unreviewed |
| Track which query each video targets | Invent user testimonials or reviews |
| Flag when footage has been reused too often | Publish anything the founder hasn't watched |

**The pipeline rule that follows from all of this:** *AI does the editing, the founder does the saying.* Volume comes from **more raw footage**, not from more permutations of the same footage. That single rule keeps us on the right side of the originality policy, the AI-labelling policy, and the audience's slop detector simultaneously.

---

## 3. Account warm-up — folklore, with a caveat worth respecting

The "warm-up" doctrine (browse/like/follow as a normal user for 7–10 days before your first post, or you'll be flagged as a bot) is `[ANECDOTAL]`.

**Check the sources before believing it.** Essentially every warm-up guide comes from the **multi-accounting / anti-detect-browser / account-farming industry**: [Multilogin](https://multilogin.com/blog/how-to-warm-up-tiktok-account/), [GeeLark](https://www.geelark.com/blog/how-to-warm-up-your-tiktok-accounts/), [cloaking.house](https://cloaking.house/blogs/article/how-to-warm-up-your-tiktok-accounts-to-avoid-a-shadow-ban-in-2026?hl=en), [VPN To US](https://vpntous.com/guides/tiktok-warmup). These vendors sell tools for running many accounts from one machine. Their advice is **calibrated to a problem we don't have** — and it's advertising.

TikTok has never documented a warm-up requirement or a trust score. Locket's founder posted a UI walkthrough on a brand-new company account and got ~100,000 views in days (`case-studies.md` #4).

**What is probably true underneath the folklore:** the fraud signals TikTok plausibly cares about are **device/IP/behaviour fingerprints**, not account age. A single founder on a single phone posting real footage looks nothing like a farm.

**Our policy:**
- **One real account per app, on the founder's real device, real number, real IP.** No emulators, no proxies, no anti-detect browsers. The moment we adopt farm infrastructure we adopt farm risk.
- Fill in the profile — photo, bio, one pinned post — before posting daily.
- Don't post 15 videos on day one. Ramp: ~1/day for the first week, then to 2–3/day. This costs nothing and removes the only plausible version of the risk.
- **Do not run multiple accounts per app.** The "multi-account distribution" strategy pushed by [TokPortal](https://www.tokportal.com/use-cases/app-downloads-tiktok-organic-0-to-50k) and similar vendors is unverified, is sold by companies selling multi-account tooling, and puts our real accounts at risk to chase an unproven multiplier.

---

## 4. Creator account vs. brand account

| | **Founder personal/creator account** | **App brand account** | **Paid micro-creators** |
|---|---|---|---|
| Bio link | needs 1,000 followers | immediate (Business) | their own |
| Trending sounds | full library | **CML only** if Business | full library |
| Trust | highest | lowest | high (borrowed) |
| Originality risk | lowest | highest | lowest |
| Cost | founder time | founder time | $50–$4,000/campaign |
| Portability across apps | **yes** | no | no |

`[DOCUMENTED]` on the mechanics: business accounts get an immediate bio link but are restricted to the Commercial Music Library and cannot use trending copyrighted tracks for promotional content; TikTok updated its Music and CML terms on **25 July 2025** ([Foxi](https://www.foximusic.com/blog/commercial-music-licensing-tiktok-guide/), [Status](https://brands.joinstatus.com/tiktok-commerical-music-library)).

**Recommended structure for App Factory:**

1. **Primary: one founder account, all apps.** *"I build small apps. Here's what I'm working on."* This is Adam Lyttle's "become your own influencer" model (`case-studies.md` #5) and it's the only asset that **compounds across the portfolio** — every app after the first launches to an existing audience instead of from zero. Given Socialinsider's finding that small-account average views fell ~59% YoY in 2025, starting from zero repeatedly is the expensive mistake.
2. **Secondary: one brand account per app**, mirroring only the app-specific demo and search-query content. Lower expectations. It exists so the app has a findable presence, not as a growth engine.
3. **Opportunistic: $50 micro-creator bets.** Blake Anderson's two-$50-creators → 200,000 downloads in a week is the highest-ROI documented tactic in this entire research set, and it's affordable *now*. Requirements: creator must already talk about the problem, must use their own voice and framing, must show the app on screen, and the deal must include **usage rights** so a winner can be boosted via Spark Ads (Quittr's structure).

**Do not** run "faceless" accounts. Consensus across sources is that TikTok doesn't ban faceless content per se, but the format is **strongly associated with mass-produced low-effort commercial spam** and draws enforcement accordingly ([FameViso](https://fameviso.com/blog/tiktok-shop-affiliate-faceless-reviewer-ban-guide/)) `[ANECDOTAL]`. We have a real founder. Using him is free and it's the differentiator.

---

## 5. Engagement practice

### Comments are the install funnel, not a vanity metric

Organic TikTok has **no clickable link in the video.** The comment section is the only in-frame path to the App Store. The Playkit writeup reports conversions happening *primarily in comments*, where creators answer "what's it called?" as peers rather than pitching ([The Playbook by Suzanna](https://theplaybookbysuzanna.substack.com/p/how-150-creators-and-600-tiktoks)) `[ANECDOTAL — agency self-reported, but mechanically forced by the platform]`.

**Rules:**
- **Answer every comment in the first 2 hours after posting**, then daily.
- Answer the *question asked*, in one line. "Yeah, it works offline" beats a paragraph.
- **Pin one comment with the app name spelled out.** Not a link — organic captions aren't clickable — just the exact App Store search string.
- Answer hostile comments honestly. "Fair — it's £2.99/mo, here's what that pays for" outperforms deleting.
- Never delete criticism unless it violates guidelines. Deleted-criticism accounts get noticed and screenshotted.

### Comment-baiting done well vs. badly

| Works | Backfires |
|---|---|
| Ending on a **real** open question you'll actually answer ("what should it track next?") | "Comment 'LINK' and I'll DM you" — reads as engagement farming, edges toward the clickbait FYF category |
| Showing a **deliberate imperfection** people can correct — the strongest natural comment driver on TikTok | Fake mistakes that get exposed as staged |
| Asking for the use case: "what would you use this for?" | "Tag 3 friends" |
| Genuinely admitting you don't know something | Rage-bait about competitors |

**Calibration:** Socialinsider found comments grew only **+3% YoY** across 2M videos while **shares grew +13% overall and +44% for large accounts** ([2026 TikTok Benchmarks](https://www.socialinsider.io/social-media-benchmarks/tiktok)). Comments are getting *harder* to earn while shares are getting easier. **Optimise for shareability first, comments second.** For app demos, the shareable moment is "this solves a problem my friend has" — which is a product-clarity property, not a caption trick.

### Comment reply videos

Replying to a comment **with a video** creates a new post carrying the comment as an on-screen sticker `[DOCUMENTED feature]`. This is the highest-value credibility mechanic available to us because it is simultaneously:
- **Unambiguously original** — it cannot be a repost of anything
- **Self-hooking** — the comment sticker supplies context in frame 1
- **Evidence of a real human** running the account
- **Free content** derived from real user demand rather than invented angles

**Make it a standing pipeline rule: at least one video per day is a reply to a real comment.** It solves the volume problem and the originality problem at the same time.

---

## 6. The volume-without-spam protocol

1. **Volume comes from raw footage, not permutations.** Target: one founder recording session per week producing 8–15 *distinct* raw clips (different features, different bugs, different questions answered), not one clip cut 15 ways.
2. **Cap reuse.** No source clip appears in more than **3** published videos, and never as the primary footage twice. Track this in the pipeline; it's the single most enforceable guard against the originality policy.
3. **Founder voiceover on everything on the primary account.** No synthetic voices.
4. **Founder watches every video before it ships.** If an agent-assembled video can't survive 20 seconds of the founder's attention, it won't survive a viewer's 2.
5. **Ship at 2–3/day per account after a one-week ramp.** Inside TikTok's own 1–4/day guidance ([Creator Academy](https://www.tiktok.com/creator-academy/en/article/posting-cadence-best-practices-publishers)) and inside Buffer's high-gain band.
6. **One video per day is a real comment reply.**
7. **Zero watermarks, ever.** Clean export per platform; never re-upload a downloaded TikTok.
8. **Never re-post an underperformer.** It's covered by the originality policy and it doesn't work.
9. **Disclose AI where the rules require it** — and note that captions, hashtags, text overlays and LLM-drafted hooks are exempt, so honest disclosure costs us nothing on our actual pipeline.
10. **Instrument the whole funnel**, weekly: views → profile visits → link clicks → **App Store impressions → store conversion rate** → installs → D7 retention. LifePilot lost its launch to a store-page language bug it couldn't see, and Poparazzi burned $15M on a retention number acquisition had disguised (`case-studies.md` F2, F3).

**The single diagnostic that matters most:** track **installs per 1,000 views** per content format, not views. A video with 12,000 views and 80 installs beats one with 400,000 views and 10 — and the second one is a *worse* outcome than the first, because it burned our shot at the audience on a message that doesn't convert.

---

## 7. Red flags — stop and reassess if any of these appear

- Videos start getting *"restricted in search results"* notices → originality budget exceeded; cut reuse to 1 clip per video immediately
- Comments per 1,000 views trending toward zero → content is format-correct and substance-empty
- We're posting more and installs-per-1,000-views is falling → we're generating slop, not content
- Someone proposes proxies, emulators, anti-detect browsers, or 10 accounts per app → stop; that's farm infrastructure and it converts a reach problem into a ban problem
- We're tempted by fake urgency, ambiguous weekly subs, or under-18 targeting because the numbers are good → re-read the NGL case (`case-studies.md` F5). $5M and a business-model ban.

---

## Sources

- [TikTok Community Guidelines — For You feed Eligibility Standards](https://www.tiktok.com/community-guidelines/en/fyf-standards)
- [TikTok Creator Academy — Originality policy](https://www.tiktok.com/creator-academy/article/tiktok-originality-policy)
- [TikTok Creator Academy — Posting cadence best practices](https://www.tiktok.com/creator-academy/en/article/posting-cadence-best-practices-publishers)
- [TikTok Ads Help — Creative best practices](https://ads.tiktok.com/help/article/creative-best-practices)
- [TikTok Newsroom — More ways to spot, shape and understand AI-generated content (19 Nov 2025)](https://newsroom.tiktok.com/more-ways-to-spot-shape-and-understand-ai-content?lang=en)
- [Socialinsider — 2026 TikTok Benchmarks](https://www.socialinsider.io/social-media-benchmarks/tiktok)
- [Buffer — How often should you post on TikTok (11.4M posts)](https://buffer.com/resources/how-often-should-you-post-on-tiktok/)
- [The Playbook by Suzanna — 150+ creators, 600 TikToks/month](https://theplaybookbysuzanna.substack.com/p/how-150-creators-and-600-tiktoks)
- [BigSeller — TikTok unoriginal content enforcement, 15 Sep 2025](https://www.bigseller.com/blog/articleDetails/3778/tiktok-unoriginal-content.htm)
- Warm-up folklore (cited as vendor-biased, not endorsed): [Multilogin](https://multilogin.com/blog/how-to-warm-up-tiktok-account/) · [GeeLark](https://www.geelark.com/blog/how-to-warm-up-your-tiktok-accounts/)
