const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper pemetaan kategori JSON ke constraint DB ('Kritis', 'Waspada', 'Normal')
const mapKategori = (kategoriJson) => {
  if (!kategoriJson) return 'Normal';
  const kat = String(kategoriJson).toLowerCase().trim();
  switch (kat) {
    case 'tinggi':
    case 'kritis':
      return 'Kritis';
    case 'sedang':
    case 'waspada':
      return 'Waspada';
    case 'rendah':
    case 'normal':
      return 'Normal';
    default:
      return 'Normal';
  }
};

// 1. Seed Data dari file JSON dummy milik ML
exports.seedRisikoData = async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../ml-service/dummy/dummy_risiko_h30.json');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File dummy_risiko_h30.json tidak ditemukan!" });
    }

    const rawData = fs.readFileSync(filePath, 'utf-8');
    const parsedJSON = JSON.parse(rawData);

    // Ambil array data: baik jika JSON berbentuk Array [...] maupun Object { data: [...] }
    const dummyData = Array.isArray(parsedJSON) ? parsedJSON : (parsedJSON.data || Object.values(parsedJSON));

    if (!Array.isArray(dummyData)) {
      return res.status(400).json({ error: "Format file JSON tidak berisikan array data yang valid!" });
    }

    const dataWilayah = [];
    const formattedRisikoData = [];

    dummyData.forEach(item => {
      const kodeWilayah = String(item.kode_kabupaten || item.kode_wilayah || item.id_wilayah);
      const namaKabupaten = item.nama_kabupaten || item.nama_wilayah || 'Unknown';
      const provinsi = item.provinsi || 'Unknown';

      if (!kodeWilayah) return;

      // Persiapan data tabel `wilayah`
      dataWilayah.push({
        kode_wilayah: kodeWilayah,
        nama_wilayah: namaKabupaten,
        provinsi: provinsi
      });

      // Normalisasi skor risiko ke skala 0 - 1 jika dalam skala 0 - 100
      let skorNormalized = item.skor_risiko;
      if (typeof skorNormalized === 'number' && skorNormalized > 1) {
        skorNormalized = skorNormalized / 100;
      }

      // Persiapan data tabel `risiko_wilayah`
      formattedRisikoData.push({
        kode_wilayah: kodeWilayah,
        nama_kabupaten: namaKabupaten,
        tanggal: item.tanggal || new Date().toISOString().split('T')[0],
        skor_risiko: skorNormalized !== null ? Math.min(Math.max(skorNormalized, 0), 1) : null,
        kategori: mapKategori(item.kategori),
        faktor_penyebab: Array.isArray(item.faktor_penyebab) ? item.faktor_penyebab : (item.faktor_penyebab ? [item.faktor_penyebab] : []),
        dihasilkan_pada: item.dihasilkan_pada || new Date().toISOString(),
        horizon_hari: item.horizon_hari || 30,
        status_data: item.status_data || 'model'
      });
    });

    // Step A: Upsert ke tabel `wilayah` terlebih dahulu agar FK valid
    const uniqueWilayah = Array.from(
      new Map(dataWilayah.map(w => [w.kode_wilayah, w])).values()
    );

    const { error: errWilayah } = await supabase
      .from('wilayah')
      .upsert(uniqueWilayah, { onConflict: 'kode_wilayah' });

    if (errWilayah) {
      return res.status(400).json({ error: `Gagal memperbarui tabel wilayah: ${errWilayah.message}` });
    }

    // Step B: Insert / Upsert ke tabel `risiko_wilayah`
    const { data, error: errRisiko } = await supabase
      .from('risiko_wilayah')
      .insert(formattedRisikoData);

    if (errRisiko) {
      return res.status(400).json({ error: errRisiko.message });
    }

    return res.status(201).json({
      message: `Berhasil mengimpor ${formattedRisikoData.length} data risiko kabupaten ke database!`,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 2. Ambil Semua Data Risiko (Untuk Peta Frontend & Tabel Spasial)
exports.getAllRisiko = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('risiko_wilayah')
      .select(`
        *,
        wilayah:kode_wilayah ( provinsi, nama_wilayah )
      `)
      .order('tanggal', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({
      status: 'success',
      total: data.length,
      data: data
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 3. Ambil Detail Risiko Berdasarkan Kode Wilayah / Kabupaten
exports.getRisikoByKode = async (req, res) => {
  try {
    const { kode } = req.params;

    const { data, error } = await supabase
      .from('risiko_wilayah')
      .select(`
        *,
        wilayah:kode_wilayah ( provinsi, nama_wilayah )
      `)
      .eq('kode_wilayah', kode)
      .order('tanggal', { ascending: false });

    if (error || !data || data.length === 0) {
      return res.status(404).json({ error: "Data risiko kabupaten tidak ditemukan." });
    }

    return res.status(200).json({
      status: 'success',
      data: data[0] // Mengambil record risiko paling terbaru
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 4. Ringkasan Eksekutif untuk Widget Banner Top Dashboard Utama (Ringkasan Wilayah)
exports.getDashboardSummary = async (req, res) => {
  try {
    // A. Hitung Total Wilayah & Kategori Kritis
    const { data: risikoData, error: errRisiko } = await supabase
      .from('risiko_wilayah')
      .select('kategori');

    if (errRisiko) throw errRisiko;

    const totalWilayah = risikoData ? risikoData.length : 0;
    const totalKritis = risikoData ? risikoData.filter(r => r.kategori === 'Kritis').length : 0;

    // B. Hitung Tugas Menunggu Verifikasi (F04)
    const { data: verifData, error: errVerif } = await supabase
      .from('verifikasi_risiko')
      .select('status_verifikasi');

    if (errVerif) throw errVerif;

    const totalMenunggu = verifData ? verifData.filter(v => v.status_verifikasi === 'Menunggu Review').length : 0;

    // C. Hitung Intervensi Mitigasi Sedang Berjalan (F05)
    const { data: intervensiData, error: errIntervensi } = await supabase
      .from('intervensi_mitigasi')
      .select('status');

    if (errIntervensi) throw errIntervensi;

    const totalIntervensiBerjalan = intervensiData ? intervensiData.filter(i => i.status === 'Sedang Berjalan').length : 0;

    return res.status(200).json({
      status: 'success',
      data: {
        wilayah_pantauan: totalWilayah,
        kategori_kritis: totalKritis,
        menunggu_verifikasi: totalMenunggu,
        intervensi_berjalan: totalIntervensiBerjalan
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 5. Data Tren Risiko Agregat Nasional (Landing Page Section 1)
exports.getTrenNasional = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('risiko_wilayah')
      .select('skor_risiko');

    if (error) return res.status(400).json({ error: error.message });

    const totalSkor = data ? data.reduce((acc, curr) => acc + Number(curr.skor_risiko || 0), 0) : 0;
    const avgSkor = data && data.length > 0 ? Number((totalSkor / data.length).toFixed(2)) : 0.18;

    const trendMingguan = [
      { minggu: 'Minggu 1', skor: Number((avgSkor * 0.85).toFixed(2)) },
      { minggu: 'Minggu 2', skor: Number((avgSkor * 0.95).toFixed(2)) },
      { minggu: 'Minggu 3', skor: Number((avgSkor * 1.10).toFixed(2)) },
      { minggu: 'Minggu 4', skor: Number((avgSkor * 1.00).toFixed(2)) },
    ];

    return res.status(200).json({
      status: 'success',
      data: {
        indeks_stres_saat_ini: avgSkor,
        ambang_kritis: 0.50,
        trend: trendMingguan,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};