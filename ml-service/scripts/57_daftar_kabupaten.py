import json

import numpy as np
import pandas as pd

BATAS_SERING_KOSONG = 0.2

with open("data/geojson/kabupaten_clean.geojson", encoding="utf-8") as f:
    gj = json.load(f)
g = pd.DataFrame(
    [
        {
            "KDPKAB": str(x["properties"]["KDPKAB"]),
            "nama_kabupaten": x["properties"]["WADMKK"],
            "provinsi": x["properties"]["WADMPR"],
            "punya_poligon": bool(x.get("geometry"))
            and bool(x["geometry"].get("coordinates")),
        }
        for x in gj["features"]
    ]
)
m = pd.read_csv("data/mapping/pcode_to_kdpkab.csv", dtype=str)
s = pd.read_parquet("data/output/skor_semua_tanggal.parquet")

per = s.groupby("KDPKAB").agg(
    n_tanggal=("tanggal", "size"),
    n_berskor=("alasan", lambda a: int((a == "").sum())),
    n_piksel_median=("n_piksel", "median"),
)
per["porsi_berskor"] = (per["n_berskor"] / per["n_tanggal"]).round(3)

# alasan paling sering untuk dekad tanpa skor
dom = (
    s[s["alasan"] != ""]
    .groupby("KDPKAB")["alasan"]
    .agg(lambda a: a.value_counts().idxmax())
    .rename("alasan_dominan")
)

d = g.merge(per, on="KDPKAB", how="left").merge(dom, on="KDPKAB", how="left")
d["di_tabel"] = d["n_tanggal"].notna()
d["di_mapping"] = d["KDPKAB"].isin(set(m["KDPKAB"]))

d["status"] = np.select(
    [~d["di_tabel"], d["porsi_berskor"] < BATAS_SERING_KOSONG],
    ["tidak_tercakup", "sering_kosong"],
    default="dipantau",
)

d["alasan_kode"] = np.select(
    [
        d["status"] == "dipantau",
        ~d["di_tabel"] & ~d["punya_poligon"],
        ~d["di_tabel"] & ~d["di_mapping"],
        ~d["di_tabel"],
        d["alasan_dominan"].isin(["tanpa_kebiasaan", "kebiasaan_kurang_dekad"]),
        d["alasan_dominan"] == "data_tipis",
    ],
    [
        "",
        "tanpa_batas_wilayah",
        "tanpa_data_curah_hujan",
        "fapar_tidak_tersedia",
        "kebiasaan_tidak_cukup",
        "data_tipis",
    ],
    default="fapar_kosong_dekad_ini",
)

TEKS = {
    "": "",
    "tanpa_batas_wilayah": "Batas wilayah tidak tersedia di data.",
    "tanpa_data_curah_hujan": "Kode wilayah tidak cocok dengan data curah hujan.",
    "fapar_tidak_tersedia": "Data satelit vegetasi kosong pada sebagian besar periode.",
    "kebiasaan_tidak_cukup": "Data historis terlalu sedikit untuk menentukan kondisi biasanya.",
    "data_tipis": "Wilayah kecil atau sering tertutup awan, jadi piksel satelit yang valid sedikit.",
    "fapar_kosong_dekad_ini": "Data satelit sering kosong pada periode ini.",
}
d["alasan_teks"] = d["alasan_kode"].map(TEKS)

kolom = [
    "KDPKAB",
    "nama_kabupaten",
    "provinsi",
    "status",
    "alasan_kode",
    "alasan_teks",
    "porsi_berskor",
    "n_piksel_median",
]
d = d[kolom].sort_values("KDPKAB")
d.to_csv("data/output/daftar_kabupaten.csv", index=False, encoding="utf-8")

print("Baris:", len(d), "| KDPKAB unik:", d["KDPKAB"].nunique())
print(d["status"].value_counts().to_dict())
print()
print(pd.crosstab(d["status"], d["alasan_kode"]).to_string())
print("\nsering_kosong yang BUKAN data_tipis / kebiasaan_tidak_cukup:")
print(
    d[
        (d["status"] == "sering_kosong")
        & ~d["alasan_kode"].isin(["data_tipis", "kebiasaan_tidak_cukup"])
    ][["KDPKAB", "nama_kabupaten", "porsi_berskor"]].to_string(index=False)
)
