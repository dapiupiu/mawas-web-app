# Spesifikasi GenAI — Mawas (untuk BE)

Status: draf final Sesi 6 (24 Okt 2026).
Audiens: BE (Orang 2 / backup).
Tujuan: BE bisa mengimplementasikan fitur GenAI tanpa membaca kode Python.

---

## 1. Arsitektur

```
[Browser/FE] --GET /api/genai/:kode--> [Backend Mawas di Railway] --POST--> [Groq API]
                                              |
                                              +--> baca cache (file JSON statis)
```

- **FE tidak boleh** memanggil Groq langsung (API key bocor).
- **Backend** adalah proxy: terima permintaan FE, cek cache, panggil Groq kalau perlu, kembalikan teks.
- **API key** disimpan di **environment variable** Railway: `GROQ_API_KEY`. **Jangan** hardcode di kode.

## 2. Model & Parameter Final

| Parameter | Nilai | Alasan |
|---|---|---|
| Model | `openai/gpt-oss-20b` | Tersedia di free tier Groq (30 RPM, 1K RPD, 8K TPM). |
| `temperature` | `0.0` | Deterministik, patuh fakta. |
| `max_tokens` | `1500` | Model reasoning butuh ruang berpikir + jawaban. 400 terlalu kecil (respons kosong). |
| `reasoning_effort` | `"low"` | Kurangi token berpikir; respons lebih cepat (~1.2 detik), token turun ~15%. |

**Rate limit aktual akun:** 30 RPM, 1.000 RPD, 8.000 TPM. Satu request ~1.770 token → ~4 request/menit sebelum kena TPM. **Cache wajib.**

## 3. System Prompt

Lihat file: `ml-service/prompts/system_prompt.txt`.

**Jangan diubah tanpa menguji ulang.** Hash prompt saat ini: `855a6454` (8 karakter pertama SHA-256). Kunci cache memuat hash ini; kalau prompt berubah, cache lama otomatis tidak terpakai.

## 4. Format DATA (input ke model)

BE **tidak** perlu menyusun format ini sendiri kalau memakai cache. Tapi kalau memanggil Groq langsung (cache miss), BE harus menyusun `user_prompt` seperti ini:

```
DATA:
- Kabupaten: {nama_kabupaten}
- Provinsi: {provinsi}
- Tanggal: {tanggal} (horizon {horizon_hari} hari)
- Kategori risiko: {kategori}
- Skor risiko: {skor_risiko atau "tidak tersedia"}
- Faktor penyebab: {faktor_penyebab}
- Curah hujan (rfq): {rfq atau "tidak tersedia"}
[- Alasan data vegetasi kosong: {alasan_vegetasi_kosong}]   <- jika ada
[- Alasan data cuaca kosong: {alasan_cuaca_kosong}]         <- jika ada

Buat analisis sesuai aturan untuk kabupaten ini.
```

Semua nilai diambil dari `output_model/risiko_kabupaten_terbaru.json` (field per kabupaten).

## 5. Kontrak Endpoint (rekomendasi)

```
GET /api/genai/:kode_kabupaten
```

**Query opsional:** `?tanggal=2026-09-11` (default: `tanggal_acuan` dari JSON).

**Response 200 (sukses):**
```json
{
  "kode_kabupaten": "16.74",
  "nama_kabupaten": "Kota Prabumulih",
  "tanggal": "2026-09-11",
  "teks": "Kabupaten Kota Prabumulih masuk kategori risiko tinggi...",
  "dari_cache": true,
  "dihasilkan_pada": "2026-10-24T...",
  "model": "openai/gpt-oss-20b"
}
```

**Response 404:** kabupaten tidak ditemukan.
**Response 503:** Groq tidak tersedia / rate limit.

## 6. Strategi Cache

### 6.1 Format file

Satu file JSON: `output_model/cache_genai.json` (atau disimpan di server Railway).

```json
{
  "16.74|2026-09-11|openai/gpt-oss-20b|855a6454": {
    "teks": "...",
    "dihasilkan_pada": "2026-10-24T...",
    "model": "openai/gpt-oss-20b",
    "usage": {"prompt_tokens": 1780, "completion_tokens": 983, "total_tokens": 1763},
    "latensi": 1.23
  }
}
```

**Kunci:** `{kode_kabupaten}|{tanggal}|{model}|{hash_prompt_8}`.
- `hash_prompt_8` melindungi dari cache basi saat prompt diubah.
- Ganti model = kunci berubah = cache lama tidak terpakai.

