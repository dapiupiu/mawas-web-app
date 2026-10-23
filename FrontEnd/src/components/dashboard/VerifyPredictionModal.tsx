import { useState, useEffect } from "react";
import { X, CheckCircle2, Edit3, AlertTriangle, Satellite, CloudRain, ShieldCheck } from "lucide-react";
import type { PredictionItem } from "@/types/dashboard";

interface VerifyPredictionModalProps {
  item: PredictionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: PredictionItem) => void;
}

export function VerifyPredictionModal({
  item,
  isOpen,
  onClose,
  onSave,
}: VerifyPredictionModalProps) {
  const [mode, setMode] = useState<"validate" | "override">("validate");
  const [overrideScore, setOverrideScore] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (item) {
      setMode(item.statusVerifikasi === "dikoreksi" ? "override" : "validate");
      setOverrideScore(item.skorOverride ? String(item.skorOverride) : String(item.skorRisiko));
      setNotes(item.catatanOperator ?? "");
      setErrorMsg("");
    }
  }, [item]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "override") {
      const numScore = parseFloat(overrideScore);
      if (isNaN(numScore) || numScore < 0 || numScore > 1) {
        setErrorMsg("Skor koreksi harus berupa angka desimal antara 0.00 hingga 1.00.");
        return;
      }
      if (!notes.trim()) {
        setErrorMsg("Wajib menyertakan catatan pertimbangan lapangan saat mengoreksi skor.");
        return;
      }

      const updatedCategory = numScore >= 0.65 ? "kritis" : numScore >= 0.4 ? "waspada" : "normal";

      onSave({
        ...(item as NonNullable<typeof item>),
        statusVerifikasi: "dikoreksi",
        skorOverride: numScore,
        kategori: updatedCategory,
        catatanOperator: notes.trim(),
        diverifikasiOleh: "Operator Wilayah",
        terakhirDiperbarui: new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      } as import("@/types/dashboard").PredictionItem);
    } else {
      onSave({
        ...(item as NonNullable<typeof item>),
        statusVerifikasi: "tervalidasi",
        skorOverride: undefined,
        catatanOperator: notes.trim() || "Dikonfirmasi sesuai sinyal pemantauan satelit dan laporan penyuluh setempat.",
        diverifikasiOleh: "Operator Wilayah",
        terakhirDiperbarui: new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      } as import("@/types/dashboard").PredictionItem);
    }
    onClose();
  }

  const isKritis = item.kategori === "kritis";
  const isWaspada = item.kategori === "waspada";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-verify-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#173e32]/50 backdrop-blur-xs"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#173e32]/15 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#173e32]/10 bg-[#fbfaf5] px-6 py-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#557267]">
              Verifikasi Prediksi AI (F04)
            </span>
            <h2 id="modal-verify-title" className="font-serif text-xl font-bold text-[#173e32]">
              Kabupaten {item.namaKabupaten}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg border border-[#173e32]/10 text-[#557267] hover:bg-[#dce7d7] hover:text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#b97a16]"
            aria-label="Tutup jendela verifikasi"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Sinyal Satelit Telemetri */}
          <div className="rounded-xl border border-[#173e32]/10 bg-[#f5f1e8]/60 p-3.5 text-xs">
            <p className="font-semibold text-[#173e32] mb-2 flex items-center gap-1.5">
              <Satellite className="size-3.5 text-[#173e32]" />
              Data Sinyal Satelit Masukan Model ML
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-white p-2.5 border border-[#173e32]/8">
                <span className="text-[10px] text-[#557267] block">Skor AI Awal</span>
                <span className={`font-mono font-bold text-sm ${isKritis ? "text-[#7c1d0f]" : isWaspada ? "text-[#5e4107]" : "text-[#166534]"}`}>
                  {item.skorRisiko.toFixed(2)}
                </span>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-[#173e32]/8">
                <span className="text-[10px] text-[#557267] block">Anomali FAPAR</span>
                <span className="font-mono font-bold text-sm text-[#36564a]">
                  {item.faparAnomaly > 0 ? `+${item.faparAnomaly}` : item.faparAnomaly}
                </span>
              </div>
              <div className="rounded-lg bg-white p-2.5 border border-[#173e32]/8">
                <span className="text-[10px] text-[#557267] block flex items-center gap-1">
                  <CloudRain className="size-3 text-[#557267]" /> Hujan 30h
                </span>
                <span className="font-mono font-bold text-sm text-[#36564a]">
                  {item.curahHujanMm} mm
                </span>
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          <div>
            <label className="block text-xs font-semibold text-[#173e32] mb-1.5">
              Pilihan Aksi Operator
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("validate")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-[#b97a16] ${
                  mode === "validate"
                    ? "border-[#166534] bg-[#166534]/10 text-[#166534]"
                    : "border-[#173e32]/15 bg-white text-[#557267] hover:bg-[#f5f1e8]"
                }`}
              >
                <CheckCircle2 className="size-4" />
                Validasi Model
              </button>
              <button
                type="button"
                onClick={() => setMode("override")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-[#b97a16] ${
                  mode === "override"
                    ? "border-[#966a13] bg-[#966a13]/10 text-[#5e4107]"
                    : "border-[#173e32]/15 bg-white text-[#557267] hover:bg-[#f5f1e8]"
                }`}
              >
                <Edit3 className="size-4" />
                Koreksi Lapangan
              </button>
            </div>
          </div>

          {/* Conditional Input for Override */}
          {mode === "override" && (
            <div className="space-y-3 rounded-xl border border-[#966a13]/30 bg-[#966a13]/5 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#5e4107]">
                <AlertTriangle className="size-4 text-[#966a13]" />
                <span>Koreksi Skor Risiko Lapangan</span>
              </div>
              <p className="text-[11px] text-[#5e4107]/90 leading-relaxed">
                Gunakan jika kondisi riil berbeda dengan pembacaan satelit (misal: jaringan irigasi sekunder baru dibuka atau sebaliknya terjadi gagal pasok air).
              </p>
              <div>
                <label htmlFor="override-score-input" className="block text-xs font-semibold text-[#173e32] mb-1">
                  Skor Risiko Baru (0.00 sampai 1.00)
                </label>
                <input
                  id="override-score-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(e.target.value)}
                  className="w-full rounded-lg border border-[#173e32]/20 bg-white px-3 py-2 text-xs text-[#173e32] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
                  placeholder="Contoh: 0.45"
                  required
                />
              </div>
            </div>
          )}

          {/* Catatan Operator */}
          <div>
            <label htmlFor="notes-textarea" className="block text-xs font-semibold text-[#173e32] mb-1">
              Catatan Justifikasi Lapangan
            </label>
            <textarea
              id="notes-textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tuliskan keterangan pendukung atau referensi laporan mantri tani setempat..."
              className="w-full rounded-lg border border-[#173e32]/20 bg-white p-3 text-xs text-[#173e32] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
            />
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-[#7c1d0f]">{errorMsg}</p>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#173e32]/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#173e32]/15 px-4 py-2 text-xs font-semibold text-[#36564a] hover:bg-[#dce7d7] transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#173e32] px-4 py-2 text-xs font-semibold text-[#f5f1e8] hover:bg-[#245542] transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16]"
            >
              <ShieldCheck className="size-3.5" />
              Simpan Verifikasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
