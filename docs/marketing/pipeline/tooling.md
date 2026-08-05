# Content pipeline — tooling survey (August 2026)

**Scope:** what actually exists today for automated/AI video editing, captioning, hook
generation, multi-platform scheduling, and programmatic posting. Real products, real
prices, real API availability.

**Standing assumption:** bootstrapped, near-zero paid budget. Every row below has a
**default** (what we use now, usually £0) and an **upgrade trigger** (the specific
condition that justifies paying).

Claims are tagged `[DOCUMENTED]` (primary source: vendor docs, platform developer docs,
official pricing page) or `[ANECDOTAL]` (secondary blog, vendor comparison post, review
site). **A large share of 2026 writing about social-posting APIs is published by the
vendors selling those APIs** — Blotato, Upload-Post, Postiz, Ayrshare all run comparison
blogs that rank themselves first. Where a price below comes from that kind of source it
is tagged `[ANECDOTAL]` even when it looks authoritative, and should be re-checked on the
vendor's own pricing page before any card is entered.

---

## 0. The one-paragraph answer

**Everything in the edit chain can be done locally for £0 with ffmpeg + whisper.cpp +
auto-editor, driven by Claude.** The paid tools in this space (Opus Clip, Submagic,
Descript, Creatomate, Shotstack) sell convenience and a hosted render farm, neither of
which we need at 15 videos a week. **The genuinely hard part is not editing — it is
posting.** TikTok requires an audit before an API can publish publicly; Instagram caps
API Reels at 90 seconds; LinkedIn's posting API is partner-gated and effectively closed;
Reddit's free tier is non-commercial only and registration needs manual approval; X went
pay-per-use in February 2026. The posting layer is where the design has to bend around
platform policy, not where the money goes.

---

## 1. Transcription and word-level timestamps

This is the foundation of everything downstream — captions, hook selection, silence
detection, and search-keyword verification all read from the transcript.

