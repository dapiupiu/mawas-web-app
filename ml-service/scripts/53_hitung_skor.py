from pathlib import Path

import numpy as np
import pandas as pd

# --- aturan resmi ---
MIN_FRAC, MIN_NVALID, MIN_DEKAD = 0.2, 3, 50
BATAS_TINGGI, BATAS_SEDANG = 80, 50

t = pd.read_parquet("data/training/tabel_training.parquet")
k = pd.read_csv("models/kebiasaan_kabupaten.csv", dtype={"KDPKAB": str})

kolom = [
    "KDPKAB",
    "tanggal",
    "status_fapar",
    "fapar_mean",
    "frac_valid",
    "n_valid",
    "n_piksel",
]
d = t[kolom].merge(k, on="KDPKAB", how="left")
assert len(d) == len(t)  # left merge tidak boleh menambah/mengurangi baris

d["deviasi"] = d["fapar_mean"] - d["kebiasaan_fapar"]

# alasan tidak dapat skor; urutan = prioritas
d["alasan"] = np.select(
    [
        d["status_fapar"] != "tersedia",
        d["kebiasaan_fapar"].isna(),
        d["n_dekad"] < MIN_DEKAD,
        d["fapar_mean"].isna(),
        (d["frac_valid"] < MIN_FRAC) | (d["n_valid"] < MIN_NVALID),
    ],
    [
        "fapar_tidak_tersedia",
        "tanpa_kebiasaan",
        "kebiasaan_kurang_dekad",
        "fapar_kosong_dekad_ini",
        "data_tipis",
    ],
    default="",
)
ok = d["alasan"] == ""

# skor 0-100: persentil antar-kabupaten yang lolos, per tanggal (paling negatif -> ~100)
d["skor"] = np.nan
d.loc[ok, "skor"] = (
    d[ok].groupby("tanggal")["deviasi"].rank(pct=True, ascending=False) * 100
)

# kategori (opsi 2: wajib deviasi negatif)
d["kategori"] = np.select(
    [
        ~ok,
        (d["skor"] >= BATAS_TINGGI) & (d["deviasi"] < 0),
        (d["skor"] >= BATAS_SEDANG) & (d["deviasi"] < 0),
    ],
    ["tidak_tersedia", "tinggi", "sedang"],
    default="rendah",
)

Path("data/output").mkdir(parents=True, exist_ok=True)
d.to_parquet("data/output/skor_semua_tanggal.parquet", index=False)

# --- pemeriksaan ---
print(
    "Baris:",
    len(d),
    "| kabupaten:",
    d["KDPKAB"].nunique(),
    "| tanggal:",
    d["tanggal"].nunique(),
)
print("\nAlasan (semua tanggal):")
print(d["alasan"].replace("", "ok (dapat skor)").value_counts())
print("\nKategori (semua tanggal):")
print(d["kategori"].value_counts())
print(
    "\nSkor: min",
    round(d["skor"].min(), 2),
    "| maks",
    round(d["skor"].max(), 2),
    "| kabupaten ber-skor per tanggal: min",
    int(d[ok].groupby("tanggal").size().min()),
)

x = d[d["tanggal"] == "2026-09-11"]
print("\n11 Sep 2026 kategori:", x["kategori"].value_counts().to_dict())
print(
    "11 Sep 2026 alasan  :",
    x.loc[~x["alasan"].eq(""), "alasan"].value_counts().to_dict(),
)
