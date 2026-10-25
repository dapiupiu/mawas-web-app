import {
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  LockKeyhole,
  Loader2,
  Mail,
  MapPinned,
  Sprout,
  ShieldCheck,
  Building2
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi, saveSession } from "@/lib/api";

const slides = [
  {
    icon: MapPinned,
    label: "Peta Risiko Wilayah",
    title: "Baca kondisi wilayah dengan konteks spasial yang jelas.",
    body: "Pantau indikator vegetasi satelit FAPAR dan variabel iklim dari tingkat provinsi hingga kabupaten/kota.",
    accentGlow:
      "radial-gradient(ellipse at 30% 30%, rgba(190, 213, 173, 0.28) 0%, transparent 65%)",
  },
  {
    icon: Sprout,
    label: "Sinyal Stres Vegetasi",
    title: "Deteksi anomali penyerapan klorofil tanaman sejak dini.",
    body: "Gunakan estimasi risiko 30 hari untuk verifikasi lapangan sebelum kekeringan kasat mata meluas.",
    accentGlow:
      "radial-gradient(ellipse at 70% 35%, rgba(175, 220, 165, 0.25) 0%, transparent 65%)",
  },
  {
    icon: ShieldCheck,
    label: "Ruang Kerja Tertutup",
    title: "Akses terkelola untuk dinas pertanian dan operator.",
    body: "Hak akses dikelola terpusat oleh administrator instansi guna menjaga integritas data.",
    accentGlow:
      "radial-gradient(ellipse at 40% 70%, rgba(215, 230, 195, 0.22) 0%, transparent 65%)",
  },
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 shrink-0">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.87h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.31 2.98-7.35Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.23-2.51c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H3.08v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.91A5.99 5.99 0 0 1 6.1 12c0-.66.11-1.3.31-1.91V7.5H3.08A10 10 0 0 0 2 12c0 1.61.39 3.13 1.08 4.5l3.33-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.97c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.97 2.99 14.7 2 12 2A10 10 0 0 0 3.08 7.5l3.33 2.59C7.2 7.73 9.4 5.97 12 5.97Z"
      />
    </svg>
  );
}

