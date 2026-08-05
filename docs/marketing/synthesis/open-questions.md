# Open questions — what this research could NOT establish

**Compiled:** 2026-08-05. Wave 3 synthesis. The honest ledger of what the corpus does not know,
where the evidence is thin or anecdotal-only, and what would need a real-world experiment to
settle. Read this before betting the studio on any conclusion above.

**The framing that governs all of it:** every number in the Wave 1 bundles is drawn from an app
that *worked*, written up by a founder who was already good at distribution
(`failures/bootstrapped-baseline.md` §5). The unfiltered truth is $72/month at year one, a 17.3%
chance of ever reaching $1,000/month, and — for Pieter Levels, the most-cited indie alive — a
~5% hit rate across 70+ ventures. We are reasoning from the right tail of the distribution.

---

## 1. The single biggest gap: the factory's core bet is unproven by any case in the corpus

**The model is: founder-recorded, AI-edited, *organic*, *at volume*, on short-form video.
Nothing in the research validates that specific combination.**

- **No documented case exists of a bootstrapped app grown primarily by the founder's own
  organic Instagram/TikTok content.** Searched for specifically; found none with numbers
  (`platforms/instagram/case-studies.md`, "what I could not verify"). Every verified win was
  *paid* creator seeding (Cal AI's 250 creators, Umax's $50/creator), an *unpaid third party*
  (Widgetsmith, HabitKit/MKBHD), or an *in-product loop* (Hevy, Locket, Yuka).
- On YouTube the wins were organic — but they were *founder-face build-in-public* channels
  whose audience is other builders, or third-party reviews, not a factory posting demo edits at
  volume (`platforms/youtube/case-studies.md`).
- The closest real analogue, Adam Lyttle's portfolio, is *"become your own influencer"* —
  daily hobby content, not an AI-edited demo pipeline — and his own honest arithmetic is
  *"2 downloads per video"* (`platforms/tiktok/case-studies.md` §5).

**This is the gap that most threatens the whole marketing thesis, and only a real-world run can
close it.** See §8.

---

## 2. Whether AI-edited content is algorithmically penalised — disputed everywhere

Whether platforms *demote* AI-assisted content (even with real footage and a real voice) is
`[ANECDOTAL]` and contradicted across sources on every platform. What *is* documented is only
the user-facing "see less AI" controls (TikTok's "Manage topics," invisible watermarks) and the
*originality/inauthentic-content* policies that target sameness and duplication
(`platforms/tiktok/credibility.md`, `platforms/youtube/credibility.md`). We do not know whether
our pipeline's output — human-voiced, real-footage, agent-edited — reads as authentic or as slop
to the *ranking* systems. The reuse-cap and variance guards are theory, not measured.

## 3. Every ranking weight is unpublished; every multiplier online is invented

No platform publishes its ranking weights: not TikTok's signal hierarchy, not Instagram's
watch/likes/sends ordering, not YouTube's CTR/AVD/satisfaction weighting, not X's current
`params` module. The "3–5× sends," "comments 15× likes," "94% link penalty," "200–500 view test
pool," golden-hour, and warm-up claims are all folklore or single-vendor
(`platforms/*/algorithm.md`, §"open questions" throughout). We plan against *directions*
(retention and shares are safe; conversation beats amplification), never magnitudes.

## 4. The conversion baseline is a sample of one

**~0.5% view→install** — the number the whole volume plan rests on — comes from a **single**
published end-to-end funnel (LifePilot, n=1; `platforms/instagram/algorithm.md` §9). Our real
factory rate is unknown until Gate 0 instrumentation exists. Any plan assuming better than ~1%
without our own data is fiction.

## 5. Assumptions baked into the paid gates that we could not source

- The **0.7 paid-traffic haircut** in the CPI-ceiling formula is an assumption, "not a sourced
  figure" — replace with our measured organic-vs-paid RPI ratio once computable
  (`platforms/paid/triggers.md` §6).
- The **D1 ≥30% / D30 ≥8%** gates are adopted from a single anecdotal source (PickAppDuck),
  chosen because they're consistent with the failures, not because they're validated (`triggers.md` §2).
- Whether the App-Store download-velocity → organic-rank **halo** is real, and how big, is
  `[UNVERIFIED]` — "treat as an unpriced bonus, never the justification for a campaign" (`aso.md` §7).

## 6. Whether the factory's volume trips enforcement in practice — unknowable without running it

The corpus is emphatic that a multi-app studio posting at volume from shared infrastructure is
the exact signature Reddit's classifier (Redchecker: 2 accounts, 6 weeks) and TikTok's/YouTube's
originality regimes are built to catch (`failures/taxonomy.md` F8; `pipeline/risks.md`). But
whether *our specific* pipeline — real footage, real voice, per-account pattern budgets — stays
on the safe side is untested. The mitigations are designed against the policy text, not against
observed enforcement of our output.

## 7. Whether the founder-input model holds past week 9 — untested

The whole design rests on ~40 min/week of recording feeling sustainable. Founder-motivation
collapse is the most common indie failure (F15), and "40 min/week sounds small until week 9"
(`pipeline/risks.md` §5). We have no evidence the burden holds over months, or that the founder
sustains the un-automatable comment-reply load across multiple active accounts.

## 8. Platform-instability and stale-data risks we're carrying

- TikTok's **US algorithm is being retrained on US-only data** (USDS JV, Jan 2026); "nobody has
  a clean 2026 model of US distribution" — all small-account benchmarks are "possibly stale,"
  re-baseline quarterly (`platforms/tiktok/algorithm.md` §0).
- API terms are moving fast and mostly against us (X pay-per-use Feb 2026, YT quota cuts,
  TikTok audit gate, LinkedIn/Reddit effectively closed) — several tooling figures are
  `[ANECDOTAL]` vendor-sourced and need re-checking before any card is entered (`pipeline/tooling.md`).
- Micro-creator seeding ROI is documented **only from its winners** — "we do not know how many
  people spent $100 on two micro-creators and got nothing" (`failures/bootstrapped-baseline.md`
  §5). It's a lottery ticket with good odds, not a mechanism.

