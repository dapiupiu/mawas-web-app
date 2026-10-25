# %% load data
import pandas as pd
from sklearn.metrics import r2_score
from xgboost import XGBRegressor

from model_utils import (
    muat_tabel,
    bagi_latih_uji,
    ukur_ranking,
    FITUR,
    TARGET,
    Q_RISIKO,
    mae,
    rmse,
)

PARAM = dict(  # sama dengan 38_save_model.py
    n_estimators=300,
    learning_rate=0.05,
    max_depth=4,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
)
df = muat_tabel()

lipatan = [
    ("uji 2023", "2023-01-01", "2024-01-01"),
    ("uji 2024", "2024-01-01", "2025-01-01"),
    ("uji 2025-2026", "2025-01-01", None),
]

# %% Walk-forward: baseline vs XGBoost mentah vs XGBoost pada selisih
hasil = []
for nama, awal, akhir in lipatan:
    l, u = bagi_latih_uji(
        df,
        awal_uji=pd.Timestamp(awal),
        akhir_uji=pd.Timestamp(akhir) if akhir else None,
    )
    # baseline dihitung HANYA dari data latih lipatan ini
    kab = l.groupby("KDPKAB")[TARGET].mean().rename("base_kab")
    kb = l.groupby(["KDPKAB", "bulan"])[TARGET].mean().rename("base_kb")
    l = l.join(kab, on="KDPKAB").join(kb, on=["KDPKAB", "bulan"])
    u = u.join(kab, on="KDPKAB").join(kb, on=["KDPKAB", "bulan"])

    # baris yang sama untuk semua model
    s = u[u["fapar_mean"].notna() & u["base_kab"].notna() & u["base_kb"].notna()].copy()

    s["p_base_kab"] = s["base_kab"]
    s["p_base_kab_bulan"] = s["base_kb"]

    m = XGBRegressor(**PARAM).fit(l[FITUR], l[TARGET])
    s["p_xgb_mentah"] = m.predict(s[FITUR])

    m = XGBRegressor(**PARAM).fit(l[FITUR], l[TARGET] - l["base_kab"])
    s["p_xgb_selisih_kab"] = s["base_kab"] + m.predict(s[FITUR])

    m = XGBRegressor(**PARAM).fit(l[FITUR], l[TARGET] - l["base_kb"])
    s["p_xgb_selisih_kab_bulan"] = s["base_kb"] + m.predict(s[FITUR])

    for nm, kol in [
        ("baseline kabupaten", "p_base_kab"),
        ("baseline kabupaten+bulan", "p_base_kab_bulan"),
        ("XGBoost mentah", "p_xgb_mentah"),
        ("XGBoost selisih kabupaten", "p_xgb_selisih_kab"),
        ("XGBoost selisih kab+bulan", "p_xgb_selisih_kab_bulan"),
    ]:
        n_dekad, presisi, rho = ukur_ranking(s, kol)
        hasil.append(
            {
                "lipatan": nama,
                "model": nm,
                "n_uji": len(s),
                "MAE": round(mae(s[TARGET], s[kol]), 4),
                "RMSE": round(rmse(s[TARGET], s[kol]), 4),
                "R2": round(r2_score(s[TARGET], s[kol]), 3),
                "lift": round(presisi / Q_RISIKO, 2),
                "spearman": round(rho, 3),
            }
        )

tabel = pd.DataFrame(hasil)
print(tabel.to_string(index=False))
tabel.to_csv("models/metrik_formulasi.csv", index=False)
