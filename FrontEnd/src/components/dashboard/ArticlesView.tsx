import { useState } from "react";
import type { FormEvent } from "react";
import { 
  BookOpen, 
  Pencil, 
  Plus, 
  Trash2, 
  X, 
  Eye, 
  Tag
} from "lucide-react";
import type { KnowledgeArticle } from "@/types/dashboard";

interface ArticlesViewProps {
  articles: KnowledgeArticle[];
  onChange: (articles: KnowledgeArticle[]) => void;
}

const blankDraft = {
  judul: "",
  isi: "",
  kategori: "Panduan Mitigasi",
  thumbnailUrl: "",
  penulis: "Admin",
};

export function ArticlesView({ articles, onChange }: ArticlesViewProps) {
  const [draft, setDraft] = useState(blankDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<KnowledgeArticle | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("Semua Kategori");

  const closeEditor = () => {
    setDraft(blankDraft);
    setEditingId(null);
    setEditorOpen(false);
  };

  const categories = ["Semua Kategori", ...Array.from(new Set(articles.map((a) => a.kategori)))];

  const filteredArticles = articles.filter((a) => {
    return categoryFilter === "Semua Kategori" || a.kategori === categoryFilter;
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!draft.judul.trim() || !draft.isi.trim()) return;

    const updatedDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date());

    if (editingId) {
      const updated = articles.map((item) =>
        item.id === editingId
          ? {
              ...item,
              judul: draft.judul.trim(),
              isi: draft.isi.trim(),
              kategori: draft.kategori.trim(),
              thumbnailUrl: draft.thumbnailUrl.trim() || undefined,
              penulis: draft.penulis.trim() || "Admin",
              diperbaruiPada: updatedDate,
            }
          : item
      );
      onChange(updated);
    } else {
      const newArticle: KnowledgeArticle = {
        id: `art-${Date.now()}`,
        judul: draft.judul.trim(),
        isi: draft.isi.trim(),
        kategori: draft.kategori.trim() || "Panduan Mitigasi",
        thumbnailUrl: draft.thumbnailUrl.trim() || undefined,
        penulis: draft.penulis.trim() || "Admin",
        diperbaruiPada: updatedDate,
      };
      onChange([newArticle, ...articles]);
    }

    closeEditor();
  };

  const handleEdit = (article: KnowledgeArticle) => {
    setDraft({
      judul: article.judul,
      isi: article.isi,
      kategori: article.kategori,
      thumbnailUrl: article.thumbnailUrl || "",
      penulis: article.penulis || "Admin",
    });
    setEditingId(article.id);
    setEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    onChange(articles.filter((item) => item.id !== id));
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      {/* CMS Header Banner */}
      <section className="rounded-xl border border-[#173e32]/15 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#10b981]">
              <BookOpen className="size-4" />
              <span>Modul CMS Publikasi</span>
            </div>
            <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#173e32]">
              CMS Artikel, SOP, & Panduan Mitigasi
            </h2>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-[#557267] leading-relaxed">
              Tulis dan perbarui materi panduan penanganan kekeringan, SOP verifikasi PPL, serta edukasi publik. Artikel ini dapat diakses pada laman publik Mawas.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setDraft(blankDraft);
              setEditingId(null);
              setEditorOpen(true);
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#173e32] px-4 text-xs font-bold text-[#f5f1e8] hover:bg-[#245542] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10b981]"
          >
            <Plus className="size-4" />
            <span>Tulis Panduan Baru</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#173e32]/10 pt-4">
          <span className="text-xs font-semibold text-[#557267]">Filter Kategori:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`min-h-8 rounded-md px-3 text-xs font-semibold transition-colors ${
                categoryFilter === cat
                  ? "bg-[#173e32] text-[#f5f1e8]"
                  : "bg-[#f5f1e8] text-[#557267] hover:bg-[#dce7d7] hover:text-[#173e32]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Articles Grid / List */}
      <section className="grid gap-4 md:grid-cols-2">
        {filteredArticles.length === 0 ? (
          <div className="col-span-full rounded-xl border border-[#173e32]/12 bg-white p-12 text-center">
            <BookOpen className="mx-auto size-8 text-[#557267]/60" />
            <p className="mt-2 text-sm font-semibold text-[#173e32]">Belum ada artikel pada kategori ini</p>
            <p className="mt-1 text-xs text-[#557267]">Klik tombol "Tulis Panduan Baru" di atas untuk menambahkan artikel.</p>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <article
              key={article.id}
              className="flex flex-col justify-between rounded-xl border border-[#173e32]/12 bg-white p-5 shadow-sm transition-all hover:border-[#173e32]/30 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-md border border-[#10b981]/30 bg-[#10b981]/10 px-2 py-0.5 font-bold text-[#065f46]">
                    <Tag className="size-3" />
                    <span>{article.kategori}</span>
                  </span>
                  <span className="text-[11px] text-[#557267]">{article.diperbaruiPada}</span>
                </div>

                <h3 className="mt-3 font-serif text-lg font-bold text-[#173e32] line-clamp-2">
                  {article.judul}
                </h3>

                <p className="mt-2 text-xs text-[#36564a] leading-relaxed line-clamp-3">
                  {article.isi}
                </p>

                {article.thumbnailUrl && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-[#173e32]/10 h-32 bg-[#f5f1e8]">
                    <img 
                      src={article.thumbnailUrl} 
                      alt={article.judul} 
                      className="size-full object-cover"
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                    />
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="mt-5 flex items-center justify-between border-t border-[#173e32]/10 pt-3">
                <button
                  type="button"
                  onClick={() => setPreviewArticle(article)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#173e32] hover:text-[#10b981] transition-colors"
                >
                  <Eye className="size-3.5" />
                  <span>Baca Lengkap</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleEdit(article)}
                    className="grid size-9 place-items-center rounded-lg border border-[#173e32]/15 text-[#173e32] hover:bg-[#dce7d7] transition-colors focus-visible:outline-2 focus-visible:outline-[#10b981]"
                    aria-label={`Sunting artikel ${article.judul}`}
                  >
                    <Pencil className="size-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteId(article.id)}
                    className="grid size-9 place-items-center rounded-lg border border-[#991b1b]/25 text-[#991b1b] hover:bg-[#991b1b]/10 transition-colors focus-visible:outline-2 focus-visible:outline-[#10b981]"
                    aria-label={`Hapus artikel ${article.judul}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {/* Create / Edit Modal Form */}
      {editorOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-[#091b15]/65 p-0 sm:p-4 backdrop-blur-xs"
          role="presentation"
          onMouseDown={closeEditor}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-title"
            className="w-full max-w-xl rounded-t-2xl sm:rounded-xl border border-[#173e32]/20 bg-[#fbfaf6] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#173e32]/10 bg-white px-5 py-4">
              <h3 id="editor-title" className="font-serif text-lg font-bold text-[#173e32]">
                {editingId ? "Sunting Artikel Panduan" : "Tulis Panduan Baru"}
              </h3>
              <button
                type="button"
                onClick={closeEditor}
                className="grid size-11 place-items-center rounded-lg text-[#36564a] hover:bg-[#dce7d7] focus-visible:outline-2 focus-visible:outline-[#10b981]"
                aria-label="Tutup form"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
              <div>
                <label htmlFor="art-title" className="text-xs font-bold text-[#173e32]">
                  Judul Artikel / Panduan *
                </label>
                <input
                  id="art-title"
                  type="text"
                  required
                  value={draft.judul}
                  onChange={(e) => setDraft({ ...draft, judul: e.target.value })}
                  placeholder="Contoh: Protokol Tanggap Darurat Kekeringan Padi Sawah"
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-[#173e32]/20 bg-white px-3 text-xs sm:text-sm text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]"
                />
              </div>

              <div>
                <label htmlFor="art-category" className="text-xs font-bold text-[#173e32]">
                  Kategori Materi *
                </label>
                <select
                  id="art-category"
                  value={draft.kategori}
                  onChange={(e) => setDraft({ ...draft, kategori: e.target.value })}
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-[#173e32]/20 bg-white px-3 text-xs sm:text-sm text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]"
                >
                  <option value="Mitigasi Lapangan">Mitigasi Lapangan</option>
                  <option value="Panduan Teknis">Panduan Teknis</option>
                  <option value="SOP Verifikasi">SOP Verifikasi</option>
                  <option value="Manajemen Pertanian">Manajemen Pertanian</option>
                  <option value="Edukasi Publik">Edukasi Publik</option>
                </select>
              </div>

              <div>
                <label htmlFor="art-author" className="text-xs font-bold text-[#173e32]">
                  Penulis
                </label>
                <input
                  id="art-author"
                  type="text"
                  value={draft.penulis}
                  onChange={(e) => setDraft({ ...draft, penulis: e.target.value })}
                  placeholder="Admin"
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-[#173e32]/20 bg-white px-3 text-xs sm:text-sm text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]"
                />
                <p className="mt-1 text-[11px] text-[#557267]">
                  Kosongkan untuk memakai nama default Admin.
                </p>
              </div>

              <div>
                <label htmlFor="art-thumb" className="text-xs font-bold text-[#173e32]">
                  URL Gambar Berita (Opsional)
                </label>
                <input
                  id="art-thumb"
                  type="url"
                  value={draft.thumbnailUrl}
                  onChange={(e) => setDraft({ ...draft, thumbnailUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-[#173e32]/20 bg-white px-3 text-xs sm:text-sm text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]"
                />
                <p className="mt-1 text-[11px] text-[#557267]">
                  Opsional. Tanpa gambar, kartu dan halaman baca tetap tampil berbasis teks.
                </p>
              </div>

              <div>
                <label htmlFor="art-content" className="text-xs font-bold text-[#173e32]">
                  Isi Artikel & Panduan Lengkap *
                </label>
                <textarea
                  id="art-content"
                  required
                  rows={8}
                  value={draft.isi}
                  onChange={(e) => setDraft({ ...draft, isi: e.target.value })}
                  placeholder="Tuliskan rekomendasi praktis, langkah-langkah mitigasi di lapangan, atau panduan teknis yang mudah dipahami oleh petugas PPL dan petani..."
                  className="mt-1.5 w-full rounded-lg border border-[#173e32]/20 bg-white p-3 text-xs sm:text-sm text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-[#173e32]/10 pt-4">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="min-h-11 rounded-lg px-4 text-xs font-semibold text-[#36564a] hover:bg-[#dce7d7] transition-colors focus-visible:outline-2 focus-visible:outline-[#10b981]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-11 rounded-lg bg-[#173e32] px-5 text-xs font-bold text-[#f5f1e8] hover:bg-[#245542] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10b981]"
                >
                  {editingId ? "Perbarui Artikel" : "Terbitkan Artikel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Article Modal */}
      {previewArticle && (
        <div
          className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-[#091b15]/65 p-0 sm:p-4 backdrop-blur-xs"
          role="presentation"
          onMouseDown={() => setPreviewArticle(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-title"
            className="w-full max-w-xl rounded-t-2xl sm:rounded-xl border border-[#173e32]/20 bg-white shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#173e32]/10 p-5">
              <div>
                <span className="text-[11px] font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded">
                  {previewArticle.kategori}
                </span>
                <h3 id="preview-title" className="mt-2 font-serif text-xl font-bold text-[#173e32]">
                  {previewArticle.judul}
                </h3>
                <p className="text-xs text-[#557267]">
                  Ditulis oleh {previewArticle.penulis || "Admin"} · {previewArticle.diperbaruiPada}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                className="grid size-11 place-items-center rounded-lg text-[#36564a] hover:bg-[#dce7d7]"
                aria-label="Tutup pratinjau"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6 text-xs sm:text-sm leading-relaxed text-[#36564a] space-y-4">
              {previewArticle.thumbnailUrl && (
                <div className="overflow-hidden rounded-lg max-h-56">
                  <img src={previewArticle.thumbnailUrl} alt="" className="size-full object-cover" />
                </div>
              )}
              <p className="whitespace-pre-line">{previewArticle.isi}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#091b15]/65 p-4 backdrop-blur-xs"
          role="presentation"
          onMouseDown={() => setDeleteId(null)}
        >
          <div
            role="alertdialog"
            className="w-full max-w-md rounded-xl border border-[#991b1b]/20 bg-white p-5 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h4 className="font-serif text-lg font-bold text-[#991b1b]">Konfirmasi Hapus Artikel</h4>
            <p className="mt-2 text-xs sm:text-sm text-[#557267] leading-relaxed">
              Apakah Anda yakin ingin menghapus artikel panduan ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="min-h-10 rounded-lg px-4 text-xs font-semibold text-[#36564a] hover:bg-[#dce7d7]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                className="min-h-10 rounded-lg bg-[#991b1b] px-4 text-xs font-bold text-white hover:bg-[#7f1d1d]"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
