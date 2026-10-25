const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { importPredictions } = require('../services/riskImportService');
const { mapRiskCategory, mapVerificationStatus } = require('../utils/predictionMapper');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY
);
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const joinKabupaten = (risks, kabupatenRows) => {
  const kabupatenByCode = new Map(
    (kabupatenRows || []).map((row) => [row.kode_kabupaten, row])
  );

  return (risks || []).map((risk) => {
    const kabupaten = kabupatenByCode.get(risk.kode_kabupaten) || {};
    return {
      ...risk,
      nama_kabupaten: risk.nama_kabupaten || kabupaten.nama_kabupaten,
      provinsi: risk.provinsi || kabupaten.provinsi,
      id_fe: risk.id_fe || kabupaten.id_fe,
      kabupaten,
    };
  });
};

exports.seedRisikoData = async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi pada Backend.' });
    }
    const filePath = path.resolve(
      __dirname,
      '../../ml-service/output_model/risiko_kabupaten_terbaru.json'
    );
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File risiko_kabupaten_terbaru.json tidak ditemukan.' });
    }

    const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const result = await importPredictions(supabaseAdmin, payload);
    return res.status(201).json({
      status: 'success',
      message: `Berhasil memperbarui ${result.total} prediksi risiko.`,
      total: result.total,
      metadata: result.metadata,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.importRisiko = async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi pada Backend.' });
    }
    const result = await importPredictions(supabaseAdmin, req.body);
    return res.status(200).json({
      status: 'success',
      message: 'Data prediksi berhasil diperbarui.',
      total: result.total,
      metadata: result.metadata,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

exports.getAllRisiko = async (req, res) => {
  try {
    const risks = [];
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase
        .from('risiko_wilayah')
        .select('*')
        .order('tanggal', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) return res.status(400).json({ error: error.message });
      risks.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }

    const codes = Array.from(new Set(risks.map((item) => item.kode_kabupaten)));
    if (codes.length === 0) {
      return res.status(200).json({ status: 'success', total: 0, data: [] });
    }

    const kabupatenBatches = [];
    for (let offset = 0; offset < codes.length; offset += 200) {
      kabupatenBatches.push(codes.slice(offset, offset + 200));
    }
    const kabupatenResults = await Promise.all(
      kabupatenBatches.map((batch) =>
        supabase
          .from('kabupaten')
          .select('kode_kabupaten,nama_kabupaten,provinsi,id_fe')
          .in('kode_kabupaten', batch)
      )
    );
    const kabupatenError = kabupatenResults.find((result) => result.error)?.error;
    if (kabupatenError) return res.status(400).json({ error: kabupatenError.message });
    const kabupaten = kabupatenResults.flatMap((result) => result.data || []);

    const data = joinKabupaten(risks, kabupaten);
    return res.status(200).json({ status: 'success', total: data.length, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getRisikoByKode = async (req, res) => {
  try {
    const { kode } = req.params;
    const { data: risks, error: riskError } = await supabase
      .from('risiko_wilayah')
      .select('*')
      .eq('kode_kabupaten', kode)
      .order('tanggal', { ascending: false })
      .order('horizon_hari', { ascending: false })
      .limit(1);

    if (riskError) return res.status(400).json({ error: riskError.message });
    if (!risks || risks.length === 0) {
      return res.status(404).json({ error: 'Data risiko kabupaten tidak ditemukan.' });
    }

    const { data: kabupaten, error: kabupatenError } = await supabase
      .from('kabupaten')
      .select('kode_kabupaten,nama_kabupaten,provinsi,id_fe')
      .eq('kode_kabupaten', kode)
      .maybeSingle();

    if (kabupatenError) return res.status(400).json({ error: kabupatenError.message });

    return res.status(200).json({
      status: 'success',
      data: joinKabupaten(risks, kabupaten ? [kabupaten] : [])[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getDashboardSummary = async (req, res) => {
  try {
    const [
      { data: riskRows, error: riskError },
      { data: verificationRows, error: verificationError },
    ] = await Promise.all([
      supabase
        .from('risiko_wilayah')
        .select('kode_kabupaten,kategori')
        .order('tanggal', { ascending: false }),
      supabase.from('verifikasi_risiko').select('status_verifikasi'),
    ]);

    if (riskError) throw riskError;
    if (verificationError) throw verificationError;

    const latestCategoryByCode = new Map();
    for (const row of riskRows || []) {
      if (!latestCategoryByCode.has(row.kode_kabupaten)) {
        latestCategoryByCode.set(row.kode_kabupaten, row.kategori);
      }
    }
    const categories = Array.from(latestCategoryByCode.values());
    const statuses = (verificationRows || []).map((row) =>
      mapVerificationStatus(row.status_verifikasi)
    );

    return res.status(200).json({
      status: 'success',
      data: {
        wilayah_pantauan: categories.length,
        kategori_kritis: categories.filter((value) => mapRiskCategory(value) === 'kritis').length,
        menunggu_verifikasi: statuses.filter((value) => value === 'menunggu').length,
        intervensi_berjalan: 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getTrenNasional = async (req, res) => {
  try {
    const requestedProvince = String(req.query.provinsi || '').trim();
    const riskRows = [];
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase
        .from('risiko_wilayah')
        .select('kode_kabupaten,tanggal,horizon_hari,skor_risiko,kategori,dihasilkan_pada')
        .order('tanggal', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) return res.status(400).json({ error: error.message });
      riskRows.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }

    const codes = Array.from(new Set(riskRows.map((row) => row.kode_kabupaten)));
    const kabupatenRows = [];
    for (let offset = 0; offset < codes.length; offset += 200) {
      const { data, error } = await supabase
        .from('kabupaten')
        .select('kode_kabupaten,provinsi')
        .in('kode_kabupaten', codes.slice(offset, offset + 200));
      if (error) return res.status(400).json({ error: error.message });
      kabupatenRows.push(...(data || []));
    }

    const provincesByCode = new Map(
      kabupatenRows.map((row) => [row.kode_kabupaten, row.provinsi])
    );
    const scopedRows = requestedProvince
      ? riskRows.filter((row) =>
        String(provincesByCode.get(row.kode_kabupaten) || '').toLowerCase() === requestedProvince.toLowerCase()
      )
      : riskRows;

    const snapshotByCodeAndDate = new Map();
    for (const row of scopedRows) {
      const key = `${row.kode_kabupaten}|${row.tanggal}`;
      const current = snapshotByCodeAndDate.get(key);
      if (
        !current ||
        Number(row.horizon_hari || 0) > Number(current.horizon_hari || 0) ||
        (row.horizon_hari === current.horizon_hari &&
          String(row.dihasilkan_pada || '') > String(current.dihasilkan_pada || ''))
      ) {
        snapshotByCodeAndDate.set(key, row);
      }
    }

    const latestByCode = new Map();
    for (const row of snapshotByCodeAndDate.values()) {
      const current = latestByCode.get(row.kode_kabupaten);
      if (!current || row.tanggal > current.tanggal) latestByCode.set(row.kode_kabupaten, row);
    }
    const currentRows = Array.from(latestByCode.values());
    const distribution = {
      kritis: 0,
      waspada: 0,
      normal: 0,
      tidak_tersedia: 0,
    };
    for (const row of currentRows) {
      const category = mapRiskCategory(
        row.kategori,
        row.skor_risiko === null ? null : Number(row.skor_risiko)
      );
      distribution[category] += 1;
    }

    const rowsByDate = new Map();
    for (const row of snapshotByCodeAndDate.values()) {
      const dateStats = rowsByDate.get(row.tanggal) || { scores: [], withoutScore: 0 };
      const score = row.skor_risiko === null ? null : Number(row.skor_risiko);
      if (score === null || !Number.isFinite(score)) {
        dateStats.withoutScore += 1;
      } else {
        dateStats.scores.push(score);
      }
      rowsByDate.set(row.tanggal, dateStats);
    }
    const trend = Array.from(rowsByDate.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .slice(-8)
      .flatMap(([tanggal, { scores, withoutScore }]) => {
        if (scores.length === 0) return [];
        return [{
          tanggal,
          skor: Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(4)),
          jumlah_wilayah: scores.length,
          jumlah_tanpa_skor: withoutScore,
        }];
      });
    const validScores = currentRows
      .map((row) => row.skor_risiko === null ? null : Number(row.skor_risiko))
      .filter((score) => score !== null && Number.isFinite(score));
    const average = validScores.length
      ? Number((validScores.reduce((sum, score) => sum + score, 0) / validScores.length).toFixed(4))
      : null;

    return res.status(200).json({
      status: 'success',
      data: {
        wilayah: requestedProvince || 'Nasional',
        tanggal_terakhir: currentRows.reduce(
          (latest, row) => row.tanggal > (latest || '') ? row.tanggal : latest,
          null
        ),
        total_wilayah: currentRows.length,
        wilayah_dengan_skor: validScores.length,
        wilayah_tanpa_skor: currentRows.length - validScores.length,
        rata_rata_skor: average,
        distribusi: distribution,
        trend,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
