import json

import numpy as np
import pandas as pd

MIN_PORSI_KAB, MIN_N_BERSKOR = 0.5, 3

s = pd.read_parquet(
    "data/output/skor_semua_tanggal.parquet", columns=["KDPKAB", "tanggal", "kategori"]
)
d = pd.read_csv("data/output/daftar_kabupaten.csv", dtype={"KDPKAB": str})
with open("../FrontEnd/public/data/indonesia-prov.geojson", encoding="utf-8") as f:
    nama_prov = {
        str(ft["properties"]["kode"]): ft["properties"]["name"]
        for ft in json.load(f)["features"]
    }

d["prov_kode"] = d["KDPKAB"].str[:2]
s["prov_kode"] = s["KDPKAB"].str[:2]
total = d.groupby("prov_kode").size().rename("n_kab_total")
print("Provinsi:", len(total), "| total kabupaten:", int(total.sum()))

s["berskor"] = s["kategori"] != "tidak_tersedia"
g = s.groupby(["prov_kode", "tanggal"]).agg(
    n_berskor=("berskor", "sum"),
    n_tinggi=("kategori", lambda k: int((k == "tinggi").sum())),
    n_sedang=("kategori", lambda k: int((k == "sedang").sum())),
)
idx = pd.MultiIndex.from_product(
    [sorted(total.index), sorted(s["tanggal"].unique())], names=["prov_kode", "tanggal"]
)
g = (
    g.reindex(idx, fill_value=0)
    .reset_index()
    .merge(total, left_on="prov_kode", right_index=True)
)

g["porsi_kab_berskor"] = g["n_berskor"] / g["n_kab_total"]
g["layak"] = (g["porsi_kab_berskor"] >= MIN_PORSI_KAB) & (
    g["n_berskor"] >= MIN_N_BERSKOR
)
g["pct_tinggi"] = np.where(
    g["layak"], g["n_tinggi"] / g["n_berskor"].replace(0, np.nan) * 100, np.nan
)
g["nama"] = g["prov_kode"].map(nama_prov)

# pengecekan silang dengan skrip 53 (11 Sep 2026: 341 ber-skor, 69 tinggi, 25 sedang)
x = g[g["tanggal"] == "2026-09-11"]
print(
    "\n11 Sep 2026 | jumlah ber-skor:",
    int(x["n_berskor"].sum()),
    "| tinggi:",
    int(x["n_tinggi"].sum()),
    "| sedang:",
    int(x["n_sedang"].sum()),
)

# berapa provinsi layak per tanggal
per_tgl = (
    g[g["layak"]]
    .groupby("tanggal")
    .size()
    .reindex(sorted(s["tanggal"].unique()), fill_value=0)
)
print(
    "\nProvinsi layak per tanggal: min",
    per_tgl.min(),
    "| median",
    per_tgl.median(),
    "| maks",
    per_tgl.max(),
)
for tg in ["2026-09-11", "2026-06-01", "2026-01-11", "2025-09-11", "2025-03-21"]:
    print(" ", tg, per_tgl.loc[tg])

# sebaran pct_tinggi pada baris layak
p = g.loc[g["layak"], "pct_tinggi"]
print("\npct_tinggi (baris layak):", len(p), "baris")
print(p.quantile([0.1, 0.25, 0.5, 0.75, 0.9, 0.95]).round(1).to_dict())

# provinsi yang jarang layak
jarang = g.groupby(["prov_kode", "nama"])["layak"].mean().round(2).sort_values()
print("\nProvinsi dengan porsi tanggal layak terendah:")
print(jarang.head(12).to_string())

# tabel 11 Sep 2026
print("\n11 Sep 2026, urut pct_tinggi:")
print(
    x.sort_values("pct_tinggi", ascending=False)[
        [
            "prov_kode",
            "nama",
            "n_kab_total",
            "n_berskor",
            "n_tinggi",
            "pct_tinggi",
            "layak",
        ]
    ]
    .round(1)
    .to_string(index=False)
)
