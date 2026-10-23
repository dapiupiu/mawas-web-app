const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const {
  mapDatabaseVerificationStatus,
  mapRiskCategory,
  mapVerificationStatus,
  toDashboardPrediction,
} = require('../utils/predictionMapper');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY
);

const makeRiskKey = (row) =>
  `${row.kode_kabupaten}|${row.tanggal}|${Number(row.horizon_hari) || 30}`;

const findKabupaten = async (kodeKabupaten) => {
  const { data, error } = await supabase
    .from('kabupaten')
    .select('kode_kabupaten,nama_kabupaten,provinsi')
    .eq('kode_kabupaten', kodeKabupaten)
    .maybeSingle();

  if (error) throw error;
  return data || {};
};

// Mengembalikan prediksi terbaru per kabupaten beserta verifikasinya.
exports.getTugasVerifikasi = async (req, res) => {
  try {
    const { status, kategori } = req.query;
    const { data: riskRows, error: riskError } = await supabase
      .from('risiko_wilayah')
      .select('*')
      .order('tanggal', { ascending: false })
      .order('horizon_hari', { ascending: false });

    if (riskError) return res.status(400).json({ error: riskError.message });

    const latestByCode = new Map();
    for (const row of riskRows || []) {
      if (!latestByCode.has(row.kode_kabupaten)) {
        latestByCode.set(row.kode_kabupaten, row);
      }
    }

    const latestRisks = Array.from(latestByCode.values());
    const codes = latestRisks.map((row) => row.kode_kabupaten);
    if (codes.length === 0) {
      return res.status(200).json({ status: 'success', total: 0, data: [] });
    }

    const [{ data: kabupatenRows, error: kabupatenError }, { data: verifRows, error: verifError }] =
      await Promise.all([
        supabase
          .from('kabupaten')
          .select('kode_kabupaten,nama_kabupaten,provinsi')
          .in('kode_kabupaten', codes),
        supabase
          .from('verifikasi_risiko')
          .select('*')
          .in('kode_kabupaten', codes)
          .order('terakhir_diperbarui', { ascending: false }),
      ]);

    if (kabupatenError) return res.status(400).json({ error: kabupatenError.message });
    if (verifError) return res.status(400).json({ error: verifError.message });

    const kabupatenByCode = new Map(
      (kabupatenRows || []).map((row) => [row.kode_kabupaten, row])
    );
    const verifByRisk = new Map();
    for (const row of verifRows || []) {
      const key = makeRiskKey(row);
      if (!verifByRisk.has(key)) verifByRisk.set(key, row);
    }

    let data = latestRisks.map((risk) =>
      toDashboardPrediction(
        risk,
        kabupatenByCode.get(risk.kode_kabupaten),
        verifByRisk.get(makeRiskKey(risk))
      )
    );

    if (status) {
      const normalizedStatus = mapVerificationStatus(status);
      data = data.filter((item) => item.statusVerifikasi === normalizedStatus);
    }
    if (kategori) {
      const normalizedCategory = mapRiskCategory(kategori);
      data = data.filter((item) => item.kategori === normalizedCategory);
    }

    return res.status(200).json({
      status: 'success',
      total: data.length,
      data,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Simpan status/catatan lapangan untuk prediksi terbaru tanpa mengubah skor model.
exports.submitVerifikasi = async (req, res) => {
  try {
    const {
      kode_kabupaten,
      kodeKabupaten,
      tanggal,
      horizon_hari,
      status_verifikasi,
      statusVerifikasi,
      catatan_operator,
      catatanOperator,
      diverifikasi_oleh,
      diverifikasiOleh,
    } = req.body;

    const code = String(kode_kabupaten || kodeKabupaten || '').trim();
    const requestedStatus = status_verifikasi || statusVerifikasi;
    const normalizedStatus = mapVerificationStatus(requestedStatus);
    const acceptedStatuses = [
      'menunggu',
      'menunggu review',
      'terverifikasi',
      'tervalidasi',
      'perlu_cek',
      'perlu cek',
      'dikoreksi operator',
    ];

    if (
      !code ||
      !requestedStatus ||
      !acceptedStatuses.includes(String(requestedStatus).toLowerCase().trim())
    ) {
      return res.status(400).json({
        error: 'kode_kabupaten dan status_verifikasi (menunggu, terverifikasi, atau perlu_cek) wajib diisi.',
      });
    }

    let riskQuery = supabase
      .from('risiko_wilayah')
      .select('*')
      .eq('kode_kabupaten', code);

    if (tanggal) riskQuery = riskQuery.eq('tanggal', tanggal);
    if (horizon_hari !== undefined) riskQuery = riskQuery.eq('horizon_hari', horizon_hari);

    const { data: risk, error: riskError } = await riskQuery
      .order('tanggal', { ascending: false })
      .order('horizon_hari', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (riskError) return res.status(400).json({ error: riskError.message });
    if (!risk) return res.status(404).json({ error: 'Prediksi risiko kabupaten tidak ditemukan.' });

    const verification = {
      kode_kabupaten: code,
      tanggal: risk.tanggal,
      horizon_hari: Number(risk.horizon_hari) || 30,
      status_verifikasi: mapDatabaseVerificationStatus(normalizedStatus),
      catatan_operator: String(catatan_operator ?? catatanOperator ?? '').trim(),
      diverifikasi_oleh: String(
        diverifikasi_oleh || diverifikasiOleh || req.user?.email || 'Operator'
      ).trim(),
      diverifikasi_user_id: req.user?.id || null,
      terakhir_diperbarui: new Date().toISOString(),
    };

    const { data: savedRows, error: saveError } = await supabase
      .from('verifikasi_risiko')
      .upsert(verification, {
        onConflict: 'kode_kabupaten,tanggal,horizon_hari',
      })
      .select();

    if (saveError) return res.status(400).json({ error: saveError.message });

    const kabupaten = await findKabupaten(code);
    const data = toDashboardPrediction(risk, kabupaten, savedRows?.[0] || verification);

    return res.status(200).json({
      status: 'success',
      message: 'Hasil verifikasi berhasil disimpan.',
      data,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
