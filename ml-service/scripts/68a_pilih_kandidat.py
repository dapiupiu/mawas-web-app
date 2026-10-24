"""
Skrip 68a — cetak kandidat 5 kabupaten untuk uji prompt.
Sementara, untuk inspeksi. Tidak perlu di-commit (atau boleh, sebagai dokumentasi).
"""

import json
from pathlib import Path

path = (
    Path(__file__).resolve().parent.parent
    / "output_model"
    / "risiko_kabupaten_terbaru.json"
)
d = json.loads(path.read_text(encoding="utf-8"))
items = d["data"]
print(f"total item: {len(items)}\n")


def ringkas(it):
    skor = it["skor_risiko"]
    skor_str = f"{skor:.1f}" if skor is not None else "None"
    rfq = it["rfq"]
    rfq_str = f"{rfq:.1f}" if rfq is not None else "None"
    return (
        f"{it['kode_kabupaten']:6s} | {it['nama_kabupaten']:22s} | "
        f"{it['provinsi']:15s} | {it['kategori']:20s} | "
        f"skor={skor_str:>6s} | rfq={rfq_str:>6s} | cuaca={it['punya_data_cuaca']}"
    )


print("=== KATEGORI TINGGI (5 teratas by skor) ===")
for it in sorted(
    [x for x in items if x["kategori"] == "tinggi"],
    key=lambda x: x["skor_risiko"] or 0,
    reverse=True,
)[:5]:
    print(ringkas(it))

print("\n=== KATEGORI SEDANG (3 contoh) ===")
for it in [x for x in items if x["kategori"] == "sedang"][:3]:
    print(ringkas(it))

print("\n=== KATEGORI RENDAH (3 contoh) ===")
for it in [x for x in items if x["kategori"] == "rendah"][:3]:
    print(ringkas(it))

print("\n=== DATA TIDAK TERSEDIA, tanpa cuaca (5 contoh) ===")
for it in [
    x
    for x in items
    if x["kategori"] == "data tidak tersedia" and not x["punya_data_cuaca"]
][:5]:
    print(ringkas(it))

print("\n=== RFQ TERENDAH (5 teratas, semua kategori) ===")
for it in sorted(
    [x for x in items if x["rfq"] is not None],
    key=lambda x: x["rfq"],
)[:5]:
    print(ringkas(it))
