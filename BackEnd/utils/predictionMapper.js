const mapRiskCategory = (value, score) => {
  const category = String(value || '').toLowerCase().trim();

  if (score === null || category.includes('tidak tersedia')) return 'tidak_tersedia';
  if (['tinggi', 'kritis'].includes(category)) return 'kritis';
  if (['sedang', 'waspada'].includes(category)) return 'waspada';
  if (['rendah', 'normal'].includes(category)) return 'normal';

  return 'normal';
};

const mapVerificationStatus = (value) => {
  const status = String(value || '').toLowerCase().trim();

  if (['terverifikasi', 'tervalidasi'].includes(status)) return 'terverifikasi';
  if (['perlu_cek', 'perlu cek', 'dikoreksi operator'].includes(status)) return 'perlu_cek';

  return 'menunggu';
};

const mapDatabaseRiskCategory = (value, score) => {
  const category = mapRiskCategory(value, score);
  const categories = {
    kritis: 'kritis',
    waspada: 'waspada',
    normal: 'normal',
    tidak_tersedia: 'tidak_tersedia',
  };

  return categories[category];
};

const mapDatabaseVerificationStatus = (value) => {
  const statuses = {
    menunggu: 'menunggu',
    terverifikasi: 'terverifikasi',
    perlu_cek: 'perlu_cek',
  };
  const status = mapVerificationStatus(value);

  return statuses[status];
};

const formatFactors = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).join('; ');
  return value || undefined;
};

const toDashboardPrediction = (risk, kabupaten = {}, verification = null) => {
  const score = risk.skor_risiko === null || risk.skor_risiko === undefined
    ? null
    : Number(risk.skor_risiko);
  const code = String(risk.kode_kabupaten || '');

  return {
    id: String(risk.id || `pred-${code.replace(/[^a-zA-Z0-9]/g, '-')}`),
    kodeKabupaten: code,
    namaKabupaten: risk.nama_kabupaten || kabupaten.nama_kabupaten || `Kabupaten ${code}`,
    provinsi: risk.provinsi || kabupaten.provinsi || 'Wilayah Indonesia',
    skorRisiko: score,
    kategori: mapRiskCategory(risk.kategori, score),
    faktorPenyebab: formatFactors(risk.faktor_penyebab),
    tanggal: risk.tanggal,
    horizonHari: Number(risk.horizon_hari) || 30,
    statusData: risk.status_data || 'model',
    statusVerifikasi: mapVerificationStatus(verification?.status_verifikasi),
    catatanOperator: verification?.catatan_operator || undefined,
    diverifikasiOleh: verification?.diverifikasi_oleh || undefined,
    terakhirDiperbarui: verification?.terakhir_diperbarui ||
      risk.dihasilkan_pada ||
      risk.tanggal ||
      '',
  };
};

module.exports = {
  mapDatabaseRiskCategory,
  mapDatabaseVerificationStatus,
  mapRiskCategory,
  mapVerificationStatus,
  toDashboardPrediction,
};
