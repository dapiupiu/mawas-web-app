# %% load data: hanya data latih (sama seperti yang dipakai baseline)
import json
import pandas as pd
from model_utils import muat_tabel, bagi_latih_uji, TARGET

df = muat_tabel()
latih, uji = bagi_latih_uji(df)

# nama kabupaten dari GeoJSON bersih (hanya agar mudah dibaca manusia)
with open("data/geojson/kabupaten_clean.geojson", encoding="utf-8") as f:
    fitur = json.load(f)["features"]
nama = {x["properties"].get("KDPKAB"): x["properties"].get("WADMKK") for x in fitur}

# %% Satu baris per kabupaten: nilai khas + ciri kualitas data
per_kab = latih.groupby("KDPKAB").agg(
    rata_target=(TARGET, "mean"),
    n_baris=(TARGET, "size"),
    n_piksel=("n_piksel", "median"),
    frac_valid=("frac_valid", "mean"),
).reset_index()
per_kab["nama"] = per_kab["KDPKAB"].map(nama)
print("Sebaran nilai khas per kabupaten (rata-rata target di data latih):")
print(per_kab["rata_target"].describe().round(3))

# %% 12 kabupaten paling rendah dan paling tinggi
kolom = ["KDPKAB", "nama", "rata_target", "n_piksel", "frac_valid"]
urut = per_kab.sort_values("rata_target")
print("\nPALING RENDAH:")
print(urut.head(12)[kolom].round(3).to_string(index=False))
print("\nPALING TINGGI:")
print(urut.tail(12)[kolom].round(3).to_string(index=False))

# %% Apakah nilai khas berkaitan dengan kualitas data?
print("\nKorelasi Spearman:")
print(per_kab[["rata_target", "n_piksel", "frac_valid"]].corr(method="spearman").round(2))

per_kab["kelompok_piksel"] = pd.qcut(per_kab["n_piksel"], 4, duplicates="drop")
print("\nNilai khas menurut jumlah piksel kabupaten:")
print(
    per_kab.groupby("kelompok_piksel", observed=True)["rata_target"]
    .agg(["count", "mean", "std"]).round(3)
)

# %% Apakah nilai khas stabil antar periode?
a = latih[latih["tanggal"] < "2023-01-01"].groupby("KDPKAB")[TARGET].mean()
b = latih[latih["tanggal"] >= "2023-01-01"].groupby("KDPKAB")[TARGET].mean()
print("\nKorelasi Spearman nilai khas 2021-22 vs 2023-24:", round(a.corr(b, method="spearman"), 3))

# %% Metode mask (sekali per kabupaten)
print("\nMetode mask:")
print(df.groupby("KDPKAB")["metode_mask"].first().value_counts())