const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Ambil semua data laporan produksi pangan + ringkasan stat widget F03
exports.getAllProduksi = async (req, res) => {
  try {
    const { kode_wilayah, komoditas, search } = req.query;

    let query = supabase
      .from('produksi_pangan')
      .select(`
        *,
        wilayah:kode_wilayah ( provinsi, nama_wilayah )
      `)
      .order('tanggal_lapor', { ascending: false });

    if (kode_wilayah) query = query.eq('kode_wilayah', kode_wilayah);
    if (komoditas) query = query.eq('komoditas', komoditas);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    // Filter opsional berdasarkan keyword pencarian (kabupaten / petugas)
    let result = data;
    if (search) {
      const keyword = search.toLowerCase();
      result = data.filter(
        (item) =>
          item.nama_kabupaten?.toLowerCase().includes(keyword) ||
          item.petugas_pelapor?.toLowerCase().includes(keyword)
      );
    }

    // Kalkulasi Angka Ringkasan Widget Atas (Total Luas Tanam & Total Estimasi Panen)
    const totalLuasLahan = result.reduce((acc, curr) => acc + Number(curr.luas_lahan_ha || 0), 0);
    const totalEstimasiPanen = result.reduce((acc, curr) => acc + Number(curr.estimasi_panen_ton || 0), 0);

    return res.status(200).json({
      status: 'success',
      total: result.length,
      summary: {
        total_luas_terdata_ha: Number(totalLuasLahan.toFixed(2)),
        total_estimasi_panen_ton: Number(totalEstimasiPanen.toFixed(2)),
      },
      data: result,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST: Tambah laporan produksi pangan baru (+ Tambah Data Produksi Baru)
exports.createProduksi = async (req, res) => {
  try {
    const {
      kode_wilayah,
      nama_kabupaten,
      komoditas,
      luas_lahan_ha,
      estimasi_panen_ton,
      kondisi_air,
      tanggal_lapor,
      petugas_pelapor,
    } = req.body;

    const created_by = req.user?.id;

    if (!kode_wilayah || !komoditas || !luas_lahan_ha || !estimasi_panen_ton || !kondisi_air || !tanggal_lapor || !petugas_pelapor) {
      return res.status(400).json({ error: 'Semua field form produksi pangan wajib diisi!' });
    }

    const { data, error } = await supabase
      .from('produksi_pangan')
      .insert([
        {
          kode_wilayah,
          nama_kabupaten,
          komoditas,
          luas_lahan_ha: Number(luas_lahan_ha),
          estimasi_panen_ton: Number(estimasi_panen_ton),
          kondisi_air,
          tanggal_lapor,
          petugas_pelapor,
          created_by,
        },
      ])
      .select();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({
      status: 'success',
      message: 'Laporan produksi pangan berhasil ditambahkan!',
      data: data[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// DELETE: Hapus laporan produksi pangan berdasarkan ID
exports.deleteProduksi = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('produksi_pangan')
      .delete()
      .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({
      status: 'success',
      message: 'Laporan produksi pangan berhasil dihapus!',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};