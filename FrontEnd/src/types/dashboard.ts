export type DashboardTab = 
  | "ringkasan" 
  | "verifikasi" 
  | "laporan"
  | "artikel"
  | "unggah"
  | "pengguna";

export type RiskLevel = "kritis" | "waspada" | "normal" | "tidak_tersedia";

export type VerificationStatus = "menunggu" | "terverifikasi" | "perlu_cek";

export type UserRole = "superadmin" | "operator";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: "operator";
  avatar_url?: string | null;
  status: "aktif" | "nonaktif";
  registeredAt: string;
  temporaryPassword?: string;
}

export interface PredictionItem {
  id: string;
  kodeKabupaten: string;
  namaKabupaten: string;
  provinsi: string;
  skorRisiko: number | null; // Skor model asli (0.00 - 1.00) atau null jika data tidak tersedia. Read-only.
  kategori: RiskLevel;
  faktorPenyebab?: string;
  statusVerifikasi: VerificationStatus;
  catatanOperator?: string;
  diverifikasiOleh?: string;
  terakhirDiperbarui: string;
}

export interface KnowledgeArticle {
  id: string;
  judul: string;
  isi: string;
  kategori: string;
  /** Optional cover image. Cards and read page adapt when absent. */
  thumbnailUrl?: string;
  /** Display name; defaults to Admin when omitted. */
  penulis?: string;
  diperbaruiPada: string;
}
