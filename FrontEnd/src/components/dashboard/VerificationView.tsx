import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, ClipboardCheck, Clock, Loader2, Search, ShieldCheck } from "lucide-react";
import type { PredictionItem, RiskLevel, VerificationStatus } from "@/types/dashboard";

const PAGE_SIZE = 30;

interface VerificationViewProps {
  predictions: PredictionItem[];
  onOpenVerifyModal: (item: PredictionItem) => void;
}

const riskLabels: Record<RiskLevel, { label: string; badgeClass: string }> = {
  kritis: {
    label: "Risiko Tinggi",
    badgeClass: "bg-[#991b1b]/10 text-[#991b1b] border-[#991b1b]/30",
  },
  waspada: {
    label: "Perlu Perhatian",
    badgeClass: "bg-[#b45309]/10 text-[#b45309] border-[#b45309]/30",
  },
  normal: {
    label: "Normal",
    badgeClass: "bg-[#166534]/10 text-[#166534] border-[#166534]/30",
  },
  tidak_tersedia: {
    label: "Data Tidak Tersedia",
    badgeClass: "bg-gray-200 text-gray-700 border-gray-300",
  },
};

const verificationLabels: Record<VerificationStatus, { label: string; class: string; icon: typeof CheckCircle2 }> = {
  terverifikasi: {
    label: "Terverifikasi",
    class: "text-[#166534] bg-[#166534]/10 border-[#166534]/25",
    icon: CheckCircle2,
  },
  perlu_cek: {
    label: "Perlu Cek Lapangan",
    class: "text-[#b45309] bg-[#b45309]/10 border-[#b45309]/25",
    icon: CircleAlert,
  },
  menunggu: {
    label: "Menunggu Review",
    class: "text-[#557267] bg-[#557267]/10 border-[#557267]/25",
    icon: Clock,
  },
};