function Field({
  id,
  label,
  type,
  placeholder,
  icon,
  autoComplete,
  value,
  onValueChange,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  icon: ReactNode;
  autoComplete: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-[#173e32]">
        {label}
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#557267]"
          aria-hidden="true"
        >
          {icon}
        </span>
        <Input
          id={id}
          type={isPassword ? (isPasswordVisible ? "text" : "password") : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onValueChange?.(event.target.value)}
          className="h-11 border-[#173e32]/20 bg-white/90 pl-10 pr-10 text-xs sm:text-sm text-[#173e32] placeholder:text-[#557267]/70 focus-visible:ring-2 focus-visible:ring-[#10b981]"
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center text-[#557267] hover:text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]"
            onClick={() => setIsPasswordVisible((current) => !current)}
            aria-label={isPasswordVisible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function AuthCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const currentSlide = slides[activeSlide];
  const Icon = currentSlide.icon;

  return (
    <aside
      className="relative hidden min-h-0 flex-col justify-between overflow-hidden rounded-2xl bg-[#173e32] p-6 text-[#f5f1e8] lg:flex"
      aria-label="Informasi Ruang Kerja Mawas"
    >
      <div
        className="contour-field pointer-events-none absolute inset-0 opacity-20"
        aria-hidden="true"
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="pointer-events-none absolute inset-0"
          style={{ background: currentSlide.accentGlow }}
          aria-hidden="true"
        />
      </AnimatePresence>

      <div className="relative">
        <img
          src="/logo-mawas/PNG/rectangle/MAWAS-rectangle-cream.png"
          alt="Mawas"
          className="h-8 w-auto object-contain"
        />
      </div>

      <div className="relative mt-auto flex min-h-0 flex-col justify-end">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="space-y-3"
          >
            <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-[#34d399] backdrop-blur-xs">
              <Icon className="size-3.5" />
              <span>{currentSlide.label}</span>
            </div>
            <h2 className="font-serif text-xl font-bold leading-snug text-[#f5f1e8] xl:text-2xl">
              {currentSlide.title}
            </h2>
            <p className="text-xs leading-relaxed text-[#dbe7d5]">
              {currentSlide.body}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                activeSlide === idx ? "w-8 bg-[#34d399]" : "w-2 bg-white/25 hover:bg-white/40"
              }`}
              aria-label={`Lihat slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [message, setMessage] = useState(() => sessionStorage.getItem("mawas_oauth_notice") || "");

  useEffect(() => {
    sessionStorage.removeItem("mawas_oauth_notice");
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setMessage("Harap isi email dan kata sandi Anda.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const result = await authApi.login(email, password);
      saveSession(result.token, result.user);
      navigate("/dashboard");
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: string } } })?.response?.data;
      setMessage(
        errData?.error ?? "Email atau kata sandi tidak cocok. Pastikan akun telah didaftarkan oleh Administrator."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setMessage("");
    try {
      const url = await authApi.googleOAuthUrl();
      window.location.href = url;
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: string } } })?.response?.data;
      setMessage(errData?.error ?? "Gagal mengalihkan ke Google OAuth. Coba login manual dengan email.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#e8ecdf] p-4 sm:p-6 lg:grid lg:h-dvh lg:min-h-0 lg:place-items-center lg:p-3">
      <div
        className="contour-field pointer-events-none absolute inset-0 opacity-35"
        aria-hidden="true"
      />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative mx-auto mt-10 grid w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-white/80 bg-[#fbfaf5] p-2 shadow-[0_24px_70px_rgba(23,62,50,0.16)] lg:mt-0 lg:h-[calc(100dvh-3rem)] lg:max-h-[660px] lg:min-h-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:p-2"
      >
        <section className="flex min-h-[560px] flex-col px-5 py-5 sm:px-10 sm:py-7 lg:min-h-0 lg:px-8 lg:py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              aria-label="Kembali ke beranda"
              className="grid size-11 place-items-center rounded-full border border-[#173e32]/20 text-[#36564a] transition-colors hover:bg-[#dce7d7] hover:text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="lg:hidden">
              <img
                src="/logo-mawas/PNG/rectangle/MAWAS-rectangle-cream.png"
                alt="Mawas"
                className="h-7 w-auto object-contain"
              />
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
                Ruang Kerja Mawas
              </span>
              <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#173e32] sm:text-4xl lg:text-3xl">
                Masuk ke Akun Anda
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#557267] leading-relaxed">
                Gunakan kredensial yang didaftarkan Administrator Instansi atau autentikasi cepat melalui Google.
              </p>
            </div>

            {/* Google OAuth Button */}
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                disabled={isGoogleLoading}
                className="h-11 w-full border-[#173e32]/20 bg-white text-xs sm:text-sm font-bold text-[#173e32] hover:bg-[#dce7d7] transition-all shadow-xs"
                onClick={handleGoogleLogin}
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span className="ml-2">Masuk dengan Akun Google</span>
              </Button>
            </div>

            {/* Divider */}
            <div className="my-3 flex items-center gap-3 text-xs text-[#557267]">
              <span className="h-px flex-1 bg-[#173e32]/15" />
              <span>atau gunakan email terdaftar</span>
              <span className="h-px flex-1 bg-[#173e32]/15" />
            </div>

            {/* Email + Password Login Form */}
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <Field
                id="email"
                label="Email Petugas"
                type="email"
                placeholder="nama@pertanian.go.id atau gmail"
                icon={<Mail className="size-4" />}
                autoComplete="email"
                value={email}
                onValueChange={setEmail}
              />

              <Field
                id="password"
                label="Kata Sandi / Dummy Password"
                type="password"
                placeholder="Masukkan kata sandi akun"
                icon={<LockKeyhole className="size-4" />}
                autoComplete="current-password"
                value={password}
                onValueChange={setPassword}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full bg-[#173e32] text-xs sm:text-sm font-bold text-[#f5f1e8] hover:bg-[#245542] transition-colors shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <span>Masuk ke Ruang Kerja</span>
                )}
              </Button>
            </form>

            {/* Notifikasi Sistem / Error */}
            {message && (
              <div
                role="status"
                className="mt-4 flex items-start gap-2.5 rounded-lg border border-[#991b1b]/20 bg-[#fee2e2] p-3 text-xs leading-relaxed text-[#991b1b]"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            {/* Box Penjelasan Registrasi Tertutup Instansi */}
            <div className="mt-3 rounded-xl border border-[#173e32]/10 bg-[#f1f6ef] p-2.5 text-xs text-[#36564a] leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-[#173e32]">
                <Building2 className="size-4 text-[#10b981]" />
                <span>Pendaftaran Akun Terpusat (Sistem Tertutup)</span>
              </div>
              <p className="mt-1 text-[11px] text-[#557267]">
                Pendaftaran akun operator tidak dibuka untuk publik. Seluruh akun didaftarkan langsung oleh Superadmin. Hubungi Superadmin instansi Anda jika membutuhkan hak akses baru.
              </p>
            </div>

            {/* Footer copyright */}
            <div className="mt-3 text-center text-[11px] text-[#557267]">
              <p>© 2026 Mawas Bio-Telemetry Pangan. Hak cipta dilindungi.</p>
            </div>
          </div>
        </section>

        <AuthCarousel />
      </motion.div>
    </main>
  );
}
