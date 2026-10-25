import pandas as pd

t = pd.read_parquet("data/training/tabel_training.parquet")
k = pd.read_csv("models/kebiasaan_kabupaten.csv", dtype={"KDPKAB": str})
d = t.merge(k, on="KDPKAB", how="left")
d["deviasi"] = d["fapar_mean"] - d["kebiasaan_fapar"]

# 1) detail lima kabupaten terburuk di 11 Sep 2026
x = d[d["tanggal"] == "2026-09-11"]
kode = ["14.05", "61.01", "16.74", "11.13", "16.12"]
print(
    x[x["KDPKAB"].isin(kode)][
        ["KDPKAB", "n_piksel", "n_valid", "frac_valid", "deviasi"]
    ]
)

# 2) sebaran kualitas data di beberapa tanggal (musim berbeda)
tanggal_uji = ["2026-09-11", "2026-06-01", "2026-01-11", "2025-09-11", "2025-03-21"]
pita = [0, 0.1, 0.2, 0.5, 1.0001]
nama = ["<10%", "10-20%", "20-50%", ">=50%"]

for tg in tanggal_uji:
    y = d[(d["tanggal"] == tg) & d["deviasi"].notna()].copy()
    y["skor"] = (-y["deviasi"]).rank(pct=True) * 100
    y["pita"] = pd.cut(y["frac_valid"], bins=pita, labels=nama, right=False)
    tinggi = y[y["skor"] >= 80]
    print(f"\n{tg}: {len(y)} kabupaten punya deviasi")
    print("  pita frac_valid :", y["pita"].value_counts().sort_index().to_dict())
    print("  n_valid <= 2    :", int((y["n_valid"] <= 2).sum()))
    print(
        "  skor>=80        :",
        len(tinggi),
        "| frac_valid<20%:",
        int((tinggi["frac_valid"] < 0.2).sum()),
        "| n_valid<=2:",
        int((tinggi["n_valid"] <= 2).sum()),
    )
