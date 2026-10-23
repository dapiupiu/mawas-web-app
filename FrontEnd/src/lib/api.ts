import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000"

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
})

// Attach token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mawas_token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Tangani respon jika middleware backend menolak token (401 / 403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("mawas_token") : null
      if (token && token.startsWith("mock_dev_")) {
        return Promise.reject(error)
      }
      authApi.logout()
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")) {
        window.location.href = "/signin"
      }
    }
    return Promise.reject(error)
  },
)

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoredUser {
  id: string
  email: string
  role?: string
  username?: string
  name?: string
}

export interface RisikoItem {
  kode_kabupaten: string
  nama_kabupaten: string
  provinsi?: string
  tanggal?: string
  horizon_hari?: number
  skor_risiko: number | null
  kategori: "rendah" | "sedang" | "tinggi" | "data tidak tersedia" | string
  faktor_penyebab?: string | string[]
  dihasilkan_pada?: string
  status_data: "contoh" | "model" | "real" | string
  punya_data_cuaca?: boolean
  id_fe?: string
  frac_valid?: number
  n_valid?: number
  n_piksel?: number
  rfq?: number
  r1q?: number
  r3q?: number
}

export interface RiskTrendResponse {
  wilayah: string
  tanggal_terakhir: string | null
  total_wilayah: number
  rata_rata_skor: number | null
  distribusi: {
    kritis: number
    waspada: number
    normal: number
    tidak_tersedia: number
  }
  trend: Array<{
    tanggal: string
    skor: number
    jumlah_wilayah: number
  }>
}

type RiskApiItem = Partial<RisikoItem> & {
  kategori?: string
  skor_risiko?: number | string | null
  kabupaten?: { id_fe?: string }
}

function normalizeRiskItem(item: RiskApiItem, databaseScore = false): RisikoItem {
  let score = item.skor_risiko === null || item.skor_risiko === undefined
    ? null
    : Number(item.skor_risiko)
  if (score !== null && Number.isFinite(score) && databaseScore && score <= 1) {
    score *= 100
  }
  if (score !== null && !Number.isFinite(score)) score = null

  const category = (item.kategori || "").toLowerCase().trim()
  let normalizedCategory: RisikoItem["kategori"] = "data tidak tersedia"
  if (score !== null) {
    if (category === "tinggi" || category === "kritis") normalizedCategory = "tinggi"
    else if (category === "sedang" || category === "waspada" || category === "warning") normalizedCategory = "sedang"
    else if (category === "rendah" || category === "normal" || category === "aman") normalizedCategory = "rendah"
  }

  return {
    ...item,
    kode_kabupaten: item.kode_kabupaten || "",
    nama_kabupaten: item.nama_kabupaten || "",
    skor_risiko: score,
    kategori: normalizedCategory,
    status_data: item.status_data || "model",
    id_fe: item.id_fe || item.kabupaten?.id_fe,
  }
}

export function latestRisikoPerKabupaten(items: RisikoItem[]): RisikoItem[] {
  const latest = new Map<string, RisikoItem>()
  for (const item of items) {
    const current = latest.get(item.kode_kabupaten)
    if (
      !current ||
      (item.tanggal || "") > (current.tanggal || "") ||
      ((item.tanggal || "") === (current.tanggal || "") &&
        (item.horizon_hari || 0) > (current.horizon_hari || 0))
    ) {
      latest.set(item.kode_kabupaten, item)
    }
  }
  return Array.from(latest.values())
}

export interface AnalisisAIResponse {
  kode_kabupaten: string
  nama_kabupaten: string
  tanggal: string
  skor_risiko: number | null
  kategori: string
  faktor_penyebab: string | string[]
  analisis_ai: {
    penjelasan: string
    rekomendasi: string[] | string
    label: string
  }
}

// ─── JWT decode (tanpa library tambahan) ─────────────────────────────────────

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1]
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

// ─── Auth endpoints ───────────────────────────────────────────────────────────
// Backend: /api/auth
//   POST /api/auth/login    → { message, token }
//   POST /api/auth/register → { message, user }
//   GET  /api/auth/google   → { url }  (redirect ke Google OAuth)

