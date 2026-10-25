import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArticlesSection } from "@/components/landing/ArticlesSection";
import { BrandMark } from "@/components/landing/BrandMark";
import { FAQ } from "@/components/landing/FAQ";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { Reveal } from "@/components/landing/Reveal";
import { RiskMapPreview } from "@/components/landing/RiskMapPreview";
import { AgriStatusPanel } from "@/components/landing/AgriStatusPanel";
import { HeroAiForecast } from "@/components/landing/HeroAiForecast";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { scrollToSection } from "@/lib/scrollToSection";

const copyrightYear = new Date().getFullYear();

export function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    const sectionId = location.hash.slice(1);
    if (!sectionId) return;
    const frame = window.requestAnimationFrame(() =>
      scrollToSection(sectionId, "smooth"),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

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
          <div className="relative mx-auto grid w-full max-w-[1680px] gap-6 lg:gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:justify-between">
            <Reveal>
              <div className="flex h-full flex-col">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#557267]">
                    Sistem Peringatan Dini Risiko Kekeringan Pertanian
                  </p>
                  <h1 className="mt-3 text-balance font-serif text-3xl leading-[1.08] tracking-[-0.04em] text-[#173e32] sm:text-5xl lg:text-6xl">
                    Deteksi dini stres vegetasi, kawal ketersediaan pangan.
                  </h1>
                  <p className="mt-5 text-pretty text-sm leading-relaxed text-[#36564a] sm:text-base sm:leading-7">
                    Mawas memprediksi risiko stres vegetasi/kekeringan pertanian
                    per kabupaten/kota untuk 30 hari ke depan, sebagai indikator awal
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
                      <a href="#status-wilayah">
                        Lihat status wilayah <ArrowDown className="ml-1" />
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="mt-8 hidden grid-cols-3 gap-4 border-t border-[#173e32]/12 pt-5 lg:mt-12 lg:grid">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#557267]">
                      Horizon
                    </p>
                    <p className="mt-1 font-serif text-lg font-bold text-[#173e32]">
                      30 hari
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#557267]">
                      Cakupan
                    </p>
                    <p className="mt-1 font-serif text-lg font-bold text-[#173e32]">
                      Kabupaten/Kota
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#557267]">
                      Indikator
                    </p>
                    <p className="mt-1 font-serif text-lg font-bold text-[#173e32]">
                      Vegetasi & iklim
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal>
              <RiskMapPreview />
            </Reveal>
          </div>
          <Reveal>
            <div className="relative mx-auto w-full max-w-[1680px]">
              <HeroAiForecast />
            </div>
          </Reveal>
        </section>

        <AgriStatusPanel />
        <ArticlesSection />
        <HowItWorksSection />

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
                <BrandMark
                  className="size-10 rounded-full bg-[#f5f1e8] p-1"
                  variant="colour"
                />
                <span className="text-lg font-semibold tracking-tight">
                  Mawas
                </span>
              </div>
              <p className="mt-4 max-w-sm text-xs leading-5 text-[#dbe7d5] sm:text-sm sm:leading-6">
                Sistem Peringatan Dini Risiko Kekeringan Pertanian untuk
                Mendukung Ketahanan Pangan.
              </p>
            </div>
            <FooterColumn title="Jelajahi">
              <Link to="/peta-risiko">Peta risiko publik</Link>
              <a href="#status-wilayah">Status wilayah</a>
              <a href="#artikel">Artikel</a>
              <a href="#cara-kerja">Cara kerja</a>
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
