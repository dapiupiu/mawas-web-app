import { MapPinned } from "lucide-react"
import { BrandMark } from "@/components/landing/BrandMark"

export function AuthVisual({ mode }: { mode: "signin" | "signup" }) {
  const isSignIn = mode === "signin"
  return <section className="relative hidden min-h-[calc(100vh-4rem)] overflow-hidden rounded-2xl bg-[#173e32] p-10 text-[#f5f1e8] lg:flex lg:flex-col lg:justify-between">
    <div className="absolute inset-0 auth-image-placeholder" aria-hidden="true" />
    <div className="relative flex items-center gap-3"><BrandMark /><span className="font-semibold">Mawas</span></div>
    <div className="relative max-w-md"><div className="mb-5 flex size-11 items-center justify-center rounded-full border border-[#f5f1e8]/25 bg-[#173e32]/35"><MapPinned className="size-5 text-[#dbe7d5]" /></div><p className="text-sm font-semibold text-[#dbe7d5]">{isSignIn ? "Ruang kerja terlindungi" : "Pendaftaran akses"}</p><h1 className="mt-4 font-serif text-5xl leading-tight tracking-[-0.04em]">{isSignIn ? "Baca informasi wilayah, lalu tentukan tindak lanjut." : "Mulai akses ke ruang kerja Mawas."}</h1><p className="mt-5 text-base leading-7 text-[#e9efe3]">{isSignIn ? "Akses khusus untuk Superadmin dan operator yang memiliki akun." : "Pendaftaran akun diproses langsung oleh Superadmin."}</p></div>
    <p className="relative border-t border-[#f5f1e8]/20 pt-6 text-sm text-[#dbe7d5]">Ilustrasi agrikultur akan ditambahkan sebagai aset proyek.</p>
  </section>
}
