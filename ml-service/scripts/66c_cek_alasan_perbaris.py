# scripts/66c_cek_alasan_perbaris.py
import pandas as pd

s = pd.read_parquet("data/output/skor_semua_tanggal.parquet")
print("Kolom skor_semua_tanggal:", list(s.columns))
print("\nNilai 'alasan' (semua tanggal):")
print(s["alasan"].value_counts(dropna=False).to_string())
print("\nBaris dengan alasan == '' (ber-skor):", int((s["alasan"] == "").sum()))