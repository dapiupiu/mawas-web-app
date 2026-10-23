import { useState, useMemo } from "react";
import { 
  Wheat, 
  Plus, 
  Search, 
  Droplet, 
  Trash2, 
  Calendar, 
  FileSpreadsheet
} from "lucide-react";
import type { ProductionRecord } from "@/types/dashboard";

interface ProductionDataViewProps {
  productions: ProductionRecord[];
  onOpenAddModal: () => void;
  onDeleteRecord: (id: string) => void;
}

export function ProductionDataView({
  productions,
  onOpenAddModal,
  onDeleteRecord,
}: ProductionDataViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [commodityFilter, setCommodityFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return productions.filter((item) => {
      const matchSearch = item.namaKabupaten.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.petugasPelapor.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (commodityFilter === "all") return true;
      return item.komoditas === commodityFilter;
    });
  }, [productions, searchQuery, commodityFilter]);

  const totalLuas = useMemo(() => {
    return productions.reduce((acc, curr) => acc + curr.luasLahanHa, 0);
  }, [productions]);

  const totalPanen = useMemo(() => {
    return productions.reduce((acc, curr) => acc + curr.estimasiPanenTon, 0);
  }, [productions]);

  return (
    <div className="space-y-5">
      {/* Top Banner with Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#173e32]/12 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#557267]">
            <span>Total Luas Terdata</span>
            <Wheat className="size-4 text-[#173e32]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-[#173e32]">
              {totalLuas.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-[#557267]">Hektare (Ha)</span>
          </div>
          <p className="mt-1 text-[11px] text-[#36564a]">
            Cakupan sentra pangan padi dan palawija aktif.
          </p>
        </div>

        <div className="rounded-2xl border border-[#173e32]/12 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#557267]">
            <span>Estimasi Produksi Panen</span>
            <FileSpreadsheet className="size-4 text-[#166534]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-[#166534]">
              {totalPanen.toLocaleString("id-ID")}
            </span>
            <span className="text-xs text-[#557267]">Ton Gabah/Pipilan</span>
          </div>
          <p className="mt-1 text-[11px] text-[#36564a]">
            Berdasarkan produktivitas riil per hektare.
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#173e32]/12 bg-[#173e32] p-4 text-[#f5f1e8] shadow-2xs">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#dce7d7]">
              Pencatatan Lapangan (F03)
            </span>
            <p className="mt-1 text-xs text-[#dce7d7]">
              Input data berkala dari Petugas Penyuluh Lapangan (PPL) dan Mantri Tani.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-[#173e32] hover:bg-[#dce7d7] transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16]"
          >
            <Plus className="size-4" />
            <span>Tambah Data Produksi Baru</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 size-4 text-[#557267]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kabupaten atau nama petugas..."
            className="w-full rounded-xl border border-[#173e32]/15 bg-white py-2 pl-9 pr-4 text-xs text-[#173e32] placeholder:text-[#557267] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {["all", "Padi Sawah", "Padi Gogo", "Jagung", "Kedelai"].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCommodityFilter(c)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16] ${
                commodityFilter === c
                  ? "bg-[#173e32] text-[#f5f1e8]"
                  : "border border-[#173e32]/12 bg-white text-[#557267] hover:bg-[#dce7d7]/50 hover:text-[#173e32]"
              }`}
            >
              {c === "all" ? "Semua Komoditas" : c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#173e32]/12 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#173e32]/10 bg-[#fbfaf5] text-[#557267]">
                <th className="py-3 px-4 font-semibold">Kabupaten</th>
                <th className="py-3 px-4 font-semibold">Komoditas</th>
                <th className="py-3 px-4 font-semibold">Luas Lahan</th>
                <th className="py-3 px-4 font-semibold">Estimasi Panen</th>
                <th className="py-3 px-4 font-semibold">Kondisi Sumber Air</th>
                <th className="py-3 px-4 font-semibold">Tanggal Lapor & Petugas</th>
                <th className="py-3 px-4 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#173e32]/8">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#557267]">
                    Belum ada catatan data produksi yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isKritis = item.kondisiAir === "Defisit Kritis";
                  const isMenipis = item.kondisiAir === "Menipis";

                  return (
                    <tr key={item.id} className="hover:bg-[#f5f1e8]/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#173e32]">
                        {item.namaKabupaten}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 font-medium text-[#173e32]">
                          <Wheat className="size-3.5 text-[#557267]" />
                          {item.komoditas}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-[#36564a]">
                        {item.luasLahanHa.toLocaleString("id-ID")} Ha
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-[#173e32]">
                        {item.estimasiPanenTon.toLocaleString("id-ID")} Ton
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                            isKritis
                              ? "bg-[#bb5b42]/15 text-[#7c1d0f]"
                              : isMenipis
                                ? "bg-[#966a13]/15 text-[#5e4107]"
                                : "bg-[#166534]/15 text-[#166534]"
                          }`}
                        >
                          <Droplet className="size-3" />
                          {item.kondisiAir}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="text-[11px] font-medium text-[#173e32]">
                          {item.petugasPelapor}
                        </p>
                        <p className="flex items-center gap-1 text-[10px] text-[#557267]">
                          <Calendar className="size-3" />
                          {item.tanggalLapor}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteRecord(item.id)}
                          className="grid size-7 place-items-center rounded-lg text-[#557267] hover:bg-[#bb5b42]/10 hover:text-[#bb5b42] transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16]"
                          title="Hapus rekaman"
                          aria-label={`Hapus data ${item.namaKabupaten}`}
                        >
                          <Trash2 className="size-3.5" />
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
