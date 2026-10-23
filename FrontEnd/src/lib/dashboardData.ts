import type { PredictionItem, ProductionRecord, InterventionItem } from "@/types/dashboard";

export const INITIAL_PREDICTIONS: PredictionItem[] = [
  {
    id: "pred-01",
    kodeKabupaten: "12.07",
    namaKabupaten: "Labuhanbatu",
    provinsi: "Sumatera Utara",
    skorRisiko: 0.78,
    kategori: "kritis",
    faparAnomaly: -0.34,
    curahHujanMm: 28,
    statusVerifikasi: "menunggu",
    terakhirDiperbarui: "23 Okt 2026, 09:30",
  },
  {
    id: "pred-02",
    kodeKabupaten: "12.21",
    namaKabupaten: "Padang Lawas",
    provinsi: "Sumatera Utara",
    skorRisiko: 0.72,
    kategori: "kritis",
    faparAnomaly: -0.29,
    curahHujanMm: 35,
    statusVerifikasi: "menunggu",
    terakhirDiperbarui: "23 Okt 2026, 08:45",
  },
  {
    id: "pred-03",
    kodeKabupaten: "12.09",
    namaKabupaten: "Asahan",
    provinsi: "Sumatera Utara",
    skorRisiko: 0.68,
    kategori: "kritis",
    faparAnomaly: -0.26,
    curahHujanMm: 42,
    statusVerifikasi: "dikoreksi",
    skorOverride: 0.49,
    catatanOperator: "Irigasi teknis hilir beroperasi baik, stres vegetasi tidak berdampak pada sawah beririgasi.",
    diverifikasiOleh: "Operator Lapangan",
    terakhirDiperbarui: "22 Okt 2026, 16:10",
  },
  {
    id: "pred-04",
    kodeKabupaten: "12.05",
    namaKabupaten: "Langkat",
    provinsi: "Sumatera Utara",
    skorRisiko: 0.54,
    kategori: "waspada",
    faparAnomaly: -0.18,
    curahHujanMm: 58,
    statusVerifikasi: "tervalidasi",
    catatanOperator: "Sesuai laporan PPL, debit saluran primer mulai menurun 15%.",
    diverifikasiOleh: "Operator Lapangan",
    terakhirDiperbarui: "22 Okt 2026, 14:20",
  },
  {
    id: "pred-05",
    kodeKabupaten: "12.06",
    namaKabupaten: "Karo",
    provinsi: "Sumatera Utara",
    skorRisiko: 0.46,
    kategori: "waspada",
    faparAnomaly: -0.15,
    curahHujanMm: 65,
    statusVerifikasi: "menunggu",
    terakhirDiperbarui: "23 Okt 2026, 07:15",
  },
  {
    id: "pred-06",
    kodeKabupaten: "12.08",
    namaKabupaten: "Simalungun",
    provinsi: "Sumatera Utara",
    skorRisiko: 0.42,
    kategori: "waspada",
    faparAnomaly: -0.12,
    curahHujanMm: 72,
    statusVerifikasi: "tervalidasi",
    catatanOperator: "Tanaman jagung fase vegetatif aman, kelembaban tanah mencukupi.",
    diverifikasiOleh: "Operator Lapangan",
    terakhirDiperbarui: "21 Okt 2026, 11:00",
  },
  {
    id: "pred-07",
    kodeKabupaten: "12.04",
    namaKabupaten: "Deli Serdang",
    provinsi: "Sumatera Utara",
    skorRisiko: 0.28,
    kategori: "normal",
    faparAnomaly: 0.05,
    curahHujanMm: 110,
    statusVerifikasi: "tervalidasi",
    terakhirDiperbarui: "20 Okt 2026, 15:00",
  },
  {
    id: "pred-08",
    kodeKabupaten: "12.18",
    namaKabupaten: "Serdang Bedagai",
    provinsi: "Sumatera Utara",
    skorRisiko: 0.25,
    kategori: "normal",
    faparAnomaly: 0.08,
    curahHujanMm: 125,
    statusVerifikasi: "tervalidasi",
    terakhirDiperbarui: "20 Okt 2026, 10:30",
  },
];

