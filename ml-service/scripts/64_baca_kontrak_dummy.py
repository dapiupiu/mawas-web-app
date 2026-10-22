import json
from collections import Counter

with open("dummy/dummy_risiko_h30.json", encoding="utf-8") as f:
    raw = json.load(f)

data = raw if isinstance(raw, list) else raw.get("data", raw)
print("Tipe pembungkus:", type(raw).__name__, "| kunci teratas:", list(raw.keys()) if isinstance(raw, dict) else "-")
print("Jumlah baris:", len(data))
print("\nContoh 1 baris:")
print(json.dumps(data[0], ensure_ascii=False, indent=2))

kode = [r["kode_kabupaten"] for r in data]
print("\nkode_kabupaten unik:", len(set(kode)), "| baris per kabupaten (maks):", max(Counter(kode).values()))
print("tanggal unik:", sorted({r["tanggal"] for r in data})[:5], "...", len({r["tanggal"] for r in data}), "tanggal")
print("format kode contoh:", sorted(set(kode))[:3])
print("kategori:", Counter(r["kategori"] for r in data))
print("status_data:", Counter(r["status_data"] for r in data))
print("horizon_hari:", Counter(r["horizon_hari"] for r in data))
print("kunci tiap baris:", sorted(data[0].keys()))
print("tipe faktor_penyebab:", type(data[0]["faktor_penyebab"]).__name__)