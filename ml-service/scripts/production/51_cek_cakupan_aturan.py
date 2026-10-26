import pandas as pd

t = pd.read_parquet("data/training/tabel_training.parquet")
k = pd.read_csv("models/kebiasaan_kabupaten.csv", dtype={"KDPKAB": str})
d = t.merge(k, on="KDPKAB", how="left")
d["deviasi"] = d["fapar_mean"] - d["kebiasaan_fapar"]
ada = d[d["deviasi"].notna()]
semua_tgl = pd.Index(sorted(t["tanggal"].unique()))

aturan = {
    "A: frac>=0.2 & n_valid>=3": (ada["frac_valid"] >= 0.2) & (ada["n_valid"] >= 3),
    "B: frac>=0.5 & n_valid>=3": (ada["frac_valid"] >= 0.5) & (ada["n_valid"] >= 3),
    "C: n_valid>=3 saja": ada["n_valid"] >= 3,
}

for nama, m in aturan.items():
    per = ada[m].groupby("tanggal").size().reindex(semua_tgl, fill_value=0)
    print(f"\n{nama}")
    print(
        "  per tanggal: min", per.min(), "| median", per.median(), "| maks", per.max()
    )
    print(
        "  11 Sep 2026:",
        per.loc["2026-09-11"],
        "| tanggal dengan <150 kab:",
        int((per < 150).sum()),
        "dari",
        len(per),
    )
    print(
        "  median per bulan:",
        per.groupby(per.index.month).median().astype(int).to_dict(),
    )

# batas minimum dekad untuk kebiasaan
n_bulan = t[t["target_andal"]].groupby("KDPKAB")["bulan"].nunique().rename("n_bulan")
k2 = k.merge(n_bulan, on="KDPKAB", how="left")
k2["kelompok"] = pd.cut(k2["n_dekad"], [0, 50, 80, 120, 500])
print("\nKebiasaan per kelompok n_dekad:")
print(
    k2.groupby("kelompok", observed=True).agg(
        jumlah=("KDPKAB", "size"),
        bulan_min=("n_bulan", "min"),
        bulan_median=("n_bulan", "median"),
    )
)
