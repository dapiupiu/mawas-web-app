from pathlib import Path
import numpy as np
import rasterio

folder = Path("data/FAPAR")
files = sorted(folder.rglob("*.tif"))
print("Jumlah file:", len(files))
print("File pertama:", files[0].name)
print("File terakhir:", files[-1].name)

shapes = set()
bounds = set()
nan_pcts = []

for f in files:
    with rasterio.open(f) as src:
        shapes.add(src.shape)
        bounds.add(tuple(round(b, 3) for b in src.bounds))
        nan_pcts.append(np.isnan(src.read(1)).mean() * 100)

print("Ukuran grid yang ada:", shapes)
print("Bounds yang ada:", bounds)
print("Nan% min/rata-rata/max:",
      round(min(nan_pcts), 1),
      round(float(np.mean(nan_pcts)), 1),
      round(max(nan_pcts), 1))