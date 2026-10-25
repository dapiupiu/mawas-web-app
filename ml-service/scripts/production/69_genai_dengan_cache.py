"""
Skrip 69 — GenAI dengan cache.

Fungsi:
- Baca system prompt + JSON kontrak.
- Untuk tiap kabupaten, cek cache dulu. Kalau ada, pakai. Kalau tidak, panggil API.
- Simpan hasil ke cache (data/cache/genai_cache.json).
- Uji: panggil 5 kabupaten dua kali; panggilan kedua 0 request API.

Konsep:
- Kunci cache = kode_kabupaten|tanggal|model|hash_prompt.
- Hash prompt melindungi dari cache basi saat prompt diubah.
"""

import hashlib
import json
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
SYSTEM_PROMPT_PATH = ROOT / "prompts" / "system_prompt.txt"
JSON_PATH = ROOT / "output_model" / "risiko_kabupaten_terbaru.json"
ENV_PATH = ROOT / ".env"
CACHE_PATH = ROOT / "data" / "cache" / "genai_cache.json"

MODEL = "openai/gpt-oss-20b"
TEMPERATURE = 0.0
MAX_TOKENS = 1500
REASONING_EFFORT = "low"

KABUPATEN_UJI = ["16.74", "13.02", "11.08", "12.71", "91.71"]


def baca_api_key(env_path: Path) -> str:
    if not env_path.exists():
        raise SystemExit(f"[ERROR] File .env tidak ditemukan di {env_path}")
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("GROQ_API_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("[ERROR] GROQ_API_KEY tidak ditemukan di .env")


def hash_prompt(teks: str) -> str:
    """8 karakter pertama hash SHA-256 dari system prompt."""
    return hashlib.sha256(teks.encode("utf-8")).hexdigest()[:8]


def muat_cache(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def simpan_cache(path: Path, cache: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def format_data(it: dict) -> str:
    skor = it.get("skor_risiko")
    skor_str = f"{skor:.1f} dari 100" if skor is not None else "tidak tersedia"
    rfq = it.get("rfq")
    if rfq is None:
        rfq_str = "tidak tersedia"
    else:
        arah = (
            "lebih kering dari normal"
            if rfq < 100
            else "lebih basah dari normal"
            if rfq > 100
            else "sama dengan normal"
        )
        rfq_str = f"{rfq:.1f}% dari normal ({arah})"
    baris = [
        "DATA:",
        f"- Kabupaten: {it['nama_kabupaten']}",
        f"- Provinsi: {it['provinsi']}",
        f"- Tanggal: {it['tanggal']} (horizon {it['horizon_hari']} hari)",
        f"- Kategori risiko: {it['kategori']}",
        f"- Skor risiko: {skor_str}",
        f"- Faktor penyebab: {it['faktor_penyebab']}",
        f"- Curah hujan (rfq): {rfq_str}",
    ]
    if it.get("alasan_vegetasi_kosong"):
        baris.append(f"- Alasan data vegetasi kosong: {it['alasan_vegetasi_kosong']}")
    if it.get("alasan_cuaca_kosong"):
        baris.append(f"- Alasan data cuaca kosong: {it['alasan_cuaca_kosong']}")
    return "\n".join(baris) + "\n"


def panggil_groq(api_key: str, system_prompt: str, user_prompt: str) -> dict:
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": TEMPERATURE,
        "max_tokens": MAX_TOKENS,
        "reasoning_effort": REASONING_EFFORT,
    }
    t0 = time.perf_counter()
    resp = requests.post(url, headers=headers, json=payload, timeout=60)
    elapsed = time.perf_counter() - t0
    if resp.status_code != 200:
        return {
            "error": f"HTTP {resp.status_code}: {resp.text[:300]}",
            "latensi": elapsed,
        }
    data = resp.json()
    return {
        "teks": data["choices"][0]["message"]["content"].strip(),
        "usage": data.get("usage", {}),
        "latensi": elapsed,
    }


def ambil_atau_panggil(
    api_key, system_prompt, user_prompt, kunci_cache, cache
) -> tuple:
    """Kembalikan (hasil, dari_cache)."""
    if kunci_cache in cache:
        return cache[kunci_cache], True

    hasil = panggil_groq(api_key, system_prompt, user_prompt)
    if "error" in hasil:
        return hasil, False

    # simpan ke cache
    from datetime import datetime, timezone

    cache[kunci_cache] = {
        "teks": hasil["teks"],
        "dihasilkan_pada": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "model": MODEL,
        "usage": hasil["usage"],
        "latensi": hasil["latensi"],
    }
    return cache[kunci_cache], False


def main():
    api_key = baca_api_key(ENV_PATH)
    system_prompt = SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")
    hp = hash_prompt(system_prompt)
    d = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    by_kode = {x["kode_kabupaten"]: x for x in d["data"]}
    cache = muat_cache(CACHE_PATH)

    print(f"Hash prompt: {hp}")
    print(f"Cache awal: {len(cache)} entri")
    print()

    for putaran in [1, 2]:
        print(f"=== Putaran {putaran} ===")
        n_api = 0
        n_cache = 0
        for kode in KABUPATEN_UJI:
            it = by_kode.get(kode)
            if it is None:
                continue
            user_prompt = (
                format_data(it) + "\nBuat analisis sesuai aturan untuk kabupaten ini."
            )
            tanggal = it["tanggal"]
            kunci = f"{kode}|{tanggal}|{MODEL}|{hp}"

            hasil, dari_cache = ambil_atau_panggil(
                api_key, system_prompt, user_prompt, kunci, cache
            )
            if dari_cache:
                n_cache += 1
                status = "CACHE"
            else:
                n_api += 1
                status = "API"

            if "error" in hasil:
                print(f"[{kode}] {status} ERROR: {hasil['error'][:100]}")
            else:
                print(
                    f"[{kode}] {status} latensi={hasil['latensi']:.2f}s token={hasil['usage'].get('total_tokens')}"
                )

        # simpan cache setelah tiap putaran
        simpan_cache(CACHE_PATH, cache)
        print(f"Ringkasan putaran {putaran}: {n_api} API, {n_cache} cache")
        print()

    print(f"Cache akhir: {len(cache)} entri di {CACHE_PATH}")


if __name__ == "__main__":
    main()
