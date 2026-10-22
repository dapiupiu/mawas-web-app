import json
from datetime import datetime, timezone
from pathlib import Path
import shutil
import pandas as pd

TANGGAL_ACUAN = "2026-09-11"
HORIZON_HARI = 30
STATUS_DATA = "model"

x = pd.read_parquet("data/output/risiko_kabupaten.parquet")
y = x[x["tanggal"] == TANGGAL_ACUAN].copy()
print("Baris tanggal", TANGGAL_ACUAN, ":", len(y))
if len(y) == 0:
    raise SystemExit(f"Tidak ada baris untuk tanggal {TANGGAL_ACUAN}")


def opsional(v):
    if pd.isna(v):
        return None
    if isinstance(v, (int, float)):
        return round(float(v), 2)
    return v


def ke_item(r):
    return {
        # --- field wajib (kontrak dummy) ---
        "kode_kabupaten": r["kode_kabupaten"],
        "nama_kabupaten": r["nama_kabupaten"],
        "provinsi": r["provinsi"],
        "tanggal": r["tanggal"].strftime("%Y-%m-%d"),
        "horizon_hari": int(r["horizon_hari"]),
        "skor_risiko": None
        if pd.isna(r["skor_risiko"])
        else round(float(r["skor_risiko"]), 2),
        "kategori": r["kategori"],
        "faktor_penyebab": r["faktor_penyebab"],
        "dihasilkan_pada": r["dihasilkan_pada"],
        "status_data": r["status_data"],
        "punya_data_cuaca": bool(r["punya_data_cuaca"]),
        # --- tambahan untuk FE (opsional) ---
        "id_fe": r["id_fe"],
        "frac_valid": opsional(r["frac_valid"]),
        "n_valid": opsional(r["n_valid"]),
        "n_piksel": opsional(r["n_piksel"]),
        "rfq": opsional(r["rfq"]),
        "r1q": opsional(r["r1q"]),
        "r3q": opsional(r["r3q"]),
    }


data = [ke_item(r) for _, r in y.iterrows()]

# --- ringkasan ---
kategori_counter = {}
for it in data:
    kategori_counter[it["kategori"]] = kategori_counter.get(it["kategori"], 0) + 1

punya_cuaca = sum(1 for it in data if it["punya_data_cuaca"])
tanpa_cuaca = len(data) - punya_cuaca

# konteks nasional: dari yang punya rfq, berapa hujan di bawah normal (<85)
rfq_ada = [it["rfq"] for it in data if it["rfq"] is not None]
n_rfq = len(rfq_ada)
n_bawah = sum(1 for v in rfq_ada if v < 85)
n_normal = sum(1 for v in rfq_ada if 85 <= v <= 115)
n_atas = sum(1 for v in rfq_ada if v > 115)

ringkasan = {
    "total_kabupaten": len(data),
    "punya_data_cuaca": punya_cuaca,
    "tanpa_data_cuaca": tanpa_cuaca,
    "kategori": kategori_counter,
    "hujan": {
        "dasar": "dari kabupaten yang punya rfq",
        "n": n_rfq,
        "bawah_normal_85": n_bawah,
        "mendekati_normal_85_115": n_normal,
        "atas_normal_115": n_atas,
        "pct_bawah_normal": round(n_bawah / n_rfq * 100, 1) if n_rfq else None,
    },
}

dihasilkan_pada = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

catatan = (
    "Output model Mawas (aturan deviasi FAPAR + konteks hujan BMKG). "
    "Skor = persentil antar-kabupaten pada tanggal yang sama; indikasi relatif, bukan prakiraan akurat. "
    "Hujan berlabel informasi pendukung, bukan penyebab terbukti. "
    f"Data berhenti {TANGGAL_ACUAN}; data hujan tanggal ini berstatus prelim (sementara). "
    "Bukan real-time."
)

payload = {
    "dihasilkan_pada": dihasilkan_pada,
    "status_data": STATUS_DATA,
    "horizon_hari": HORIZON_HARI,
    "tanggal_acuan": TANGGAL_ACUAN,
    "sumber_kode": "daftar_kabupaten.csv + rainfall_kabupaten.parquet",
    "catatan": catatan,
    "ringkasan": ringkasan,
    "data": data,
}

with open("data/output/risiko_kabupaten_terbaru.json", "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print("Disimpan: data/output/risiko_kabupaten_terbaru.json")
print("Jumlah item:", len(data))
print("Kategori:", kategori_counter)
print("Punya cuaca:", punya_cuaca, "| tanpa:", tanpa_cuaca)
print("Hujan (dari", n_rfq, "kab):")
print("  bawah normal :", n_bawah, f"({round(n_bawah / n_rfq * 100, 1)}%)")
print("  normal       :", n_normal)
print("  atas normal  :", n_atas)
print("Contoh item pertama:")
print(json.dumps(data[0], ensure_ascii=False, indent=2))

OUT_DIR = Path("output_model")
OUT_DIR.mkdir(exist_ok=True)
shutil.copy(
    "data/output/risiko_kabupaten_terbaru.json",
    OUT_DIR / "risiko_kabupaten_terbaru.json",
)
print("Disalin ke:", OUT_DIR / "risiko_kabupaten_terbaru.json")
