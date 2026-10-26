import json
import re

import pandas as pd

d = pd.read_csv("data/output/daftar_kabupaten.csv", dtype={"KDPKAB": str})
d["prefiks"] = d["KDPKAB"].str[:2]

with open("../FrontEnd/public/data/kabupaten-list.json", encoding="utf-8") as f:
    fe = pd.DataFrame(json.load(f))
fe["prov_id"] = fe["prov_id"].astype(str)


def norm(s):
    s = s.lower().strip()
    s = re.sub(r"^administrasi\s+", "", s)
    s = re.sub(r"^kabupaten administrasi\s+", "", s)
    s = re.sub(r"^kab\.\s*adm\.\s*", "", s)
    s = re.sub(r"^kota administrasi\s+", "kota ", s)
    s = re.sub(r"^kabupaten\s+", "", s)
    return re.sub(r"[^a-z0-9]", "", s)


# kode provinsi untuk kabupaten di FE berbeda dari data kita (hanya Papua)
PREFIKS_FE = {"91": "94", "92": "91"}
d["prov_fe"] = d["prefiks"].map(lambda p: PREFIKS_FE.get(p, p))
d["kunci"] = d["prov_fe"] + "|" + d["nama_kabupaten"].map(norm)
fe["kunci"] = fe["prov_id"] + "|" + fe["name"].map(norm)

j = d.merge(fe[["kunci", "id", "name"]], on="kunci", how="left")
j = j.rename(columns={"id": "id_fe", "name": "nama_fe"})
j["metode_cocok"] = j["id_fe"].notna().map({True: "nama", False: ""})

# pasangan manual (nama berubah / beda ejaan), dipaksa oleh eliminasi dalam provinsi yang sama
MANUAL = {
    "12.12": "kabupaten-toba-samosir",
    "31.01": "kabupaten-kepulauan-seribu",
    "64.11": "kabupaten-mahakam-hulu",
    "71.09": "kabupaten-siau-tagulandang-biaro",
    "73.10": "kabupaten-pangkajene-dan-kepulauan",
    "76.01": "kabupaten-mamuju-utara",
    "81.03": "kabupaten-maluku-tenggara-barat",
}
for kd, fid in MANUAL.items():
    baris = fe[fe["id"] == fid]
    assert len(baris) == 1, f"id FE tidak ditemukan: {fid}"
    i = j.index[(j["KDPKAB"] == kd) & j["id_fe"].isna()]
    if len(i) == 1:
        assert baris.iloc[0]["prov_id"] == j.loc[i[0], "prov_fe"], (
            f"provinsi tidak cocok: {kd}"
        )
        j.loc[i[0], ["id_fe", "nama_fe", "metode_cocok"]] = [
            fid,
            baris.iloc[0]["name"],
            "manual",
        ]

# pemeriksaan
print("Baris:", len(j), "| KDPKAB unik:", j["KDPKAB"].nunique())
print("Metode:", j["metode_cocok"].value_counts().to_dict())
print("id_fe kosong:", int(j["id_fe"].isna().sum()))
print("id_fe terpakai dua kali:", int(j["id_fe"].dropna().duplicated().sum()))
print("id FE yang tidak terpakai:", sorted(set(fe["id"]) - set(j["id_fe"].dropna())))
print(j[j["id_fe"].isna()][["KDPKAB", "nama_kabupaten"]].to_string(index=False))

# contoh Papua
print(
    j[j["KDPKAB"].isin(["91.01", "92.01", "92.03", "31.01"])][
        ["KDPKAB", "nama_kabupaten", "id_fe", "metode_cocok"]
    ].to_string(index=False)
)

j[["KDPKAB", "id_fe", "nama_fe", "metode_cocok"]].to_csv(
    "data/output/jembatan_fe.csv", index=False, encoding="utf-8"
)
