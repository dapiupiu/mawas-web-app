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

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoredUser {
  id: string
  email: string
  username?: string
}

// ─── JWT decode (no library needed) ──────────────────────────────────────────

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
// Backend branch: origin/feat/auth
// Routes mounted at: /api/auth
//   POST /api/auth/login    → { message, token }
//   POST /api/auth/register → { message, user }

export const authApi = {
  async login(email: string, password: string) {
    const { data } = await api.post<{ message: string; token: string }>(
      "/api/auth/login",
      { email, password },
    )
    // Decode Supabase JWT to extract user info (sub = user id, email in claims)
    const claims = decodeJwt(data.token)
    const user: StoredUser = {
      id: (claims?.sub as string) ?? "",
      email: (claims?.email as string) ?? email,
    }
    return { token: data.token, user }
  },

  async register(email: string, password: string, _username?: string) {
    const { data } = await api.post<{
      message: string
      user: { id: string; email: string }
    }>("/api/auth/register", { email, password })
    return { message: data.message, user: data.user }
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
