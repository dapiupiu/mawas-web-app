import pandas as pd

AWAL_UJI = pd.Timestamp("2025-01-01")
GAP_DEKAD = 3


def muat_tabel(path="data/training/tabel_training.parquet"):
    return pd.read_parquet(path)


def bagi_latih_uji(df, awal_uji=AWAL_UJI, gap=GAP_DEKAD):
    """Bagi tabel jadi (latih, uji) berdasarkan waktu.

    Hanya baris target_andal. Baris di jeda `gap` dekad sebelum
    awal_uji dibuang agar target latih tidak menyentuh periode uji.
    """
    tanggal = df["tanggal"].drop_duplicates().sort_values().reset_index(drop=True)
    nomor = pd.Series(tanggal.index, index=tanggal)
    nomor_dekad = df["tanggal"].map(nomor)

    idx_uji = int((tanggal < awal_uji).sum())  # nomor dekad pertama periode uji
    andal = df["target_andal"]

    latih = df[andal & (nomor_dekad <= idx_uji - gap - 1)]
    uji = df[andal & (nomor_dekad >= idx_uji)]
    return latih.copy(), uji.copy()