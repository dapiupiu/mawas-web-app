# Output Model Mawas — untuk FE/BE

Folder ini memuat **output model terbaru** yang siap dikonsumsi FE/BE. Berbeda dengan folder `dummy/` yang berisi data contoh (`status_data = "contoh"`), file di sini berstatus `status_data = "model"` — hasil nyata dari aturan deviasi FAPAR, bukan placeholder.

## Isi

| File | Tanggal acuan | Horizon | Cakupan |
|---|---|---|---|
| `risiko_kabupaten_terbaru.json` | 2026-09-11 | 30 hari | 514 kabupaten/kota |

Data berhenti 11 Sep 2026. Data hujan tanggal ini berstatus `prelim` (sementara, bisa direvisi).

## Cara pakai

- **Struktur field lengkap, aturan implementasi, dan keterbatasan**: baca [`../docs/kontrak_output_model.md`](../docs/kontrak_output_model.md).
- **Kontrak versi dummy** (untuk perbandingan): lihat [`../dummy/README.md`](../dummy/README.md).
- **Contoh potongan kode join peta FE**: ada di bagian "Contoh potongan kode FE" pada dokumen kontrak.

## Yang perlu diperhatikan FE

1. `status_data = "model"` → tampilkan label "DATA MODEL", bukan "DATA CONTOH".
2. `skor_risiko = null` dan `kategori = "data tidak tersedia"` → tampilkan "Data tidak tersedia" beserta `faktor_penyebab`. Jangan ganti dengan 0.
3. Join peta pakai `id_fe`, bukan `kode_kabupaten`.
4. Tampilkan "kondisi per 11 Sep 2026", bukan "real-time".
5. Warna kategori selalu disertai teks (aksesibilitas).

## Cara regenerasi

Dari `ml-service` dengan venv aktif:

```powershell
python scripts\66_isi_faktor_penyebab.py
python scripts\65c_json_terbaru.py