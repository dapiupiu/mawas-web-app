import json
import re
from pathlib import Path
import pandas as pd
import rasterio
from fapar_utils import baca_fapar, bersihkan_fapar, buat_mask_kabupaten, hitung_zonal

GEOJSON = "data/geojson/kabupaten_clean.geojson"
AMBANG = 100  # eksperimen: kabupaten yang NaN di >= 100 dari 206 dekad

lama = pd.read_parquet("data/fapar_zonal/fapar_kabupaten.parquet")
ringkas_lama = lama.groupby("KDPKAB").agg(
    nan_lama=("fapar_mean", lambda s: int(s.isna().sum())),
    px_lama=("n_piksel", "first"),
)
bermasalah = set(ringkas_lama[ringkas_lama["nan_lama"] >= AMBANG].index)
print(f"Kabupaten dengan NaN >= {AMBANG} dekad:", len(bermasalah))

with open(GEOJSON, encoding="utf-8") as f:
    nama = {ft["properties"]["KDPKAB"]: ft["properties"]["WADMKK"]
            for ft in json.load(f)["features"]}

files = sorted(Path("data/FAPAR").rglob("*.tif"))
with rasterio.open(files[0]) as src:
    transform, shape = src.transform, src.shape

semua_mask = buat_mask_kabupaten(GEOJSON, transform, shape, paksa_all_touched=True)
masks = {k: v for k, v in semua_mask.items() if k in bermasalah}

potongan = []
for f in files:
    tgl = re.search(r"_(\d{8})_", f.name).group(1)
    df = hitung_zonal(bersihkan_fapar(baca_fapar(f)), masks)
    df["tanggal"] = pd.to_datetime(tgl, format="%Y%m%d")
    potongan.append(df)
baru = pd.concat(potongan, ignore_index=True)

ringkas_baru = baru.groupby("KDPKAB").agg(
    nan_baru=("fapar_mean", lambda s: int(s.isna().sum())),
    px_baru=("n_piksel", "first"),
)

tabel = ringkas_lama.loc[list(bermasalah)].join(ringkas_baru)
tabel["nama"] = [nama[k] for k in tabel.index]
tabel = tabel.sort_values("nan_lama", ascending=False)
print(tabel[["nama", "px_lama", "px_baru", "nan_lama", "nan_baru"]].to_string())

print("\nNaN baru <= 20 dekad (tertolong):", int((tabel["nan_baru"] <= 20).sum()))
print("NaN baru antara 21 dan 99:", int(((tabel["nan_baru"] > 20) & (tabel["nan_baru"] < 100)).sum()))
print("NaN baru >= 100 (tetap bermasalah):", int((tabel["nan_baru"] >= 100).sum()))
print("Masih NaN di semua 206 dekad:", int((tabel["nan_baru"] == 206).sum()))