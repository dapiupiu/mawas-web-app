from datetime import datetime, timezone

import numpy as np
import pandas as pd

# --- konstanta kontrak ---
HORIZON_HARI = 30
STATUS_DATA = "model"

# --- baca input ---
s = pd.read_parquet("data/output/skor_semua_tanggal.parquet")
d = pd.read_csv("data/output/daftar_kabupaten.csv", dtype={"KDPKAB": str})
j = pd.read_csv("data/output/jembatan_fe.csv", dtype={"KDPKAB": str})

print("skor_semua_tanggal :", s.shape, "| kab unik:", s["KDPKAB"].nunique())
print("daftar_kabupaten   :", d.shape)
print("jembatan_fe        :", j.shape, "| id_fe kosong:", int(j["id_fe"].isna().sum()))

# --- 1) bentuk kerangka lengkap (semua kab di daftar x semua tanggal di skor) ---
semua_kab = d["KDPKAB"].unique()
semua_tgl = np.sort(s["tanggal"].unique())
print("\nKab di daftar:", len(semua_kab), "| tanggal:", len(semua_tgl))

kerangka = pd.MultiIndex.from_product(
    [semua_kab, semua_tgl], names=["KDPKAB", "tanggal"]
).to_frame(index=False)

# --- 2) tempel skor (kolom yang kita butuhkan saja) ---
kolom_skor = ["KDPKAB", "tanggal", "skor", "kategori", "alasan", "frac_valid", "n_valid", "n_piksel"]
ada = [k for k in kolom_skor if k in s.columns]
hilang = [k for k in kolom_skor if k not in s.columns]
if hilang:
    print("[PERINGATAN] kolom tidak ada di skor:", hilang)

x = kerangka.merge(s[ada], on=["KDPKAB", "tanggal"], how="left")
print("\nSetelah merge ke kerangka:", x.shape)
print("Baris dengan skor ada :", int(x["skor"].notna().sum()))
print("Baris dengan skor null:", int(x["skor"].isna().sum()))

# --- 3) tempel daftar kabupaten (nama, provinsi, alasan) ---
x = x.merge(
    d[["KDPKAB", "nama_kabupaten", "provinsi", "status", "alasan_kode", "alasan_teks"]],
    on="KDPKAB",
    how="left",
)

# --- 4) tempel jembatan FE ---
x = x.merge(j[["KDPKAB", "id_fe", "nama_fe"]], on="KDPKAB", how="left")
print("id_fe kosong setelah merge:", int(x["id_fe"].isna().sum()))

# --- 5) susun kolom kontrak ---
x["kode_kabupaten"] = x["KDPKAB"]
x["horizon_hari"] = HORIZON_HARI
x["status_data"] = STATUS_DATA

# skor_risiko: null kalau tidak ada skor, dibulatkan 2 desimal kalau ada
x["skor_risiko"] = x["skor"].round(2)

# kategori: kosong -> "data tidak tersedia"; ada -> pakai label kontrak
peta_kat = {"tinggi": "tinggi", "sedang": "sedang", "rendah": "rendah"}
x["kategori"] = np.where(
    x["skor_risiko"].isna(),
    "data tidak tersedia",
    x["kategori"].map(peta_kat).fillna("data tidak tersedia"),
)

# placeholder yang diisi di skrip 66
x["faktor_penyebab"] = ""
x["punya_data_cuaca"] = np.nan

# waktu dibuat (UTC, ISO dengan Z)
x["dihasilkan_pada"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# --- 6) susun kolom akhir sesuai urutan kontrak + tambahan info ---
kolom_final = [
    "kode_kabupaten", "nama_kabupaten", "provinsi", "tanggal",
    "horizon_hari", "skor_risiko", "kategori", "faktor_penyebab",
    "dihasilkan_pada", "status_data", "punya_data_cuaca",
    # tambahan untuk FE (di luar kontrak minimum, tidak wajib dipakai):
    "frac_valid", "n_valid", "n_piksel",
    "alasan_kode", "alasan_teks",
    "id_fe", "nama_fe",
]
out = x[kolom_final].copy()

# --- 7) simpan ---
out.to_parquet("data/output/risiko_kabupaten.parquet", index=False)
print("\nDisimpan: data/output/risiko_kabupaten.parquet")
print("Bentuk:", out.shape, "| kab unik:", out["kode_kabupaten"].nunique(),
      "| tanggal unik:", out["tanggal"].nunique())

# --- 8) pemeriksaan wajib ---
print("\n=== PEMERIKSAAN ===")

# 8.1 jumlah baris harus 514 x 206 = 105884
n_harap = d["KDPKAB"].nunique() * len(semua_tgl)
print(f"8.1 baris == {n_harap}:", len(out) == n_harap, f"({len(out)})")

# 8.2 kategori hanya label kontrak
label_sah = {"rendah", "sedang", "tinggi", "data tidak tersedia"}
print("8.2 kategori sah:", set(out["kategori"].unique()) <= label_sah,
      "| nilai:", out["kategori"].value_counts().to_dict())

# 8.3 skor null <=> kategori data tidak tersedia
konsisten = (out["skor_risiko"].isna() == (out["kategori"] == "data tidak tersedia")).all()
print("8.3 null <=> data tidak tersedia:", bool(konsisten))

# 8.4 tidak ada id_fe kosong
print("8.4 id_fe kosong:", int(out["id_fe"].isna().sum()), "(harus 0)")

# 8.5 tanggal 11 Sep 2026: bandingkan dengan skrip 53
x11 = out[out["tanggal"] == "2026-09-11"]
print("\n8.5 11 Sep 2026:")
print("   total baris:", len(x11))
print("   kategori  :", x11["kategori"].value_counts().to_dict())
print("   skor ada  :", int(x11["skor_risiko"].notna().sum()))

# 8.6 sampel 3 kab yang tidak pernah muncul di skor
kab_tanpa_skor = sorted(set(d["KDPKAB"]) - set(s["KDPKAB"]))
print("\n8.6 kab tanpa skor (harus 58):", len(kab_tanpa_skor))
if kab_tanpa_skor:
    contoh = out[out["kode_kabupaten"].isin(kab_tanpa_skor[:3])]
    print(contoh[["kode_kabupaten", "nama_kabupaten", "tanggal", "skor_risiko", "kategori"]].head(6).to_string(index=False))