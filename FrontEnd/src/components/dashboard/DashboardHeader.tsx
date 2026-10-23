import { useState, useRef, useEffect } from "react";
import { 
  Menu, 
  Bell, 
  Download, 
  UserCheck, 
  AlertTriangle, 
  Check, 
  ExternalLink,
  ChevronDown
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
  currentRole: "operator" | "pembuat_kebijakan" | "admin";
  onChangeRole: (role: "operator" | "pembuat_kebijakan" | "admin") => void;
}

export function DashboardHeader({
  activeTab,
  onOpenMobileMenu,
  user,
  predictions,
  onSelectPrediction,
  onExportData,
  currentRole,
  onChangeRole,
}: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  const criticalAlerts = predictions.filter((p) => p.kategori === "kritis");
  const tabTitles: Record<DashboardTab, { title: string; subtitle: string }> = {
    ringkasan: {
      title: "Ringkasan Eksekutif Wilayah",
      subtitle: "Gambaran holistik kondisi risiko kekeringan pertanian dan mitigasi aktif.",
    },
    verifikasi: {
      title: "Tugas & Verifikasi AI (F04)",
      subtitle: "Validasi atau koreksi sinyal anomali satelit berdasarkan laporan riil lapangan.",
    },
    produksi: {
      title: "Pencatatan Data Produksi (F03)",
      subtitle: "Inventarisasi luas tanam, estimasi panen, dan kondisi ketersediaan air.",
    },
    intervensi: {
      title: "Manajemen Intervensi Mitigasi (F05)",
      subtitle: "Pelacakan program tanggap darurat pompanisasi, sumur bor, dan benih.",
    },
    peta: {
      title: "Peta Pantauan Spasial (F01)",
      subtitle: "Distribusi risiko geografis seluruh kabupaten sentra pangan Sumatera Utara.",
    },
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roleLabels = {
    operator: "Operator Wilayah",
    pembuat_kebijakan: "Pembuat Kebijakan",
    admin: "Administrator",
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#173e32]/10 bg-[#fbfaf5]/90 backdrop-blur-md px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="grid size-9 place-items-center rounded-lg border border-[#173e32]/15 text-[#173e32] hover:bg-[#dce7d7] lg:hidden focus-visible:outline-2 focus-visible:outline-[#b97a16]"
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
          {/* Role Switcher Pill */}
          <div className="relative" ref={roleRef}>
            <button
              type="button"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#173e32]/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#173e32] hover:bg-[#f5f1e8] transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16]"
              aria-label="Ganti mode peran"
            >
              <UserCheck className="size-3.5 text-[#166534]" />
              <span>{roleLabels[currentRole]}</span>
              <ChevronDown className="size-3 text-[#557267]" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-[#173e32]/15 bg-white p-1.5 shadow-lg z-50 text-xs">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase text-[#557267]">
                  Simulasi Peran Pengguna
                </p>
                {(["operator", "pembuat_kebijakan", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      onChangeRole(r);
                      setShowRoleMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-medium transition-colors ${
                      currentRole === r
                        ? "bg-[#173e32] text-[#f5f1e8]"
                        : "text-[#36564a] hover:bg-[#dce7d7]/60"
                    }`}
                  >
                    <span>{roleLabels[r]}</span>
                    {currentRole === r && <Check className="size-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Button (N02) */}
          <button
            type="button"
            onClick={onExportData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#173e32]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#173e32] hover:bg-[#dce7d7] transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16]"
            title="Ekspor Laporan Data"
          >
            <Download className="size-3.5" />
            <span className="hidden md:inline">Ekspor Laporan</span>
          </button>

          {/* Notification Bell (N01) */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative grid size-9 place-items-center rounded-lg border border-[#173e32]/15 bg-white text-[#173e32] hover:bg-[#dce7d7] transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16]"
              aria-label="Pemberitahuan Sistem"
            >
              <Bell className="size-4" />
              {criticalAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#bb5b42] text-[10px] font-bold text-white">
                  {criticalAlerts.length}
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[#173e32]/15 bg-white p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-[#173e32]/10">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="size-4 text-[#bb5b42]" />
                    <span className="text-xs font-bold text-[#173e32]">
                      Peringatan Dini Aktif ({criticalAlerts.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-[#557267]">Data Satelit JRC</span>
                </div>

                <div className="mt-2 divide-y divide-[#173e32]/8 max-h-64 overflow-y-auto">
                  {criticalAlerts.length === 0 ? (
                    <p className="py-4 text-center text-xs text-[#557267]">
                      Tidak ada peringatan kritis saat ini.
                    </p>
                  ) : (
                    criticalAlerts.map((item) => (
                      <div
                        key={item.id}
                        className="py-2.5 hover:bg-[#f5f1e8]/50 p-2 rounded-lg cursor-pointer transition-colors"
                        onClick={() => {
                          onSelectPrediction(item);
                          setShowNotifications(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-[#7c1d0f]">
                            {item.namaKabupaten} (Skor {item.skorRisiko.toFixed(2)})
                          </p>
                          <span className="text-[10px] text-[#7c1d0f] font-semibold bg-[#bb5b42]/10 px-1.5 py-0.5 rounded">
                            Kritis
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#36564a]">
                          Anomali FAPAR {item.faparAnomaly}, curah hujan {item.curahHujanMm} mm. Perlu verifikasi dan mitigasi.
                        </p>
                        <span className="mt-1 block text-[10px] text-[#557267]">
                          Diperbarui: {item.terakhirDiperbarui}
                        </span>
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
                    <span>Buka Peta Publik</span>
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

          {/* User Avatar Circle */}
          <div className="flex items-center gap-2 pl-1 border-l border-[#173e32]/10">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#173e32] text-xs font-semibold text-[#f5f1e8]">
              {(user.username ?? user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
