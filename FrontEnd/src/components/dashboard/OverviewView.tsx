import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Wheat, 
  ArrowRight,
  MapPin,
  Calendar,
  Satellite
} from "lucide-react";
import type { PredictionItem, ProductionRecord, InterventionItem, DashboardTab } from "@/types/dashboard";

interface OverviewViewProps {
  predictions: PredictionItem[];
  productions: ProductionRecord[];
  interventions: InterventionItem[];
  onNavigateTab: (tab: DashboardTab) => void;
  onOpenVerifyModal: (item: PredictionItem) => void;
  role?: "operator" | "pembuat_kebijakan" | "admin";
}

export function OverviewView({
  predictions,
  productions,
  interventions,
  onNavigateTab,
  onOpenVerifyModal,
  role = "operator",
}: OverviewViewProps) {
  const criticalItems = predictions.filter((p) => p.kategori === "kritis");
  const warningItems = predictions.filter((p) => p.kategori === "waspada");
  const pendingTasks = predictions.filter((p) => p.statusVerifikasi === "menunggu");
  const activeInterventions = interventions.filter((i) => i.status === "Sedang Berjalan");

  const totalLuasLahan = productions.reduce((acc, curr) => acc + curr.luasLahanHa, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Header Info */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#173e32]/12 bg-white p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-[#166534]" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#166534]">
              {role === "pembuat_kebijakan" ? "Dashboard Eksekutif Kebijakan (F06)" : "Sistem Aktif & Terhubung (F03)"}
            </span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#173e32] sm:text-3xl">
            Ringkasan Pantauan Risiko Pertanian
          </h1>
          <p className="mt-1 text-xs text-[#557267]">
            Fokus Pantauan Aktif: Provinsi Sumatera Utara (11 Kabupaten Sentra Pangan Utama).
          </p>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-[#173e32]/10 bg-[#f5f1e8] px-3.5 py-2 text-xs text-[#36564a]">
          <Calendar className="size-4 text-[#557267]" />
          <div>
            <p className="font-semibold text-[#173e32]">Siklus Satelit JRC/HDX</p>
            <p className="text-[11px] text-[#557267]">Diperbarui: 23 Oktober 2026</p>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total Pantauan */}
        <div className="rounded-xl border border-[#173e32]/12 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#557267]">
            <span>Wilayah Pantauan</span>
            <MapPin className="size-4 text-[#173e32]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-[#173e32]">
              {predictions.length}
            </span>
            <span className="text-xs text-[#557267]">Kabupaten Sentra</span>
          </div>
          <p className="mt-2 text-[11px] leading-4 text-[#36564a]">
            {criticalItems.length} Kritis, {warningItems.length} Waspada, {predictions.length - criticalItems.length - warningItems.length} Normal.
          </p>
        </div>

        {/* Card 2: Status Kritis */}
        <div className="rounded-xl border border-[#bb5b42]/30 bg-[#bb5b42]/5 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#7c1d0f]">
            <span>Kategori Kritis (Merah)</span>
            <AlertTriangle className="size-4 text-[#bb5b42]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-[#7c1d0f]">
              {criticalItems.length}
            </span>
            <span className="text-xs font-medium text-[#7c1d0f]">Kabupaten</span>
          </div>
          <p className="mt-2 text-[11px] leading-4 text-[#7c1d0f]/80">
            Perlu intervensi prioritas: pompanisasi atau suplesi air.
          </p>
        </div>

        {/* Card 3: Tugas Menunggu */}
        <div className="rounded-xl border border-[#966a13]/30 bg-[#966a13]/5 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5e4107]">
            <span>Menunggu Verifikasi</span>
            <Clock className="size-4 text-[#966a13]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-[#5e4107]">
              {pendingTasks.length}
            </span>
            <span className="text-xs font-medium text-[#5e4107]">Data Lapangan</span>
          </div>
          <p className="mt-2 text-[11px] leading-4 text-[#5e4107]/80">
            Prediksi AI butuh validasi laporan kondisi riil di lapangan.
          </p>
        </div>

        {/* Card 4: Intervensi Aktif */}
        <div className="rounded-xl border border-[#173e32]/12 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#557267]">
            <span>Intervensi Mitigasi</span>
            <ShieldAlert className="size-4 text-[#166534]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-[#173e32]">
              {activeInterventions.length}
            </span>
            <span className="text-xs text-[#557267]">Program Berjalan</span>
          </div>
          <p className="mt-2 text-[11px] leading-4 text-[#36564a]">
            Melindungi estimasi {totalLuasLahan.toLocaleString("id-ID")} Ha lahan tanaman pangan.
          </p>
        </div>
      </div>

      {/* Critical Action Banner */}
      {criticalItems.length > 0 && (
        <div className="rounded-xl border border-[#bb5b42]/35 bg-[#bb5b42]/10 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#bb5b42] text-white">
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#7c1d0f]">
                  Perhatian Khusus: {criticalItems.length} Kabupaten Berpotensi Stres Vegetasi Tinggi
                </h2>
                <p className="mt-0.5 text-xs text-[#7c1d0f]/90">
                  Wilayah terancam defisit curah hujan 30 hari kedepan:{" "}
                  <span className="font-semibold">
                    {criticalItems.map((c) => c.namaKabupaten).join(", ")}.
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab("intervensi")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#173e32] px-3.5 py-2 text-xs font-semibold text-[#f5f1e8] hover:bg-[#245542] transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16]"
              >
                <span>Ajukan Intervensi</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Split */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Daftar Pantauan & Verifikasi Cepat (7 cols) */}
        <section className="lg:col-span-7 rounded-2xl border border-[#173e32]/12 bg-white p-5 shadow-2xs" aria-label="Tabel Pemantauan">
          <div className="flex items-center justify-between pb-3 border-b border-[#173e32]/10">
            <div>
              <div className="flex items-center gap-1.5">
                <Satellite className="size-4 text-[#173e32]" />
                <h2 className="font-serif text-lg font-bold text-[#173e32]">
                  Status Prediksi Risiko Satelit
                </h2>
              </div>
              <p className="text-xs text-[#557267]">
                Hasil analisis anomali FAPAR dan curah hujan per kabupaten.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("verifikasi")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#173e32] hover:underline"
            >
              <span>Kelola Semua ({predictions.length})</span>
              <ArrowRight className="size-3" />
            </button>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#173e32]/10 text-[#557267]">
                  <th className="py-2.5 font-semibold">Kabupaten</th>
                  <th className="py-2.5 font-semibold">Skor Risiko</th>
                  <th className="py-2.5 font-semibold">FAPAR Anomali</th>
                  <th className="py-2.5 font-semibold">Status Validasi</th>
                  <th className="py-2.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#173e32]/8">
                {predictions.slice(0, 5).map((item) => {
                  const isKritis = item.kategori === "kritis";
                  const isWaspada = item.kategori === "waspada";
                  const displayScore = item.skorOverride ?? item.skorRisiko;

                  return (
                    <tr key={item.id} className="hover:bg-[#f5f1e8]/40 transition-colors">
                      <td className="py-3 font-semibold text-[#173e32]">
                        {item.namaKabupaten}
                        <span className="block text-[10px] font-normal text-[#557267]">
                          Kode: {item.kodeKabupaten}
                        </span>
                      </td>

                      <td className="py-3">
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
                      </td>

                      <td className="py-3 font-mono text-xs text-[#36564a]">
                        {item.faparAnomaly > 0 ? `+${item.faparAnomaly}` : item.faparAnomaly}
                      </td>

                      <td className="py-3">
                        {item.statusVerifikasi === "tervalidasi" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#166534]">
                            <CheckCircle2 className="size-3" />
                            Tervalidasi
                          </span>
                        ) : item.statusVerifikasi === "dikoreksi" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#966a13]">
                            <Clock className="size-3" />
                            Koreksi Lapangan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7c1d0f]">
                            <AlertTriangle className="size-3" />
                            Menunggu Review
                          </span>
                        )}
                      </td>

                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenVerifyModal(item)}
                          className="rounded-md border border-[#173e32]/20 px-2.5 py-1 text-[11px] font-semibold text-[#173e32] hover:bg-[#dce7d7] transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16]"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Intervensi Terkini & Pintasan Cepat (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Interventions Card */}
          <section className="rounded-2xl border border-[#173e32]/12 bg-white p-5 shadow-2xs" aria-label="Intervensi Terkini">
            <div className="flex items-center justify-between pb-3 border-b border-[#173e32]/10">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#173e32]">
                  Program Mitigasi Terkini
                </h2>
                <p className="text-xs text-[#557267]">
                  Aksi lapangan untuk meredam dampak kekeringan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab("intervensi")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#173e32] hover:underline"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="size-3" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {interventions.slice(0, 3).map((int) => (
                <div
                  key={int.id}
                  className="rounded-xl border border-[#173e32]/10 bg-[#fbfaf5] p-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-[#173e32] leading-snug">
                      {int.namaProgram}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        int.status === "Sedang Berjalan"
                          ? "bg-[#166534]/15 text-[#166534]"
                          : int.status === "Selesai"
                            ? "bg-[#173e32]/10 text-[#173e32]"
                            : "bg-[#966a13]/15 text-[#5e4107]"
                      }`}
                    >
                      {int.status}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-[#557267]">
                    Sasaran: <strong className="text-[#36564a]">{int.kabupatenSasaran}</strong> ({int.targetUnitAtauHa})
                  </p>
                  <p className="mt-1 text-[10px] text-[#557267]">
                    PIC: {int.penanggungJawab}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions Shortcuts */}
          <div className="rounded-2xl border border-[#173e32]/12 bg-[#173e32] p-5 text-[#f5f1e8] shadow-2xs">
            <h3 className="font-serif text-base font-bold text-[#f5f1e8]">
              Aksi Cepat Ruang Kerja
            </h3>
            <p className="mt-1 text-xs text-[#dce7d7]">
              Pencatatan data berkala menjaga akurasi sistem deteksi dini Mawas.
            </p>

            <div className="mt-4 grid gap-2.5">
              <button
                type="button"
                onClick={() => onNavigateTab("produksi")}
                className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-[#f5f1e8] hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Wheat className="size-4 text-[#dce7d7]" />
                  <span>Input Data Produksi Pertanian</span>
                </div>
                <ArrowRight className="size-3.5 text-[#dce7d7]" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("intervensi")}
                className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-[#f5f1e8] hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="size-4 text-[#dce7d7]" />
                  <span>Daftarkan Program Intervensi Baru</span>
                </div>
                <ArrowRight className="size-3.5 text-[#dce7d7]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