## 9. App-specific unknowns

- **pullup:** whether the *pull-up-only* niche has enough demonstrated demand for even organic
  short-form to matter is an open **product-demand** question, not just a marketing one — GOLDEN
  Bars shipped the near-exact concept and stalled at **7 ratings** (`apps/pullup/spec.md` §2).
  The 2–4×/week frequency also leaves the subscription model's viability unproven (spec's own
  gating caveat).
- **Which of the three apps lands is unpredictable** at a ~5% individual hit rate. The only
  coherent response is portfolio logic: enough cheap, well-executed attempts that the 5% has room
  to land (`failures/bootstrapped-baseline.md` §5).
- **ASO specifics** unverified: screenshot-text indexing (disputed), Apple AI-tag rollout breadth,
  the "89% conversion from 3→4 stars" magnitude (direction sound, number stale) (`platforms/paid/aso.md`).

---

## The experiments that would actually settle this

Ranked by how much they'd reduce the biggest unknowns, cheapest first.

1. **Run the pipeline on ONE app for 90 days (settles §1, §2, §4, §6).** Pick **skip-hero** — the
   purest 3-second visual reveal of the three, the best short-form fit. Ship Gate 0
   instrumentation first. Post **≥30 distinct videos per platform** (the sub-threshold-volume
   floor, F5) across IG Reels + YT Shorts + TikTok. Measure **installs-per-1,000-views by format**
   and **view→store→install→D7**. The single question: *does founder-organic, AI-edited short-form
   clear even the ~0.5% baseline, and does any format beat installs-per-1k-views of zero?* This is
   the only way to test the core bet, and it is cheap.
2. **A/B the anti-slop hypothesis (settles §2).** Run matched cuts — founder-voice real-footage vs
   the same edit degraded toward "generic template" — through IG Trial Reels (free, 24h read).
   Does the ranking system actually distinguish them?
3. **Measure our own paid-vs-organic RPI ratio (settles §5)** the first time any app clears Gate 1,
   to replace the assumed 0.7 haircut.
4. **Stress-test the volume/enforcement boundary deliberately (settles §6)** on a low-stakes app:
   push reuse and cadence to the documented limits and watch for the silent search-restriction
   notice, so the real threshold is learned on an app we can afford to lose, not the flagship.

Everything else in this research is well-sourced enough to act on. These four are where the
studio is currently betting on inference, and each is a bet only a real-world run can price.
