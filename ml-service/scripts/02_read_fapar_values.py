import numpy as np
import rasterio

path = "data/FAPAR/2021/fpanv_m_gdo_20210101_t_300_z03.tif"

with rasterio.open(path) as src:
    data = src.read(1)  # Membaca band pertama

print("Bentuk array (baris, kolom):", data.shape)
print("Tipe data:", data.dtype)
print("Jumlah piksel total:", data.size)
print("Jumlah piksel NaN:", np.isnan(data).sum())
print("Min:", np.nanmin(data))
print("Max:", np.nanmax(data))
print("Rata-rata:", np.nanmean(data))
