# Kontrak Output Model — Mawas

> Dokumen ini untuk tim FE dan BE. Menjelaskan file output **model** (bukan dummy), struktur datanya, aturan pemakaian, dan keterbatasannya.

## Ringkasan

- **Status data**: `"model"` (bukan `"contoh"`). Ini output nyata dari aturan deviasi FAPAR, bukan placeholder.
- **Tanggal acuan**: `2026-09-11` (dekad terakhir yang punya data).
- **Horizon**: 30 hari. Artinya skor menggambarkan indikasi risiko 30 hari ke depan dari tanggal acuan.
- **Cakupan**: 514 kabupaten/kota di Indonesia. 473 punya data cuaca, 41 tidak.
- **Sifat skor**: **relatif antar-kabupaten pada tanggal yang sama** (persentil). Bukan prakiraan akurat, bukan real-time.
- **Data berhenti 11 Sep 2026**. Data hujan tanggal ini berstatus `prelim` (sementara, bisa direvisi).

## File yang tersedia

| File | Isi | Untuk siapa |
|---|---|---|
| `data/output/risiko_kabupaten_terbaru.json` | 514 kabupaten, 1 tanggal (11 Sep 2026), format kontrak | **FE/BE** — konsumsi utama |
| `data/output/risiko_kabupaten.parquet` | 105.884 baris (514 kab × 206 tanggal), semua kolom internal | Analisis/arsip (bukan untuk FE) |

**FE/BE cukup memakai file JSON.** Parquet hanya untuk analisis internal.

## Struktur JSON

```json
{
  "dihasilkan_pada": "2026-10-22T14:27:09Z",
  "status_data": "model",
  "horizon_hari": 30,
  "tanggal_acuan": "2026-09-11",
  "sumber_kode": "daftar_kabupaten.csv + rainfall_kabupaten.parquet",
  "catatan": "Output model Mawas ...",
  "ringkasan": {
    "total_kabupaten": 514,
    "punya_data_cuaca": 473,
    "tanpa_data_cuaca": 41,
    "kategori": {
      "rendah": 247,
      "sedang": 25,
      "tinggi": 69,
      "data tidak tersedia": 173
    },
    "hujan": {
      "dasar": "dari kabupaten yang punya rfq",
      "n": 473,
      "bawah_normal_85": 409,
      "mendekati_normal_85_115": 61,
      "atas_normal_115": 3,
      "pct_bawah_normal": 86.5
    }
  },
  "data": [
    /* 514 item */
  ]
}
```

### Kunci atas

| Kunci | Tipe | Keterangan |
|---|---|---|
| `dihasilkan_pada` | string ISO 8601 UTC | Waktu file dibuat |
| `status_data` | string | Selalu `"model"` untuk file ini |
| `horizon_hari` | int | `30` |
| `tanggal_acuan` | string `YYYY-MM-DD` | Tanggal dasar skor |
| `sumber_kode` | string | Asal kode wilayah |
| `catatan` | string | Teks transparansi (baca; memuat status `prelim`) |
| `ringkasan` | objek | Ringkasan untuk ditampilkan tanpa hitung ulang |
| `data` | array | 514 item, satu per kabupaten |

### Field tiap item `data`

**Wajib** (sesuai kontrak dummy, FE wajib menangani):

| Field | Tipe | Keterangan |
|---|---|---|
| `kode_kabupaten` | string `NN.NN` | Kunci utama, cocok dengan `KDPKAB` |
| `nama_kabupaten` | string | Nama kabupaten |
| `provinsi` | string | Nama provinsi |
| `tanggal` | string `YYYY-MM-DD` | Sama dengan `tanggal_acuan` |
| `horizon_hari` | int | `30` |
| `skor_risiko` | float 0–100 atau `null` | `null` = data tidak tersedia |
| `kategori` | string | `rendah` / `sedang` / `tinggi` / `data tidak tersedia` |
| `faktor_penyebab` | string | Penjelasan konteks (lihat bagian bawah) |
| `dihasilkan_pada` | string | Waktu dibuat |
| `status_data` | string | `"model"` |
| `punya_data_cuaca` | boolean | `true` / `false` |

**Tambahan (opsional, untuk halaman detail):**

| Field | Tipe | Keterangan |
|---|---|---|
| `id_fe` | string | ID kabupaten versi FE (untuk join peta) |
| `frac_valid` | float 0–1 atau `null` | Porsi piksel FAPAR valid di kabupaten |
| `n_valid` | int atau `null` | Jumlah piksel FAPAR valid |
| `n_piksel` | int atau `null` | Jumlah piksel kabupaten |
| `rfq` | float atau `null` | Anomali hujan 10 hari (%), 100 = normal |
| `r1q` | float atau `null` | Anomali hujan 1 bulan (%) |
| `r3q` | float atau `null` | Anomali hujan 3 bulan (%) |

