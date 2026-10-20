import pandas as pd
import numpy as np

AWAL_UJI = pd.Timestamp("2025-01-01")
GAP_DEKAD = 3


def muat_tabel(path="data/training/tabel_training.parquet"):
    return pd.read_parquet(path)


def bagi_latih_uji(df, awal_uji=AWAL_UJI, gap=GAP_DEKAD, akhir_uji=None):
    """Bagi tabel jadi (latih, uji) berdasarkan waktu.

    Hanya baris target_andal. Baris di jeda `gap` dekad sebelum
    awal_uji dibuang agar target latih tidak menyentuh periode uji.
    Jika akhir_uji diisi, uji hanya mencakup tanggal < akhir_uji.
    """
    tanggal = df["tanggal"].drop_duplicates().sort_values().reset_index(drop=True)
    nomor = pd.Series(tanggal.index, index=tanggal)
    nomor_dekad = df["tanggal"].map(nomor)

    idx_uji = int((tanggal < awal_uji).sum())  # nomor dekad pertama periode uji
    andal = df["target_andal"]

    mask_uji = andal & (nomor_dekad >= idx_uji)
    if akhir_uji is not None:
        mask_uji = mask_uji & (df["tanggal"] < akhir_uji)

    latih = df[andal & (nomor_dekad <= idx_uji - gap - 1)]
    uji = df[mask_uji]
    return latih.copy(), uji.copy()


TARGET = "target_fapar_t3"
FITUR = [
    "fapar_mean",
    "fapar_lag1",
    "fapar_lag2",
    "fapar_lag3",
    "rfh",
    "rfh_lag1",
    "rfh_lag2",
    "rfh_lag3",
    "rfq",
    "rfq_lag1",
    "rfq_lag2",
    "rfq_lag3",
    "r1h",
    "r3h",
    "r1q",
    "r3q",
    "bulan",
]  # 17 fitur; frac_valid_t3 sengaja TIDAK ikut (memuat info t+3)


def mae(y, p):
    return float(np.mean(np.abs(y - p)))


def rmse(y, p):
    return float(np.sqrt(np.mean((y - p) ** 2)))
