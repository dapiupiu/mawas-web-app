import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
# %% Muat data
import pandas as pd
from sklearn.metrics import r2_score
from xgboost import XGBRegressor

from scripts.model_utils import muat_tabel, bagi_latih_uji, FITUR, TARGET, mae, rmse

PARAM = dict(  # sama dengan 38_save_model.py
    n_estimators=300,
    learning_rate=0.05,
    max_depth=4,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
)
df = muat_tabel()

# %% A. Error latih vs uji (split utama)
latih, uji = bagi_latih_uji(df)
model = XGBRegressor(**PARAM).fit(latih[FITUR], latih[TARGET])
for nama, d in [("LATIH", latih), ("UJI", uji)]:
    p = model.predict(d[FITUR])
    print(
        f"{nama:6s} MAE {mae(d[TARGET], p):.3f} | RMSE {rmse(d[TARGET], p):.3f} | "
        f"R2 {r2_score(d[TARGET], p):.3f} | n {len(d)}"
    )

# %% B. Walk-forward: 3 lipatan
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
    u["pred_rata"] = u["KDPKAB"].map(l.groupby("KDPKAB")[TARGET].mean())
    s = u[u["fapar_mean"].notna() & u["pred_rata"].notna()]  # baris sama untuk keduanya
    baris.append(
        {
            "lipatan": nama,
            "n_latih": len(l),
            "n_uji": len(s),
            "MAE_base": round(mae(s[TARGET], s["pred_rata"]), 4),
            "MAE_xgb": round(mae(s[TARGET], s["pred_xgb"]), 4),
            "RMSE_base": round(rmse(s[TARGET], s["pred_rata"]), 4),
            "RMSE_xgb": round(rmse(s[TARGET], s["pred_xgb"]), 4),
            "R2_base": round(r2_score(s[TARGET], s["pred_rata"]), 3),
            "R2_xgb": round(r2_score(s[TARGET], s["pred_xgb"]), 3),
            "bias_xgb": round(float((s[TARGET] - s["pred_xgb"]).mean()), 3),
        }
    )
hasil = pd.DataFrame(baris)
print()
print(hasil.to_string(index=False))
hasil.to_csv("models/metrik_walkforward.csv", index=False)
