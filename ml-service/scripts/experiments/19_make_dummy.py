"""
Buat file dummy untuk FE/BE sesuai kontrak data.

Sumber:
  - data/geojson/kabupaten_clean.geojson  (514 kabupaten, kode + nama benar)
  - data/mapping/pcode_to_kdpkab.csv      (473 kabupaten punya data cuaca CHIRPS)

Output:
  - data/dummy/dummy_risiko_h30.json
  - data/dummy/dummy_risiko_h60.json
  - data/dummy/README.md

Aturan:
  - status_data = "contoh" di semua record (WAJIB, sesuai aturan FE)
  - skor_risiko deterministik dari hash(kode_kabupaten, horizon) -> 0..100
  - 41 kabupaten tanpa data CHIRPS -> skor null, kategori "data tidak tersedia"
  - kategori dari ambang skor: <33 rendah, 33-66 sedang, >=66 tinggi
"""
import hashlib
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
GEOJSON = ROOT / "data" / "geojson" / "kabupaten_clean.geojson"
MAPPING = ROOT / "data" / "mapping" / "pcode_to_kdpkab.csv"
OUT = ROOT / "dummy"
OUT.mkdir(parents=True, exist_ok=True)

TANGGAL_ACUAN = datetime(2026, 10, 11, tzinfo=timezone.utc)  # 1 dekad terakhir yang kita punya
NOW = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
HORIZONS = [30, 60]

# 1. baca data sumber
with GEOJSON.open(encoding="utf-8") as f:
    gj = json.load(f)
geo = [
    {
        "kode_kabupaten": ft["properties"]["KDPKAB"],
        "nama_kabupaten": ft["properties"]["WADMKK"],
        "provinsi": ft["properties"]["WADMPR"],
        "has_geometry": ft["properties"]["has_geometry"],
    }
    for ft in gj["features"]
]
print(f"GeoJSON: {len(geo)} kabupaten")

mapping = pd.read_csv(MAPPING, dtype={"PCODE": str, "KDPKAB": str})
kdp_punya_cuaca = set(mapping["KDPKAB"].astype(str))
print(f"Mapping: {len(kdp_punya_cuaca)} KDPKAB punya data cuaca")


# 2. fungsi deterministik
def skor_deterministik(kode: str, horizon: int) -> float:
    """Hash -> angka 0..100, stabil untuk (kode, horizon)."""
    h = hashlib.md5(f"{kode}|{horizon}".encode()).hexdigest()
    # ambil 8 hex char -> int -> skala 0..100, 1 desimal
    val = int(h[:8], 16) % 10000
    return round(val / 100.0, 1)


def kategori(skor):
    if skor < 33:
        return "rendah"
    if skor < 66:
        return "sedang"
    return "tinggi"


FAKTOR = {
    "rendah": [
        "Anomali vegetasi dalam batas normal",
        "Curah hujan sesuai musim",
        "Tidak ada indikasi stres vegetasi",
    ],
    "sedang": [
        "Anomali vegetasi negatif ringan",
        "Curah hujan sedikit di bawah normal (30 hari terakhir)",
        "Perlu pemantauan berkala",
    ],
    "tinggi": [
        "Anomali vegetasi negatif signifikan",
        "Curah hujan jauh di bawah normal (30-60 hari terakhir)",
        "Indikasi stres vegetasi, perlu perhatian",
    ],
}


def pilih_faktor(kat: str, kode: str, horizon: int) -> str:
    """Pilih faktor deterministik berdasarkan kategori + hash."""
    pilihan = FAKTOR[kat]
    h = hashlib.md5(f"{kode}|{horizon}|faktor".encode()).hexdigest()
    return pilihan[int(h[:4], 16) % len(pilihan)]


# 3. bangun data per horizon
for horizon in HORIZONS:
    tanggal = (TANGGAL_ACUAN + timedelta(days=horizon)).strftime("%Y-%m-%d")
    rows = []
    n_tersedia = 0
    for g in geo:
        kode = g["kode_kabupaten"]
        punya = kode in kdp_punya_cuaca
        if punya:
            skor = skor_deterministik(kode, horizon)
            kat = kategori(skor)
            faktor = pilih_faktor(kat, kode, horizon)
            n_tersedia += 1
        else:
            skor, kat, faktor = None, "data tidak tersedia", None

        rows.append({
            "kode_kabupaten": kode,
            "nama_kabupaten": g["nama_kabupaten"],
            "provinsi": g["provinsi"],
            "tanggal": tanggal,
            "horizon_hari": horizon,
            "skor_risiko": skor,
            "kategori": kat,
            "faktor_penyebab": faktor,
            "dihasilkan_pada": NOW,
            "status_data": "contoh",
            "punya_data_cuaca": punya,
        })

    payload = {
        "dihasilkan_pada": NOW,
        "status_data": "contoh",
        "horizon_hari": horizon,
        "tanggal_acuan": TANGGAL_ACUAN.strftime("%Y-%m-%d"),
        "sumber_kode": "kabupaten_clean.geojson",
        "catatan": (
            "File DUMMY untuk integrasi FE/BE. Skor risiko adalah placeholder "
            "deterministik, BUKAN prakiraan model. FE wajib menampilkan label DATA CONTOH."
        ),
        "ringkasan": {
            "total_kabupaten": len(rows),
            "punya_data_cuaca": n_tersedia,
            "tanpa_data_cuaca": len(rows) - n_tersedia,
            "kategori": {
                "rendah": sum(1 for r in rows if r["kategori"] == "rendah"),
                "sedang": sum(1 for r in rows if r["kategori"] == "sedang"),
                "tinggi": sum(1 for r in rows if r["kategori"] == "tinggi"),
                "data tidak tersedia": sum(1 for r in rows if r["kategori"] == "data tidak tersedia"),
            },
        },
        "data": rows,
    }
    out_path = OUT / f"dummy_risiko_h{horizon}.json"
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Tersimpan: {out_path} ({len(rows)} kab, {n_tersedia} punya data, {len(rows)-n_tersedia} tanpa)")
    print(f"  kategori: {payload['ringkasan']['kategori']}")

# 4. README untuk tim
readme_path = OUT / "README.md"
if readme_path.exists():
    print(f"\nREADME sudah ada: {readme_path}")
else:
    print(f"\n[PERINGATAN] {readme_path} belum ada. Buat manual dari template di catatan.")