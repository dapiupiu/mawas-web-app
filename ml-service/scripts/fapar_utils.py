"""Fungsi bantu untuk data FAPAR anomaly (raster GeoTIFF)."""

import numpy as np
import rasterio


def baca_fapar(path):
    """Baca band 1 dari satu file .tif sebagai array float32 (203 x 551)."""
    with rasterio.open(path) as src:
        return src.read(1).astype("float32")


def bersihkan_fapar(arr):
    """Ubah semua nilai tepat 0 menjadi NaN, kembalikan salinan.

    Alasan: 30 file FAPAR menandai piksel non-daratan dengan 0, bukan NaN.
    Array asli tidak diubah.
    """
    bersih = arr.copy()
    bersih[bersih == 0] = np.nan
    return bersih
