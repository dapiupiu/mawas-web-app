const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Ambil daftar program intervensi mitigasi + ringkasan widget F05
exports.getAllIntervensi = async (req, res) => {
  try {
    const { status, jenis, kode_wilayah, search } = req.query;

    let query = supabase
      .from('intervensi_mitigasi')
      .select(`
        *,
        wilayah:kode_wilayah ( provinsi, nama_wilayah )
      `)
      .order('tanggal_mulai', { ascending: false });

    if (status) query = query.eq('status', status);
    if (jenis) query = query.eq('jenis', jenis);
    if (kode_wilayah) query = query.eq('kode_wilayah', kode_wilayah);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    // Filter opsional berdasarkan keyword pencarian (nama program / kabupaten / penanggung jawab)
    let result = data;
    if (search) {
      const keyword = search.toLowerCase();
      result = data.filter(
        (item) =>
          item.nama_program?.toLowerCase().includes(keyword) ||
          item.kabupaten_sasaran?.toLowerCase().includes(keyword) ||
          item.penanggung_jawab?.toLowerCase().includes(keyword)
      );
    }

    // Kalkulasi Angka Ringkasan Widget Atas
    const summary = {
      total_program: result.length,
      sedang_berjalan: result.filter((item) => item.status === 'Sedang Berjalan').length,
      direncanakan: result.filter((item) => item.status === 'Direncanakan').length,
      selesai: result.filter((item) => item.status === 'Selesai').length,
    };

    return res.status(200).json({
      status: 'success',
      total: result.length,
      summary,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST: Tambah usulan program intervensi baru (+ Tambah Usulan)
exports.createIntervensi = async (req, res) => {
  try {
    const {
      kode_wilayah,
      nama_program,
      jenis,
      kabupaten_sasaran,
      target_unit_atau_ha,
      anggaran_est = 0,
      status = 'Direncanakan',
      penanggung_jawab,
      tanggal_mulai,
      catatan,
    } = req.body;

    const created_by = req.user?.id;

    if (!kode_wilayah || !nama_program || !jenis || !target_unit_atau_ha || !penanggung_jawab || !tanggal_mulai) {
      return res.status(400).json({ error: 'Field wajib (kode_wilayah, nama_program, jenis, target, penanggung_jawab, tanggal_mulai) belum lengkap!' });
    }

    const { data, error } = await supabase
      .from('intervensi_mitigasi')
      .insert([
        {
          kode_wilayah,
          nama_program,
          jenis,
          kabupaten_sasaran,
          target_unit_atau_ha,
          anggaran_est: Number(anggaran_est),
          status,
          penanggung_jawab,
          tanggal_mulai,
          catatan,
          created_by,
        },
      ])
      .select();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(201).json({
      status: 'success',
      message: 'Program intervensi mitigasi berhasil ditambahkan!',
      data: data[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// PATCH: Update status program intervensi (Direncanakan -> Sedang Berjalan -> Selesai)
exports.updateStatusIntervensi = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Direncanakan', 'Sedang Berjalan', 'Selesai'].includes(status)) {
      return res.status(400).json({ error: 'Status harus bernilai Direncanakan, Sedang Berjalan, atau Selesai!' });
    }

    const { data, error } = await supabase
      .from('intervensi_mitigasi')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({
      status: 'success',
      message: 'Status program intervensi berhasil diperbarui!',
      data: data[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// DELETE: Hapus usulan program intervensi
exports.deleteIntervensi = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('intervensi_mitigasi')
      .delete()
      .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({
      status: 'success',
      message: 'Program intervensi berhasil dihapus!',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};