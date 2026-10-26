import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "data" / "idn-rainfall.csv"  

# Kolom apa saja yang ada? kita butuh nama wilayah & kolom kode lain kalau ada
df = pd.read_csv(CSV, nrows=5)
print("kolom CSV:", list(df.columns))

# Baca semua baris yang PCODE = ID9109 atau adm_id terkait
usecols = [c for c in ["adm_level","adm_id","PCODE","rfh","version"] if c in df.columns]
d = pd.read_csv(CSV, usecols=usecols)

sub = d[d["PCODE"] == "ID9109"]
print("\nPCODE ID9109: total baris", len(sub))
print("adm_id unik:", sorted(sub["adm_id"].unique()))
print("jumlah baris per adm_id:")
print(sub.groupby("adm_id").size().to_string())

# Cek wilayah: baca lagi dengan kolom tambahan kalau ada (misal nama)
usecols2 = [c for c in df.columns if c in
           ("adm_level","adm_id","adm_id_alt","adm_name","region","PROVINCE","DISTRICT","name","PCODE")]
if len(usecols2) > 2:
    d2 = pd.read_csv(CSV, usecols=usecols2)
    s2 = d2[(d2["PCODE"] == "ID9109")].drop_duplicates(subset=["adm_id"])
    print("\ninfo wilayah untuk tiap adm_id:")
    print(s2.to_string())
else:
    print("\nTidak ada kolom nama wilayah di CSV; perlu cek di dokumentasi HDX.")

# Cek juga: ada PCODE lain di sekitar Papua (91xx) yang juga ganjil?
d91 = d[(d["adm_level"]==2) & d["PCODE"].astype(str).str.startswith("ID91")]
print("\nPCODE 91xx dan jumlah barisnya:")
print(d91.groupby("PCODE").size().to_string())