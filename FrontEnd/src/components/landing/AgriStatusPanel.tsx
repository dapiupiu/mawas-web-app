import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Clock, HelpCircle, Info, MapPin } from "lucide-react";
import { Reveal } from "./Reveal";
import { risikoApi, type RisikoItem } from "@/lib/api";
import { matchProvince } from "@/lib/provinces";

export interface AgriStatusPanelProps {
  selectedProvince?: string | null;
}

const CATEGORY_CONFIG = {
  tinggi: {
    label: "Merah: Kritis",
    badgeBg: "bg-[#ef4444]/15 text-[#991b1b] border border-[#ef4444]/30",
    dot: "bg-[#ef4444]",
    bar: "bg-[#ef4444]",
  },
  sedang: {
    label: "Kuning: Warning",
    badgeBg: "bg-[#eab308]/20 text-[#854d0e] border border-[#eab308]/40",
    dot: "bg-[#eab308]",
    bar: "bg-[#eab308]",
  },
  rendah: {
    label: "Hijau: Normal",
    badgeBg: "bg-[#22c55e]/15 text-[#166534] border border-[#22c55e]/30",
    dot: "bg-[#22c55e]",
    bar: "bg-[#22c55e]",
  },
  "data tidak tersedia": {
    label: "Hijau: Normal (Pemantauan)",
    badgeBg: "bg-[#22c55e]/15 text-[#166534] border border-[#22c55e]/30",
    dot: "bg-[#22c55e]",
    bar: "bg-[#22c55e]",
  },
} as const;

