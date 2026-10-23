export type DashboardTab = 
  | "ringkasan" 
  | "verifikasi" 
  | "produksi" 
  | "intervensi" 
  | "peta";

export type RiskLevel = "kritis" | "waspada" | "normal";

export interface PredictionItem {
  id: string;
  kodeKabupaten: string;
  namaKabupaten: string;
  provinsi: string;
  skorRisiko: number; // 0.00 - 1.00
  kategori: RiskLevel;
  faparAnomaly: number; // e.g. -0.22
  curahHujanMm: number; // e.g. 45
  statusVerifikasi: "menunggu" | "tervalidasi" | "dikoreksi";
  catatanOperator?: string;
  skorOverride?: number;
  diverifikasiOleh?: string;
  terakhirDiperbarui: string;
}

export interface ProductionRecord {
  id: string;
  kodeKabupaten: string;
  namaKabupaten: string;
  komoditas: "Padi Sawah" | "Padi Gogo" | "Jagung" | "Kedelai";
  luasLahanHa: number;
  estimasiPanenTon: number;
  kondisiAir: "Cukup" | "Menipis" | "Defisit Kritis";
  tanggalLapor: string;
  petugasPelapor: string;
}

export interface InterventionItem {
  id: string;
  namaProgram: string;
  jenis: "Pompanisasi" | "Sumur Bor" | "Distribusi Benih Tahan Kering" | "Normalisasi Saluran Irigasi";
  kabupatenSasaran: string;
  targetUnitAtauHa: string;
  anggaranEst: string;
  status: "Direncanakan" | "Sedang Berjalan" | "Selesai";
  penanggungJawab: string;
  tanggalMulai: string;
  catatan?: string;
}
