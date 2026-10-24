import json
from pathlib import Path
from collections import Counter

RAW = Path(__file__).resolve().parents[1] / "data" / "geojson" / "kabupaten_raw.json"

with RAW.open(encoding="utf-8") as f:
    fc = json.load(f)

feats = fc["features"]
print(f"total fitur: {len(feats)}")

def props(f):
    return f.get("properties") or {}

# field apa saja yang ada
all_keys = Counter()
for f in feats:
    all_keys.update(props(f).keys())
print("\nfield yang muncul (urut frekuensi):")
for k, v in all_keys.most_common():
    print(f"  {k}: {v}")

# cek KDPKAB kosong / bukan string
def kdp(f):
    v = props(f).get("KDPKAB")
    return None if v is None else str(v).strip()

empty = [i for i, f in enumerate(feats) if not kdp(f)]
print(f"\nfitur KDPKAB kosong/None: {len(empty)} -> indeks {empty}")

# duplikat KDPKAB
codes = [kdp(f) for f in feats if kdp(f)]
dupes = [c for c, n in Counter(codes).items() if n > 1]
print(f"\nKDPKAB duplikat: {dupes}")
for d in dupes:
    for i, f in enumerate(feats):
        if kdp(f) == d:
            g = f.get("geometry")
            n_pts = 0
            if g and g.get("coordinates"):
                # hitung kasar jumlah titik
                def count(c):
                    if isinstance(c[0], (int, float)):
                        return 1
                    return sum(count(x) for x in c)
                n_pts = count(g["coordinates"])
            print(f"  idx={i} KDPKAB={d} NAMOBJ={props(f).get('NAMOBJ')!r} "
                  f"WADMKK={props(f).get('WADMKK')!r} geometry={'ADA' if g else 'None'} "
                  f"n_pts={n_pts}")

# fitur tanpa geometry
no_geom = [(i, kdp(f), props(f).get("WADMKK")) for i, f in enumerate(feats)
           if not f.get("geometry") or not f["geometry"].get("coordinates")]
print(f"\nfitur tanpa geometry: {len(no_geom)}")
for row in no_geom:
    print("  ", row)

# cek kode "aneh" yang bukan pola NN.NN
import re
pat = re.compile(r"^\d{2}\.\d{2}$")
weird = [(i, kdp(f), props(f).get("WADMKK")) for i, f in enumerate(feats)
         if kdp(f) and not pat.match(kdp(f))]
print(f"\nKDPKAB tidak berpola NN.NN: {len(weird)}")
for row in weird:
    print("  ", row)