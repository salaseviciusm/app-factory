#!/usr/bin/env python3
# analyze.py — turn per-frame pose CSV into pullup form signal.
# Pure stdlib (no numpy on this box). Usage: python3 analyze.py clipA.csv
import sys, csv, math

CONF = 0.30  # "usable" confidence threshold
path = sys.argv[1]

rows = []
with open(path) as f:
    r = csv.DictReader(f)
    for row in r:
        rows.append(row)

def g(row, name):
    return (float(row[f"{name}_conf"]), float(row[f"{name}_x"]), float(row[f"{name}_y"]))

def angle(a, b, c):
    # angle at b formed by a-b-c, in degrees; None if any missing
    if a is None or b is None or c is None: return None
    v1 = (a[1]-b[1], a[2]-b[2]); v2 = (c[1]-b[1], c[2]-b[2])
    d = v1[0]*v2[0]+v1[1]*v2[1]
    n1 = math.hypot(*v1); n2 = math.hypot(*v2)
    if n1==0 or n2==0: return None
    cs = max(-1,min(1, d/(n1*n2)))
    return math.degrees(math.acos(cs))

KEY = ["nose","lSho","rSho","lElb","rElb","lWri","rWri","lHip","rHip"]
WRISTS = ["lWri","rWri"]; ELBOWS=["lElb","rElb"]; SHO=["lSho","rSho"]

n = len(rows)
allkey_ok = 0
wrist_ok = 0
per_joint_ok = {k:0 for k in KEY}
noseY=[]; wristY=[]; elbowAngle=[]; times=[]; wristConf=[]; noseConf=[]

for row in rows:
    vals = {k:g(row,k) for k in KEY}
    times.append(float(row["t_sec"]))
    ok_all = all(vals[k][0] >= CONF for k in KEY)
    if ok_all: allkey_ok += 1
    for k in KEY:
        if vals[k][0] >= CONF: per_joint_ok[k]+=1
    # wrist tracked if either wrist confident
    if max(vals["lWri"][0], vals["rWri"][0]) >= CONF: wrist_ok += 1

    # nose y (or fallback to mid-shoulder if nose missing)
    ny = vals["nose"][2] if vals["nose"][0]>=CONF else None
    noseY.append(ny); noseConf.append(vals["nose"][0])
    # mean wrist y over confident wrists
    wy=[vals[w][2] for w in WRISTS if vals[w][0]>=CONF]
    wristY.append(sum(wy)/len(wy) if wy else None)
    wristConf.append(max(vals["lWri"][0], vals["rWri"][0]))
    # elbow angle: prefer side with both sho+elb+wri confident, average available
    angs=[]
    for s,e,w in [("lSho","lElb","lWri"),("rSho","rElb","rWri")]:
        if vals[s][0]>=CONF and vals[e][0]>=CONF and vals[w][0]>=CONF:
            a=angle(vals[s],vals[e],vals[w])
            if a is not None: angs.append(a)
    elbowAngle.append(sum(angs)/len(angs) if angs else None)

print(f"=== {path} ===")
print(f"frames: {n}   duration: {times[-1]:.2f}s")
print(f"all {len(KEY)} key joints >= {CONF}: {allkey_ok}/{n} = {100*allkey_ok/n:.1f}%")
print(f"at least one wrist >= {CONF}:        {wrist_ok}/{n} = {100*wrist_ok/n:.1f}%")
print("per-joint frames >= %.2f:" % CONF)
for k in KEY:
    print(f"   {k:5s}: {per_joint_ok[k]:4d}/{n} = {100*per_joint_ok[k]/n:5.1f}%")

# --- rep segmentation via nose Y (Vision y-up: nose HIGH = top of pullup) ---
# Use elbow angle as primary signal: small angle = flexed = top of rep.
# Build a clean series (carry-forward for short gaps).
def carry(series):
    out=[]; last=None
    for v in series:
        if v is not None: last=v
        out.append(last)
    return out

ea = carry(elbowAngle)
ny = carry(noseY)
wy = carry(wristY)

# Detect reps: nose crosses up toward wrists then back. Use nose Y peaks.
# A "top" is a local max of noseY (nose highest). A rep = valley->peak->valley.
valid_idx = [i for i in range(n) if ny[i] is not None]
if len(valid_idx) < 5:
    print("insufficient nose tracking to segment reps")
    sys.exit(0)

