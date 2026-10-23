import { useState, useEffect } from "react";
import { X, Plus, Wheat } from "lucide-react";
import type { ProductionRecord } from "@/types/dashboard";

interface AddProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (record: ProductionRecord) => void;
}

export function AddProductionModal({
  isOpen,
  onClose,
  onAdd,
}: AddProductionModalProps) {
  const [kabupaten, setKabupaten] = useState("Labuhanbatu");
  const [komoditas, setKomoditas] = useState<ProductionRecord["komoditas"]>("Padi Sawah");
  const [luasLahanHa, setLuasLahanHa] = useState("");
  const [estimasiPanenTon, setEstimasiPanenTon] = useState("");
  const [kondisiAir, setKondisiAir] = useState<ProductionRecord["kondisiAir"]>("Cukup");
  const [petugasPelapor, setPetugasPelapor] = useState("");
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
    const luas = parseFloat(luasLahanHa);
    const panen = parseFloat(estimasiPanenTon);

    if (isNaN(luas) || luas <= 0) {
      setErrorMsg("Masukkan angka luas lahan yang valid dalam satuan Hektare.");
      return;
    }
    if (isNaN(panen) || panen <= 0) {
      setErrorMsg("Masukkan estimasi hasil panen yang valid dalam satuan Ton.");
      return;
    }
    if (!petugasPelapor.trim()) {
      setErrorMsg("Nama petugas atau instansi pelapor wajib diisi.");
      return;
    }

    const newRecord: ProductionRecord = {
      id: `prod-${Date.now()}`,
      kodeKabupaten: kabupaten === "Labuhanbatu" ? "12.07" : kabupaten === "Padang Lawas" ? "12.21" : "12.09",
      namaKabupaten: kabupaten,
      komoditas,
      luasLahanHa: luas,
      estimasiPanenTon: panen,
      kondisiAir,
      tanggalLapor: new Date().toISOString().split("T")[0],
      petugasPelapor: petugasPelapor.trim(),
    };

    onAdd(newRecord);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-prod-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#173e32]/50 backdrop-blur-xs"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#173e32]/15 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#173e32]/10 bg-[#fbfaf5] px-6 py-4">
          <div className="flex items-center gap-2">
            <Wheat className="size-5 text-[#173e32]" />
            <h2 id="modal-prod-title" className="font-serif text-lg font-bold text-[#173e32]">
              Catat Data Produksi Pangan Lapangan
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
            <label htmlFor="kabupaten-select" className="block text-xs font-semibold text-[#173e32] mb-1">
              Kabupaten / Wilayah Pantauan
            </label>
            <select
              id="kabupaten-select"
              value={kabupaten}
              onChange={(e) => setKabupaten(e.target.value)}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="komoditas-select" className="block text-xs font-semibold text-[#173e32] mb-1">
                Komoditas Utama
              </label>
              <select
                id="komoditas-select"
                value={komoditas}
                onChange={(e) => setKomoditas(e.target.value as ProductionRecord["komoditas"])}
                className="w-full rounded-lg border border-[#173e32]/20 bg-white px-3 py-2 text-xs text-[#173e32] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
              >
                <option value="Padi Sawah">Padi Sawah</option>
                <option value="Padi Gogo">Padi Gogo</option>
                <option value="Jagung">Jagung</option>
                <option value="Kedelai">Kedelai</option>
              </select>
            </div>

            <div>
              <label htmlFor="kondisi-air-select" className="block text-xs font-semibold text-[#173e32] mb-1">
                Kondisi Sumber Air
              </label>
              <select
                id="kondisi-air-select"
                value={kondisiAir}
                onChange={(e) => setKondisiAir(e.target.value as ProductionRecord["kondisiAir"])}
                className="w-full rounded-lg border border-[#173e32]/20 bg-white px-3 py-2 text-xs text-[#173e32] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
              >
                <option value="Cukup">Cukup (Normal)</option>
                <option value="Menipis">Menipis (Waspada)</option>
                <option value="Defisit Kritis">Defisit Kritis (Bahaya)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="luas-lahan-input" className="block text-xs font-semibold text-[#173e32] mb-1">
                Luas Lahan Terdata (Ha)
              </label>
              <input
                id="luas-lahan-input"
                type="number"
                min="1"
                step="0.1"
                value={luasLahanHa}
                onChange={(e) => setLuasLahanHa(e.target.value)}
                placeholder="Misal: 450"
                className="w-full rounded-lg border border-[#173e32]/20 bg-white px-3 py-2 text-xs text-[#173e32] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
                required
              />
            </div>

            <div>
              <label htmlFor="estimasi-panen-input" className="block text-xs font-semibold text-[#173e32] mb-1">
                Estimasi Panen (Ton)
              </label>
              <input
                id="estimasi-panen-input"
                type="number"
                min="1"
                step="0.1"
                value={estimasiPanenTon}
                onChange={(e) => setEstimasiPanenTon(e.target.value)}
                placeholder="Misal: 2700"
                className="w-full rounded-lg border border-[#173e32]/20 bg-white px-3 py-2 text-xs text-[#173e32] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="petugas-input" className="block text-xs font-semibold text-[#173e32] mb-1">
              Petugas / Instansi Pelapor
            </label>
            <input
              id="petugas-input"
              type="text"
              value={petugasPelapor}
              onChange={(e) => setPetugasPelapor(e.target.value)}
              placeholder="Contoh: Suryanto, SP (PPL Kec. Kualuh Hilir)"
              className="w-full rounded-lg border border-[#173e32]/20 bg-white px-3 py-2 text-xs text-[#173e32] focus:border-[#173e32] focus:outline-none focus:ring-1 focus:ring-[#173e32]"
              required
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
              Simpan Data Produksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
