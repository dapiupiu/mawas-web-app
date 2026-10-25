# Mawas

<p align="center">
  <img src="./FrontEnd/public/logo-mawas/PNG/rectangle/MAWAS-rectangle-colour.png" alt="Mawas Logo" width="220"/>
</p>

<h3 align="center">Sistem Peringatan Dini Risiko Kekeringan Pertanian (Stress Vegetasi) per Kabupaten/Kota</h3>

<p align="center">
<img src="https://img.shields.io/badge/Frontend-React%2019-61dafb" />
<img src="https://img.shields.io/badge/Build-Vite-646cff" />
<img src="https://img.shields.io/badge/Styling-Tailwind%20CSS%204-38bdf8" />
<img src="https://img.shields.io/badge/Backend-Express%205-green" />
<img src="https://img.shields.io/badge/Database%20%26%20Auth-Supabase-3ecf8e" />
<img src="https://img.shields.io/badge/ML-XGBoost-orange" />
<img src="https://img.shields.io/badge/GenAI-Groq-f55036" />
<img src="https://img.shields.io/badge/Deployment-Vercel-black" />
</p>

<p align="center">
  Platform pemantauan indikasi stres vegetasi dan risiko kekeringan pertanian<br/>
  sebagai bentuk untuk mendukung ketahanan pangan dan program Swasembada Pangan
</p>

<p align="center">
<a href="https://mawas-web-app.vercel.app/">Live Web</a> •
<a href="LINK_PROPOSAL">Proposal</a> •
<a href="https://s.id/videodemomawas">Video Demo</a> •
<a href="#cara-menjalankan-aplikasi">Cara Menjalankan</a> •
<a href="https://mawas-web-app-axmu.vercel.app/">Backend API</a> •
<a href="https://s.id/arsipmawas">Arsip Proyek</a>
</p>

---

## Table of Contents

