import json

import numpy as np
import pandas as pd

MIN_PORSI_KAB, MIN_N_BERSKOR = 0.5, 3
BATAS_SEDANG, BATAS_TINGGI = 20, 40  # persen kabupaten 'tinggi'

s = pd.read_parquet("data/output/skor_semua_tanggal.parquet", columns=["KDPKAB", "tanggal", "kategori"])
d = pd.read_csv("data/output/daftar_kabupaten.csv", dtype={"KDPKAB": str})
with open("../FrontEnd/public/data/indonesia-prov.geojson", encoding="utf-8") as f:
    nama_prov = {str(ft["properties"]["kode"]): ft["properties"]["name"] for ft in json.load(f)["features"]}

s["prov_kode"] = s["KDPKAB"].str[:2]
d["prov_kode"] = d["KDPKAB"].str[:2]
total = d.groupby("prov_kode").size().rename("n_kab_total")

s["berskor"] = s["kategori"] != "tidak_tersedia"
s["is_tinggi"] = s["kategori"] == "tinggi"
s["is_sedang"] = s["kategori"] == "sedang"
g = s.groupby(["prov_kode", "tanggal"])[["berskor", "is_tinggi", "is_sedang"]].sum()
g.columns = ["n_berskor", "n_tinggi", "n_sedang"]
idx = pd.MultiIndex.from_product([sorted(total.index), sorted(s["tanggal"].unique())],
                                 names=["prov_kode", "tanggal"])
g = g.reindex(idx, fill_value=0).reset_index().merge(total, left_on="prov_kode", right_index=True)

# pengecekan silang: jumlah ber-skor per tanggal harus sama dengan tabel kabupaten
tot = g.groupby("tanggal")["n_berskor"].sum()
ref = s.groupby("tanggal")["berskor"].sum()
assert (tot.values == ref.reindex(tot.index).values).all(), "jumlah ber-skor tidak cocok"

layak = (g["n_berskor"] >= MIN_PORSI_KAB * g["n_kab_total"]) & (g["n_berskor"] >= MIN_N_BERSKOR)
g["porsi_kab_berskor"] = (g["n_berskor"] / g["n_kab_total"]).round(3)
g["pct_tinggi"] = np.where(layak, g["n_tinggi"] / g["n_berskor"].replace(0, np.nan) * 100, np.nan).round(1)
g["status_provinsi"] = np.where(layak, "tersedia", "data_tidak_cukup")
g["alasan_kode"] = np.select(
    [layak, g["n_berskor"] == 0, g["n_berskor"] < MIN_N_BERSKOR],
    ["", "tidak_ada_kabupaten_berskor", "kabupaten_berskor_kurang_dari_3"],
    default="cakupan_kabupaten_kurang",
)
g["kategori_provinsi"] = np.select(
    [~layak,
     g["n_tinggi"] * 100 >= BATAS_TINGGI * g["n_berskor"],
     g["n_tinggi"] * 100 >= BATAS_SEDANG * g["n_berskor"]],
    ["tidak_tersedia", "tinggi", "sedang"],
    default="rendah",
)
g["nama_provinsi"] = g["prov_kode"].map(nama_prov)

kolom = ["prov_kode", "nama_provinsi", "tanggal", "n_kab_total", "n_berskor", "n_tinggi", "n_sedang",
         "porsi_kab_berskor", "pct_tinggi", "status_provinsi", "kategori_provinsi", "alasan_kode"]
g[kolom].to_parquet("data/output/provinsi_semua_tanggal.parquet", index=False)

# pemeriksaan
urut = ["tinggi", "sedang", "rendah", "tidak_tersedia"]
print("Baris:", len(g), "(harus 34 x 206 = 7004) | pengecekan silang: lolos")
print("Angka tipikal nasional (kabupaten tinggi dari yang ber-skor):",
      round(s["is_tinggi"].sum() / s["berskor"].sum() * 100, 1), "%")
print("\nKategori provinsi, semua baris:", g["kategori_provinsi"].value_counts().reindex(urut, fill_value=0).to_dict())
lay = g[g["status_provinsi"] == "tersedia"]
print("Dari baris layak (%):", (lay["kategori_provinsi"].value_counts(normalize=True) * 100).round(1).to_dict())
print("Alasan tidak layak:", g.loc[g["alasan_kode"] != "", "alasan_kode"].value_counts().to_dict())
for tg in ["2026-09-11", "2026-06-01", "2026-01-11", "2025-09-11", "2025-03-21"]:
    y = g[g["tanggal"] == tg]
    print(tg, y["kategori_provinsi"].value_counts().reindex(urut, fill_value=0).to_dict())