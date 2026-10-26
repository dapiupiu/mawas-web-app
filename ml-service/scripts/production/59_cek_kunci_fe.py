import json

import pandas as pd

d = pd.read_csv("data/output/daftar_kabupaten.csv", dtype={"KDPKAB": str})
d["prefiks"] = d["KDPKAB"].str[:2]

with open("../FrontEnd/public/data/indonesia-prov.geojson", encoding="utf-8") as f:
    fe = json.load(f)["features"]
fe_kode = {str(ft["properties"]["kode"]): ft["properties"]["name"] for ft in fe}

print(
    "Prefiks unik di data kita:",
    d["prefiks"].nunique(),
    "| kode provinsi di FE:",
    len(fe_kode),
)
print("Prefiks kita yang TIDAK ada di FE:", sorted(set(d["prefiks"]) - set(fe_kode)))
print(
    "Kode FE yang TIDAK ada di prefiks kita:", sorted(set(fe_kode) - set(d["prefiks"]))
)
print(
    "FE kode 34 dan 9x:",
    {k: v for k, v in fe_kode.items() if k == "34" or k.startswith("9")},
)

print("\nKabupaten per prefiks untuk DIY dan Papua:")
sub = d[d["prefiks"].isin(["34", "91", "92"])]
print(
    sub.groupby("prefiks")
    .agg(kab=("KDPKAB", "size"), provinsi=("provinsi", lambda s: sorted(set(s))))
    .to_string()
)

# bentuk kabupaten-list.json milik FE
with open("../FrontEnd/public/data/kabupaten-list.json", encoding="utf-8") as f:
    kl = json.load(f)
items = kl if isinstance(kl, list) else list(kl.values())
print("\nkabupaten-list.json:", type(kl).__name__, "| item:", len(items))
print("contoh:", items[0])

kdp = set(d["KDPKAB"])
tanpa_titik = {k.replace(".", "") for k in kdp}
n_titik = n_tanpa = 0
for it in items:
    if isinstance(it, dict):
        vals = {str(v) for v in it.values()}
        n_titik += bool(vals & kdp)
        n_tanpa += bool(vals & tanpa_titik)
print(
    "Item FE yang cocok dengan KDPKAB 'NN.NN':",
    n_titik,
    "| format tanpa titik 'NNNN':",
    n_tanpa,
)
