import { useState, useRef, useEffect } from "react";
import { 
  Menu, 
  Bell, 
  FileText, 
  UserCheck, 
  AlertTriangle, 
  ExternalLink
} from "lucide-react";
import type { DashboardTab, PredictionItem } from "@/types/dashboard";
import type { StoredUser } from "@/lib/api";

interface DashboardHeaderProps {
  activeTab: DashboardTab;
  onOpenMobileMenu: () => void;
  user: StoredUser;
  predictions: PredictionItem[];
  onSelectPrediction: (item: PredictionItem) => void;
  onExportData: () => void;
}

export function DashboardHeader({
  activeTab,
  onOpenMobileMenu,
  user,
  predictions,
  onSelectPrediction,
  onExportData,
}: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const criticalAlerts = predictions.filter((p) => p.kategori === "kritis");
  const tabTitles: Record<DashboardTab, { title: string; subtitle: string }> = {
    ringkasan: {
      title: "Ringkasan Eksekutif Wilayah",
      subtitle: "Telemetri risiko stres vegetasi, verifikasi lapangan, dan peringatan dini.",
    },
    verifikasi: {
      title: "Pusat Verifikasi Lapangan",
      subtitle: "Catat konfirmasi lapangan operator tanpa mengubah skor prediksi model satelit.",
    },
    laporan: {
      title: "Generator Laporan Peringatan Dini",
      subtitle: "Kompilasi ringkasan risiko wilayah dan catatan lapangan siap cetak untuk BPBD / Dinas Pertanian.",
    },
    artikel: {
      title: "CMS Panduan & Edukasi",
      subtitle: "Kelola materi mitigasi kekeringan dan literasi risiko untuk masyarakat luas.",
    },
    unggah: {
      title: "Pembaruan Model ML",
      subtitle: "Unggah output prediksi model format JSON untuk sinkronisasi seluruh kabupaten.",
    },
    pengguna: {
      title: "Manajemen Akun & Hak Akses",
      subtitle: "Kelola akun petugas, daftarkan operator lapangan baru, dan atur kredensial akses.",
    },
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleLabel = user.role === "admin" 
    ? "Administrator Sistem" 
    : user.role === "pembuat_kebijakan" 
      ? "Pembuat Kebijakan" 
      : "Operator Wilayah";

  return (
    <header className="sticky top-0 z-30 border-b border-[#173e32]/10 bg-[#fbfaf6]/95 backdrop-blur-md px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="grid size-11 place-items-center rounded-lg border border-[#173e32]/15 text-[#173e32] hover:bg-[#dce7d7] lg:hidden focus-visible:outline-2 focus-visible:outline-[#10b981]"
            aria-label="Buka menu navigasi samping"
          >
            <Menu className="size-5" />
          </button>

          <div>
            <h1 className="font-serif text-lg font-bold tracking-tight text-[#173e32] sm:text-xl">
              {tabTitles[activeTab]?.title || "Ruang Kerja"}
            </h1>
            <p className="hidden text-xs text-[#557267] sm:block">
              {tabTitles[activeTab]?.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Static User Role Badge (Replaces artificial dropdown) */}
          <div 
            className="hidden sm:inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#173e32]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#173e32] shadow-2xs"
            title={`Peran terdaftar: ${roleLabel}`}
          >
            <UserCheck className="size-3.5 text-[#10b981]" />
            <span>{roleLabel}</span>
          </div>

          {/* Buat Laporan Button */}
          <button
            type="button"
            onClick={onExportData}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#173e32]/20 bg-white px-3 py-1.5 text-xs font-bold text-[#173e32] hover:bg-[#173e32] hover:text-[#f5f1e8] transition-colors focus-visible:outline-2 focus-visible:outline-[#10b981]"
            title="Buka Generator Laporan Peringatan Dini"
          >
            <FileText className="size-3.5" />
            <span className="hidden md:inline">Buat Laporan</span>
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative grid size-11 place-items-center rounded-lg border border-[#173e32]/15 bg-white text-[#173e32] hover:bg-[#dce7d7] transition-colors focus-visible:outline-2 focus-visible:outline-[#10b981]"
              aria-label="Pemberitahuan Sistem"
            >
              <Bell className="size-4" />
              {criticalAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-[#991b1b] text-[10px] font-bold text-white shadow-sm">
                  {criticalAlerts.length}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#173e32]/15 bg-white p-4 shadow-xl z-50">
                <div className="flex items-center justify-between pb-2 border-b border-[#173e32]/10">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="size-4 text-[#991b1b]" />
                    <span className="text-xs font-bold text-[#173e32]">
                      Peringatan Risiko Kritis ({criticalAlerts.length})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#557267]">FAPAR JRC</span>
                </div>

                <div className="mt-2 divide-y divide-[#173e32]/8 max-h-64 overflow-y-auto">
                  {criticalAlerts.length === 0 ? (
                    <p className="py-4 text-center text-xs text-[#557267]">
                      Tidak ada kabupaten dengan indikator kritis saat ini.
                    </p>
                  ) : (
                    criticalAlerts.slice(0, 8).map((item) => (
                      <div
                        key={item.id}
                        className="py-2.5 hover:bg-[#f5f1e8]/60 p-2 rounded-lg cursor-pointer transition-colors"
                        onClick={() => {
                          onSelectPrediction(item);
                          setShowNotifications(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-[#991b1b]">
                            {item.namaKabupaten}
                          </p>
                          <span className="text-[10px] text-[#991b1b] font-mono font-bold bg-[#991b1b]/10 px-1.5 py-0.5 rounded">
                            {item.skorRisiko !== null ? item.skorRisiko.toFixed(2) : "Data Kosong"}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#36564a]">
                          {item.provinsi} : status verifikasi {item.statusVerifikasi}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-[#173e32]/10 flex justify-between items-center text-[11px]">
                  <a
                    href="/peta-risiko"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#173e32] font-semibold hover:underline"
                  >
                    <span>Buka Peta Spasial</span>
                    <ExternalLink className="size-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-[#557267] hover:text-[#173e32]"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar Initial */}
          <div className="flex items-center pl-1 border-l border-[#173e32]/10">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#173e32] text-xs font-bold text-[#f5f1e8]">
              {(user.username ?? user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
