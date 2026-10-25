const { mapDatabaseRiskCategory } = require('../utils/predictionMapper');

const BATCH_SIZE = 200;

const getPredictionRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (payload && typeof payload === 'object' && payload.kode_kabupaten) return [payload];
  return [];
};

const normalizeScore = (score) => {
  if (score === null || score === undefined || score === '') return null;
  const parsed = Number(score);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(`Skor risiko tidak valid: ${score}. Output ML harus berada pada rentang 0-1 atau 0-100.`);
  }
  return parsed <= 1 ? parsed : parsed / 100;
};

const nullableNumber = (value, field, code, { minimum = -Infinity, maximum = Infinity, integer = false } = {}) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (
    !Number.isFinite(parsed) ||
    parsed < minimum ||
    parsed > maximum ||
    (integer && !Number.isInteger(parsed))
  ) {
    throw new Error(`Nilai ${field} tidak valid untuk kabupaten ${code}.`);
  }
  return parsed;
};

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const normalizePredictions = (payload) => {
  const rows = getPredictionRows(payload);
  if (rows.length === 0) {
    throw new Error('Payload tidak memuat data prediksi dalam properti "data".');
  }

  const generatedAt = payload?.dihasilkan_pada || new Date().toISOString();
  const defaultDate = payload?.tanggal_acuan;
  const defaultHorizon = Number(payload?.horizon_hari) || 30;
  const seenCodes = new Set();

  return rows.map((item, index) => {
    const code = String(item?.kode_kabupaten || '').trim();
    const name = String(item?.nama_kabupaten || '').trim();
    const province = String(item?.provinsi || '').trim();
    const date = item?.tanggal || defaultDate;
    const horizon = Number(item?.horizon_hari) || defaultHorizon;

    if (!code || !name || !province || !date) {
      throw new Error(`Data prediksi ke-${index + 1} wajib memiliki kode_kabupaten, nama_kabupaten, provinsi, dan tanggal.`);
    }
    if (seenCodes.has(code)) {
      throw new Error(`Payload mengandung kode_kabupaten duplikat: ${code}.`);
    }
    if (!Number.isInteger(horizon) || horizon <= 0) {
      throw new Error(`Horizon prediksi tidak valid untuk kabupaten ${code}.`);
    }
    if (typeof date !== 'string' || !isValidDate(date)) {
      throw new Error(`Tanggal prediksi tidak valid untuk kabupaten ${code}.`);
    }
    seenCodes.add(code);

    const score = normalizeScore(item.skor_risiko);
    const sourceCategory = String(item.kategori || '').toLowerCase().trim();
    if (
      ![
        'rendah',
        'normal',
        'aman',
        'sedang',
        'waspada',
        'tinggi',
        'kritis',
        'data tidak tersedia',
        'tidak_tersedia',
      ].includes(sourceCategory)
    ) {
      throw new Error(`Kategori risiko tidak dikenal untuk kabupaten ${code}: ${item.kategori}.`);
    }
    const factors = item.faktor_penyebab;
    const feId = item.id_fe === null || item.id_fe === undefined
      ? null
      : String(item.id_fe).trim() || null;

    return {
      kabupaten: {
        kode_kabupaten: code,
        nama_kabupaten: name,
        provinsi: province,
        ...(feId ? { id_fe: feId } : {}),
      },
      risiko: {
        kode_kabupaten: code,
        nama_kabupaten: name,
        provinsi: province,
        tanggal: date,
        horizon_hari: horizon,
        skor_risiko: score,
        kategori: mapDatabaseRiskCategory(item.kategori, score),
        faktor_penyebab: Array.isArray(factors)
          ? factors.filter(Boolean).join('; ')
          : factors
            ? String(factors).trim()
            : null,
        dihasilkan_pada: item.dihasilkan_pada || generatedAt,
        status_data: item.status_data || payload?.status_data || 'model',
        punya_data_cuaca: typeof item.punya_data_cuaca === 'boolean'
          ? item.punya_data_cuaca
          : null,
        frac_valid: nullableNumber(item.frac_valid, 'frac_valid', code, {
          minimum: 0,
          maximum: 1,
        }),
        n_valid: nullableNumber(item.n_valid, 'n_valid', code, {
          minimum: 0,
          integer: true,
        }),
        n_piksel: nullableNumber(item.n_piksel, 'n_piksel', code, {
          minimum: 0,
          integer: true,
        }),
        rfq: nullableNumber(item.rfq, 'rfq', code, { minimum: 0 }),
        r1q: nullableNumber(item.r1q, 'r1q', code, { minimum: 0 }),
        r3q: nullableNumber(item.r3q, 'r3q', code, { minimum: 0 }),
        alasan_vegetasi_kosong: item.alasan_vegetasi_kosong || null,
        alasan_cuaca_kosong: item.alasan_cuaca_kosong || null,
      },
    };
  });
};

const upsertBatches = async (supabase, table, rows, onConflict) => {
  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    const batch = rows.slice(offset, offset + BATCH_SIZE);
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict });
    if (error) {
      throw new Error(`Gagal memperbarui tabel ${table}: ${error.message}`);
    }
  }
};

const upsertRiskRows = async (supabase, rows) => {
  await upsertBatches(
    supabase,
    'risiko_wilayah',
    rows,
    'kode_kabupaten,tanggal,horizon_hari'
  );
};

const importPredictions = async (supabase, payload) => {
  const normalized = normalizePredictions(payload);
  const kabupaten = Array.from(
    new Map(normalized.map(({ kabupaten: row }) => [row.kode_kabupaten, row])).values()
  );
  const risiko = normalized.map(({ risiko: row }) => row);

  await upsertBatches(supabase, 'kabupaten', kabupaten, 'kode_kabupaten');
  await upsertRiskRows(supabase, risiko);

  return {
    total: risiko.length,
    metadata: {
      dihasilkanPada: payload?.dihasilkan_pada || risiko[0].dihasilkan_pada,
      tanggalAcuan: payload?.tanggal_acuan || risiko[0].tanggal,
      horizonHari: Number(payload?.horizon_hari) || risiko[0].horizon_hari,
      totalKabupaten: risiko.length,
      statusData: payload?.status_data || 'model',
      catatan: payload?.catatan,
    },
  };
};

module.exports = {
  getPredictionRows,
  importPredictions,
  normalizePredictions,
  upsertRiskRows,
};
