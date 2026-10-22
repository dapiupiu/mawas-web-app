import shutil
from pathlib import Path

import numpy as np
import pandas as pd

# --- konstanta aturan (BMKG) ---
AMBANG_BAWAH = 85
AMBANG_ATAS = 115

BERKAS = Path("data/output/risiko_kabupaten.parquet")
BACKUP = Path("data/output/risiko_kabupaten_sebelum66.parquet")
SKOR = Path("data/output/skor_semua_tanggal.parquet")
RAIN = Path("data/rainfall/rainfall_kabupaten.parquet")
DAFTAR = Path("data/output/daftar_kabupaten.csv")

# backup hanya jika belum ada
if not BACKUP.exists():
    shutil.copy(BERKAS, BACKUP)
    print("Backup dibuat:", BACKUP)

# --- baca input ---
x = pd.read_parquet(BERKAS)
r = pd.read_parquet(RAIN)
s = pd.read_parquet(SKOR)
d = pd.read_csv(DAFTAR, dtype={"KDPKAB": str})

print("risiko_kabupaten :", x.shape)
print("skor             :", s.shape)
print("rainfall         :", r.shape)

# --- siapkan rainfall ---
r2 = r[["KDPKAB", "date", "rfq", "r1q", "r3q", "version", "anomaly_status"]].rename(
    columns={
        "KDPKAB": "kode_kabupaten",
        "date": "tanggal",
        "version": "hujan_version",
        "anomaly_status": "hujan_anomaly_status",
    }
)

# --- siapkan alasan per-baris dari skor 53 ---
s2 = s[["KDPKAB", "tanggal", "alasan"]].rename(
    columns={"KDPKAB": "kode_kabupaten", "alasan": "alasan_baris"}
)

# --- reset kolom yang akan diisi ulang ---
x = x.drop(columns=["faktor_penyebab", "punya_data_cuaca",
                    "rfq", "r1q", "r3q",
                    "hujan_version", "hujan_anomaly_status",
                    "alasan_baris"], errors="ignore")

# --- join rainfall + alasan per-baris ---
x = x.merge(r2, on=["kode_kabupaten", "tanggal"], how="left")
x = x.merge(s2, on=["kode_kabupaten", "tanggal"], how="left")
print("\nSetelah join:", x.shape)
print("rfq ada   :", int(x["rfq"].notna().sum()))
print("rfq null  :", int(x["rfq"].isna().sum()))
print("alasan_baris ada :", int(x["alasan_baris"].notna().sum()))

# --- daftar 41 kab tanpa cuaca (untuk konteks Papua) ---
kab_tanpa_cuaca = sorted(set(d["KDPKAB"]) - set(r["KDPKAB"]))
def konteks_papua(kode):
    return kode[:2] in {"91", "92"}

def pesan_cuaca_tidak_ada(kode):
    if kode in kab_tanpa_cuaca:
        if konteks_papua(kode):
            return ("data curah hujan belum tersedia untuk wilayah ini "
                    "(kabupaten pemekaran Papua, di luar cakupan CHIRPS pipeline)")
        return "data curah hujan belum tersedia untuk wilayah ini"
    return "data curah hujan tidak tersedia pada tanggal ini"

# --- kamus alasan per-baris -> teks manusiawi ---
TEKS_ALASAN = {
    "data_tipis": "data satelit vegetasi pada periode ini terlalu sedikit untuk dinilai (awan/tutupan)",
    "fapar_kosong_dekad_ini": "data satelit vegetasi kosong pada periode ini",
    "kebiasaan_kurang_dekad": "data historis terlalu sedikit untuk menentukan kondisi biasanya",
    "tanpa_kebiasaan": "tidak ada data historis pembanding untuk wilayah ini",
}

# --- tiap baris: alasan skor ---
# kalau alasan_baris ada & tidak kosong -> pakai kamus
# kalau alasan_baris kosong (ber-skor) -> tidak perlu alasan (pakai label hujan)
# kalau alasan_baris NaN (kab tidak ada di skor) -> pakai alasan_teks dari daftar (statis)
def alasan_skor(row):
    a = row["alasan_baris"]
    if isinstance(a, str) and a != "":
        return TEKS_ALASAN.get(a, a)
    if pd.isna(a):
        # kab tidak ada di skor: alasan statis dari daftar
        kode = row.get("alasan_kode", "")
        # kalau alasan statis adalah "tanpa data cuaca", jangan dipakai:
        # pesan cuaca (di bawah) sudah menjelaskan hal yang sama
        if kode == "tanpa_data_curah_hujan":
            return ""
        t = row["alasan_teks"]
        if isinstance(t, str) and t:
            return t.rstrip(".").lower()
        return "data tidak tersedia untuk wilayah ini"
    return ""  # ber-skor, bukan kasus tidak tersedia

