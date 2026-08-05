# Community Platforms — How Visibility Actually Works

**Scope:** Reddit, Hacker News, Product Hunt, Indie Hackers, Discord/Slack niche communities.
**Compiled:** 2026-08-05. **Audience:** App Factory (bootstrapped multi-app mobile/web studio, no VC).

Every claim below is tagged:

- **[DOCUMENTED]** — traceable to source code, official docs, SEC filings, primary founder accounts, or original data analysis performed for this document.
- **[ANECDOTAL]** — practitioner reports, secondary blogs, or community consensus. Treat as a hypothesis, not a fact.

A large amount of what is published about these platforms in 2025–2026 is AI-generated SEO content on domains that exist to sell upvote services or launch consulting (`getupvotes.com`, `upvote.net`, `awesome-directories.com`, `redship.io`, `karmaguy.io`, and similar). Numbers from those sources are **not** reproduced here as fact. Where a widely-repeated number could not be traced to a primary source, it is either omitted or explicitly flagged.

---

## 1. Reddit

### 1.1 The ranking formulas (primary source)

Reddit's ranking code was open source until 2017 and the archived implementation is still the best public description of the mechanics. Reddit has never published a replacement, and the platform's own behaviour remains consistent with it.

**"Hot" sort** — [DOCUMENTED], [reddit-archive/reddit `_sorts.pyx`](https://github.com/reddit-archive/reddit/blob/master/r2/r2/lib/db/_sorts.pyx):

```python
cpdef double _hot(long ups, long downs, double date):
    s = score(ups, downs)                 # ups - downs
    order = log10(max(abs(s), 1))         # log base 10 of |net score|
    if s > 0:   sign = 1
    elif s < 0: sign = -1
    else:       sign = 0
    seconds = date - 1134028003           # epoch anchored to Dec 2005
    return round(sign * order + seconds / 45000, 7)
```

Three consequences that matter operationally:

1. **Votes are logarithmic, time is linear.** The first 10 net upvotes move a post as much as the next 90, and those as much as the next 900. Going from 10 → 100 upvotes buys you exactly one "unit" of rank; going from 100 → 1,000 buys one more.
2. **`seconds / 45000` = 12.5 hours per unit.** A post submitted 12.5 hours later starts with the equivalent of a 10× vote advantage over an older post. **Age beats votes.** This is why a 2-hour-old post with 40 upvotes outranks a 14-hour-old post with 400.
3. **The first ~60 minutes decide everything.** Because you can only ever earn ~1 rank unit per 10× votes, but you lose 1 unit every 12.5 hours automatically, a post that does not accumulate its first tranche of votes quickly never climbs. Vote *velocity* is not a separate mechanism — it falls out of the formula. [DOCUMENTED, derived from the formula above]

**"Best"/confidence sort** — [DOCUMENTED], same file — is a Wilson score lower bound at 80 % confidence (`z = 1.281551565545`). It governs **comment** ordering. Practical consequence: a comment with 8 up / 0 down outranks one with 60 up / 30 down. Early, uncontroversial comments win. If you are participating in threads (which is the highest-leverage Reddit play for a studio — see `credibility.md`), being *early and uncontentious* beats being *loud*.

**Caveat [ANECDOTAL]:** Reddit's live stack in 2026 also includes personalised home-feed ranking, "Best" as the logged-in default, and ML re-ranking that is not public. The formulas above are exactly right for `/r/<sub>/hot` and for comment ordering, and directionally right elsewhere.

### 1.2 Why most launch posts get removed

Removal on Reddit is almost never the site-wide algorithm. It is, in order of frequency:

1. **AutoModerator gates.** Nearly every mid-to-large subreddit runs AutoModerator rules that silently remove posts from accounts under a karma threshold or age threshold, or containing certain domains. Thresholds are private and vary per sub. Practitioner-reported ranges: **30–50 karma at the low end, 500–1,000 at conservative subs; account age minimum ~1 month** — [ANECDOTAL], [screenfast.app, "Reddit Promotion for Indie iOS Apps: The Honest 2026 Playbook"](https://screenfast.app/blog/reddit-promotion-indie-ios-app). Because removal is silent to the poster (the post is visible on your own profile but invisible in the sub), founders routinely believe their post "flopped" when it was never shown. **Always check your post in a logged-out browser.**
2. **Human moderators.** Subreddit mods write and enforce their own promo rules. A sub can and does enforce policies stricter than anything Reddit requires — up to near-total bans on any link to a product you own.
3. **Site-wide spam/manipulation enforcement.** Reddit's Content Policy Rule 2 requires you to "post authentic content into communities where you have a personal interest, and do not cheat or engage in content manipulation (including spamming, vote manipulation, ban evasion, or subscriber fraud)" — [DOCUMENTED], Reddit Content Policy (quoted consistently across secondary sources; redditinc.com blocks automated fetch).

**Scale of enforcement [DOCUMENTED]:** Reddit reported deploying LLM-based classifiers that detect on the order of **25,000 spam posts and comments per day**, contributing to a **~20 % reduction in user exposure to spam** quarter-over-quarter in early 2026 — [absolutegeeks.com](https://www.absolutegeeks.com/tech-news/reddit-deploys-llms-to-combat-ai-generated-spam-content/), [techbuzz.ai](https://www.techbuzz.ai/articles/reddit-deploys-llms-to-fight-ai-generated-spam-epidemic). The system is explicitly tuned for *"subtle, coordinated patterns of artificial behavior and manufactured hype."* That is a literal description of a multi-app studio posting about its own products from several accounts.

### 1.3 The self-promo ratio

- **[DOCUMENTED]** Reddiquette's actual language permits linking your own content "within reason," and warns that if that is all you post, "you just might be a spammer." The memorable formulation is: *"it's fine to be a redditor with a website, it's not fine to be a website with a Reddit account."*
- **[ANECDOTAL]** The **9:1 rule** (one self-promotional submission per nine non-promotional contributions) is a community convention, historically published by Reddit and now removed from official policy text. It is not enforced by any site-wide automated system. It *is* the heuristic many human mods use when they check your profile, which is what actually matters.
- **Practical read:** treat 9:1 as a *profile-appearance* rule, not a posting quota. A mod who clicks your username should see a person with interests, not a promo feed. A mod who sees 4 of your last 10 posts linking `ourapp.com` will remove and often ban regardless of ratio arithmetic.

### 1.4 What subreddits permit what

Never trust a third-party table, including this one. Read the sidebar and the pinned rules in the sub before posting; they change. Rules as summarised by practitioner sources, retrieved 2026-08-05 — [ANECDOTAL] unless you have verified in-sub:

| Sub | Posture toward self-promo |
|---|---|
| r/SideProject | Show-and-tell is the *purpose*; direct launch posts allowed |
| r/AlphaAndBetaUsers, r/TestMyApp, r/BetaTestersNeeded | Beta recruitment allowed and expected |
| r/IMadeThis, r/roastmystartup | Built for it |
| r/AppHookup | **Only** free/discounted promo-code posts |
| r/microsaas, r/indiehackers, r/EntrepreneurRideAlong | Mixed; usually allowed with substance, often has a weekly thread |
| r/SaaS, r/Entrepreneur, r/startups | Promo restricted to dedicated weekly/monthly threads |
| r/iosapps, r/apps, r/androidapps | Verify the sidebar; policy has changed repeatedly |
| r/iPhone, r/Android, r/webdev, r/programming, and virtually all large topical subs | **No direct promo.** Participation only. |
| Interest subs (r/ADHD, r/loseit, r/running, r/Journaling, …) | **No promo, and mods are aggressive.** These are the subs where your users are and where you must never post a launch. |

### 1.5 Reddit's own scale — why it dominates this document

[DOCUMENTED] Reddit Q1 2026: **126.8 M global daily active uniques (+17 % YoY)**; US DAUq **53.5 M (+7 %)**; revenue **$663 M (+69 %)** — [CNBC, 2026-04-30](https://www.cnbc.com/2026/04/30/reddit-rddt-q1-2026-earnings-report.html), [Reddit Q1 2026 press release (SEC)](https://www.sec.gov/Archives/edgar/data/1713445/000171344526000067/earningspressreleaseq126.htm). Reddit also announced it will stop disclosing the logged-in/logged-out split after Q2 2026.

For comparison: everything else in this document combined is a rounding error against Reddit's traffic. That asymmetry should drive resource allocation.

---

## 2. Hacker News

### 2.1 The ranking formula

[DOCUMENTED] — Arc source constants and empirical reverse-engineering, [righto.com, "How Hacker News ranking really works"](http://www.righto.com/2013/11/how-hacker-news-ranking-really-works.html):

```
score = ((upvotes - 1) ^ 0.8) / ((age_hours + 2) ^ 1.8) × penalties
```

Published constants:

| Constant | Value | Effect |
|---|---|---|
| `gravity` | **1.8** | Age exponent. Because 1.8 > 0.8, every story's score converges to zero. |
| `timebase` | **120 min** | The `+2` hours in the denominator; softens the first two hours. |
| `nourl-factor` | **0.4** | Text posts with no URL are penalised 60 %. |
| `lightweight-factor` | **0.17** | "Lightweight" stories penalised 83 %. |
| `gag-factor` | **0.1** | Joke posts penalised 90 %. |

Penalties layered on top [DOCUMENTED, same source]:

- **Controversy penalty.** Triggered when a story has **more comments than upvotes AND ≥ 40 comments**. The rank drop is described as "sudden and catastrophic." A Show HN that starts an argument is worse off than one nobody discusses.
- **Domain penalties**, 0.25–0.8, applied to a list of domains that has historically included `medium.com`, `reddit.com`, `imgur.com`, `youtube.com`, `github.com`, `arstechnica.com`. **Do not launch from a Medium post.** Link your own domain.
- **Flag penalty**, factor **0.001** — a flagged story is gone.
- **Voting-ring detection**, which can fire on legitimate posts.
- **~20 % of front-page stories carry some penalty** at any given time.

**[ANECDOTAL] on freshness:** the constants above date from the last public leak of the Arc source. The *shape* of the system (gravity ≈ 1.8, hard penalties, moderator intervention) is repeatedly confirmed by observation, but individual factor values may have drifted.

### 2.2 Show HN — the official rules

[DOCUMENTED] — [news.ycombinator.com/showhn.html](https://news.ycombinator.com/showhn.html):

- *"Show HN is for something you've made that other people can play with."* It must be runnable/holdable, non-trivial, and personally worked on.
- **Off-topic:** *"Blog posts, sign-up pages, newsletters, lists, and other reading material"* — because they can't be tried out. Also excluded: landing pages, fundraisers, and anything *"not ready for users to try out."*
- *"Please make it easy for users to try your thing out, ideally without barriers such as signups or emails."* — **a signup wall is the single most common self-inflicted Show HN wound.**
- Version bumps and minor features are not substantive enough; *"a major overhaul is probably ok."*
- Stories appear on the `/show` page *"once it clears a small points threshold."*
- Upvote solicitation is explicitly *"not ok on HN."*

### 2.3 Original data: what Show HN actually looks like in 2025–2026

**Method [DOCUMENTED, original analysis]:** Every Show HN story submitted between **2025-08-01 and 2026-08-01** was pulled from the HN Search (Algolia) API (`hn.algolia.com/api/v1/search_by_date?tags=show_hn`), paginated backwards by `created_at_i`. **n = 43,453** stories (≈ 119/day). Reproducible: same endpoint, same window.

**Score distribution:**

| Threshold | Count | Share |
|---|---|---|
| ≥ 1 pt | 43,453 | 100 % |
| ≥ 2 pts | 28,674 | 66.0 % |
| ≥ 3 pts | 16,448 | 37.9 % |
| ≥ 5 pts | 7,613 | 17.5 % |
| ≥ 10 pts | 3,633 | 8.4 % |
| ≥ 20 pts | 2,296 | 5.3 % |
| **≥ 30 pts** (rough front-page proxy) | **1,836** | **4.2 %** |
| ≥ 50 pts | 1,334 | 3.1 % |
| ≥ 100 pts | 752 | 1.7 % |
| ≥ 200 pts | 326 | 0.8 % |
| ≥ 500 pts | 68 | 0.2 % |
| ≥ 1000 pts | 15 | 0.03 % |

**Median Show HN score: 2 points. Mean: 8.7.** One third of all Show HN posts never get a single upvote beyond the author's own.

This is the number to internalise: **a Show HN has roughly a 4 % chance of meaningful visibility and a 1.7 % chance of a real traffic event.**

**Timing (submission hour, UTC), hit rate = share reaching ≥ 30 pts:**

| Hour (UTC) | Posts | ≥30 pts | Hit rate |
|---|---|---|---|
| 07:00 | 1,249 | 25 | **2.00 %** (worst) |
| 03:00 | 860 | 21 | 2.44 % |
| 12:00 | 2,564 | 107 | 4.17 % |
| 15:00 | 3,466 | 168 | 4.85 % |
| 16:00 | 3,211 | 168 | 5.23 % |
| **17:00** | 2,670 | 155 | **5.81 %** (best) |
| 18:00 | 2,279 | 115 | 5.05 % |

**Day of week:** Sun 4.83 %, Sat 4.47 %, Mon 4.43 %, Thu 4.14 %, Wed 4.08 %, Tue 4.00 %, Fri 3.89 %.

**Interpretation:** the widely-repeated advice to post at a magic hour is real but small. Best hour vs worst hour is 5.8 % vs 2.0 % — a ~2.9× relative difference, but on a base rate so low that it moves you from "almost certainly invisible" to "almost certainly invisible." **Day of week is noise (3.9 %–4.8 %).** Weekends are marginally *better*, not worse, contradicting the common "never launch on a weekend" advice. Optimising timing is not where the leverage is.

**What the title says matters more than when you post [DOCUMENTED, original analysis]:**

| Title contains | n | Median | Mean | ≥30 pts | ≥100 pts |
|---|---|---|---|---|---|
| AI / LLM / GPT / Claude / Gemini / agent | 13,944 | 2 | 6.3 | **2.89 %** | 1.07 % |
| — everything else | 29,509 | 2 | 9.8 | **4.86 %** | 2.04 % |
| iOS / Android / App Store / iPhone / iPad | 717 | 2 | 5.3 | **2.51 %** | 1.12 % |
| — everything else | 42,736 | 2 | 8.8 | 4.25 % | 1.74 % |
| "open source" | 2,271 | 2 | 10.1 | **5.33 %** | 2.03 % |
| — everything else | 41,182 | 2 | 8.6 | 4.16 % | 1.71 % |
| "Show HN: I built/made/created/wrote/spent…" | 2,412 | 2 | 11.5 | **4.77 %** | 2.07 % |
| — everything else | 41,041 | 2 | 8.5 | 4.19 % | 1.71 % |

**AI in the title cuts your hit rate roughly in half** (2.89 % vs 4.86 %), despite AI-themed posts being 32 % of all submissions. HN has AI fatigue and it is measurable. **"Open source" is the strongest positive signal in the dataset.** First-person "I built…" framing gives a modest but real lift.

**Composition of the top of Show HN:** of the 300 highest-scoring Show HN posts in the year, **2 (0.7 %) had a mobile keyword in the title**; only one — *"Show HN: DoNotNotify – Log and intelligently block notifications on Android"* (347 pts) — was a conventional mobile app listing. Mobile is 1.7 % of Show HN submissions and 1.2 % of the ≥100-point posts. The top of Show HN is hardware hacks, toys, visualisations, open-source infrastructure, and local-model demos.

### 2.4 Practical mechanics

- **Upvotes from direct-link referrals do not count** and **one vote per IP** — [ANECDOTAL], long-standing community consensus, [marketingexamples.com/content/hacker-news](https://marketingexamples.com/content/hacker-news). Telling your Slack "go upvote this link" achieves nothing and risks ring detection.
- **Second-chance pool.** HN moderators manually re-surface stories they think deserved better. This is invisible and unpetitionable; the practical implication is that a good post that flopped at 3 points is occasionally revived days later.
- **The first comment is yours.** Post a substantive top-level comment explaining what was hard, what you'd do differently, and the honest limitations. This is the single most consistently repeated tactic across every credible practitioner account, and it also mitigates the controversy penalty by shaping the thread.
- **Reposting works but decays fast.** See the ScrollGuard case in `case-studies.md`: 4 pts (2024) → 690 pts (2025) → 1 pt and 4 pts (2026) for the same product under different titles.

---

## 3. Product Hunt

### 3.1 The structural change that matters more than the algorithm

[DOCUMENTED] In **October 2024**, under CEO Rajiv Ayyangar, Product Hunt split launches into **Featured** and **All**. Only Featured products appear on the homepage, in the mobile app, and in the daily newsletter. Featuring is an **editorial, human decision**, not an upvote outcome.

Ayyangar's own framing, from the PH newsletter and his AMA on the platform:

> *"Our job is to be a site where the most interesting, impactful, creative products rise to the top. We can't just feature everyone's AI wrapper."*
> *"Expect our bar to rise, not lower."*
> *"we feature products that we believe our community should know about."*

— [Product Hunt CEO AMA thread](https://www.producthunt.com/p/producthunt/i-m-the-product-hunt-ceo-and-i-ve-launched-8-times-on-ph-ama-unfiltered)

**Operational consequence:** upvote strategy is downstream of a gate you cannot vote your way through. If you are not featured, ranking is irrelevant. Product Hunt's public Atom feed (`https://www.producthunt.com/feed`) returns **50 recent featured entries** at a time — the featured set is small and human-picked.

### 3.2 Ranking, as far as it can be verified

Product Hunt does not publish its ranking formula and its help-centre articles on ranking are not reachable by automated fetch. The following are **[ANECDOTAL]**, from launch-consultancy blogs whose incentives are to sell launch services — included because they are directionally consistent across independent sources, but **do not plan around specific multipliers**:

- Votes from older/established accounts are weighted more than votes from accounts created that day.
- Comment volume and *maker responsiveness* are weighted; a launch with fewer upvotes and dense discussion is reported to outrank a launch with more upvotes and thin discussion.
- Sustained upvote rate across the full ~24-hour window is weighted over a first-two-hours spike.
- Suspicious velocity, voting rings, and Telegram upvote-exchange traffic are discounted or penalised.

The one mechanism with an unambiguous primary confirmation is **vote solicitation is against the rules**, and a founder in the PH AMA thread describes exactly the failure mode: their friends' upvotes were suppressed because same-IP patterns were caught by spam filtering ([MailTest case, `case-studies.md`](./case-studies.md)).

**The hunter.** The "get a big-name hunter" meta is largely dead as a ranking mechanic — makers can and normally do launch their own products, and the CEO's public guidance is about tagline clarity and committing to promotion, not hunter selection. [ANECDOTAL]

### 3.3 Does it still drive installs?

Honest answer: **it drives a one-day traffic pulse and a badge, not a user base**, and the pulse is small.

Primary-source data points:

- **Plausible Analytics** [DOCUMENTED, first-party]: their Product Hunt launch produced *"more than 1,000 visitors and 15 trial signups"* on the day — against a Hacker News post that produced 25,000+ visitors. [plausible.io/blog/open-source-saas](https://plausible.io/blog/open-source-saas)
- **Beep** [DOCUMENTED, first-party]: **#1 Product of the Day** after three weeks of preparation → *"a bit over 1k site visitors."* A 30-minute Reddit post the following week → **1.2k visitors.** [Indie Hackers post](https://www.indiehackers.com/post/a-30-minute-reddit-post-brought-more-traffic-than-a-product-hunt-launch-we-prepared-for-3-weeks-15bff6d42e)
- **ProdShort**, 2026 [DOCUMENTED, first-party in the PH forum]: **746 visits, 32 sign-ups, 12 activated users.** [PH discussion thread](https://www.producthunt.com/p/general/is-launching-on-product-hunt-still-worth-it-in-2026)
- **MailTest**, 2026 [DOCUMENTED, first-party]: **#83, 1 upvote (his own), 0 users.** [Indie Hackers post](https://www.indiehackers.com/post/i-launched-on-product-hunt-today-with-0-followers-0-network-and-0-users-heres-what-i-learned-in-12-hours-1c89889702)

Founder sentiment in the platform's own 2026 discussion thread is that PH is *"great for feedback and credibility, but not always for customers, mainly because the competition is too much"* (Othman Katim, Mailwarm), and that "AI" in the tagline is now a liability (Stan Kolotinskiy).

**Widely-circulated traffic tables** ("top 3 = 5,000–15,000 visitors") appear only on launch-service marketing sites with no methodology. They contradict every first-party account above by roughly an order of magnitude. **Treated as unreliable; not used.**

**For a mobile app studio specifically:** Product Hunt sends web traffic. Web traffic → App Store listing → install is a 3-step funnel with heavy drop-off at each step. A 1,000-visitor day is not an install event.

---

## 4. Indie Hackers

[DOCUMENTED] Stripe acquired Indie Hackers in **April 2017**; Courtland and Channing Allen **bought it back in April 2023**, becoming majority owners with Stripe retaining an investment ([changelog.com](https://changelog.com/news/indie-hackers-is-indie-again-Qpro), [theygotacquired.com](https://theygotacquired.com/community/indiehackers-acquired-by-stripe/)).

**Visibility mechanics:** a chronological + engagement-sorted forum feed with topic groups. There is no meaningful algorithm to game. Reach is a function of (a) how contrarian or numerically specific your title is, and (b) whether you reply in the thread.

**Current state [ANECDOTAL]:** engagement is well below the 2021–2022 peak; Similarweb showed indiehackers.com traffic **down ~16 % month-over-month as of June 2025**, with global rank sliding from ~86.5k to ~97.4k over three months. The newsletter (reported 165K+ subscribers) is the more valuable surface than the forum.

**What it is actually good for, evidenced:** the post-mortem. MailTest's founder got **1 upvote on Product Hunt** and then **700+ views on his Indie Hackers post-mortem about it** — the failure write-up outperformed the launch by two orders of magnitude. This is the reliable IH pattern: *specific numbers + honest failure* travels; *launch announcement* does not.

**Do not** expect IH to send users. Expect it to send peers, feedback, and occasionally a partner or a first customer who is themselves a founder.

---

## 5. Discord and Slack niche communities

There is no ranking algorithm. Visibility = who is online in the channel at the moment you type, plus whether a moderator or regular amplifies you. Messages are ephemeral; nothing compounds; nothing is indexed by search engines.

**Scale reality [DOCUMENTED, retrieved 2026-08-05 from The Hive Index's entrepreneurship/Discord directory](https://thehiveindex.com/topics/entrepreneurship/platform/discord/):** across 34 listed entrepreneurship Discords, the sizes are — Our Startups 32K, The Tavern 18K, Tech Startups 12K, Small Bets 8K, Clarity 3K, SaaS Community 3K, Internet Pipes 1K, Lunadio 1K, ShipFast 303, The SaaS Corner 393, indieFamily 175, and a long tail under 100 members.

The *entire* indie-founder Discord ecosystem is smaller than a mid-sized subreddit. r/SideProject alone has **798K members** — more than every entrepreneurship Discord in that directory combined, by roughly an order of magnitude.

**Structural properties to plan around:**

- **Members are makers, not users.** A #launch or #showcase channel in a founder Discord is a room full of people who each want you to look at *their* thing. Mutual-attention economies produce upvotes, not retention.
- **The valuable channels are the ones where your *users* are** — a hobby Discord, a game community, a specific tool's server. Those have zero tolerance for promotion and are moderated by volunteers who will remove you instantly. Entry cost is months of genuine participation, per community.
- **Zero SEO value.** Reddit threads rank in Google and are now licensed as AI training/grounding data (Reddit's data-licensing line, including Google and OpenAI, was $39 M in Q1 2026). Discord messages are invisible to both.
- **Slack communities** (e.g. invite-only founder Slacks) are smaller still and function as advisory networks. Real value: introductions, hiring, sanity checks. Not distribution.

**Verdict:** Discord/Slack are a *support and feedback* channel with a real but modest payoff, and a *distribution* channel with essentially none at studio scale. Budget them as professional-network maintenance, not marketing.

---

## 6. Cross-platform summary

| | Reddit | Hacker News | Product Hunt | Indie Hackers | Discord/Slack |
|---|---|---|---|---|---|
| Audience size | 126.8 M DAUq [D] | ~5 M monthly (est., not primary) | Featured set ≈ 50/day [D] | Declining forum + 165K newsletter [A] | 10s of thousands total [D] |
| Ranking is gameable | No (log votes, linear decay) | No (gravity 1.8 + penalties) | N/A — human editorial gate | No algorithm | No algorithm |
| Base rate of success | Sub-dependent; mods remove most launches | **4.2 %** of Show HN reach 30 pts [D, original] | <1 in 10 featured [A] | ~any post gets some reads | Depends who's online |
| Best for | Reaching actual end users at scale | Technical credibility + dev-tool users | A badge and a screenshot | Post-mortems and peer feedback | Feedback, not reach |
| Worst for | Anything that looks like a campaign | B2C consumer mobile apps | Retained users | Users | Users |
| Half-life of a win | Weeks–years (Google-indexed) | ~24 h + permanent backlink | ~24 h | Weeks | Minutes |

**[D]** = documented, **[A]** = anecdotal.

---

## Sources

- [reddit-archive/reddit — `_sorts.pyx`](https://github.com/reddit-archive/reddit/blob/master/r2/r2/lib/db/_sorts.pyx)
- [Reddiquette – Reddit Help](https://support.reddithelp.com/hc/en-us/articles/205926439-Reddiquette)
- [Reddit (RDDT) Q1 2026 earnings — CNBC](https://www.cnbc.com/2026/04/30/reddit-rddt-q1-2026-earnings-report.html) · [Q1 2026 press release (SEC)](https://www.sec.gov/Archives/edgar/data/1713445/000171344526000067/earningspressreleaseq126.htm)
- [Reddit deploys LLMs to combat AI-generated spam — Absolute Geeks](https://www.absolutegeeks.com/tech-news/reddit-deploys-llms-to-combat-ai-generated-spam-content/) · [TechBuzz](https://www.techbuzz.ai/articles/reddit-deploys-llms-to-fight-ai-generated-spam-epidemic)
- [Ken Shirriff — How Hacker News ranking really works](http://www.righto.com/2013/11/how-hacker-news-ranking-really-works.html)
- [Show HN rules — news.ycombinator.com/showhn.html](https://news.ycombinator.com/showhn.html)
- [HN Search (Algolia) API](https://hn.algolia.com/api) — source of the original 43,453-post analysis
- [Product Hunt CEO AMA](https://www.producthunt.com/p/producthunt/i-m-the-product-hunt-ceo-and-i-ve-launched-8-times-on-ph-ama-unfiltered) · [Is launching on PH still worth it in 2026?](https://www.producthunt.com/p/general/is-launching-on-product-hunt-still-worth-it-in-2026) · [Product Hunt Atom feed](https://www.producthunt.com/feed)
- [Plausible — How we built a $1M ARR open source SaaS](https://plausible.io/blog/open-source-saas)
- [Beep: a 30-minute Reddit post vs a 3-week PH launch](https://www.indiehackers.com/post/a-30-minute-reddit-post-brought-more-traffic-than-a-product-hunt-launch-we-prepared-for-3-weeks-15bff6d42e)
- [MailTest PH post-mortem](https://www.indiehackers.com/post/i-launched-on-product-hunt-today-with-0-followers-0-network-and-0-users-heres-what-i-learned-in-12-hours-1c89889702)
- [Indie Hackers is indie again — Changelog](https://changelog.com/news/indie-hackers-is-indie-again-Qpro)
- [The Hive Index — entrepreneurship Discords](https://thehiveindex.com/topics/entrepreneurship/platform/discord/)
- [ScreenFast — Reddit Promotion for Indie iOS Apps (2026)](https://screenfast.app/blog/reddit-promotion-indie-ios-app)
- [Marketing Examples — Hacker News](https://marketingexamples.com/content/hacker-news)