export const INITIAL_PRODUCTIONS: ProductionRecord[] = [
  {
    id: "prod-01",
    kodeKabupaten: "12.04",
    namaKabupaten: "Deli Serdang",
    komoditas: "Padi Sawah",
    luasLahanHa: 1450,
    estimasiPanenTon: 8700,
    kondisiAir: "Cukup",
    tanggalLapor: "2026-10-22",
    petugasPelapor: "Bambang Sudirjo (PPL Kec. Percut)",
  },
  {
    id: "prod-02",
    kodeKabupaten: "12.18",
    namaKabupaten: "Serdang Bedagai",
    komoditas: "Padi Sawah",
    luasLahanHa: 2100,
    estimasiPanenTon: 13230,
    kondisiAir: "Cukup",
    tanggalLapor: "2026-10-21",
    petugasPelapor: "Siti Rahmawati (Mantri Tani Sei Rampah)",
  },
  {
    id: "prod-03",
    kodeKabupaten: "12.07",
    namaKabupaten: "Labuhanbatu",
    komoditas: "Padi Sawah",
    luasLahanHa: 980,
    estimasiPanenTon: 4410,
    kondisiAir: "Defisit Kritis",
    tanggalLapor: "2026-10-23",
    petugasPelapor: "Hasanuddin (PPL Panai Hilir)",
  },
  {
    id: "prod-04",
    kodeKabupaten: "12.06",
    namaKabupaten: "Karo",
    komoditas: "Jagung",
    luasLahanHa: 1850,
    estimasiPanenTon: 11100,
    kondisiAir: "Menipis",
    tanggalLapor: "2026-10-20",
    petugasPelapor: "Terang Tarigan (Distan Karo)",
  },
];

export const INITIAL_INTERVENTIONS: InterventionItem[] = [
  {
    id: "int-01",
    namaProgram: "Penyediaan Pompa Air Mobile 6 Inci",
    jenis: "Pompanisasi",
    kabupatenSasaran: "Labuhanbatu",
    targetUnitAtauHa: "12 Unit Pompa (Cakupan 350 Ha)",
    anggaranEst: "Rp 180.000.000",
    status: "Sedang Berjalan",
    penanggungJawab: "Dinas Pertanian Labuhanbatu & Kodim 0209",
    tanggalMulai: "2026-10-18",
    catatan: "Fokus pompanisasi dari aliran Sungai Barumun ke sawah tadah hujan.",
  },
  {
    id: "int-02",
    namaProgram: "Bantuan Benih Padi Tahan Kering (Inpari 42 GSR)",
    jenis: "Distribusi Benih Tahan Kering",
    kabupatenSasaran: "Padang Lawas",
    targetUnitAtauHa: "25 Ton Benih (1.000 Ha)",
    anggaranEst: "Rp 325.000.000",
    status: "Direncanakan",
    penanggungJawab: "Balai Penerapan Standar Instrumen Pertanian (BPSIP)",
    tanggalMulai: "2026-10-28",
    catatan: "Dipersiapkan untuk musim tanam gadu di wilayah rawan kekeringan.",
  },
  {
    id: "int-03",
    namaProgram: "Rehabilitasi Pintu Air Primer Sei Ular",
    jenis: "Normalisasi Saluran Irigasi",
    kabupatenSasaran: "Serdang Bedagai",
    targetUnitAtauHa: "4 Pintu Air (Cakupan 1.200 Ha)",
    anggaranEst: "Rp 450.000.000",
    status: "Selesai",
    penanggungJawab: "BWS Sumatera II & Dinas PUPR Prov. Sumut",
    tanggalMulai: "2026-09-15",
    catatan: "Pekerjaan selesai 100%, debit air kembali optimal ke persawahan hilir.",
  },
];

const PREDS_KEY = "mawas_dashboard_predictions";
const PRODS_KEY = "mawas_dashboard_productions";
const INTS_KEY = "mawas_dashboard_interventions";

export function getDashboardPredictions(): PredictionItem[] {
  if (typeof window === "undefined") return INITIAL_PREDICTIONS;
  try {
    const raw = localStorage.getItem(PREDS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_PREDICTIONS;
  } catch {
    return INITIAL_PREDICTIONS;
  }
}

export function saveDashboardPredictions(data: PredictionItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREDS_KEY, JSON.stringify(data));
}

export function getDashboardProductions(): ProductionRecord[] {
  if (typeof window === "undefined") return INITIAL_PRODUCTIONS;
  try {
    const raw = localStorage.getItem(PRODS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_PRODUCTIONS;
  } catch {
    return INITIAL_PRODUCTIONS;
  }
}

export function saveDashboardProductions(data: ProductionRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRODS_KEY, JSON.stringify(data));
}

export function getDashboardInterventions(): InterventionItem[] {
  if (typeof window === "undefined") return INITIAL_INTERVENTIONS;
  try {
    const raw = localStorage.getItem(INTS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_INTERVENTIONS;
  } catch {
    return INITIAL_INTERVENTIONS;
  }
}

export function saveDashboardInterventions(data: InterventionItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(INTS_KEY, JSON.stringify(data));
}
