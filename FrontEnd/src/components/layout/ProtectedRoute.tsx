import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"
import { checkAndStoreOAuthCallback, isAuthenticated } from "@/lib/api"

/**
 * Route Guard / Middleware Frontend:
 * 1. Menangkap callback OAuth Google (jika ada token di URL hash).
 * 2. Cek token autentikasi di localStorage sebelum halaman dashboard dimuat.
 * 3. Jika belum login / tidak ada token → langsung redirect ke /signin dengan menyimpan intended URL.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()

  // Cek apakah user baru selesai login via redirect OAuth Google
  checkAndStoreOAuthCallback()

  if (!isAuthenticated()) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  return <>{children}</>
}
