"""
Skrip 68 — Uji prompt ketat pada 5 kabupaten representatif.

Tujuan:
- Kirim system prompt (prompts/system_prompt.txt) + data 1 kabupaten ke Groq.
- Uji 5 kabupaten: tinggi, sedang (anti-halusinasi), rendah, tidak tersedia, rfq ekstrem.
- Validasi otomatis: kata terlarang, halusinasi angka, saran generik, panjang.
- Cetak skor kelulusan per kabupaten.

Bukan untuk: cache (itu skrip 69), spesifikasi final (itu docs).
"""

import json
import re
import time
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# 1. Path & konstanta
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent  # ml-service/
SYSTEM_PROMPT_PATH = ROOT / "prompts" / "system_prompt.txt"
JSON_PATH = ROOT / "output_model" / "risiko_kabupaten_terbaru.json"
ENV_PATH = ROOT / ".env"

MODEL = "openai/gpt-oss-20b"
TEMPERATURE = 0.0
MAX_TOKENS = 1500  # cukup untuk reasoning + 4 kalimat

# 5 kabupaten final (kode_kabupaten -> label untuk laporan)
KABUPATEN_UJI = {
    "16.74": "tinggi (skor 100, rfq 42.7)",
    "13.02": "sedang (skor 77.4, rfq 80.2 — anti-halusinasi: hujan normal)",
    "11.08": "rendah (skor 24.9, rfq 100.8 — jangan alarm palsu)",
    "12.71": "data tidak tersedia (semua None)",
    "91.71": "rendah, rfq 7.2 — hujan ekstrem kering tapi risiko rendah (uji terkeras)",
}

# Kata terlarang (aturan 3)
KATA_TERLARANG = [
    "gagal panen",
    "krisis pangan",
    "paceklik",
    "pasti",
    "dijamin",
    "akurat",
    "real-time",
]


# ---------------------------------------------------------------------------
# 2. Baca .env (sama seperti skrip 67)
# ---------------------------------------------------------------------------
def baca_api_key(env_path: Path) -> str:
    if not env_path.exists():
        raise SystemExit(f"[ERROR] File .env tidak ditemukan di {env_path}")
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("GROQ_API_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("[ERROR] GROQ_API_KEY tidak ditemukan di .env")


# ---------------------------------------------------------------------------
# 3. Format DATA untuk model
# ---------------------------------------------------------------------------
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
    # tambahkan alasan kosong kalau ada (grounding untuk "kenapa data kosong")
    if it.get("alasan_vegetasi_kosong"):
        baris.append(f"- Alasan data vegetasi kosong: {it['alasan_vegetasi_kosong']}")
    if it.get("alasan_cuaca_kosong"):
        baris.append(f"- Alasan data cuaca kosong: {it['alasan_cuaca_kosong']}")

    return "\n".join(baris) + "\n"


# ---------------------------------------------------------------------------
# 4. Panggil Groq
# ---------------------------------------------------------------------------
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
        "reasoning_effort": "low",  # kurangi token berpikir; hapus kalau Groq menolak
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
        "teks": data["choices"][0]["message"]["content"],
        "usage": data.get("usage", {}),
        "latensi": elapsed,
    }


# ---------------------------------------------------------------------------
# 5. Validasi otomatis
# ---------------------------------------------------------------------------
def validasi(teks: str, it: dict) -> dict:
    hasil = {"lolos": True, "catatan": []}
    teks_lower = teks.lower()

    # (a) kata terlarang
    for kata in KATA_TERLARANG:
        if kata in teks_lower:
            hasil["lolos"] = False
            hasil["catatan"].append(f"KATA TERLARANG: '{kata}'")

    # (a2) label terlarang (output harus natural)
    for label in ["kondisi:", "penyebab:", "penjelasan:", "saran:"]:
        if label in teks_lower:
            hasil["lolos"] = False
            hasil["catatan"].append(
                f"LABEL TERLARANG: '{label}' (ingin output natural)"
            )

    # (b) halusinasi angka dengan toleransi pembulatan + aritmatika turunan
    angka_sah_float = []
    for v in [it.get("skor_risiko"), it.get("rfq"), it.get("r1q"), it.get("r3q")]:
        if v is not None:
            angka_sah_float.append(float(v))
            # turunan wajar: 100 - x (persentase komplementer)
            angka_sah_float.append(100.0 - float(v))
    angka_struktural = {
        0.0,
        100.0,
        10.0,
        20.0,
        float(it["horizon_hari"]),
        2026.0,
        11.0,
        9.0,
    }

    def angka_sah(nilai: float) -> bool:
        if nilai in angka_struktural:
            return True
        for sah in angka_sah_float:
            if abs(nilai - sah) < 0.6:
                return True
        return False

    angka_teks = re.findall(r"\d+(?:[.,]\d+)?", teks)
    angka_valid_ditemukan = False
    for a in angka_teks:
        a_norm = float(a.replace(",", "."))
        if angka_sah(a_norm):
            angka_valid_ditemukan = True
        else:
            hasil["lolos"] = False
            hasil["catatan"].append(
                f"ANGKA MUNGKIN HALUSINASI: '{a}' (tidak ada di data)"
            )

    # (c) saran wajib menyebut angka dari data (aturan 7)
    if not angka_valid_ditemukan and it.get("skor_risiko") is not None:
        hasil["lolos"] = False
        hasil["catatan"].append("SARAN TANPA ANGKA DATA (aturan 7)")

    # (d) hitung kalimat: pisah hanya di . ! ? yang diikuti spasi + huruf besar
    pecahan = re.split(r"(?<=[.!?])\s+(?=[A-Z])", teks.strip())
    jumlah_kalimat = len([s for s in pecahan if s.strip()])
    if jumlah_kalimat > 5:
        hasil["lolos"] = False
        hasil["catatan"].append(f"TERLALU PANJANG: {jumlah_kalimat} kalimat")

    return hasil


# ---------------------------------------------------------------------------
# 6. Main
# ---------------------------------------------------------------------------
def main():
    api_key = baca_api_key(ENV_PATH)
    system_prompt = SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")
    d = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    by_kode = {x["kode_kabupaten"]: x for x in d["data"]}

    total_lolos = 0
    for kode, label in KABUPATEN_UJI.items():
        it = by_kode.get(kode)
        if it is None:
            print(f"[WARN] {kode} tidak ditemukan di JSON")
            continue

        user_prompt = (
            format_data(it) + "\nBuat analisis sesuai aturan untuk kabupaten ini."
        )
        print(f"\n{'=' * 70}")
        print(f"[{kode}] {label}")
        print(f"{'=' * 70}")

        hasil = panggil_groq(api_key, system_prompt, user_prompt)
        if "error" in hasil:
            print(f"[ERROR] {hasil['error']} (latensi {hasil['latensi']:.2f}s)")
            continue

        teks = hasil["teks"].strip()
        usage = hasil["usage"]
        print(f"Latensi: {hasil['latensi']:.2f}s | Token: {usage.get('total_tokens')}")
        print(f"--- Respons ---\n{teks}\n")

        v = validasi(teks, it)
        if v["lolos"]:
            total_lolos += 1
            print("✅ LOLOS validasi")
        else:
            print("❌ GAGAL:")
            for c in v["catatan"]:
                print(f"   - {c}")

    print(f"\n{'=' * 70}")
    print(f"RINGKASAN: {total_lolos}/{len(KABUPATEN_UJI)} kabupaten lolos validasi")
    print(f"{'=' * 70}")


if __name__ == "__main__":
    main()
