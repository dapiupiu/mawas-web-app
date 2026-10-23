import { ExternalLink, MapPin, Layers } from "lucide-react";
import type { PredictionItem } from "@/types/dashboard";

interface SpatialMapViewProps {
  predictions: PredictionItem[];
  onOpenVerifyModal: (item: PredictionItem) => void;
}

export function SpatialMapView({
  predictions,
  onOpenVerifyModal,
}: SpatialMapViewProps) {
  const critical = predictions.filter((p) => p.kategori === "kritis");
  const waspada = predictions.filter((p) => p.kategori === "waspada");
  const normal = predictions.filter((p) => p.kategori === "normal");

  return (
    <div className="space-y-5">
      {/* Map Control Bar Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#173e32]/12 bg-white p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-[#173e32]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#557267]">
              Peta Pantauan Spasial Wilayah (F01 & F07)
            </span>
          </div>
          <h2 className="mt-1 font-serif text-xl font-bold text-[#173e32]">
            Visualisasi Sebaran Geografis Anomali Lahan
          </h2>
          <p className="mt-1 text-xs text-[#36564a]">
            Analisis spasial per kabupaten berdasarkan citra satelit Sentinel-3 & data curah hujan.
          </p>
        </div>

        <a
          href="/peta-risiko"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#173e32] px-4 py-2.5 text-xs font-bold text-[#f5f1e8] hover:bg-[#245542] transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16]"
        >
          <span>Buka Peta Publik Fullscreen</span>
          <ExternalLink className="size-4" />
        </a>
      </div>

      {/* Spatial Legend & Quick Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-[#bb5b42]/30 bg-[#bb5b42]/10 p-4">
          <span className="size-3 rounded-full bg-[#bb5b42]" />
          <div>
            <p className="text-xs font-bold text-[#7c1d0f]">{critical.length} Kabupaten Kritis (Merah)</p>
            <p className="text-[11px] text-[#7c1d0f]/80">FAPAR di bawah -0.25 & curah hujan sangat rendah</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#966a13]/30 bg-[#966a13]/10 p-4">
          <span className="size-3 rounded-full bg-[#966a13]" />
          <div>
            <p className="text-xs font-bold text-[#5e4107]">{waspada.length} Kabupaten Waspada (Kuning)</p>
            <p className="text-[11px] text-[#5e4107]/80">Penurunan kelembaban tanah terdeteksi</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#166534]/30 bg-[#166534]/10 p-4">
          <span className="size-3 rounded-full bg-[#166534]" />
          <div>
            <p className="text-xs font-bold text-[#166534]">{normal.length} Kabupaten Normal (Hijau)</p>
            <p className="text-[11px] text-[#166534]/80">Kondisi vegetasi dan curah hujan seimbang</p>
          </div>
        </div>
      </div>

      {/* Spatial Kabupaten Grid Cards */}
      <div className="rounded-2xl border border-[#173e32]/12 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#173e32]/10">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-[#173e32]" />
            <h3 className="font-serif text-base font-bold text-[#173e32]">
              Daftar Koordinasi Wilayah Kabupaten Sumatera Utara
            </h3>
          </div>
          <span className="text-xs font-mono text-[#557267]">
            {predictions.length} Entitas Spasial
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {predictions.map((p) => {
            const isKritis = p.kategori === "kritis";
            const isWaspada = p.kategori === "waspada";
            const score = p.skorOverride ?? p.skorRisiko;

            return (
              <div
                key={p.id}
                className="rounded-xl border border-[#173e32]/10 bg-[#fbfaf5] p-3.5 hover:border-[#173e32]/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-[#173e32]">{p.namaKabupaten}</h4>
                    <span className="text-[10px] text-[#557267]">Kode: {p.kodeKabupaten}</span>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      isKritis
                        ? "bg-[#bb5b42]/15 text-[#7c1d0f]"
                        : isWaspada
                          ? "bg-[#966a13]/15 text-[#5e4107]"
                          : "bg-[#166534]/15 text-[#166534]"
                    }`}
                  >
                    Skor {score.toFixed(2)}
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] text-[#36564a]">
                  <div className="rounded bg-white p-1.5 border border-[#173e32]/8">
                    <span className="text-[9px] text-[#557267] block">Anomali FAPAR</span>
                    <span className="font-mono font-bold text-xs">{p.faparAnomaly}</span>
                  </div>
                  <div className="rounded bg-white p-1.5 border border-[#173e32]/8">
                    <span className="text-[9px] text-[#557267] block">Hujan 30 Hari</span>
                    <span className="font-mono font-bold text-xs">{p.curahHujanMm} mm</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#173e32]/8 pt-2">
                  <span className="text-[10px] text-[#557267] truncate max-w-[120px]">
                    {p.statusVerifikasi === "tervalidasi" ? "Tervalidasi" : p.statusVerifikasi === "dikoreksi" ? "Koreksi" : "Menunggu"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenVerifyModal(p)}
                    className="text-[11px] font-semibold text-[#173e32] hover:underline"
                  >
                    Detail Lapangan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