### 6.2 Alur cache-aside (di BE)

```
1. Susun kunci = kode|tanggal|model|hash_prompt.
2. Jika kunci ada di cache:
     return { ..., teks: cache[kunci].teks, dari_cache: true }
3. Jika tidak:
     panggil Groq.
     validasi output (bagian 7).
     simpan ke cache.
     return { ..., teks, dari_cache: false }
```

### 6.3 Invalidasi

- **Prompt berubah** → hash berubah → kunci baru. Cache lama diabaikan (bisa dibersihkan manual).
- **Data berubah** (tanggal acuan baru, skor baru) → tanggal ikut kunci → otomatis terpisah.
- **Tidak perlu TTL.** Data statis (11 Sep 2026) tidak berubah.

## 7. Validasi Output (WAJIB di BE sebelum tampil ke pengguna)

Sebelum mengembalikan `teks` ke FE, BE **wajib** memeriksa:

| Pemeriksaan | Aturan | Aksi jika gagal |
|---|---|---|
| Kata terlarang | Tidak boleh ada: `gagal panen`, `krisis pangan`, `paceklik`, `pasti`, `dijamin`, `akurat`, `real-time` | Log + ganti teks dengan pesan fallback |
| Label | Tidak boleh ada: `Kondisi:`, `Penyebab:`, `Penjelasan:`, `Saran:` | (sama) |
| Panjang | Maksimal ~5 kalimat | (sama) |
| Angka | Angka di teks harus cocok dengan data (toleransi pembulatan 0.6) atau turunan (`100 - skor`) | (sama) |

**Pesan fallback** (jika validasi gagal):
```
"Analisis tidak dapat ditampilkan saat ini. Silakan coba lagi nanti."
```
Jangan tampilkan output yang melanggar — lebih baik kosong daripada menyesatkan.

## 8. Contoh Implementasi (JavaScript)

```javascript
// backend/services/groqService.js
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";
const HASH_PROMPT = "855a6454"; // sinkronkan dengan system_prompt.txt

async function panggilGroq(systemPrompt, userPrompt) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.0,
      max_tokens: 1500,
      reasoning_effort: "low",
    }),
  });
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}
```

## 9. Keterbatasan (wajib ditampilkan di UI)

- Data berhenti **11 Sep 2026**; bukan real-time. UI harus menulis "kondisi per 11 Sep 2026".
- Data hujan tanggal ini berstatus **prelim** (sementara).
- **41 kabupaten tanpa data cuaca** (30 Papua + 11 non-Papua); GenAI akan menyebut "data tidak tersedia".
- Skor adalah **peringkat antar-kabupaten** (persentil), bukan prakiraan absolut.
- Kemampuan pengurutan **sedang-lemah** (lift presisi@20% ~1.4; acak = 1.0).
- XGBoost **tidak** lebih baik dari aturan sederhana; GenAI menjelaskan **aturan deviasi**, bukan prediksi ML.

## 10. Hasil Uji (Sesi 6)

- **5/5 kabupaten** lolos validasi otomatis (kata terlarang, halusinasi, label, panjang).
- Latensi API rata-rata **~1.2 detik** (5 request).
- Token per request **~1.770** (prompt + completion).
- Dua kasus tepi tersulit **tidak** memicu alarm palsu:
  - Jayapura (rfq 7.2, kategori rendah) → tetap "rendah".
  - Solok (rfq 80.2, kategori sedang) → tetap "sedang".
- Medan (data kosong) → menyebut alasan cuaca kosong, tidak mengarang.

## 11. Langkah Berikutnya untuk BE

1. Tambah route `GET /api/genai/:kode_kabupaten`.
2. Buat `services/groqService.js` (ganti `geminiService.js`).
3. Muat `system_prompt.txt` (bisa disalin ke `backend/prompts/system_prompt.txt`).
4. Muat cache dari `output_model/cache_genai.json` (atau file di Railway).
5. Terapkan validasi output (bagian 7).
6. Uji: panggil 1 kabupaten dengan cache → `dari_cache: true`, tanpa request API.

## 12. Pengisi Cache Penuh (skrip 70, opsional)

Untuk mengisi cache 514 kabupaten, lihat `scripts/70_isi_cache_penuh.py` (dibuat setelah spesifikasi ini). Jalankan **di lokal**, bukan di server. Butuh ~2 jam karena TPM 8.000.

**Jangan** jalankan di Railway — akan kena rate limit dan memblokir demo.