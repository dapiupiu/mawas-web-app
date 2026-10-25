import numpy as np
import pandas as pd

MIN_FRAC, MIN_NVALID, MIN_DEKAD = 0.2, 3, 50

t = pd.read_parquet("data/training/tabel_training.parquet")
k = pd.read_csv("models/kebiasaan_kabupaten.csv", dtype={"KDPKAB": str})
k = k[k["n_dekad"] >= MIN_DEKAD]

# inner: hanya kabupaten yang punya kebiasaan layak
d = t.merge(k, on="KDPKAB", how="inner")
d["deviasi"] = d["fapar_mean"] - d["kebiasaan_fapar"]
d = d[
    d["deviasi"].notna() & (d["frac_valid"] >= MIN_FRAC) & (d["n_valid"] >= MIN_NVALID)
].copy()

# skor: persentil antar-kabupaten yang lolos, per tanggal (paling negatif -> ~100)
d["skor"] = d.groupby("tanggal")["deviasi"].rank(pct=True, ascending=False) * 100

# opsi 1: persentil murni
d["kat1"] = np.where(
    d["skor"] >= 80, "tinggi", np.where(d["skor"] >= 50, "sedang", "rendah")
)
# opsi 2: persentil + wajib deviasi negatif
d["kat2"] = np.where((d["kat1"] != "rendah") & (d["deviasi"] < 0), d["kat1"], "rendah")

# seberapa sering "tinggi" opsi 1 sebenarnya di atas kebiasaan
tinggi1 = d[d["kat1"] == "tinggi"]
print(
    "Semua tanggal: 'tinggi' opsi 1 dengan deviasi >= 0:",
    f"{(tinggi1['deviasi'] >= 0).mean():.1%}",
    f"({int((tinggi1['deviasi'] >= 0).sum())} dari {len(tinggi1)})",
)
per_tgl = tinggi1.groupby("tanggal")["deviasi"].apply(lambda s: (s >= 0).mean())
print(
    "Tanggal dengan >10% 'tinggi' yang sebenarnya di atas kebiasaan:",
    int((per_tgl > 0.1).sum()),
    "dari",
    d["tanggal"].nunique(),
)

for tg in ["2026-09-11", "2026-06-01", "2026-01-11", "2025-09-11", "2025-03-21"]:
    y = d[d["tanggal"] == tg]
    cut = y.loc[y["skor"] >= 80, "deviasi"].max()
    print(
        f"\n{tg}: {len(y)} kab | rata-rata deviasi {y['deviasi'].mean():+.2f}"
        f" | deviasi di batas skor 80: {cut:+.2f}"
    )
    print(
        "  opsi 1:",
        y["kat1"].value_counts().reindex(["tinggi", "sedang", "rendah"]).to_dict(),
    )
    print(
        "  opsi 2:",
        y["kat2"].value_counts().reindex(["tinggi", "sedang", "rendah"]).to_dict(),
    )
