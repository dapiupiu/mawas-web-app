import { 
  LayoutDashboard, 
  ClipboardCheck, 
  FileText, 
  BookOpen, 
  UploadCloud, 
  MapPinned, 
  LogOut, 
  X, 
  ExternalLink, 
  UserCheck,
  Users
} from "lucide-react";
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
  onEditProfile: () => void;
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
  onEditProfile,
}: DashboardSidebarProps) {
  const isSuperadmin = user.role === "superadmin";

  const navItems = [
    {
      id: "ringkasan" as DashboardTab,
      label: "Ringkasan Wilayah",
      icon: LayoutDashboard,
      badge: criticalCount > 0 ? `${criticalCount} Kritis` : undefined,
      badgeColor: "bg-[#991b1b]/15 text-[#991b1b] border-[#991b1b]/30",
    },
    {
      id: "verifikasi" as DashboardTab,
      label: "Pusat Verifikasi",
      icon: ClipboardCheck,
      badge: pendingTaskCount > 0 ? `${pendingTaskCount} Perlu Aksi` : undefined,
      badgeColor: "bg-[#b45309]/15 text-[#b45309] border-[#b45309]/30",
    },
    {
      id: "laporan" as DashboardTab,
      label: "Generator Laporan",
      icon: FileText,
    },
    {
      id: "artikel" as DashboardTab,
      label: "CMS Panduan & Edukasi",
      icon: BookOpen,
    },
    {
      id: "unggah" as DashboardTab,
      label: "Pembaruan Model ML",
      icon: UploadCloud,
    },
    ...(isSuperadmin ? [{
      id: "pengguna" as DashboardTab,
      label: "Manajemen Akun",
      icon: Users,
      badge: "Superadmin",
      badgeColor: "bg-[#10b981]/15 text-[#065f46] border-[#10b981]/30",
    }] : []),
  ];

  const displayName = user.username ?? user.name ?? user.email.split("@")[0];
  const roleName = isSuperadmin ? "Superadmin" : "Operator Wilayah";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-[#091b15]/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="dashboard-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 shrink-0 flex-col border-r border-[#173e32]/12 bg-[#fbfaf6] transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigasi Utama Ruang Kerja"
      >
        {/* Brand Header with Authentic Official Logo */}
        <div className="flex h-18 shrink-0 items-center justify-between border-b border-[#173e32]/10 px-5 bg-white/70">
          <a href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo-mawas/PNG/rectangle/MAWAS-rectangle-colour.png"
              alt="Logo Mawas"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-102"
            />
          </a>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="grid size-11 place-items-center rounded-lg border border-[#173e32]/15 text-[#173e32] hover:bg-[#dce7d7] lg:hidden focus-visible:outline-2 focus-visible:outline-[#10b981]"
            aria-label="Tutup menu navigasi"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label="Menu Ruang Kerja">
          <div className="px-3 pb-1 pt-1">
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
                className={`group flex min-h-11 w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#10b981] ${
                  isActive
                    ? "bg-[#173e32] text-[#f5f1e8] shadow-sm"
                    : "text-[#36564a] hover:bg-[#dce7d7]/70 hover:text-[#173e32]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`size-4 transition-colors ${
                      isActive ? "text-[#34d399]" : "text-[#557267] group-hover:text-[#173e32]"
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
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

        {/* Footer Area: User Profile Card, Buka Peta Publik, & Logout */}
        <div className="border-t border-[#173e32]/10 p-3 space-y-2 bg-[#f5f1e8]/60 shrink-0 mt-auto">
          {/* User Profile Info Card */}
          <button
            type="button"
            onClick={onEditProfile}
            className="w-full rounded-xl border border-[#173e32]/10 bg-white p-3 text-left shadow-2xs hover:bg-[#f5f1e8] focus-visible:outline-2 focus-visible:outline-[#10b981]"
            aria-label="Ubah profil akun"
          >
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#173e32] text-xs font-bold text-[#f5f1e8] shadow-inner">
                {user.avatar_url
                  ? <img src={user.avatar_url} alt="" className="size-full object-cover" />
                  : displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[#173e32]">
                  {displayName}
                </p>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#557267]">
                  <UserCheck className="size-3 text-[#10b981]" />
                  <span className="truncate">{roleName}</span>
                </div>
                <p className="mt-1 text-[10px] font-semibold text-[#10b981]">Ubah profil</p>
              </div>
            </div>
          </button>

          {/* Action Links */}
          <a
            href="/peta-risiko"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center justify-between rounded-lg border border-[#173e32]/10 bg-white/80 px-3 py-2 text-xs font-semibold text-[#36564a] hover:bg-[#dce7d7] hover:text-[#173e32] transition-colors focus-visible:outline-2 focus-visible:outline-[#10b981]"
          >
            <div className="flex items-center gap-2.5">
              <MapPinned className="size-4 text-[#557267]" />
              <span>Buka Peta Publik</span>
            </div>
            <ExternalLink className="size-3.5 text-[#557267]" />
          </a>

          <button
            type="button"
            onClick={onLogout}
            className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#991b1b] hover:bg-[#991b1b]/10 transition-colors focus-visible:outline-2 focus-visible:outline-[#10b981]"
          >
            <LogOut className="size-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
}
