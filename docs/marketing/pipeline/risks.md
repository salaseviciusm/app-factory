# ToS, ban risk, and the account-safety rules the factory must follow

**Read this before writing a line of the pipeline.** The App Factory's structural
advantage — an agent pipeline that turns founder recordings into content fast — is also
the exact shape of the thing every platform's 2025–26 enforcement was built to suppress.
That is not a reason not to build it. It is a reason to be precise about which parts are
automated and which are not.

**The whole document in one table:**

| | Automate freely | Automate with a human gate | **Never automate** |
|---|---|---|---|
| | Trimming, cropping, captioning, aspect conversion, scheduling, analytics, transcription, drafting hooks | Publishing (founder approves the render), post copy (founder edits), what to post about | **Replies, comments, DMs, opinions, numbers we can't substantiate, engagement pods** |

---

## 1. The account-safety rules — non-negotiable, all platforms

These are the rules the factory follows regardless of what any individual platform's terms
say, because breaking them converts a reach problem into a ban problem.

1. **One real account per platform, on the founder's real device, real number, real IP.**
   No emulators, no proxy pools, no anti-detect browsers, no account farms.
2. **No multi-accounting per app.** The "multi-account distribution" strategy is unverified,
   is sold by companies selling multi-account tooling, and risks the real accounts to chase
   an unproven multiplier.
3. **Founder's real voice on everything on the primary accounts.** No synthetic narration.
4. **The founder watches every video before it ships.** Human Gate 2 is not optional and
   `run.auto` is never enabled on `content-cut`.
5. **Zero watermarks, ever.** Clean per-platform exports. Never re-upload a downloaded TikTok.
6. **No source clip in more than 3 published videos; never primary footage twice.**
   Enforced by the reuse ledger, not by memory.
7. **Never re-post an underperformer.** It is covered by the originality policies and it
   doesn't work anyway.
8. **Never buy engagement, join a pod, or enter an undisclosed equity-for-promotion deal.**
9. **Replies, comments and DMs are always the founder.** Agents draft; the founder sends.
10. **Ramp new accounts.** ~1 post/day for the first week, then to target cadence. This
    costs nothing and removes the only plausible version of the "new account" risk.

> **The single tell that we've gone wrong:** if someone proposes proxies, emulators,
> anti-detect browsers, or 10 accounts per app — stop. That is farm infrastructure, and
> adopting farm infrastructure means adopting farm risk.

---

## 2. Per-platform: what the terms actually say

### TikTok

**Automated posting is permitted through the official API — and gated.**

