const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const { importPredictions } = require('../services/riskImportService');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL dan SUPABASE_KEY (atau SUPABASE_SERVICE_ROLE_KEY) wajib tersedia.');
  process.exit(1);
}

const filePath = path.resolve(
  __dirname,
  '../../ml-service/output_model/risiko_kabupaten_terbaru.json'
);

const seed = async () => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File prediksi lokal tidak ditemukan: ${filePath}`);
  }

  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(payload?.data) || payload.data.length !== 514) {
    throw new Error('Seeder dibatalkan: file sumber harus memuat 514 prediksi kabupaten.');
  }
  if (new Set(payload.data.map((item) => item?.kode_kabupaten)).size !== 514) {
    throw new Error('Seeder dibatalkan: kode kabupaten dalam file sumber tidak unik.');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const schemaChecks = await Promise.all([
    supabase
      .from('kabupaten')
      .select('kode_kabupaten,nama_kabupaten,provinsi,id_fe')
      .limit(0),
    supabase
      .from('risiko_wilayah')
      .select(
        'kode_kabupaten,tanggal,horizon_hari,skor_risiko,kategori,faktor_penyebab,punya_data_cuaca,frac_valid,n_valid,n_piksel,rfq,r1q,r3q,alasan_vegetasi_kosong,alasan_cuaca_kosong'
      )
      .limit(0),
    supabase
      .from('verifikasi_risiko')
      .select('kode_kabupaten,tanggal,horizon_hari,status_verifikasi')
      .limit(0),
  ]);
  const schemaError = schemaChecks.find((check) => check.error)?.error;
  if (schemaError) {
    throw new Error(`Skema Supabase belum sesuai; tidak ada data yang ditulis: ${schemaError.message}`);
  }

  const result = await importPredictions(supabase, payload);

  console.log(`Seeder selesai: ${result.total} prediksi berhasil di-upsert dari output ML terbaru.`);
  console.log(`Tanggal acuan: ${result.metadata.tanggalAcuan}; horizon: ${result.metadata.horizonHari} hari.`);
};

seed().catch((error) => {
  console.error(`Seeder gagal: ${error.message}`);
  process.exitCode = 1;
});
