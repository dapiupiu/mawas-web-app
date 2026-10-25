from pathlib import Path
import rasterio
from fapar_utils import baca_fapar, bersihkan_fapar, buat_mask_kabupaten, hitung_zonal

GEOJSON = "data/geojson/kabupaten_clean.geojson"
files = sorted(Path("data/FAPAR").rglob("*.tif"))
print("Contoh nama file:", [f.name for f in files[:3]], "...", files[-1].name)

with rasterio.open(files[0]) as src:
    transform, shape = src.transform, src.shape
masks = buat_mask_kabupaten(GEOJSON, transform, shape)

for f in [files[0], files[100]]:
    arr = bersihkan_fapar(baca_fapar(f))
    df = hitung_zonal(arr, masks)
    df["frac_valid"] = df["n_valid"] / df["n_piksel"]

    print("\n=====", f.name, "=====")
    print("Kabupaten:", len(df), "| fapar_mean NaN:", int(df["fapar_mean"].isna().sum()))
    print(df["fapar_mean"].describe().round(3).to_string())
    print("Rata-rata frac_valid:", round(df["frac_valid"].mean(), 3))
    print("Kabupaten dengan frac_valid == 1:", int((df["frac_valid"] == 1).sum()))
    print(df.head(5).to_string())