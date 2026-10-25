import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
# %% load data dan split
import json
from pathlib import Path

import numpy as np
import pandas as pd
import xgboost
from xgboost import XGBRegressor

from scripts.model_utils import (
    muat_tabel,
    bagi_latih_uji,
    FITUR,
    TARGET,
    mae,
    rmse,
    AWAL_UJI,
    GAP_DEKAD,
)

PARAM = dict(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=4,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
)

df = muat_tabel()
latih, uji = bagi_latih_uji(df)
uji = uji.copy()

# %% Model 1: dilatih sampai 2024, dipakai untuk metrik
model_uji = XGBRegressor(**PARAM).fit(latih[FITUR], latih[TARGET])
uji["pred_xgb"] = model_uji.predict(uji[FITUR])
uji["pred_rata"] = uji["KDPKAB"].map(latih.groupby("KDPKAB")[TARGET].mean())
uji["pred_median"] = uji["KDPKAB"].map(latih.groupby("KDPKAB")[TARGET].median())
uji["pred_persistence"] = uji["fapar_mean"]

# %% Tabel metrik (baseline dan XGBoost pada baris yang sama)
sama = uji[uji["fapar_mean"].notna()]
baris = []
for nama, kolom in [
    ("rata-rata per kabupaten", "pred_rata"),
    ("median per kabupaten", "pred_median"),
    ("persistence", "pred_persistence"),
    ("XGBoost", "pred_xgb"),
]:
    baris.append(
        {
            "model": nama,
            "n_baris_uji": len(sama),
            "MAE": round(mae(sama[TARGET], sama[kolom]), 4),
            "RMSE": round(rmse(sama[TARGET], sama[kolom]), 4),
        }
    )
baris.append(
    {
        "model": "XGBoost (semua baris uji)",
        "n_baris_uji": len(uji),
        "MAE": round(mae(uji[TARGET], uji["pred_xgb"]), 4),
        "RMSE": round(rmse(uji[TARGET], uji["pred_xgb"]), 4),
    }
)
metrik = pd.DataFrame(baris)
print(metrik.to_string(index=False))

# %% Model 2: final, dilatih pada semua baris target_andal
andal = df[df["target_andal"]]
model_final = XGBRegressor(**PARAM).fit(andal[FITUR], andal[TARGET])

# %% save
Path("models").mkdir(exist_ok=True)
model_uji.save_model("models/xgb_fapar_t3_latih2024.json")
model_final.save_model("models/xgb_fapar_t3_final.json")
metrik.to_csv("models/metrik_perbandingan.csv", index=False)

meta = {
    "target": TARGET,
    "fitur": FITUR,
    "param": PARAM,
    "versi_xgboost": xgboost.__version__,
    "batas_uji_awal": str(AWAL_UJI.date()),
    "gap_dekad": GAP_DEKAD,
    "n_latih": len(latih),
    "n_uji": len(uji),
    "n_final": len(andal),
    "tanggal_terakhir_final": str(andal["tanggal"].max().date()),
}
Path("models/model_meta.json").write_text(
    json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8"
)

# %% Cek: model yang dimuat ulang harus memberi prediksi identik
cek = XGBRegressor()
cek.load_model("models/xgb_fapar_t3_latih2024.json")
print(
    "Prediksi identik setelah dimuat ulang:",
    bool(np.allclose(cek.predict(uji[FITUR]), uji["pred_xgb"])),
)
for f in sorted(Path("models").iterdir()):
    print(f.name, round(f.stat().st_size / 1024, 1), "KB")
