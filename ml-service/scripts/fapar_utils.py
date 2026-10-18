"""Fungsi bantu untuk data FAPAR anomaly (raster GeoTIFF)."""

import json
from rasterio.features import geometry_mask
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


def buat_mask_kabupaten(geojson_path, transform, shape):
    """Buat mask boolean per kabupaten. Kembalikan dict: KDPKAB -> (mask, metode).

    Default: piksel masuk jika titik tengahnya di dalam poligon.
    Jika hasilnya 0 piksel (poligon sangat kecil), ulangi dengan all_touched=True.
    """
    with open(geojson_path, encoding="utf-8") as f:
        fitur = json.load(f)["features"]

    hasil = {}
    for ft in fitur:
        geom = ft["geometry"]
        if geom is None:  # 7 kabupaten tanpa poligon dilewati
            continue
        kode = ft["properties"]["KDPKAB"]

        # invert=True -> True berarti DI DALAM poligon
        mask = geometry_mask([geom], out_shape=shape, transform=transform, invert=True)
        metode = "titik_tengah"
        if mask.sum() == 0:
            mask = geometry_mask(
                [geom],
                out_shape=shape,
                transform=transform,
                invert=True,
                all_touched=True,
            )
            metode = "all_touched"
        hasil[kode] = (mask, metode)
    return hasil


def buat_mask_kabupaten(geojson_path, transform, shape):
    """Buat mask boolean per kabupaten. Kembalikan dict: KDPKAB -> (mask, metode).

    Default: piksel masuk jika titik tengahnya di dalam poligon.
    Jika hasilnya 0 piksel (poligon sangat kecil), ulangi dengan all_touched=True.
    """
    with open(geojson_path, encoding="utf-8") as f:
        fitur = json.load(f)["features"]

    hasil = {}
    for ft in fitur:
        geom = ft["geometry"]
        if geom is None:  # 7 kabupaten tanpa poligon dilewati
            continue
        kode = ft["properties"]["KDPKAB"]

        # invert=True -> True berarti DI DALAM poligon
        mask = geometry_mask([geom], out_shape=shape, transform=transform, invert=True)
        metode = "titik_tengah"
        if mask.sum() == 0:
            mask = geometry_mask(
                [geom],
                out_shape=shape,
                transform=transform,
                invert=True,
                all_touched=True,
            )
            metode = "all_touched"
        hasil[kode] = (mask, metode)
    return hasil
