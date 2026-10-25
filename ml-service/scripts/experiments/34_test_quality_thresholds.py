import pandas as pd

T = "target_fapar_t3"
tabel = pd.read_parquet("data/training/tabel_training.parquet")
tabel = tabel.sort_values(["KDPKAB", "tanggal"]).copy()

# kualitas data di dekad target (t+3), digeser ke baris yang sama
g = tabel.groupby("KDPKAB")
tabel["n_valid_t3"] = g["n_valid"].shift(-3)
tabel["frac_valid_t3"] = g["frac_valid"].shift(-3)

lab = tabel[tabel["punya_target"]].copy()
total = len(lab)
print("Baris berlabel:", total)
print(
    "Persen baris berlabel dengan n_valid_t3 == 1:",
    round((lab["n_valid_t3"] == 1).mean() * 100, 1),
)

def ringkas(sub, nama):
    return {
        "aturan": nama,
        "baris": len(sub),
        "persen_tersisa": round(len(sub) / total * 100, 1),
        "min_target": round(sub[T].min(), 2),
        "std_target": round(sub[T].std(), 3),
        "< -5": int((sub[T] < -5).sum()),
        "< -10": int((sub[T] < -10).sum()),
    }


hasil = [ringkas(lab, "tanpa aturan")]
for k in (2, 3, 5):
    hasil.append(ringkas(lab[lab["n_valid_t3"] >= k], f"n_valid_t3 >= {k}"))
for f in (0.1, 0.2, 0.3):
    hasil.append(ringkas(lab[lab["frac_valid_t3"] >= f], f"frac_valid_t3 >= {f}"))

print("\nDampak tiap aturan pada baris berlabel:")
print(pd.DataFrame(hasil).to_string(index=False))

# dampak per kabupaten: berapa kabupaten yang kehilangan banyak baris
for nama, mask in [
    ("n_valid_t3 >= 3", lab["n_valid_t3"] >= 3),
    ("frac_valid_t3 >= 0.2", lab["frac_valid_t3"] >= 0.2),
]:
    sisa = (
        lab[mask].groupby("KDPKAB").size().reindex(lab["KDPKAB"].unique(), fill_value=0)
    )
    print(
        f"\nAturan '{nama}': sebaran jumlah baris tersisa per kabupaten (maks ~{lab.groupby('KDPKAB').size().max()})"
    )
    print(sisa.describe().round(1).to_string())
    print("Kabupaten dengan < 50 baris tersisa:", int((sisa < 50).sum()))
