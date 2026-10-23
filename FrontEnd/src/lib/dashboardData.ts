import type {
  KnowledgeArticle,
  PredictionItem,
  RiskLevel,
  VerificationStatus,
  ManagedUser,
} from "@/types/dashboard";

export const INITIAL_ARTICLES: KnowledgeArticle[] = [
  {
    id: "art-01",
    judul: "Protokol Mitigasi Wilayah Stres Vegetasi Tinggi pada Pertanian Padi Sawah",
    kategori: "Mitigasi Lapangan",
    isi: "Ketika anomali vegetasi FAPAR terdeteksi negatif secara persisten selama 30 hari, dinas pertanian kabupaten dan kelompok tani disarankan segera mengaktifkan jadwal gilir air irigasi, menyiapkan pompa mobile di titik aliran sungai permukaan, serta memprioritaskan pasokan air pada petak sawah yang berada pada fase bunting hingga pengisian bulir padi.",
    diperbaruiPada: "23 Okt 2026",
  },
  {
    id: "art-02",
    judul: "Panduan Membaca Sinyal Deviasi FAPAR bagi Petugas Penyuluh Lapangan (PPL)",
    kategori: "Panduan Teknis",
    isi: "FAPAR (Fraction of Absorbed Photosynthetically Active Radiation) mengukur proporsi radiasi matahari yang diserap oleh klorofil tanaman untuk fotosintesis. Nilai deviasi negatif mengindikasikan klorofil tanaman mengalami penurunan penyerapan energi, yang pada tanaman padi dan palawija merupakan sinyal awal kekurangan air sebelum kekeringan kasat mata terlihat.",
    diperbaruiPada: "22 Okt 2026",
  },
  {
    id: "art-03",
    judul: "Standar Operasional Prosedur (SOP) Verifikasi Lapangan Risiko Kekeringan",
    kategori: "SOP Verifikasi",
    isi: "Petugas pemeriksa lapangan wajib melakukan pengecekan visual pada tiga aspek utama: (1) ketinggian muka air pada saluran sekunder dan tersier, (2) tanda keretakan tanah pada petak sawah sampel, dan (3) gejala kelayuan daun pada sore hari. Hasil verifikasi dicatat ke dalam Pusat Verifikasi Mawas untuk menjadi rujukan laporan peringatan dini.",
    diperbaruiPada: "21 Okt 2026",
  },
  {
    id: "art-04",
    judul: "Strategi Distribusi Benih Tahan Kering untuk Antisipasi Musim Gadu",
    kategori: "Manajemen Pertanian",
    isi: "Bagi kabupaten dengan riwayat risiko kekeringan berulang, balai benih merekomendasikan varietas padi tahan kekeringan seperti Inpari 42 GSR atau varietas gogo lokal yang membutuhkan pasokan air lebih hemat dibandingkan varietas umum.",
    diperbaruiPada: "19 Okt 2026",
  },
];

