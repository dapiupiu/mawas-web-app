# File Dummy - Mawas (FE/BE)

> [!WARNING] DATA CONTOH
> Seluruh skor risiko dalam file ini merupakan **placeholder deterministik, bukan hasil prakiraan model ML**.

## File

| File | Horizon |
|---|---:|
| `dummy_risiko_h30.json` | 30 hari |
| `dummy_risiko_h60.json` | 60 hari |

## Lokasi

Direktori: `ml-service/dummy/`

Folder `dummy/` digunakan secara sengaja, bukan `data/`, agar file contoh ikut ter-commit ke repository dan dapat digunakan oleh FE/BE.

## Struktur Data

Setiap file JSON berisi objek dengan struktur berikut:

```json
{
  "dihasilkan_pada": "2026-10-18T...Z",
  "status_data": "contoh",
  "horizon_hari": 30,
  "tanggal_acuan": "2026-10-11",
  "sumber_kode": "kabupaten_clean.geojson",
  "catatan": "...",
  "ringkasan": {
    "total_kabupaten": 514,
    "punya_data_cuaca": 473,
    "tanpa_data_cuaca": 41,
    "kategori": {}
  },
  "data": [{}, "..."]
}
```

### Kontrak Item `data`

Setiap item dalam array `data` memiliki atribut berikut:

| Atribut | Keterangan |
|---|---|
| `kode_kabupaten` | Kode identifikasi kabupaten |
| `nama_kabupaten` | Nama kabupaten |
| `provinsi` | Nama provinsi |
| `tanggal` | Tanggal acuan risiko |
| `horizon_hari` | Rentang waktu prakiraan dalam hari |
| `skor_risiko` | Skor risiko 0-100 atau `null` |
| `kategori` | Kategori risiko: rendah, sedang, tinggi, atau data tidak tersedia |
| `faktor_penyebab` | Daftar faktor yang terkait dengan risiko |
| `dihasilkan_pada` | Waktu pembuatan data |
| `status_data` | Status data, yaitu `contoh` atau `model` |
| `punya_data_cuaca` | Penanda ketersediaan data cuaca (`true`/`false`) |

## Aturan Implementasi FE

- **Label data:** selalu tampilkan label `DATA CONTOH` ketika `status_data = "contoh"`.
- **Data tidak tersedia:** jika `skor_risiko = null` dan `kategori = "data tidak tersedia"`, tampilkan teks `Data tidak tersedia`. Jangan menggantinya dengan angka `0` atau membiarkannya kosong.
- **Warna kategori:** gunakan hijau untuk `rendah`, kuning untuk `sedang`, dan merah untuk `tinggi`. Warna harus selalu disertai teks kategori agar informasi tetap jelas.
- **Data cuaca:** sebanyak 41 kabupaten memiliki `punya_data_cuaca = false`, mayoritas merupakan kabupaten di wilayah Papua hasil pemekaran tahun 2022. Wilayah tersebut belum memiliki data CHIRPS yang dibutuhkan oleh pipeline saat ini.

## Regenerasi JSON Dummy

Jalankan perintah berikut dari root repository:

```bash
python scripts/19_make_dummy.py
```

Script tersebut digunakan untuk menghasilkan ulang file dummy sesuai struktur dan aturan yang ditetapkan.

## Migrasi ke Output Model ML

Setelah model ML siap digunakan:

1. Ganti nilai `skor_risiko` dengan output prediksi model.
2. Sesuaikan `kategori` berdasarkan hasil prediksi.
3. Ubah `status_data` menjadi `"model"` untuk data yang benar-benar dihasilkan oleh model.
4. Pertahankan struktur JSON agar integrasi FE/BE tidak perlu diubah.

**Catatan:** data dengan `skor_risiko = null` tetap harus ditangani sesuai kontrak, termasuk setelah migrasi ke model.