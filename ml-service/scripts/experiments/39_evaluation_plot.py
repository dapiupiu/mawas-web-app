import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
# %% load model yang sudah disimpan dan data uji
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import r2_score
from xgboost import XGBRegressor

from scripts.model_utils import muat_tabel, bagi_latih_uji, FITUR, TARGET, mae

df = muat_tabel()
latih, uji = bagi_latih_uji(df)

model = XGBRegressor()
model.load_model("models/xgb_fapar_t3_latih2024.json")

uji = uji.copy()
uji["pred_xgb"] = model.predict(uji[FITUR])
uji["pred_rata"] = uji["KDPKAB"].map(latih.groupby("KDPKAB")[TARGET].mean())
sama = uji[uji["fapar_mean"].notna()].copy()  # 20.578 baris, sama dengan tabel metrik

# %% R2 Score (porsi variasi yang dijelaskan; 0 = sama dengan menebak rata-rata)
print("R2 XGBoost :", round(r2_score(sama[TARGET], sama["pred_xgb"]), 3))
print("R2 baseline:", round(r2_score(sama[TARGET], sama["pred_rata"]), 3))

# %% Gambar 3 panel
Path("docs/evaluasi").mkdir(parents=True, exist_ok=True)
fig, ax = plt.subplots(1, 3, figsize=(17, 5))

# 1) prediksi vs sebenarnya
hb = ax[0].hexbin(
    sama[TARGET], sama["pred_xgb"], gridsize=60, bins="log", cmap="viridis"
)
lo = min(sama[TARGET].min(), sama["pred_xgb"].min())
hi = max(sama[TARGET].max(), sama["pred_xgb"].max())
ax[0].plot([lo, hi], [lo, hi], "r--", lw=1)
ax[0].set_xlabel("Nilai sebenarnya")
ax[0].set_ylabel("Prediksi XGBoost")
ax[0].set_title("Prediksi vs sebenarnya (garis merah = sempurna)")
fig.colorbar(hb, ax=ax[0], label="jumlah baris (skala log)")

# 2) histogram selisih
sel_x = sama[TARGET] - sama["pred_xgb"]
sel_b = sama[TARGET] - sama["pred_rata"]
batas = np.linspace(-4, 4, 81)
ax[1].hist(sel_b, bins=batas, alpha=0.5, label="baseline rata-rata")
ax[1].hist(sel_x, bins=batas, alpha=0.5, label="XGBoost")
ax[1].set_xlabel("Selisih (sebenarnya - prediksi)")
ax[1].set_ylabel("Jumlah baris")
ax[1].set_title("Sebaran selisih (di luar -4..4 tidak tampil)")
ax[1].legend()

# 3) MAE per bulan
per_bulan = sama.groupby("bulan").apply(
    lambda g: [mae(g[TARGET], g["pred_xgb"]), mae(g[TARGET], g["pred_rata"])],
    include_groups=False,
)
bulan = per_bulan.index.to_list()
m_x = [v[0] for v in per_bulan]
m_b = [v[1] for v in per_bulan]
ax[2].plot(bulan, m_b, marker="o", label="baseline rata-rata")
ax[2].plot(bulan, m_x, marker="o", label="XGBoost")
ax[2].set_xticks(range(1, 13))
ax[2].set_xlabel("Bulan")
ax[2].set_ylabel("MAE")
ax[2].set_title("MAE per bulan (data uji)")
ax[2].legend()

plt.tight_layout()
plt.savefig("docs/evaluasi/evaluasi_xgboost.png", dpi=130)
print("tersimpan: docs/evaluasi/evaluasi_xgboost.png")
print(per_bulan.apply(lambda v: [round(v[0], 3), round(v[1], 3)]).to_string())
print("Selisih > 4 mutlak:", int((sel_x.abs() > 4).sum()), "baris")
