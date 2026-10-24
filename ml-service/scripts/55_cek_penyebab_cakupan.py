import json
from pathlib import Path

import pandas as pd

# 1) cari file pendukung
print("FILE DITEMUKAN:")
temu = []
for pola in ["*pcode*", "*zonal*"]:
    for p in sorted(Path("data").rglob(pola)):
        if p.is_file():
            temu.append(p)
            print(" ", p, p.stat().st_size, "byte")

for p in temu:
    try:
        df = pd.read_parquet(p) if p.suffix == ".parquet" else pd.read_csv(p, dtype=str)
    except Exception as e:
        print("\nTidak bisa dibaca:", p, e)
        continue
    print(f"\n{p.name}: {df.shape}")
    print("  kolom:", list(df.columns))
    print(df.head(2).to_string())

# 2) cek dugaan: kota yang tidak pernah ber-skor punya sedikit piksel?
s = pd.read_parquet("data/output/skor_semua_tanggal.parquet")
with open("data/geojson/kabupaten_clean.geojson", encoding="utf-8") as f:
    nama = {
        str(x["properties"]["KDPKAB"]): x["properties"]["WADMKK"]
        for x in json.load(f)["features"]
    }

per = s.groupby("KDPKAB").agg(
    n_piksel=("n_piksel", "median"),
    n_berskor=("alasan", lambda a: int((a == "").sum())),
)
nol = per[per["n_berskor"] == 0]
print("\nTidak pernah ber-skor:", len(nol))
print("n_piksel:", nol["n_piksel"].describe().round(1).to_dict())
print("n_piksel < 3:", int((nol["n_piksel"] < 3).sum()), "dari", len(nol))

sisa = nol[nol["n_piksel"] >= 3].copy()
sisa["nama"] = sisa.index.map(nama)
print("\nYang n_piksel >= 3 tapi tetap tidak pernah ber-skor:", len(sisa))
print(sisa.to_string())
