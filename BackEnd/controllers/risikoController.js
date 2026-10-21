const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

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

    // Pemetaan data agar sesuai dengan kolom tabel Supabase
    const formattedData = dummyData.map(item => ({
      kode_kabupaten: item.kode_kabupaten,
      nama_kabupaten: item.nama_kabupaten,
      tanggal: item.tanggal,
      skor_risiko: item.skor_risiko,
      kategori: item.kategori,
      faktor_penyebab: item.faktor_penyebab || [],
      dihasilkan_pada: item.dihasilkan_pada || new Date().toISOString(),
      horizon_hari: item.horizon_hari || 30,
      status_data: item.status_data || 'contoh'
    }));

    // Menyimpan / memperbarui data ke Supabase (Upsert)
    const { data, error } = await supabase
      .from('risiko_wilayah')
      .upsert(formattedData, { onConflict: 'kode_kabupaten' });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: `Berhasil mengimpor ${formattedData.length} data risiko kabupaten ke database!`,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 2. Ambil Semua Data Risiko (Untuk Peta Frontend)
exports.getAllRisiko = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('risiko_wilayah')
      .select('*');

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

// 3. Ambil Detail Risiko Berdasarkan Kode Kabupaten
exports.getRisikoByKode = async (req, res) => {
  try {
    const { kode } = req.params;

    const { data, error } = await supabase
      .from('risiko_wilayah')
      .select('*')
      .eq('kode_kabupaten', kode)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Data risiko kabupaten tidak ditemukan." });
    }

    return res.status(200).json({
      status: 'success',
      data: data
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};