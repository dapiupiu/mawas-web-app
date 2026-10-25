import json

import pandas as pd

d = pd.read_csv("data/output/daftar_kabupaten.csv", dtype={"KDPKAB": str})
print("Provinsi di daftar kabupaten:", d["provinsi"].nunique())
print(
    d.groupby("provinsi")
    .agg(
        kab=("KDPKAB", "size"),
        dipantau=("status", lambda s: int((s == "dipantau").sum())),
        sering_kosong=("status", lambda s: int((s == "sering_kosong").sum())),
        tidak_tercakup=("status", lambda s: int((s == "tidak_tercakup").sum())),
    )
    .to_string()
)

with open("../FrontEnd/public/data/indonesia-prov.geojson", encoding="utf-8") as f:
    fe = json.load(f)["features"]
print("\nFitur provinsi di FE:", len(fe))
print("Kunci properti:", list(fe[0]["properties"].keys()))
for ft in fe[:3]:
    print(ft["properties"])

# apakah nama WADMPR ada sebagai nilai properti di FE?
nilai_fe = {str(v).strip().upper() for ft in fe for v in ft["properties"].values()}
wadmpr = set(d["provinsi"].dropna().str.strip())
print(
    "\nWADMPR yang TIDAK ditemukan di properti FE:",
    sorted(p for p in wadmpr if p.upper() not in nilai_fe),
)
