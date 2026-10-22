# %% load data dan split (sama dengan baseline)
import pandas as pd
from xgboost import XGBRegressor
from model_utils import muat_tabel, bagi_latih_uji, FITUR, TARGET, mae, rmse

df = muat_tabel()
latih, uji = bagi_latih_uji(df)
print(len(latih), len(uji), len(FITUR))

# %% Latih XGBoost
model = XGBRegressor(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=4,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
)
model.fit(latih[FITUR], latih[TARGET])

# %% Prediksi dan bandingkan pada baris yang sama dengan baseline
uji = uji.copy()
uji["pred_xgb"] = model.predict(uji[FITUR])
uji["pred_rata"] = uji["KDPKAB"].map(latih.groupby("KDPKAB")[TARGET].mean())

sama = uji[uji["fapar_mean"].notna()]  # 20.578 baris, sama dengan 36_baseline.py
print("Baris dinilai (sama):", len(sama))
hasil = [
    {"model": "rata-rata per kabupaten (baseline)",
     "MAE": round(mae(sama[TARGET], sama["pred_rata"]), 3),
     "RMSE": round(rmse(sama[TARGET], sama["pred_rata"]), 3)},
    {"model": "XGBoost",
     "MAE": round(mae(sama[TARGET], sama["pred_xgb"]), 3),
     "RMSE": round(rmse(sama[TARGET], sama["pred_xgb"]), 3)},
]
print(pd.DataFrame(hasil).to_string(index=False))

# %% XGBoost pada SEMUA baris uji (termasuk yang fapar_mean kosong)
print("XGBoost, semua", len(uji), "baris uji:",
      "MAE", round(mae(uji[TARGET], uji["pred_xgb"]), 3),
      "RMSE", round(rmse(uji[TARGET], uji["pred_xgb"]), 3))

# %% Fitur apa yang paling dipakai model
imp = pd.Series(model.feature_importances_, index=FITUR).sort_values(ascending=False)
print(imp.round(3).to_string())