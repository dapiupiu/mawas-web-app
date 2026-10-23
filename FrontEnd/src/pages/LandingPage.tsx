import {
  ArrowDown,
  ArrowUpRight,
  CircleAlert,
  Database,
  Mail,
  Route,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FAQ } from "@/components/landing/FAQ";
import { InterventionSection } from "@/components/landing/InterventionSection";
import { MethodologySection } from "@/components/landing/MethodologySection";
import { PillarsSection } from "@/components/landing/PillarsSection";
import { Reveal } from "@/components/landing/Reveal";
import { RiskMapPreview } from "@/components/landing/RiskMapPreview";
import { RoadmapSection } from "@/components/landing/RoadmapSection";
import { AgriStatusPanel } from "@/components/landing/AgriStatusPanel";
import { HeroAiForecast } from "@/components/landing/HeroAiForecast";
import { SiteHeader } from "@/components/landing/SiteHeader";

const steps = [
  {
    number: "01",
    title: "Agregasi indikator satelit",
    body: "Sistem mengumpulkan data anomali penyerapan vegetasi (FAPAR HDX/JRC) dan variabel iklim historis.",
    icon: Database,
  },
  {
    number: "02",
    title: "Estimasi risiko 30 hari",
    body: "Data diolah menjadi estimasi tingkat stres vegetasi per kabupaten sebagai indikator awal kekeringan pertanian.",
    icon: CircleAlert,
  },
  {
    number: "03",
    title: "Dukung mitigasi lapangan",
    body: "Menyediakan sinyal dini bagi dinas pertanian dan pemangku kepentingan untuk intervensi irigasi atau pompanisasi.",
    icon: Route,
  },
];
const copyrightYear = new Date().getFullYear();

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#f5f1e8] text-[#173e32]">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-[#173e32] focus:px-4 focus:py-3 focus:text-[#f5f1e8]"
      >
        Lewati ke konten
      </a>
      <SiteHeader />
      <main id="konten">
        <section
          id="beranda"
          className="relative -mt-[72px] sm:-mt-[76px] flex min-h-[100dvh] w-screen max-w-full flex-col justify-start border-b border-[#173e32]/10 px-4 pt-[96px] pb-10 sm:px-6 sm:pt-[112px] sm:pb-14 lg:px-10 lg:pt-[120px] xl:px-12"
        >
          <div
            className="contour-field pointer-events-none absolute inset-0 opacity-80"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid w-full max-w-[1680px] gap-6 lg:gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:justify-between">
            <Reveal>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#557267]">
                  Sistem Peringatan Dini Risiko Kekeringan Pertanian
                </p>
                <h1 className="mt-3 text-balance font-serif text-3xl leading-[1.08] tracking-[-0.04em] text-[#173e32] sm:text-5xl lg:text-6xl">
                  Deteksi dini stres vegetasi, kawal ketersediaan pangan.
                </h1>
                <p className="mt-5 text-pretty text-sm leading-relaxed text-[#36564a] sm:text-base sm:leading-7">
                  Mawas memprediksi risiko stres vegetasi/kekeringan pertanian
                  per kabupaten untuk 30 hari ke depan, sebagai indikator awal
                  ancaman terhadap ketersediaan (produksi) pangan dan dukungan
                  bagi swasembada.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    className="min-h-11 bg-[#173e32] px-6 text-[#f5f1e8] hover:bg-[#245542] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b97a16]"
                  >
                    <Link to="/peta-risiko">
                      Jelajahi peta risiko <ArrowUpRight className="ml-1" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="min-h-11 border-[#173e32]/25 bg-transparent px-5 text-[#173e32] hover:bg-[#dce7d7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b97a16]"
                  >
                    <a href="#pilar-pangan">
                      Pelajari fokus MVP <ArrowDown className="ml-1" />
                    </a>
                  </Button>
                </div>

                {/* Component perkiraan AI di tempat kosong bawah button */}
                <HeroAiForecast />
              </div>
            </Reveal>
            <Reveal>
              <RiskMapPreview />
            </Reveal>
          </div>
        </section>

        <AgriStatusPanel />
        <PillarsSection />
        <MethodologySection />

        <section
          id="peta-risiko"
          className="bg-[#173e32] px-4 py-14 text-[#f5f1e8] sm:px-6 sm:py-20 lg:px-10 xl:px-12 lg:py-24"
        >
          <div className="mx-auto grid w-full max-w-[1680px] gap-8 lg:grid-cols-[1fr_1fr] lg:items-end lg:justify-between">
            <Reveal>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#b9d0a8]">
                  Ruang baca publik
                </p>
                <h2 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                  Mulai dari peta risiko, lalu dalami kondisi vegetasi wilayah.
                </h2>
                <Button
                  asChild
                  variant="outline"
                  className="mt-6 min-h-11 border-[#b9d0a8]/50 bg-transparent px-5 text-[#f5f1e8] hover:bg-[#f5f1e8] hover:text-[#173e32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b97a16]"
                >
                  <Link to="/peta-risiko">
                    Buka peta penuh <ArrowUpRight className="ml-1" />
                  </Link>
                </Button>
              </div>
            </Reveal>
            <Reveal>
              <div className="border-l-2 border-[#b97a16] pl-5 text-sm leading-relaxed text-[#dbe7d5] sm:text-base sm:leading-7">
                Peta dirancang terbuka untuk publik tanpa batas login.
                Masyarakat, kelompok tani, dan akademisi dapat melihat indikator
                anomali stres vegetasi per kabupaten serta catatan rencana
                mitigasi di wilayah terkait secara transparan.
              </div>
            </Reveal>
          </div>
        </section>

        <section
          id="cara-kerja"
          className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10 xl:px-12 lg:py-24"
        >
          <div className="mx-auto w-full max-w-[1680px]">
            <Reveal>
              <div className="grid gap-6 border-b border-[#173e32]/15 pb-8 md:grid-cols-2 md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#557267]">
                    Alur informasi
                  </p>
                  <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                    Data satelit yang terukur, untuk tindakan mitigasi terarah.
                  </h2>
                </div>
                <p className="text-xs leading-relaxed text-[#36564a] sm:text-sm sm:leading-6">
                  Tahapan sistematis Mawas dalam mengubah anomali penginderaan
                  jauh menjadi keputusan mitigasi kekeringan sebelum kapasitas
                  panen terganggu.
                </p>
              </div>
            </Reveal>
            <div className="grid gap-0 md:grid-cols-3">
              {steps.map((step) => (
                <Reveal key={step.number}>
                  <article className="group border-b border-[#173e32]/15 py-8 md:border-b-0 md:px-7 md:first:pl-0 md:last:pr-0 md:not(:last-child):border-r">
                    <div className="flex items-start justify-between">
                      <span className="font-serif text-2xl text-[#b97a16]">
                        {step.number}
                      </span>
                      <step.icon className="size-5 text-[#557267]" />
                    </div>
                    <h3 className="mt-8 text-lg font-semibold text-[#173e32]">
                      {step.title}
                    </h3>
                    <p className="mt-2.5 max-w-xs text-xs leading-5 text-[#36564a] sm:text-sm sm:leading-6">
                      {step.body}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <InterventionSection />
        <RoadmapSection />

        <section
          id="pertanyaan"
          className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10 xl:px-12 lg:py-24"
        >
          <div className="mx-auto grid w-full max-w-[1680px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:justify-between">
            <Reveal>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#557267]">
                  Pertanyaan umum
                </p>
                <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                  Konteks dan dasar ilmiah sebelum membaca peta.
                </h2>
                <p className="mt-4 text-xs leading-relaxed text-[#36564a] sm:text-sm sm:leading-6">
                  Pertanyaan seputar metodologi FAPAR, batasan klaim model,
                  ruang lingkup MVP, serta transparansi data publik Mawas.
                </p>
              </div>
            </Reveal>
            <Reveal>
              <FAQ />
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="bg-[#173e32] px-4 pb-7 pt-12 text-[#f5f1e8] sm:px-6 sm:pt-16 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1680px]">
          <div className="grid gap-10 border-b border-[#f5f1e8]/15 pb-10 lg:grid-cols-[1.25fr_0.7fr_0.7fr_0.9fr]">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className="grid size-10 place-items-center rounded-full bg-[#dce7d7] text-[#173e32]"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 32 32" className="size-6" fill="none">
                    <path
                      d="M5 23c4-9 8-11 13-15 0 7-2 12-8 17"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                    <path
                      d="M9 25c5-2 10-1 15-7"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="text-lg font-semibold tracking-tight">
                  Mawas
                </span>
              </div>
              <p className="mt-4 max-w-sm text-xs leading-5 text-[#dbe7d5] sm:text-sm sm:leading-6">
                Sistem Peringatan Dini Risiko Kekeringan Pertanian untuk
                Mendukung Ketahanan Pangan.
              </p>
              <div className="mt-5 flex items-start gap-2.5 text-xs text-[#dbe7d5] sm:text-sm">
                <Mail className="mt-0.5 size-4 shrink-0" />
                <p>
                  <span className="block text-xs font-semibold text-[#b9d0a8]">
                    Email proyek
                  </span>
                  <span className="mt-0.5 block">[EMAIL PROYEK]</span>
                </p>
              </div>
            </div>
            <FooterColumn title="Jelajahi">
              <Link to="/peta-risiko">Peta risiko publik</Link>
              <a href="#pilar-pangan">Pilar ketahanan pangan</a>
              <a href="#metrik-fapar">Metrik data FAPAR</a>
              <a href="#cara-kerja">Cara kerja</a>
              <a href="#intervensi">Status intervensi</a>
              <a href="#pertanyaan">Pertanyaan umum</a>
            </FooterColumn>
            <FooterColumn title="Akses">
              <Link to="/signin">Masuk Portal</Link>
              <Link to="/signup">Daftarkan akun</Link>
              <span>Hak akses mengikuti peran akun</span>
            </FooterColumn>
            <FooterColumn title="Data & Informasi">
              <span>Sumber: FAPAR JRC / HDX</span>
              <span>Proyeksi stres vegetasi 30 hari</span>
              <span>Peta publik bersifat terbuka</span>
            </FooterColumn>
          </div>
          <div className="flex flex-col justify-between gap-3 pt-6 text-xs text-[#b9d0a8] sm:flex-row">
            <p>
              © {copyrightYear} Mawas. Sistem Peringatan Dini Risiko Kekeringan
              Pertanian.
            </p>
            <p>
              Dibangun untuk transparansi mitigasi dan ketahanan pangan
              nasional.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[#f5f1e8]">
        {title}
      </h2>
      <div className="mt-4 grid gap-2.5 text-xs leading-5 text-[#dbe7d5] sm:text-sm [&_a]:w-fit [&_a]:transition-colors [&_a:hover]:text-[#f5f1e8] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-[#b97a16]">
        {children}
      </div>
    </div>
  );
}
