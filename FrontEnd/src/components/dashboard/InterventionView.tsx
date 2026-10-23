import { useState, useMemo } from "react";
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Activity,
  MapPin
} from "lucide-react";
import type { InterventionItem } from "@/types/dashboard";

interface InterventionViewProps {
  interventions: InterventionItem[];
  onOpenAddModal: () => void;
  onUpdateStatus: (id: string, newStatus: InterventionItem["status"]) => void;
  onDeleteIntervention: (id: string) => void;
}

export function InterventionView({
  interventions,
  onOpenAddModal,
  onUpdateStatus,
  onDeleteIntervention,
}: InterventionViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return interventions.filter((item) => {
      const matchSearch = item.namaProgram.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.kabupatenSasaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.penanggungJawab.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter === "all") return true;
      return item.status === statusFilter;
    });
  }, [interventions, searchQuery, statusFilter]);

  const activeCount = interventions.filter((i) => i.status === "Sedang Berjalan").length;
  const plannedCount = interventions.filter((i) => i.status === "Direncanakan").length;
  const completedCount = interventions.filter((i) => i.status === "Selesai").length;

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#173e32]/12 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#557267]">
            <span>Total Program</span>
            <ShieldAlert className="size-4 text-[#173e32]" />
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-[#173e32]">
            {interventions.length}
          </div>
          <p className="mt-1 text-[11px] text-[#36564a]">Inisiatif mitigasi terdata.</p>
        </div>

        <div className="rounded-2xl border border-[#166534]/30 bg-[#166534]/5 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#166534]">
            <span>Sedang Berjalan</span>
            <Activity className="size-4 text-[#166534]" />
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-[#166534]">
            {activeCount}
          </div>
          <p className="mt-1 text-[11px] text-[#166534]/80">Fokus suplesi air di lapangan.</p>
        </div>

        <div className="rounded-2xl border border-[#966a13]/30 bg-[#966a13]/5 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5e4107]">
            <span>Direncanakan</span>
            <Clock className="size-4 text-[#966a13]" />
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-[#5e4107]">
            {plannedCount}
          </div>
          <p className="mt-1 text-[11px] text-[#5e4107]/80">Menunggu jadwal distribusi logistik.</p>
        </div>

        <div className="rounded-2xl border border-[#173e32]/12 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#557267]">
            <span>Selesai Terealisasi</span>
            <CheckCircle2 className="size-4 text-[#173e32]" />
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-[#173e32]">
            {completedCount}
          </div>
          <p className="mt-1 text-[11px] text-[#36564a]">Infrastruktur beroperasi normal.</p>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 size-4 text-[#557267]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama program, kabupaten, atau PIC..."
            className="w-full rounded-xl border border-[#173e32]/15 bg-white py-2 pl-9 pr-4 text-xs text-[#173e32] placeholder:text-[#557267] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            {["all", "Sedang Berjalan", "Direncanakan", "Selesai"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16] ${
                  statusFilter === st
                    ? "bg-[#173e32] text-[#f5f1e8]"
                    : "border border-[#173e32]/12 bg-white text-[#557267] hover:bg-[#dce7d7]/50 hover:text-[#173e32]"
                }`}
              >
                {st === "all" ? "Semua Status" : st}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#173e32] px-3.5 py-1.5 text-xs font-bold text-[#f5f1e8] hover:bg-[#245542] transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16]"
          >
            <Plus className="size-3.5" />
            <span>Tambah Usulan</span>
          </button>
        </div>
      </div>

      {/* Interventions Card Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#173e32]/12 bg-white p-12 text-center text-xs text-[#557267]">
          Tidak ada program intervensi yang cocok dengan kata kunci pencarian.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const isActive = item.status === "Sedang Berjalan";
            const isDone = item.status === "Selesai";

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-[#173e32]/12 bg-white p-5 shadow-2xs hover:border-[#173e32]/25 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md bg-[#173e32]/8 px-2 py-0.5 text-[10px] font-bold text-[#173e32]">
                      {item.jenis}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteIntervention(item.id)}
                      className="text-[#557267] hover:text-[#bb5b42] p-1 rounded focus-visible:outline-2 focus-visible:outline-[#b97a16]"
                      aria-label="Hapus program intervensi"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <h3 className="mt-2 font-serif text-base font-bold text-[#173e32] leading-snug">
                    {item.namaProgram}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-[#36564a]">
                    <p className="flex items-center gap-1.5 font-medium">
                      <MapPin className="size-3.5 text-[#557267]" />
                      Kab. {item.kabupatenSasaran} ({item.targetUnitAtauHa})
                    </p>
                    <p className="text-[11px] text-[#557267]">
                      Anggaran: <span className="font-semibold text-[#173e32]">{item.anggaranEst}</span>
                    </p>
                    <p className="text-[11px] text-[#557267]">
                      Penanggung Jawab: {item.penanggungJawab}
                    </p>
                    {item.catatan && (
                      <p className="rounded-lg bg-[#f5f1e8] p-2 text-[11px] text-[#36564a] mt-2 italic">
                        "{item.catatan}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#173e32]/10 flex items-center justify-between">
                  <div>
                    <label htmlFor={`status-select-${item.id}`} className="sr-only">
                      Ubah status program
                    </label>
                    <select
                      id={`status-select-${item.id}`}
                      value={item.status}
                      onChange={(e) => onUpdateStatus(item.id, e.target.value as InterventionItem["status"])}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold focus:outline-none ${
                        isActive
                          ? "border-[#166534]/30 bg-[#166534]/10 text-[#166534]"
                          : isDone
                            ? "border-[#173e32]/20 bg-[#173e32]/10 text-[#173e32]"
                            : "border-[#966a13]/30 bg-[#966a13]/10 text-[#5e4107]"
                      }`}
                    >
                      <option value="Direncanakan">Direncanakan</option>
                      <option value="Sedang Berjalan">Sedang Berjalan</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>

                  <span className="text-[10px] text-[#557267]">
                    Mulai: {item.tanggalMulai}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
