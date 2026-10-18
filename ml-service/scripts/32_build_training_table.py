import pandas as pd
from fitur_utils import tambah_target_dan_lag_fapar, tambah_lag

HORIZON = 3
OUT = "data/training/tabel_training.parquet"

gab = pd.read_parquet("data/training/gabungan_fapar_hujan.parquet")

df = tambah_target_dan_lag_fapar(gab, horizon=HORIZON)
df = tambah_lag(df, "rfh")
df = tambah_lag(df, "rfq")
df["bulan"] = df["tanggal"].dt.month

# ---- uji kebocoran lag lewat jalur kedua (merge tanggal, tanpa shift) ----
tanggal_urut = sorted(df["tanggal"].unique())


def cek_lag(df, kolom, k):
    mundur = dict(zip(tanggal_urut[k:], tanggal_urut[:-k]))  # t -> t-k dekad
    kiri = df[["KDPKAB", "tanggal"]].copy()
    kiri["tgl_lalu"] = kiri["tanggal"].map(mundur)
    kanan = df[["KDPKAB", "tanggal", kolom]].rename(
        columns={"tanggal": "tgl_lalu", kolom: "cek"}
    )
    cek = kiri.merge(kanan, on=["KDPKAB", "tgl_lalu"], how="left")
    cek = cek.sort_values(["KDPKAB", "tanggal"]).reset_index(drop=True)
    hasil = df.sort_values(["KDPKAB", "tanggal"])[f"{kolom}_lag{k}"].reset_index(drop=True)
    return hasil.equals(cek["cek"])


print("Uji lag via merge tanggal:")
for kolom in ["fapar_mean", "rfh", "rfq"]:
    for k in (1, 2, 3):
        nama = "fapar" if kolom == "fapar_mean" else kolom
        # kolom lag FAPAR bernama fapar_lag{k}; yang lain {kolom}_lag{k}
        if kolom == "fapar_mean":
            df["fapar_mean_lag%d" % k] = df["fapar_lag%d" % k]
        print(f"  {kolom} lag{k}:", cek_lag(df, kolom, k))
df = df.drop(columns=[f"fapar_mean_lag{k}" for k in (1, 2, 3)])

# ---- susun tabel training ----
fitur = [
    "fapar_mean", "fapar_lag1", "fapar_lag2", "fapar_lag3",
    "rfh", "rfh_lag1", "rfh_lag2", "rfh_lag3",
    "rfq", "rfq_lag1", "rfq_lag2", "rfq_lag3",
    "r1h", "r3h", "r1q", "r3q", "bulan",
]
target = f"target_fapar_t{HORIZON}"
kunci = ["KDPKAB", "tanggal"]
meta = ["status_fapar", "metode_mask", "n_piksel", "n_valid", "frac_valid",
        "version_hujan", "anomaly_status"]

tabel = df[df["status_fapar"] == "tersedia"][kunci + meta + fitur + [target]].copy()
tabel["punya_target"] = tabel[target].notna()
tabel = tabel.sort_values(kunci).reset_index(drop=True)
tabel.to_parquet(OUT, index=False)

# ---- ringkasan ----
print("\nBaris:", len(tabel), "| harapan 456 x 206 =", 456 * 206)
print("Kabupaten:", tabel["KDPKAB"].nunique())
print("Baris punya_target:", int(tabel["punya_target"].sum()))
lab = tabel[tabel["punya_target"]]
print("Rentang tanggal baris berlabel:", lab["tanggal"].min().date(), "->", lab["tanggal"].max().date())
print("Baris berlabel dengan SEMUA fitur lengkap:", int(lab[fitur].notna().all(axis=1).sum()))

print("\nJumlah NaN per fitur (seluruh tabel):")
nan = tabel[fitur + [target]].isna().sum()
print(nan[nan > 0].to_string())

print("\nStatistik target (baris berlabel):")
print(lab[target].describe().round(3).to_string())
print("\nDisimpan ke:", OUT)