export function VerificationView({ predictions, onOpenVerifyModal }: VerificationViewProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VerificationStatus>("all");
  const [riskFilter, setRiskFilter] = useState<"all" | RiskLevel>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    return predictions.filter((item) => {
      const q = query.toLowerCase().trim();
      const matchQuery = !q || item.namaKabupaten.toLowerCase().includes(q) ||
        item.kodeKabupaten.toLowerCase().includes(q) ||
        item.provinsi.toLowerCase().includes(q);

      const matchStatus = statusFilter === "all" || item.statusVerifikasi === statusFilter;
      const matchRisk = riskFilter === "all" || item.kategori === riskFilter;

      return matchQuery && matchStatus && matchRisk;
    });
  }, [predictions, query, statusFilter, riskFilter]);

  // Reset visible count whenever filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, statusFilter, riskFilter]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredItems.length));
  }, [filteredItems.length]);

  // Sentinel IntersectionObserver — loads next batch when bottom sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;

  const pendingCount = predictions.filter((p) => p.statusVerifikasi === "menunggu").length;
  const verifiedCount = predictions.filter((p) => p.statusVerifikasi === "terverifikasi").length;
  const needCheckCount = predictions.filter((p) => p.statusVerifikasi === "perlu_cek").length;

  return (
    <div className="space-y-5">
      {/* Bio-Tech Telemetry Banner */}
      <section className="rounded-xl border border-[#173e32]/12 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#10b981]">
              <ClipboardCheck className="size-4" />
              <span>Modul Verifikasi Lapangan</span>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-[#173e32]">
              Pusat Verifikasi Kondisi Lapangan
            </h2>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-[#557267]">
              Skor risiko bersumber dari model satelit dan bersifat tetap (read-only). Operator mencatat konfirmasi kondisi riil tanaman, saluran irigasi, serta catatan penyuluh di lapangan.
            </p>
          </div>

          {/* Quick Verification Counter Bar */}
          <div className="flex flex-wrap items-center gap-2 border-t sm:border-t-0 sm:border-l sm:pl-5 border-[#173e32]/10 pt-3 sm:pt-0">
            <div className="rounded-lg border border-[#b45309]/30 bg-[#fef3c7] px-3 py-2 text-left">
              <span className="block font-mono text-lg font-bold text-[#b45309]">{pendingCount}</span>
              <span className="text-[11px] font-semibold text-[#78350f]">Menunggu Review</span>
            </div>
            <div className="rounded-lg border border-[#166534]/30 bg-[#dcfce7] px-3 py-2 text-left">
              <span className="block font-mono text-lg font-bold text-[#166534]">{verifiedCount}</span>
              <span className="text-[11px] font-semibold text-[#14532d]">Terverifikasi</span>
            </div>
            <div className="rounded-lg border border-[#173e32]/15 bg-[#f5f1e8] px-3 py-2 text-left">
              <span className="block font-mono text-lg font-bold text-[#173e32]">{needCheckCount}</span>
              <span className="text-[11px] font-semibold text-[#557267]">Perlu Cek</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#173e32]/12 bg-white p-3.5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#557267]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari kabupaten, provinsi, atau kode..."
            className="min-h-11 w-full rounded-lg border border-[#173e32]/15 bg-[#fbfaf6] py-2 pl-9 pr-3 text-xs sm:text-sm text-[#173e32] placeholder:text-[#557267] focus-visible:outline-2 focus-visible:outline-[#10b981]"
          />
        </label>

        {/* Status & Risk Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="inline-flex rounded-lg border border-[#173e32]/15 bg-[#fbfaf6] p-0.5 text-xs font-semibold">
            {(["all", "menunggu", "terverifikasi", "perlu_cek"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`min-h-9 px-2.5 rounded-md transition-colors ${
                  statusFilter === st
                    ? "bg-[#173e32] text-[#f5f1e8] shadow-sm"
                    : "text-[#557267] hover:text-[#173e32]"
                }`}
              >
                {st === "all" ? "Semua Status" : st === "menunggu" ? "Menunggu" : st === "terverifikasi" ? "Terverifikasi" : "Perlu Cek"}
              </button>
            ))}
          </div>

          {/* Risk Level Filter Dropdown */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as any)}
            className="min-h-10 rounded-lg border border-[#173e32]/15 bg-[#fbfaf6] px-3 text-xs font-semibold text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]"
            aria-label="Filter Tingkat Risiko"
          >
            <option value="all">Semua Tingkat Risiko</option>
            <option value="kritis">Risiko Tinggi (Kritis)</option>
            <option value="waspada">Perlu Perhatian (Waspada)</option>
            <option value="normal">Normal</option>
            <option value="tidak_tersedia">Data Tidak Tersedia</option>
          </select>
        </div>
      </div>

      {/* Result counter */}
      {filteredItems.length > 0 && (
        <p className="text-xs text-[#557267] px-1">
          Menampilkan <span className="font-semibold text-[#173e32]">{visibleItems.length}</span> dari{" "}
          <span className="font-semibold text-[#173e32]">{filteredItems.length}</span> kabupaten
        </p>
      )}

      {/* Main Verification Table / List */}
      <section className="overflow-hidden rounded-xl border border-[#173e32]/12 bg-white shadow-sm">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardCheck className="mx-auto size-8 text-[#557267]/60" />
            <p className="mt-2 text-sm font-semibold text-[#173e32]">Tidak ada kabupaten yang cocok</p>
            <p className="mt-1 text-xs text-[#557267]">Coba ubah kata kunci pencarian atau reset filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#173e32]/10">
            {visibleItems.map((item) => {
              const rMeta = riskLabels[item.kategori];
              const vMeta = verificationLabels[item.statusVerifikasi];
              const VIcon = vMeta.icon;

              return (
                <article
                  key={item.id}
                  className="grid gap-3.5 p-4 sm:p-5 transition-colors hover:bg-[#fbfaf6] sm:grid-cols-[minmax(0,1.2fr)_auto] sm:items-center"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-base sm:text-lg font-bold text-[#173e32]">
                        {item.namaKabupaten}
                      </h3>
                      <span className="font-mono text-[11px] text-[#557267] bg-[#f5f1e8] px-1.5 py-0.5 rounded border border-[#173e32]/10">
                        {item.kodeKabupaten}
                      </span>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${rMeta.badgeClass}`}>
                        {item.skorRisiko !== null ? `Skor ${item.skorRisiko.toFixed(2)}` : "Data Kosong"} — {rMeta.label}
                      </span>
                    </div>

                    <p className="text-xs text-[#557267]">
                      {item.provinsi} · Pembaruan satelit: {item.terakhirDiperbarui}
                    </p>

                    <div className="mt-2 rounded-lg border border-[#173e32]/10 bg-[#f9f8f4] p-2.5 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#557267]">
                        <span>Catatan Lapangan Terakhir:</span>
                        {item.diverifikasiOleh && (
                          <span className="text-[10px] text-[#166534]">Oleh: {item.diverifikasiOleh}</span>
                        )}
                      </div>
                      <p className="mt-1 text-[#36564a] leading-relaxed">
                        {item.catatanOperator || "Belum ada catatan lapangan. Klik tombol di kanan untuk mengisi hasil pengamatan PPL."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end sm:justify-center">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${vMeta.class}`}>
                      <VIcon className="size-3.5" />
                      <span>{vMeta.label}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => onOpenVerifyModal(item)}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#173e32]/25 bg-white px-3.5 py-2 text-xs font-bold text-[#173e32] hover:bg-[#173e32] hover:text-[#f5f1e8] transition-colors focus-visible:outline-2 focus-visible:outline-[#10b981]"
                    >
                      <ShieldCheck className="size-3.5" />
                      <span>Catat Verifikasi</span>
                    </button>
                  </div>
                </article>
              );
            })}

            {/* Sentinel — triggers next batch load */}
            <div ref={sentinelRef} aria-hidden="true" className="flex items-center justify-center py-6">
              {hasMore ? (
                <span className="inline-flex items-center gap-2 text-xs text-[#557267]">
                  <Loader2 className="size-4 animate-spin text-[#10b981]" />
                  Memuat lebih banyak data…
                </span>
              ) : (
                <span className="text-xs text-[#557267]/60">Semua {filteredItems.length} kabupaten telah ditampilkan</span>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
