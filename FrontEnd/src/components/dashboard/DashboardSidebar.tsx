import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Wheat, 
  ShieldAlert, 
  MapPinned, 
  LogOut, 
  X, 
  ExternalLink,
  UserCheck
} from "lucide-react";
import { BrandMark } from "@/components/landing/BrandMark";
import type { DashboardTab } from "@/types/dashboard";
import type { StoredUser } from "@/lib/api";

interface DashboardSidebarProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  user: StoredUser;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingTaskCount: number;
  criticalCount: number;
}

export function DashboardSidebar({
  activeTab,
  onSelectTab,
  user,
  onLogout,
  isOpenMobile,
  onCloseMobile,
  pendingTaskCount,
  criticalCount,
}: DashboardSidebarProps) {
  const navItems = [
    {
      id: "ringkasan" as DashboardTab,
      label: "Ringkasan Wilayah",
      icon: LayoutDashboard,
      badge: criticalCount > 0 ? `${criticalCount} Kritis` : undefined,
      badgeColor: "bg-[#bb5b42]/15 text-[#7c1d0f] border-[#bb5b42]/30",
    },
    {
      id: "verifikasi" as DashboardTab,
      label: "Tugas & Verifikasi AI",
      icon: ClipboardCheck,
      badge: pendingTaskCount > 0 ? `${pendingTaskCount} Perlu Aksi` : undefined,
      badgeColor: "bg-[#966a13]/15 text-[#5e4107] border-[#966a13]/30",
    },
    {
      id: "produksi" as DashboardTab,
      label: "Data Produksi Pangan",
      icon: Wheat,
    },
    {
      id: "intervensi" as DashboardTab,
      label: "Manajemen Intervensi",
      icon: ShieldAlert,
    },
    {
      id: "peta" as DashboardTab,
      label: "Peta Pantauan Spasial",
      icon: MapPinned,
    },
  ];

  const displayName = user.username ?? user.name ?? user.email.split("@")[0];
  const roleName = user.role === "admin" 
    ? "Administrator Sistem" 
    : user.role === "pembuat_kebijakan" 
      ? "Pembuat Kebijakan" 
      : "Operator Wilayah";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-[#173e32]/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="dashboard-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#173e32]/12 bg-[#fbfaf5] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigasi Utama Dashboard"
      >
        {/* Brand Header */}
        <div className="flex h-18 items-center justify-between border-b border-[#173e32]/10 px-5">
          <a href="/" className="flex items-center gap-2.5 group">
            <BrandMark />
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold leading-none tracking-tight text-[#173e32]">
                Mawas
              </span>
              <span className="mt-0.5 text-[11px] font-medium text-[#557267]">
                Peringatan Dini Pangan
              </span>
            </div>
          </a>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="grid size-9 place-items-center rounded-lg border border-[#173e32]/15 text-[#173e32] hover:bg-[#dce7d7] lg:hidden focus-visible:outline-2 focus-visible:outline-[#b97a16]"
            aria-label="Tutup menu navigasi"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* User Card Pill */}
        <div className="m-4 rounded-xl border border-[#173e32]/10 bg-white/80 p-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#173e32] font-semibold text-[#f5f1e8]">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#173e32]">
                {displayName}
              </p>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#557267]">
                <UserCheck className="size-3 text-[#166534]" />
                <span className="truncate">{roleName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2" aria-label="Menu Ruang Kerja">
          <div className="px-3 pb-1 pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#557267]">
              Modul Ruang Kerja
            </p>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#b97a16] ${
                  isActive
                    ? "bg-[#173e32] text-[#f5f1e8] shadow-sm"
                    : "text-[#36564a] hover:bg-[#dce7d7]/70 hover:text-[#173e32]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`size-4 transition-colors ${
                      isActive ? "text-[#f5f1e8]" : "text-[#557267] group-hover:text-[#173e32]"
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? "bg-[#f5f1e8]/20 text-[#f5f1e8] border-white/30"
                        : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="border-t border-[#173e32]/10 p-3 space-y-1 bg-[#f5f1e8]/50">
          <a
            href="/peta-risiko"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-[#36564a] hover:bg-[#dce7d7]/60 hover:text-[#173e32] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <MapPinned className="size-4 text-[#557267]" />
              <span>Buka Peta Publik</span>
            </div>
            <ExternalLink className="size-3 text-[#557267]" />
          </a>

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#bb5b42] hover:bg-[#bb5b42]/10 transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16]"
          >
            <LogOut className="size-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
}