export const authApi = {
  /** Login email + password → simpan token & user ke localStorage */
  async login(email: string, password: string) {
    const { data } = await api.post<{ message: string; token: string }>(
      "/api/auth/login",
      { email, password },
    )
    // Decode Supabase JWT untuk ambil id & email tanpa endpoint /me
    const claims = decodeJwt(data.token)
    const user: StoredUser = {
      id: (claims?.sub as string) ?? "",
      email: (claims?.email as string) ?? email,
      role: (claims?.["user_metadata"] as { role?: string })?.role,
    }
    return { token: data.token, user }
  },

  /** Register email + password + username (role default 'operator' di BE) */
  async register(email: string, password: string, username?: string) {
    const { data } = await api.post<{
      message: string
      user: { id: string; email: string }
    }>("/api/auth/register", { email, password, username })
    return { message: data.message, user: data.user }
  },

  /** Google OAuth — BE mengembalikan URL redirect Google, lalu browser diarahkan */
  async googleOAuthUrl() {
    const { data } = await api.get<{ url: string }>("/api/auth/google")
    return data.url
  },

  /** Verifikasi akses ke endpoint yang dilindungi middleware authenticateToken & authorizeRoles */
  async getOperatorDashboard() {
    const { data } = await api.get<{ message: string; user: StoredUser }>(
      "/api/auth/operator-dashboard",
    )
    return data
  },

  /** Bypass autentikasi sementara untuk keperluan demo & local dev dashboard */
  loginDevBypass(user?: Partial<StoredUser>) {
    const mockToken = "mock_dev_token_mawas_bypass_" + Date.now()
    const mockUser: StoredUser = {
      id: user?.id ?? "dev-operator-01",
      email: user?.email ?? "operator@mawas.id",
      role: user?.role ?? "operator",
      username: user?.username ?? "Operator Demo",
      name: user?.name ?? "Operator Demo",
    }
    saveSession(mockToken, mockUser)
    return { token: mockToken, user: mockUser }
  },

  logout() {
    localStorage.removeItem("mawas_token")
    localStorage.removeItem("mawas_user")
  },
}

// ─── Session helpers ──────────────────────────────────────────────────────────

export function saveSession(token: string, user: StoredUser) {
  localStorage.setItem("mawas_token", token)
  localStorage.setItem("mawas_user", JSON.stringify(user))
}

export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem("mawas_user")
    return raw ? (JSON.parse(raw) as StoredUser) : null
  } catch {
    return null
  }
}

export function isAuthenticated() {
  return !!localStorage.getItem("mawas_token")
}

/**
 * Cek apakah URL mengandung callback token Google OAuth (#access_token=...) dari Supabase.
 * Jika ada, simpan token dan user metadata ke session dan bersihkan URL hash.
 */
