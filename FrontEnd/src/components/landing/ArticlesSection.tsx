
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Tag,
  UserRound,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getDashboardArticles } from "@/lib/dashboardData";
import type { KnowledgeArticle } from "@/types/dashboard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Reveal } from "./Reveal";

function excerpt(text: string, max = 120) {
  const clean = text.replace(/\s+/g, " ").trim();

  if (clean.length <= max) return clean;

  return `${clean.slice(0, max).trimEnd()}…`;
}

export function ArticlesSection() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setArticles(getDashboardArticles());
  }, []);

  const scrollPrev = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  useEffect(() => {
    if (!api) return;

    const updateButtons = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    updateButtons();

    api.on("select", updateButtons);
    api.on("reInit", updateButtons);

    return () => {
      api.off("select", updateButtons);
      api.off("reInit", updateButtons);
    };
  }, [api]);

  return (
    <section
      id="artikel"
      className="border-b border-[#173e32]/10 bg-[#fbfaf5] px-4 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-24 xl:px-12"
    >
      <div className="mx-auto w-full max-w-[1680px]">
        {/* Section heading */}
        <Reveal>
          <div className="grid gap-6 border-b border-[#173e32]/15 pb-8 md:grid-cols-2 md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#557267]">
                Panduan & edukasi
              </p>

              <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-[#173e32] sm:text-4xl lg:text-5xl">
                Artikel mitigasi dari ruang kerja Mawas.
              </h2>
            </div>

            <p className="text-xs leading-relaxed text-[#36564a] sm:text-sm sm:leading-6">
              Geser kartu untuk melihat panduan. Beberapa artikel membawa
              gambar berita; yang lain fokus pada teks. Baca lengkap di
              halaman artikel.
            </p>
          </div>
        </Reveal>

        {/* Empty state */}
        {articles.length === 0 ? (
          <Reveal>
            <div className="mt-10 rounded-xl border border-dashed border-[#173e32]/25 bg-white/50 px-5 py-10 text-center">
              <BookOpen
                className="mx-auto size-6 text-[#557267]"
                aria-hidden="true"
              />

              <p className="mt-3 text-sm font-semibold text-[#173e32]">
                Belum ada artikel
              </p>

              <p className="mt-1 text-xs leading-5 text-[#557267]">
                Tambahkan panduan di CMS dashboard agar daftar ini terisi.
              </p>
            </div>
          </Reveal>
        ) : (
          <Reveal>
            <div className="mt-10">
              {/* Carousel layout: arrow | cards | arrow */}
              <div className="grid grid-cols-[36px_minmax(0,1fr)_36px] items-center gap-2 sm:grid-cols-[44px_minmax(0,1fr)_44px] sm:gap-4 lg:grid-cols-[48px_minmax(0,1fr)_48px]">
                {/* Previous button: outside the carousel */}
                <button
                  type="button"
                  onClick={scrollPrev}
                  disabled={!canScrollPrev}
                  aria-label="Lihat artikel sebelumnya"
                  className="relative z-10 inline-flex size-9 items-center justify-center justify-self-center rounded-full border border-[#173e32]/20 bg-[#f5f1e8] text-[#173e32] shadow-sm transition-colors hover:bg-[#dce7d7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b97a16] disabled:pointer-events-none disabled:opacity-30 sm:size-11"
                >
                  <ChevronLeft
                    className="size-5"
                    aria-hidden="true"
                  />
                </button>

                {/* Cards carousel */}
                <div className="min-w-0">
                  <Carousel
                    setApi={setApi}
                    opts={{
                      align: "start",
                      loop: false,
                    }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-3 sm:-ml-4">
                      {articles.map((article, index) => {
                        const hasImage = Boolean(
                          article.thumbnailUrl?.trim(),
                        );

                        return (
                          <CarouselItem
                            key={article.id}
                            className="basis-[88%] pl-3 sm:basis-1/2 sm:pl-4 lg:basis-1/3"
                          >
                            <motion.div
                              initial={
                                reduceMotion
                                  ? false
                                  : { opacity: 0, y: 16 }
                              }
                              whileInView={{
                                opacity: 1,
                                y: 0,
                              }}
                              viewport={{
                                once: true,
                                amount: 0.3,
                              }}
                              transition={{
                                duration: 0.4,
                                delay: reduceMotion
                                  ? 0
                                  : index * 0.05,
                                ease: "easeOut",
                              }}
                              whileHover={
                                reduceMotion ? undefined : { y: -3 }
                              }
                              className="h-full"
                            >
                              <Link
                                to={`/artikel/${article.id}`}
                                className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#173e32]/12 bg-white shadow-[0_8px_24px_rgba(23,62,50,0.06)] transition-colors hover:border-[#173e32]/28 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b97a16]"
                              >
                                {/* Article thumbnail */}
                                {hasImage ? (
                                  <div className="relative aspect-[16/10] overflow-hidden bg-[#dce7d7]">
                                    <img
                                      src={article.thumbnailUrl}
                                      alt=""
                                      className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                      loading="lazy"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex aspect-[16/10] items-end bg-[#dce7d7]/70 px-5 pb-4">
                                    <span className="grid size-11 place-items-center rounded-lg bg-[#173e32] text-[#f5f1e8]">
                                      <BookOpen
                                        className="size-5"
                                        aria-hidden="true"
                                      />
                                    </span>
                                  </div>
                                )}

                                {/* Article information */}
                                <div className="flex flex-1 flex-col p-5">
                                  <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-semibold text-[#b97a16]">
                                    <Tag
                                      className="size-3.5 shrink-0"
                                      aria-hidden="true"
                                    />
                                    {article.kategori}
                                  </span>

                                  <h3 className="mt-2.5 line-clamp-2 font-serif text-xl leading-snug tracking-[-0.02em] text-[#173e32]">
                                    {article.judul}
                                  </h3>

                                  <p className="mt-2.5 line-clamp-3 flex-1 text-xs leading-5 text-[#36564a] sm:text-sm sm:leading-6">
                                    {excerpt(article.isi)}
                                  </p>

                                  {/* Author and update date */}
                                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#173e32]/10 pt-3 text-[11px] text-[#557267]">
                                    <span className="inline-flex items-center gap-1">
                                      <UserRound
                                        className="size-3.5"
                                        aria-hidden="true"
                                      />
                                      {article.penulis || "Admin"}
                                    </span>

                                    <span className="inline-flex items-center gap-1">
                                      <Calendar
                                        className="size-3.5"
                                        aria-hidden="true"
                                      />
                                      {article.diperbaruiPada}
                                    </span>
                                  </div>

                                  <span className="mt-3 text-xs font-semibold text-[#173e32] transition-colors group-hover:text-[#245542]">
                                    Baca selengkapnya
                                  </span>
                                </div>
                              </Link>
                            </motion.div>
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>
                  </Carousel>
                </div>

                {/* Next button: outside the carousel */}
                <button
                  type="button"
                  onClick={scrollNext}
                  disabled={!canScrollNext}
                  aria-label="Lihat artikel berikutnya"
                  className="relative z-10 inline-flex size-9 items-center justify-center justify-self-center rounded-full border border-[#173e32]/20 bg-[#f5f1e8] text-[#173e32] shadow-sm transition-colors hover:bg-[#dce7d7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b97a16] disabled:pointer-events-none disabled:opacity-30 sm:size-11"
                >
                  <ChevronRight
                    className="size-5"
                    aria-hidden="true"
                  />
                </button>
              </div>

              {/* Mobile swipe hint */}
              <div className="mt-4 text-center sm:hidden">
                <p className="text-xs text-[#557267]">
                  Geser kartu ke samping atau gunakan tombol panah.
                </p>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
