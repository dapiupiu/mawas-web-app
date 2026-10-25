import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
import pandas as pd
from scripts.fitur_utils import tambah_target_dan_lag_fapar

HORIZON = 3
gab = pd.read_parquet("data/training/gabungan_fapar_hujan.parquet")

# ---- prasyarat: tiap kabupaten punya 206 dekad berurutan tanpa lubang ----
ukuran = gab.groupby("KDPKAB").size()
print("Kabupaten dengan jumlah baris != 206:", int((ukuran != 206).sum()))
print("Duplikat (KDPKAB, tanggal):", int(gab.duplicated(["KDPKAB", "tanggal"]).sum()))

# ---- buat target dan lag ----
df = tambah_target_dan_lag_fapar(gab, horizon=HORIZON)
target = f"target_fapar_t{HORIZON}"

# ---- uji kebocoran: hitung target lewat jalur kedua (tanpa shift) ----
tanggal_urut = sorted(df["tanggal"].unique())
plus = dict(zip(tanggal_urut[:-HORIZON], tanggal_urut[HORIZON:]))  # t -> t+3 dekad

kiri = df[["KDPKAB", "tanggal"]].copy()
kiri["tgl_depan"] = kiri["tanggal"].map(plus)  # NaT di 3 dekad terakhir
kanan = df[["KDPKAB", "tanggal", "fapar_mean"]].rename(
    columns={"tanggal": "tgl_depan", "fapar_mean": "cek_target"}
)
cek = kiri.merge(kanan, on=["KDPKAB", "tgl_depan"], how="left")
cek = cek.sort_values(["KDPKAB", "tanggal"]).reset_index(drop=True)

sama = df[target].reset_index(drop=True).equals(cek["cek_target"])
print("\nTarget via shift == target via merge tanggal:", sama)

# ---- ringkasan NaN ----
print("\nTotal baris:", len(df))
print("Baris tanpa target:", int(df[target].isna().sum()))
print(
    "  - di 3 dekad terakhir (harapan 3 x 468 = 1404):",
    int((df["tanggal"] >= tanggal_urut[-HORIZON]).sum()),
)
print(
    "Baris dengan fapar_lag1..3 lengkap:",
    int(df[["fapar_lag1", "fapar_lag2", "fapar_lag3"]].notna().all(axis=1).sum()),
)

# apakah baris 'prelim' (hujan) punya target? (uji dugaan: tidak)
prelim = df[df["version_hujan"] != "final"]
print(
    "\nBaris prelim:",
    len(prelim),
    "| di antaranya yang punya target:",
    int(prelim[target].notna().sum()),
)

# ---- contoh untuk dilihat mata ----
contoh = df[df["KDPKAB"] == "11.01"][
    ["tanggal", "fapar_mean", "fapar_lag1", "fapar_lag2", "fapar_lag3", target]
].head(6)
print("\nKabupaten 11.01, 6 baris pertama:")
print(contoh.round(3).to_string(index=False))