export function checkAndStoreOAuthCallback(): boolean {
  if (typeof window === "undefined") return false
  const hash = window.location.hash
  if (hash && hash.includes("access_token=")) {
    try {
      const params = new URLSearchParams(hash.replace(/^#/, ""))
      const token = params.get("access_token")
      if (token) {
        const claims = decodeJwt(token)
        const user: StoredUser = {
          id: (claims?.sub as string) ?? "",
          email: (claims?.email as string) ?? "",
          role: (claims?.["user_metadata"] as { role?: string })?.role ?? "operator",
        }
        saveSession(token, user)
        window.history.replaceState(null, "", window.location.pathname)
        return true
      }
    } catch {
      return false
    }
  }
  return false
}

// ─── Risiko endpoints ─────────────────────────────────────────────────────────

let cachedRisikoItems: RisikoItem[] | null = null
let cachedFeIdByCode: Promise<Map<string, string>> | null = null

async function getStaticFeIdByCode(): Promise<Map<string, string>> {
  if (!cachedFeIdByCode) {
    cachedFeIdByCode = (async () => {
      const idByCode = new Map<string, string>()
      try {
        const response = await fetch("/data/risiko_kabupaten_terbaru.json")
        if (!response.ok) {
          throw new Error(`Status ${response.status}`)
        }
        const json = await response.json()
        const items = Array.isArray(json) ? json : json.data || []
        for (const item of items as RiskApiItem[]) {
          if (item.kode_kabupaten && item.id_fe) {
            idByCode.set(item.kode_kabupaten, item.id_fe)
          }
        }
      } catch (error) {
        console.warn("Gagal memuat indeks id_fe untuk mencocokkan risiko ke geometri peta.", error)
      }
      return idByCode
    })()
  }
  return cachedFeIdByCode
}

export const risikoApi = {
  /** Fetch risiko dari backend; JSON lokal hanya menjadi fallback saat backend gagal. */
  async getAllRisiko(): Promise<RisikoItem[]> {
    if (cachedRisikoItems && cachedRisikoItems.length > 0) {
      return cachedRisikoItems
    }

    try {
      const { data } = await api.get<{
        status: string
        total: number
        data: RiskApiItem[]
      }>("/api/risiko", { timeout: 3000 })
      if (data && Array.isArray(data.data)) {
        const feIdByCode = await getStaticFeIdByCode()
        const normalizedItems = data.data.map((item) => {
          const normalized = normalizeRiskItem(item, true)
          return {
            ...normalized,
            id_fe: normalized.id_fe || feIdByCode.get(normalized.kode_kabupaten),
          }
        })
        cachedRisikoItems = normalizedItems
        return normalizedItems
      }
    } catch (error) {
      console.warn("Backend risiko tidak tersedia; mencoba data JSON lokal.", error)
    }

    try {
      const response = await fetch("/data/risiko_kabupaten_terbaru.json")
      if (response.ok) {
        const json = await response.json()
        const items = Array.isArray(json) ? json : json.data || []
        const normalizedItems = items.map((item: RiskApiItem) => normalizeRiskItem(item))
        cachedRisikoItems = normalizedItems
        return normalizedItems
      }
    } catch (err) {
      console.warn("Gagal membaca berkas risiko_kabupaten_terbaru.json:", err)
    }

    return []
  },

  async getRiskTrend(provinsi?: string): Promise<RiskTrendResponse> {
    const { data } = await api.get<{ status: string; data: RiskTrendResponse }>(
      "/api/risiko/trend-nasional",
      {
        params: provinsi ? { provinsi } : undefined,
        timeout: 5000,
      },
    )
    if (!data?.data) {
      throw new Error("Respons tren risiko dari server tidak valid.")
    }
    return data.data
  },

  /** Fetch detail risiko berdasarkan kode_kabupaten atau id_fe */
  async getRisikoByKode(kodeOrId: string): Promise<RisikoItem | null> {
    try {
      const { data } = await api.get<{
        status: string
        data: RisikoItem
      }>(`/api/risiko/${kodeOrId}`, { timeout: 3000 })
      if (data?.data) return normalizeRiskItem(data.data, true)
    } catch {
      // Fallback ke cache/static data
    }

    const all = await this.getAllRisiko()
    return (
      all.find(
        (item) =>
          item.kode_kabupaten === kodeOrId ||
          item.id_fe === kodeOrId ||
          item.nama_kabupaten?.toLowerCase() === kodeOrId.toLowerCase()
      ) || null
    )
  },

  /** Fetch narasi & rekomendasi Generative AI (Gemini) per kabupaten dengan fallback cerdas */
  async getAnalisisAI(kodeOrId: string, fallbackData?: Partial<RisikoItem>): Promise<AnalisisAIResponse> {
    try {
      const { data } = await api.get<AnalisisAIResponse>(`/api/risiko/${kodeOrId}/analisis`, {
        timeout: 7000,
      })
      if (data?.analisis_ai) return data
    } catch {
      // Server backend / Supabase belum siap, gunakan generator narasi berbasis data model
    }

    // Ambil data referensi kabupaten
    const item = fallbackData || (await this.getRisikoByKode(kodeOrId))
    const nama = item?.nama_kabupaten || "Wilayah"
    const skor = item?.skor_risiko !== undefined && item?.skor_risiko !== null ? Math.round(Number(item.skor_risiko)) : null
    const kategori = (item?.kategori || "data tidak tersedia").toLowerCase()
    const rawFaktor = item?.faktor_penyebab
    const faktor = Array.isArray(rawFaktor)
      ? rawFaktor.join(", ")
      : rawFaktor || "Anomali vegetasi belum terdeteksi secara signifikan"
    const tanggal = item?.tanggal || "2026-09-11"

    if (kategori === "data tidak tersedia" || skor === null) {
      return {
        kode_kabupaten: item?.kode_kabupaten || kodeOrId,
        nama_kabupaten: nama,
        tanggal,
        skor_risiko: null,
        kategori: "data tidak tersedia",
        faktor_penyebab: faktor,
        analisis_ai: {
          penjelasan: `Data analisis risiko untuk wilayah ${nama} saat ini tidak tersedia. ${faktor}.`,
          rekomendasi: [
            "Lakukan verifikasi observasi lapangan langsung oleh petugas penyuluh pertanian setempat.",
            "Pemasangan stasiun pengamatan curah hujan mandiri di sentra persawahan.",
            "Pemanfaatan data historis kebiasaan tanam kabupaten sebagai referensi cadangan.",
          ],
          label: "Dihasilkan AI",
        },
      }
    }

    if (kategori === "tinggi") {
      return {
        kode_kabupaten: item?.kode_kabupaten || kodeOrId,
        nama_kabupaten: nama,
        tanggal,
        skor_risiko: skor,
        kategori: "tinggi",
        faktor_penyebab: faktor,
        analisis_ai: {
          penjelasan: `Wilayah ${nama} terindikasi berada pada risiko kekeringan pertanian tinggi dengan skor ${skor}/100 untuk proyeksi 30 hari ke depan. Faktor pemicu utama meliputi: ${faktor}. Kondisi ini menuntut langkah preventif cepat guna mencegah penurunan indeks pertanaman dan gagal panen.`,
          rekomendasi: [
            "Mobilisasi brigade pompa air darurat ke petak sawah berisiko tinggi.",
            "Penerapan sistem giliran distribusi air irigasi bersama P3A setempat.",
            "Penyiapan cadangan benih tahan kekeringan dan proteksi asuransi pertanian.",
          ],
          label: "Dihasilkan AI",
        },
      }
    }

    if (kategori === "sedang") {
      return {
        kode_kabupaten: item?.kode_kabupaten || kodeOrId,
        nama_kabupaten: nama,
        tanggal,
        skor_risiko: skor,
        kategori: "sedang",
        faktor_penyebab: faktor,
        analisis_ai: {
          penjelasan: `Wilayah ${nama} tercatat dalam level risiko sedang dengan skor ${skor}/100. Dinamika curah hujan dan penyerapan vegetasi terdeteksi mengalami deviasi ringan: ${faktor}. Stres kekeringan dapat meningkat jika tidak ada curah hujan signifikan dalam 15 hari mendatang.`,
          rekomendasi: [
            "Pembersihan sedimentasi dan pemeliharaan saluran irigasi tersier.",
            "Sosialisasi teknik mulsa jerami dan penghematan air pada fase vegetatif.",
            "Pemantauan tren anomali cuaca harian BMKG secara ketat.",
          ],
          label: "Dihasilkan AI",
        },
      }
    }

    return {
      kode_kabupaten: item?.kode_kabupaten || kodeOrId,
      nama_kabupaten: nama,
      tanggal,
      skor_risiko: skor,
      kategori: "rendah",
      faktor_penyebab: faktor,
      analisis_ai: {
        penjelasan: `Wilayah ${nama} saat ini dalam kondisi risiko rendah dengan skor ${skor}/100. Ketersediaan air dan respon vegetasi berada dalam ambang normal musim tanam (${faktor}).`,
        rekomendasi: [
          "Pertahankan pola tanam sesuai kalender tanam terpadu yang berlaku.",
          "Inspeksi berkala pada pintu air bendung dan embung desa.",
          "Pencatatan realisasi luas tanam dan luas panen oleh dinas pertanian.",
        ],
        label: "Dihasilkan AI",
      },
    }
  },
}
