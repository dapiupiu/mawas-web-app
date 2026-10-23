"""Inspeksi kolom alasan untuk 3 kabupaten representatif."""
import pandas as pd

x = pd.read_parquet("data/output/risiko_kabupaten.parquet")
kolom = [
    "kode_kabupaten",
    "nama_kabupaten",
    "kategori",
    "alasan_kode",
    "alasan_teks",
    "alasan_baris",
    "faktor_penyebab",
    "punya_data_cuaca",
]
for kode in ["12.71", "91.71", "16.74"]:
    print(f"--- {kode} ---")
    print(x[x["kode_kabupaten"] == kode][kolom].to_string(index=False))
    print()