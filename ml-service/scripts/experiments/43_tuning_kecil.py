import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
# %% load data dan siapkan tiap lipatan
import itertools

import pandas as pd
from xgboost import XGBRegressor

from scripts.model_utils import (
    muat_tabel,
    bagi_latih_uji,
    ukur_ranking,
    FITUR,
    TARGET,
    Q_RISIKO,
    mae,
)

df = muat_tabel()

LIPATAN = {
    "2023": ("2023-01-01", "2024-01-01"),
    "2024": ("2024-01-01", "2025-01-01"),
    "2025-2026": ("2025-01-01", None),
}
# kedalaman, jumlah pohon, min_child_weight
GRID = list(itertools.product([2, 3, 4], [100, 300], [1, 20]))


def siapkan(nama):
    awal, akhir = LIPATAN[nama]
    l, u = bagi_latih_uji(
        df,
        awal_uji=pd.Timestamp(awal),
        akhir_uji=pd.Timestamp(akhir) if akhir else None,
    )
    # baseline kabupaten dihitung HANYA dari data latih lipatan ini
    kab = l.groupby("KDPKAB")[TARGET].mean().rename("base_kab")
    l = l.join(kab, on="KDPKAB")
    u = u.join(kab, on="KDPKAB")
    u = u[u["fapar_mean"].notna() & u["base_kab"].notna()].copy()
    return l, u


def evaluasi(l, u, depth, n_pohon, mcw):
    m = XGBRegressor(
        n_estimators=n_pohon,
        learning_rate=0.05,
        max_depth=depth,
        min_child_weight=mcw,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
    )
    m.fit(l[FITUR], l[TARGET] - l["base_kab"])  # belajar SELISIH dari baseline
    u = u.copy()
    u["pred"] = u["base_kab"] + m.predict(u[FITUR])
    _, presisi, rho = ukur_ranking(u, "pred")
    return presisi / Q_RISIKO, rho, mae(u[TARGET], u["pred"])


data = {n: siapkan(n) for n in LIPATAN}

# %% Pilih parameter hanya dari lipatan 2023 dan 2024
baris = []
for depth, n_pohon, mcw in GRID:
    h = [evaluasi(*data[n], depth, n_pohon, mcw) for n in ("2023", "2024")]
    baris.append(
        {
            "depth": depth,
            "n_pohon": n_pohon,
            "min_child_weight": mcw,
            "lift_rata": round(sum(x[0] for x in h) / 2, 3),
            "spearman_rata": round(sum(x[1] for x in h) / 2, 3),
            "MAE_rata": round(sum(x[2] for x in h) / 2, 4),
        }
    )
pilih = pd.DataFrame(baris).sort_values(["spearman_rata", "lift_rata"], ascending=False)
print(pilih.to_string(index=False))
pilih.to_csv("models/metrik_tuning.csv", index=False)

# baseline kabupaten sebagai acuan pada lipatan yang sama
ref = [ukur_ranking(data[n][1], "base_kab") for n in ("2023", "2024")]
mae_ref = [mae(data[n][1][TARGET], data[n][1]["base_kab"]) for n in ("2023", "2024")]
print(
    "\nBaseline kabupaten (rata-rata 2023-24): lift",
    round(sum(r[1] for r in ref) / 2 / Q_RISIKO, 3),
    "| spearman",
    round(sum(r[2] for r in ref) / 2, 3),
    "| MAE",
    round(sum(mae_ref) / 2, 4),
)

# %% Konfirmasi sekali di 2025-2026 (bukan untuk memilih parameter)
terbaik = pilih.iloc[0]
param_pilih = (
    int(terbaik["depth"]),
    int(terbaik["n_pohon"]),
    int(terbaik["min_child_weight"]),
)
print("\nKonfirmasi 2025-2026:")
for nama, p in [("terpilih", param_pilih), ("bawaan (4,300,1)", (4, 300, 1))]:
    lift, rho, e = evaluasi(*data["2025-2026"], *p)
    print(f"{nama:18s} {p}  lift {lift:.2f} | spearman {rho:.3f} | MAE {e:.4f}")
l, u = data["2025-2026"]
_, presisi, rho = ukur_ranking(u, "base_kab")
print(
    f"baseline kabupaten  lift {presisi / Q_RISIKO:.2f} | spearman {rho:.3f} | "
    f"MAE {mae(u[TARGET], u['base_kab']):.4f}"
)
