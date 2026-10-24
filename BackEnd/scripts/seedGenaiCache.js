require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const CACHE_PATH = path.resolve(__dirname, '../data/genai_cache.json');
const CONFLICT_COLUMNS = 'kode_kabupaten,tanggal,model,prompt_hash';

const main = async () => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib dikonfigurasi.');
  }

  const cache = JSON.parse(await fs.readFile(CACHE_PATH, 'utf8'));
  const rows = Object.entries(cache).map(([key, entry]) => {
    const [kodeKabupaten, tanggal, model, promptHash] = key.split('|');
    if (!kodeKabupaten || !tanggal || !model || !promptHash || !entry?.teks) {
      throw new Error(`Entri cache tidak valid: ${key}`);
    }
    return {
      kode_kabupaten: kodeKabupaten,
      tanggal,
      model,
      prompt_hash: promptHash,
      teks: entry.teks,
      dihasilkan_pada: entry.dihasilkan_pada || new Date().toISOString(),
      usage: entry.usage || null,
    };
  });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { error } = await supabase
    .from('genai_cache')
    .upsert(rows, { onConflict: CONFLICT_COLUMNS });
  if (error) throw new Error(`Gagal memindahkan cache GenAI ke Supabase: ${error.message}`);

  console.log(`${rows.length} entri cache GenAI berhasil di-upsert ke Supabase.`);
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
