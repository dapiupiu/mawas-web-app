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
      .order('tanggal', { ascending: false })
      .order('horizon_hari', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !kabupaten) {
      return res.status(404).json({ error: "Data wilayah tidak ditemukan." });
    }

    const score = kabupaten.skor_risiko === null
      ? null
      : Number(kabupaten.skor_risiko);
    const normalizedScore = score !== null && score <= 1 ? score * 100 : score;
    const categoryMap = {
      kritis: 'tinggi',
      waspada: 'sedang',
      normal: 'rendah',
      tidak_tersedia: 'data tidak tersedia',
    };
    const normalizedCategory = normalizedScore === null
      ? 'data tidak tersedia'
      : categoryMap[String(kabupaten.kategori || '').toLowerCase()] || 'data tidak tersedia';
    const normalizedRisk = {
      ...kabupaten,
      skor_risiko: normalizedScore,
      kategori: normalizedCategory,
    };

    // 2. Panggil Gemini dengan kategori dan skor yang digunakan UI (0-100).
    const analisisAI = await generateAnalisisRisiko(normalizedRisk);

    // 3. Gabungkan data ML + hasil Analisis AI
    return res.status(200).json({
      kode_kabupaten: kabupaten.kode_kabupaten,
      nama_kabupaten: kabupaten.nama_kabupaten,
      tanggal: kabupaten.tanggal,
      skor_risiko: normalizedScore,
      kategori: normalizedCategory,
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