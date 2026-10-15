import { ArrowLeft, LockKeyhole, Mail, UserRound } from "lucide-react"
import { type FormEvent, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import { AuthVisual } from "@/components/auth/AuthVisual"
import { BrandMark } from "@/components/landing/BrandMark"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type Mode = "signin" | "signup"

function Field({ id, label, type, placeholder, icon, autoComplete }: { id: string; label: string; type: string; placeholder: string; icon: ReactNode; autoComplete: string }) {
  return <div className="space-y-2"><label htmlFor={id} className="text-sm font-semibold text-[#173e32]">{label}</label><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#557267]">{icon}</span><Input id={id} name={id} type={type} autoComplete={autoComplete} required placeholder={placeholder} className="h-12 border-[#173e32]/20 bg-white pl-10 text-[#173e32]" /></div></div>
}

function AuthForm({ mode }: { mode: Mode }) {
  const [message, setMessage] = useState("")
  const reduceMotion = useReducedMotion()
  const isSignIn = mode === "signin"
  function handleSubmit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setMessage(isSignIn ? "Layanan autentikasi belum terhubung. Hubungkan endpoint login untuk melanjutkan." : "Pendaftaran belum terhubung ke layanan akun. Hubungkan endpoint pendaftaran untuk melanjutkan.") }

  return <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center py-20 lg:py-10"><Link to="/" className="absolute left-0 top-0 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#36564a] hover:text-[#173e32] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b97a16]"><ArrowLeft className="size-4" />Kembali ke beranda</Link><motion.div initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, ease: "easeOut" }} className="w-full max-w-md"><div className="mb-9 flex items-center gap-3 lg:hidden"><BrandMark /><span className="font-semibold">Mawas</span></div><p className="text-sm font-semibold text-[#557267]">{isSignIn ? "Akses operator" : "Buat akun"}</p><h2 className="mt-3 font-serif text-4xl tracking-[-0.035em] text-[#173e32]">{isSignIn ? "Masuk ke ruang kerja" : "Daftarkan akun Anda"}</h2><p className="mt-3 text-sm leading-6 text-[#36564a]">{isSignIn ? "Gunakan email dan kata sandi akun yang terdaftar." : "Lengkapi informasi berikut untuk mengajukan akses."}</p><Card className="mt-8 border border-[#173e32]/12 bg-[#fbfaf5] py-0 shadow-[0_18px_44px_rgba(23,62,50,0.08)]"><CardContent className="p-6 sm:p-8"><form className="space-y-5" onSubmit={handleSubmit}>{!isSignIn && <Field id="name" label="Nama lengkap" type="text" placeholder="Nama Anda" icon={<UserRound />} autoComplete="name" />}<Field id="email" label="Email" type="email" placeholder="nama@instansi.go.id" icon={<Mail />} autoComplete="email" /><Field id="password" label="Kata sandi" type="password" placeholder="Masukkan kata sandi" icon={<LockKeyhole />} autoComplete={isSignIn ? "current-password" : "new-password"} /><Button type="submit" className="h-12 w-full bg-[#173e32] text-[#f5f1e8] hover:bg-[#245542]">{isSignIn ? "Masuk" : "Buat akun"}</Button></form>{message && <p role="status" className="mt-5 rounded-md border border-[#966a13]/35 bg-[#f5e8c9] p-3 text-sm leading-6 text-[#62480d]">{message}</p>}<p className="mt-6 text-center text-sm text-[#557267]">{isSignIn ? "Belum punya akun?" : "Sudah punya akun?"} <Link to={isSignIn ? "/signup" : "/signin"} className="font-semibold text-[#173e32] underline decoration-[#b97a16] decoration-2 underline-offset-4 hover:text-[#557267]">{isSignIn ? "Daftar sekarang" : "Masuk"}</Link></p></CardContent></Card></motion.div></section>
}

function AuthPage({ mode }: { mode: Mode }) { const isSignIn = mode === "signin"; return <main className="relative min-h-screen overflow-hidden bg-[#f5f1e8] px-5 py-6 sm:px-8 sm:py-8"><div className="contour-field pointer-events-none absolute inset-0 opacity-45" aria-hidden="true" /><div className={`relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:gap-16 ${isSignIn ? "" : "lg:[&>*:first-child]:order-2"}`}><AuthVisual mode={mode} /><AuthForm mode={mode} /></div></main> }
export function SignInPage() { return <AuthPage mode="signin" /> }
export function SignUpPage() { return <AuthPage mode="signup" /> }
