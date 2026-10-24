import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Clock, ShieldCheck, X } from "lucide-react";
import type { PredictionItem, VerificationStatus } from "@/types/dashboard";

interface VerifyPredictionModalProps {
  item: PredictionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: PredictionItem) => Promise<void>;
  onSaveResult: (result: { success: boolean; message: string }) => void;
}

export function VerifyPredictionModal({ item, isOpen, onClose, onSave, onSaveResult }: VerifyPredictionModalProps) {
  const [status, setStatus] = useState<VerificationStatus>("menunggu");
  const [notes, setNotes] = useState("");
  const [verifierName, setVerifierName] = useState("");

  useEffect(() => {
    if (!item) return;
    setStatus(item.statusVerifikasi || "menunggu");
    setNotes(item.catatanOperator ?? "");
    setVerifierName(item.diverifikasiOleh ?? "Petugas Lapangan / PPL");
  }, [item]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const isCritical = item.kategori === "kritis";
  const options: Array<{ value: VerificationStatus; label: string; detail: string; icon: typeof CheckCircle2 }> = [
    { 
      value: "terverifikasi", 
      label: "Terverifikasi Lapangan", 
      detail: "Kondisi fisik sawah, saluran air, atau kelayuan tanaman sesuai dengan indikasi satelit.",
      icon: CheckCircle2 
    },
    { 
      value: "perlu_cek", 
      label: "Perlu Cek Lanjutan", 
      detail: "Informasi lapangan belum lengkap atau terdapat sistem irigasi teknis mandiri yang aktif.",
      icon: CircleAlert 
    },
    { 
      value: "menunggu", 
      label: "Menunggu Review", 
      detail: "Belum dilakukan konfirmasi atau pengecekan langsung oleh petugas.",
      icon: Clock 
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-[#091b15]/65 p-0 sm:p-4 backdrop-blur-xs transition-opacity" 
      role="presentation" 
      onMouseDown={onClose}
    >
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="verification-title" 
        className="flex w-full max-w-lg max-h-[90dvh] flex-col overflow-hidden rounded-t-2xl sm:rounded-xl border border-[#173e32]/20 bg-[#fbfaf6] shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#173e32]/10 bg-white px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#10b981]">
              <ShieldCheck className="size-4" />
              <span>Verifikasi Lapangan</span>
            </div>
            <h2 id="verification-title" className="mt-1 font-serif text-xl font-bold text-[#173e32]">
              {item.namaKabupaten}
            </h2>
            <p className="text-xs text-[#557267]">
              {item.provinsi} (Kode {item.kodeKabupaten})
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="grid size-11 place-items-center rounded-lg text-[#36564a] hover:bg-[#dce7d7] transition-colors focus-visible:outline-2 focus-visible:outline-[#10b981]" 
            aria-label="Tutup form verifikasi"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form 
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 sm:p-6"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await onSave({
                ...item,
                statusVerifikasi: status,
                catatanOperator: notes.trim() || undefined,
                diverifikasiOleh: verifierName.trim() || undefined,
                terakhirDiperbarui: new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date())
              });
              onClose();
              onSaveResult({
                success: true,
                message: "Catatan verifikasi berhasil disimpan.",
              });
            } catch (error) {
              console.error("Gagal menyimpan verifikasi ke backend:", error);
              onClose();
              onSaveResult({
                success: false,
                message: error instanceof Error
                  ? `Gagal menyimpan verifikasi: ${error.message}`
                  : "Gagal menyimpan verifikasi. Silakan coba lagi.",
              });
            }
          }}
        >
          {/* Read-Only Model Score Banner */}
          <div className="rounded-xl border border-[#173e32]/12 bg-[#f1f6ef] p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#557267]">Skor Prediksi Model Satelit (Read-Only)</span>
              <span className="font-mono text-[10px] text-[#10b981] font-bold uppercase tracking-wide">FAPAR Telemetri</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className={`font-mono text-3xl font-bold ${isCritical ? "text-[#991b1b]" : "text-[#173e32]"}`}>
                {item.skorRisiko !== null ? item.skorRisiko.toFixed(2) : "Data Kosong"}
              </p>
              <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${
                isCritical 
                  ? "bg-[#991b1b]/10 text-[#991b1b] border-[#991b1b]/30" 
                  : item.kategori === "waspada" 
                    ? "bg-[#b45309]/10 text-[#b45309] border-[#b45309]/30" 
                    : "bg-[#166534]/10 text-[#166534] border-[#166534]/30"
              }`}>
                {item.kategori === "kritis" ? "Risiko Tinggi" : item.kategori === "waspada" ? "Perlu Perhatian" : "Normal"}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-4 text-[#557267]">
              Skor dihasilkan otomatis oleh algoritma deviasi vegetasi satelit dan tidak dapat diubah oleh operator demi integritas model.
            </p>
          </div>

          {/* Status Selection */}
          <fieldset>
            <legend className="text-xs font-bold text-[#173e32]">Status Konfirmasi Lapangan</legend>
            <div className="mt-2 grid gap-2">
              {options.map((option) => {
                const selected = status === option.value;
                const Icon = option.icon;

                return (
                  <button 
                    key={option.value} 
                    type="button" 
                    onClick={() => setStatus(option.value)} 
                    className={`min-h-12 rounded-xl border p-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-[#10b981] ${
                      selected 
                        ? option.value === "terverifikasi" 
                          ? "border-[#166534] bg-[#166534]/10 text-[#14532d] shadow-xs" 
                          : option.value === "perlu_cek"
                            ? "border-[#b45309] bg-[#b45309]/10 text-[#78350f] shadow-xs"
                            : "border-[#173e32] bg-[#173e32]/10 text-[#173e32] shadow-xs"
                        : "border-[#173e32]/15 bg-white text-[#36564a] hover:bg-[#f5f1e8]"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <Icon className="size-4 shrink-0" />
                      <span>{option.label}</span>
                    </div>
                    <p className="mt-1 pl-6 text-[11px] leading-4 text-[#557267]">
                      {option.detail}
                    </p>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Catatan Lapangan */}
          <div>
            <label htmlFor="field-notes" className="text-xs font-bold text-[#173e32]">
              Catatan Pengamatan Lapangan
            </label>
            <textarea 
              id="field-notes" 
              rows={3} 
              value={notes} 
              onChange={(event) => setNotes(event.target.value)} 
              placeholder="Contoh: Petak sawah di hilir mengalami penurunan debit saluran sekunder. Petani mulai mengoperasikan pompa air cadangan." 
              className="mt-1.5 w-full rounded-lg border border-[#173e32]/20 bg-white p-3 text-xs sm:text-sm text-[#173e32] placeholder:text-[#557267] focus-visible:outline-2 focus-visible:outline-[#10b981]" 
            />
          </div>

          {/* Nama Petugas Verifikator */}
          <div>
            <label htmlFor="verifier-name" className="text-xs font-bold text-[#173e32]">
              Petugas / Instansi Pelapor
            </label>
            <input
              id="verifier-name"
              type="text"
              value={verifierName}
              onChange={(e) => setVerifierName(e.target.value)}
              placeholder="Contoh: Mantri Tani / PPL Kec. Panai"
              className="mt-1.5 min-h-11 w-full rounded-lg border border-[#173e32]/20 bg-white px-3 text-xs sm:text-sm text-[#173e32] placeholder:text-[#557267] focus-visible:outline-2 focus-visible:outline-[#10b981]"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-[#173e32]/10 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="min-h-11 rounded-lg px-4 text-xs font-semibold text-[#36564a] hover:bg-[#dce7d7] transition-colors focus-visible:outline-2 focus-visible:outline-[#10b981]"
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#173e32] px-5 text-xs font-bold text-[#f5f1e8] hover:bg-[#245542] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10b981]"
            >
              <ShieldCheck className="size-4" />
              <span>Simpan Catatan Verifikasi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
