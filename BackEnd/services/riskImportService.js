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
  let parsed = Number(score);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(`Skor risiko tidak valid: ${score}. Nilai harus berada pada rentang 0-1 atau 0-100.`);
  }
  if (parsed > 1) parsed /= 100;
  return parsed;
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
    seenCodes.add(code);

    const score = normalizeScore(item.skor_risiko);
    const factors = item.faktor_penyebab;

    return {
      kabupaten: {
        kode_kabupaten: code,
        nama_kabupaten: name,
        provinsi: province,
        ...(item?.id_fe ? { id_fe: String(item.id_fe).trim() } : {}),
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
            ? String(factors)
            : '',
        dihasilkan_pada: item.dihasilkan_pada || generatedAt,
        status_data: item.status_data || payload?.status_data || 'model',
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

const insertBatches = async (supabase, table, rows) => {
  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    const batch = rows.slice(offset, offset + BATCH_SIZE);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      throw new Error(`Gagal menambahkan data ke tabel ${table}: ${error.message}`);
    }
  }
};

const makeRiskKey = (row) =>
  `${row.kode_kabupaten}|${row.tanggal}|${Number(row.horizon_hari) || 30}`;

const upsertRiskRows = async (supabase, rows) => {
  const codes = Array.from(new Set(rows.map((row) => row.kode_kabupaten)));
  const existingByKey = new Map();

  for (let offset = 0; offset < codes.length; offset += BATCH_SIZE) {
    const codeBatch = codes.slice(offset, offset + BATCH_SIZE);
    let page = 0;

    while (true) {
      const { data, error } = await supabase
        .from('risiko_wilayah')
        .select('id,kode_kabupaten,tanggal,horizon_hari')
        .in('kode_kabupaten', codeBatch)
        .range(page * 1000, (page + 1) * 1000 - 1);

      if (error) throw new Error(`Gagal membaca tabel risiko_wilayah: ${error.message}`);

      for (const existing of data || []) {
        const key = makeRiskKey(existing);
        const matches = existingByKey.get(key) || [];
        matches.push(existing.id);
        existingByKey.set(key, matches);
      }

      if (!data || data.length < 1000) break;
      page += 1;
    }
  }

  const inserts = [];
  const updates = [];
  for (const row of rows) {
    const ids = existingByKey.get(makeRiskKey(row));
    if (!ids || ids.length === 0) {
      inserts.push(row);
    } else {
      for (const id of ids) updates.push({ id, row });
    }
  }

  for (let offset = 0; offset < updates.length; offset += 25) {
    const batch = updates.slice(offset, offset + 25);
    const results = await Promise.all(
      batch.map(({ id, row }) =>
        supabase
          .from('risiko_wilayah')
          .update(row)
          .eq('id', id)
      )
    );
    const failed = results.find((result) => result.error);
    if (failed) {
      throw new Error(`Gagal memperbarui tabel risiko_wilayah: ${failed.error.message}`);
    }
  }

  await insertBatches(supabase, 'risiko_wilayah', inserts);
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
