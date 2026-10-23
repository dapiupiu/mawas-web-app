import { useState, useRef } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { 
  UploadCloud, 
  FileCheck2, 
  AlertCircle, 
  Database, 
  CheckCircle2, 
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import type { PredictionItem, VerificationStatus } from "@/types/dashboard";
import { 
  parseModelJsonToPredictions, 
  getDashboardModelMeta, 
  saveDashboardModelMeta, 
  type ModelMetadata 
} from "@/lib/dashboardData";

interface UploadModelViewProps {
  currentPredictions: PredictionItem[];
  onModelUpdated: (newPredictions: PredictionItem[], meta: ModelMetadata) => void;
}

export function UploadModelView({ currentPredictions, onModelUpdated }: UploadModelViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<{
    predictions: PredictionItem[];
    metadata: ModelMetadata;
    filename: string;
  } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeMeta = getDashboardModelMeta();

  // Create verification preservation map
  const existingMap = new Map<string, { status: VerificationStatus; catatan?: string; diverifikasiOleh?: string }>();
  for (const item of currentPredictions) {
    if (item.statusVerifikasi !== "menunggu" || item.catatanOperator) {
      existingMap.set(item.kodeKabupaten, {
        status: item.statusVerifikasi,
        catatan: item.catatanOperator,
        diverifikasiOleh: item.diverifikasiOleh,
      });
    }
  }

  const processFile = (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!file.name.endsWith(".json")) {
      setErrorMsg("Format file harus berupa .json (output model prediksi).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);
        const { predictions, metadata } = parseModelJsonToPredictions(json, existingMap);

        setParsedResult({
          predictions,
          metadata,
          filename: file.name,
        });
      } catch (err: any) {
        setErrorMsg(err.message || "Gagal memproses file JSON. Pastikan struktur data valid.");
      }
    };
    reader.onerror = () => {
      setErrorMsg("Terjadi kegagalan membaca file fisik.");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleApplyUpdate = () => {
    if (!parsedResult) return;
    setLoading(true);

    try {
      saveDashboardModelMeta(parsedResult.metadata);
      onModelUpdated(parsedResult.predictions, parsedResult.metadata);
      setSuccessMsg(
        `Sukses menerapkan model dari ${parsedResult.filename}. Sebanyak ${parsedResult.predictions.length} kabupaten berhasil diperbarui ke dalam sistem.`
      );
      setParsedResult(null);
    } catch (err: any) {
      setErrorMsg("Gagal menyimpan data model: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to load bundled file
  const handleLoadBundledLatest = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/data/risiko_kabupaten_terbaru.json");
      if (!res.ok) throw new Error("Gagal mengambil file risiko_kabupaten_terbaru.json dari server.");
      const json = await res.json();
      const { predictions, metadata } = parseModelJsonToPredictions(json, existingMap);
      setParsedResult({
        predictions,
        metadata,
        filename: "risiko_kabupaten_terbaru.json (Bundled ML Service)",
      });
    } catch (err: any) {
      setErrorMsg("Gagal memuat file lokal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="rounded-xl border border-[#173e32]/15 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#10b981]">
          <Database className="size-4" />
          <span>Modul Sinkronisasi Model Satelit</span>
        </div>
        <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#173e32]">
          Pembaruan Output Model ML (JSON)
        </h2>
        <p className="mt-2 max-w-2xl text-xs sm:text-sm text-[#557267] leading-relaxed">
          Unggah file output prediksi model terbaru dari tim Data Science/ML (contoh: <code className="font-mono bg-[#f5f1e8] px-1 py-0.5 rounded text-[#173e32]">risiko_kabupaten_terbaru.json</code>). Sistem akan memperbarui prediksi risiko seluruh kabupaten tanpa menghapus catatan verifikasi lapangan yang sudah ada.
        </p>

        {/* Current Active Model Stats */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[#173e32]/10 pt-4 text-xs">
          <div>
            <span className="text-[#557267]">Tanggal Acuan Model:</span>
            <p className="mt-0.5 font-bold font-mono text-[#173e32]">{activeMeta.tanggalAcuan}</p>
          </div>
          <div>
            <span className="text-[#557267]">Horizon Prediksi:</span>
            <p className="mt-0.5 font-bold font-mono text-[#173e32]">{activeMeta.horizonHari} Hari</p>
          </div>
          <div>
            <span className="text-[#557267]">Status Integritas Data:</span>
            <p className="mt-0.5 font-bold text-[#10b981] capitalize">{activeMeta.statusData}</p>
          </div>
          <div>
            <span className="text-[#557267]">Total Kabupaten Terdata:</span>
            <p className="mt-0.5 font-bold font-mono text-[#173e32]">{currentPredictions.length} Wilayah</p>
          </div>
        </div>
      </section>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-[#166534]/30 bg-[#dcfce7] p-4 text-xs text-[#14532d]">
          <CheckCircle2 className="size-5 shrink-0 text-[#166534] mt-0.5" />
          <div>
            <p className="font-bold">Pembaruan Model Berhasil Diterapkan</p>
            <p className="mt-1 leading-relaxed">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-[#991b1b]/30 bg-[#fee2e2] p-4 text-xs text-[#991b1b]">
          <AlertCircle className="size-5 shrink-0 text-[#991b1b] mt-0.5" />
          <div>
            <p className="font-bold">Gagal Memproses File</p>
            <p className="mt-1 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Upload Drag & Drop Area */}
      <section className="rounded-xl border border-[#173e32]/15 bg-white p-6 sm:p-8 shadow-sm">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-[#10b981] bg-[#10b981]/5"
              : "border-[#173e32]/25 bg-[#fbfaf6] hover:bg-[#f1f6ef] hover:border-[#173e32]/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="grid size-14 place-items-center rounded-2xl bg-[#173e32] text-[#f5f1e8] shadow-md">
            <UploadCloud className="size-7 text-[#34d399]" />
          </div>

          <h3 className="mt-4 font-serif text-lg font-bold text-[#173e32]">
            Tarik & Jatuhkan File JSON di Sini
          </h3>
          <p className="mt-1 text-xs text-[#557267]">
            atau klik untuk memilih file dari komputer Anda
          </p>

          <span className="mt-3 inline-block rounded-md border border-[#173e32]/10 bg-white px-2.5 py-1 text-[11px] font-mono text-[#557267]">
            Format didukung: .json (Skema Output Mawas FAPAR)
          </span>
        </div>

        {/* Quick action button for local bundled model file */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#173e32]/10 pt-4">
          <p className="text-xs text-[#557267]">
            Tersedia file model bawaan: <strong className="text-[#173e32]">risiko_kabupaten_terbaru.json</strong> (514 kabupaten)
          </p>

          <button
            type="button"
            onClick={handleLoadBundledLatest}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#173e32]/20 bg-white px-3.5 text-xs font-bold text-[#173e32] hover:bg-[#dce7d7] transition-colors focus-visible:outline-2 focus-visible:outline-[#10b981]"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Muat Dari ml-service Bundled</span>
          </button>
        </div>
      </section>

      {/* Inspection & Confirmation Review Panel */}
      {parsedResult && (
        <section className="rounded-xl border border-[#10b981]/40 bg-[#f1f6ef] p-6 shadow-md animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#065f46]">
            <FileCheck2 className="size-4" />
            <span>Hasil Verifikasi File Model Baru</span>
          </div>

          <h3 className="mt-1 font-serif text-xl font-bold text-[#173e32]">
            {parsedResult.filename}
          </h3>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg bg-white p-3 border border-[#173e32]/10">
              <span className="text-[#557267]">Jumlah Kabupaten:</span>
              <p className="font-mono text-lg font-bold text-[#173e32]">{parsedResult.predictions.length}</p>
            </div>
            <div className="rounded-lg bg-white p-3 border border-[#173e32]/10">
              <span className="text-[#557267]">Risiko Tinggi (Kritis):</span>
              <p className="font-mono text-lg font-bold text-[#991b1b]">
                {parsedResult.predictions.filter((p) => p.kategori === "kritis").length}
              </p>
            </div>
            <div className="rounded-lg bg-white p-3 border border-[#173e32]/10">
              <span className="text-[#557267]">Perlu Perhatian (Waspada):</span>
              <p className="font-mono text-lg font-bold text-[#b45309]">
                {parsedResult.predictions.filter((p) => p.kategori === "waspada").length}
              </p>
            </div>
            <div className="rounded-lg bg-white p-3 border border-[#173e32]/10">
              <span className="text-[#557267]">Normal:</span>
              <p className="font-mono text-lg font-bold text-[#166534]">
                {parsedResult.predictions.filter((p) => p.kategori === "normal").length}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-white p-3 text-xs text-[#36564a] border border-[#173e32]/10 leading-relaxed">
            <strong>Catatan Model:</strong> {parsedResult.metadata.catatan || "Output model Mawas (aturan deviasi FAPAR + konteks hujan BMKG)."}
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setParsedResult(null)}
              className="min-h-11 rounded-lg px-4 text-xs font-semibold text-[#36564a] hover:bg-white"
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={handleApplyUpdate}
              disabled={loading}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#173e32] px-5 text-xs font-bold text-[#f5f1e8] hover:bg-[#245542] transition-colors focus-visible:outline-2 focus-visible:outline-[#10b981]"
            >
              <ShieldCheck className="size-4" />
              <span>{loading ? "Menerapkan..." : "Terapkan Pembaruan ke Sistem"}</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
