# %% Muat data
import pandas as pd
from xgboost import XGBRegressor

from model_utils import muat_tabel, bagi_latih_uji, ukur_ranking, FITUR, TARGET, Q_RISIKO

PARAM = dict(  # parameter sederhana pilihan kita
    n_estimators=100, learning_rate=0.05, max_depth=2, min_child_weight=20,
    subsample=0.8, colsample_bytree=0.8, random_state=42,
)
df = muat_tabel()

LIPATAN = [
    ("uji 2023", "2023-01-01", "2024-01-01"),
    ("uji 2024", "2024-01-01", "2025-01-01"),
    ("uji 2025-2026", "2025-01-01", None),
]
KOLOM_FAPAR = ["fapar_mean", "fapar_lag1", "fapar_lag2", "fapar_lag3"]
FITUR_DEV = [f"dev_{k}" for k in KOLOM_FAPAR]

# %% Walk-forward
baris = []
for nama, awal, akhir in LIPATAN:
    l, u = bagi_latih_uji(
        df,
        awal_uji=pd.Timestamp(awal),
        akhir_uji=pd.Timestamp(akhir) if akhir else None,
    )
    # kebiasaan kabupaten: dihitung HANYA dari data latih lipatan ini
    base_t = l.groupby("KDPKAB")[TARGET].mean().rename("base_target")
    base_f = l.groupby("KDPKAB")["fapar_mean"].mean().rename("base_fapar")
    l = l.join(base_t, on="KDPKAB").join(base_f, on="KDPKAB")
    u = u.join(base_t, on="KDPKAB").join(base_f, on="KDPKAB")
    u = u[
        u["fapar_mean"].notna() & u["base_target"].notna() & u["base_fapar"].notna()
    ].copy()

    # fitur relatif: FAPAR (sekarang dan lag) dikurangi kebiasaan kabupaten
    for d in (l, u):
        for k in KOLOM_FAPAR:
            d[f"dev_{k}"] = d[k] - d["base_fapar"]

    # target: penyimpangan sebenarnya dari kebiasaan kabupaten
    l["dev"] = l[TARGET] - l["base_target"]
    u["dev"] = u[TARGET] - u["base_target"]

    m = XGBRegressor(**PARAM).fit(l[FITUR + FITUR_DEV], l["dev"])
    u["pred_xgb_dev"] = m.predict(u[FITUR + FITUR_DEV])
    u["persistence_dev"] = u["dev_fapar_mean"]

    subset = {
        "semua": u,
        "kualitas tinggi": u[(u["frac_valid"] >= 0.5) & (u["frac_valid_t3"] >= 0.5)],
    }
    for nama_sub, d in subset.items():
        for nm, kol in [
            ("persistence deviasi", "persistence_dev"),
            ("XGBoost + fitur relatif", "pred_xgb_dev"),
        ]:
            n_dekad, presisi, rho = ukur_ranking(d, kol, kolom_nyata="dev")
            baris.append({
                "lipatan": nama, "subset": nama_sub, "model": nm,
                "n_baris": len(d), "n_dekad": n_dekad,
                "lift": round(presisi / Q_RISIKO, 2), "spearman": round(rho, 3),
            })

hasil = pd.DataFrame(baris)
print("Acak: lift 1,0")
print(hasil.to_string(index=False))
hasil.to_csv("models/metrik_deviasi_v2.csv", index=False)