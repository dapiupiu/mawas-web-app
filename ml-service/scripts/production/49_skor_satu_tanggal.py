import pandas as pd

t = pd.read_parquet("data/training/tabel_training.parquet")
k = pd.read_csv("models/kebiasaan_kabupaten.csv", dtype={"KDPKAB": str})

# cek format kode: harus "NN.NN" (5 karakter)
print("Kode kebiasaan aneh:", (~k["KDPKAB"].str.fullmatch(r"\d\d\.\d\d")).sum())
print("n_dekad: min", k["n_dekad"].min(), "| median", k["n_dekad"].median())

# gabung kebiasaan ke tabel (left: semua baris tabel dipertahankan)
d = t.merge(k, on="KDPKAB", how="left")

# deviasi = FAPAR sekarang - kebiasaan kabupaten itu
d["deviasi"] = d["fapar_mean"] - d["kebiasaan_fapar"]

# ambil 1 tanggal
tgl = pd.Timestamp("2026-09-11")
x = d[d["tanggal"] == tgl].copy()

print("\nTanggal:", tgl.date())
print("Kabupaten di tabel      :", len(x))
print("status_fapar            :", x["status_fapar"].value_counts().to_dict())
print("fapar_mean ada          :", x["fapar_mean"].notna().sum())
print("kebiasaan ada           :", x["kebiasaan_fapar"].notna().sum())
print("deviasi bisa dihitung   :", x["deviasi"].notna().sum())

# skor = persentil dari deviasi yang dibalik (paling negatif -> ~100)
x["skor"] = (-x["deviasi"]).rank(pct=True) * 100

print("\nSebaran deviasi:")
print(x["deviasi"].describe().round(3))

print("\n5 terburuk:")
print(
    x.nlargest(5, "skor")[
        ["KDPKAB", "fapar_mean", "kebiasaan_fapar", "deviasi", "skor", "frac_valid"]
    ]
)
print("\n5 terbaik:")
print(
    x.nsmallest(5, "skor")[
        ["KDPKAB", "fapar_mean", "kebiasaan_fapar", "deviasi", "skor", "frac_valid"]
    ]
)
