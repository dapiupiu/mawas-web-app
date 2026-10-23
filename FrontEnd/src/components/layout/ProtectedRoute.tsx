import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"
import { checkAndStoreOAuthCallback, isAuthenticated, authApi } from "@/lib/api"

/**
 * Route Guard / Middleware Frontend:
 * 1. Menangkap parameter bypass (?bypass=true / ?backdoor=true) untuk akses demo / testing lokal.
 * 2. Menangkap callback OAuth Google (jika ada token di URL hash).
 * 3. Cek token autentikasi di localStorage sebelum halaman dashboard dimuat.
 * 4. Jika belum login / tidak ada token → langsung redirect ke /signin dengan menyimpan intended URL.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()

  // Backdoor / Dev bypass: memungkinkan akses langsung dengan query param ?bypass=true atau ?backdoor=true
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(location.search)
    if (
      params.get("bypass") === "true" ||
      params.get("backdoor") === "true" ||
      params.get("dev") === "true"
    ) {
      if (!isAuthenticated()) {
        authApi.loginDevBypass()
      }
    }
  }

  // Cek apakah user baru selesai login via redirect OAuth Google
  checkAndStoreOAuthCallback()

  if (!isAuthenticated()) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  return <>{children}</>
}
