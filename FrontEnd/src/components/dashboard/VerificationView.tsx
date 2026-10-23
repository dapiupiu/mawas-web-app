import { useState, useMemo } from "react";
import { 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Satellite, 
  SlidersHorizontal,
  CloudRain
} from "lucide-react";
import type { PredictionItem, RiskLevel } from "@/types/dashboard";

interface VerificationViewProps {
  predictions: PredictionItem[];
  onOpenVerifyModal: (item: PredictionItem) => void;
}

export function VerificationView({
  predictions,
  onOpenVerifyModal,
}: VerificationViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RiskLevel | "menunggu">("all");

  const filteredItems = useMemo(() => {
    return predictions.filter((item) => {
      const matchSearch = item.namaKabupaten.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.kodeKabupaten.includes(searchQuery);
      if (!matchSearch) return false;

      if (statusFilter === "all") return true;
      if (statusFilter === "menunggu") return item.statusVerifikasi === "menunggu";
      return item.kategori === statusFilter;
    });
  }, [predictions, searchQuery, statusFilter]);

  const pendingCount = predictions.filter((p) => p.statusVerifikasi === "menunggu").length;

  return (
    <div className="space-y-5">
      {/* Overview Intro Card */}
      <div className="rounded-2xl border border-[#173e32]/12 bg-white p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Satellite className="size-4 text-[#173e32]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#557267]">
                Model Prediksi Risiko (F02 & F04)
              </span>
            </div>
            <h2 className="mt-1 font-serif text-xl font-bold text-[#173e32]">
              Daftar Tugas Verifikasi & Koreksi Lapangan
            </h2>
            <p className="mt-1 text-xs text-[#36564a]">
              Operator memiliki wewenang memvalidasi atau mengoreksi prediksi otomatis AI jika terdapat faktor mitigasi irigasi lokal.
            </p>
          </div>

          {pendingCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-[#966a13]/30 bg-[#966a13]/10 px-3.5 py-2 text-xs text-[#5e4107]">
              <Clock className="size-4 shrink-0 text-[#966a13]" />
              <div>
                <p className="font-bold">{pendingCount} Wilayah Menunggu</p>
                <p className="text-[11px] text-[#5e4107]/80">Perlu konfirmasi laporan penyuluh</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 size-4 text-[#557267]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kabupaten atau kode wilayah..."
            className="w-full rounded-xl border border-[#173e32]/15 bg-white py-2 pl-9 pr-4 text-xs text-[#173e32] placeholder:text-[#557267] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <SlidersHorizontal className="size-3.5 text-[#557267] mr-1 hidden sm:block" />
          {[
            { id: "all", label: "Semua" },
            { id: "menunggu", label: `Menunggu (${pendingCount})` },
            { id: "kritis", label: "Kritis" },
            { id: "waspada", label: "Waspada" },
            { id: "normal", label: "Normal" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16] ${
                statusFilter === tab.id
                  ? "bg-[#173e32] text-[#f5f1e8]"
                  : "border border-[#173e32]/12 bg-white text-[#557267] hover:bg-[#dce7d7]/50 hover:text-[#173e32]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-[#173e32]/12 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#173e32]/10 bg-[#fbfaf5] text-[#557267]">
                <th className="py-3 px-4 font-semibold">Kabupaten</th>
                <th className="py-3 px-4 font-semibold">Skor Risiko (AI / Final)</th>
                <th className="py-3 px-4 font-semibold">Anomali FAPAR</th>
                <th className="py-3 px-4 font-semibold">Curah Hujan (30h)</th>
                <th className="py-3 px-4 font-semibold">Status Verifikasi</th>
                <th className="py-3 px-4 font-semibold">Catatan Lapangan</th>
                <th className="py-3 px-4 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#173e32]/8">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#557267]">
                    Tidak ada data kabupaten yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isKritis = item.kategori === "kritis";
                  const isWaspada = item.kategori === "waspada";
                  const displayScore = item.skorOverride ?? item.skorRisiko;

                  return (
                    <tr key={item.id} className="hover:bg-[#f5f1e8]/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#173e32]">
                        {item.namaKabupaten}
                        <span className="block text-[10px] font-mono font-normal text-[#557267]">
                          Kode: {item.kodeKabupaten}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                              isKritis
                                ? "bg-[#bb5b42]/15 text-[#7c1d0f]"
                                : isWaspada
                                  ? "bg-[#966a13]/15 text-[#5e4107]"
                                  : "bg-[#166534]/15 text-[#166534]"
                            }`}
                          >
                            {displayScore.toFixed(2)} ({isKritis ? "Kritis" : isWaspada ? "Waspada" : "Normal"})
                          </span>
                          {item.skorOverride !== undefined && (
                            <span className="text-[10px] text-[#966a13] font-semibold" title={`Skor AI awal: ${item.skorRisiko}`}>
                              (Koreksi)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[#36564a]">
                        {item.faparAnomaly > 0 ? `+${item.faparAnomaly}` : item.faparAnomaly}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-[#36564a]">
                          <CloudRain className="size-3.5 text-[#557267]" />
                          <span>{item.curahHujanMm} mm</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {item.statusVerifikasi === "tervalidasi" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#166534]">
                            <CheckCircle2 className="size-3.5" />
                            Tervalidasi
                          </span>
                        ) : item.statusVerifikasi === "dikoreksi" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#966a13]">
                            <Clock className="size-3.5" />
                            Dikoreksi Operator
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7c1d0f]">
                            <AlertTriangle className="size-3.5" />
                            Menunggu Review
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-[11px] text-[#557267]">
                        {item.catatanOperator || "(Belum ada catatan)"}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenVerifyModal(item)}
                          className="rounded-lg border border-[#173e32]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#173e32] hover:bg-[#dce7d7] transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16]"
                        >
                          Review & Koreksi
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
