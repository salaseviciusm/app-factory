# Credibility: Not Reading As Slop, and What Real Engagement Costs

**Research date:** August 2026. Companion to `algorithm.md`, `audience.md`, `case-studies.md`.

This document matters more to us than to most studios, because our production model — founder supplies raw demos, AI agents edit them into content — is *exactly* the model that both platforms are now actively penalising. That's not a reason not to do it. It is a reason to be precise about which parts of the pipeline can be automated and which parts cannot.

---

## 1. The environment we'd be posting into

### LinkedIn is 81% AI-written and the platform has started fighting back

- **Originality.ai, July 2026:** of 5,000 public LinkedIn posts of 100+ words, **81.2% (4,061) classified as likely AI-generated.** The same methodology found ~50% in late 2024. — https://originality.ai/blog/ai-content-published-linkedin
- **LinkedIn's response, 30 July 2026:** shipped a **"Seems like AI slop"** reporting control in the post ellipsis menu, alongside "Not interested" and "Report." Selecting it hides the post and feeds the feed model.
- LinkedIn also **replaced** its "enhance your post" AI rewriter with an AI *proofreader* that preserves the author's voice — an explicit product-level reversal.
- **CPO Hari Srinivasan:** *"AI slop is a top priority for all of us. We really care about this."* He said LinkedIn catches **"hundreds of thousands of automated comment attempts"** daily and has **"blocked billions of other automation attempts"** in recent months.

Source: https://www.theregister.com/ai-and-ml/2026/07/30/linkedin_realizes_its_users_have/5281436

- **VP of Product Gyanda Sachdeva, on engagement pods:** *"Our goal is to make engagement pods entirely ineffective. We are increasing the number of ways we detect these pods… we are increasingly flagging any artificially boosted content internally, and then also, we are limiting the reach of this content."* — https://www.socialmediatoday.com/news/linkedin-vows-to-take-action-against-engagement-pods-fake-engagement/804970/

