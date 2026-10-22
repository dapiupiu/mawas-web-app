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

  /** Register email + password (role default 'operator' di BE) */
  async register(email: string, password: string) {
    const { data } = await api.post<{
      message: string
      user: { id: string; email: string }
    }>("/api/auth/register", { email, password })
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

