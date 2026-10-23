import { useMemo, useState } from "react";
import { 
  FileText, 
  Printer, 
  FileCheck
} from "lucide-react";
import type { PredictionItem, VerificationStatus } from "@/types/dashboard";

interface ReportsViewProps {
  predictions: PredictionItem[];
}

export function ReportsView({ predictions }: ReportsViewProps) {
  const [province, setProvince] = useState("Semua Provinsi");
  const [riskFilter, setRiskFilter] = useState<"kritis" | "kritis_waspada" | "semua">("kritis");
  const [verificationFilter, setVerificationFilter] = useState<"semua" | VerificationStatus>("semua");
  const [generated, setGenerated] = useState(true);

  // Extract unique provinces
  const provinces = useMemo(() => {
    const list = Array.from(new Set(predictions.map((p) => p.provinsi).filter(Boolean))).sort();
    return ["Semua Provinsi", ...list];
  }, [predictions]);

  // Filter items for report
  const reportItems = useMemo(() => {
    return predictions.filter((item) => {
      const matchProv = province === "Semua Provinsi" || item.provinsi === province;
      
      let matchRisk = true;
      if (riskFilter === "kritis") {
        matchRisk = item.kategori === "kritis";
      } else if (riskFilter === "kritis_waspada") {
        matchRisk = item.kategori === "kritis" || item.kategori === "waspada";
      }

      let matchVerif = true;
      if (verificationFilter !== "semua") {
        matchVerif = item.statusVerifikasi === verificationFilter;
      }

      return matchProv && matchRisk && matchVerif;
    });
  }, [predictions, province, riskFilter, verificationFilter]);

  // Aggregate stats
  const totalItems = reportItems.length;
  const verifiedCount = reportItems.filter((i) => i.statusVerifikasi === "terverifikasi").length;
  const criticalCount = reportItems.filter((i) => i.kategori === "kritis").length;

  const docNumber = useMemo(() => {
    const today = new Date();
    return `MAWAS-PD/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${Math.floor(1000 + Math.random() * 9000)}`;
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <section className="print:hidden rounded-xl border border-[#173e32]/15 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#10b981]">
          <FileText className="size-4" />
          <span>Modul Generator Laporan</span>
        </div>
        <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#173e32]">
          Generator Laporan Peringatan Dini
        </h2>
        <p className="mt-2 max-w-2xl text-xs sm:text-sm text-[#557267] leading-relaxed">
          Sintesis data prediksi deviasi vegetasi satelit dan konfirmasi catatan lapangan menjadi dokumen peringatan dini resmi untuk dinas pertanian atau BPBD wilayah.
        </p>

        {/* Filter Selection Grid */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {/* Province Filter */}
          <div>
            <label htmlFor="filter-prov" className="text-xs font-bold text-[#173e32]">
              Cakupan Wilayah / Provinsi
            </label>
            <select
              id="filter-prov"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-lg border border-[#173e32]/20 bg-[#fbfaf6] px-3 text-xs sm:text-sm text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]"
            >
              {provinces.map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <label htmlFor="filter-risk" className="text-xs font-bold text-[#173e32]">
              Tingkat Risiko
            </label>
            <select
              id="filter-risk"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="mt-1.5 min-h-11 w-full rounded-lg border border-[#173e32]/20 bg-[#fbfaf6] px-3 text-xs sm:text-sm text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]"
            >
              <option value="kritis">Hanya Risiko Tinggi (Kritis)</option>
              <option value="kritis_waspada">Risiko Tinggi & Waspada</option>
              <option value="semua">Semua Tingkat Risiko</option>
            </select>
          </div>

          {/* Verification Status Filter */}
          <div>
            <label htmlFor="filter-verif" className="text-xs font-bold text-[#173e32]">
              Status Verifikasi Lapangan
            </label>
            <select
              id="filter-verif"
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value as any)}
              className="mt-1.5 min-h-11 w-full rounded-lg border border-[#173e32]/20 bg-[#fbfaf6] px-3 text-xs sm:text-sm text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#10b981]"
            >
              <option value="semua">Semua Status (Termasuk Menunggu)</option>
              <option value="terverifikasi">Hanya yang Terverifikasi Lapangan</option>
              <option value="perlu_cek">Hanya yang Perlu Cek</option>
            </select>
          </div>
        </div>

        {/* Generate / Action Buttons */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#173e32]/10 pt-4">
          <div className="text-xs text-[#557267]">
            Ditemukan <strong className="text-[#173e32]">{totalItems}</strong> kabupaten sesuai kriteria filter.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGenerated(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#173e32] px-4 text-xs font-bold text-[#f5f1e8] hover:bg-[#245542] transition-colors focus-visible:outline-2 focus-visible:outline-[#10b981]"
            >
              <FileCheck className="size-4" />
              <span>Perbarui Laporan</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#173e32]/20 bg-white px-4 text-xs font-bold text-[#173e32] hover:bg-[#dce7d7] transition-colors focus-visible:outline-2 focus-visible:outline-[#10b981]"
            >
              <Printer className="size-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>
      </section>

      {/* Official Printable Report Document */}
      {generated && (
        <section 
          id="official-report-doc"
          className="rounded-xl border border-[#173e32]/15 bg-white p-6 sm:p-10 shadow-md print:border-none print:shadow-none print:p-0"
        >
          {/* Document Letterhead */}
          <div className="border-b-2 border-[#173e32] pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#557267]">
                  Pemerintah Republik Indonesia · Sistem Peringatan Dini Pangan
                </p>
                <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#173e32]">
                  Laporan Peringatan Dini Kerentanan Pangan & Stres Vegetasi
                </h1>
                <p className="mt-1 text-xs text-[#36564a]">
                  Cakupan: {province} · Proyeksi Horizon 30 Hari Kedepan
                </p>
              </div>

              <div className="text-left sm:text-right font-mono text-xs text-[#557267] space-y-0.5">
                <p>No. Dokumen: <strong className="text-[#173e32]">{docNumber}</strong></p>
                <p>Tanggal Terbit: {new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date())}</p>
                <p>Sumber Telemetri: Satelit FAPAR JRC & CHIRPS</p>
              </div>
            </div>
          </div>

          {/* Executive Overview KPI Block */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-[#173e32]/12 bg-[#fbfaf6] p-3 text-center">
              <span className="block font-mono text-2xl font-bold text-[#173e32]">{totalItems}</span>
              <span className="text-[11px] font-semibold text-[#557267]">Total Kabupaten</span>
            </div>
            <div className="rounded-lg border border-[#991b1b]/25 bg-[#991b1b]/5 p-3 text-center">
              <span className="block font-mono text-2xl font-bold text-[#991b1b]">{criticalCount}</span>
              <span className="text-[11px] font-semibold text-[#991b1b]">Risiko Tinggi (Kritis)</span>
            </div>
            <div className="rounded-lg border border-[#166534]/25 bg-[#166534]/5 p-3 text-center">
              <span className="block font-mono text-2xl font-bold text-[#166534]">{verifiedCount}</span>
              <span className="text-[11px] font-semibold text-[#166534]">Terverifikasi Lapangan</span>
            </div>
            <div className="rounded-lg border border-[#173e32]/12 bg-[#fbfaf6] p-3 text-center">
              <span className="block font-mono text-2xl font-bold text-[#173e32]">30 Hari</span>
              <span className="text-[11px] font-semibold text-[#557267]">Horizon Peringatan</span>
            </div>
          </div>

          {/* Brief Recommendation Context */}
          <div className="mt-5 rounded-lg border border-[#b45309]/30 bg-[#fef3c7]/60 p-4 text-xs leading-relaxed text-[#78350f]">
            <strong>Pemberitahuan Resmi:</strong> Wilayah berstatus risiko tinggi (kritis) menunjukkan anomali deviasi fotosintesis negatif persisten yang berpotensi menurunkan produktivitas tanaman padi dan palawija. Disarankan dinas terkait segera melakukan pengawasan debit saluran irigasi, pembagian jadwal pompa air, serta persiapan pasokan air cadangan.
          </div>

          {/* Data Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs border border-[#173e32]/15">
              <thead className="bg-[#173e32] text-[#f5f1e8]">
                <tr>
                  <th className="p-2.5 font-bold">No</th>
                  <th className="p-2.5 font-bold">Kabupaten / Kota</th>
                  <th className="p-2.5 font-bold">Provinsi</th>
                  <th className="p-2.5 font-bold">Skor Model</th>
                  <th className="p-2.5 font-bold">Kategori</th>
                  <th className="p-2.5 font-bold">Status Verifikasi</th>
                  <th className="p-2.5 font-bold">Catatan Lapangan & Rekomendasi PPL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#173e32]/10 bg-white">
                {reportItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-sm text-[#557267]">
                      Tidak ada kabupaten yang memenuhi kriteria filter laporan.
                    </td>
                  </tr>
                ) : (
                  reportItems.map((item, idx) => {
                    const isCrit = item.kategori === "kritis";
                    return (
                      <tr key={item.id} className={idx % 2 === 1 ? "bg-[#fbfaf6]" : "bg-white"}>
                        <td className="p-2.5 font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-[#173e32]">
                          {item.namaKabupaten}
                          <span className="block text-[10px] font-mono text-[#557267]">Kode: {item.kodeKabupaten}</span>
                        </td>
                        <td className="p-2.5 text-[#36564a]">{item.provinsi}</td>
                        <td className="p-2.5 font-mono font-bold">
                          {item.skorRisiko !== null ? item.skorRisiko.toFixed(2) : "Data Kosong"}
                        </td>
                        <td className="p-2.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isCrit 
                              ? "bg-[#991b1b]/15 text-[#991b1b]" 
                              : item.kategori === "waspada" 
                                ? "bg-[#b45309]/15 text-[#b45309]" 
                                : "bg-[#166534]/15 text-[#166534]"
                          }`}>
                            {item.kategori === "kritis" ? "Kritis" : item.kategori === "waspada" ? "Waspada" : "Normal"}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="font-semibold text-[#173e32]">
                            {item.statusVerifikasi === "terverifikasi" 
                              ? "Terverifikasi" 
                              : item.statusVerifikasi === "perlu_cek" 
                                ? "Perlu Cek" 
                                : "Menunggu"}
                          </span>
                        </td>
                        <td className="p-2.5 max-w-xs text-[#36564a] leading-relaxed">
                          {item.catatanOperator || "Belum ada catatan lapangan dari pengamat / PPL."}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Official Signatures Footer */}
          <div className="mt-10 grid grid-cols-2 gap-8 border-t border-[#173e32]/10 pt-6 text-xs text-[#173e32]">
            <div>
              <p className="font-bold">Disusun Oleh:</p>
              <p className="mt-1 text-[#557267]">Operator Sistem Informasi Mawas</p>
              <div className="mt-14 border-b border-[#173e32]/40 w-48" />
              <p className="mt-1 text-[11px] text-[#557267]">Petugas Analis Spasial Pertanian</p>
            </div>

            <div className="text-right">
              <p className="font-bold">Mengetahui & Menyetujui:</p>
              <p className="mt-1 text-[#557267]">Koordinator Peringatan Dini Wilayah</p>
              <div className="mt-14 border-b border-[#173e32]/40 w-48 ml-auto" />
              <p className="mt-1 text-[11px] text-[#557267]">Dinas Pertanian / BPBD</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
