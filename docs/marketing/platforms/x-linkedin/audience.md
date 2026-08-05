# Who Is Actually On X and LinkedIn — and Which of Our Apps Should Care

**Research date:** August 2026. Companion to `algorithm.md` and `case-studies.md`.

The purpose of this document is to stop us from spending founder hours on a channel that cannot contain our buyers. The default answer for a consumer mobile app is **"neither."** The rest of this document is about the exceptions.

---

## 1. The headline numbers

### X / Twitter
- ~611M monthly active users, ~245M monetizable DAU as of Q1 2026 `[vendor aggregation — treat ±20%]`
- US is the largest market: 100M+ users, ~41.5M monetizable DAU
- Skews **male (≈64%)** and **25–34 (≈38.5% of the base)**
- 38% of US adults 18–29 use it

Sources: https://backlinko.com/twitter-users, https://www.demandsage.com/twitter-statistics/ — note that X stopped reporting reliable public user metrics after 2022, so **every X user number in circulation is an estimate.** Treat as order-of-magnitude only.

### LinkedIn
- **1.3 billion members**, confirmed by Microsoft on the Q4 FY2025 earnings call `[DOCUMENTED]`
- Revenue +10% YoY in Q1 FY2026, driven by Marketing Solutions `[DOCUMENTED]`
- Comments +24% YoY; three consecutive quarters of double-digit video upload growth `[DOCUMENTED]`

Source: https://www.socialmediatoday.com/news/linkedin-reports-increase-in-post-comments-video-posts-microsoft-q1-2026/804353/

**Important asymmetry:** "1.3B members" is a *registration* number. LinkedIn does not publish DAU. The active posting/reading population is a small fraction of it. X's number is closer to real usage. Do not compare 1.3B to 611M as if they mean the same thing.

---

## 2. Where each community is actually concentrated

### X is not one audience. It is roughly six that share a URL.

