# Alur skrip ml-service

Dokumen ini membantu reviewer dan tim membaca folder `ml-service` tanpa membuka puluhan skrip satu per satu. Deskripsi skrip 10-19 dan 21-29 disusun dari nama file dan catatan sesi; mohon dikoreksi kalau ada yang kurang tepat.

## Skor risiko (inti)

- Kebiasaan kabupaten = rata-rata FAPAR anomali kabupaten itu selama 2021 - Agu 2026 (`models/kebiasaan_kabupaten.csv`, dibuat oleh `scripts/47_simpan_kebiasaan.py`).
- Deviasi = FAPAR anomali sekarang - kebiasaan kabupaten. Makin negatif, makin jauh di bawah kebiasaan.
- Kabupaten dibandingkan satu sama lain pada tanggal yang sama. Kategori dan ambang belum final.
- Definisi tercatat di `models/skor_meta.json`.

## Folder

| Folder | Isi |
|---|---|
| `scripts/` | Skrip bernomor (urutan pengerjaan) dan tiga modul bantu |
| `models/` | Hasil: tabel kebiasaan, definisi skor, tabel metrik, dan model XGBoost eksperimen |
| `docs/` | Dokumentasi tabel latihan, peta skrip ini, dan plot evaluasi |
| `data/` | Data mentah dan olahan (tidak masuk Git) |
| `dummy/` | Contoh output untuk FE/BE (berstatus "contoh") |

## Modul bantu (dipakai ulang)

| File | Isi |
|---|---|
| `scripts/fapar_utils.py` | Membaca raster FAPAR, mengganti 0 menjadi NaN, membuat mask kabupaten, zonal statistics |
| `scripts/fitur_utils.py` | Fungsi pembuat fitur (lag dan target) untuk tabel latihan |
| `scripts/model_utils.py` | Split berdasarkan waktu, daftar 17 fitur, MAE/RMSE, `ukur_ranking` |

## Peta skrip bernomor

| Nomor | Sesi | Isi singkat |
|---|---|---|
| 01-09 | 1 | Inspeksi data FAPAR (grid, NaN, nilai 0, plot) dan curah hujan (cakupan) |
| 10-19 | 2 | GeoJSON kabupaten (inspeksi dan pembersihan), pemeriksaan kode PCODE (termasuk Mimika), verifikasi rumus anomali hujan, pemetaan PCODE ke KDPKAB, file dummy |
| 20-27 | 3 | Pembersihan FAPAR (0 menjadi NaN), mask poligon, zonal statistics (final: 27) |
| 28-34 | 3 | Pengecekan kunci join, penggabungan FAPAR dan hujan, tabel latihan, uji lag/target, pencilan, ambang kualitas |
| 35-40 | 4 | Split waktu, baseline, XGBoost, simpan model XGBoost, plot evaluasi, cek overfitting dan uji mundur |
| 41-46 | 4 | Ukuran urutan (lift), formulasi selisih, tuning kecil, nilai khas kabupaten, indeks deviasi, deviasi dengan fitur relatif |
| 47 | 4 | Menyimpan kebiasaan kabupaten dan definisi skor |

Skrip eksplorasi sekali pakai (inspeksi, plot, pengecekan) tidak perlu dijalankan ulang. Urutan membuat ulang tabel dari data mentah perlu dicek oleh pemilik skrip. [NEEDS VERIFICATION]

## Cara menjalankan ulang hasil evaluasi

Dari folder `ml-service` (data lokal diperlukan, tidak ada di Git):

```powershell
python scripts\36_baseline.py
python scripts\40_cek_overfit_walkforward.py
python scripts\41_cek_ranking.py
python scripts\45_cek_deviasi.py
python scripts\46_deviasi_fitur_relatif.py
python scripts\47_simpan_kebiasaan.py
```

## Isi folder models

| File | Peran |
|---|---|
| `kebiasaan_kabupaten.csv` | **Inti skor**: kebiasaan FAPAR anomali tiap kabupaten (455 kabupaten) |
| `skor_meta.json` | **Inti skor**: definisi skor dan periode kebiasaan |
| `metrik_deviasi.csv`, `metrik_deviasi_v2.csv` | Hasil aturan deviasi dan XGBoost pada target penyimpangan (skrip 45, 46) |
| `metrik_ranking.csv` | Hasil ukuran urutan pada FAPAR mentah (skrip 41) |
| `metrik_formulasi.csv` | Hasil formulasi selisih (skrip 42) |
| `metrik_tuning.csv` | Hasil tuning kecil (skrip 43) |
| `metrik_walkforward.csv` | Hasil uji mundur untuk angka prediksi (skrip 40) |
| `metrik_perbandingan.csv`, `model_meta.json`, `xgb_fapar_t3_latih2024.json`, `xgb_fapar_t3_final.json` | **Eksperimen XGBoost** (target mentah). Bukan inti skor |

## Hasil ringkas

Lift = seberapa sering kabupaten yang ditandai 20% terburuk benar-benar termasuk 20% terburuk (acak = 1,0).

| Periode uji | Aturan deviasi | XGBoost (koreksi) | XGBoost + fitur relatif |
|---|---|---|---|
| 2023 | 1,55 | 1,33 | 1,50 |
| 2024 | 1,34 | 1,20 | 1,18 |
| 2025-2026 | 1,46 | 1,28 | 1,28 |

Keterbatasan lengkap ada di deskripsi PR dan di halaman "Sumber data dan keterbatasan".