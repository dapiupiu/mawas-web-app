import json
import re

import pandas as pd

d = pd.read_csv("data/output/daftar_kabupaten.csv", dtype={"KDPKAB": str})
d["prefiks"] = d["KDPKAB"].str[:2]

# 1) apakah GeoJSON kabupaten FE punya kolom kode?
with open("../FrontEnd/public/data/indonesia-kab.geojson", encoding="utf-8") as f:
    kg = json.load(f)["features"]
print(
    "Fitur kabupaten FE:",
    len(kg),
    "| kunci properti:",
    list(kg[0]["properties"].keys()),
)
print(
    "contoh:",
    {k: v for k, v in kg[0]["properties"].items() if k not in ("bbox", "center")},
)

with open("../FrontEnd/public/data/kabupaten/11.json", encoding="utf-8") as f:
    k11 = json.load(f)
print("\nkabupaten/11.json:", type(k11).__name__)
print(str(k11)[:300])


# 2) coba cocokkan lewat (prefiks, nama ternormalisasi)
def norm(s):
    s = s.lower().strip()
    s = re.sub(r"^kabupaten administrasi\s+", "", s)
    s = re.sub(r"^kab\.\s*adm\.\s*", "", s)
    s = re.sub(r"^kota administrasi\s+", "kota ", s)
    s = re.sub(r"^kabupaten\s+", "", s)
    return re.sub(r"[^a-z0-9]", "", s)


with open("../FrontEnd/public/data/kabupaten-list.json", encoding="utf-8") as f:
    fe = pd.DataFrame(json.load(f))
fe["kunci"] = fe["prov_id"].astype(str) + "|" + fe["name"].map(norm)
d["kunci"] = d["prefiks"] + "|" + d["nama_kabupaten"].map(norm)

print(
    "\nKunci ganda di FE:",
    int(fe["kunci"].duplicated().sum()),
    "| di data kita:",
    int(d["kunci"].duplicated().sum()),
)
m = d.merge(fe[["kunci", "id", "name"]], on="kunci", how="outer", indicator=True)
print("Hasil:", m["_merge"].value_counts().to_dict())
print("\nHanya di data kita:")
print(
    m.loc[
        m["_merge"] == "left_only", ["KDPKAB", "nama_kabupaten", "provinsi"]
    ].to_string(index=False)
)
print("\nHanya di FE:")
print(
    m.loc[m["_merge"] == "right_only", ["kunci", "name", "id"]].to_string(index=False)
)