`[DOCUMENTED]` ([TikTok Content Posting API](https://developers.tiktok.com/doc/content-posting-api-get-started/)):
- *"All content posted by unaudited clients will be restricted to private viewing mode."*
- Direct posting requires the `video.publish` scope, which needs **both app approval and explicit user authorisation**.
- Lifting the private-only restriction requires passing an **audit** — demonstrating your integration follows TikTok's UX guidelines exactly: specific consent screens, disclosure that you are posting to TikTok, and correct handling of the draft-vs-direct-post choice `[ANECDOTAL — audit process detail from secondary sources]` ([PostPeer](https://www.postpeer.dev/blog/best-tiktok-posting-api), [TimeToPost](https://timetopost.co/blog/how-to-post-to-tiktok-api/)).
- **Inbox/draft upload needs no audit** — the video lands in the creator's drafts and a human publishes.

`[DOCUMENTED]` TikTok's Community Guidelines: *"We strictly prohibit automation tools,
scripts, or other tricks designed to bypass our systems. These can result in content
removal, account bans, or other enforcement."* The Terms of Service also prohibit using
*"generative AI-enabled features via any automated system or software, including automated
'bots,' unless otherwise authorized."*

**Read the position correctly:** TikTok is not anti-automation — it ships a first-party
scheduler, publishes a posting API, and offers native auto-reply messaging. **The objection
is to automation that reaches the service outside the sanctioned API surface, or that
fabricates engagement or identity** `[ANECDOTAL — synthesis]` ([openhosst](https://openhosst.com/blog/tiktok-automation)).

**The bigger TikTok risk is not the posting API — it is the originality policy.**
`[DOCUMENTED]` Enforcement escalated from **15 September 2025**, adding violation points,
monetisation freezes and reduced visibility on top of feed removal. Reported scope
explicitly includes **re-uploading your own old content**, and states that **filters,
overlays and minor edits do not make reused material original.** The user-facing message
is: *"not eligible for recommendation and restricted in search results because it may
contain unoriginal or reproduced content."*

> Note **"restricted in search results."** That silently kills the highest-leverage channel
> we have — the search-query inventory — with no ban notification and no appeal.

**Factory rules for TikTok:**
- **Publish via inbox/draft upload. Do not pursue the audit.** It is cheaper *and* safer, and the manual tap is a second look.
- Never post the same footage twice, never with new music as the only change, never as a "slide video."
- AI labelling: `[DOCUMENTED — labelling rules only]` AI-generated **captions, descriptions, hashtags, text overlays, script assistance and LLM-drafted hooks are exempt** from TikTok's AI labelling requirement; labelling is required for AI-generated *visuals and audio depicting realistic people or scenes*. Our pipeline never generates those, so **honest disclosure costs us nothing.**
- **Account-type trap:** Business accounts get an immediate bio link but are **restricted to the Commercial Music Library** and cannot use trending copyrighted tracks for promotional content (terms updated 25 July 2025). Founder voiceover as the default audio sidesteps this entirely.

### Instagram / Meta

**Automated posting is a supported, documented product.** `[DOCUMENTED]`
([Meta content publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing)):
Instagram professional account connected to a Facebook Page; permissions `instagram_basic`,
`instagram_content_publish`, `pages_read_engagement`; **100 API-published posts per rolling
24 hours**. No audit, no approval beyond standard app review for those permissions.

**The risk on Instagram is not automation — it is duplication and watermarks.**

`[DOCUMENTED]` ([Instagram: recommendations and originality](https://creators.instagram.com/blog/recommendations-and-originality), 30 Apr 2024, reaffirmed 30 Apr 2026):
- When Instagram finds *"two or more identical pieces of content,"* it will **"only recommend the original one."**
- Original content must have **"no visible watermarks"** to be recommendation-eligible.
- **Accounts that repeatedly (10 or more times in the last 30 days) post content from other Instagram users that they didn't create or enhance in a material way will not be shown in surfaces where we recommend content.** Extended from Reels to photos and carousels on 30 April 2026.
- *"Low-effort edits like watermarks or speed changes"* do not constitute original work.

`[DOCUMENTED]` Meta separately reduces distribution of *"problematic or low-quality...
including clickbait and engagement bait"* ([Transparency Center](https://transparency.meta.com/enforcement/taking-action/lowering-distribution-of-problematic-content/)).

**Factory rules for Instagram:**
- The watermark check in the render step is a **hard block**, not a warning. It guards a silent, total, un-notified reach kill.
- **Never publish the same rendered file to two accounts we control.** If an app has both a brand account and the founder account, they get different cuts — different hook, different length, different framing. Not a re-crop.
- We are structurally safe on the 10-per-30-days repost rule (our footage is original). **Do not let this drift** — reposting user testimonials, trend clips, or competitor content counts against it.
- **Check Account Status (Settings → Account Status) before ever concluding "we're shadowbanned."** Mosseri's stated position is that Instagram penalises some content but tells you about it. Green status plus zero reach means the content is the problem.
- **API Reels cap at 90 seconds** while the app allows 3 minutes — a capability limit, not a policy risk, but it will silently reject longer renders.

### YouTube

**Uploading via the Data API is fully supported.** No audit. `videos.insert` dropped from
~1,600 quota units to ~100 on 4 Dec 2025 and moved to a dedicated daily bucket of ~100
calls on 1 June 2026 `[ANECDOTAL — secondary reporting; verify in the Cloud console]`.

**The policy risk on YouTube is templating — repeating yourself.** `[DOCUMENTED]` YouTube
renamed "repetitious content" to **"inauthentic content"** on 15 July 2025 and on
16 July 2026 published three demonetisable categories:

1. **Generic, repetitive, or template-based content** — *"easily made with AI, CGI, or templates with minimal variation across videos,"* or *"easily replicable at scale."* Their examples: channels uploading narrative stories with only superficial differences; channels uploading slideshows that all share the same narration. Explicitly includes tutorials that reproduce already-prevalent platform content.
2. **Off-putting or distressing content** engineered to manipulate emotion for views.
3. **AI personas used to deceive**, particularly on finance, legal, healthcare or medical topics.

**What remains monetisable:** *"High-quality content enhanced by AI that demonstrates
creativity and originality."* **Enforcement: channels with excessive amounts of any
category lose YouTube Partner Program eligibility.**
([support.google.com](https://support.google.com/youtube/answer/1311392?hl=en), [TechCrunch](https://techcrunch.com/2026/07/20/youtube-clarifies-policies-around-ai-slop-and-upsetting-videos/))

> **AI *assistance* is explicitly fine. AI-driven *sameness* is not.** The distinguishing
> test YouTube gives us is "narrative arc." Thirty videos each saying *"here's a feature of
> our app"* have no arc and differ only superficially. Thirty videos each answering a
> different question a real user asked have thirty different arcs and happen to share an
> editing style.
>
> **The defence is not the tooling. It is the brief.**

**Factory rules for YouTube:**
- The reviewer's "distinct premise, not the previous video with one variable swapped" and "has a narrative arc" checks are the direct mitigations. They are hard blocks.
- Never let an AI persona present as a person — especially on anything touching finance, legal, health or medical.
- **Track YPP standing monthly as a quality alarm, not an income line.** We are not monetising the channel (138k subscribers producing $215/month is the documented reality). Losing YPP eligibility to the inauthentic-content policy is the clearest possible external verdict that our pipeline has drifted into slop.

### X / Twitter

**Programmatic posting is supported and now metered.** As of **6 February 2026** X replaced
tiered pricing with **pay-per-use as the default**; new developers cannot sign up for Basic
or Pro, and there is no free tier. **$0.015 per post created, $0.20 if it contains a URL**
`[ANECDOTAL — multiple independent trackers agree]`.

**The real risk on X is the objective function, not the terms.** From the released 2023
weights and the current 2026 `weighted_scorer.rs`: **hide/block/mute = −74, report = −369**,
against **like = +0.5**. `not_interested`, `block_author`, `mute_author` and `report` remain
explicitly modelled negative actions.

> The asymmetry is the whole point. **A single "not interested" costs more than dozens of
> likes gained.** Engagement bait that provokes one mute per hundred impressions is *net
> negative*, not merely inefficient. **There is no version of high-volume, low-quality
> posting that is safe under this objective function.**

**Factory rules for X:** post only when something real happened; 2–3/week; link in a reply,
not the post; every reply written by the founder.

### LinkedIn

**Posting automation is not available to us.** All API access requires LinkedIn Partner
Program approval; partner tier is negotiated and enterprise-priced `[ANECDOTAL — consistent
across sources]`.

**And LinkedIn is actively hunting exactly our shape.** `[DOCUMENTED]`
([The Register, 30 Jul 2026](https://www.theregister.com/ai-and-ml/2026/07/30/linkedin_realizes_its_users_have/5281436)):
- Originality.ai found **81.2% of 5,000 public LinkedIn posts of 100+ words were likely AI-generated** (up from ~50% in late 2024).
- LinkedIn shipped a **"Seems like AI slop"** report control in the post ellipsis menu on 30 July 2026 — one click, hides the post, feeds the feed model.
- It **replaced** its AI post rewriter with an AI *proofreader* that preserves the author's voice — a product-level reversal.
- CPO Hari Srinivasan: LinkedIn catches **"hundreds of thousands of automated comment attempts"** daily and has **"blocked billions of other automation attempts."**
- VP of Product on engagement pods: *"Our goal is to make engagement pods entirely ineffective... we are increasingly flagging any artificially boosted content internally, and then also, we are limiting the reach of this content."*

**Factory rule for LinkedIn: manual, first person, founder-edited. The pipeline drafts;
the founder rewrites and posts.** An unedited LLM post is detectable by a reader and, since
July 2026, reportable in one click.

### Reddit

**Free API tier is non-commercial-use only** — monetising an application built on free-tier
access violates the terms. Self-service registration is closed; new OAuth tokens need
manual approval on a 2–4 week timeline. Commercial tier is **$0.24/1K calls with a
$12,000/year minimum** `[ANECDOTAL]`.

Separately, subreddit moderation is the strictest enforcement layer in this whole document,
and it is human.

**Factory rule for Reddit: never automated, at any scale, for any reason.** Manual
participation only, respecting each subreddit's self-promo ratio.

---

## 3. AI disclosure — where we stand

We are unusually well-placed here, and should say so plainly rather than hedging.

| What we do | Disclosure needed? |
|---|---|
| Founder's real screen recording, real voice, real hands | No — this is original human footage |
| Agent trims silence, crops, burns captions | **No** — TikTok's labelling rules cover AI-generated *visuals and audio depicting realistic people or scenes*, not editing craft |
| LLM drafts a hook the founder then says out loud | **No** — script assistance is exempt |
| LLM writes the caption, hashtags, on-screen text | **No** — explicitly exempt |
| Generated voice, faces, scenes, or b-roll implying real events | **Would require labelling — and we never do it** |

`[DOCUMENTED — labelling rules only, not a reach guarantee]` ([Storrito summary of TikTok's
2026 rules](https://storrito.com/resources/tiktoks-2026-ai-labeling-rules-and-what-they-signal-for-platform-governance/)) —
secondary source; verify against TikTok's own policy page before relying on it commercially.

**Also note what platforms are building regardless of policy:** TikTok integrated C2PA
Content Credentials in Jan 2025 and has **labelled 1.3B+ videos**; it adds **invisible
watermarks to content made with its own AI tools that survive re-encoding and re-upload**;
and it is testing a **"Manage topics" control letting users choose how much AI-generated
content appears in their For You feed** `[DOCUMENTED — TikTok Newsroom, 19 Nov 2025]`.

> Whether AI content is *algorithmically* demoted is disputed and doesn't matter.
> **TikTok is handing users a dial to see less of it.** Our moat is that our raw material
> is genuine screen recordings of software that really exists, narrated by the person who
> built it — which is not slop and cannot be mistaken for it, **unless we launder it
> through an AI editing layer until it looks like everything else.**

---

## 4. Account warm-up: mostly folklore, with one real mechanic

The "warm-up" doctrine (browse/like/follow as a normal user for 7–10 days before your first
post) is `[ANECDOTAL]` and **the sources are the problem**: essentially every warm-up guide
comes from the multi-accounting / anti-detect-browser / account-farming industry
(Multilogin, GeeLark, cloaking.house, VPN vendors). Their advice is calibrated to a problem
we do not have, and it is advertising.

**No platform documents a warm-up requirement.** Neither TikTok nor Meta publishes a trust
score or new-account reach penalty, and YouTube's performance FAQ states directly:
*"No, we've done analyses over the years and found that growth in views across uploads is
not correlated with time between uploads."*

**What is real and gets mistaken for warm-up:** Instagram documents that its ranking system
*"shows eligible content to small audiences first, expanding reach based on engagement."*
That is how *every* post is distributed, including from million-follower accounts. A new
account looks throttled because it has no interaction history for the interest graph to
match against. **The fix is not waiting. The fix is posting content with a legible topic so
the interest graph can place you fast.**

**What is probably true underneath the folklore:** the fraud signals platforms plausibly
care about are **device / IP / behaviour fingerprints**, not account age. A single founder
on a single phone posting real footage looks nothing like a farm.

**Factory policy:** complete the profile fully before posting daily; post 3–5 unambiguously
on-topic pieces before expecting anything; ramp ~1/day for the first week then to target.
That's it. It costs nothing and removes the only plausible version of the risk.

---

## 5. Operational risks specific to *our* pipeline

Ranked by how much damage they do.

| # | Risk | Why it's plausible here | Mitigation, and where it lives |
|---|---|---|---|
| 1 | **Silent originality strike on TikTok** | Reuse creeps up when footage runs short at the end of a week. TikTok tells you via a search-restriction notice you have to go looking for | Reuse ledger enforced at **render** (hard fail); weekly report surfaces ledger status; the "something broke" and comment-reply mandatory slots keep original footage flowing |
| 2 | **Watermark leaks in** | A free-tier tool gets used "just this once" — Submagic free, CapCut export, a stock clip | Render-step watermark scan is a **hard block**. Free tiers of captioning tools are banned by policy, not by intent |
| 3 | **YouTube category-1 templating** | The single most likely failure mode of *any* agent pipeline. Format-correct, substance-empty, thirty videos with one variable swapped | Reviewer's distinct-premise and narrative-arc checks; the **novelty penalty** in the idea bank (`feedback-loop.md` §5); 30% exploration budget; YPP monitored monthly |
| 4 | **Human Gate 2 gets disabled** | `run.auto` exists in the engine and will be tempting on a busy week | Documented as non-negotiable in `design.md` §3. **Consider making `content-cut` reject `--auto` in code**, not just in prose |
| 5 | **An agent replies to a comment** | The single highest-consequence line to cross: LinkedIn blocks automated comments at the API layer; X weights `report` at −369; TikTok comments are the install funnel | The pipeline has **no write access to comment or DM endpoints**. Enforce at the credential scope, not in a prompt |
| 6 | **A number nobody can substantiate ships in a caption** | LLMs generate plausible specifics. Marc Lou's highest-earning product in Jan 2026 is **TrustMRR** — a service that exists to verify founders' revenue screenshots are real. That tells you what the median reader now assumes | Reviewer hard-blocks unverifiable numbers; **no MRR screenshots, ever** |
| 7 | **Postiz outage stalls the queue** | We self-host it to save $29/mo | Queue state is recoverable; a missed day is not an incident. Upgrade trigger to Blotato is documented in `tooling.md` §5.2 |
| 8 | **Token/credential leak** | OAuth tokens for 4 platforms sitting on one machine | Store outside the repo; never in `~/factory-media`; never passed into an agent prompt. Rotate on any exposure |
| 9 | **Founder burnout on recording** | 40 min/week sounds small until week 9 | The brief exists to make recording a 40-minute task with no thinking attached. If sessions start getting skipped, that is a **design signal**, not a discipline problem — cut the shot count |

---

## 6. What we would do if enforcement hits anyway

| Event | Response |
|---|---|
| TikTok search-restriction notice | Stop publishing for 48h. Audit the ledger. Cut to 1 source clip per video and 1 post/day for two weeks. Do **not** create a new account |
| Instagram Account Status non-green | Read the specific reason. Do not guess. Fix the named issue; stop posting to that account until green |
| YPP eligibility lost | Treat as the loudest possible slop alarm. Stop the pipeline. Re-read YouTube's three categories against the last 30 uploads with the founder |
| Any account actioned or banned | **Do not create a replacement account on new infrastructure.** Appeal through the platform's process. Creating a circumvention account is the step that turns a recoverable penalty into a permanent one |
| A competitor or user accuses us of AI slop publicly | Answer honestly, in the founder's voice, with specifics: agents edit, the founder films and speaks, here's the raw take. Never delete criticism |

---

## Sources

- [TikTok — Content Posting API: Get Started](https://developers.tiktok.com/doc/content-posting-api-get-started/) · [For You feed Eligibility Standards](https://www.tiktok.com/community-guidelines/en/fyf-standards) · [Originality policy](https://www.tiktok.com/creator-academy/article/tiktok-originality-policy) · [Newsroom: AI content (19 Nov 2025)](https://newsroom.tiktok.com/more-ways-to-spot-shape-and-understand-ai-content?lang=en) · [Terms of Service](https://www.tiktok.com/legal/page/us/terms-of-service/en)
- [Meta — Instagram Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing) · [Recommendations and originality](https://creators.instagram.com/blog/recommendations-and-originality) · [Account Status](https://help.instagram.com/338481628002750) · [Lowering distribution of problematic content](https://transparency.meta.com/enforcement/taking-action/lowering-distribution-of-problematic-content/)
- [YouTube — Inauthentic content policy](https://support.google.com/youtube/answer/1311392?hl=en) · [Performance FAQ](https://support.google.com/youtube/answer/141805?hl=en) · [YPP requirements](https://support.google.com/youtube/answer/72851?hl=en) · [TechCrunch, 20 Jul 2026](https://techcrunch.com/2026/07/20/youtube-clarifies-policies-around-ai-slop-and-upsetting-videos/)
- [The Register — LinkedIn's AI slop controls, 30 Jul 2026](https://www.theregister.com/ai-and-ml/2026/07/30/linkedin_realizes_its_users_have/5281436) · [SocialMediaToday — LinkedIn on engagement pods](https://www.socialmediatoday.com/news/linkedin-vows-to-take-action-against-engagement-pods-fake-engagement/804970/)
- [x-algorithm — weighted_scorer.rs](https://github.com/xai-org/x-algorithm/blob/main/home-mixer/scorers/weighted_scorer.rs) · [awesome-twitter-algo](https://github.com/igorbrigadir/awesome-twitter-algo)
- [Postiz — Reddit API limits, rules and posting restrictions](https://postiz.com/blog/reddit-api-limits-rules-and-posting-restrictions-explained)
- [PostPeer — TikTok Content Posting API in 2026](https://www.postpeer.dev/blog/best-tiktok-posting-api) · [openhosst — TikTok automation: what's allowed](https://openhosst.com/blog/tiktok-automation)
- [Storrito — TikTok's 2026 AI labelling rules](https://storrito.com/resources/tiktoks-2026-ai-labeling-rules-and-what-they-signal-for-platform-governance/)
- Internal: `../platforms/tiktok/credibility.md` · `../platforms/instagram/credibility.md` · `../platforms/youtube/credibility.md` · `../platforms/x-linkedin/credibility.md`