# smooth nose Y with a small moving average
def smooth(series, k=3):
    out=[]
    for i in range(len(series)):
        w=[series[j] for j in range(max(0,i-k),min(len(series),i+k+1)) if series[j] is not None]
        out.append(sum(w)/len(w) if w else None)
    return out
sny = smooth(ny, 3)

# find peaks (top of rep = nose Y local maximum) with prominence
peaks=[]
lo = min(v for v in sny if v is not None); hi=max(v for v in sny if v is not None)
rng = hi-lo
thresh_hi = lo + 0.55*rng   # must rise into top 45% band to count as a rep top
i=1
while i < n-1:
    if sny[i] is None: i+=1; continue
    if sny[i] >= (sny[i-1] or -9) and sny[i] > (sny[i+1] or -9) and sny[i] >= thresh_hi:
        # find local window max
        peaks.append(i)
        i += 8  # min spacing between reps (~0.33s)
    else:
        i+=1

print(f"\nnose-Y range: {lo:.3f}..{hi:.3f} (span {rng:.3f})   rep-top band >= {thresh_hi:.3f}")
print(f"detected rep tops (peaks): {len(peaks)} at frames {peaks}")

# For each peak (top of rep), report tracking at the top specifically.
print("\n--- TOP-OF-REP tracking (the occlusion stress point) ---")
print("peak_frame  t_sec  nose_y  wrist_y  chin_over_bar  elbow_ang  noseConf  wristConf  allkeyOK")
top_wristconf=[]; top_allok=0; chin_over=0
for p in peaks:
    # examine a 3-frame window around the peak, take the frame with max nose Y
    w=range(max(0,p-2),min(n,p+3))
    pk=max(w, key=lambda j: (sny[j] if sny[j] is not None else -9))
    row=rows[pk]
    vals={k:g(row,k) for k in KEY}
    nyv = vals["nose"][2] if vals["nose"][0]>=CONF else float('nan')
    wyv = wy[pk] if wy[pk] is not None else float('nan')
    cob = (nyv >= wyv) if (nyv==nyv and wyv==wyv) else False  # nose at/above wrists
    if cob: chin_over+=1
    eav = ea[pk] if ea[pk] is not None else float('nan')
    ncf = vals["nose"][0]; wcf=max(vals["lWri"][0],vals["rWri"][0])
    top_wristconf.append(wcf)
    allok = all(vals[k][0]>=CONF for k in KEY)
    if allok: top_allok+=1
    print(f"  {pk:5d}    {float(row['t_sec']):5.2f}  {nyv:6.3f}  {wyv:6.3f}    {str(cob):5s}       {eav:6.1f}    {ncf:.3f}     {wcf:.3f}     {allok}")

if peaks:
    print(f"\ntop-of-rep summary: reps={len(peaks)}  chin-over-bar detected={chin_over}/{len(peaks)}")
    print(f"  wrist conf at top: min={min(top_wristconf):.3f} max={max(top_wristconf):.3f} mean={sum(top_wristconf)/len(top_wristconf):.3f}")
    print(f"  all-key-joints usable at top: {top_allok}/{len(peaks)}")

# Per-rep ROM: elbow angle range and nose-Y travel between consecutive valleys around each peak
print("\n--- per-rep ROM (elbow angle & nose-Y travel) ---")
# find valleys (bottom = nose Y low) between peaks
def valley_between(a,b):
    seg=[(j,sny[j]) for j in range(a,b) if sny[j] is not None]
    if not seg: return None
    return min(seg,key=lambda x:x[1])[0]
bounds=[0]+peaks+[n-1]
print("rep  bottomFrame->topFrame  noseY_travel  elbowAng@bottom  elbowAng@top  elbow_ROM")
for r,p in enumerate(peaks):
    a = valley_between(bounds[r], p) if r < len(peaks) else None
    b = valley_between(p, bounds[r+2] if r+2<len(bounds) else n-1)
    if a is None: a=max(0,p-10)
    nt = (sny[p]-sny[a]) if (sny[p] and sny[a]) else float('nan')
    eb = ea[a] if ea[a] is not None else float('nan')
    et = ea[p] if ea[p] is not None else float('nan')
    rom = (eb-et) if (eb==eb and et==et) else float('nan')
    print(f" {r+1:2d}   {a:4d}->{p:<4d}          {nt:6.3f}       {eb:6.1f}         {et:6.1f}      {rom:6.1f}")
