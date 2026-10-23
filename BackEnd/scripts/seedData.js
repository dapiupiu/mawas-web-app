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
  '../../FrontEnd/public/data/risiko_kabupaten_terbaru.json'
);

const seed = async () => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File prediksi lokal tidak ditemukan: ${filePath}`);
  }

  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const supabase = createClient(supabaseUrl, supabaseKey);
  const result = await importPredictions(supabase, payload);

  console.log(`Seeder selesai: ${result.total} prediksi berhasil di-upsert.`);
  console.log(`Tanggal acuan: ${result.metadata.tanggalAcuan}; horizon: ${result.metadata.horizonHari} hari.`);
};

seed().catch((error) => {
  console.error(`Seeder gagal: ${error.message}`);
  process.exitCode = 1;
});
