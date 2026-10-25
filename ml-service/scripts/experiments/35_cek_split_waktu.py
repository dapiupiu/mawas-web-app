from model_utils import muat_tabel, bagi_latih_uji

df = muat_tabel()
latih, uji = bagi_latih_uji(df)

print("LATIH:", len(latih), latih["tanggal"].min().date(), "->", latih["tanggal"].max().date())
print("UJI  :", len(uji), uji["tanggal"].min().date(), "->", uji["tanggal"].max().date())