from collections import defaultdict
from pathlib import Path

import numpy as np
import rasterio

folder = Path("data/FAPAR")
files = sorted(folder.rglob("*.tif"))

groups = defaultdict(list)

for f in files:
    with rasterio.open(f) as src:
        data = src.read(1)
    nan_pct = np.isnan(data).mean() * 100
    zero_pct = (data == 0).mean() *100
    suffix = "_".join(f.stem.split("_")[4:])
    groups[suffix].append((nan_pct, zero_pct))

    if f.name in (
        "fpanv_m_gdo_20220621_t_300_z01.tif",
        "fpanv_m_gdo_20210121_t_300_z03.tif",
    ):
        print(f.name, "NaN%:", round(nan_pct, 1), "nol%:", round(zero_pct, 1))

print("\n Ringkasan per akhiran nama file:")
for suffix, vals in sorted(groups.items()):
    nan_mean = np.mean([v[0] for v in vals])
    zero_mean = np.mean([v[1] for v in vals])
    print(suffix, "| jumlah:", len(vals),
          "| NaN% rata-rata:", round(float(nan_mean), 1),
          "| nol% rata-rata:", round(float(zero_mean), 1))