export const INITIAL_PREDICTIONS: PredictionItem[] = [
  {
    id: "pred-1207",
    kodeKabupaten: "12.07",
    namaKabupaten: "Labuhanbatu",
    provinsi: "Sumatera Utara",
    skorRisiko: 0.88,
    kategori: "kritis",
    faktorPenyebab: "Anomali FAPAR negatif persisten (-0.34) dan curah hujan rendah 30 hari.",
    statusVerifikasi: "menunggu",
    terakhirDiperbarui: "23 Okt 2026, 09:30",
  },
  {
    id: "pred-1221",
    kodeKabupaten: "12.21",
    namaKabupaten: "Padang Lawas",
    provinsi: "Sumatera Utara",
    skorRisiko: 0.82,
    kategori: "kritis",
    faktorPenyebab: "Penurunan penyerapan vegetasi tajam pada area sawah tadah hujan.",
    statusVerifikasi: "menunggu",
    terakhirDiperbarui: "23 Okt 2026, 08:45",
  },
  {
    id: "pred-3212",
    kodeKabupaten: "32.12",
    namaKabupaten: "Indramayu",
    provinsi: "Jawa Barat",
    skorRisiko: 0.86,
    kategori: "kritis",
    faktorPenyebab: "Stres vegetasi meluas pada blok persawahan hilir Waduk Jatiluhur.",
    statusVerifikasi: "perlu_cek",
    catatanOperator: "Debit saluran sekunder menyusut 20%. Perlu koordinasi pintu air Bendung Rentang.",
    diverifikasiOleh: "PPL Indramayu",
    terakhirDiperbarui: "23 Okt 2026, 08:15",
  },
  {
    id: "pred-3315",
    kodeKabupaten: "33.15",
    namaKabupaten: "Grobogan",
    provinsi: "Jawa Tengah",
    skorRisiko: 0.79,
    kategori: "kritis",
    faktorPenyebab: "Defisit kelembaban tanah dan deviasi klorofil tinggi.",
    statusVerifikasi: "terverifikasi",
    catatanOperator: "Petani telah memulai gilir pompa dari Sungai Lusi untuk menyelamatkan 450 ha sawah.",
    diverifikasiOleh: "Distanbun Grobogan",
    terakhirDiperbarui: "22 Okt 2026, 16:30",
  },
  {
    id: "pred-3522",
    kodeKabupaten: "35.22",
    namaKabupaten: "Bojonegoro",
    provinsi: "Jawa Timur",
    skorRisiko: 0.74,
    kategori: "kritis",
    faktorPenyebab: "Curah hujan 30 hari di bawah persentil ke-15 normal.",
    statusVerifikasi: "menunggu",
    terakhirDiperbarui: "22 Okt 2026, 14:10",
  },
  {
    id: "pred-5312",
    kodeKabupaten: "53.12",
    namaKabupaten: "Sumba Barat",
    provinsi: "Nusa Tenggara Timur",
    skorRisiko: 0.71,
    kategori: "kritis",
    faktorPenyebab: "Kekeringan meteorologis berlanjut ke kekeringan vegetasi pertanian.",
    statusVerifikasi: "menunggu",
    terakhirDiperbarui: "22 Okt 2026, 11:20",
  },
  {
    id: "pred-1209",
    kodeKabupaten: "12.09",
    namaKabupaten: "Asahan",
    provinsi: "Sumatera Utara",
    skorRisiko: 0.58,
    kategori: "waspada",
    faktorPenyebab: "Fluktuasi kelembaban tanah pada vegetasi tanaman pangan.",
    statusVerifikasi: "terverifikasi",
    catatanOperator: "Irigasi teknis hilir beroperasi baik, stres vegetasi tidak berdampak pada sawah beririgasi.",
    diverifikasiOleh: "Operator Wilayah",
    terakhirDiperbarui: "22 Okt 2026, 16:10",
  },
  {
    id: "pred-3215",
    kodeKabupaten: "32.15",
    namaKabupaten: "Karawang",
    provinsi: "Jawa Barat",
    skorRisiko: 0.55,
    kategori: "waspada",
    faktorPenyebab: "Penurunan indeks fotosintesis lokal di zona sawah utara.",
    statusVerifikasi: "menunggu",
    terakhirDiperbarui: "22 Okt 2026, 10:00",
  },
  {
    id: "pred-1205",
    kodeKabupaten: "12.05",
    namaKabupaten: "Langkat",
    provinsi: "Sumatera Utara",
    skorRisiko: 0.52,
    kategori: "waspada",
    faktorPenyebab: "Curah hujan 30 hari mendekati batas normal bawah.",
    statusVerifikasi: "terverifikasi",
    catatanOperator: "Debit saluran primer terpantau aman, PPL terus memonitor saluran sekunder.",
    diverifikasiOleh: "Operator Wilayah",
    terakhirDiperbarui: "22 Okt 2026, 14:20",
  },
  {
    id: "pred-1206",
    kodeKabupaten: "12.06",
    namaKabupaten: "Karo",
    provinsi: "Sumatera Utara",
    skorRisiko: 0.46,
    kategori: "waspada",
    faktorPenyebab: "Penurunan penyerapan vegetasi minor pada lahan hortikultura dataran tinggi.",
    statusVerifikasi: "menunggu",
    terakhirDiperbarui: "23 Okt 2026, 07:15",
  },
  {
    id: "pred-1204",
    kodeKabupaten: "12.04",
    namaKabupaten: "Deli Serdang",
    provinsi: "Sumatera Utara",
    skorRisiko: 0.28,
    kategori: "normal",
    faktorPenyebab: "Indeks penyerapan fotosintesis optimal dan ketersediaan air mencukupi.",
    statusVerifikasi: "terverifikasi",
    terakhirDiperbarui: "20 Okt 2026, 15:00",
  },
  {
    id: "pred-1218",
    kodeKabupaten: "12.18",
    namaKabupaten: "Serdang Bedagai",
    provinsi: "Sumatera Utara",
    skorRisiko: 0.25,
    kategori: "normal",
    faktorPenyebab: "Kondisi vegetasi normal didukung sistem irigasi teknis Sei Ular.",
    statusVerifikasi: "terverifikasi",
    terakhirDiperbarui: "20 Okt 2026, 10:30",
  },
  {
    id: "pred-9101",
    kodeKabupaten: "91.01",
    namaKabupaten: "Merauke",
    provinsi: "Papua Selatan",
    skorRisiko: null,
    kategori: "tidak_tersedia",
    faktorPenyebab: "Data satelit CHIRPS/CHIRTS belum tersedia di wilayah pemekaran.",
    statusVerifikasi: "menunggu",
    terakhirDiperbarui: "20 Okt 2026, 09:00",
  },
];

