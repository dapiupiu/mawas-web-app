import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { LogOut, MapPinned, Sprout, BarChart3, Bell, ChevronRight } from "lucide-react"
import { authApi, getStoredUser, isAuthenticated } from "@/lib/api"
import { BrandMark } from "@/components/landing/BrandMark"

type User = { id: string; email: string; username?: string; name?: string }

function getDisplayName(user: User) {
  return user.username ?? user.name ?? user.email.split("@")[0]
}

const quickLinks = [
  {
    icon: MapPinned,
    label: "Peta Risiko",
    description: "Jelajahi peta risiko kekeringan per wilayah",
    href: "/peta-risiko",
  },
  {
    icon: Sprout,
    label: "Indikator Vegetasi",
    description: "Pantau kondisi FAPAR kabupaten secara real-time",
    href: "#",
  },
  {
    icon: BarChart3,
    label: "Laporan Analisis",
    description: "Lihat tren dan prediksi berbasis data historis",
    href: "#",
  },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/signin", { replace: true })
      return
    }

    const stored = getStoredUser()
    if (stored) {
      setUser(stored)
    } else {
      // No stored user — session may be invalid, redirect to login
      authApi.logout()
      navigate("/signin", { replace: true })
    }
    setLoading(false)
  }, [navigate])

  useEffect(() => {
    const id = window.setInterval(() => setTime(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  function handleLogout() {
    authApi.logout()
    navigate("/signin", { replace: true })
  }

  const greeting = (() => {
    const h = time.getHours()
    if (h < 12) return "Selamat pagi"
    if (h < 15) return "Selamat siang"
    if (h < 18) return "Selamat sore"
    return "Selamat malam"
  })()

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f1e8]">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="text-sm font-semibold text-[#36564a]"
        >
          Memuat ruang kerja…
        </motion.div>
      </main>
    )
  }

  if (!user) return null

  const displayName = getDisplayName(user)

  return (
    <main className="min-h-screen bg-[#f5f1e8]">
      {/* ── Topbar ── */}
      <header className="sticky top-0 z-10 border-b border-[#173e32]/10 bg-[#f5f1e8]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <a href="/" className="flex items-center gap-2.5">
            <BrandMark />
            <span className="text-sm font-semibold text-[#173e32]">Mawas</span>
          </a>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Notifikasi"
              className="grid size-9 place-items-center rounded-full border border-[#173e32]/15 text-[#36564a] hover:bg-[#dce7d7] transition-colors"
            >
              <Bell className="size-4" />
            </button>
            <button
              id="dashboard-logout-btn"
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-[#173e32]/15 bg-white px-3.5 py-2 text-xs font-semibold text-[#173e32] hover:bg-[#dce7d7] transition-colors"
            >
              <LogOut className="size-3.5" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10">
        {/* ── Greeting ── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          aria-label="Salam"
        >
          <p className="text-sm font-semibold text-[#557267]">{greeting},</p>
          <h1 className="mt-1 font-serif text-5xl tracking-[-0.04em] text-[#173e32]">
            Halo, {displayName} 👋
          </h1>
          <p className="mt-3 text-base leading-7 text-[#36564a]">
            Selamat datang di ruang kerja pemantauan risiko kekeringan pertanian Mawas.
          </p>
        </motion.section>

        {/* ── User info card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
          className="mt-8 rounded-2xl border border-[#173e32]/12 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-full bg-[#173e32] text-lg font-semibold text-[#f5f1e8]">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-[#173e32]">{displayName}</p>
              <p className="text-sm text-[#557267]">{user.email}</p>
            </div>
          </div>
        </motion.div>

        {/* ── Quick access ── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18, ease: "easeOut" }}
          className="mt-8"
          aria-label="Akses cepat"
        >
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[#557267]">
            Akses Cepat
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3" role="list">
            {quickLinks.map((link, i) => {
              const Icon = link.icon
              return (
                <motion.li
                  key={link.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.22 + i * 0.07, ease: "easeOut" }}
                >
                  <a
                    href={link.href}
                    className="group flex h-full flex-col gap-4 rounded-2xl border border-[#173e32]/12 bg-white p-5 shadow-sm transition-all hover:border-[#173e32]/25 hover:shadow-md"
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-[#dce7d7] text-[#173e32] transition-colors group-hover:bg-[#173e32] group-hover:text-[#f5f1e8]">
                      <Icon className="size-5" />
                    </span>
                    <div className="flex flex-1 flex-col">
                      <p className="font-semibold text-[#173e32]">{link.label}</p>
                      <p className="mt-1 text-sm leading-6 text-[#557267]">{link.description}</p>
                    </div>
                    <ChevronRight className="size-4 self-end text-[#bdd0bd] transition-colors group-hover:text-[#173e32]" />
                  </a>
                </motion.li>
              )
            })}
          </ul>
        </motion.section>
      </div>
    </main>
  )
}
