# Founder-footage validation (2026-08-02)

Founder sent real garden footage to validate on "impromptu angles." **Only 1 of 2
videos arrived** — the `.mp4` (14MB). The second, `IMG_0451.MOV` (Slack fileId
F0BMG8C6JMQ), did not resolve to disk; awaiting re-share.

## What the arrived video actually is
Inspected frames (t=3s,9s,16s,27s): it is **pushups on a low bar**, filmed with the
phone **on the ground pointing near-straight up** (extreme worm's-eye angle, heavy
foreshortening). It also contains non-exercise portions — a close-up while positioning
the phone (t≈3s, face + one arm fill the frame) and standing/rest between sets.

## Result — and how to read it
`posespike` on this clip (954 frames, 31.8s):
- "at least one wrist ≥0.3": **66.8%** of frames (vs ~100% on the clean front-on stock
  clips). Per-joint ≥0.3: nose 48%, wrists 52–66%, elbows 57–66%, hips ~47%.
- Rep/ROM output is **noise here and must not be read as form metrics**: the analyzer is
  pullup-specific (nose-Y "chin-over-bar" peak detection, elbow ROM dead-hang→top). A
  pushup is a different plane, so the 11 "reps" / negative ROMs are the analyzer applied
  to the wrong exercise, NOT a Vision failure.

## Transferable finding (this is the useful part)
The raw upper-body tracking is **usable more often than not even at this bad angle**
(wrist conf 0.77–0.85 at several genuine pushup positions), but it **drops out** during
(a) the close-up phone-setup frames and (b) the steepest foreshortened extremes — pulling
the usable rate to ~67%. The clean front-on/¾ framing of the stock clips held ~100%.

**Conclusion:** does NOT change the core-mechanic verdict (VALIDATED on well-framed
pullups). It adds a real-world requirement:
1. In-app **framing guide** (stand the phone up, ~front/¾, full body + bar in frame) —
   casual ground-angle + close-ups measurably degrade tracking.
2. A **confidence gate** that ignores setup frames and tells the user to reframe when
   joint confidence is low, rather than logging garbage reps.

**Cannot validate the pullup mechanic on a pushup video.** Need `IMG_0451.MOV`
(the pullup clip) to run the authoritative pullup test.

---

## Second video (IMG_0455.MOV — "pull-ups then pushups"), fetched via Slack files API

122s / 3668 frames. Inspected frames across the clip. **Filmed from BEHIND** — camera on
the ground behind him, looking up at his back while he faces a wall-mounted pull-up bar.
First ~20s is setup/crouching at the lens; actual pull-ups are rear-view; pushups + rest
later.

`posespike` result — and why:
- nose >=0.3 in **3.6%** of frames. Cause: **face is away from the camera** (we see the
  back of his head). This *kills the nose-based chin-over-bar metric* outright.
- wrists 44-61%, elbows/shoulders/hips ~67%. Body joints track from behind, but wrist
  detection at this low/rear angle + brick background is intermittent; rep-tops repeatedly
  hit wristConf 0.000. chin-over-bar detected 1/10.
- rep/ROM output is unreliable here (nose-driven segmentation fails from behind).

## Honest overall read of the founder's two clips
Neither is a clean front/¾ pull-up: clip 1 = pushups (phone flat on ground, worm's-eye);
clip 2 = pull-ups **from behind**. So they do NOT confirm the core mechanic on the
founder's own setup — instead they surface the real-world **capture constraints**:

1. **Orientation is a hard requirement.** Chin-over-bar via the nose needs the face
   visible → user must face the camera (front/¾). From behind, nose is undetectable and
   that metric is impossible; a rear-view mode would need a different signal (wrist/hand
   vertical travel vs shoulder, or bar-line crossing), not the nose.
2. **Framing/angle.** Ground-level + close-up setup frames + extreme foreshortening drop
   usable tracking to ~44-67%. Front-on stock clips held ~100%.
3. Implication: v1 MUST ship a capture guide (phone upright, front/¾, face + full body +
   bar in frame) and a live confidence/orientation gate, or metrics degrade badly.

**Verdict update:** core feasibility still VALIDATED on well-framed pull-ups (stock), but
downgraded to **PARTIAL for real "impromptu" capture** — the capture UX is now a
first-class requirement, not a nice-to-have. Still need ONE clean front/¾ pull-up clip
(face visible) to validate the founder's actual conditions end-to-end.