| Tool | Price | API | Notes |
|---|---|---|---|
| **whisper.cpp / faster-whisper (large-v3-turbo)** | **£0**, local | CLI + Python | `large-v3-turbo` is ~8× faster decoding than `large-v3` with minimal English accuracy loss; as of June 2026 OpenAI had announced no Whisper v4, so `large-v3`/`turbo` remain the production-safe open checkpoints `[ANECDOTAL — secondary guides]` ([digitalapplied](https://www.digitalapplied.com/blog/local-speech-to-text-whisper-self-hosted-transcription-2026), [faster-whisper](https://github.com/SYSTRAN/faster-whisper)) |
| **WhisperX** | **£0**, local | Python | Adds wav2vec2 forced alignment for word-level timestamps at ~±50 ms vs ~±500 ms for vanilla Whisper, plus diarization `[ANECDOTAL]` ([WhisperX guide](https://vexascribe.com/whisperx)) |
| AssemblyAI Universal-3 Pro | **$0.21/hr** batch, $0.45/hr streaming | REST | Cheapest credible hosted option `[ANECDOTAL — vendor comparison]` ([AssemblyAI pricing](https://www.assemblyai.com/blog/speech-to-text-api-pricing)) |
| Deepgram Nova-3 | **$0.26/hr** monolingual pre-recorded | REST | Rises to ~$0.67/hr multilingual streaming with add-ons `[ANECDOTAL]` ([Deepgram](https://deepgram.com/learn/best-speech-to-text-apis-2026)) |

> **Raw Whisper output is segment-level, accurate to a few seconds. True word-level
> timestamps need a wav2vec2 alignment pass** — which is exactly what WhisperX adds. Do
> not skip this: karaoke captions and precise cuts both depend on word timings.

**Default: WhisperX locally (`large-v3-turbo` + alignment). £0.**
**Trade-off:** first-run model download is ~1.5 GB and transcription is CPU/GPU-bound on
the founder's machine — a 3-minute clip takes seconds on Apple Silicon, but the machine
is busy while it runs.
**Upgrade trigger:** if transcription ever blocks a same-day publish, or if we start
processing >5 hours of footage a week, move to AssemblyAI at $0.21/hr — at 5 hrs/week
that is **~$4.50/month**, which is nothing. The reason to stay local is not cost, it is
that a local step cannot rate-limit us or go down.

---

## 2. Cutting, assembly and rendering

### 2.1 Free / local

| Tool | What it does | Price |
|---|---|---|
| **ffmpeg** | Everything: trim, concat, crop to 9:16, burn subtitles (`subtitles=` / `ass` filters), loudness normalise (`loudnorm`), export per-platform masters | £0 |
| **auto-editor** | Analyses audio, cuts silence and dead air, outputs trimmed MP4 or an edit list; Python, wraps ffmpeg `[ANECDOTAL]` ([GitHub topic](https://github.com/topics/auto-editor)) | £0 |
| **unsilence / ffmpeg `silencedetect`** | Raw silence-boundary detection you can post-process yourself | £0 |
| **Whisper-driven cutters** | Tools exist that combine whisper.cpp with silence removal and emit trimmed MP4 + FCPXML + SRT together `[ANECDOTAL]` | £0 |

`[ANECDOTAL]` throughout — these are open-source projects with README-level documentation,
not vendors with support contracts. That is the trade-off.

### 2.2 Paid AI clipping (the "Opus Clip" category)

These take a long video and pick the clips for you. **Their core value — finding the good
30 seconds inside a 40-minute podcast — is a problem we do not have**, because the founder
records short, single-idea clips deliberately.

| Tool | Entry price | API availability |
|---|---|---|
| Opus Clip | $15/mo entry | **API gated to the Business/enterprise plan** — not on Starter or Pro `[ANECDOTAL — comparison sites]` ([Playcut](https://playcut.ai/blog/opus-clip-alternatives/), [checkthat.ai](https://checkthat.ai/brands/opusclip/pricing)) |
| Vizard | $14.50/mo annual (Creator) | API on paid plans, separate rate pool — "the cleanest like-for-like swap for the Opus workflow with a self-serve API" `[ANECDOTAL]` |
| Klap | from $14/mo annual | Public API billed **per operation on top of subscription, $0.32–0.48/op** `[ANECDOTAL]` |

**Default: skip this category entirely.** auto-editor + ffmpeg does the mechanical work,
and Claude picks which take is strongest from the transcript.
**Upgrade trigger:** only if we start recording long-form (a 30-minute build session, a
podcast) and want it mined for Shorts. Then Vizard, because it is the only one with a
self-serve API at the entry tier.

### 2.3 Captions

| Tool | Price | API |
|---|---|---|
| **ffmpeg + WhisperX word timings → ASS subtitle file** | **£0** | n/a — you generate the `.ass` yourself |
| Submagic | $19/mo Starter, $39/mo Pro; **Business + API $69/mo ($41/mo annual), then $0.69 per processed minute** `[ANECDOTAL]` ([fluxnote](https://fluxnote.io/guides/submagic-pricing-2026), [aisotools](https://aisotools.com/pricing/submagic)) | Yes, on Business tier. Free plan: 3 videos/month, **watermarked**, 90-second cap |

> ⚠️ **Submagic's free tier watermarks.** Instagram documents that visible watermarks
> disqualify content from recommendation (`../platforms/instagram/credibility.md` §1.2).
> The free tier of any captioning tool is therefore unusable for us — it is not "cheap",
> it is a silent, total reach kill.

**Default: generate `.ass` subtitles from WhisperX word timings and burn them with ffmpeg. £0, zero watermark risk.**
**Trade-off:** we build and maintain the caption style ourselves (font, highlight colour,
pop-in timing). That is a day of work once, then it's a config file. Submagic's styles
are better-looking out of the box.
**Upgrade trigger:** if caption style is measurably costing us watch time — i.e. we A/B a
Submagic-styled cut against ours on Instagram Trial Reels and it wins twice. At $0.69/min
and ~15 videos × 40 s/week, Submagic Business is **~$41/mo + ~$7/mo usage ≈ $48/mo**.

### 2.4 Programmatic rendering (templated video from JSON/React)

| Tool | Pricing | Model |
|---|---|---|
| **Remotion** | Free for individuals; **commercial/programmatic use needs a licence: Creator $25/seat/mo, Automators $0.01/render with a $100/mo minimum** `[ANECDOTAL]` ([Shotstack comparison](https://shotstack.io/vs/remotion-alternatives/), [autoae](https://autoae.online/blog/remotion-alternatives-compared-2026)) | Define videos as React components; render locally or on Lambda |
| Creatomate | ~$41–54/mo for ~150–200 min at 720p; ~700 min at the $99 tier `[ANECDOTAL — competitor comparison]` ([json2video](https://json2video.com/how-to/creatomate-alternative/)) | JSON template → hosted render |
| Shotstack | Flat per-rendered-minute; 4K same price as 720p; ~500 min at the $99 tier `[ANECDOTAL]` ([Shotstack](https://shotstack.io/vs/creatomate-alternatives/)) | JSON composition → hosted render |

**Default: ffmpeg filter graphs. £0.**
**Trade-off:** ffmpeg is unpleasant to author and debug; a complex animated template is
genuinely easier in Remotion/React. But our house style should be *deliberately*
low-polish (`../platforms/tiktok/credibility.md` §2 — "speed-ramped, zoom-punched, every
frame optimised" is on the *slop* side of the table), so we need very little templating.
**Upgrade trigger:** Remotion's Automators plan has a **$100/mo minimum** — that is the
single biggest line item any of these would add, for capability we do not need. Only
revisit if we build a recurring templated format (e.g. a weekly "what shipped" card) that
genuinely needs motion design.

---

## 3. Hooks, captions, idea generation (the LLM layer)

We already pay for this and already have the plumbing: `orchestration/bin/factory-run`
shells out to the `claude` CLI for every agent step.

**Claude model pricing per million tokens** `[DOCUMENTED]`:

| Model | Input | Output |
|---|---|---|
| Claude Opus 5 (`claude-opus-5`) | $5.00 | $25.00 |
| Claude Sonnet 5 (`claude-sonnet-5`) | $3.00 ($2.00 intro through 2026-08-31) | $15.00 ($10.00 intro) |
| Claude Haiku 4.5 (`claude-haiku-4-5`) | $1.00 | $5.00 |

Two discounts worth designing around:

- **Message Batches API: 50% off all token usage**, up to 100k requests per batch, most
  batches complete within an hour. Perfect for the weekly idea-generation and
  hook-variant passes, which are not latency-sensitive.
- **Prompt caching:** cache reads cost ~0.1× base input; writes cost 1.25× (5-min TTL) or
  2× (1-hr TTL). Our brand/voice/anti-slop system prompt is identical across every video —
  cache it once per session.

**Cost reality check:** a hook-variant pass is maybe 3k input / 1k output tokens. At Opus
5 rates that is ~$0.04 per video, ~$0.60/week at 15 videos. **The LLM layer is free in
practice.** Do not optimise it; optimise the human time it saves.

**Default: Claude Opus 5 for briefs and judgement calls (which take is strongest, does
this pass the anti-slop checklist); Haiku 4.5 for mechanical passes (keyword extraction,
filename tagging). Batch API for the weekly idea pass.**
**Upgrade trigger:** none — this is already the cheapest part of the stack.

---

## 4. Thumbnails and cover images

| Tool | Price |
|---|---|
| **Nano Banana Pro (Gemini 3 Pro Image)** | **$0.039** per ≤1024×1024, **$0.134** per 1K–2K, **$0.24** per 4K; **Batch/Flex halves it — $0.067 per 2K** `[ANECDOTAL — pricing aggregators]` ([pricepertoken](https://pricepertoken.com/pricing-page/model/google-gemini-3-pro-image-preview), [aifreeapi](https://www.aifreeapi.com/en/posts/nano-banana-pro-price)) |
| Frame extraction from the video itself | £0 (ffmpeg) |

**Where thumbnails actually matter:** YouTube long-form only. Shorts, Reels and TikTok have
no separate thumbnail surface worth optimising — the first frame is the thumbnail, and the
hook is the first second.

> ⚠️ **YouTube's Test & Compare (3 title/thumbnail variants, ~2 weeks, winner decided by
> watch time) is Studio-UI only — it is not exposed through the YouTube API** `[ANECDOTAL —
> multiple secondary sources agree]`. The pipeline can *generate* three thumbnail
> candidates; a human has to upload them into the test.

**Default: extract 3 candidate frames with ffmpeg, have Claude pick and caption them, add
text with ffmpeg's `drawtext`. £0.**
**Upgrade trigger:** long-form CTR sitting below 2% (the bottom of YouTube's published
middle-50% band) after three uploads → generate proper composed thumbnails with Nano
Banana Pro at $0.134 each. Three variants per video, one video a week = **~$1.60/month**.

---

## 5. Posting and scheduling — the actual constraint

### 5.1 Platform-by-platform: what is programmatically possible

| Platform | Programmatic posting? | The catch |
|---|---|---|
| **TikTok** | **Yes, with a gate.** Content Posting API offers *direct post* and *inbox/draft upload* | **All content posted by unaudited clients is restricted to private viewing mode** — you must pass a TikTok audit (consent screens, UX compliance, correct draft-vs-direct handling) before an API post can be public. **Inbox/draft upload needs no audit**: the video lands in the creator's TikTok drafts and a human taps publish. `[DOCUMENTED]` ([TikTok Content Posting API](https://developers.tiktok.com/doc/content-posting-api-get-started/)) — requires the `video.publish` scope, which needs both app approval and user authorisation |
| **Instagram** | **Yes.** Content Publishing API, `media_type=REELS` | Requires an **Instagram professional (Business/Creator) account connected to a Facebook Page**; permissions `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`. **100 API-published posts per rolling 24 hours.** `[DOCUMENTED]` ([Meta content publishing docs](https://developers.facebook.com/docs/instagram-platform/content-publishing)). **The API caps Reels at 90 seconds while the native app allows 3 minutes** `[ANECDOTAL]` ([Postproxy](https://postproxy.dev/blog/instagram-reels-api-publishing-guide/)) |
| **Instagram Trial Reels** | **Partially.** `trialParams.graduationStrategy` is settable via some providers | **Graduation (promoting a winning trial to your followers) is not exposed by Meta's API — it must be done manually in the app.** Also needs **1,000 followers**, and the feature is rolled out per-account. `[ANECDOTAL]` ([Ayrshare IG docs](https://www.ayrshare.com/docs/apis/post/social-networks/instagram), [Metricool](https://help.metricool.com/en/article/how-to-publish-instagram-trial-reels-in-metricool-1kebdl1/)) |
| **YouTube** | **Yes.** Data API v3 `videos.insert` | Quota changed twice: `videos.insert` **dropped from ~1,600 units to ~100 units on 4 Dec 2025**, and since **1 June 2026 bills to its own dedicated daily bucket of ~100 calls** rather than the shared 10,000-unit pool `[ANECDOTAL — secondary reporting; verify in Google Cloud console before relying on it]` ([Phyllo](https://www.getphyllo.com/post/youtube-api-limits-how-to-calculate-api-usage-cost-and-fix-exceeded-api-quota), [SocialCrawl](https://www.socialcrawl.dev/blog/youtube-data-api-2026)). **Test & Compare is not in the API.** |
| **X / Twitter** | **Yes, pay-per-use.** | On **6 Feb 2026 X replaced tiered pricing with pay-per-use as the default; no free tier, and new developers cannot sign up for Basic or Pro.** Rates: **$0.015 per post created, $0.20 if it contains a URL**, $0.005/post read `[ANECDOTAL — several independent trackers agree]` ([Postproxy](https://postproxy.dev/blog/x-api-pricing-2026/), [wearefounders](https://www.wearefounders.uk/the-x-api-price-hike-a-blow-to-indie-hackers/)) |
| **LinkedIn** | **Effectively no.** | All API access requires LinkedIn Partner Program approval; posting automation is not available to general developers, and partner tier is priced in the thousands per month `[ANECDOTAL — consistent across sources]` ([Clura](https://clura.ai/blog/linkedin-api), [Phyllo](https://www.getphyllo.com/post/linkedin-api-ultimate-guide-on-linkedin-api-integration)) |
| **Reddit** | **Technically yes, practically no.** | Free tier is **100 QPM, OAuth required, and restricted to non-commercial use — monetising an app built on free-tier access violates the terms.** Self-service registration is closed; new OAuth tokens need manual approval on a 2–4 week timeline. Commercial tier: **$0.24/1K calls with a $12,000/year minimum** `[ANECDOTAL]` ([Postiz](https://postiz.com/blog/reddit-api-limits-rules-and-posting-restrictions-explained), [Octolens](https://octolens.com/blog/reddit-api-pricing)) |

**The one-line version: TikTok needs an audit or a human tap; Instagram and YouTube work
cleanly; X costs pennies per post; LinkedIn and Reddit are manual, permanently.**

### 5.2 Aggregators (one API, many platforms)

| Product | Price | MCP server? | Verdict |
|---|---|---|---|
| **Postiz (self-hosted)** | **£0** — AGPL-3.0, no feature gap vs cloud. Cloud from $29/mo | **Yes**, plus REST API, `@postiz/node` SDK, n8n/Make/Zapier | Covers 28+ platforms including TikTok, IG Reels, YouTube via the same official APIs the commercial tools use. ~29.6k GitHub stars, #1 on Product Hunt May 2026 `[ANECDOTAL — vendor/community sources]` ([Railway](https://railway.com/deploy/postiz), [TeqVolt](https://teqvolt.com/open-source/postiz-29-6k-star-open-source-social-scheduler-buffer-alternative)) |
| Blotato | **$29/mo flat**, API on every paid plan | **Yes**, hosted at `mcp.blotato.com/mcp` | The cheapest *hosted* option built for agents; 9 platforms `[ANECDOTAL — Blotato's own blog]` |
| Upload-Post | Free tier: **10 uploads/month**; paid from **$16/mo** annual, priced per connected profile | Yes | Free tier is enough to prototype, not to run `[ANECDOTAL]` |
| Late / Zernio | First 2 accounts free, then $6/account (3–10), $3 (11–100) | Yes | Usage-based; rebranded from Late in 2026 `[ANECDOTAL]` |
| PostForMe | from **$10/mo** for 1,000 posts | Yes | `[ANECDOTAL]` |
| **Ayrshare** | **$149/mo Premium, $299 Launch, $599 Business. No free plan in 2026 (28-day trial).** | Yes | Best-documented, 13 networks, publishing + analytics + comments + DMs in one API — **and roughly 5× our entire tooling budget** `[ANECDOTAL — pricing tracker]` ([social-api.ai](https://social-api.ai/blog/ayrshare-pricing-social-media-api-2026), [Zernio](https://zernio.com/alternatives/ayrshare)) |

> **An aggregator does not remove the platform gates.** Postiz, Blotato and Ayrshare all
> publish through the same official APIs underneath. TikTok's audit requirement, Instagram's
> 90-second API cap, and YouTube's upload quota apply identically whichever one you use.
> What you buy is one OAuth flow and one schema instead of four.

**Default: Postiz, self-hosted. £0.** It is the only option that is free, has a real API
*and* an MCP server (so a Claude agent can drive it directly), and does not put our
account tokens inside a third party's infrastructure.
**Trade-off:** we run and update a Next.js app and a Postgres database. That is real
ongoing maintenance, and if it breaks at 8am the publish queue stalls. Blotato at $29/mo
makes that someone else's problem.
**Upgrade trigger:** the first time a Postiz upgrade or outage costs more than an hour of
founder time, switch to **Blotato at $29/mo** — not Ayrshare. Ayrshare's $149 floor is
only justified if we are running many client accounts, which we are not.

---

## 6. Measurement and attribution

| Need | Tool | Price |
|---|---|---|
| **Install attribution** | **Apple App Store Connect — campaign links + Analytics Reports API** | **£0** |
| Subscription/revenue | RevenueCat | **Free below $2,500 monthly tracked revenue**, then 1% of MTR `[ANECDOTAL — pricing tracker]` ([costbench](https://costbench.com/software/subscription-billing/revenuecat/)). ⚠️ Attribution-partner integrations are gated behind a higher tier; **attribution collection is only available to accounts created after Sept '23 or on new-pricing plans** ([RevenueCat docs](https://www.revenuecat.com/docs/integrations/attribution)) |
| TikTok video metrics | TikTok Display API `POST /v2/video/list/` | £0 |
| Instagram metrics | Graph API `GET /{ig-media-id}/insights` | £0 |
| YouTube metrics | YouTube Analytics API | £0 |

**Apple is the important one.** On **25 March 2026 Apple shipped the largest update to
App Store Connect Analytics since launch** — 100+ new metrics, cohort analysis by download
date *and source*, and a **campaigns feature using URL-based campaign parameters that maps
traffic back to a specific campaign, capturing impressions, product page views, downloads,
usage, sales and subscriptions per token.** Bulk export is via the **Analytics Reports API**
as gzipped tab-delimited files; **per-campaign data is available only in the detailed
reports.** `[DOCUMENTED]` ([Apple: Analytics reports API](https://developer.apple.com/help/app-store-connect-analytics/overview/analytics-reports-api), [Apple: Acquisition](https://developer.apple.com/help/app-store-connect-analytics/acquisition/acquisition/))

**This gives us free, per-video install attribution with no MMP.** One campaign token per
video, exported weekly.

### What the platform APIs will *not* tell you

`[ANECDOTAL — but consistent]` TikTok's public API returns `view_count`, `like_count`,
`comment_count`, `share_count`, sometimes `collect_count`. **Watch time, For You Page
impressions, per-video reach and audience demographics are not available through any
public TikTok API** ([KeyAPI](https://www.keyapi.ai/blog/how-to-fetch-tiktok-user-data-video-metrics-api/)). These are point-in-time snapshots — to track a
video over time you must poll and store history yourself.

Instagram media insights (likes, reach, comments, plays, saves, shares) are **only
available for accounts with more than 1,000 followers** `[ANECDOTAL]`, and Meta deprecated
`profile_views`, `website_clicks`, and non-Reels `video_views` from Graph API v21 (8 Jan 2025).

**Consequence for the design:** for the first 1,000 followers on each account, the only
honest numbers we have are Apple's. Build the loop around installs-per-1,000-views (which
Apple + the platform view count give us) rather than around watch time (which we cannot
see).

---

## 7. What we are deliberately not buying, and why

| Not buying | Why |
|---|---|
| Ayrshare ($149/mo floor) | 5× the whole budget for one OAuth flow we can run ourselves |
| Remotion Automators ($100/mo minimum) | Motion-design capability our deliberately-unpolished house style does not want |
| Opus Clip / Klap / Vizard | Solves "find the good bit in a long video" — we record short clips on purpose |
| Submagic (until proven) | $41–69/mo for caption styling we can approximate in ffmpeg; free tier watermarks, which is a documented Instagram reach-killer |
| Any MMP (AppsFlyer, Branch, Adjust) | Apple's campaign tokens + Analytics Reports API are free and sufficient at our volume |
| Reddit commercial API ($12k/yr) | Post manually. It was always going to be manual. |
| Anti-detect browsers, proxy pools, multi-account tooling | Converts a reach problem into a ban problem — see `risks.md` §5 |

---

## 8. Running total

| Layer | Default | Monthly |
|---|---|---|
| Transcription | WhisperX, local | **£0** |
| Cutting | auto-editor + ffmpeg | **£0** |
| Captions | ffmpeg + `.ass` from word timings | **£0** |
| Render | ffmpeg | **£0** |
| Hooks / ideas / judgement | Claude (Opus 5 + Haiku 4.5, Batch API) | **~$3–5** |
| Thumbnails | ffmpeg frame extraction | **£0** |
| Scheduling / posting | Postiz self-hosted | **£0** (hosting only) |
| X posts | X API pay-per-use | ~$0.20/mo at 3 posts/wk without links |
| Attribution | Apple Analytics Reports API | **£0** |
| Revenue | RevenueCat free tier | **£0** below $2.5k MTR |
| **Total** | | **under $10/month** |

**First upgrade if any money appears: Blotato at $29/mo**, to stop maintaining Postiz.
Second: Submagic Business at ~$48/mo, but only if a caption-style A/B wins twice.

---

## Sources

- [TikTok — Content Posting API: Get Started](https://developers.tiktok.com/doc/content-posting-api-get-started/)
- [Meta — Instagram Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing)
- [Apple — Analytics reports API](https://developer.apple.com/help/app-store-connect-analytics/overview/analytics-reports-api) · [Acquisition](https://developer.apple.com/help/app-store-connect-analytics/acquisition/acquisition/)
- [RevenueCat — Attribution Providers](https://www.revenuecat.com/docs/integrations/attribution)
- [Postiz on Railway](https://railway.com/deploy/postiz) · [Postiz — Reddit API limits](https://postiz.com/blog/reddit-api-limits-rules-and-posting-restrictions-explained)
- [PostPeer — TikTok Content Posting API 2026](https://www.postpeer.dev/blog/best-tiktok-posting-api) · [TimeToPost](https://timetopost.co/blog/how-to-post-to-tiktok-api/)
- [Postproxy — X API pricing 2026](https://postproxy.dev/blog/x-api-pricing-2026/) · [Instagram Reels API publishing](https://postproxy.dev/blog/instagram-reels-api-publishing-guide/)
- [Clura — LinkedIn API: what's restricted](https://clura.ai/blog/linkedin-api)
- [AssemblyAI — Speech-to-text API pricing](https://www.assemblyai.com/blog/speech-to-text-api-pricing) · [Deepgram — Best STT APIs 2026](https://deepgram.com/learn/best-speech-to-text-apis-2026)
- [Descript — Video Editing API](https://www.descript.com/api) · [json2video — CapCut API alternative](https://json2video.com/how-to/capcut-api/)
- [fluxnote — Submagic pricing 2026](https://fluxnote.io/guides/submagic-pricing-2026)
- [Shotstack vs Remotion](https://shotstack.io/vs/remotion-alternatives/) · [json2video — Creatomate alternative](https://json2video.com/how-to/creatomate-alternative/)
- [pricepertoken — Gemini 3 Pro Image](https://pricepertoken.com/pricing-page/model/google-gemini-3-pro-image-preview)
- [Phyllo — YouTube API limits](https://www.getphyllo.com/post/youtube-api-limits-how-to-calculate-api-usage-cost-and-fix-exceeded-api-quota)
- [KeyAPI — TikTok user data & video metrics](https://www.keyapi.ai/blog/how-to-fetch-tiktok-user-data-video-metrics-api/)
- [social-api.ai — Ayrshare pricing 2026](https://social-api.ai/blog/ayrshare-pricing-social-media-api-2026)
