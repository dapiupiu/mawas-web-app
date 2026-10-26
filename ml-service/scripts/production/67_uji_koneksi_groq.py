"""
Skrip 67 — Uji koneksi ke Groq API.

Tujuan sempit:
- Pastikan GROQ_API_KEY di .env terbaca.
- Pastikan endpoint Groq bisa dihubungi.
- Pastikan model openai/gpt-oss-20b merespons.
- Ukur latensi satu panggilan.

Bukan untuk: uji kualitas prompt, uji 5 kabupaten, atau cache.
Itu di skrip berikutnya (68+).
"""

import os
import time
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# 1. Baca .env secara manual (tanpa python-dotenv)
# ---------------------------------------------------------------------------
# .env berisi satu baris: GROQ_API_KEY=gsk_...
# Kita baca file, ambil baris yang diawali "GROQ_API_KEY=",
# lalu ambil bagian setelah tanda "=".
env_path = Path(__file__).resolve().parent.parent / ".env"
# Path(__file__) = lokasi file skrip ini (scripts/67_...py)
# .parent = folder scripts/
# .parent.parent = folder ml-service/
# / ".env" = ml-service/.env

if not env_path.exists():
    raise SystemExit(f"[ERROR] File .env tidak ditemukan di {env_path}")

api_key = None
for line in env_path.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if not line or line.startswith("#"):
        continue
    if line.startswith("GROQ_API_KEY="):
        api_key = line.split("=", 1)[1].strip()
        break

if not api_key:
    raise SystemExit("[ERROR] GROQ_API_KEY tidak ditemukan atau kosong di .env")

# cetak 4 karakter awal API key
print(f"[INFO] GROQ_API_KEY terbaca: {api_key[:4]}... (panjang {len(api_key)} karakter)")

# ---------------------------------------------------------------------------
# 2. Siapkan request
# ---------------------------------------------------------------------------
url = "https://api.groq.com/openai/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
}

payload = {
    "model": "openai/gpt-oss-20b",
    "messages": [
        {"role": "user", "content": "Balas dengan satu kata: OK"}
    ],
    "temperature": 0.0,
    "max_tokens": 100,
}

# ---------------------------------------------------------------------------
# 3. Kirim request dan ukur latensi
# ---------------------------------------------------------------------------
print("[INFO] Mengirim request ke Groq...")
t0 = time.perf_counter()
resp = requests.post(url, headers=headers, json=payload, timeout=30)
elapsed = time.perf_counter() - t0

# ---------------------------------------------------------------------------
# 4. Periksa hasil
# ---------------------------------------------------------------------------
print(f"[INFO] HTTP status: {resp.status_code}")
print(f"[INFO] Latensi: {elapsed:.2f} detik")

if resp.status_code != 200:
    print("[ERROR] Request gagal. Body respons:")
    print(resp.text)
    raise SystemExit(1)

data = resp.json()
content = data["choices"][0]["message"]["content"]
usage = data.get("usage", {})

print(f"[OK] Respons model: {content!r}")
print(f"[INFO] Token dipakai: prompt={usage.get('prompt_tokens')}, "
      f"completion={usage.get('completion_tokens')}, "
      f"total={usage.get('total_tokens')}")