import pandas as pd

x = pd.read_parquet("data/output/risiko_kabupaten.parquet")
d = pd.read_csv("data/output/daftar_kabupaten.csv", dtype={"KDPKAB": str})

# 1) 41 kab tanpa cuaca: berapa Papua, berapa bukan?
tanpa_cuaca = x[~x["punya_data_cuaca"]][["kode_kabupaten"]].drop_duplicates()
tanpa_cuaca["prefiks"] = tanpa_cuaca["kode_kabupaten"].str[:2]
tanpa_cuaca["papua_lama"] = tanpa_cuaca["prefiks"].isin(["91", "92"])
print("1) 41 kab tanpa cuaca:")
print("   Papua lama (91,92):", int(tanpa_cuaca["papua_lama"].sum()))
print("   Non-Papua         :", int((~tanpa_cuaca["papua_lama"]).sum()))
print("   Daftar non-Papua  :")
non_papua = tanpa_cuaca[~tanpa_cuaca["papua_lama"]]
print(non_papua.merge(d[["KDPKAB", "nama_kabupaten", "provinsi"]],
                      left_on="kode_kabupaten", right_on="KDPKAB")
      [["kode_kabupaten", "nama_kabupaten", "provinsi"]].to_string(index=False))

# 2) baris dengan faktor_penyebab == "Data tidak tersedia." (fallback generik)
gen = x[x["faktor_penyebab"] == "Data tidak tersedia."]
print(f"\n2) Baris dengan 'Data tidak tersedia.' (generik): {len(gen)}")
print("   Kab unik:", gen["kode_kabupaten"].nunique())
print("   Tanggal unik:", gen["tanggal"].nunique())
print("   Contoh 5 kab:")
print(gen[["kode_kabupaten", "nama_kabupaten", "tanggal", "kategori"]]
      .head(5).to_string(index=False))

# apakah kab ini punya alasan_teks di daftar_kabupaten?
m = d.set_index("KDPKAB")
gen_kab = gen["kode_kabupaten"].unique()
status_map = m.loc[[k for k in gen_kab if k in m.index], "status"].value_counts().to_dict()
print("   Status di daftar_kabupaten:", status_map)
print("   alasan_kode:", m.loc[[k for k in gen_kab if k in m.index], "alasan_kode"].value_counts().to_dict())

# 3) cek silang: 41 kab tanpa cuaca, apakah semua barisnya faktor_penyebabnya = alasan_skor (bukan pesan cuaca)?
papua_tanpa = x[(~x["punya_data_cuaca"]) & (x["kode_kabupaten"].str[:2].isin(["91", "92"]))]
print(f"\n3) Baris Papua tanpa cuaca: {len(papua_tanpa)}")
print("   faktor_penyebab unik:")
print(papua_tanpa["faktor_penyebab"].value_counts().to_string())