**Read the sequence:** the company that spent 2023–2024 shipping AI writing tools spent 2026 shipping AI-detection tools, a slop report button, and a pod crackdown. And Microsoft quietly dropped "record levels of engagement" from its Q1 FY2026 language for the first time since 2018 (https://www.socialmediatoday.com/news/linkedin-reports-increase-in-post-comments-video-posts-microsoft-q1-2026/804353/). LinkedIn believes it has a quality problem and is willing to cost itself engagement to fix it.

### X punishes negative reactions harder than it rewards positive ones

From the 2023 released weights: **hide/block/mute = −74**, **report = −369**, against **like = +0.5**. — https://github.com/igorbrigadir/awesome-twitter-algo

The current 2026 scorer keeps `not_interested`, `block_author`, `mute_author`, and `report` as explicitly modelled negative actions in the same weighted sum. — https://github.com/xai-org/x-algorithm/blob/main/home-mixer/scorers/weighted_scorer.rs

**The asymmetry is the whole point.** On X, a post that reads as slop doesn't just underperform — a single "not interested" costs you more than dozens of likes gained. Engagement-bait that provokes one mute per hundred impressions is *net negative* for the account, not merely inefficient. There is no version of high-volume, low-quality posting that is safe under this objective function.

### Trust in the build-in-public genre has visibly collapsed

The clearest evidence: **Marc Lou's single highest-earning product in Jan 2026 is TrustMRR ($31.4K/mo)** — a service whose entire purpose is *verifying that founders' revenue screenshots are real.* — https://indieai.directory/blog/marc-lou-81683-february-2026-income-breakdown/

A market exists, at scale, for proving that MRR screenshots aren't fake. That tells you what the median reader now assumes about MRR screenshots.

Second piece of evidence: Tweet Hunter and Taplio — the two biggest "organic growth" tools — grew by **giving influencers 25–30% of the equity** to promote them. (https://joinhampton.com/blog/thibault-tibo-sold-8m-regrets-indie-hacker-portfolio). A meaningful fraction of what looks like organic build-in-public enthusiasm is compensated.

---

## 2. Founder face vs brand account

**Verdict: founder face, unambiguously, on both platforms. The studio account is a secondary artifact.**

**The mechanical argument (documented):**
- LinkedIn's ranking model (LiRank, Feed SR) is a person-to-person social-graph model. Company-page content reaches followers; personal content propagates through the graph. — https://arxiv.org/abs/2402.06859
- X's July 2026 reply reweighting explicitly privileges **mutuals** — reciprocal human follows. A brand account accumulates one-way followers and therefore loses reply visibility under the new weighting. — https://techcrunch.com/2026/07/13/x-just-tweaked-its-algorithm-to-make-it-more-friendly-less-battleground/
- X's 2023 top-weighted action was **the author replying to a reply (+75)**. A brand account replying "Thanks for the feedback! 🙌" earns the weight and loses the reader. A person replying earns both.
- LinkedIn's newsletter mechanic — push + in-app + email to every subscriber, auto-invites sent to new followers, subscribing implies following — is attached to **a member**, and every subscriber also becomes a follower of that person. — https://www.linkedin.com/help/linkedin/answer/a522525

**The vendor argument (weaker, directionally consistent):** personal profiles are reported at 2.75× impressions and 5× engagement vs company pages despite 46% fewer followers; some sources claim 8×. All of these trace to marketing vendors, none to LinkedIn. Believe the direction, not the multiple.

**The credibility argument (the real one):** the entire genre we'd be entering has a trust deficit. A brand account posting "we shipped v2.1 🚀" carries zero of the one asset that still works — a specific person who can be wrong, who can be asked a question, and who answers.

**Practical structure for the App Factory:**
- **Primary:** the founder's personal account on X, the founder's personal profile on LinkedIn. First person. Named. Face visible.
- **Secondary:** a studio account that reposts, holds the changelog, handles support, and exists so the brand name is claimed. Expect ~5% of the reach. Do not invest in it.
- **Per-app accounts:** only for an app that has a real community inside a fandom (see `audience.md` §3). Otherwise no — each one is a separate cold-start problem and a separate account to fail to maintain.
- **Never:** a "team" account that writes in first person plural about its feelings.

---

## 3. How much can be automated before it shows

Our pipeline is: founder records raw demos → agents edit into content. Here is the honest line.

### Safe to automate fully — no credibility cost
| Task | Why it's safe |
|---|---|
| Video trimming, cropping, captioning, aspect-ratio conversion | Nobody has ever detected "AI edited this footage." Craft, not voice. |
| Screenshot cleanup, mockups, thumbnails, carousel layout from supplied content | Same. LinkedIn documents are a top format (7.00% engagement) and are a design task. |
| Scheduling and posting | Mechanical. |
| Cutting one demo into 4–6 platform-specific variants | Reformatting, not authoring. |
| Drafting an *outline* or 3 alternative hooks from the founder's own words | Founder still picks and rewrites. |
| Analytics, reporting, tracking which posts got replies worth answering | Pure ops. |
| Transcribing the founder's voice notes into a first draft | The ideas and phrasing are his. This is the single highest-leverage automation we have. |

### Automate with a hard human gate — visible if done badly
| Task | The gate |
|---|---|
| Writing post copy | Founder must edit every post before it ships. Not approve — **edit**. An unedited LLM post is detectable by the reader and, since July 2026, reportable by one click. |
| Choosing what to post about | Must come from something that actually happened this week. Agents cannot generate the *substance*, only the packaging. |
| Newsletter drafts | Same gate. The newsletter is our strongest documented asset; it's the last place to cut corners. |

### Never automate — this is where it shows immediately, and where the penalties live
| Task | Why |
|---|---|
| **Replies and comments** | This is the highest-weighted action on X (+75 for author-answered replies) and the thing LinkedIn is actively blocking — *hundreds of thousands of automated comment attempts per day*. An automated reply is detectable by a human in one sentence and by LinkedIn at the API layer. |
| **DMs** | Automated DMs are the fastest route to a block (−74) or report (−369). |
| **Opinions, takes, "lessons," and hot takes** | This is what 81.2% of LinkedIn already is. Generating opinions the founder does not hold is both the most detectable output and the one with no upside. |
| **Numbers of any kind** | Given TrustMRR's existence, an unverifiable number in an AI-shaped post is worse than no post. |
| **Engagement pods, comment rings, reciprocal-like arrangements** | Explicitly targeted, explicitly reach-limited, explicitly a ToS violation. |

### The tell that gets you caught
Not vocabulary. Not em-dashes. **Cadence and specificity.** Slop is recognisable because it is generically true — it could have been written about any product by any founder. The single reliable defence is **specificity that only the founder could supply**: the actual bug, the actual number, the actual customer email, the actual thing that broke at 2am. Our agents can format that. They cannot invent it, and shouldn't try.

**A useful internal rule:** if a post could be published verbatim by a competitor after swapping the product name, it should not ship.

---

## 4. What real engagement actually costs

There is no published study on founder hours per platform, so the following is an **estimate built from documented mechanics**, not a cited statistic. Flagged as such.

### The documented mechanics that generate the cost
- Author-answered replies are the top-weighted action on X (+75 in 2023 weights).
- Comments are an explicit LiRank objective on LinkedIn and the metric leadership highlights (+24% YoY).
- Dwell time is a first-class objective on both — posts must be worth reading, which means they must be written, not generated.
- Reply visibility on X now favours mutuals, which are built by replying to other people over months.
- The author-diversity decay on X means volume doesn't compound; quality does.

### Estimated weekly cost — X, done properly
| Activity | Founder time/week | Automatable? |
|---|---|---|
| Capturing raw material (demos, voice notes, screenshots) | 1–2 h | No, but it overlaps with building |
| Editing agent-drafted posts | 1–1.5 h | Gate only |
| **Replying to replies on own posts** | **2–3 h** | **No** |
| **Replying on other people's posts (the actual growth mechanism)** | **3–5 h** | **No** |
| DMs and conversations that come out of it | 1–2 h | No |
| **Total** | **~8–13 h/week** | ~2 h of it |

### Estimated weekly cost — LinkedIn, done properly
| Activity | Founder time/week | Automatable? |
|---|---|---|
| 3–4 posts (mostly documents/carousels) — founder editing | 1.5–2 h | Gate only |
| Design/production of the documents | 0 h | ✅ Fully automatable |
| **Replying to every comment, substantively** | **2–3 h** | **No** |
| Commenting on ~15–20 other people's posts | 2–3 h | No |
| Newsletter (1 edition/week) | 1.5–2 h | Draft automatable, gate required |
| **Total** | **~7–10 h/week** | ~2 h of it |

### The number that should decide this
**Running both platforms properly is 15–23 founder-hours per week — roughly half a full-time job — of which our agent pipeline can absorb maybe 3–4 hours.**

The automatable share of build-in-public is the *production* work. The unautomatable share is the *relationship* work, and the relationship work is where the ranking weight, the trust, and the actual outcomes are. Our factory model is very good at exactly the half that matters least.

**Calibrate against the returns in `case-studies.md`:** Marc Lou earned $14,339 in X payouts across a year in which he gained 100,000 followers. Roman Koch ran X, LinkedIn and YouTube for a year across six consumer apps and made $1,464. Cal AI spent that founder-time on ~250 paid TikTok/IG creators instead and did $30M+.

---

## 5. Recommended posture

1. **One founder account per platform, first person, face visible.** No studio-voice account as primary.
2. **Post only when something real happened.** Cadence follows substance, not a calendar. 2–3 posts/week that contain a fact beats daily posts that contain a vibe — and X's author-diversity decay means the daily version wasn't compounding anyway.
3. **Agents do production, the founder does voice and every reply.** Hard rule, no exceptions for replies or DMs.
4. **No numbers we can't substantiate, no MRR screenshots, no "lessons learned" posts.** The genre is burned.
5. **If we commit to LinkedIn at all, commit to the newsletter** — it is the only documented non-algorithmic push channel on either platform (push + in-app + email to every subscriber, auto-growing from followers). Everything else on LinkedIn is optional.
6. **Cap the total at ~5 founder-hours/week and treat it as brand/BD, not acquisition.** If we find ourselves wanting to spend 15, that's a signal to check the attribution test in `case-studies.md` §12 first.
7. **Never buy engagement, never join a pod, never pay for equity-for-promotion deals we wouldn't disclose.** Both platforms are actively hunting this, and the −369 report weight means one bad reputational cycle costs more than a year of gains.
