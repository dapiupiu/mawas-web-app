import json

import pandas as pd

s = pd.read_parquet("data/output/skor_semua_tanggal.parquet")
m = pd.read_csv("data/mapping/pcode_to_kdpkab.csv", dtype=str)
with open("data/geojson/kabupaten_clean.geojson", encoding="utf-8") as f:
    gj = json.load(f)
g = pd.DataFrame(
    [
        {
            "KDPKAB": str(x["properties"]["KDPKAB"]),
            "nama": x["properties"]["WADMKK"],
            "provinsi": x["properties"]["WADMPR"],
            "punya_poligon": bool(x.get("geometry"))
            and bool(x["geometry"].get("coordinates")),
        }
        for x in gj["features"]
    ]
)

# A) 14 kabupaten: piksel cukup tapi tidak pernah ber-skor
sisa = [
    "11.71",
    "11.74",
    "16.71",
    "31.72",
    "31.74",
    "31.75",
    "32.74",
    "33.74",
    "33.75",
    "35.78",
    "65.71",
    "71.11",
    "71.73",
    "74.07",
]
x = s[s["KDPKAB"].isin(sisa)].copy()
x["alasan"] = x["alasan"].replace("", "ok")
print("A) Alasan per kabupaten (jumlah dari 206 dekad):")
print(pd.crosstab(x["KDPKAB"], x["alasan"]).to_string())
print("\nMedian n_valid dan frac_valid (hanya dekad yang FAPAR-nya ada):")
y = x[x["fapar_mean"].notna()]
print(y.groupby("KDPKAB")[["n_valid", "frac_valid"]].median().round(2).to_string())

# B) 58 kabupaten di luar tabel
ada = set(s["KDPKAB"])
tdk = g[~g["KDPKAB"].isin(ada)].copy()
tdk["di_mapping"] = tdk["KDPKAB"].isin(set(m["KDPKAB"]))
print("\nB) 58 di luar tabel:", len(tdk))
print(
    pd.crosstab(
        tdk["punya_poligon"],
        tdk["di_mapping"],
        rownames=["punya_poligon"],
        colnames=["di_mapping"],
    )
)

dm = tdk[tdk["di_mapping"]].merge(
    m[["KDPKAB", "has_geometry", "merged", "anomaly_status"]], on="KDPKAB", how="left"
)
print("\nDi mapping tapi tidak di tabel:", len(dm))
print(
    dm[["KDPKAB", "nama", "provinsi", "punya_poligon", "has_geometry"]].to_string(
        index=False
    )
)
