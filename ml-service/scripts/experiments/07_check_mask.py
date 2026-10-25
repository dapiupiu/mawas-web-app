from pathlib import Path

import numpy as np
import rasterio

folder = Path("data/FAPAR")
files = sorted(folder.rglob("*.tif"))

zero_always = None
zero_any = None
nan_always = None
n_zero_files = 0
n_nan_files = 0
ambiguous = []

for f in files:
    with rasterio.open(f) as src:
        data = src.read(1)

    zero_mask = data == 0
    zero_frac = zero_mask.mean()

    if zero_frac > 0.5:
        n_zero_files += 1
        zero_always = zero_mask if zero_always is None else (zero_always & zero_mask)
        zero_any = zero_mask if zero_any is None else (zero_any | zero_mask)
    else:
        n_nan_files += 1
        nan_mask = np.isnan(data)
        nan_always = nan_mask if nan_always is None else (nan_always & nan_mask)
        if zero_frac > 0:
            ambiguous.append(f.name)

print("File bergaya-nol:", n_zero_files, "| bergaya-NaN:", n_nan_files)
print("File ambigu (ada nol tapi sedikit):", len(ambiguous))
print("Piksel nol di SEMUA file bergaya-nol:", int(zero_always.sum()))
print("Piksel nol di SALAH SATU file bergaya-nol:", int(zero_any.sum()))
print("Piksel NaN di SEMUA file bergaya-NaN:", int(nan_always.sum()))
print("Irisan (nol-selalu dan NaN-selalu):", int((zero_always & nan_always).sum()))
