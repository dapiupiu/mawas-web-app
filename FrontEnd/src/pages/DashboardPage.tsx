import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { authApi, getStoredUser, type StoredUser } from "@/lib/api";
import type { DashboardTab, PredictionItem, ProductionRecord, InterventionItem } from "@/types/dashboard";
import {
  getDashboardPredictions,
  saveDashboardPredictions,
  getDashboardProductions,
  saveDashboardProductions,
  getDashboardInterventions,
  saveDashboardInterventions,
} from "@/lib/dashboardData";

import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OverviewView } from "@/components/dashboard/OverviewView";
import { VerificationView } from "@/components/dashboard/VerificationView";
import { ProductionDataView } from "@/components/dashboard/ProductionDataView";
import { InterventionView } from "@/components/dashboard/InterventionView";
import { SpatialMapView } from "@/components/dashboard/SpatialMapView";

import { VerifyPredictionModal } from "@/components/dashboard/VerifyPredictionModal";
import { AddProductionModal } from "@/components/dashboard/AddProductionModal";
import { AddInterventionModal } from "@/components/dashboard/AddInterventionModal";

export function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Dashboard active tab
  const [activeTab, setActiveTab] = useState<DashboardTab>("ringkasan");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Role simulation (Operator, Pembuat Kebijakan, Admin)
  const [role, setRole] = useState<"operator" | "pembuat_kebijakan" | "admin">("operator");

  // Data states from local persistence
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [productions, setProductions] = useState<ProductionRecord[]>([]);
  const [interventions, setInterventions] = useState<InterventionItem[]>([]);

  // Modals state
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionItem | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isAddProductionOpen, setIsAddProductionOpen] = useState(false);
  const [isAddInterventionOpen, setIsAddInterventionOpen] = useState(false);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      authApi.logout();
      navigate("/signin", { replace: true });
      return;
    }

    setUser(stored);
    if (stored.role === "pembuat_kebijakan" || stored.role === "admin") {
      setRole(stored.role);
    }
    setLoading(false);

    // Load datasets
    setPredictions(getDashboardPredictions());
    setProductions(getDashboardProductions());
    setInterventions(getDashboardInterventions());

    // Skip backend call if mock token
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("mawas_token") : null;
    if (token && token.startsWith("mock_dev_")) {
      return;
    }

    authApi
      .getOperatorDashboard()
      .then((res) => {
        if (res?.user) {
          setUser((prev) => ({
            ...prev,
            ...res.user,
            email: res.user.email ?? prev?.email ?? "",
            id: res.user.id ?? prev?.id ?? "",
          }));
        }
      })
      .catch((err) => {
        console.debug("Backend middleware check:", err?.response?.status ?? err?.message);
      });
  }, [navigate]);

  function showToast(msg: string) {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 3500);
  }

  function handleLogout() {
    authApi.logout();
    navigate("/signin", { replace: true });
  }

  // --- Handlers for Prediction (F04) ---
  function handleOpenVerify(item: PredictionItem) {
    setSelectedPrediction(item);
    setIsVerifyModalOpen(true);
  }

  function handleSavePrediction(updatedItem: PredictionItem) {
    const updatedList = predictions.map((p) => (p.id === updatedItem.id ? updatedItem : p));
    setPredictions(updatedList);
    saveDashboardPredictions(updatedList);
    showToast(`Data verifikasi ${updatedItem.namaKabupaten} berhasil disimpan.`);
  }

  // --- Handlers for Production (F03) ---
  function handleAddProduction(record: ProductionRecord) {
    const updated = [record, ...productions];
    setProductions(updated);
    saveDashboardProductions(updated);
    showToast(`Data produksi untuk ${record.namaKabupaten} (${record.komoditas}) berhasil ditambahkan.`);
  }

  function handleDeleteProduction(id: string) {
    const updated = productions.filter((p) => p.id !== id);
    setProductions(updated);
    saveDashboardProductions(updated);
    showToast("Catatan data produksi berhasil dihapus.");
  }

  // --- Handlers for Intervention (F05) ---
  function handleAddIntervention(item: InterventionItem) {
    const updated = [item, ...interventions];
    setInterventions(updated);
    saveDashboardInterventions(updated);
    showToast(`Program intervensi "${item.namaProgram}" berhasil didaftarkan.`);
  }

  function handleUpdateInterventionStatus(id: string, newStatus: InterventionItem["status"]) {
    const updated = interventions.map((item) =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    setInterventions(updated);
    saveDashboardInterventions(updated);
    showToast(`Status program diperbarui menjadi: ${newStatus}`);
  }

  function handleDeleteIntervention(id: string) {
    const updated = interventions.filter((item) => item.id !== id);
    setInterventions(updated);
    saveDashboardInterventions(updated);
    showToast("Program intervensi berhasil dihapus.");
  }

  // --- Export Data (N02) ---
  function handleExportData() {
    const csvRows = [
      ["Kabupaten", "Kode", "Skor Risiko", "Kategori", "Anomali FAPAR", "Curah Hujan (mm)", "Status Verifikasi", "Catatan"].join(","),
      ...predictions.map((p) =>
        [
          `"${p.namaKabupaten}"`,
          `"${p.kodeKabupaten}"`,
          p.skorOverride ?? p.skorRisiko,
          `"${p.kategori}"`,
          p.faparAnomaly,
          p.curahHujanMm,
          `"${p.statusVerifikasi}"`,
          `"${(p.catatanOperator ?? "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `laporan-risiko-mawas-sumut-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Laporan risiko pertanian berhasil diekspor ke format CSV.");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f1e8]">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="text-sm font-semibold text-[#36564a]"
        >
          Memuat ruang kerja Mawas...
        </motion.div>
      </main>
    );
  }

  if (!user) return null;

  const criticalCount = predictions.filter((p) => p.kategori === "kritis").length;
  const pendingTaskCount = predictions.filter((p) => p.statusVerifikasi === "menunggu").length;

  return (
    <div className="flex min-h-screen bg-[#f5f1e8] text-[#173e32]">
      {/* ── Sidebar (Desktop & Mobile Drawer) ── */}
      <DashboardSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        user={{ ...user, role }}
        onLogout={handleLogout}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        pendingTaskCount={pendingTaskCount}
        criticalCount={criticalCount}
      />

      {/* ── Main Dashboard Workspace ── */}
      <div className="flex flex-1 flex-col min-w-0">
        <DashboardHeader
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          user={{ ...user, role }}
          predictions={predictions}
          onSelectPrediction={(item) => {
            setActiveTab("verifikasi");
            handleOpenVerify(item);
          }}
          onExportData={handleExportData}
          currentRole={role}
          onChangeRole={setRole}
        />

        {/* Content View per Tab */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {activeTab === "ringkasan" && (
                <OverviewView
                  predictions={predictions}
                  productions={productions}
                  interventions={interventions}
                  onNavigateTab={setActiveTab}
                  onOpenVerifyModal={handleOpenVerify}
                  role={role}
                />
              )}

              {activeTab === "verifikasi" && (
                <VerificationView
                  predictions={predictions}
                  onOpenVerifyModal={handleOpenVerify}
                />
              )}

              {activeTab === "produksi" && (
                <ProductionDataView
                  productions={productions}
                  onOpenAddModal={() => setIsAddProductionOpen(true)}
                  onDeleteRecord={handleDeleteProduction}
                />
              )}

              {activeTab === "intervensi" && (
                <InterventionView
                  interventions={interventions}
                  onOpenAddModal={() => setIsAddInterventionOpen(true)}
                  onUpdateStatus={handleUpdateInterventionStatus}
                  onDeleteIntervention={handleDeleteIntervention}
                />
              )}

              {activeTab === "peta" && (
                <SpatialMapView
                  predictions={predictions}
                  onOpenVerifyModal={handleOpenVerify}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Modals ── */}
      <VerifyPredictionModal
        item={selectedPrediction}
        isOpen={isVerifyModalOpen}
        onClose={() => {
          setIsVerifyModalOpen(false);
          setSelectedPrediction(null);
        }}
        onSave={handleSavePrediction}
      />

      <AddProductionModal
        isOpen={isAddProductionOpen}
        onClose={() => setIsAddProductionOpen(false)}
        onAdd={handleAddProduction}
      />

      <AddInterventionModal
        isOpen={isAddInterventionOpen}
        onClose={() => setIsAddInterventionOpen(false)}
        onAdd={handleAddIntervention}
      />

      {/* ── Toast Notification Feedback ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 rounded-xl border border-[#173e32]/20 bg-[#173e32] px-4 py-3 text-xs font-semibold text-[#f5f1e8] shadow-lg flex items-center gap-2"
          >
            <span className="size-2 rounded-full bg-[#6d9670]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
