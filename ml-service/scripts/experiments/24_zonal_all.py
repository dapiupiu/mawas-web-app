import re
from pathlib import Path
import numpy as np
import pandas as pd
import rasterio
from fapar_utils import baca_fapar, bersihkan_fapar, buat_mask_kabupaten, hitung_zonal

GEOJSON = "data/geojson/kabupaten_clean.geojson"
OUT_DIR = Path("data/fapar_zonal")
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT = OUT_DIR / "fapar_kabupaten.parquet"

files = sorted(Path("data/FAPAR").rglob("*.tif"))
print("Jumlah file:", len(files))

with rasterio.open(files[0]) as src:
    transform, shape = src.transform, src.shape
masks = buat_mask_kabupaten(GEOJSON, transform, shape)

semua = []
for i, f in enumerate(files, start=1):
    tgl = re.search(r"_(\d{8})_", f.name).group(1)
    arr = bersihkan_fapar(baca_fapar(f))
    df = hitung_zonal(arr, masks)
    df["tanggal"] = pd.to_datetime(tgl, format="%Y%m%d")
    semua.append(df)
    if i % 50 == 0:
        print(f"  {i}/{len(files)} selesai")

hasil = pd.concat(semua, ignore_index=True)
hasil["frac_valid"] = hasil["n_valid"] / hasil["n_piksel"]
hasil = hasil[
    [
        "KDPKAB",
        "tanggal",
        "fapar_mean",
        "n_piksel",
        "n_valid",
        "frac_valid",
        "metode_mask",
    ]
]
hasil.to_parquet(OUT, index=False)

# ---- pemeriksaan ----
print("\nBaris:", len(hasil), "| harapan 507 x 206 =", 507 * 206)
print("Dekad unik:", hasil["tanggal"].nunique())
print("Hari-dalam-bulan yang muncul:", sorted(hasil["tanggal"].dt.day.unique()))
print("Duplikat (KDPKAB, tanggal):", int(hasil.duplicated(["KDPKAB", "tanggal"]).sum()))

hasil["nan"] = hasil["fapar_mean"].isna()
print("\nPersen NaN keseluruhan:", round(hasil["nan"].mean() * 100, 1))
print("Persen NaN per bulan (1-12):")
print(
    (hasil.groupby(hasil["tanggal"].dt.month)["nan"].mean() * 100).round(1).to_string()
)

per_kab = hasil.groupby("KDPKAB")["nan"].sum().sort_values(ascending=False)
print("\nKabupaten NaN di SEMUA 206 dekad:", int((per_kab == 206).sum()))
print("10 kabupaten paling sering NaN (jumlah dekad dari 206):")
print(per_kab.head(10).to_string())
print("Median jumlah dekad NaN per kabupaten:", int(per_kab.median()))
print("\nDisimpan ke:", OUT)
