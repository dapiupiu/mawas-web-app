import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from pathlib import Path
import numpy as np
import pandas as pd
from scripts.fapar_utils import baca_fapar, bersihkan_fapar

T = "target_fapar_t3"
tabel = pd.read_parquet("data/training/tabel_training.parquet")
status = pd.read_csv("data/fapar_zonal/fapar_status_kabupaten.csv", dtype={"KDPKAB": str})
nama = dict(zip(status["KDPKAB"], status["nama_kabupaten"]))

lab = tabel[tabel["punya_target"]]
print("Persentil target:")
print(lab[T].quantile([0.001, 0.01, 0.05, 0.5, 0.95, 0.99, 0.999]).round(3).to_string())
print("Baris target < -5:", int((lab[T] < -5).sum()),
      "| < -10:", int((lab[T] < -10).sum()))

# min/maks per piksel di seluruh file, setelah pembersihan 0 -> NaN
mn, mx = np.inf, -np.inf
for f in sorted(Path("data/FAPAR").rglob("*.tif")):
    arr = bersihkan_fapar(baca_fapar(f))
    mn = min(mn, float(np.nanmin(arr)))
    mx = max(mx, float(np.nanmax(arr)))
print(f"\nMin / maks PIKSEL di semua file : {mn:.3f} / {mx:.3f}")
print(f"Min / maks fapar_mean kabupaten : {tabel['fapar_mean'].min():.3f} / "
      f"{tabel['fapar_mean'].max():.3f}")

# kualitas data di t+3, supaya cocok dengan target yang dilihat
tabel = tabel.sort_values(["KDPKAB", "tanggal"]).copy()
g = tabel.groupby("KDPKAB")
tabel["tanggal_t3"] = g["tanggal"].shift(-3)
tabel["n_valid_t3"] = g["n_valid"].shift(-3)
tabel["frac_valid_t3"] = g["frac_valid"].shift(-3)

low = tabel[tabel["punya_target"]].nsmallest(10, T).copy()
low["nama"] = low["KDPKAB"].map(nama)
print("\n10 target terendah (kualitas diukur pada t+3):")
print(low[["KDPKAB", "nama", "tanggal_t3", T, "n_piksel", "n_valid_t3"]]
      .to_string(index=False))

print("\nBaris dengan target < -5, sebaran n_valid di t+3:")
bawah = tabel[tabel["punya_target"] & (tabel[T] < -5)]
print(bawah["n_valid_t3"].describe().round(1).to_string())