from pathlib import Path
import pandas as pd

OUT_DIR = Path("data/training")
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT = OUT_DIR / "gabungan_fapar_hujan.parquet"

hujan = pd.read_parquet("data/rainfall/rainfall_kabupaten.parquet")
hujan = hujan.rename(columns={"date": "tanggal"})
kolom_hujan = [
    "KDPKAB",
    "tanggal",
    "n_pixels",
    "rfh",
    "rfh_avg",
    "r1h",
    "r1h_avg",
    "r3h",
    "r3h_avg",
    "rfq",
    "r1q",
    "r3q",
    "version",
    "anomaly_status",
]
hujan = hujan[kolom_hujan].rename(
    columns={"n_pixels": "n_pixels_hujan", "version": "version_hujan"}
)

fapar = pd.read_parquet("data/fapar_zonal/fapar_kabupaten_final.parquet")

gab = fapar.merge(hujan, on=["KDPKAB", "tanggal"], how="inner", validate="one_to_one")
gab = gab.sort_values(["KDPKAB", "tanggal"]).reset_index(drop=True)
gab.to_parquet(OUT, index=False)

# ---- pemeriksaan ----
print("Baris:", len(gab), "| harapan 468 x 206 =", 468 * 206)
print(
    "Kabupaten unik:",
    gab["KDPKAB"].nunique(),
    "| dekad unik:",
    gab["tanggal"].nunique(),
)
print(
    "Rentang tanggal:", gab["tanggal"].min().date(), "->", gab["tanggal"].max().date()
)

print("\nJumlah NaN per kolom (hanya kolom yang ada NaN):")
nan = gab.isna().sum()
print(nan[nan > 0].to_string() if (nan > 0).any() else "tidak ada NaN")

print("\nStatus FAPAR per kabupaten:")
print(gab.groupby("KDPKAB")["status_fapar"].first().value_counts().to_string())

print("\nBaris per version_hujan:")
print(gab["version_hujan"].value_counts().to_string())
print(
    "Tanggal baris 'prelim':",
    sorted(gab.loc[gab["version_hujan"] != "final", "tanggal"].dt.date.unique()),
)

print("\nBaris per anomaly_status:")
print(gab["anomaly_status"].value_counts().to_string())

print("\nContoh 3 baris:")
print(gab.head(3).T.to_string())
print("\nDisimpan ke:", OUT)
