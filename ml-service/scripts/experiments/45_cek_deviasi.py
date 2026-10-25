# %% Muat data
import pandas as pd
from xgboost import XGBRegressor

from model_utils import muat_tabel, bagi_latih_uji, ukur_ranking, FITUR, TARGET, Q_RISIKO

PARAM = dict(  # parameter sederhana pilihan kita: depth 2, 100 pohon
    n_estimators=100, learning_rate=0.05, max_depth=2, min_child_weight=20,
    subsample=0.8, colsample_bytree=0.8, random_state=42,
)
df = muat_tabel()

LIPATAN = [
    ("uji 2023", "2023-01-01", "2024-01-01"),
    ("uji 2024", "2024-01-01", "2025-01-01"),
    ("uji 2025-2026", "2025-01-01", None),
]

# %% Walk-forward: ukur kemampuan menebak PENYIMPANGAN dari kebiasaan kabupaten
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
    u = u[u["fapar_mean"].notna() & u["base_target"].notna()].copy()

    l["dev"] = l[TARGET] - l["base_target"]         # penyimpangan sebenarnya (latih)
    u["dev"] = u[TARGET] - u["base_target"]         # penyimpangan sebenarnya (uji)

    m = XGBRegressor(**PARAM).fit(l[FITUR], l["dev"])
    u["pred_dev"] = m.predict(u[FITUR])             # koreksi dari XGBoost
    u["dev_sekarang"] = u["fapar_mean"] - u["base_fapar"]  # persistence deviasi

    for nm, kol in [("XGBoost (koreksi saja)", "pred_dev"),
                    ("persistence deviasi", "dev_sekarang")]:
        n_dekad, presisi, rho = ukur_ranking(u, kol, kolom_nyata="dev")
        baris.append({
            "lipatan": nama, "model": nm, "n_dekad": n_dekad,
            "lift": round(presisi / Q_RISIKO, 2), "spearman": round(rho, 3),
        })

hasil = pd.DataFrame(baris)
print("Acak: lift 1,0 | target = penyimpangan dari kebiasaan kabupaten sendiri")
print(hasil.to_string(index=False))
hasil.to_csv("models/metrik_deviasi.csv", index=False)