import json

import pandas as pd

with open("data/geojson/kabupaten_clean.geojson", encoding="utf-8") as f:
    gj = json.load(f)


def punya_geom(ft):
    g = ft.get("geometry")
    return bool(g) and bool(g.get("coordinates"))


g = pd.DataFrame(
    [
        {
            "KDPKAB": str(ft["properties"]["KDPKAB"]),
            "nama": ft["properties"]["WADMKK"],
            "provinsi": ft["properties"]["WADMPR"],
            "punya_poligon": punya_geom(ft),
        }
        for ft in gj["features"]
    ]
)

s = pd.read_parquet("data/output/skor_semua_tanggal.parquet")
per_kab = (
    s.groupby("KDPKAB")
    .agg(
        n_tanggal=("tanggal", "size"),
        n_berskor=("alasan", lambda a: int((a == "").sum())),
    )
    .reset_index()
)
per_kab["porsi_berskor"] = (per_kab["n_berskor"] / per_kab["n_tanggal"]).round(3)

m = g.merge(per_kab, on="KDPKAB", how="outer", indicator=True)

print("GeoJSON:", len(g), "| punya poligon:", int(g["punya_poligon"].sum()))
print("Di tabel skor:", len(per_kab))
print("Status gabungan:", m["_merge"].value_counts().to_dict())
print(
    "Di tabel tapi tidak di GeoJSON (harus 0):",
    int((m["_merge"] == "right_only").sum()),
)

tdk = m[m["_merge"] == "left_only"]
print(
    "\nDi GeoJSON, tidak di tabel:",
    len(tdk),
    "| tanpa poligon:",
    int((~tdk["punya_poligon"]).sum()),
    "| punya poligon:",
    int(tdk["punya_poligon"].sum()),
)
print(
    tdk.loc[tdk["punya_poligon"], ["KDPKAB", "nama", "provinsi"]].to_string(index=False)
)

ada = m[m["_merge"] == "both"]
print("\nPorsi tanggal ber-skor per kabupaten (456 kab):")
print(ada["porsi_berskor"].describe().round(3))
print("Tidak pernah ber-skor:", int((ada["n_berskor"] == 0).sum()))
for batas in [0.2, 0.5]:
    print(
        f"Ber-skor di < {batas:.0%} tanggal:", int((ada["porsi_berskor"] < batas).sum())
    )
print(
    ada.nsmallest(10, "porsi_berskor")[
        ["KDPKAB", "nama", "provinsi", "n_berskor", "porsi_berskor"]
    ].to_string(index=False)
)
