import { useState, useEffect } from "react";
import { X, Plus, ShieldAlert } from "lucide-react";
import type { InterventionItem } from "@/types/dashboard";

interface AddInterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (intervention: InterventionItem) => void;
}

export function AddInterventionModal({
  isOpen,
  onClose,
  onAdd,
}: AddInterventionModalProps) {
  const [namaProgram, setNamaProgram] = useState("");
  const [jenis, setJenis] = useState<InterventionItem["jenis"]>("Pompanisasi");
  const [kabupatenSasaran, setKabupatenSasaran] = useState("Labuhanbatu");
  const [targetUnitAtauHa, setTargetUnitAtauHa] = useState("");
  const [anggaranEst, setAnggaranEst] = useState("");
  const [status, setStatus] = useState<InterventionItem["status"]>("Direncanakan");
  const [penanggungJawab, setPenanggungJawab] = useState("");
  const [catatan, setCatatan] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!namaProgram.trim()) {
      setErrorMsg("Nama program intervensi wajib diisi.");
      return;
    }
    if (!targetUnitAtauHa.trim()) {
      setErrorMsg("Target unit atau luas lahan intervensi wajib diisi.");
      return;
    }
    if (!penanggungJawab.trim()) {
      setErrorMsg("Penanggung jawab (instansi/tim lapangan) wajib diisi.");
      return;
    }

    const newItem: InterventionItem = {
      id: `int-${Date.now()}`,
      namaProgram: namaProgram.trim(),
      jenis,
      kabupatenSasaran,
      targetUnitAtauHa: targetUnitAtauHa.trim(),
      anggaranEst: anggaranEst.trim() || "Dukungan APBD/APBN",
      status,
      penanggungJawab: penanggungJawab.trim(),
      tanggalMulai: new Date().toISOString().split("T")[0],
      catatan: catatan.trim() || undefined,
    };

    onAdd(newItem);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-int-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#173e32]/50 backdrop-blur-xs"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#173e32]/15 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#173e32]/10 bg-[#fbfaf5] px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-[#173e32]" />
            <h2 id="modal-int-title" className="font-serif text-lg font-bold text-[#173e32]">
              Daftarkan Program Intervensi Mitigasi (F05)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg border border-[#173e32]/10 text-[#557267] hover:bg-[#dce7d7] hover:text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#b97a16]"
            aria-label="Tutup jendela"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="program-input" className="block text-xs font-semibold text-[#173e32] mb-1">
              Nama Program Intervensi
            </label>
            <input
              id="program-input"
              type="text"
              value={namaProgram}
              onChange={(e) => setNamaProgram(e.target.value)}
              placeholder="Contoh: Bantuan Pompanisasi Darurat Sungai Barumun"
              className="w-full rounded-lg border border-[#173e32]/20 bg-white px-3 py-2 text-xs text-[#173e32] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="jenis-select" className="block text-xs font-semibold text-[#173e32] mb-1">
                Jenis Mitigasi
              </label>
              <select
                id="jenis-select"
                value={jenis}
                onChange={(e) => setJenis(e.target.value as InterventionItem["jenis"])}
                className="w-full rounded-lg border border-[#173e32]/20 bg-white px-3 py-2 text-xs text-[#173e32] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
              >
                <option value="Pompanisasi">Pompanisasi</option>
                <option value="Sumur Bor">Sumur Bor</option>
                <option value="Distribusi Benih Tahan Kering">Distribusi Benih Tahan Kering</option>
                <option value="Normalisasi Saluran Irigasi">Normalisasi Saluran Irigasi</option>
              </select>
            </div>

            <div>
              <label htmlFor="target-kab-select" className="block text-xs font-semibold text-[#173e32] mb-1">
                Kabupaten Sasaran
              </label>
              <select
                id="target-kab-select"
                value={kabupatenSasaran}
                onChange={(e) => setKabupatenSasaran(e.target.value)}
                className="w-full rounded-lg border border-[#173e32]/20 bg-white px-3 py-2 text-xs text-[#173e32] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
              >
                <option value="Labuhanbatu">Labuhanbatu</option>
                <option value="Padang Lawas">Padang Lawas</option>
                <option value="Asahan">Asahan</option>
                <option value="Langkat">Langkat</option>
                <option value="Karo">Karo</option>
                <option value="Simalungun">Simalungun</option>
                <option value="Deli Serdang">Deli Serdang</option>
                <option value="Serdang Bedagai">Serdang Bedagai</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="target-unit-input" className="block text-xs font-semibold text-[#173e32] mb-1">
                Target Fisik (Unit atau Ha)
              </label>
              <input
                id="target-unit-input"
                type="text"
                value={targetUnitAtauHa}
                onChange={(e) => setTargetUnitAtauHa(e.target.value)}
                placeholder="Misal: 10 Unit Pompa (Cakupan 300 Ha)"
                className="w-full rounded-lg border border-[#173e32]/20 bg-white px-3 py-2 text-xs text-[#173e32] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
                required
              />
            </div>

            <div>
              <label htmlFor="anggaran-input" className="block text-xs font-semibold text-[#173e32] mb-1">
                Estimasi Anggaran
              </label>
              <input
                id="anggaran-input"
                type="text"
                value={anggaranEst}
                onChange={(e) => setAnggaranEst(e.target.value)}
                placeholder="Misal: Rp 120.000.000"
                className="w-full rounded-lg border border-[#173e32]/20 bg-white px-3 py-2 text-xs text-[#173e32] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="status-select" className="block text-xs font-semibold text-[#173e32] mb-1">
                Status Pelaksanaan
              </label>
              <select
                id="status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as InterventionItem["status"])}
                className="w-full rounded-lg border border-[#173e32]/20 bg-white px-3 py-2 text-xs text-[#173e32] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
              >
                <option value="Direncanakan">Direncanakan</option>
                <option value="Sedang Berjalan">Sedang Berjalan</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>

            <div>
              <label htmlFor="pic-input" className="block text-xs font-semibold text-[#173e32] mb-1">
                Penanggung Jawab (PIC)
              </label>
              <input
                id="pic-input"
                type="text"
                value={penanggungJawab}
                onChange={(e) => setPenanggungJawab(e.target.value)}
                placeholder="Misal: Distan Labuhanbatu & PPL"
                className="w-full rounded-lg border border-[#173e32]/20 bg-white px-3 py-2 text-xs text-[#173e32] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="catatan-int-input" className="block text-xs font-semibold text-[#173e32] mb-1">
              Catatan Lokasi & Detail Dukungan
            </label>
            <textarea
              id="catatan-int-input"
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Titik penempatan alat, kelompok tani penerima, atau kendala lapangan..."
              className="w-full rounded-lg border border-[#173e32]/20 bg-white p-2.5 text-xs text-[#173e32] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
            />
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-[#7c1d0f]">{errorMsg}</p>
          )}

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
              <Plus className="size-3.5" />
              Simpan Intervensi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
