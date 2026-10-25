import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
import numpy as np
import pandas as pd
from scripts.model_utils import muat_tabel, bagi_latih_uji

TARGET = "target_fapar_t3"


def mae(y, p):
    return float(np.mean(np.abs(y - p)))


def rmse(y, p):
    return float(np.sqrt(np.mean((y - p) ** 2)))


df = muat_tabel()
latih, uji = bagi_latih_uji(df)
uji = uji.copy()

# Baseline 1 dan 2: statistik per kabupaten, dihitung hanya dari data latih
rata = latih.groupby("KDPKAB")[TARGET].mean()
median = latih.groupby("KDPKAB")[TARGET].median()

uji["pred_rata"] = uji["KDPKAB"].map(rata)
uji["pred_median"] = uji["KDPKAB"].map(median)
# Baseline 3: persistence = nilai FAPAR saat ini
uji["pred_persistence"] = uji["fapar_mean"]

print("Baris uji            :", len(uji))
print("fapar_mean kosong    :", int(uji["fapar_mean"].isna().sum()))

# Nilai pada baris yang sama untuk ketiganya
kolom_pred = ["pred_rata", "pred_median", "pred_persistence"]
sama = uji.dropna(subset=kolom_pred)
print("Baris dinilai (sama) :", len(sama))
print("Simpangan baku target uji (skala acuan):", round(float(sama[TARGET].std()), 3))
print()

hasil = []
for nama, kolom in [
    ("rata-rata per kabupaten", "pred_rata"),
    ("median per kabupaten", "pred_median"),
    ("persistence", "pred_persistence"),
]:
    hasil.append(
        {
            "baseline": nama,
            "MAE": round(mae(sama[TARGET], sama[kolom]), 3),
            "RMSE": round(rmse(sama[TARGET], sama[kolom]), 3),
        }
    )

print(pd.DataFrame(hasil).to_string(index=False))
