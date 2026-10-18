"""Fungsi bantu untuk data FAPAR anomaly (raster GeoTIFF)."""

import json
from rasterio.features import geometry_mask
import numpy as np
import rasterio
import pandas as pd


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


def buat_mask_kabupaten(geojson_path, transform, shape, paksa_all_touched=False):
    """Buat mask boolean per kabupaten. Kembalikan dict: KDPKAB -> (mask, metode).

    Default: piksel masuk jika titik tengahnya di dalam poligon; jika hasilnya
    0 piksel, ulangi dengan all_touched=True.
    paksa_all_touched=True: langsung pakai all_touched untuk semua kabupaten.
    """
    with open(geojson_path, encoding="utf-8") as f:
        fitur = json.load(f)["features"]

    hasil = {}
    for ft in fitur:
        geom = ft["geometry"]
        if geom is None:  # 7 kabupaten tanpa poligon dilewati
            continue
        kode = ft["properties"]["KDPKAB"]

        if paksa_all_touched:
            mask = geometry_mask(
                [geom], out_shape=shape, transform=transform,
                invert=True, all_touched=True,
            )
            metode = "all_touched"
        else:
            mask = geometry_mask([geom], out_shape=shape, transform=transform, invert=True)
            metode = "titik_tengah"
            if mask.sum() == 0:
                mask = geometry_mask(
                    [geom], out_shape=shape, transform=transform,
                    invert=True, all_touched=True,
                )
                metode = "all_touched"
        hasil[kode] = (mask, metode)
    return hasil

def hitung_zonal(arr_bersih, masks):
    """Rata-rata FAPAR per kabupaten dari satu array yang sudah dibersihkan.

    Kembalikan DataFrame: KDPKAB, fapar_mean, n_piksel, n_valid, metode_mask.
    fapar_mean = NaN jika tidak ada piksel valid di dalam kabupaten.
    """
    baris = []
    for kode, (mask, metode) in masks.items():
        nilai = arr_bersih[mask]
        valid = nilai[~np.isnan(nilai)]
        baris.append(
            {
                "KDPKAB": kode,
                "fapar_mean": float(valid.mean()) if valid.size > 0 else np.nan,
                "n_piksel": int(mask.sum()),
                "n_valid": int(valid.size),
                "metode_mask": metode,
            }
        )
    return pd.DataFrame(baris)