export function AgriStatusPanel({ selectedProvince: propProvince }: AgriStatusPanelProps) {
  const [searchParams] = useSearchParams();
  const [allRisiko, setAllRisiko] = useState<RisikoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProvince, setUserProvince] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Load real model data
  useEffect(() => {
    let active = true;
    risikoApi
      .getAllRisiko()
      .then((items) => {
        if (active) {
          setAllRisiko(items);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Gagal memuat risiko kabupaten:", err);
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Sync province from geolocation if available
  useEffect(() => {
    const lat = localStorage.getItem("mawas_user_lat");
    const lng = localStorage.getItem("mawas_user_lng");
    const status = localStorage.getItem("mawas_location_status");
    if (status === "granted" && lat && lng) {
      // Find closest province or use standard default
      fetch("/data/indonesia-prov.geojson")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data?.features) return;
          const userLat = parseFloat(lat);
          const userLng = parseFloat(lng);
          let closest = "Jawa Barat";
          let minDist = Infinity;
          for (const f of data.features) {
            const center = f.properties?.center || [0, 0];
            const dist = (userLng - center[0]) ** 2 + (userLat - center[1]) ** 2;
            if (dist < minDist) {
              minDist = dist;
              closest = f.properties?.name;
            }
          }
          setUserProvince(closest);
        })
        .catch(() => {});
    }
  }, []);

  // Priority: URL query param > prop > geolocation > default "Jawa Barat"
  const activeProvince = useMemo(() => {
    const fromUrl = searchParams.get("prov");
    if (fromUrl && fromUrl.trim()) return fromUrl.trim();
    if (propProvince && propProvince.trim()) return propProvince.trim();
    if (userProvince) return userProvince;
    return "Jawa Barat";
  }, [searchParams, propProvince, userProvince]);

  // Filter kabupaten by active province
  const provinceKabupaten = useMemo(() => {
    if (!allRisiko.length) return [];
    return allRisiko.filter(
      (item) => item.provinsi && matchProvince(activeProvince, item.provinsi)
    );
  }, [allRisiko, activeProvince]);

  // If no kabupaten match (e.g. province name typo), fallback to first available
  const displayedKabupaten = useMemo(() => {
    if (provinceKabupaten.length > 0) return provinceKabupaten;
    // Fallback: return top critical items from national dataset
    return allRisiko.slice(0, 15);
  }, [provinceKabupaten, allRisiko]);

  // Statistics count
  const summaryCounts = useMemo(() => {
    const counts = {
      tinggi: 0,
      sedang: 0,
      rendah: 0,
      tidakTersedia: 0,
    };
    for (const item of displayedKabupaten) {
      const kat = (item.kategori || "").toLowerCase();
      if (kat === "tinggi") counts.tinggi += 1;
      else if (kat === "sedang") counts.sedang += 1;
      else if (kat === "rendah") counts.rendah += 1;
      else counts.tidakTersedia += 1;
    }
    return counts;
  }, [displayedKabupaten]);

  return (
    <section
      id="status-wilayah"
      className="border-b border-[#173e32]/10 bg-[#fbfaf5] px-4 py-10 sm:px-6 sm:py-14 lg:px-10 xl:px-12 lg:py-16"
      aria-label={`Rincian risiko kabupaten di ${activeProvince}`}
    >
      <div className="mx-auto w-full max-w-[1680px]">
        {/* Header Section */}
        <Reveal>
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-[#173e32]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#173e32]">
                  DATA MODEL
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-[#b97a16]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#8c570b]">
                  <Clock size={12} />
                  Kondisi per 11 Sep 2026 (Horizon 30 hari)
                </span>
              </div>
              <h2 className="mt-2 font-serif text-2xl tracking-[-0.03em] text-[#173e32] sm:text-3xl lg:text-4xl">
                Status Risiko Vegetasi: Wilayah {activeProvince}
              </h2>
              <p className="mt-1 text-xs text-[#557267] sm:text-sm">
                Menampilkan {displayedKabupaten.length} kabupaten/kota berdasarkan pemrosesan satelit anomali FAPAR & curah hujan BMKG.
              </p>
            </div>

            {/* Category summary counters - 3 Warna Standar Terang */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <div className="flex items-center gap-1.5 rounded-md border border-[#ef4444]/30 bg-[#ef4444]/10 px-3 py-1.5 font-semibold text-[#991b1b]">
                <span className="size-2 rounded-full bg-[#ef4444]" />
                <span>{summaryCounts.tinggi} Merah (Kritis)</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border border-[#eab308]/40 bg-[#eab308]/15 px-3 py-1.5 font-semibold text-[#854d0e]">
                <span className="size-2 rounded-full bg-[#eab308]" />
                <span>{summaryCounts.sedang} Kuning (Warning)</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-1.5 font-semibold text-[#166534]">
                <span className="size-2 rounded-full bg-[#22c55e]" />
                <span>{summaryCounts.rendah + summaryCounts.tidakTersedia} Hijau (Normal)</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Table of Kabupaten */}
        <Reveal>
          <div className="overflow-x-auto rounded-xl border border-[#173e32]/12 bg-[#f5f1e8] shadow-sm">
            {isLoading ? (
              <div className="py-16 text-center text-sm text-[#173e32]/60">
                Memuat data model risiko wilayah...
              </div>
            ) : (
              <table className="w-full min-w-[700px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#173e32]/15 bg-[#173e32]/5 text-[11px] font-semibold uppercase tracking-wider text-[#173e32]">
                    <th className="py-3 pl-4 pr-2">#</th>
                    <th className="py-3 pr-4">Kabupaten / Kota</th>
                    <th className="py-3 pr-4">Tingkat Risiko</th>
                    <th className="py-3 pr-4 text-center">Skor Risiko (0-100)</th>
                    <th className="py-3 pr-4">Faktor Penyebab</th>
                    <th className="py-3 pr-4 text-right">Data Cuaca BMKG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#173e32]/8">
                  {displayedKabupaten.map((item, index) => {
                    const kat = (item.kategori || "data tidak tersedia").toLowerCase() as keyof typeof CATEGORY_CONFIG;
                    const cfg = CATEGORY_CONFIG[kat] || CATEGORY_CONFIG["data tidak tersedia"];
                    const rawFaktor = item.faktor_penyebab;
                    const faktorText = Array.isArray(rawFaktor)
                      ? rawFaktor.join(", ")
                      : rawFaktor || (item.skor_risiko === null ? "Data satelit vegetasi pada periode ini terlalu sedikit (awan/tutupan)" : "Kondisi vegetasi normal");

                    const hasWeather = item.punya_data_cuaca !== false;

                    return (
                      <motion.tr
                        key={item.kode_kabupaten || item.id_fe || index}
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.4) }}
                        className="transition-colors hover:bg-[#173e32]/5"
                      >
                        <td className="py-3 pl-4 pr-2 font-mono text-[11px] text-[#b97a16]">
                          {index + 1}
                        </td>
                        <td className="py-3 pr-4 font-semibold text-[#173e32]">
                          {item.nama_kabupaten}
                          {item.provinsi && (
                            <span className="ml-1.5 text-[10px] font-normal text-[#557267]">
                              ({item.provinsi})
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.badgeBg}`}
                          >
                            <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          {item.skor_risiko !== null && item.skor_risiko !== undefined ? (
                            <div className="inline-flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#173e32]/10">
                                <div
                                  className={`h-full ${cfg.bar}`}
                                  style={{ width: `${Math.min(Number(item.skor_risiko), 100)}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs font-bold text-[#173e32]">
                                {Math.round(Number(item.skor_risiko))}
                              </span>
                            </div>
                          ) : (
                            <span className="italic text-[#64748b]">Data tidak tersedia</span>
                          )}
                        </td>
                        <td className="max-w-xs py-3 pr-4 text-[#36564a]">
                          <span className="line-clamp-2" title={faktorText}>
                            {faktorText}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {hasWeather ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2b5930]">
                              <CheckCircle2 size={13} className="text-[#6d9670]" />
                              Tercakup
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#b97a16]"
                              title="Belum memiliki stasiun CHIRPS BMKG (Pemekaran Papua 2022)"
                            >
                              <HelpCircle size={13} />
                              Pemekaran 2022
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Reveal>

        {/* Footer info notice */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-[#557267]">
          <p className="flex items-center gap-1.5">
            <Info size={14} className="text-[#b97a16] shrink-0" />
            <span>
              Gunakan pencarian provinsi di atas header untuk berpindah wilayah secara seketika.
            </span>
          </p>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-[#173e32]" />
            <span>Fokus Wilayah: <strong>{activeProvince}</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
}
