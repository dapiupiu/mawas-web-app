const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Ambil daftar tugas verifikasi (risiko wilayah + status verifikasinya)
exports.getTugasVerifikasi = async (req, res) => {
  try {
    const { status, kategori } = req.query;

    // 1. Ambil data risiko_wilayah beserta informasi wilayahnya
    let queryRisiko = supabase
      .from('risiko_wilayah')
      .select(`
        *,
        wilayah:kode_wilayah ( provinsi, nama_wilayah )
      `)
      .order('tanggal', { ascending: false });

    if (kategori) {
      queryRisiko = queryRisiko.eq('kategori', kategori);
    }

    const { data: dataRisiko, error: errRisiko } = await queryRisiko;
    if (errRisiko) return res.status(400).json({ error: errRisiko.message });

    // 2. Ambil data verifikasi_risiko
    const { data: dataVerifikasi, error: errVerif } = await supabase
      .from('verifikasi_risiko')
      .select('*');

    if (errVerif) return res.status(400).json({ error: errVerif.message });

    // Buat Map untuk pencarian verifikasi berdasar kode_wilayah & tanggal cepat
    const verifMap = new Map();
    if (dataVerifikasi) {
      dataVerifikasi.forEach((v) => {
        verifMap.set(`${v.kode_wilayah}_${v.tanggal}`, v);
      });
    }

    // 3. Gabungkan data risiko dan verifikasi secara manual di JS
    const formattedData = dataRisiko.map((item) => {
      const verif = verifMap.get(`${item.kode_wilayah}_${item.tanggal}`) || 
                     verifMap.get(item.kode_wilayah); // fallback ke kode_wilayah saja jika ada

      return {
        kode_wilayah: item.kode_wilayah,
        nama_kabupaten: item.nama_kabupaten,
        tanggal: item.tanggal,
        horizon_hari: item.horizon_hari,
        skor_risiko_ai: item.skor_risiko,
        kategori_ai: item.kategori,
        faktor_penyebab: item.faktor_penyebab,
        skor_final: verif?.skor_override ?? item.skor_risiko,
        kategori_final: verif?.kategori_override ?? item.kategori,
        status_verifikasi: verif?.status_verifikasi || 'Menunggu Review',
        catatan_operator: verif?.catatan_operator || null,
        diverifikasi_oleh: verif?.diverifikasi_oleh || null,
        terakhir_diperbarui: verif?.terakhir_diperbarui || null,
      };
    });

    // Filter opsional berdasarkan status verifikasi
    let result = formattedData;
    if (status) {
      result = formattedData.filter((item) => item.status_verifikasi === status);
    }

    return res.status(200).json({
      status: 'success',
      total: result.length,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST / PUT: Simpan / Koreksi hasil verifikasi operator (Review & Koreksi)
exports.submitVerifikasi = async (req, res) => {
  try {
    const {
      kode_wilayah,
      tanggal,
      horizon_hari = 30,
      status_verifikasi, // 'Tervalidasi' atau 'Dikoreksi Operator'
      skor_override,
      kategori_override,
      catatan_operator,
      diverifikasi_oleh,
    } = req.body;

    const diverifikasi_user_id = req.user?.id;

    if (!kode_wilayah || !tanggal || !status_verifikasi) {
      return res.status(400).json({
        error: 'kode_wilayah, tanggal, dan status_verifikasi wajib diisi!',
      });
    }

    const payload = {
      kode_wilayah,
      tanggal,
      horizon_hari,
      status_verifikasi,
      skor_override: skor_override !== undefined ? skor_override : null,
      kategori_override: kategori_override || null,
      catatan_operator: catatan_operator || '',
      diverifikasi_oleh: diverifikasi_oleh || req.user?.email || 'Operator',
      diverifikasi_user_id,
      terakhir_diperbarui: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('verifikasi_risiko')
      .upsert(payload, { onConflict: 'kode_wilayah,tanggal,horizon_hari' })
      .select();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({
      status: 'success',
      message: 'Hasil verifikasi berhasil disimpan!',
      data: data[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};