const PREDS_KEY = "mawas_dashboard_predictions_v2";
const ARTICLES_KEY = "mawas_dashboard_articles_v2";
const MODEL_META_KEY = "mawas_dashboard_model_meta_v2";

export interface ModelMetadata {
  dihasilkanPada: string;
  tanggalAcuan: string;
  horizonHari: number;
  totalKabupaten: number;
  statusData: string;
  catatan?: string;
}

export const DEFAULT_MODEL_META: ModelMetadata = {
  dihasilkanPada: "2026-10-22T15:18:52Z",
  tanggalAcuan: "2026-09-11",
  horizonHari: 30,
  totalKabupaten: 514,
  statusData: "model",
  catatan: "Output model Mawas (aturan deviasi FAPAR + konteks hujan BMKG).",
};

export function getDashboardModelMeta(): ModelMetadata {
  if (typeof window === "undefined") return DEFAULT_MODEL_META;
  try {
    const raw = localStorage.getItem(MODEL_META_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_MODEL_META;
  } catch {
    return DEFAULT_MODEL_META;
  }
}

export function saveDashboardModelMeta(meta: ModelMetadata) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MODEL_META_KEY, JSON.stringify(meta));
}

export function getDashboardPredictions(): PredictionItem[] {
  if (typeof window === "undefined") return INITIAL_PREDICTIONS;
  try {
    const raw = localStorage.getItem(PREDS_KEY);
    if (!raw) return INITIAL_PREDICTIONS;
    const parsed = JSON.parse(raw) as PredictionItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_PREDICTIONS;
    return parsed.map((item) => ({
      ...item,
      statusVerifikasi: (["menunggu", "terverifikasi", "perlu_cek"].includes(item.statusVerifikasi)
        ? item.statusVerifikasi
        : "menunggu") as VerificationStatus,
    }));
  } catch {
    return INITIAL_PREDICTIONS;
  }
}

export function saveDashboardPredictions(data: PredictionItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREDS_KEY, JSON.stringify(data));
}

