import json
from datetime import datetime, timezone

import pandas as pd

# --- konstanta ---
TANGGAL_ACUAN = "2026-09-11"   # ganti ke "2026-10-11" kalau pilih opsi (ii)
HORIZON_HARI = 30
STATUS_DATA = "model"

# --- baca tabel kontrak dari 65a ---
x = pd.read_parquet("data/output/risiko_kabupaten.parquet")
y = x[x["tanggal"] == TANGGAL_ACUAN].copy()
print("Baris tanggal", TANGGAL_ACUAN, ":", len(y))
if len(y) == 0:
    raise SystemExit(f"Tidak ada baris untuk tanggal {TANGGAL_ACUAN}")

# --- susun item data sesuai kontrak ---
def ke_item(r):
    return {
        "kode_kabupaten": r["kode_kabupaten"],
        "nama_kabupaten": r["nama_kabupaten"],
        "provinsi": r["provinsi"],
        "tanggal": r["tanggal"].strftime("%Y-%m-%d"),
        "horizon_hari": int(r["horizon_hari"]),
        "skor_risiko": None if pd.isna(r["skor_risiko"]) else round(float(r["skor_risiko"]), 2),
        "kategori": r["kategori"],
        "faktor_penyebab": "",          # diisi skrip 66
        "dihasilkan_pada": r["dihasilkan_pada"],
        "status_data": r["status_data"],
        "punya_data_cuaca": None,       # diisi skrip 66
    }

data = [ke_item(r) for _, r in y.iterrows()]

# --- ringkasan ---
ringkasan = {
    "total_kabupaten": len(data),
    "kategori": {},
}
for it in data:
    ringkasan["kategori"][it["kategori"]] = ringkasan["kategori"].get(it["kategori"], 0) + 1

dihasilkan_pada = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

payload = {
    "dihasilkan_pada": dihasilkan_pada,
    "status_data": STATUS_DATA,
    "horizon_hari": HORIZON_HARI,
    "tanggal_acuan": TANGGAL_ACUAN,
    "sumber_kode": "daftar_kabupaten.csv",
    "catatan": (
        "Output model Mawas (aturan deviasi FAPAR). "
        "Skor = persentil antar-kabupaten pada tanggal yang sama; "
        "indikasi relatif, bukan prakiraan akurat. "
        f"Data berhenti {TANGGAL_ACUAN}, bukan real-time."
    ),
    "ringkasan": ringkasan,
    "data": data,
}

with open("data/output/risiko_kabupaten_terbaru.json", "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print("Disimpan: data/output/risiko_kabupaten_terbaru.json")
print("Jumlah item:", len(data))
print("Kategori:", ringkasan["kategori"])
print("Status data:", payload["status_data"])
print("Tanggal acuan:", payload["tanggal_acuan"])