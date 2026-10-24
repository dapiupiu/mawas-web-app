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
  alasan_vegetasi_kosong?: string | null
  alasan_cuaca_kosong?: string | null
}

export interface RiskTrendResponse {
  wilayah: string
  tanggal_terakhir: string | null
  total_wilayah: number
  wilayah_dengan_skor: number
  wilayah_tanpa_skor: number
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
    jumlah_tanpa_skor: number
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

  /** Ambil analisis Groq dari backend untuk kabupaten dan tanggal snapshot terpilih. */
  async getAnalisisAI(kodeOrId: string, tanggal?: string): Promise<AnalisisAIResponse> {
    const { data } = await api.get<{
      kode_kabupaten: string
      nama_kabupaten: string
      tanggal: string
      teks: string
      dari_cache: boolean
    }>(`/api/genai/${encodeURIComponent(kodeOrId)}`, {
      params: tanggal ? { tanggal } : undefined,
      timeout: 65000,
    })
    if (!data?.teks) {
      throw new Error("Respons analisis GenAI dari server tidak valid.")
    }
    return {
      kode_kabupaten: data.kode_kabupaten,
      nama_kabupaten: data.nama_kabupaten,
      tanggal: data.tanggal,
      skor_risiko: null,
      kategori: "",
      faktor_penyebab: "",
      analisis_ai: {
        penjelasan: data.teks,
        rekomendasi: [],
        label: data.dari_cache ? "Dari cache" : "Dihasilkan AI",
      },
    }
  },
}