Field internal (`alasan_kode`, `alasan_teks`, `alasan_baris`, `hujan_version`, `hujan_anomaly_status`, `nama_fe`) tidak ada di JSON. Field tersebut ada di Parquet untuk analisis.

## Arti kategori

| Nilai | Arti | Warna FE |
|---|---|---|
| `rendah` | Skor di bawah persentil 50 antar-kabupaten pada tanggal itu | Hijau |
| `sedang` | Skor persentil 50–79 dan deviasi FAPAR negatif | Kuning |
| `tinggi` | Skor persentil ≥ 80 dan deviasi FAPAR negatif | Merah |
| `data tidak tersedia` | Tidak ada skor (lihat `faktor_penyebab`) | Abu-abu |

**Catatan penting:** kategori `sedang` dan `tinggi` mensyaratkan deviasi FAPAR negatif (FAPAR di bawah kebiasaan kabupaten). Kabupaten yang persentilnya tinggi tetapi FAPAR-nya di atas kebiasaan akan masuk kategori `rendah`. Ini disengaja: label `sedang`/`tinggi` hanya digunakan untuk wilayah yang benar-benar berada di bawah kebiasaan.

## Arti `faktor_penyebab`

Informasi ini merupakan konteks pendukung, bukan penyebab yang terbukti. `faktor_penyebab` tidak boleh dianggap sebagai diagnosis.

### Untuk kabupaten yang punya skor

| Nilai | Arti |
|---|---|
| `Hujan 10 hari terakhir di bawah normal` | `rfq < 85` (kriteria BMKG) |
| `Hujan 10 hari terakhir mendekati normal` | `85 ≤ rfq ≤ 115` |
| `Hujan 10 hari terakhir di atas normal` | `rfq > 115` |

### Untuk kabupaten tanpa skor

| Nilai | Arti |
|---|---|
| `Data satelit vegetasi pada periode ini terlalu sedikit untuk dinilai (awan/tutupan)` | Piksel FAPAR valid < 20% atau < 3 piksel |
| `Data satelit vegetasi kosong pada periode ini` | FAPAR `NaN` pada tanggal itu |
| `Data satelit vegetasi kosong pada sebagian besar periode` | Kabupaten tidak pernah punya skor (data satelit hampir selalu kosong) |
| `Data curah hujan belum tersedia untuk wilayah ini (kabupaten pemekaran Papua, di luar cakupan CHIRPS pipeline)` | 30 kabupaten Papua tanpa cuaca |
| `Data curah hujan belum tersedia untuk wilayah ini` | 11 kabupaten non-Papua tanpa cuaca (kota kecil atau pemekaran) |
| `Batas wilayah tidak tersedia di data` | Kabupaten tanpa poligon |
| `Data historis terlalu sedikit untuk menentukan kondisi biasanya` | < 50 dekad pembanding |
| `Tidak ada data historis pembanding untuk wilayah ini` | Tidak punya kebiasaan FAPAR sama sekali |

Teks `faktor_penyebab` bisa panjang. FE boleh menampilkannya utuh atau memotongnya, tetapi jangan mengubah makna.

## Arti `punya_data_cuaca`

- `true`: kabupaten punya `rfq` pada tanggal acuan; FE boleh menampilkan grafik atau angka hujan.
- `false`: tidak ada data hujan; FE tampilkan teks **"Data cuaca belum tersedia"**, bukan angka `0` atau nilai kosong.

## Arti `ringkasan.hujan`

- `n`: jumlah kabupaten yang punya `rfq` (bukan 514; hanya yang punya data cuaca).
- `bawah_normal_85`: jumlah dengan `rfq < 85` (BMKG: Bawah Normal).
- `mendekati_normal_85_115`: jumlah dengan `85 ≤ rfq ≤ 115` (BMKG: Normal).
- `atas_normal_115`: jumlah dengan `rfq > 115` (BMKG: Atas Normal).
- `pct_bawah_normal`: persentase `bawah_normal_85 / n`.

Untuk 11 September 2026: **409 dari 473 (86,5%)** kabupaten yang punya data hujan mengalami hujan di bawah normal.

## Aturan implementasi FE

