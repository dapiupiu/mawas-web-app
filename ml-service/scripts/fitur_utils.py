"""Fungsi pembuatan fitur dan target untuk tabel training Mawas."""
import pandas as pd


def tambah_target_dan_lag_fapar(df, horizon=3, lags=(1, 2, 3)):
    """Tambahkan fapar_lag{k} dan target_fapar_t{horizon}.

    Semua penggeseran dilakukan DI DALAM tiap kabupaten (groupby KDPKAB).
    Lag memakai shift(k)  -> nilai dari k dekad SEBELUMNYA (aman, masa lalu).
    Target memakai shift(-horizon) -> nilai dari `horizon` dekad KE DEPAN.
    Prasyarat: tiap kabupaten punya dekad berurutan tanpa lubang.
    """
    df = df.sort_values(["KDPKAB", "tanggal"]).copy()
    g = df.groupby("KDPKAB")["fapar_mean"]
    for k in lags:
        df[f"fapar_lag{k}"] = g.shift(k)
    df[f"target_fapar_t{horizon}"] = g.shift(-horizon)
    return df