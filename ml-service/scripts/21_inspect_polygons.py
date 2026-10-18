import json
from collections import Counter
from pathlib import Path

path = Path("data/geojson/kabupaten_clean.geojson")
with open(path, encoding="utf-8") as f:
    gj = json.load(f)

fitur = gj["features"]
print("Jumlah fitur:", len(fitur))
print("Field properties:", list(fitur[0]["properties"].keys()))
print("Contoh properties:", fitur[0]["properties"])
print("Ada key 'crs'?", "crs" in gj)

jenis = Counter(
    (ft["geometry"]["type"] if ft["geometry"] else "TANPA GEOMETRI") for ft in fitur
)
print("Jenis geometri:", dict(jenis))


def semua_titik(coords):
    """Telusuri struktur koordinat bersarang, hasilkan tiap pasangan [x, y]."""
    if isinstance(coords[0], (int, float)):
        yield coords
    else:
        for c in coords:
            yield from semua_titik(c)


PIXEL = 1 / 12  # ukuran piksel FAPAR dalam derajat
kecil = []
x_all, y_all = [], []

for ft in fitur:
    g = ft["geometry"]
    if g is None:
        continue
    pts = list(semua_titik(g["coordinates"]))
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    x_all += [min(xs), max(xs)]
    y_all += [min(ys), max(ys)]
    if (max(xs) - min(xs)) < PIXEL and (max(ys) - min(ys)) < PIXEL:
        kecil.append((ft["properties"]["KDPKAB"], ft["properties"]["WADMKK"]))

print(f"Batas poligon: x {min(x_all):.3f} .. {max(x_all):.3f}, y {min(y_all):.3f} .. {max(y_all):.3f}")
print("Batas raster : x 95.167 .. 141.083, y -11.000 .. 5.917")
print(f"Poligon dengan kotak batas < 1 piksel: {len(kecil)}")
for k in kecil:
    print("  ", k)