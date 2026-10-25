import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"
import { checkAndStoreOAuthCallback, getStoredUser, isAuthenticated, authApi } from "@/lib/api"

/**
 * Route Guard / Middleware Frontend:
 * Menangkap callback OAuth dan memastikan hanya role terdaftar yang dapat membuka dashboard.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation()

  checkAndStoreOAuthCallback()

  const user = getStoredUser()
  if (!isAuthenticated() || !user) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }
  if (user.role !== "superadmin" && user.role !== "operator") {
    authApi.logout()
    return <Navigate to="/signin" replace />
  }

  return <>{children}</>
}
