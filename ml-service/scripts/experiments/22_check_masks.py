import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
import json
from pathlib import Path
import numpy as np
import rasterio
from scripts.fapar_utils import buat_mask_kabupaten

GEOJSON = "data/geojson/kabupaten_clean.geojson"

# nama kabupaten untuk cetakan (hanya untuk dibaca manusia)
with open(GEOJSON, encoding="utf-8") as f:
    nama = {
        ft["properties"]["KDPKAB"]: ft["properties"]["WADMKK"]
        for ft in json.load(f)["features"]
    }

# transform + shape cukup dari 1 file, karena semua grid identik
pertama = sorted(Path("data/FAPAR").rglob("*.tif"))[0]
with rasterio.open(pertama) as src:
    transform, shape = src.transform, src.shape
print("Grid:", shape)

masks = buat_mask_kabupaten(GEOJSON, transform, shape)
print("Jumlah mask:", len(masks))

n_piksel = {k: int(m.sum()) for k, (m, _) in masks.items()}
metode = {k: me for k, (_, me) in masks.items()}

vals = np.array(list(n_piksel.values()))
print(
    f"Piksel per kabupaten: min {vals.min()}, median {np.median(vals):.0f}, maks {vals.max()}"
)
print(
    "Jumlah per metode:",
    {m: list(metode.values()).count(m) for m in set(metode.values())},
)

print("\nKabupaten yang memakai all_touched:")
for k, me in metode.items():
    if me == "all_touched":
        print(f"  {k} {nama[k]}: {n_piksel[k]} piksel")

print(
    "\nKabupaten dengan 0 piksel (masalah):",
    [(k, nama[k]) for k, n in n_piksel.items() if n == 0],
)
print("Aceh Besar 11.06:", n_piksel.get("11.06"), "piksel")