export function getDashboardArticles(): KnowledgeArticle[] {
  if (typeof window === "undefined") return INITIAL_ARTICLES;
  try {
    const raw = localStorage.getItem(ARTICLES_KEY);
    if (!raw) return INITIAL_ARTICLES;
    const parsed = JSON.parse(raw) as KnowledgeArticle[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ARTICLES;
  } catch {
    return INITIAL_ARTICLES;
  }
}

export function saveDashboardArticles(data: KnowledgeArticle[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ARTICLES_KEY, JSON.stringify(data));
}

export const INITIAL_USERS: ManagedUser[] = [
  {
    id: "usr-admin-01",
    name: "Super Administrator",
    email: "admin@mawas.id",
    role: "admin",
    status: "aktif",
    registeredAt: "10 Okt 2026",
  },
  {
    id: "usr-op-01",
    name: "Ahmad Fauzi (PPL)",
    email: "operator.sumut@mawas.id",
    role: "operator",
    status: "aktif",
    registeredAt: "14 Okt 2026",
    temporaryPassword: "Mawas#Sumut2026",
  },
  {
    id: "usr-op-02",
    name: "Dewi Lestari (Mantri Tani)",
    email: "operator.jabar@mawas.id",
    role: "operator",
    status: "aktif",
    registeredAt: "18 Okt 2026",
    temporaryPassword: "Mawas#Jabar2026",
  },
  {
    id: "usr-pk-01",
    name: "Dr. Hendra Wijaya (Distan)",
    email: "kebijakan@pertanian.go.id",
    role: "pembuat_kebijakan",
    status: "aktif",
    registeredAt: "20 Okt 2026",
    temporaryPassword: "Mawas#Policy2026",
  },
];

const USERS_KEY = "mawas_dashboard_users_v2";

export function getDashboardUsers(): ManagedUser[] {
  if (typeof window === "undefined") return INITIAL_USERS;
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return INITIAL_USERS;
    const parsed = JSON.parse(raw) as ManagedUser[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
}

export function saveDashboardUsers(data: ManagedUser[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_KEY, JSON.stringify(data));
}

/**
 * Format raw model output JSON (from ML service) into dashboard predictions
 */
export function parseModelJsonToPredictions(
  jsonObj: any,
  existingVerificationMap: Map<string, { status: VerificationStatus; catatan?: string; diverifikasiOleh?: string }> = new Map()
): { predictions: PredictionItem[]; metadata: ModelMetadata } {
  const dataList: any[] = Array.isArray(jsonObj)
    ? jsonObj
    : Array.isArray(jsonObj?.data)
      ? jsonObj.data
      : [];

  if (dataList.length === 0) {
    throw new Error("File JSON tidak memuat array data kabupaten yang valid.");
  }

  const metadata: ModelMetadata = {
    dihasilkanPada: jsonObj?.dihasilkan_pada || new Date().toISOString(),
    tanggalAcuan: jsonObj?.tanggal_acuan || "2026-09-11",
    horizonHari: Number(jsonObj?.horizon_hari) || 30,
    totalKabupaten: dataList.length,
    statusData: jsonObj?.status_data || "model",
    catatan: jsonObj?.catatan,
  };

  const predictions: PredictionItem[] = dataList.map((item, idx) => {
    const kode = String(item.kode_kabupaten || `KAB-${idx + 1}`);
    const existing = existingVerificationMap.get(kode);
    const rawKategori = String(item.kategori || "").toLowerCase();
    
    let kategori: RiskLevel = "normal";
    if (rawKategori === "tinggi" || rawKategori === "kritis") {
      kategori = "kritis";
    } else if (rawKategori === "sedang" || rawKategori === "waspada") {
      kategori = "waspada";
    } else if (rawKategori === "rendah" || rawKategori === "normal") {
      kategori = "normal";
    } else if (rawKategori.includes("tidak") || item.skor_risiko === null) {
      kategori = "tidak_tersedia";
    }

    const skor = typeof item.skor_risiko === "number" ? Number(item.skor_risiko) : null;

    return {
      id: `pred-${kode.replace(/[^a-zA-Z0-9]/g, "-")}`,
      kodeKabupaten: kode,
      namaKabupaten: item.nama_kabupaten || `Kabupaten ${kode}`,
      provinsi: item.provinsi || "Wilayah Indonesia",
      skorRisiko: skor,
      kategori,
      faktorPenyebab: item.faktor_penyebab || (kategori === "kritis" ? "Anomali defisit vegetasi tinggi." : undefined),
      statusVerifikasi: existing?.status || "menunggu",
      catatanOperator: existing?.catatan,
      diverifikasiOleh: existing?.diverifikasiOleh,
      terakhirDiperbarui: item.dihasilkan_pada 
        ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.dihasilkan_pada))
        : "Terbaru",
    };
  });

  return { predictions, metadata };
}
