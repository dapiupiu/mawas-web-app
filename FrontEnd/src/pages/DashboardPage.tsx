import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { 
  AlertTriangle, 
  ClipboardCheck, 
  FileText, 
  MapPinned, 
  ShieldCheck, 
  ArrowRight,
  BookOpen,
  Calendar
} from "lucide-react";
import { authApi, getStoredUser, type StoredUser } from "@/lib/api";
import type { DashboardTab, KnowledgeArticle, PredictionItem, ManagedUser } from "@/types/dashboard";
import { 
  getDashboardArticles, 
  getDashboardPredictions, 
  saveDashboardArticles, 
  saveDashboardPredictions,
  getDashboardModelMeta,
  saveDashboardModelMeta,
  parseModelJsonToPredictions,
  getDashboardUsers,
  saveDashboardUsers,
  type ModelMetadata
} from "@/lib/dashboardData";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { VerificationView } from "@/components/dashboard/VerificationView";
import { VerifyPredictionModal } from "@/components/dashboard/VerifyPredictionModal";
import { ReportsView } from "@/components/dashboard/ReportsView";
import { ArticlesView } from "@/components/dashboard/ArticlesView";
import { UploadModelView } from "@/components/dashboard/UploadModelView";
import { UserManagementView } from "@/components/dashboard/UserManagementView";

