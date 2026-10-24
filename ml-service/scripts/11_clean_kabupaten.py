import json
import re
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "geojson" / "kabupaten_raw.json"
OUT = ROOT / "data" / "geojson" / "kabupaten_clean.geojson"

# 3 baris sampah: kode rusak / gabungan / tanpa kode
SAMPAH_CODES = {"52.0452.07", "71.05/71.10", None}
# Duplikat 75.04: buang yang TANPA geometry (Pahuwato), simpan yang bergeometry (Pohuwato)
DUP_CODE = "75.04"

PAT = re.compile(r"^\d{2}\.\d{2}$")


def kdp(f):
    v = (f.get("properties") or {}).get("KDPKAB")
    return None if v is None else str(v).strip()


def has_geom(f):
    g = f.get("geometry")
    return bool(g and g.get("coordinates"))


with RAW.open(encoding="utf-8") as f:
    fc = json.load(f)

kept, dropped = [], []
for f in fc["features"]:
    code = kdp(f)
    name = (f.get("properties") or {}).get("WADMKK")
    if code in SAMPAH_CODES:
        dropped.append(("sampah", code, name))
        continue
    if code == DUP_CODE and not has_geom(f):
        dropped.append(("duplikat-tanpa-geom", code, name))
        continue
    if code is not None and not PAT.match(code):
        dropped.append(("pola-kode-aneh", code, name))
        continue
    kept.append(f)

# bangun GeoJSON bersih: hanya field yang dipakai + has_geometry
clean_feats = []
for f in kept:
    p = f["properties"]
    geom = f.get("geometry")
    clean_feats.append(
        {
            "type": "Feature",
            "properties": {
                "KDPKAB": kdp(f),
                "WADMKK": p.get("WADMKK"),
                "WADMPR": p.get("WADMPR"),
                "has_geometry": has_geom(f),
            },
            "geometry": geom,
        }
    )

out_fc = {"type": "FeatureCollection", "features": clean_feats}
with OUT.open("w", encoding="utf-8") as f:
    json.dump(out_fc, f, ensure_ascii=False)

# ---- laporan ----
print(f"dibuang: {len(dropped)}")
for r in dropped:
    print("  ", r)
print(f"disimpan: {len(kept)}")
print("kode unik:", len({kdp(f) for f in kept}))
print("punya geometry:", sum(1 for f in kept if has_geom(f)))
print("tanpa geometry:", sum(1 for f in kept if not has_geom(f)))

# sanity: kode yang masih duplikat?
dupes = [c for c, n in Counter(kdp(f) for f in kept).items() if n > 1]
print("duplikat sisa:", dupes)

# sanity: 7 kota tanpa poligon harus ada
expected_no_geom = {"13.74", "12.73", "12.76", "13.75", "35.76", "33.71", "31.01"}
actual_no_geom = {kdp(f) for f in kept if not has_geom(f)}
print("7 kota tanpa geom cocok:", expected_no_geom == actual_no_geom)
print("selisih:", expected_no_geom ^ actual_no_geom)
