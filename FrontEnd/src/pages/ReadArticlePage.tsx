
import { Calendar, Tag, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { Button } from "@/components/ui/button";
import { getArticleById } from "@/lib/dashboardData";
import type { KnowledgeArticle } from "@/types/dashboard";

function articleParagraphs(isi: string) {
  return isi
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function ReadArticlePage() {
  const { articleId } = useParams<{ articleId: string }>();
  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [ready, setReady] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setArticle(articleId ? getArticleById(articleId) : null);
    setReady(true);
  }, [articleId]);

  const paragraphs = useMemo(
    () => (article ? articleParagraphs(article.isi) : []),
    [article],
  );

  const hasImage = Boolean(article?.thumbnailUrl?.trim());

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f5f1e8] text-[#173e32]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-3 pb-16 pt-6 sm:px-5 sm:pb-24 sm:pt-8 lg:px-6 xl:px-8">
        {!ready ? (
          <p className="mt-8 text-sm text-[#557267]" role="status">
            Memuat artikel…
          </p>
        ) : !article ? (
          <div className="mt-8 rounded-xl border border-dashed border-[#173e32]/25 bg-[#fbfaf5] px-4 py-10 text-center sm:px-6">
            <h1 className="font-serif text-2xl tracking-[-0.03em] text-[#173e32]">
              Artikel tidak ditemukan
            </h1>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#557267]">
              Artikel mungkin sudah dihapus dari CMS, atau tautannya tidak
              valid.
            </p>

            <Button
              asChild
              className="mt-6 min-h-11 bg-[#173e32] text-[#f5f1e8] hover:bg-[#245542]"
            >
              <a href="/#artikel">Lihat artikel lain</a>
            </Button>
          </div>
        ) : (
          <motion.article
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mt-2"
          >
            {/* Article thumbnail */}
            {hasImage && (
              <div className="overflow-hidden rounded-xl border border-[#173e32]/12 bg-[#dce7d7]">
                <img
                  src={article.thumbnailUrl}
                  alt=""
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            )}

            {/* Article heading */}
            <header className={hasImage ? "mt-6 sm:mt-8" : "mt-2"}>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#b97a16]">
                <Tag className="size-3.5" aria-hidden="true" />
                {article.kategori}
              </p>

              <h1 className="mt-3 text-balance font-serif text-3xl leading-tight tracking-[-0.035em] text-[#173e32] sm:text-4xl lg:text-5xl xl:text-6xl">
                {article.judul}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#557267]">
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="size-4" aria-hidden="true" />
                  Ditulis oleh {article.penulis || "Admin"}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-4" aria-hidden="true" />
                  {article.diperbaruiPada}
                </span>
              </div>
            </header>

            {/* Article content */}
            <div className="mt-6 space-y-5 border-t border-[#173e32]/12 pt-6 sm:mt-8 sm:space-y-6 sm:pt-8">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={`${article.id}-p-${index}`}
                  className="text-pretty text-sm leading-7 text-[#36564a] sm:text-base sm:leading-8 lg:text-lg lg:leading-9"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.article>
        )}
      </main>
    </div>
  );
}
