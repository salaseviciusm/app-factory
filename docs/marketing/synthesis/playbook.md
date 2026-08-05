# The operating playbook — what the factory does, week to week

**Compiled:** 2026-08-05. Wave 3 synthesis. The end-to-end operating rhythm, assembled from
`pipeline/design.md`, `pipeline/feedback-loop.md`, `pipeline/risks.md`, the credibility docs,
and the failure taxonomy. Cheapest-viable-step-first, with named upgrade triggers.

**The conclusion first.** Each week the factory runs one loop: an agent proposes a shot list
Sunday night → the founder records ~40 minutes of demos and approves → agents edit, caption,
render, self-review, and queue everything → the founder taps approve on each video and answers
comments → agents measure and feed the results back into next week's shot list. **The founder's
only irreplaceable inputs are recording (~40 min/wk), the two approval gates (~5 min/wk), and
every reply/comment (the one thing that cannot be automated and the one that matters most).**
Everything else runs unattended for under $10/month.

---

## 1. The weekly loop (the default state)

```
Sun 17:00  Agent reads last week's metrics + comments + query inventory → drafts 8–15 shots
Sun 17:30  Founder trims/approves the shot list in Slack (Human Gate 1) — ~10 min
Mon–Tue    Founder records 8–15 distinct raw clips into ~/factory-media/inbox/ — ~40 min
(continuous) Watcher spawns one edit run per clip: ingest → cut → variants → render → anti-slop review
(per clip)  Founder taps approve on the rendered MP4 in Slack (Human Gate 2) — ~20s each
(dripped)   Postiz queues approved posts across the week per platform cadence
Daily       Founder answers comments in the first ~2h after each post — the install funnel
Nightly     Agent pulls per-post metrics → telemetry.db
Sun 16:00   Agent writes the weekly report → becomes the first input to the next shot list
```

Source: `pipeline/design.md` §1. Founder time: **~40 min recording + ~5 min gates + comment
replies.** Build order if it can't all ship at once: the `content-pipeline` script + watcher
first, then the review/preview gate, then the weekly brief, then Postiz, then the report
(`pipeline/design.md` §5).

---

## 2. The founder's input burden — exactly what he must supply, and how often

This is the load-bearing constraint. The whole model exists to keep it small and keep it *him*.

| Task | Cadence | Time | Why it's his and not an agent's |
|---|---|---|---|
| **Record demo clips** | Weekly | ~40 min | Real screen recording, real voice, real hands. 8–15 *distinct* clips (different feature/bug/question), **never one clip cut 15 ways** — that is the originality-policy trap. A stumble is a feature (authenticity). `credibility` docs |
| **Human Gate 1** (shot list) | Weekly | ~10 min | Specificity is the cheapest anti-slop signal and the founder is its only source (`pipeline/design.md` §2) |
| **Human Gate 2** (approve renders) | Per video | ~20s each | "If it can't survive 20s of the founder's attention, it won't survive a viewer's 2." `run.auto` is **never** enabled on content-cut (`pipeline/risks.md` §5) |
| **Replies & comments** | Daily, first ~2h | ~15–30 min/active account | The comment section is the only in-video path to the App Store on TikTok/IG; automated replies are a documented ban/reach risk on every platform (`pipeline/risks.md` §1, §5) |

**What he records, concretely** (the weekly shot mix, from `pipeline/design.md` §1): 5–7
search-query answers, 5–7 comment-reply videos (≥1/day — unambiguously original, self-hooking),
1–2 "something broke" (a bug/bad review/limitation — the authenticity anchor), 1–2 genuinely
new features. **Volume comes from more raw footage, not more permutations of the same footage.**

---

## 3. What agents do unattended

Everything between the two gates (`pipeline/design.md` §2–3; `pipeline/tooling.md`):

- **Ideate** — read metrics, unanswered comments, the search-query inventory, and the reuse
  ledger; draft the shot list (Opus 5, Batch API, ~$1/wk).
- **Ingest / cut / render** — WhisperX transcripts, auto-editor silence trim (conservative —
  we cut dead air, not breath), ffmpeg per-platform masters, `.ass` captions burned from word
  timings. All local, £0.