x["_alasan_skor"] = x.apply(alasan_skor, axis=1)

# --- label hujan BMKG ---
label_hujan = np.select(
    [x["rfq"] < AMBANG_BAWAH, x["rfq"] <= AMBANG_ATAS, x["rfq"] > AMBANG_ATAS],
    [
        "hujan 10 hari terakhir di bawah normal",
        "hujan 10 hari terakhir mendekati normal",
        "hujan 10 hari terakhir di atas normal",
    ],
    default="",
)

# --- pesan cuaca tidak ada (per baris) ---
pesan_cuaca = x["kode_kabupaten"].map(pesan_cuaca_tidak_ada)

# --- gabung empat kasus ---
skor_ada = x["skor_risiko"].notna()
cuaca_ada = x["rfq"].notna()
alasan_ada = x["_alasan_skor"] != ""

# gabungan untuk kasus 4: alasan skor + pesan cuaca, tanpa pemisah kalau alasan kosong
gabung_4 = np.where(
    x["_alasan_skor"] == "",
    pesan_cuaca,
    x["_alasan_skor"].str.cat(pesan_cuaca, sep="; "),
)
# pengecualian: kalau alasan skor adalah "batas wilayah tidak tersedia",
# jangan tambahkan pesan cuaca (tidak relevan karena wilayahnya tidak bisa dipetakan)
batas_tidak_ada = x["alasan_kode"].fillna("") == "tanpa_batas_wilayah"
gabung_4 = np.where(batas_tidak_ada, x["_alasan_skor"], gabung_4)

faktor = pd.Series(
    np.select(
        [
            skor_ada & cuaca_ada,       # 1
            skor_ada & ~cuaca_ada,      # 2
            ~skor_ada & cuaca_ada,      # 3
            ~skor_ada & ~cuaca_ada,     # 4
        ],
        [
            label_hujan,                                        # 1
            pesan_cuaca,                                        # 2
            x["_alasan_skor"],                                  # 3
            gabung_4,   # 4
        ],
        default="",
    ),
    index=x.index,
    dtype="object",
).fillna("")

# kapitalkan huruf pertama, aman untuk string kosong
faktor = faktor.where(faktor == "", faktor.str[0].str.upper() + faktor.str[1:])
x["faktor_penyebab"] = faktor
x["punya_data_cuaca"] = cuaca_ada
x = x.drop(columns=["_alasan_skor"])

# --- pemeriksaan ---
print("\n=== PEMERIKSAAN ===")
print("Baris:", len(x), "| kab unik:", x["kode_kabupaten"].nunique(),
      "| tanggal unik:", x["tanggal"].nunique())
print("faktor_penyebab kosong:", int((x["faktor_penyebab"] == "").sum()), "(harus 0)")
print("punya_data_cuaca:", x["punya_data_cuaca"].value_counts().to_dict())

print("\nfaktor_penyebab (semua tanggal):")
print(x["faktor_penyebab"].value_counts().head(20).to_string())

print("\n11 Sep 2026:")
x11 = x[x["tanggal"] == "2026-09-11"]
print("  total:", len(x11))
print("  punya_data_cuaca:", x11["punya_data_cuaca"].value_counts().to_dict())
print(x11["faktor_penyebab"].value_counts().head(10).to_string())

print("\nContoh Papua tanpa skor & tanpa cuaca (harus memuat dua alasan):")
contoh = x[(x["kode_kabupaten"].str[:2].isin(["91", "92"]))
           & (~x["punya_data_cuaca"]) & x["skor_risiko"].isna()].head(3)
print(contoh[["kode_kabupaten", "nama_kabupaten", "tanggal",
              "skor_risiko", "faktor_penyebab"]].to_string(index=False))

print("\nContoh kab yang dulu kena fallback 'Data tidak tersedia.' (harus memuat alasan spesifik):")
contoh2 = x[(x["kode_kabupaten"] == "11.01") & x["skor_risiko"].isna()].head(3)
print(contoh2[["kode_kabupaten", "nama_kabupaten", "tanggal",
               "skor_risiko", "faktor_penyebab"]].to_string(index=False))

x.to_parquet(BERKAS, index=False)
print("\nDisimpan ulang:", BERKAS)
print("Bentuk:", x.shape)