const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Memanggil Gemini API untuk menghasilkan narasi dan rekomendasi intervensi
 * berdasarkan data terstruktur ML.
 */
exports.generateAnalisisRisiko = async (dataKabupaten) => {
  const { nama_kabupaten, skor_risiko, kategori, faktor_penyebab, tanggal } =
    dataKabupaten;

  // Jika data tidak tersedia, jangan panggil LLM untuk menghemat kuota/token
  if (kategori === "data tidak tersedia" || skor_risiko === null) {
    return {
      penjelasan:
        "Data analisis risiko untuk wilayah ini saat ini tidak tersedia.",
      rekomendasi: [],
    };
  }

  // Format faktor penyebab agar tidak error meskipun bukan array
  const teksPenyebab = Array.isArray(faktor_penyebab)
    ? faktor_penyebab.length > 0
      ? faktor_penyebab.join(", ")
      : "Tidak ada anomali signifikan"
    : faktor_penyebab || "Tidak ada anomali signifikan";

  const prompt = `
Kamu adalah asisten pakar analisis risiko kekeringan pertanian untuk sistem Mawas.
Berdasarkan data hasil prediksi Machine Learning berikut:
- Wilayah: ${nama_kabupaten}
- Tanggal Acuan: ${tanggal}
- Skor Risiko Kekeringan: ${skor_risiko}/100
- Kategori Risiko: ${kategori}
- Faktor Penyebab: ${teksPenyebab}

Tugasmu:
1. Buat penjelasan ringkas dalam 2 paragraf singkat mengenai situasi risiko kekeringan pertanian di wilayah tersebut berdasarkan angka di atas.
2. Berikan 3 langkah rekomendasi intervensi praktis untuk dinas pertanian/pemerintah setempat.

Catatan penting:
- Hanya gunakan data di atas, jangan menambah fakta atau spekulasi lain.
- Gunakan bahasa Indonesia yang profesional dan mudah dipahami.
- Kembalikan output dalam format JSON persis seperti berikut:
{
  "penjelasan": "isi 2 paragraf penjelasan...",
  "rekomendasi": ["langkah 1", "langkah 2", "langkah 3"]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest", // <-- Gunakan alias resmi yang selalu aktif
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text;
    return JSON.parse(resultText);
  } catch (error) {
    console.error("Error Gemini API:", error.message);
    // Fallback jika API mengalami error/timeout agar backend tetap stabil
    return {
      penjelasan: `Wilayah ${nama_kabupaten} terindikasi memiliki risiko kekeringan ${kategori} dengan skor ${skor_risiko}.`,
      rekomendasi: [
        "Pemantauan rutin ketersediaan air pasokan irigasi.",
        "Koordinasi dengan kelompok tani setempat.",
        "Penyiapan cadangan sarana pompa air.",
      ],
    };
  }
};
