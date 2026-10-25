import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
import json
import re
from pathlib import Path
import pandas as pd
import rasterio
from scripts.fapar_utils import baca_fapar, bersihkan_fapar, buat_mask_kabupaten, hitung_zonal

GEOJSON = "data/geojson/kabupaten_clean.geojson"
OUT_DIR = Path("data/fapar_zonal")
# Ambang (jumlah dekad NaN dari 206) dipakai dua kali:
# 1) kabupaten dengan NaN >= ambang dicoba ulang dengan all_touched
# 2) setelah itu, yang masih NaN >= ambang ditandai "tidak_tersedia"
AMBANG_NAN = 100

lama = pd.read_parquet(OUT_DIR / "fapar_kabupaten.parquet")
nan_lama = lama.groupby("KDPKAB")["fapar_mean"].apply(lambda s: int(s.isna().sum()))
kandidat = set(nan_lama[nan_lama >= AMBANG_NAN].index)
print("Kandidat coba all_touched:", len(kandidat))

files = sorted(Path("data/FAPAR").rglob("*.tif"))
with rasterio.open(files[0]) as src:
    transform, shape = src.transform, src.shape

masks_all = buat_mask_kabupaten(GEOJSON, transform, shape, paksa_all_touched=True)
masks = {k: v for k, v in masks_all.items() if k in kandidat}

potongan = []
for f in files:
    tgl = re.search(r"_(\d{8})_", f.name).group(1)
    df = hitung_zonal(bersihkan_fapar(baca_fapar(f)), masks)
    df["tanggal"] = pd.to_datetime(tgl, format="%Y%m%d")
    potongan.append(df)
baru = pd.concat(potongan, ignore_index=True)

nan_baru = baru.groupby("KDPKAB")["fapar_mean"].apply(lambda s: int(s.isna().sum()))
ganti = set(nan_baru[nan_baru < nan_lama.loc[nan_baru.index]].index)
print("Kabupaten yang memakai hasil baru:", len(ganti))

final = pd.concat(
    [lama[~lama["KDPKAB"].isin(ganti)], baru[baru["KDPKAB"].isin(ganti)]],
    ignore_index=True,
)
final["frac_valid"] = final["n_valid"] / final["n_piksel"]

nan_final = final.groupby("KDPKAB")["fapar_mean"].apply(lambda s: int(s.isna().sum()))
status = pd.DataFrame({"nan_dekad": nan_final})
status["status_fapar"] = (status["nan_dekad"] >= AMBANG_NAN).map(
    {True: "tidak_tersedia", False: "tersedia"}
)
status["metode_mask"] = final.groupby("KDPKAB")["metode_mask"].first()
status["n_piksel"] = final.groupby("KDPKAB")["n_piksel"].first()

with open(GEOJSON, encoding="utf-8") as f:
    nama = {ft["properties"]["KDPKAB"]: ft["properties"]["WADMKK"]
            for ft in json.load(f)["features"]}
status["nama_kabupaten"] = [nama[k] for k in status.index]

final = final.merge(status["status_fapar"], left_on="KDPKAB", right_index=True)
final = final.sort_values(["KDPKAB", "tanggal"]).reset_index(drop=True)
final = final[["KDPKAB", "tanggal", "fapar_mean", "n_piksel", "n_valid",
               "frac_valid", "metode_mask", "status_fapar"]]

final.to_parquet(OUT_DIR / "fapar_kabupaten_final.parquet", index=False)
status.reset_index().to_csv(OUT_DIR / "fapar_status_kabupaten.csv", index=False)

# ---- pemeriksaan ----
print("\nBaris:", len(final), "| harapan", 507 * 206)
print("Kabupaten unik:", final["KDPKAB"].nunique())
print("Duplikat (KDPKAB, tanggal):", int(final.duplicated(["KDPKAB", "tanggal"]).sum()))
print("\nStatus per kabupaten:")
print(status["status_fapar"].value_counts().to_string())
print("\nMetode mask per kabupaten:")
print(status["metode_mask"].value_counts().to_string())

tersedia = final[final["status_fapar"] == "tersedia"]
print("\nHanya kabupaten 'tersedia':")
print("  Persen NaN:", round(tersedia["fapar_mean"].isna().mean() * 100, 1))
print("  Rata-rata frac_valid (baris non-NaN):",
      round(tersedia.loc[tersedia["fapar_mean"].notna(), "frac_valid"].mean(), 3))

print("\nDaftar tidak_tersedia:")
print(status[status["status_fapar"] == "tidak_tersedia"]
      [["nama_kabupaten", "nan_dekad", "metode_mask"]].to_string())