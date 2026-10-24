const { createClient } = require('@supabase/supabase-js');
const { generateAnalysis } = require('../services/groqService');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY
);

const categoryMap = {
  kritis: 'tinggi',
  waspada: 'sedang',
  normal: 'rendah',
  tidak_tersedia: 'data tidak tersedia',
};

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

exports.handleGenAI = async (req, res, legacyResponse = false) => {
  try {
    const code = String(req.params.kode || '').trim();
    const requestedDate = req.query.tanggal === undefined
      ? null
      : String(req.query.tanggal).trim();
    if (!code) return res.status(400).json({ error: 'kode_kabupaten wajib diisi.' });
    if (requestedDate && !isValidDate(requestedDate)) {
      return res.status(400).json({ error: 'Format tanggal harus YYYY-MM-DD.' });
    }

    let riskQuery = supabase
      .from('risiko_wilayah')
      .select('*')
      .eq('kode_kabupaten', code);
    if (requestedDate) riskQuery = riskQuery.eq('tanggal', requestedDate);
    const { data: risk, error: riskError } = await riskQuery
      .order('tanggal', { ascending: false })
      .order('horizon_hari', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (riskError) {
      console.error('Gagal membaca data risiko untuk GenAI:', riskError.message);
      return res.status(503).json({ error: 'Data risiko sementara tidak dapat diakses.' });
    }
    if (!risk) return res.status(404).json({ error: 'Data kabupaten tidak ditemukan.' });

    const { data: kabupaten, error: kabupatenError } = await supabase
      .from('kabupaten')
      .select('kode_kabupaten,nama_kabupaten,provinsi')
      .eq('kode_kabupaten', code)
      .maybeSingle();
    if (kabupatenError) {
      console.error('Gagal membaca metadata kabupaten untuk GenAI:', kabupatenError.message);
      return res.status(503).json({ error: 'Data kabupaten sementara tidak dapat diakses.' });
    }

    const dbScore = risk.skor_risiko === null || risk.skor_risiko === undefined
      ? null
      : Number(risk.skor_risiko);
    const score = dbScore === null ? null : dbScore * 100;
    const category = score === null
      ? 'data tidak tersedia'
      : categoryMap[String(risk.kategori || '').toLowerCase()] || 'data tidak tersedia';
    const analysisInput = {
      ...risk,
      kode_kabupaten: code,
      nama_kabupaten: risk.nama_kabupaten || kabupaten?.nama_kabupaten || `Kabupaten ${code}`,
      provinsi: risk.provinsi || kabupaten?.provinsi || 'tidak tersedia',
      skor_risiko: dbScore,
      kategori: category,
      horizon_hari: Number(risk.horizon_hari) || 30,
    };
    const result = await generateAnalysis(analysisInput);
    const response = {
      kode_kabupaten: code,
      nama_kabupaten: analysisInput.nama_kabupaten,
      tanggal: risk.tanggal,
      teks: result.teks,
      dari_cache: result.dari_cache,
      dihasilkan_pada: result.dihasilkan_pada,
      model: result.model,
    };

    if (legacyResponse) {
      return res.status(200).json({
        kode_kabupaten: code,
        nama_kabupaten: analysisInput.nama_kabupaten,
        tanggal: risk.tanggal,
        skor_risiko: score,
        kategori: category,
        faktor_penyebab: risk.faktor_penyebab,
        analisis_ai: {
          penjelasan: result.teks,
          rekomendasi: [],
          label: result.dari_cache ? 'Dari cache' : 'Dihasilkan AI',
        },
      });
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Gagal membuat analisis GenAI:', error.message);
    return res.status(503).json({
      error: 'GenAI tidak tersedia saat ini. Silakan coba lagi nanti.',
    });
  }
};
