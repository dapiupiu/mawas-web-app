import json
import pandas as pd

hujan = pd.read_parquet("data/rainfall/rainfall_kabupaten.parquet")
fapar = pd.read_parquet("data/fapar_zonal/fapar_kabupaten_final.parquet")
hujan = hujan.rename(columns={"date": "tanggal"})  # samakan nama kolom tanggal

with open("data/geojson/kabupaten_clean.geojson", encoding="utf-8") as f:
    nama = {
        ft["properties"]["KDPKAB"]: ft["properties"]["WADMKK"]
        for ft in json.load(f)["features"]
    }

# 1. kunci harus unik di kedua tabel
print(
    "Duplikat (KDPKAB, tanggal) hujan:",
    int(hujan.duplicated(["KDPKAB", "tanggal"]).sum()),
)
print(
    "Duplikat (KDPKAB, tanggal) fapar:",
    int(fapar.duplicated(["KDPKAB", "tanggal"]).sum()),
)

# 2. format kode: panjang teks harus seragam ("NN.NN" = 5 karakter)
print("\nPanjang KDPKAB hujan:", hujan["KDPKAB"].str.len().value_counts().to_dict())
print("Panjang KDPKAB fapar:", fapar["KDPKAB"].str.len().value_counts().to_dict())

# 3. dekad
dh, df_ = set(hujan["tanggal"]), set(fapar["tanggal"])
print("\nDekad hujan:", len(dh), "| dekad fapar:", len(df_))
print("Dekad persis sama:", dh == df_)
print(
    "Hanya di hujan:", sorted(dh - df_)[:5], "| hanya di fapar:", sorted(df_ - dh)[:5]
)

# 4. kabupaten
kh, kf = set(hujan["KDPKAB"]), set(fapar["KDPKAB"])
print("\nKabupaten hujan:", len(kh), "| fapar:", len(kf))
print("Irisan:", len(kh & kf))
print("Hanya di hujan:", len(kh - kf), [(k, nama.get(k, "?")) for k in sorted(kh - kf)])
print("Hanya di fapar:", len(kf - kh))

# 5. outer join sebagai pemeriksaan (hanya kunci, tidak disimpan)
m = fapar[["KDPKAB", "tanggal"]].merge(
    hujan[["KDPKAB", "tanggal"]], how="outer", indicator=True
)
print("\nHasil outer join pada kunci:")
print(m["_merge"].value_counts().to_string())
print("Harapan 'both' (irisan x dekad):", len(kh & kf) * len(dh & df_))
