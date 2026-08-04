#!/usr/bin/env python3
# analyze3d.py — pure-stdlib analyzer for spike 002 (3D pose).
# Reads a pose3dspike CSV and computes, using 3D joint positions (meters):
#   - % of frames with a usable 3D skeleton (observation returned)
#   - % of frames with a usable 3D elbow angle (shoulder-elbow-wrist, both arms)
#   - elbow-angle range across the tracked segment / per rep
#   - a FACE-INDEPENDENT chin-over-bar proxy: mean wrist.y - head.y  (meters)
#   - simple rep segmentation from the head-vs-wrist proxy trajectory
import sys, csv, math

def load(path):
    rows = []
    with open(path) as f:
        r = csv.DictReader(f)
        for row in r:
            rows.append(row)
    return rows

def vec(row, j):
    if row.get(j+"_p") != "1":
        return None
    return (float(row[j+"_x"]), float(row[j+"_y"]), float(row[j+"_z"]))

def angle(a, b, c):
    # angle at b (degrees) between BA and BC in 3D
    if a is None or b is None or c is None: return None
    ba = (a[0]-b[0], a[1]-b[1], a[2]-b[2])
    bc = (c[0]-b[0], c[1]-b[1], c[2]-b[2])
    na = math.sqrt(sum(x*x for x in ba)); nc = math.sqrt(sum(x*x for x in bc))
    if na == 0 or nc == 0: return None
    d = sum(ba[i]*bc[i] for i in range(3))/(na*nc)
    d = max(-1.0, min(1.0, d))
    return math.degrees(math.acos(d))

def main(path):
    rows = load(path)
    total = len(rows)
    obs = [r for r in rows if r["has_obs"] == "1"]
    print(f"=== {path} ===")
    print(f"frames sampled: {total}")
    print(f"frames with 3D skeleton (observation): {len(obs)} ({100*len(obs)/max(1,total):.1f}%)")

    # elbow angle per frame (mean of the two arms when both available; else the one present)
    series = []  # (t, elbowMean, proxy(meanWristY - headY), headY)
    n_elbow = 0
    for r in obs:
        t = float(r["t_sec"])
        lE = angle(vec(r,"lSho"), vec(r,"lElb"), vec(r,"lWri"))
        rE = angle(vec(r,"rSho"), vec(r,"rElb"), vec(r,"rWri"))
        elbs = [x for x in (lE, rE) if x is not None]
        elbowMean = sum(elbs)/len(elbs) if elbs else None
        if elbowMean is not None: n_elbow += 1
        head = vec(r,"head")
        lW = vec(r,"lWri"); rW = vec(r,"rWri")
        wy = [w[1] for w in (lW,rW) if w is not None]
        proxy = None
        if head is not None and wy:
            proxy = (sum(wy)/len(wy)) - head[1]   # >0 hands above head (hang); ~0 or <0 chin at/over bar
        series.append((t, elbowMean, proxy, head[1] if head else None))
    print(f"frames with usable 3D ELBOW angle: {n_elbow} ({100*n_elbow/max(1,total):.1f}% of sampled, {100*n_elbow/max(1,len(obs)):.1f}% of tracked)")

    elbvals = [s[1] for s in series if s[1] is not None]
    if elbvals:
        print(f"elbow angle over tracked segment: min={min(elbvals):.1f}  max={max(elbvals):.1f}  range={max(elbvals)-min(elbvals):.1f} deg")
    proxvals = [s[2] for s in series if s[2] is not None]
    n_proxy = len(proxvals)
    print(f"frames with FACE-INDEPENDENT head-vs-wrist proxy: {n_proxy} ({100*n_proxy/max(1,len(obs)):.1f}% of tracked)")
    if proxvals:
        print(f"proxy (mean wrist.y - head.y, meters): min={min(proxvals):.3f} max={max(proxvals):.3f}  (larger=dead-hang, smaller/neg=chin approaching bar)")

    # crude rep segmentation on the proxy: a rep = proxy goes high (hang) -> low (top) -> high
    # detect local minima of proxy (top of pull) with prominence
    ts = [s[0] for s in series if s[2] is not None]
    pv = [s[2] for s in series if s[2] is not None]
    reps = segment_reps(ts, pv)
    print(f"reps auto-detected from proxy minima: {len(reps)}")
    for i,(t0,tmin,t1,ptop,phang,eattop) in enumerate(reps):
        print(f"  rep {i+1}: ~{t0:.1f}-{t1:.1f}s  top@{tmin:.1f}s  proxy top={ptop:.3f} hang~={phang:.3f} (drop={phang-ptop:.3f}m)")
    # elbow ROM per rep
    for i,(t0,tmin,t1,ptop,phang,eattop) in enumerate(reps):
        seg = [s[1] for s in series if s[1] is not None and t0<=s[0]<=t1]
        if seg:
            print(f"  rep {i+1} elbow ROM: min={min(seg):.1f} max={max(seg):.1f} range={max(seg)-min(seg):.1f} deg")

def segment_reps(ts, pv):
    # smooth
    if len(pv) < 5: return []
    sm = []
    for i in range(len(pv)):
        lo=max(0,i-1); hi=min(len(pv),i+2)
        sm.append(sum(pv[lo:hi])/(hi-lo))
    mn, mx = min(sm), max(sm)
    span = mx - mn
    if span < 0.05: return []
    # a "top" is where proxy dips below mn + 0.35*span; group consecutive
    thr = mn + 0.35*span
    reps = []
    i = 0
    n = len(sm)
    in_top = False
    start = 0
    for i in range(n):
        if sm[i] < thr and not in_top:
            in_top = True; start = i
        elif sm[i] >= thr and in_top:
            in_top = False
            seg = sm[start:i]
            j = start + seg.index(min(seg))
            reps.append((ts[max(0,start-1)], ts[j], ts[min(n-1,i)], min(seg), mx, None))
    if in_top:
        seg = sm[start:n]; j = start+seg.index(min(seg))
        reps.append((ts[max(0,start-1)], ts[j], ts[n-1], min(seg), mx, None))
    return reps

if __name__ == "__main__":
    main(sys.argv[1])
