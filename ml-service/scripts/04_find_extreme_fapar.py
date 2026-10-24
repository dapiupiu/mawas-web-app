from pathlib import Path
import numpy as np
import rasterio

folder = Path("data/FAPAR")
files = sorted(folder.rglob("*.tif"))

rows = []
nodata_values = set()

for f in files:
    with rasterio.open(f) as src:
        data = src.read(1)
        nodata_values.add(str(src.nodata))
        rows.append({
            "file": f.name,
            "nan_pct": np.isnan(data).mean() * 100,
            "min": float(np.nanmin(data)),
            "max": float(np.nanmax(data)),
        })

rows.sort(key=lambda r: r["nan_pct"])

print("Nilai nodata di metadata:", nodata_values)
print("Jumlah file dengan NaN < 50%:", sum(r["nan_pct"] < 50 for r in rows))

print("\n 5 file dengan NaN% terendah:")
for r in rows[:5]:
    print(r["file"], round(r["nan_pct"], 1), round(r["min"], 2), round(r["max"], 2))

print("\n 5 file dengan NaN% tertinggi:")
for r in rows[-5:]:
    print(r["file"], round(r["nan_pct"], 1), round(r["min"], 2), round(r["max"], 2))