const { createClient } = require('@supabase/supabase-js');
const { generateAnalisisRisiko } = require('../services/geminiService');
require('dotenv').config();

// Inisialisasi Supabase client (Sama seperti di risikoController.js)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.getAnalisisWilayah = async (req, res) => {
  try {
    const { kode } = req.params;

    // 1. Ambil data risiko kabupaten dari Supabase
    const { data: kabupaten, error } = await supabase
      .from('risiko_wilayah')
      .select('*')
      .eq('kode_kabupaten', kode)
      .single();

    if (error || !kabupaten) {
      return res.status(404).json({ error: "Data wilayah tidak ditemukan." });
    }

    // 2. Panggil Gemini Service untuk generate narasi AI
    const analisisAI = await generateAnalisisRisiko(kabupaten);

    // 3. Gabungkan data ML + hasil Analisis AI
    return res.status(200).json({
      kode_kabupaten: kabupaten.kode_kabupaten,
      nama_kabupaten: kabupaten.nama_kabupaten,
      tanggal: kabupaten.tanggal,
      skor_risiko: kabupaten.skor_risiko,
      kategori: kabupaten.kategori,
      faktor_penyebab: kabupaten.faktor_penyebab,
      analisis_ai: {
        penjelasan: analisisAI.penjelasan,
        rekomendasi: analisisAI.rekomendasi,
        label: "Dihasilkan AI"
      }
    });

  } catch (error) {
    console.error("Error getAnalisisWilayah:", error);
    return res.status(500).json({ error: "Gagal memproses analisis wilayah." });
  }
};