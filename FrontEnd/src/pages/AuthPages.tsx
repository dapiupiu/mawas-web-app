import {
  ArrowLeft,
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Loader2,
  Mail,
  MapPinned,
  Sprout,
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "@/components/landing/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { authApi, saveSession } from "@/lib/api";

const slides = [
  {
    icon: MapPinned,
    label: "Peta risiko wilayah",
    title: "Baca kondisi wilayah dengan konteks yang lebih jelas.",
    body: "Jelajahi indikator vegetasi dan cuaca dari tingkat provinsi hingga kabupaten.",
    accentGlow:
      "radial-gradient(ellipse at 30% 30%, rgba(190, 213, 173, 0.28) 0%, transparent 65%)",
  },
  {
    icon: Sprout,
    label: "Indikator pertanian",
    title: "Mulai dari sinyal awal sebelum menentukan tindak lanjut.",
    body: "Gunakan pembacaan kondisi vegetasi sebagai dasar untuk meninjau wilayah yang perlu perhatian.",
    accentGlow:
      "radial-gradient(ellipse at 70% 35%, rgba(175, 220, 165, 0.25) 0%, transparent 65%)",
  },
  {
    icon: LockKeyhole,
    label: "Ruang kerja Mawas",
    title: "Satu tempat untuk melihat informasi yang relevan.",
    body: "Masuk untuk melanjutkan ke ruang kerja pemantauan risiko kekeringan pertanian.",
    accentGlow:
      "radial-gradient(ellipse at 40% 70%, rgba(215, 230, 195, 0.22) 0%, transparent 65%)",
  },
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
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
  invalid = false,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  icon: ReactNode;
  autoComplete: string;
  value?: string;
  onValueChange?: (value: string) => void;
  invalid?: boolean;
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-[#173e32]">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#557267]">
          {icon}
        </span>
        <Input
          id={id}
          name={id}
          type={isPassword && isPasswordVisible ? "text" : type}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onValueChange?.(event.target.value)}
          aria-invalid={invalid || undefined}
          required
          placeholder={placeholder}
          className={`h-12 bg-white pl-10 text-[#173e32] transition-colors ${isPassword ? "pr-11" : ""} ${
            invalid
              ? "border-2 border-[#DC2626] focus:border-[#DC2626] focus-visible:ring-[#DC2626]/20"
              : "border-[#173e32]/20 focus:border-[#173e32]"
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-md text-[#557267] hover:bg-[#dce7d7] hover:text-[#173e32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b97a16]"
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
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || isPaused) return;
    const interval = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(interval);
  }, [reduceMotion, isPaused]);

  const currentSlide = slides[activeSlide];
  const Icon = currentSlide.icon;

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative hidden min-h-[650px] overflow-hidden rounded-[1.25rem] bg-[#173e32] p-7 text-[#f5f1e8] lg:flex lg:flex-col"
      aria-label="Informasi Mawas"
    >
      <div
        className="absolute inset-0 auth-image-placeholder opacity-85"
        aria-hidden="true"
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={`glow-${activeSlide}`}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-0"
          style={{ background: currentSlide.accentGlow }}
          aria-hidden="true"
        />
      </AnimatePresence>
      <div
        className="absolute inset-0 bg-[linear-gradient(rgba(245,241,232,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(245,241,232,0.08)_1px,transparent_1px)] bg-size-[48px_48px]"
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-3">
        <BrandMark />
        <span className="text-sm font-semibold">Mawas</span>
      </div>

      <div className="relative mt-auto flex min-h-[380px] flex-col justify-end">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="max-w-md pb-9 pt-16"
          >
            <span className="grid size-11 place-items-center rounded-xl border border-[#f5f1e8]/25 bg-[#173e32]/45">
              <Icon className="size-5 text-[#dce7d7]" />
            </span>
            <p className="mt-7 text-sm font-semibold text-[#dce7d7]">
              {currentSlide.label}
            </p>
            <h2 className="mt-3 font-serif text-4xl leading-tight tracking-[-0.04em]">
              {currentSlide.title}
            </h2>
            <p className="mt-5 text-base leading-7 text-[#e9efe3]">
              {currentSlide.body}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2" aria-label="Pilih informasi">
          {slides.map((slide, index) => (
            <button
              key={slide.label}
              type="button"
              onClick={() => setActiveSlide(index)}
              className={`h-1.5 rounded-full transition-[width,background-color] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FACC15] ${activeSlide === index ? "w-10 bg-[#f5f1e8]" : "w-5 bg-[#f5f1e8]/35 hover:bg-[#f5f1e8]/60"}`}
              aria-label={`Tampilkan ${slide.label}`}
              aria-current={activeSlide === index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const reduceMotion = useReducedMotion();
  const hasEmailError = isSignUp && email.length > 0 && !email.includes("@");

  const passwordRules = [
    {
      id: "case",
      label: "Huruf besar dan kecil",
      valid: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    {
      id: "symbol",
      label: "Simbol unik (@, #, $, dll.)",
      valid: /[^a-zA-Z0-9\s]/.test(password),
    },
    {
      id: "number",
      label: "Karakter numerik (angka 0-9)",
      valid: /\d/.test(password),
    },
  ];

  const isPasswordStrong = passwordRules.every((rule) => rule.valid);
  const showPasswordAlert = isSignUp && password.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSignUp) {
      if (hasEmailError) return;
      if (!isPasswordStrong) return;
    }
    setIsLoading(true);
    setMessage("");
    try {
      if (isSignUp) {
        await authApi.register(email, password);
        setMessage("Akun berhasil dibuat! Silakan masuk dengan akun baru Anda.");
        setIsSignUp(false);
        setPassword("");
      } else {
        const { token, user } = await authApi.login(email, password);
        saveSession(token, user);
        navigate("/dashboard", { replace: true });
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const errData = (err as { response?: { data?: { error?: string } } })?.response?.data;
      if (status === 400) {
        setMessage(errData?.error ?? (isSignUp ? "Email sudah terdaftar atau data tidak valid." : "Email atau kata sandi salah."));
      } else if ((err as { code?: string })?.code === "ERR_NETWORK") {
        setMessage("Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.");
      } else {
        setMessage("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    setMessage("");
    try {
      const url = await authApi.googleOAuthUrl();
      window.location.href = url;
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: string } } })?.response?.data;
      setMessage(errData?.error ?? "Login Google gagal. Pastikan backend sudah berjalan.");
      setIsGoogleLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#e8ecdf] p-4 sm:p-7 lg:grid lg:place-items-center">
      <div
        className="contour-field pointer-events-none absolute inset-0 opacity-35"
        aria-hidden="true"
      />
      <Link
        to="/"
        className="absolute left-6 top-6 z-10 hidden items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-[#173e32] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b97a16] lg:inline-flex"
      >
        <BrandMark />
        <span>Mawas</span>
      </Link>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative mx-auto mt-14 grid w-full max-w-7xl overflow-hidden rounded-[1.5rem] border border-white/80 bg-[#fbfaf5] p-2 shadow-[0_24px_70px_rgba(23,62,50,0.16)] lg:mt-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(430px,1.05fr)] lg:p-3"
      >
        <section className="flex min-h-[620px] flex-col px-5 py-6 sm:px-12 sm:py-9 lg:px-14 lg:py-11">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              aria-label="Kembali ke Mawas"
              className="grid size-11 place-items-center rounded-full border border-[#173e32]/20 text-[#36564a] transition-colors hover:bg-[#dce7d7] hover:text-[#173e32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b97a16]"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="flex items-center gap-2 lg:hidden">
              <BrandMark />
              <span className="text-sm font-semibold text-[#173e32]">Mawas</span>
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6">
            <p className="text-sm font-semibold text-[#557267]">
              {isSignUp ? "Pendaftaran Mawas" : "Ruang kerja Mawas"}
            </p>
            <h1 className="mt-2 font-serif text-4xl tracking-[-0.04em] text-[#173e32]">
              {isSignUp ? "Buat akun baru" : "Masuk ke akun Anda"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#36564a]">
              {isSignUp
                ? "Daftarkan akun untuk mengakses ruang kerja pemantauan risiko wilayah."
                : "Gunakan akun terdaftar untuk mengakses ruang kerja pemantauan risiko wilayah."}
            </p>
            <div className="mt-4 grid grid-cols-2 rounded-lg border border-[#173e32]/15 bg-white/70 p-1">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setMessage("");
                }}
                aria-pressed={!isSignUp}
                className={`relative min-h-10 rounded-md text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16] ${!isSignUp ? "text-[#f5f1e8]" : "text-[#36564a] hover:bg-[#dce7d7]"}`}
              >
                {!isSignUp && (
                  <motion.span
                    layoutId="auth-mode"
                    className="absolute inset-0 rounded-md bg-[#173e32]"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative">Masuk</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setMessage("");
                }}
                aria-pressed={isSignUp}
                className={`relative min-h-10 rounded-md text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16] ${isSignUp ? "text-[#f5f1e8]" : "text-[#36564a] hover:bg-[#dce7d7]"}`}
              >
                {isSignUp && (
                  <motion.span
                    layoutId="auth-mode"
                    className="absolute inset-0 rounded-md bg-[#173e32]"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative">Buat akun</span>
              </button>
            </div>
            <motion.form
              layout
              transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
              className="mt-8 space-y-4 overflow-hidden"
              onSubmit={handleSubmit}
            >
              <AnimatePresence initial={false} />
              <Field
                id="email"
                label="Email"
                type="email"
                placeholder="nama@gmail.com"
                icon={<Mail className="size-4" />}
                autoComplete="email"
                value={email}
                onValueChange={setEmail}
                invalid={hasEmailError}
              />
              <Field
                id="password"
                label="Kata sandi"
                type="password"
                placeholder="Masukkan kata sandi"
                icon={<LockKeyhole className="size-4" />}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onValueChange={setPassword}
              />
              <AnimatePresence initial={false}>
                {showPasswordAlert && (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <Alert
                      className={cn(
                        "overflow-hidden border p-3.5 transition-colors duration-200",
                        isPasswordStrong
                          ? "border-[#173e32]/25 bg-[#eef5ee] text-[#173e32]"
                          : "border-[#b97a16]/30 bg-[#fef8ee] text-[#78350f]"
                      )}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          {isPasswordStrong ? (
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-700" />
                          ) : (
                            <AlertCircle className="size-4 shrink-0 text-[#b97a16]" />
                          )}
                          <span className="text-xs font-semibold">
                            {isPasswordStrong
                              ? "Kata sandi sudah kuat"
                              : "Kata sandi masih lemah"}
                          </span>
                        </div>
                        <ul className="space-y-1.5 pl-6 text-xs" role="list">
                          {passwordRules.map((rule) => (
                            <li
                              key={rule.id}
                              className={cn(
                                "flex items-center gap-2 transition-colors duration-150",
                                rule.valid
                                  ? "font-medium text-[#173e32]"
                                  : "text-[#78350f]/80"
                              )}
                            >
                              <motion.span
                                initial={false}
                                animate={{
                                  scale:
                                    rule.valid && !reduceMotion
                                      ? [1, 1.25, 1]
                                      : 1,
                                }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                  "grid size-4 shrink-0 place-items-center rounded-full border transition-colors duration-150",
                                  rule.valid
                                    ? "border-emerald-700 bg-emerald-700 text-white"
                                    : "border-[#b97a16]/40 bg-white/70 text-transparent"
                                )}
                                aria-hidden="true"
                              >
                                {rule.valid ? (
                                  <Check className="size-2.5 stroke-[3]" />
                                ) : (
                                  <span className="size-1 rounded-full bg-[#b97a16]/40" />
                                )}
                              </motion.span>
                              <span>{rule.label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence initial={false}>
                {!isSignUp && (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="min-h-11 text-sm font-semibold text-[#36564a] underline decoration-[#b97a16] decoration-2 underline-offset-4 hover:text-[#173e32] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b97a16]"
                        onClick={() =>
                          setMessage("Pemulihan kata sandi belum terhubung.")
                        }
                      >
                        Lupa kata sandi?
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full bg-[#173e32] text-[#f5f1e8] hover:bg-[#245542] disabled:opacity-60"
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" />{isSignUp ? "Membuat akun…" : "Masuk…"}</>
                ) : (
                  isSignUp ? "Buat akun" : "Masuk"
                )}
              </Button>
            </motion.form>
            <div className="my-6 flex items-center gap-3 text-xs text-[#557267]">
              <span className="h-px flex-1 bg-[#173e32]/15" />
              <span>atau lanjutkan dengan</span>
              <span className="h-px flex-1 bg-[#173e32]/15" />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={isGoogleLoading}
              className="h-12 w-full border-[#173e32]/20 bg-white text-[#173e32] hover:bg-[#dce7d7] disabled:opacity-60"
              onClick={handleGoogleLogin}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {isSignUp ? "Daftar dengan Google" : "Lanjutkan dengan Google"}
            </Button>
            {message && (
              <p
                role="status"
                className="mt-5 rounded-lg border border-[#b97a16]/35 bg-[#f5e8c9] p-3 text-sm leading-6 text-[#62480d]"
              >
                {message}
              </p>
            )}
            <div className="mt-7 text-center text-xs leading-5">
              <p className="font-medium text-[#173e32]">© 2026 Mawas. Hak cipta dilindungi.</p>
              <p className="mt-1 text-[#2563EB]">Syarat & Ketentuan <span className="px-1 text-[#557267]">|</span> Kebijakan Privasi</p>
            </div>
          </div>
        </section>
        <AuthCarousel />
      </motion.div>
    </main>
  );
}