- **Label data:** karena `status_data = "model"`, tampilkan label **"DATA MODEL"** (atau setara), bukan **"DATA CONTOH"**. Jangan hapus label ini.
- **Data tidak tersedia:** jika `skor_risiko = null` dan `kategori = "data tidak tersedia"`, tampilkan teks **"Data tidak tersedia"** beserta `faktor_penyebab`. Jangan menampilkan angka `0`.
- **Warna:** hijau/kuning/merah selalu disertai teks kategori. Jangan andalkan warna saja (aksesibilitas).
- **Join peta:** gunakan `id_fe` untuk mencocokkan kabupaten ke GeoJSON FE. Jangan pakai `kode_kabupaten` langsung (formatnya `NN.NN`, berbeda dari `id_fe`).
- **Tanggal:** tampilkan **"kondisi per 11 Sep 2026"**, bukan **"real-time"**. Data diperbarui manual, tidak otomatis.
- **Keterbatasan:** pada halaman detail atau footer, cantumkan bahwa skor bersifat indikasi relatif, bukan prakiraan akurat. Lihat bagian Keterbatasan.
- **Field opsional:** `frac_valid`, `n_valid`, `n_piksel`, `rfq`, `r1q`, `r3q` boleh tidak ditampilkan. Jika ditampilkan, gunakan sebagai informasi kualitas data, bukan sebagai skor.

## Contoh potongan kode FE (JavaScript/TypeScript)

```js
// Ambil data
const res = await fetch("/data/risiko_kabupaten_terbaru.json");
const { data, ringkasan, catatan } = await res.json();

// Bangun map id_fe -> item untuk join peta
const perKab = new Map(data.map((it) => [it.id_fe, it]));

// Di GeoJSON kabupaten FE, properti `id` (atau sejenis) berpasangan dengan `id_fe`
function warnaKategori(it) {
  if (!it || it.kategori === "data tidak tersedia") return "gray";
  if (it.kategori === "tinggi") return "red";
  if (it.kategori === "sedang") return "yellow";
  return "green";
}

// Tampilkan label
const label = it.status_data === "model" ? "DATA MODEL" : "DATA CONTOH";
```

## Yang berubah dari dummy

| Hal | Dummy | Model |
|---|---|---|
| `status_data` | `"contoh"` | `"model"` |
| `tanggal` | `2026-11-10` | `2026-09-11` |
| `faktor_penyebab` | Teks pendek generik | Teks spesifik (BMKG + alasan tidak tersedia) |
| `punya_data_cuaca` | boolean | boolean |
| Field tambahan | Tidak ada | `id_fe`, `frac_valid`, `n_valid`, `n_piksel`, `rfq`, `r1q`, `r3q` |
| `ringkasan.hujan` | Tidak ada | Ada |

Struktur kunci atas dan field wajib per item sama dengan dummy. Integrasi FE/BE yang sudah memakai dummy tidak perlu diubah; cukup tangani field tambahan (opsional).

## Cara regenerasi

Dari `ml-service` dengan virtual environment (`venv`) aktif:

```powershell
python scripts\66_isi_faktor_penyebab.py
python scripts\65c_json_terbaru.py
```

Skrip `66` mengisi `faktor_penyebab` dan `punya_data_cuaca` di Parquet. Skrip `65c` membentuk ulang JSON dari Parquet. Keduanya aman dijalankan berulang.

## Keterbatasan (untuk halaman "Sumber Data")

- **Skor relatif:** skor adalah persentil antar-kabupaten pada tanggal yang sama. Selalu ada kabupaten tinggi dan rendah di setiap tanggal.
- **Bukan prakiraan akurat:** kemampuan mengurutkan sedang-lemah (sekitar 3 dari 10 label tinggi benar-benar termasuk 20% terburuk; acak = 2 dari 10). Angka skor tidak presisi.
- **Data berhenti 11 Sep 2026:** bukan real-time. Data hujan tanggal ini berstatus `prelim` dan bisa direvisi.
- **41 kabupaten tanpa data cuaca:** 30 kabupaten Papua pemekaran dan 11 kabupaten non-Papua. `faktor_penyebab` menjelaskan hal ini.
- **58 kabupaten tidak pernah punya skor:** disebabkan batas wilayah tidak tersedia, data satelit kosong, atau data historis kurang.
- **Hujan sebagai konteks, bukan penyebab:** `faktor_penyebab` tidak membuktikan bahwa hujan menyebabkan stres vegetasi.
- **Kebiasaan dari periode pendek:** data historis sekitar 5,7 tahun. Stabilitas antar-periode adalah 0,356.