- [Deskripsi Singkat Proyek](#deskripsi-singkat-proyek)
- [Tautan Penting](#tautan-penting)
- [Project Components](#project-components)
- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [System Flow](#system-flow)
- [Metodologi Skor Risiko](#metodologi-skor-risiko)
- [Petunjuk Setup Environment](#petunjuk-setup-environment)
- [Setup Database dan Storage](#setup-database-dan-storage)
- [Cara Menjalankan Aplikasi](#cara-menjalankan-aplikasi)
- [Pipeline Machine Learning](#pipeline-machine-learning)
- [Format Output Model](#format-output-model)
- [Analisis GenAI](#analisis-genai)
- [Peran Pengguna dan Hak Akses](#peran-pengguna-dan-hak-akses)
- [Dokumentasi API](#dokumentasi-api)
- [Halaman Aplikasi](#halaman-aplikasi)
- [Deployment](#deployment)
- [Catatan Keamanan](#catatan-keamanan)
- [Keterbatasan](#keterbatasan)
- [Saran Pengembangan](#saran-pengembangan)
- [Dokumen Pendukung](#dokumen-pendukung)
- [Tim Pengembang](#tim-pengembang)
- [Deliverables](#deliverables)

---

## Deskripsi Singkat Proyek

Mawas adalah aplikasi web full-stack yang menampilkan indikasi risiko kekeringan pertanian dan stres vegetasi untuk 514 kabupaten/kota di Indonesia. Sistem mengolah anomali vegetasi satelit (FAPAR) dan konteks curah hujan, membandingkan kondisi tiap kabupaten dengan kebiasaannya sendiri, lalu menyajikan skor relatif antar-kabupaten dalam kategori Rendah, Sedang, atau Tinggi pada peta interaktif. Wilayah yang datanya belum memadai ditandai Data tidak tersedia (173 dari 514 pada tanggal acuan 11 Sep 2026). Hasil dipakai sebagai indikator awal dengan horizon perencanaan 30 hari.

Publik dapat membaca peta risiko, status wilayah, dan artikel edukasi tanpa login, serta melihat analisis teks GenAI yang menjelaskan kondisi tiap kabupaten dalam bahasa Indonesia sederhana. Operator dan Superadmin menggunakan dashboard untuk memverifikasi hasil analisis, membuat laporan, memperbarui data model, dan mengelola konten.

Mawas berfokus pada **sektor pertanian**. Skor risiko adalah **indikasi awal (bukan prakiraan presisi)**, dan seluruh antarmuka dibuat agar tidak mengklaim lebih dari yang didukung data (lihat [Keterbatasan](#keterbatasan)).

---

## Tautan Penting

| Item | Tautan |
|---|---|
| Website | [mawas-web-app.vercel.app](https://mawas-web-app.vercel.app/) |
| Backend API | [mawas-web-app-axmu.vercel.app](https://mawas-web-app-axmu.vercel.app/) |
| Source Code | [github.com/dapiupiu/mawas-web-app](https://github.com/dapiupiu/mawas-web-app) |
| Video Demo | [s.id/videodemomawas](https://s.id/videodemomawas) |
| PageSpeed Insights | [Hasil pengujian](https://pagespeed.web.dev/analysis/https-mawas-web-app-vercel-app/j44sp0adsi?form_factor=desktop) |
| CodeFactor | [Hasil analisis kode](https://www.codefactor.io/repository/github/dapiupiu/mawas-web-app) |
| Proposal | [Proposal MAWAS](LINK_PROPOSAL) |
| Arsip Proyek | [s.id/arsipmawas](https://s.id/arsipmawas) |

---

## Project Components

| Component | Description |
|------------|------------|
| Frontend | Landing page publik, peta risiko interaktif, portal artikel, dan dashboard operator/superadmin |
| Backend | REST API, autentikasi dan RBAC berbasis Supabase, proxy GenAI, import prediksi |
| ML Service | Pipeline Python offline: pengolahan data satelit/hujan, skor risiko, dan eksperimen XGBoost |
| GenAI | Analisis teks per kabupaten melalui Groq, dengan validasi output dan cache |
| Database | Supabase (PostgreSQL) untuk prediksi, verifikasi, produksi, intervensi, artikel, dan cache GenAI |

---

## Fitur Utama

**Publik**

- Landing page dengan status pertanian, penjelasan alur kerja, FAQ metodologi, dan artikel edukasi.
- Peta risiko interaktif (`/peta-risiko`) dengan dua tingkat detail: **provinsi** dan **kabupaten/kota**.
- Pencarian provinsi dan kabupaten, serta pemilihan lokasi lewat izin lokasi perangkat.
- Tabel status wilayah dengan indikator ketersediaan data cuaca.
- Grafik tren nasional dan ringkasan distribusi kategori risiko.
- Portal artikel edukasi (`/artikel/:articleId`).
- Warna risiko selalu disertai label teks untuk aksesibilitas.

**Dashboard Operator dan Superadmin**

- **Ringkasan Wilayah**: ringkasan kategori risiko dan status verifikasi.
- **Pusat Verifikasi**: operator memverifikasi atau mengoreksi hasil model per kabupaten, lengkap dengan catatan.
- **Generator Laporan**: membuat laporan resmi sebagai dasar rekomendasi tindak lanjut.
- **CMS Panduan & Edukasi**: Superadmin membuat, mengubah, dan menerbitkan artikel beserta unggah gambar.
- **Pembaruan Model ML**: unggah file JSON output model, validasi struktur, lalu perbarui data di database.
- **Manajemen Akun**: Superadmin membuat, menonaktifkan, dan mereset password operator.
- Profil pengguna: ubah nama, foto profil, dan password.

**Backend**

- Login email/password dan Google OAuth melalui Supabase Auth.
- Registrasi mandiri dinonaktifkan; akun operator dibuat oleh Superadmin.
- Endpoint data produksi pangan dan intervensi mitigasi (hanya Operator/Superadmin yang dapat menulis).
- Analisis GenAI per kabupaten dengan cache dan validasi output.

---

## Tech Stack

## Architecture Overview

```text
Pipeline ML (Python, offline)
  FAPAR (.tif) + Curah hujan (CSV)
          │
          ▼
  Skor risiko per kabupaten
          │
          ▼
  risiko_kabupaten_terbaru.json
          │  (import / seed)
          ▼
┌───────────────────────────┐
│ Supabase (PostgreSQL)     │◄───────────┐
└───────────────────────────┘            │
          ▲                              │
          │                      Backend API (Express)
          │                              │
          │                     ┌────────┴────────┐
          │                     ▼                 ▼
          │               Groq (GenAI)      Supabase Auth
          │                     │
          └─────────────────────┘
                     │
                     ▼
        Frontend (React + Vite)
```

---

### Web Application

| Area | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| UI Components | shadcn/ui, Radix UI, lucide-react |
| Animasi | Framer Motion |
| Routing | React Router |
| API Communication | Axios |
| Linting | Oxlint |
| Backend | Node.js, Express 5 |
| Database, Auth, Storage | Supabase (`@supabase/supabase-js`) |
| Deployment | Vercel (Frontend dan Backend sebagai dua proyek terpisah) |
| Development Tools | Visual Studio Code, GitHub, GitHub Projects (Kanban) |

### Machine Learning dan Data Science

| Area | Technology |
|---|---|
| Programming Language | Python |
| Model | XGBoost (eksperimen) dan aturan deviasi FAPAR (skor final) |
| Data Processing | Pandas, NumPy, PyArrow |
| Data Geospasial | Rasterio (raster FAPAR, zonal statistics per kabupaten) |
| Evaluasi | scikit-learn, SciPy, Matplotlib |
| Sumber Data | FAPAR HDX, curah hujan CHIRPS (via HDX), batas wilayah kabupaten |

### Generative AI

| Area | Technology |
|---|---|
| Penyedia | Groq |
| Model | `openai/gpt-oss-20b` |
| Parameter | `temperature` 0, `max_tokens` 1500, `reasoning_effort` low |
| Cache | Tabel `genai_cache` di Supabase |

---

## Struktur Proyek

```txt
mawas-web-app-main/
├── BackEnd/
│   ├── controllers/            # Logic API: auth, risiko, verifikasi, produksi, intervensi, artikel, user, genai
│   ├── middlewares/            # Autentikasi token Supabase dan RBAC
│   ├── routes/                 # Definisi endpoint Express
│   ├── services/               # groqService (GenAI) dan riskImportService (import prediksi)
│   ├── utils/                  # predictionMapper (normalisasi kategori dan status)
│   ├── scripts/                # seedData.js dan seedGenaiCache.js
│   ├── data/                   # genai_cache.json (sumber seed cache)
│   ├── prompts/                # system_prompt.txt untuk GenAI
│   ├── index.js                # Aplikasi Express (diekspor untuk Vercel)
│   ├── server.js               # Entry point lokal
│   ├── vercel.json             # Konfigurasi deploy Vercel
│   └── package.json            # Dependensi backend
│
├── FrontEnd/
│   ├── public/
│   │   ├── data/               # GeoJSON provinsi/kabupaten dan output model untuk peta
│   │   └── logo-mawas/         # Aset logo (PNG, JPG, sumber .af)
│   ├── src/
│   │   ├── components/         # ui, landing, dashboard, map, auth, layout, common
│   │   ├── pages/              # Landing, PublicRiskMap, ReadArticle, Auth, Dashboard
│   │   ├── lib/                # api.ts (Axios), proyeksi geo, data dashboard, daftar provinsi
│   │   └── types/              # Tipe TypeScript peta dan dashboard
│   ├── design.md               # Arah desain dan aturan konten
│   ├── agents.md               # Aturan kerja frontend
│   ├── vercel.json             # SPA rewrite untuk Vercel
│   └── vite.config.ts          # Konfigurasi Vite dan proxy /api
│
├── ml-service/
│   ├── scripts/                # Skrip bernomor 01-69 dan modul bantu (fapar_utils, fitur_utils, model_utils)
│   ├── models/                 # Kebiasaan kabupaten, definisi skor, metrik, dan model XGBoost eksperimen
│   ├── output_model/           # Output model terbaru (status_data = "model")
│   ├── dummy/                  # Data contoh h30/h60 (status_data = "contoh")
│   ├── docs/                   # Kontrak output, tabel training, alur skrip, spesifikasi GenAI, plot evaluasi
│   ├── prompts/                # system_prompt.txt (acuan prompt GenAI)
│   ├── requirements.txt        # Dependensi Python
│   └── .env.example            # Template environment ML
│
└── README.md                   # Dokumentasi utama proyek
```

Folder `ml-service/data/` (data mentah dan olahan) sengaja tidak masuk Git.

---

## System Flow

```txt
Pipeline ML membaca FAPAR dan curah hujan per kabupaten
↓
Skor risiko dihitung dan diekspor ke risiko_kabupaten_terbaru.json
↓
Operator/Superadmin mengunggah JSON lewat dashboard (atau menjalankan seeder)
↓
Backend memvalidasi payload lalu meng-upsert ke tabel risiko_wilayah
↓
Publik membuka peta risiko; Frontend memuat data dan menggabungkannya dengan GeoJSON lewat id_fe
↓
Operator memeriksa prediksi di Pusat Verifikasi dan menyimpan status verifikasi
↓
Backend meminta analisis GenAI ke Groq (atau mengambil dari cache) untuk kabupaten terpilih
↓
Frontend menampilkan skor, kategori, faktor penyebab, analisis GenAI, dan laporan
```

---

## Metodologi Skor Risiko

Skor risiko final menggunakan **aturan deviasi FAPAR**, bukan prediksi langsung dari model XGBoost.

1. **Kebiasaan kabupaten**: rata-rata anomali FAPAR tiap kabupaten pada periode 1 Jan 2021 s.d. 11 Agu 2026 (`models/kebiasaan_kabupaten.csv`).
2. **Deviasi**: `deviasi = fapar_mean(t) − kebiasaan_fapar(kabupaten)`. Semakin negatif, semakin jauh di bawah kebiasaan.
3. **Skor**: persentil deviasi **antar-kabupaten pada tanggal yang sama**. Skor 0 berarti paling aman, 100 paling berisiko.
4. **Kategori**:

| Kategori | Aturan | Warna |
|---|---|---|
| `rendah` | Skor di bawah persentil 50 | Hijau |
| `sedang` | Persentil 50–79 dan deviasi FAPAR negatif | Kuning |
| `tinggi` | Persentil ≥ 80 dan deviasi FAPAR negatif | Merah |
| `data tidak tersedia` | Tidak ada skor | Abu-abu |

5. **Konteks hujan**: anomali hujan 10 hari (`rfq`) memakai kriteria BMKG sebagai informasi pendukung, bukan penentu kategori.

| Nilai `rfq` | Arti |
|---|---|
| < 85 | Bawah normal |
| 85 – 115 | Mendekati normal |
| > 115 | Atas normal |

### Hasil Evaluasi

Lift mengukur seberapa sering kabupaten yang ditandai 20% terburuk benar-benar termasuk 20% terburuk (acak = 1,0).

| Periode uji | Aturan deviasi | XGBoost (koreksi) | XGBoost + fitur relatif |
|---|---|---|---|
| 2023 | 1,55 | 1,33 | 1,50 |
| 2024 | 1,34 | 1,20 | 1,18 |
| 2025–2026 | 1,46 | 1,28 | 1,28 |

Aturan deviasi yang sederhana mengungguli XGBoost pada ketiga periode uji, sehingga aturan inilah yang dipakai sebagai skor final. Kemampuan pengurutan tergolong **sedang-lemah**, dan hasil ini dicantumkan secara terbuka pada antarmuka.

---

## Petunjuk Setup Environment

Mawas membutuhkan proyek **Supabase** (Auth, PostgreSQL, Storage) dan, untuk fitur GenAI, **API key Groq** dari [console.groq.com](https://console.groq.com).

### Backend Environment

Buat file `.env` di dalam folder `BackEnd/`. Repository belum menyertakan `BackEnd/.env.example`, jadi salin template berikut.

```env
PORT=5000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

GROQ_API_KEY=your_groq_api_key

FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
```

| Variable | Fungsi |
|---|---|
| `PORT` | Port Express lokal (default `5000`) |
| `SUPABASE_URL` | URL proyek Supabase |
| `SUPABASE_KEY` | Anon key Supabase (`SUPABASE_ANON_KEY` juga diterima) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key, hanya untuk Backend (admin user, import, storage, cache GenAI) |
| `GROQ_API_KEY` | API key Groq untuk analisis GenAI |
| `FRONTEND_URL` | Origin Frontend untuk callback Google OAuth |
| `CORS_ORIGINS` | Origin Frontend yang diizinkan, dipisahkan koma. `localhost` dan `127.0.0.1` selalu diizinkan |

### Frontend Environment

Pada development **tidak perlu** file `.env`. Vite meneruskan request `/api/*` ke `http://localhost:5000`.

Untuk production, atur variabel berikut di Vercel:

```env
VITE_API_URL=https://mawas-web-app.vercel.app/
```

Isi dengan origin Backend tanpa akhiran `/api`. Jangan mengatur `VITE_API_URL` pada development lokal.

### ML Service Environment

Buat file `.env` di dalam folder `ml-service/` berdasarkan `ml-service/.env.example`.

```env
GROQ_API_KEY=isi_di_sini_dengan_key_anda_dari_console.groq.com
```

---

## Setup Database dan Storage

> Repository ini **belum menyertakan file SQL schema**. Tabel dan bucket di bawah ini disusun dari kode Backend; buat sesuai kebutuhan kolom di dalamnya.

### Tabel

| Tabel | Fungsi |
|---|---|
| `kabupaten` | Master wilayah: `kode_kabupaten`, `nama_kabupaten`, `provinsi`, `id_fe` |
| `risiko_wilayah` | Prediksi risiko per kabupaten, tanggal, dan horizon (skor, kategori, `faktor_penyebab`, `rfq`, `r1q`, `r3q`, `frac_valid`, dll.) |
| `verifikasi_risiko` | Status verifikasi operator (`menunggu`, `terverifikasi`, `perlu_cek`), catatan, dan waktu pembaruan |
| `produksi_pangan` | Laporan luas lahan dan estimasi panen per wilayah |
| `intervensi_mitigasi` | Program intervensi dengan status Direncanakan, Sedang Berjalan, atau Selesai |
| `artikel_cms` | Artikel edukasi dengan status `draft` atau `published` |
| `genai_cache` | Cache analisis GenAI dengan kunci unik `kode_kabupaten, tanggal, model, prompt_hash` |

### Storage Bucket

| Bucket | Fungsi |
|---|---|
| `avatars` | Foto profil pengguna |
| `artikel-thumbnails` | Gambar artikel CMS |

### Akun dan Role

Role disimpan di `user_metadata.role` pada Supabase Auth dengan nilai `superadmin` atau `operator`. Buat akun Superadmin pertama langsung dari dashboard Supabase, lalu buat akun operator lewat menu **Manajemen Akun**.

### Mengisi Data Awal

Setelah tabel siap, isi data prediksi dan cache GenAI dari folder `BackEnd/`:

```bash
npm run seed                 # meng-upsert 514 prediksi dari ml-service/output_model/risiko_kabupaten_terbaru.json
npm run seed:genai-cache     # memindahkan data/genai_cache.json ke tabel genai_cache
```

Seeder membatalkan proses jika file sumber tidak memuat tepat 514 kabupaten dengan kode unik, atau jika skema tabel belum sesuai.

---

## Cara Menjalankan Aplikasi

Prasyarat: Node.js dan npm. Jalankan Backend dan Frontend pada dua terminal terpisah.

### 1. Menjalankan Backend

```bash
cd BackEnd
npm install
# buat file .env (lihat bagian Backend Environment)
npm run dev
```

Backend berjalan di:

```txt
http://localhost:5000
```

Untuk menjalankan tanpa nodemon:

```bash
npm run start
```

### 2. Menjalankan Frontend

```bash
cd FrontEnd
npm install
npm run dev
```

Frontend berjalan di:

```txt
http://localhost:5173
```

Perintah lain:

```bash
npm run build     # type-check dan build production
npm run preview   # pratinjau hasil build
npm run lint      # Oxlint
```

---

## Pipeline Machine Learning

Folder `ml-service/` berisi pipeline **offline**. Hasilnya adalah file JSON yang diimpor ke Backend. Saat ini ML Service **bukan** layanan API yang berjalan terus-menerus; Backend membaca hasil model dari database, bukan memanggil model secara langsung.

### Menyiapkan Environment

```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Data

Data mentah dan olahan disimpan di `ml-service/data/` dan **tidak masuk Git**. Data yang dibutuhkan:

- Raster FAPAR per dekad (`.tif`, 206 dekad, 2021 s.d. 11 Sep 2026).
- Curah hujan kabupaten (CHIRPS), difilter ke 2021–2026.
- GeoJSON batas kabupaten.

### Alur Utama

| Tahap | Skrip | Keluaran |
|---|---|---|
| Zonal statistics FAPAR per kabupaten | `24_zonal_all.py`, `27_zonal_final.py` | FAPAR per kabupaten per dekad |
| Gabung FAPAR dan hujan | `30_join_fapar_hujan.py` | Tabel gabungan |
| Tabel training | `32_build_training_table.py` | 93.936 baris (456 kabupaten × 206 dekad) |
| Evaluasi dan eksperimen | `36`–`46` | Metrik di `models/` |
| Kebiasaan kabupaten dan definisi skor | `47_simpan_kebiasaan.py` | `kebiasaan_kabupaten.csv`, `skor_meta.json` |
| Faktor penyebab dan JSON final | `66_isi_faktor_penyebab.py`, `65c_json_terbaru.py` | `output_model/risiko_kabupaten_terbaru.json` |
| Uji GenAI | `67`–`69` | Koneksi Groq, uji prompt, cache |

Regenerasi JSON output dari folder `ml-service` dengan virtual environment aktif:

```bash
python scripts/66_isi_faktor_penyebab.py
python scripts/65c_json_terbaru.py
```

Skrip eksplorasi sekali pakai (inspeksi, plot, pengecekan) tidak perlu dijalankan ulang. Peta lengkap seluruh skrip ada di [`ml-service/docs/alur_script.md`](./ml-service/docs/alur_script.md), dan struktur tabel training di [`ml-service/docs/tabel_training.md`](./ml-service/docs/tabel_training.md).

### Eksperimen XGBoost

| Item | Nilai |
|---|---|
| Target | `target_fapar_t3` (FAPAR 3 dekad, sekitar 30 hari ke depan) |
| Jumlah fitur | 17 (`fapar_mean`, lag FAPAR, hujan `rfh`/`rfq` beserta lag, `r1h`, `r3h`, `r1q`, `r3q`, `bulan`) |
| Hyperparameter | 300 estimator, `learning_rate` 0,05, `max_depth` 4, `subsample` 0,8, `colsample_bytree` 0,8 |
| Validasi | Split berdasarkan waktu, bukan acak |
| Data training / uji awal | 53.258 / 21.526 baris |

Model XGBoost tersimpan di `ml-service/models/` sebagai eksperimen dan **bukan** inti skor final.

---

## Format Output Model

Berkas `ml-service/output_model/risiko_kabupaten_terbaru.json` (juga disalin ke `FrontEnd/public/data/`) memuat output model terbaru.

| Properti | Nilai Saat Ini |
|---|---|
| `status_data` | `model` |
| `tanggal_acuan` | `2026-09-11` |
| `horizon_hari` | `30` |
| Cakupan | 514 kabupaten/kota (473 punya data cuaca, 41 tidak) |

Distribusi kategori pada tanggal acuan: 247 rendah, 25 sedang, 69 tinggi, dan 173 data tidak tersedia.

```json
{
  "kode_kabupaten": "11.11",
  "nama_kabupaten": "Bireuen",
  "provinsi": "Aceh",
  "tanggal": "2026-09-11",
  "horizon_hari": 30,
  "skor_risiko": 83.28,
  "kategori": "tinggi",
  "faktor_penyebab": "Hujan 10 hari terakhir mendekati normal",
  "dihasilkan_pada": "2026-10-22T14:27:09Z",
  "status_data": "model",
  "punya_data_cuaca": true,
  "id_fe": "kabupaten-bireuen",
  "frac_valid": 0.35,
  "n_valid": 8,
  "n_piksel": 23,
  "rfq": 108.64,
  "r1q": 99.55,
  "r3q": 76.87
}
```

Struktur lengkap, arti setiap field, dan seluruh nilai `faktor_penyebab` ada di [`ml-service/docs/kontrak_output_model.md`](./ml-service/docs/kontrak_output_model.md).

Aturan penting untuk Frontend dan Backend:

1. `status_data = "model"` ditampilkan sebagai **DATA MODEL**, sedangkan data dummy berlabel **DATA CONTOH**.
2. `skor_risiko = null` ditampilkan sebagai "Data tidak tersedia" beserta `faktor_penyebab`. Jangan diganti dengan 0.
3. Gabungkan peta dengan `id_fe`, bukan `kode_kabupaten`.
4. Tulis "kondisi per 11 Sep 2026", bukan "real-time".
5. Warna kategori selalu disertai teks.

Contoh data placeholder untuk pengembangan tersedia di `ml-service/dummy/` (`dummy_risiko_h30.json` dan `dummy_risiko_h60.json`) dengan `status_data = "contoh"`.

---

## Analisis GenAI

Backend bertindak sebagai **proxy ke Groq** sehingga API key tidak pernah sampai ke browser.

```txt
GET /api/genai/:kode_kabupaten?tanggal=YYYY-MM-DD
```

Alur singkat:

1. Backend membaca prediksi dari `risiko_wilayah` dan metadata dari `kabupaten`.
2. Backend menyusun prompt dari `BackEnd/prompts/system_prompt.txt` dan data kabupaten.
3. Backend mencari hasil di `genai_cache` dengan kunci `kode_kabupaten | tanggal | model | hash_prompt`.
4. Jika belum ada, Backend memanggil Groq, memvalidasi output, lalu menyimpannya ke cache.

Validasi output sebelum ditampilkan:

| Pemeriksaan | Aturan |
|---|---|
| Frasa terlarang | `gagal panen`, `krisis pangan`, `paceklik`, `pasti`, `dijamin`, `akurat`, `real-time` |
| Label komponen | Tidak boleh memuat `Kondisi:`, `Penyebab:`, `Penjelasan:`, `Saran:` |
| Panjang | Maksimal 5 kalimat |
| Angka | Harus sesuai data masukan (toleransi pembulatan 0,6) |

Jika validasi gagal atau Groq tidak tersedia, pengguna melihat pesan cadangan: *"Analisis tidak dapat ditampilkan saat ini. Silakan coba lagi nanti."* Permintaan yang sama pada waktu bersamaan digabung (in-flight dedup) agar tidak menghabiskan kuota.

Kuota free tier Groq yang dipakai: 30 RPM, 1.000 RPD, 8.000 TPM, sehingga cache wajib. Perubahan `system_prompt.txt` mengubah hash prompt dan otomatis membuat cache lama tidak terpakai. Detail lengkap ada di [`ml-service/docs/spesifikasi_genai.md`](./ml-service/docs/spesifikasi_genai.md).

---

## Peran Pengguna dan Hak Akses

| Peran | Akses |
|---|---|
| Publik (tanpa login) | Landing page, peta risiko, tabel status, artikel yang diterbitkan, daftar produksi dan intervensi, analisis GenAI |
| `operator` | Semua akses publik, ditambah dashboard: verifikasi prediksi, import data model, kelola data produksi dan intervensi |
| `superadmin` | Semua akses operator, ditambah CMS artikel dan manajemen akun operator |

Token autentikasi diverifikasi ke Supabase pada setiap request terproteksi. Akun yang dinonaktifkan (`banned_until`) ditolak. Frontend menyimpan token di `localStorage` dengan kunci `mawas_token` dan otomatis keluar saat menerima respons 401/403.

---

## Dokumentasi API

Base URL lokal:

```txt
http://localhost:5000
```

Health check `GET /` mengembalikan `{ "message": "Server mawas berjalan lancar!" }`.

### Auth: `/api/auth`

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| POST | `/login` | Publik | Login email dan password |
| POST | `/register` | Publik | Dinonaktifkan (selalu 403) |
| GET | `/google` | Publik | Mengambil URL Google OAuth |
| PUT | `/profile` | Login | Ubah nama dan avatar |
| PUT | `/change-password` | Login | Ganti password |
| POST | `/profile/avatar` | Login | Unggah foto profil (JPEG/PNG/WebP, maks 5 MB) |

### Risiko Wilayah: `/api/risiko`

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| GET | `/` | Publik | Seluruh prediksi risiko beserta data kabupaten |
| GET | `/summary` | Publik | Ringkasan widget dashboard |
| GET | `/trend-nasional` | Publik | Tren nasional (opsional `?provinsi=`) |
| GET | `/:kode` | Publik | Prediksi terbaru satu kabupaten |
| GET | `/:kode/analisis` | Publik | Analisis GenAI (format lama) |
| POST | `/import` | Operator, Superadmin | Import prediksi dari payload JSON |
| POST | `/seed` | Operator, Superadmin | Import dari `risiko_kabupaten_terbaru.json` di server |

### GenAI: `/api/genai`

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| GET | `/:kode` | Publik | Analisis teks per kabupaten (`?tanggal=YYYY-MM-DD`) |

### Verifikasi: `/api/verifikasi`

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| GET | `/` | Publik | Daftar tugas verifikasi (filter `status`, `kategori`) |
| POST | `/` | Operator, Superadmin | Kirim verifikasi atau koreksi |

### Produksi Pangan: `/api/produksi`

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| GET | `/` | Publik | Laporan produksi beserta ringkasan luas dan estimasi panen |
| POST | `/` | Operator, Superadmin | Tambah laporan |
| DELETE | `/:id` | Operator, Superadmin | Hapus laporan |

### Intervensi Mitigasi: `/api/intervensi`

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| GET | `/` | Publik | Daftar program beserta ringkasan status |
| POST | `/` | Operator, Superadmin | Tambah usulan |
| PATCH | `/:id/status` | Operator, Superadmin | Ubah status program |
| DELETE | `/:id` | Operator, Superadmin | Hapus program |

### Artikel: `/api/articles`

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| GET | `/` | Publik | Artikel yang diterbitkan |
| GET | `/:id` | Publik | Satu artikel yang diterbitkan |
| GET | `/manage` | Superadmin | Seluruh artikel termasuk draft |
| POST | `/` | Superadmin | Buat artikel |
| PATCH | `/:id` | Superadmin | Ubah artikel |
| DELETE | `/:id` | Superadmin | Hapus artikel |
| POST | `/upload-image` | Superadmin | Unggah gambar (JPEG/PNG/WebP, maks 4 MB) |
| DELETE | `/upload-image` | Superadmin | Hapus gambar |

### Manajemen Operator: `/api/users` (khusus Superadmin)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/operators` | Daftar operator |
| POST | `/operators` | Buat akun operator |
| PATCH | `/operators/:id` | Ubah data atau status operator |
| PUT | `/operators/:id/password` | Reset password operator |
| DELETE | `/operators/:id` | Hapus operator |

Request terproteksi memakai header `Authorization: Bearer <token>`.

---

## Halaman Aplikasi

| Route | Akses | Deskripsi |
|---|---|---|
| `/` | Publik | Landing page |
| `/peta-risiko` | Publik | Peta risiko interaktif layar penuh |
| `/artikel/:articleId` | Publik | Membaca artikel |
| `/signin`, `/login` | Publik | Halaman login |
| `/signup` | Publik | Dialihkan ke `/signin` (registrasi mandiri dinonaktifkan) |
| `/dashboard` | Operator, Superadmin | Dashboard terproteksi |

---

## Deployment

Frontend dan Backend dideploy sebagai **dua proyek Vercel terpisah** dari repository yang sama.

### Backend

1. Buat proyek Vercel dengan **Root Directory** `BackEnd`.
2. `BackEnd/vercel.json` mengarahkan seluruh request ke `index.js`.
3. Atur environment variable berikut:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GROQ_API_KEY=your_groq_api_key
FRONTEND_URL=https://your-frontend-url.vercel.app
CORS_ORIGINS=https://your-frontend-url.vercel.app
```

`FRONTEND_URL` dipakai untuk callback Google OAuth, dan pada `NODE_ENV=production` nilainya tidak boleh `localhost`.

### Frontend

1. Buat proyek Vercel dengan **Root Directory** `FrontEnd`.
2. `FrontEnd/vercel.json` menambahkan rewrite SPA ke `index.html`.
3. Atur environment variable berikut, lalu redeploy:

```env
VITE_API_URL=https://your-backend-url.vercel.app
```

---

## Catatan Keamanan

- File `.env` asli tidak disertakan dan sudah masuk `.gitignore`.
- `SUPABASE_SERVICE_ROLE_KEY` dan `GROQ_API_KEY` hanya boleh ada di Backend; jangan pernah memasukkannya ke Frontend.
- Backend menolak request dari origin yang tidak ada di `CORS_ORIGINS` (kecuali `localhost`).
- Registrasi mandiri dinonaktifkan; akun dibuat oleh Superadmin.
- Akses tulis ke data produksi, intervensi, verifikasi, dan import prediksi dibatasi oleh RBAC (`operator`/`superadmin`).
- Frontend tidak memanggil Groq secara langsung.
- Output GenAI divalidasi sebelum ditampilkan dan tidak boleh memuat angka di luar data.

---

## Keterbatasan

Informasi berikut juga dicantumkan pada antarmuka agar klaim Mawas tetap jujur:

- **Skor relatif**: skor adalah persentil antar-kabupaten pada tanggal yang sama, sehingga selalu ada kabupaten berskor tinggi dan rendah di setiap tanggal.
- **Bukan prakiraan akurat**: kemampuan pengurutan sedang-lemah (lift sekitar 1,2–1,6; acak = 1,0).
- **Bukan real-time**: data berhenti 11 Sep 2026 dan diperbarui manual. Data hujan pada tanggal tersebut berstatus `prelim`.
- **41 kabupaten tanpa data cuaca**: 30 kabupaten pemekaran Papua dan 11 kabupaten non-Papua.
- **Sebagian kabupaten tidak memiliki skor**: batas wilayah tidak tersedia, data satelit tertutup awan atau kosong, atau data historis kurang (173 kabupaten berstatus "data tidak tersedia" pada tanggal acuan).
- **Hujan hanya konteks**: `faktor_penyebab` bukan diagnosis dan tidak membuktikan hujan menyebabkan stres vegetasi.
- **Kota kecil**: nilai FAPAR mewakili area di sekitar kota, bukan kotanya.
- **XGBoost tidak lebih baik dari aturan sederhana**: GenAI menjelaskan aturan deviasi, bukan prediksi ML.
- **Satuan FAPAR anomaly** belum terverifikasi terhadap dokumentasi HDX.
- **Skema database** belum didokumentasikan dalam file SQL pada repository ini.

---

## Saran Pengembangan

1. **Pembaruan Data Otomatis**
   Mengotomatiskan pengunduhan FAPAR dan curah hujan serta regenerasi skor secara berkala, agar peta tidak bergantung pada pembaruan manual.

2. **ML Service sebagai API**
   Membungkus pipeline menjadi layanan inferensi (misalnya FastAPI) agar skor dapat dihitung ulang tanpa menjalankan skrip secara manual.

3. **Model Prediksi Time-Series**
   Mengembangkan model yang benar-benar memprediksi kondisi ke depan (misalnya horizon +7, +14, +30, dan +60 hari), sebagai kelanjutan dari skor kondisi terkini saat ini. Struktur data contoh sudah tersedia di `ml-service/dummy/`.

4. **Perluasan ke Sektor Lain**
   Menambahkan sektor peternakan dan perikanan setelah sektor pertanian matang.

5. **Perbaikan Model**
   Mengeksplorasi fitur tambahan (kelembapan tanah, jenis tanaman, kalender tanam) dan menetapkan ambang kategori berbasis validasi lapangan.

6. **Analisis Tingkat Kecamatan**
   Memperluas peta ke tingkat kecamatan; data awal Kabupaten Bogor sudah tersedia di `FrontEnd/public/data/kecamatan/`.

7. **Integrasi Data Lapangan**
   Menghubungkan hasil verifikasi PPL dan data produksi pangan untuk mengkalibrasi skor.

8. **Notifikasi Otomatis**
   Mengirim peringatan melalui email atau WhatsApp saat kabupaten pantauan masuk kategori tinggi.

9. **Skema Database Terdokumentasi**
   Menambahkan file SQL schema dan `BackEnd/.env.example` agar setup dari nol lebih mudah.

10. **Pengujian Otomatis**
    Menambahkan unit test dan integration test untuk Backend dan Frontend.

---

## Dokumen Pendukung

| Dokumen | Lokasi |
|---------|----------|
| Kontrak Output Model | [`ml-service/docs/kontrak_output_model.md`](./ml-service/docs/kontrak_output_model.md) |
| Spesifikasi GenAI | [`ml-service/docs/spesifikasi_genai.md`](./ml-service/docs/spesifikasi_genai.md) |
| Tabel Training | [`ml-service/docs/tabel_training.md`](./ml-service/docs/tabel_training.md) |
| Alur Skrip ML | [`ml-service/docs/alur_script.md`](./ml-service/docs/alur_script.md) |
| Plot Evaluasi | `ml-service/docs/evaluasi/evaluasi_xgboost.png` |
| Output Model | [`ml-service/output_model/README.md`](./ml-service/output_model/README.md) |
| Data Contoh | [`ml-service/dummy/README.md`](./ml-service/dummy/README.md) |
| Arah Desain Frontend | [`FrontEnd/design.md`](./FrontEnd/design.md) |
| Aturan Kerja Frontend | `FrontEnd/agents.md` |

---

## Tim Pengembang

**Tim Birokrasi Async**, Universitas Islam Negeri Sumatera Utara.
Proyek ini dikembangkan untuk Lomba Web Development IT Fest 2026 dengan tema *Pelayanan Publik dalam Skala Besar* dan sub tema *Smart Government*.

| No | Nama | Peran | GitHub |
|---|---|---|---|
| 1 | Kaka Davi Dharmawan | Ketua; Data Scientist & ML/AI Engineer | [@dapiupiu](https://github.com/dapiupiu) |
| 2 | Dodyk Fahlome | Backend | [@dymef15](https://github.com/dymef15) |
| 3 | Adli Rahman Harun Harahap | Frontend | [@adliharahap](https://github.com/adliharahap) |
| 4 | Haidar Al-mutawalli | Desain & Dokumentasi | [@HiroAozora](https://github.com/HiroAozora) |

---

## Deliverables

| Component | Status |
|------------|------------|
| Frontend Application | Available |
| Backend API | Available |
| Pipeline ML dan Skor Risiko | Available |
| Output Model (514 kabupaten/kota) | Available |
| Analisis GenAI | Available |
| Dokumentasi Teknis ML dan GenAI | Available |
| Deployment Configuration (Vercel) | Available |
| Database Schema (SQL) | Not included |
| Automated Tests | Not included |

---

<p align="center">
Developed by Team Mawas<br/>
<b>Sistem Peringatan Dini Risiko Kekeringan Pertanian</b>
</p>
