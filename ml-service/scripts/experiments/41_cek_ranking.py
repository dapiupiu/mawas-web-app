import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
# %% load data dan fungsi bantu
import numpy as np
import pandas as pd
from xgboost import XGBRegressor

from scripts.model_utils import muat_tabel, bagi_latih_uji, FITUR, TARGET

PARAM = dict(  # sama dengan 38_save_model.py
    n_estimators=300, learning_rate=0.05, max_depth=4,
    subsample=0.8, colsample_bytree=0.8, random_state=42,
)
Q = 0.2          # 20% kabupaten dengan skor terburuk
MIN_KAB = 50     # dekad dengan kabupaten terlalu sedikit dilewati

df = muat_tabel()


def ukur_ranking(u, kolom_pred):
    """Rata-rata presisi@Q dan korelasi Spearman, dihitung per dekad."""
    presisi, rho = [], []
    for _, g in u.groupby("tanggal"):
        if len(g) < MIN_KAB:
            continue
        k = max(int(round(len(g) * Q)), 1)
        pred_bawah = set(g.nsmallest(k, kolom_pred).index)
        nyata_bawah = set(g.nsmallest(k, TARGET).index)
        presisi.append(len(pred_bawah & nyata_bawah) / k)
        rho.append(g[kolom_pred].corr(g[TARGET], method="spearman"))
    return len(presisi), float(np.mean(presisi)), float(np.nanmean(rho))


# %% Walk-forward 3 lipatan
lipatan = [
    ("uji 2023", "2023-01-01", "2024-01-01"),
    ("uji 2024", "2024-01-01", "2025-01-01"),
    ("uji 2025-2026", "2025-01-01", None),
]
baris = []
for nama, awal, akhir in lipatan:
    l, u = bagi_latih_uji(
        df,
        awal_uji=pd.Timestamp(awal),
        akhir_uji=pd.Timestamp(akhir) if akhir else None,
    )
    m = XGBRegressor(**PARAM).fit(l[FITUR], l[TARGET])
    u = u.copy()
    u["pred_xgb"] = m.predict(u[FITUR])
    u["pred_kab"] = u["KDPKAB"].map(l.groupby("KDPKAB")[TARGET].mean())
    musim = l.groupby(["KDPKAB", "bulan"])[TARGET].mean().rename("pred_kab_bulan")
    u = u.join(musim, on=["KDPKAB", "bulan"])

    # baris yang sama untuk ketiga model
    s = u[u["fapar_mean"].notna() & u["pred_kab"].notna() & u["pred_kab_bulan"].notna()]
    for nama_model, kolom in [
        ("rata-rata per kabupaten", "pred_kab"),
        ("rata-rata per kabupaten+bulan", "pred_kab_bulan"),
        ("XGBoost", "pred_xgb"),
    ]:
        n_dekad, presisi, rho = ukur_ranking(s, kolom)
        baris.append({
            "lipatan": nama, "model": nama_model, "n_dekad": n_dekad,
            "presisi_20": round(presisi, 3), "lift": round(presisi / Q, 2),
            "spearman": round(rho, 3),
        })

hasil = pd.DataFrame(baris)
print("Acak menebak kena sekitar 0,20 (lift 1,0)")
print(hasil.to_string(index=False))
hasil.to_csv("models/metrik_ranking.csv", index=False)