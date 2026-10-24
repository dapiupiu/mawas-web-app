import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "data" / "idn-rainfall.csv"   

d = pd.read_csv(CSV, usecols=["date","adm_level","adm_id","PCODE","n_pixels","rfh","rfh_avg","rfq"])
s = d[(d["PCODE"] == "ID9109") & (d["adm_level"] == 2)].copy()
s = s.sort_values(["date","adm_id"])

print("Ringkasan per adm_id:")
print(s.groupby("adm_id")[["n_pixels","rfh","rfh_avg","rfq"]].describe().to_string())

# bandingkan per dekad: apakah dua adm_id selalu muncul berdampingan?
piv = s.pivot_table(index="date", columns="adm_id", values="n_pixels", aggfunc="first")
piv["total"] = piv.sum(axis=1)
print("\n5 dekad pertama (n_pixels per adm_id + total):")
print(piv.head(5).to_string())

print("\nJumlah dekad di mana KEDUA adm_id punya baris:",
      int((piv[[1006805,1006807]].notna().sum(axis=1) == 2).sum()))
print("Jumlah dekad di mana HANYA salah satu punya baris:",
      int((piv[[1006805,1006807]].notna().sum(axis=1) == 1).sum()))

# cek: apakah n_pixels 1006805 + 1006807 konstan antar dekad?
print("\nstatistik n_pixels total (1006805+1006807):")
print(piv["total"].describe().to_string())