| Cluster | Density on X | Buys software? | Notes |
|---|---|---|---|
| **Developers / engineers** | Very high | Yes, but hates being sold to | Still the platform's centre of gravity for tech. |
| **Indie founders / "build in public"** | Very high | Yes — but see the warning below | The most reachable and least valuable audience per head. |
| **AI / ML researchers and builders** | Very high | Yes | 2023–2026 X became the de facto AI announcement channel. |
| **VC / startup finance** | High | No (they invest, they don't buy $5/mo apps) | Irrelevant to a bootstrapped consumer studio. |
| **Crypto** | Very high | Yes, impulsively | Adjacent to fraud; reputational risk; not our category. |
| **Niche fandoms** (sports, K-pop, politics, specific games, football clubs) | Very high | Sometimes | Genuinely huge, genuinely engaged, and almost entirely ignored by indie founders. **This is the underexploited part of X for a consumer studio.** |

**The critical point about X's founder cluster:** it is the loudest, easiest audience to reach and it will engage with anything about building. It is also, for a consumer app, **the single worst audience on the internet**, because its members will read your post, like it, reply "great work!", and never install your product — because they are not the person with the problem. See the failure diagnosis in `case-studies.md` §5.

### LinkedIn is one audience, segmented by job function.

| Cluster | Density | Buys software? |
|---|---|---|
| **B2B buyers with budget** (heads of sales/marketing/ops/HR/finance, agency owners, consultants) | Very high | **Yes — this is the whole reason LinkedIn exists commercially** |
| **Recruiters and job seekers** | Very high | No |
| **Enterprise middle management** | Very high | Only via procurement |
| **Freelancers / solopreneurs / creators** | High and growing | Yes, small tickets |
| **SMB owners** | Medium | Yes |
| **Consumers acting as consumers** | **Effectively zero** | — |

LinkedIn's context is work. Nobody opens LinkedIn to find a habit tracker, a photo app, a game, a meditation timer, or anything they'd use on a sofa. **The context filter is absolute and it is not something good content can overcome.**

---

## 3. App category → channel map

Read the "Verdict" column as an instruction, not a suggestion.

| App category | X | LinkedIn | Verdict |
|---|---|---|---|
| **Developer tools / API / CLI / infra** | 🟢 Best channel that exists | 🟡 Marginal | **X, heavily.** This is the one category where build-in-public genuinely converts, because the audience *is* the market. |
| **Tools for indie founders / makers** (boilerplates, analytics, launch tools) | 🟢 Best channel that exists | 🟡 Some | **X.** Marc Lou's entire $1M/yr is this. But be honest that you're selling picks to miners — see `case-studies.md` §3. |
| **AI dev / prosumer AI tools** | 🟢 Strong | 🟡 Weak | **X.** Fastest-moving audience on the platform. |
| **B2B SaaS: sales, marketing, recruiting, HR, ops** | 🟡 Some | 🟢 Best channel that exists | **LinkedIn.** Buyer, context, and intent all line up. |
| **Agency / consultant tooling** | 🟡 | 🟢 | **LinkedIn.** |
| **Prosumer creative tools** (design, video, headshots, writing) | 🟡 Some | 🟡 Some | **Neither is primary.** SEO + TikTok/YouTube + Product Hunt. X is a useful secondary for launch spikes only. |
| **Consumer health / fitness / calorie / sleep / habit** | 🔴 No | 🔴 No | **NEITHER.** TikTok, Instagram Reels, YouTube Shorts, ASO, paid influencers. Cal AI did $30M+ ARR on ~250 paid TikTok/IG creators, not on tweets. |
| **Consumer finance / budgeting** | 🔴 No (except crypto-adjacent) | 🔴 No | **NEITHER.** |
| **Games / entertainment / social** | 🔴 No | 🔴 Absolutely not | **NEITHER.** TikTok, YouTube, Discord, Reddit. |
| **Kids / family / education apps** | 🔴 No | 🔴 No | **NEITHER.** Parent communities, Facebook groups, school channels, ASO. |
| **Local / travel / dating / lifestyle** | 🔴 No | 🔴 No | **NEITHER.** |
| **Niche-fandom consumer apps** (a tool for one sport, hobby, game, fandom) | 🟠 **Real but conditional** | 🔴 No | **X, but only inside that fandom's cluster** — replying in the community, not posting build-in-public updates. This is genuinely underrated and cheap. |
| **Anything B2B that a founder-shaped person buys** | 🟢 | 🟢 | Both. Rare. |

---

## 4. The blunt part

**We are a bootstrapped consumer app studio.** Applying the table above to our own situation:

1. **For the consumer apps themselves, X and LinkedIn are not acquisition channels.** They cannot be made into acquisition channels by better content, better timing, or better hooks. The people who install consumer mobile apps are on TikTok, Instagram, YouTube, Reddit, and the App Store search bar. Every hour spent optimising a LinkedIn carousel for a habit tracker is an hour not spent on ASO or a creator brief.

2. **X is worth exactly one thing to us: it is where the studio's own reputation, hiring, partnerships, and any future B2B/dev-tool product live.** That is a real asset with a real payoff, and it is *not* user acquisition. Budget it as brand/BD, measure it as brand/BD, and never let it be reported as a growth channel.

3. **LinkedIn is worth exactly one thing to us: if we ever productise the factory itself** — the agent pipeline, the tooling, the "how we ship apps with AI agents" system — then LinkedIn's B2B buyers *are* that market, and the newsletter mechanic (`algorithm.md` §2.7) is the strongest free distribution primitive on either platform. Until that product exists, LinkedIn is a résumé.

4. **The niche-fandom exception is the only genuine consumer opportunity on X**, and it looks nothing like build-in-public. It means: our fishing app person lives in fishing X, replies to fishing accounts, and never once posts an MRR screenshot. Cheap, slow, low ceiling, but the audience actually contains buyers.

5. **The audience we will be tempted by — indie founders — is a trap unless we are selling to them.** They are the most responsive people on X and the least likely to be our customer. Engagement from that cluster should be treated as *zero* signal about a consumer app's prospects. Not weak signal. Zero.

---

## 5. What "worth effort" would have to look like

Before committing founder hours to either platform, the channel should clear this bar:

- **X:** can we name the specific non-founder cluster we are entering, and the ten accounts inside it we will reply to weekly? If the answer is "the build-in-public community," the answer is no.
- **LinkedIn:** can we name the job title of the person who will pay us, and is that title one that reads LinkedIn at work? If we cannot name a job title, the answer is no.

Anything that doesn't clear the bar goes in the "founder posts when he feels like it, unbudgeted, unmeasured" bucket — which is a legitimate place for it to be, as long as we never confuse it with marketing.

---

**Sources**
- LinkedIn 1.3B members, comments +24%, video growth, revenue: https://www.socialmediatoday.com/news/linkedin-reports-increase-in-post-comments-video-posts-microsoft-q1-2026/804353/
- X user estimates: https://backlinko.com/twitter-users · https://www.demandsage.com/twitter-statistics/
- Cal AI's influencer-led growth (the consumer counterexample): https://www.cnbc.com/2025/09/06/cal-ai-how-a-teenage-ceo-built-a-fast-growing-calorie-tracking-app.html
- Audience-vs-market failure mode, first-hand accounts: https://www.indiehackers.com/post/your-build-in-public-audience-is-not-your-market-i-learned-the-difference-the-slow-way-2cbea1089d