export function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [tab, setTab] = useState<DashboardTab>("ringkasan");
  const [menuOpen, setMenuOpen] = useState(false);
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [selected, setSelected] = useState<PredictionItem | null>(null);
  const [modelMeta, setModelMeta] = useState<ModelMetadata>(getDashboardModelMeta());

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      authApi.logout();
      navigate("/signin", { replace: true });
      return;
    }
    setUser(stored);

    const initialPreds = getDashboardPredictions();
    setPredictions(initialPreds);
    setArticles(getDashboardArticles());
    setUsers(getDashboardUsers());
    setModelMeta(getDashboardModelMeta());

    // Proactively hydrate full 514 dataset if user only had initial demo items
    if (initialPreds.length < 20) {
      fetch("/data/risiko_kabupaten_terbaru.json")
        .then((res) => {
          if (!res.ok) return null;
          return res.json();
        })
        .then((json) => {
          if (json) {
            const { predictions: parsed, metadata } = parseModelJsonToPredictions(json);
            setPredictions(parsed);
            saveDashboardPredictions(parsed);
            setModelMeta(metadata);
            saveDashboardModelMeta(metadata);
          }
        })
        .catch(() => {
          // Keep existing initial predictions on fetch failure
        });
    }
  }, [navigate]);

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8f7f2] text-sm font-semibold text-[#36564a]">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#10b981] animate-ping" />
          <span>Memuat ruang kerja telemetri Mawas...</span>
        </div>
      </main>
    );
  }

  const critical = predictions.filter((item) => item.kategori === "kritis");
  const warning = predictions.filter((item) => item.kategori === "waspada");
  const pending = predictions.filter((item) => item.statusVerifikasi === "menunggu");
  const verified = predictions.filter((item) => item.statusVerifikasi === "terverifikasi");

  const changeArticles = (next: KnowledgeArticle[]) => {
    setArticles(next);
    saveDashboardArticles(next);
  };

  const saveVerification = (next: PredictionItem) => {
    const updated = predictions.map((item) => (item.id === next.id ? next : item));
    setPredictions(updated);
    saveDashboardPredictions(updated);
  };

  const handleModelUpdated = (newPreds: PredictionItem[], meta: ModelMetadata) => {
    setPredictions(newPreds);
    saveDashboardPredictions(newPreds);
    setModelMeta(meta);
    saveDashboardModelMeta(meta);
  };

  const handleUsersChange = (nextUsers: ManagedUser[]) => {
    setUsers(nextUsers);
    saveDashboardUsers(nextUsers);
  };

  return (
    <div className="flex min-h-screen bg-[#f8f7f2] text-[#173e32]">
      {/* Bio-tech Sidebar */}
      <DashboardSidebar
        activeTab={tab}
        onSelectTab={setTab}
        user={user}
        onLogout={() => {
          authApi.logout();
          navigate("/signin");
        }}
        isOpenMobile={menuOpen}
        onCloseMobile={() => setMenuOpen(false)}
        pendingTaskCount={pending.length}
        criticalCount={critical.length}
      />

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 flex flex-col">
        <DashboardHeader
          activeTab={tab}
          onOpenMobileMenu={() => setMenuOpen(true)}
          user={user}
          predictions={predictions}
          onSelectPrediction={(item) => {
            setSelected(item);
            setTab("verifikasi");
          }}
          onExportData={() => setTab("laporan")}
        />

        <main className="mx-auto w-full max-w-screen-2xl px-4 py-4 pb-12 sm:px-5 sm:py-5 lg:px-6 lg:py-6 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {/* 1. Ringkasan Eksekutif Wilayah (SS 4) */}
              {tab === "ringkasan" && (
                <div className="space-y-6">
                  {/* Hero Executive Card with Giant "Buat Laporan" Button */}
                  <section className="grid gap-6 rounded-2xl border border-[#173e32]/15 bg-white p-6 sm:p-8 lg:grid-cols-[1.3fr_0.9fr] shadow-sm">
                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-[#10b981] animate-pulse" />
                          <p className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
                            Ringkasan Eksekutif Wilayah
                          </p>
                        </div>

                        <h1 className="mt-2.5 font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#173e32]">
                          Peringatan Dini Siap Ditindaklanjuti.
                        </h1>

                        <p className="mt-3 max-w-xl text-xs sm:text-sm leading-relaxed text-[#557267]">
                          Pantau sinyal stres vegetasi satelit FAPAR, konfirmasi kondisi fisik lapangan melalui verifikasi PPL, lalu buat laporan resmi untuk dasar rekomendasi darurat kekeringan.
                        </p>
                      </div>

                      {/* Highlight Utama: Tombol Besar Buat Laporan Peringatan Dini */}
                      <div className="mt-6 pt-2">
                        <button
                          type="button"
                          onClick={() => setTab("laporan")}
                          className="inline-flex min-h-12 w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl bg-[#173e32] px-6 text-sm font-bold text-[#f5f1e8] shadow-md hover:bg-[#245542] hover:shadow-lg transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10b981]"
                        >
                          <FileText className="size-5 text-[#34d399]" />
                          <span>Buat Laporan Peringatan Dini</span>
                          <ArrowRight className="size-4" />
                        </button>
                        <p className="mt-2 text-[11px] text-[#557267]">
                          Menghasilkan dokumen resmi ringkasan risiko & verifikasi siap cetak/PDF.
                        </p>
                      </div>
                    </div>

                    {/* Ringkasan Pasif Telemetri Satelit (NO Misleading Review Button) */}
                    <div className="flex flex-col justify-between rounded-xl border border-[#b45309]/30 bg-[#fef3c7]/60 p-5 sm:p-6">
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#92400e]">
                            Status Prediksi Risiko Satelit
                          </p>
                          <span className="font-mono text-[10px] font-bold text-[#92400e] bg-[#fef3c7] px-2 py-0.5 rounded border border-[#b45309]/20">
                            FAPAR 30 Hari
                          </span>
                        </div>

                        <div className="mt-4 flex items-baseline gap-2">
                          <p className="font-mono text-4xl sm:text-5xl font-bold text-[#991b1b]">
                            {critical.length}
                          </p>
                          <p className="text-sm font-bold text-[#991b1b]">
                            Kabupaten Risiko Tinggi
                          </p>
                        </div>

                        <div className="mt-4 space-y-2 border-t border-[#b45309]/20 pt-3 text-xs text-[#78350f]">
                          <div className="flex items-center justify-between">
                            <span>Belum Diverifikasi Lapangan:</span>
                            <strong className="font-mono text-sm text-[#92400e]">{pending.length} Kabupaten</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Telah Terverifikasi Lapangan:</span>
                            <strong className="font-mono text-sm text-[#166534]">{verified.length} Kabupaten</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Status Peringatan Waspada:</span>
                            <strong className="font-mono text-sm text-[#b45309]">{warning.length} Kabupaten</strong>
                          </div>
                        </div>
                      </div>

                      {/* Passive Telemetry Timestamp */}
                      <div className="mt-4 rounded-lg bg-white/70 p-2.5 text-[11px] text-[#557267] border border-[#b45309]/15">
                        <div className="flex items-center gap-1.5 font-semibold text-[#173e32]">
                          <Calendar className="size-3.5 text-[#10b981]" />
                          <span>Tanggal Acuan Model: {modelMeta.tanggalAcuan}</span>
                        </div>
                        <p className="mt-0.5 text-[10px]">
                          Cakupan {predictions.length} kabupaten/kota se-Indonesia.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Operational Action Tiles Grid */}
                  <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Tile 1: Pusat Verifikasi */}
                    <button
                      type="button"
                      onClick={() => setTab("verifikasi")}
                      className="group rounded-xl border border-[#173e32]/12 bg-white p-5 text-left shadow-sm transition-all hover:border-[#173e32]/30 hover:bg-[#f1f6ef] focus-visible:outline-2 focus-visible:outline-[#10b981]"
                    >
                      <div className="flex items-center justify-between">
                        <ClipboardCheck className="size-5 text-[#173e32] group-hover:text-[#10b981] transition-colors" />
                        <span className="rounded-md bg-[#b45309]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#b45309]">
                          {pending.length} Menunggu
                        </span>
                      </div>
                      <h2 className="mt-3 font-serif text-lg font-bold text-[#173e32]">
                        Pusat Verifikasi
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed text-[#557267]">
                        Catat status dan temuan riil PPL tanpa mengubah skor model.
                      </p>
                    </button>

                    {/* Tile 2: Generator Laporan */}
                    <button
                      type="button"
                      onClick={() => setTab("laporan")}
                      className="group rounded-xl border border-[#173e32]/12 bg-white p-5 text-left shadow-sm transition-all hover:border-[#173e32]/30 hover:bg-[#f1f6ef] focus-visible:outline-2 focus-visible:outline-[#10b981]"
                    >
                      <div className="flex items-center justify-between">
                        <FileText className="size-5 text-[#173e32] group-hover:text-[#10b981] transition-colors" />
                        <span className="rounded-md bg-[#10b981]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#065f46]">
                          Cetak / PDF
                        </span>
                      </div>
                      <h2 className="mt-3 font-serif text-lg font-bold text-[#173e32]">
                        Generator Laporan
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed text-[#557267]">
                        Susun dokumen peringatan dini resmi per wilayah / provinsi.
                      </p>
                    </button>

                    {/* Tile 3: CMS Panduan */}
                    <button
                      type="button"
                      onClick={() => setTab("artikel")}
                      className="group rounded-xl border border-[#173e32]/12 bg-white p-5 text-left shadow-sm transition-all hover:border-[#173e32]/30 hover:bg-[#f1f6ef] focus-visible:outline-2 focus-visible:outline-[#10b981]"
                    >
                      <div className="flex items-center justify-between">
                        <BookOpen className="size-5 text-[#173e32] group-hover:text-[#10b981] transition-colors" />
                        <span className="rounded-md bg-[#173e32]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#173e32]">
                          {articles.length} Panduan
                        </span>
                      </div>
                      <h2 className="mt-3 font-serif text-lg font-bold text-[#173e32]">
                        CMS Panduan
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed text-[#557267]">
                        Kelola SOP mitigasi dan materi literasi risiko untuk publik.
                      </p>
                    </button>

                    {/* Tile 4: Buka Peta Publik */}
                    <a
                      href="/peta-risiko"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group rounded-xl border border-[#173e32]/12 bg-[#dce7d7]/50 p-5 shadow-sm transition-all hover:bg-[#dce7d7] hover:border-[#173e32]/30 focus-visible:outline-2 focus-visible:outline-[#10b981]"
                    >
                      <div className="flex items-center justify-between">
                        <MapPinned className="size-5 text-[#173e32] group-hover:text-[#10b981] transition-colors" />
                        <span className="rounded-md bg-white/80 px-2 py-0.5 font-mono text-[10px] font-bold text-[#173e32]">
                          GIS Spasial
                        </span>
                      </div>
                      <h2 className="mt-3 font-serif text-lg font-bold text-[#173e32]">
                        Peta Publik
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed text-[#36564a]">
                        Inspeksi peta interaktif nasional dan sebaran deviasi spasial.
                      </p>
                    </a>
                  </section>

                  {/* Priority Attention List (Risiko Tinggi Kritis) */}
                  {critical.length > 0 && (
                    <section className="rounded-2xl border border-[#991b1b]/25 bg-white p-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#991b1b]/15 pb-4">
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="size-5 text-[#991b1b]" />
                          <div>
                            <h2 className="font-serif text-lg font-bold text-[#991b1b]">
                              Wilayah Prioritas Pengawasan Tinggi ({critical.length} Kabupaten)
                            </h2>
                            <p className="text-xs text-[#557267]">
                              Menunjukkan indikasi deviasi penyerapan klorofil tanaman terendah pada horizon 30 hari.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setTab("verifikasi")}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#173e32] hover:text-[#10b981] transition-colors self-start sm:self-auto"
                        >
                          <span>Buka Semua di Pusat Verifikasi</span>
                          <ArrowRight className="size-3.5" />
                        </button>
                      </div>

                      {/* Compact Table of Top Critical Areas */}
                      <div className="mt-4 divide-y divide-[#173e32]/8 overflow-x-auto">
                        {critical.slice(0, 6).map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-3 py-3 px-2 rounded-lg hover:bg-[#fbfaf6] transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-serif font-bold text-[#173e32] text-sm">
                                  {item.namaKabupaten}
                                </span>
                                <span className="font-mono text-[10px] text-[#557267] bg-[#f5f1e8] px-1.5 py-0.5 rounded">
                                  {item.kodeKabupaten}
                                </span>
                                <span className="text-xs text-[#557267]">· {item.provinsi}</span>
                              </div>
                              <p className="mt-0.5 text-xs text-[#36564a]">
                                Status:{" "}
                                <strong className={item.statusVerifikasi === "terverifikasi" ? "text-[#166534]" : item.statusVerifikasi === "perlu_cek" ? "text-[#b45309]" : "text-[#78350f]"}>
                                  {item.statusVerifikasi === "terverifikasi" ? "Terverifikasi" : item.statusVerifikasi === "perlu_cek" ? "Perlu Cek" : "Menunggu Review"}
                                </strong>
                                {item.catatanOperator && ` : "${item.catatanOperator}"`}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-[#991b1b] bg-[#991b1b]/10 px-2 py-1 rounded">
                                Skor {item.skorRisiko !== null ? item.skorRisiko.toFixed(2) : "Data Kosong"}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelected(item);
                                  setTab("verifikasi");
                                }}
                                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#173e32]/20 px-3 text-xs font-bold text-[#173e32] hover:bg-[#173e32] hover:text-[#f5f1e8] transition-colors"
                              >
                                <ShieldCheck className="size-3.5" />
                                <span>Verifikasi</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* 2. Modul 1: Pusat Verifikasi */}
              {tab === "verifikasi" && (
                <VerificationView
                  predictions={predictions}
                  onOpenVerifyModal={setSelected}
                />
              )}

              {/* 3. Modul 2: Generator Laporan */}
              {tab === "laporan" && (
                <ReportsView predictions={predictions} />
              )}

              {/* 4. Modul 3: CMS Artikel / Panduan */}
              {tab === "artikel" && (
                <ArticlesView
                  articles={articles}
                  onChange={changeArticles}
                />
              )}

              {/* 5. Modul 4: Upload JSON Baru */}
              {tab === "unggah" && (
                <UploadModelView
                  currentPredictions={predictions}
                  onModelUpdated={handleModelUpdated}
                />
              )}

              {/* 6. Modul Superadmin: Manajemen Akun Pengguna */}
              {tab === "pengguna" && (
                <UserManagementView
                  users={users}
                  onUsersChange={handleUsersChange}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Field Verification Modal */}
      <VerifyPredictionModal
        item={selected}
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        onSave={saveVerification}
      />
    </div>
  );
}
