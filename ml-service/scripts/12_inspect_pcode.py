import re
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "data" / "idn-rainfall.csv" 

# Baca hanya kolom yang perlu
usecols = ["adm_level", "adm_id", "PCODE", "rfh"]
df = pd.read_csv(CSV, usecols=usecols)

print("total baris:", len(df))
print("adm_level unik:", sorted(df["adm_level"].unique()))

# filter kabupaten (adm_level == 2) sesuai konteks
d = df[df["adm_level"] == 2].copy()
print("baris kabupaten (adm_level=2):", len(d))

# cek format PCODE
bad_fmt = d[~d["PCODE"].astype(str).str.match(r"^ID\d{4}$")]
print("\nPCODE bukan pola ID+4 digit:", len(bad_fmt))
print(bad_fmt[["adm_id", "PCODE"]].drop_duplicates().head(20).to_string())

# cari PCODE ganda: hitung berapa kali muncul PER DEKAD (pakai adm_id+rfh? tidak—
# cek: dalam satu 'snapshot' (baris ke-N per dekad), PCODE mana yang >1)
# hitung total kemunculan PCODE, lalu bagi dengan jumlah dekad.
n_dekad = d["PCODE"].value_counts().max()  # approx; nanti diperbaiki
print("\nPCODE dengan total kemunculan tertinggi (top 5):")
print(d["PCODE"].value_counts().head(5).to_string())

# Lihat langsung PCODE yang jumlah barisnya ganjil/bukan kelipatan dekad
# (karena tiap PCODE normalnya muncul sekali per dekad)
counts = d["PCODE"].value_counts()
print("\ndistribusi jumlah baris per PCODE:")
print(counts.describe().to_string())
print("\nPCODE dengan jumlah baris PALING SEDIKIT (kemungkinan ada/muncul hanya sebagian dekad):")
print(counts.sort_values().head(10).to_string())

# Cek spesifik: PCODE mana yang >1 di dekad tertentu.
# Asumsi: file terurut per dekad, tapi kita tidak punya kolom tanggal di usecols.
# Cari dengan groupby berdasarkan PCODE lalu lihat apakah ada PCODE yang
# total kemunculannya BUKAN median.
median = int(counts.median())
odd = counts[counts != median]
print(f"\nmedian kemunculan per PCODE: {median}")
print(f"PCODE dengan kemunculan != median: {len(odd)}")
print(odd.to_string())

# Cek pasangan (adm_id, PCODE) — kalau PCODE ganda karena 2 adm_id
pair = d[["adm_id", "PCODE"]].drop_duplicates()
print("\npasangan (adm_id, PCODE) unik:", len(pair))
dup_pcode = pair[pair["PCODE"].duplicated(keep=False)].sort_values("PCODE")
print("PCODE yang dipakai >1 adm_id:")
print(dup_pcode.to_string())