- **Variants** — 3 hook candidates (for the founder's *own words*, never invented claims),
  plain-language caption, on-screen search query, pinned-comment App Store string, YT
  description with tracked campaign token. Never generates voice, faces, scenes, or numbers.
- **Anti-slop review** — the merged credibility checklist as a reviewer prompt; any hard-block
  fail loops back to variants up to 3× *before* the founder ever sees it (`pipeline/design.md` §8).
- **Schedule / post** — Postiz queue, dripped across the week. TikTok via **draft upload +
  human tap** (no audit); IG/YT via API; X link-in-reply; **LinkedIn and Reddit are manual,
  always** (`pipeline/risks.md` §2).
- **Measure** — nightly metrics pull, weekly per-format report.

**Hard automation boundary (enforced at the credential scope, not in a prompt):** the pipeline
has **no write access to comment or DM endpoints** (`pipeline/risks.md` §5).

---

## 4. Cadence per platform

From the platform research, reconciled in `pipeline/design.md` §10:

| Platform | Cadence | Note |
|---|---|---|
| **TikTok** | 2–3/day after a **1-week ramp at ~1/day** | Inside TikTok's own 1–4/day guidance; ramp removes the only plausible new-account risk |
| **Instagram Reels** | 5–8/week | Buffer band; the real ceiling is *sameness*, not frequency |
| **YouTube Shorts** | 4–7/week | "Shorts cannot hurt long-form" — safe to ship freely *if each has a distinct premise* |
| **YouTube long-form** | 1/week, sustained | Cadence does not buy reach; consistency does. Each must target a real query |
| **X** | 2–3/week, only when something real happened | Brand/BD only, never counted as acquisition |
| **Reddit** | Manual, participation-only | 3–5 h/wk by a named person, two or three communities, 6-month runway |

Scheduling is a Postiz queue, so a Sunday recording session drips out across the week rather
than dumping 15 videos on Monday.

---

## 5. The engagement / community loop

- **Answer every comment in the first ~2h**, then daily. Answer the question asked, in one
  line. **Pin one comment with the exact App Store search string** (organic captions aren't
  clickable). Never delete criticism (`platforms/tiktok/credibility.md` §5).
- **Every good comment question becomes tomorrow's comment-reply video** — free, original,
  self-hooking content derived from real demand (`pipeline/feedback-loop.md` §5).
- **Reddit:** one named person, persistent account, disclose authorship every time, weight
  comments over posts ~20:1, use the formats communities invite (r/AppHookup, weekly threads,
  r/SideProject show-and-tell). Never automate, never solicit votes, never post LLM text under
  a human name (`platforms/communities/credibility.md`).
- **The relationship half of this is un-automatable and is where the ranking weight lives.**
  Budget it as founder time, not pipeline time.

---

## 6. The single diagnostic and the metrics that gate paid

**The one number:** **installs per 1,000 views, per content format** — not views. A 12K-view
video with 80 installs beats a 400K-view one with 10 (`pipeline/feedback-loop.md`). Plan volume
against **~0.5% view→install** until our own data says otherwise (the only published end-to-end
funnel; `platforms/instagram/algorithm.md` §9).

**Escalation to paid is gated, in order** (`platforms/paid/triggers.md` §1–4):

1. **Gate 0 — instrumentation (binary).** An immutable `acquisition` envelope block, an
   `app-install-attributed` event, AdServices token / Play Install Referrer, and **RPI by
   cohort-day (D0/D7/D30/D60)**. *No acquisition dimension, no spend.* This is app work, shipped
   as a `feature-dev` run **before** the pipeline goes live.
2. **Gate 1 — organic evidence (all six):** rating ≥4.0 with ≥20 recent; D1 ≥30%; D30 ≥8% and
   flattening; ≥300 organic installs over ≥60 days; ASO complete (title/subtitle/keywords, ≥1
   PPO test, ≥1 CPP, tags reviewed); ≥1 organic channel producing installs.
3. **Gate 2 — monetisation shape:** hard paywall with organic **D60 RPI ≥ £1** (freemium apps
   never get a paid budget — the CPI ceiling is ~£0.10).
4. **Then, and only then:** £100 Reddit hook test → £500 Apple Ads UK exact-match + CPP → £2,000
   scale the one cluster that cleared + buy UGC files. Measure with **RPM vs CPM**, not CPI.

---

## 7. Kill / pivot triggers (write them down before, not after)

**The weekly scorecard** (`failures/taxonomy.md`), one table per app:

| Trip | Threshold | Action |
|---|---|---|
| Days from store approval → first content | > 3 | You have no distribution plan (F1) |
| Views → link clicks | < 1% | Wrong-intent audience; rewrite hook to the *moment of pain*, re-test 10 posts (F2) |
| Comments per post over 10+ posts | 0 | Nobody was close to installing (F2) |
| Store impressions → downloads | < 15% | Broken funnel downstream; check the listing in every locale (F4) |
| Posts before any conclusion | < 30 | Sub-threshold volume; any conclusion is void (F5) |
| D7 retention | below ~11–13% median | Don't push reach into a leaky product (F6) |
| Share of posts mentioning the product / link ratio (per account) | > 60% / > 50% | Reddit ban signature (F8) |
| MoM MRR growth, months 3–8 | < 10% for 2 months | The dead zone (F14) |
| Content published per week | 0 for 2 weeks | Founder-motivation collapse (F15) |

**Named pivot/kill decisions:**
- **Rating drops ≥ 0.2 in a week →** stop any paid **the same day** (the meditation-app failure).
- **TikTok "restricted in search results" notice →** originality budget exceeded; cut to 1
  source clip per video and 1 post/day for two weeks; audit the reuse ledger.
- **YPP eligibility lost →** loudest possible slop alarm; stop the pipeline, re-read the three
  inauthentic-content categories against the last 30 uploads.
- **Per-app kill:** ≥300 organic installs over ≥60 days **and** D30 retention <8% and falling
  → the content is not the problem and more content won't fix it. Route to product or kill the
  app (`pipeline/feedback-loop.md` §6).
- **Month-3 review, scheduled at launch:** four pre-agreed outcomes — continue / change price /
  change positioning / kill. The single most valuable process artifact for a portfolio studio,
  because the founder's attention will be on the newest app (`failures/taxonomy.md` F14).

**Set expectations at the median, not the case study:** an app at $150/month in month two is
*above* market median ($72/mo at year one). A flat months-3–8 stretch is the modal path, not a
failure (`failures/bootstrapped-baseline.md`).

---

## 8. Cheapest-viable-first, with the upgrade triggers

| Layer | Default (now) | Cost | Upgrade trigger |
|---|---|---|---|
| Edit / caption / render | WhisperX + auto-editor + ffmpeg, local | £0 | Transcription blocks a same-day publish → AssemblyAI $0.21/hr |
| Captions | `.ass` from word timings | £0 | A Submagic-styled cut wins a Trial-Reels A/B **twice** → Submagic Business ~$48/mo |
| Posting | Postiz, self-hosted | £0 | A Postiz outage costs >1h founder time → Blotato $29/mo |
| LLM (hooks/ideas/review) | Opus 5 + Haiku 4.5, Batch API | ~$3–5/mo | none — cheapest part of the stack |
| Attribution | Apple Analytics Reports API (campaign token per video) | £0 | Spending £5k+/mo across 2+ non-Apple networks → an MMP |
| **Distribution tactic** | Founder-organic short-form | £0 | An app clears **Gate 1** *and* has a 3-second reveal → test **$50 micro-creator seeding** (the single most affordable proven tactic in the corpus) |
| **Paid** | £0 | — | Gates 0–2 pass → £100 Reddit → £500 Apple Ads UK → £2,000 scale one thing |

Total default tooling cost: **under $10/month** (`pipeline/tooling.md` §8).

**Always-do, on every app, regardless of stage** (the cheapest marketing there is, and the
only fully-automatable-across-the-portfolio lever — `failures/bootstrapped-baseline.md` M6):
**PPP pricing + full store localisation.** One-day tasks, documented immediate effect.

**Standing capability worth building** (M5): watch App Store policy changes and competitor
collapses; a factory can be *ready to ship into a window* in a way a solo founder can't (Delta,
UpScrolled).

---

## 9. The playbook in one paragraph

Every week an agent proposes shots from last week's numbers; the founder records ~40 minutes of
real demos in his own voice and approves the list; agents cut, caption, render, self-review, and
queue one distinct video per clip across IG Reels, YT Shorts and TikTok (with a slow YouTube
long-form + third-party-review motion running in parallel); the founder approves each render in
20 seconds and answers every comment himself; agents measure installs-per-1,000-views by format
and feed the winners — capped by a novelty penalty so the pipeline can't collapse onto one
template — back into next week's shots. Paid stays at £0 until an app proves a rating ≥4.0, D1
≥30%, D30 ≥8% flattening, 300 organic installs and a hard paywall clearing £1 D60 RPI. The store
listing, PPP pricing and localisation are done first and always. And a month-3 review is on the
calendar for every app before it launches, because the dangerous period is the quiet months, not
the loud week.
