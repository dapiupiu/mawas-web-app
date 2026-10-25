# %% Muat data
import json
from pathlib import Path

import pandas as pd

from model_utils import muat_tabel

df = muat_tabel()
andal = df[df["target_andal"] & df["fapar_mean"].notna()]

# %% Kebiasaan tiap kabupaten = rata-rata FAPAR anomali selama periode data
kebiasaan = (
    andal.groupby("KDPKAB")["fapar_mean"]
    .agg(kebiasaan_fapar="mean", n_dekad="size")
    .reset_index()
)
print("Jumlah kabupaten:", len(kebiasaan))
print(kebiasaan[["kebiasaan_fapar", "n_dekad"]].describe().round(3))

# %% Contoh skor sungguhan pada tanggal terakhir di tabel
terakhir = df["tanggal"].max()
skrg = df[df["tanggal"] == terakhir].merge(kebiasaan, on="KDPKAB", how="left")
skrg["deviasi"] = skrg["fapar_mean"] - skrg["kebiasaan_fapar"]
print(
    "\nTanggal:", terakhir.date(),
    "| kabupaten di tabel:", len(skrg),
    "| FAPAR kosong:", int(skrg["fapar_mean"].isna().sum()),
    "| tanpa kebiasaan:", int(skrg["kebiasaan_fapar"].isna().sum()),
)

# nama kabupaten dari GeoJSON bersih (hanya agar mudah dibaca manusia)
with open("data/geojson/kabupaten_clean.geojson", encoding="utf-8") as f:
    fitur = json.load(f)["features"]
nama = {x["properties"].get("KDPKAB"): x["properties"].get("WADMKK") for x in fitur}
skrg["nama"] = skrg["KDPKAB"].map(nama)

kolom = ["KDPKAB", "nama", "fapar_mean", "kebiasaan_fapar", "deviasi"]
print("\n10 kabupaten dengan deviasi paling negatif (paling jauh di bawah kebiasaan):")
print(skrg.sort_values("deviasi").head(10)[kolom].round(2).to_string(index=False))

# %% Simpan
Path("models").mkdir(exist_ok=True)
kebiasaan.to_csv("models/kebiasaan_kabupaten.csv", index=False)

meta = {
    "definisi_skor": "deviasi = fapar_mean(t) - kebiasaan_fapar(kabupaten); makin negatif makin jauh di bawah kebiasaan",
    "kebiasaan": "rata-rata fapar_mean per kabupaten pada baris target_andal",
    "periode_kebiasaan": [str(andal["tanggal"].min().date()), str(andal["tanggal"].max().date())],
    "n_kabupaten": int(len(kebiasaan)),
    "tanggal_terakhir_di_tabel": str(terakhir.date()),
    "ambang_kategori": "belum ditetapkan",
}
Path("models/skor_meta.json").write_text(
    json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8"
)
print("\ntersimpan: models/kebiasaan_kabupaten.csv dan models/skor_meta.json")