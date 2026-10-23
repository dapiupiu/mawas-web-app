import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Globe } from "lucide-react";
import { Reveal } from "./Reveal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RiskLevel = "rendah" | "perlu_perhatian" | "tinggi";

interface KabupatenRow {
  name: string;
  level: RiskLevel;
  fapar: string; // e.g. "-0.18"
  stressIndex: string; // e.g. "0.41"
  trend: "naik" | "stabil" | "turun";
}

// ---------------------------------------------------------------------------
// Demo data per context — labeled as illustrative [REAL DATA]
// ---------------------------------------------------------------------------

// Kabupaten di Sumatera Utara (contoh ketika lokasi = Sumut)
const SUMUT_KABUPATEN: KabupatenRow[] = [
  { name: "Deli Serdang",         level: "rendah",          fapar: "+0.05",  stressIndex: "0.18", trend: "stabil" },
  { name: "Serdang Bedagai",      level: "rendah",          fapar: "+0.02",  stressIndex: "0.22", trend: "turun"  },
  { name: "Tapanuli Tengah",      level: "rendah",          fapar: "+0.01",  stressIndex: "0.26", trend: "stabil" },
  { name: "Samosir",              level: "rendah",          fapar: "-0.03",  stressIndex: "0.29", trend: "stabil" },
  { name: "Langkat",              level: "perlu_perhatian", fapar: "-0.12",  stressIndex: "0.43", trend: "naik"   },
  { name: "Karo",                 level: "perlu_perhatian", fapar: "-0.16",  stressIndex: "0.48", trend: "naik"   },
  { name: "Simalungun",           level: "perlu_perhatian", fapar: "-0.18",  stressIndex: "0.52", trend: "stabil" },
  { name: "Tapanuli Selatan",     level: "perlu_perhatian", fapar: "-0.21",  stressIndex: "0.57", trend: "naik"   },
  { name: "Labuhanbatu",          level: "tinggi",          fapar: "-0.28",  stressIndex: "0.68", trend: "naik"   },
  { name: "Padang Lawas",         level: "tinggi",          fapar: "-0.33",  stressIndex: "0.74", trend: "naik"   },
  { name: "Asahan",               level: "tinggi",          fapar: "-0.35",  stressIndex: "0.79", trend: "naik"   },
];

// Ranking provinsi Indonesia (fallback tanpa lokasi)
const PROVINCE_FALLBACK: KabupatenRow[] = [
  { name: "Sumatera Barat",       level: "rendah",          fapar: "+0.04",  stressIndex: "0.12", trend: "turun"  },
  { name: "Sulawesi Selatan",     level: "rendah",          fapar: "+0.01",  stressIndex: "0.18", trend: "stabil" },
  { name: "Kalimantan Timur",     level: "rendah",          fapar: "-0.02",  stressIndex: "0.24", trend: "stabil" },
  { name: "Jawa Tengah",          level: "perlu_perhatian", fapar: "-0.14",  stressIndex: "0.42", trend: "naik"   },
  { name: "Nusa Tenggara Timur",  level: "perlu_perhatian", fapar: "-0.19",  stressIndex: "0.55", trend: "naik"   },
  { name: "Jawa Timur",           level: "perlu_perhatian", fapar: "-0.22",  stressIndex: "0.61", trend: "stabil" },
  { name: "Sulawesi Tengah",      level: "tinggi",          fapar: "-0.29",  stressIndex: "0.73", trend: "naik"   },
  { name: "Papua Selatan",        level: "tinggi",          fapar: "-0.38",  stressIndex: "0.81", trend: "naik"   },
];

// ---------------------------------------------------------------------------
// Level config
// ---------------------------------------------------------------------------

const LEVEL = {
  rendah: {
    label: "Normal",
    bar: "bg-[#4caf7d]",
    text: "text-[#1f5c3a]",
    bg: "bg-[#1f5c3a]/8",
    dot: "bg-[#4caf7d]",
    faparColor: "text-[#1f5c3a]",
  },
  perlu_perhatian: {
    label: "Perlu perhatian",
    bar: "bg-[#d4a028]",
    text: "text-[#8a6000]",
    bg: "bg-[#b97a16]/8",
    dot: "bg-[#d4a028]",
    faparColor: "text-[#8a6000]",
  },
  tinggi: {
    label: "Risiko tinggi",
    bar: "bg-[#c0392b]",
    text: "text-[#7a1a1a]",
    bg: "bg-[#c0392b]/8",
    dot: "bg-[#c0392b]",
    faparColor: "text-[#c0392b]",
  },
} satisfies Record<RiskLevel, object>;

const TREND_ARROW: Record<string, string> = {
  naik: "↑",
  stabil: "–",
  turun: "↓",
};

const TREND_COLOR: Record<string, string> = {
  naik: "text-[#c0392b]",
  stabil: "text-[#557267]",
  turun: "text-[#4caf7d]",
};

// ---------------------------------------------------------------------------
// TableRow
// ---------------------------------------------------------------------------

function TableRow({
  row,
  index,
  isProvince,
}: {
  row: KabupatenRow;
  index: number;
  isProvince: boolean;
}) {
  const cfg = LEVEL[row.level];
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.tr
      initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      className="group border-b border-[#173e32]/8 last:border-0"
    >
      {/* Nomor */}
      <td className="py-2.5 pr-3 font-serif text-sm text-[#b97a16] tabular-nums">
        {index + 1}
      </td>

      {/* Nama */}
      <td className="py-2.5 pr-4">
        <span className="text-sm font-medium text-[#173e32]">
          {row.name}
          {isProvince ? "" : ""}
        </span>
      </td>

      {/* Level tag */}
      <td className="py-2.5 pr-4">
        <span
          className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}
        >
          <span className={`size-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </td>

      {/* Anomali FAPAR */}
      <td className="py-2.5 pr-4 text-right">
        <span className={`font-mono text-xs font-bold ${cfg.faparColor}`}>
          {row.fapar}
        </span>
      </td>

      {/* Indeks stres */}
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-2">
          <div className="h-1 w-16 overflow-hidden rounded-none bg-[#e8ecdf]">
            <motion.div
              className={`h-full ${cfg.bar}`}
              initial={{ width: 0 }}
              whileInView={{ width: `${parseFloat(row.stressIndex) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 + 0.1, ease: "easeOut" }}
            />
          </div>
          <span className={`w-8 text-right font-mono text-[11px] font-bold tabular-nums ${cfg.text}`}>
            {row.stressIndex}
          </span>
        </div>
      </td>

      {/* Trend */}
      <td className={`py-2.5 text-right text-xs font-semibold tabular-nums ${TREND_COLOR[row.trend]}`}>
        {TREND_ARROW[row.trend]}
      </td>
    </motion.tr>
  );
}

// ---------------------------------------------------------------------------
// Geometry helpers (self-contained copy; extract to @/lib if used elsewhere)
// ---------------------------------------------------------------------------

function isPointInRing(point: [number, number], ring: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isPointInGeometry(
  point: [number, number],
  geometry: { type: string; coordinates: unknown }
): boolean {
  if (geometry.type === "Polygon") {
    return isPointInRing(point, (geometry.coordinates as [number, number][][])[0]);
  }
  if (geometry.type === "MultiPolygon") {
    for (const poly of geometry.coordinates as [number, number][][][]) {
      if (isPointInRing(point, poly[0])) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function AgriStatusPanel() {
  const [userProvince, setUserProvince] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>("unknown");

  useEffect(() => {
    const status = localStorage.getItem("mawas_location_status") ?? "unknown";
    setLocationStatus(status);

    const readProvince = async () => {
      const lat = localStorage.getItem("mawas_user_lat");
      const lng = localStorage.getItem("mawas_user_lng");
      if (!lat || !lng || status !== "granted") return;
      try {
        const res = await fetch("/data/indonesia-prov.geojson");
        const data = await res.json();
        const point: [number, number] = [parseFloat(lng), parseFloat(lat)];
        for (const feature of data.features) {
          if (isPointInGeometry(point, feature.geometry)) {
            setUserProvince(feature.properties?.name ?? null);
            return;
          }
        }
        let closest: string | null = null;
        let minDist = Infinity;
        for (const f of data.features) {
          const center = f.properties?.center ?? [0, 0];
          const d = (point[0] - center[0]) ** 2 + (point[1] - center[1]) ** 2;
          if (d < minDist) { minDist = d; closest = f.properties?.name ?? null; }
        }
        setUserProvince(closest);
      } catch { /* silent */ }
    };

    readProvince();

    const handler = () => {
      const s = localStorage.getItem("mawas_location_status") ?? "unknown";
      setLocationStatus(s);
      if (s === "granted") readProvince();
      else setUserProvince(null);
    };
    window.addEventListener("mawas_location_updated", handler);
    return () => window.removeEventListener("mawas_location_updated", handler);
  }, []);

  const hasLocation = locationStatus === "granted" && userProvince;

  // Use Sumut demo data if province detected is in Sumatera Utara,
  // otherwise always show Sumut as demo (representative data). [REAL DATA]
  const rows = hasLocation ? SUMUT_KABUPATEN : PROVINCE_FALLBACK;
  const isProvince = !hasLocation;

  const counts = {
    rendah: rows.filter((r) => r.level === "rendah").length,
    perlu_perhatian: rows.filter((r) => r.level === "perlu_perhatian").length,
    tinggi: rows.filter((r) => r.level === "tinggi").length,
  };

  return (
    <section
      className="border-b border-[#173e32]/10 bg-[#fbfaf5] px-4 py-10 sm:px-6 sm:py-14 lg:px-10 xl:px-12 lg:py-16"
      aria-label={hasLocation ? `Status kabupaten di ${userProvince}` : "Peringkat stres vegetasi provinsi"}
    >
      <div className="mx-auto w-full max-w-[1680px]">
        {/* Header */}
        <Reveal>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#557267]">
                {hasLocation ? "Rincian kabupaten" : "Peringkat provinsi"}
              </p>
              <h2 className="mt-1.5 font-serif text-xl tracking-[-0.03em] text-[#173e32] sm:text-2xl lg:text-3xl">
                {hasLocation
                  ? `Stres vegetasi per kabupaten di ${userProvince}`
                  : "Indeks stres vegetasi seluruh provinsi"}
              </h2>
            </div>

            {/* Summary counts */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-[#4caf7d]" />
                <span className="text-[#1f5c3a] font-medium">{counts.rendah} Normal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-[#d4a028]" />
                <span className="text-[#8a6000] font-medium">{counts.perlu_perhatian} Perhatian</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-[#c0392b]" />
                <span className="text-[#7a1a1a] font-medium">{counts.tinggi} Risiko tinggi</span>
              </div>
              <span className="ml-1 rounded-sm bg-[#173e32]/8 px-1.5 py-0.5 text-[#173e32] font-medium">
                Ilustrasi
              </span>
            </div>
          </div>
        </Reveal>

        {/* Table */}
        <Reveal>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="border-b border-[#173e32]/15">
                  <th className="pb-2 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#557267]">
                    #
                  </th>
                  <th className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-[#557267]">
                    {isProvince ? "Provinsi" : "Kabupaten / Kota"}
                  </th>
                  <th className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-[#557267]">
                    Status
                  </th>
                  <th className="pb-2 pr-4 text-right text-[10px] font-semibold uppercase tracking-wider text-[#557267]">
                    Anomali FAPAR
                  </th>
                  <th className="pb-2 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#557267]">
                    Indeks stres (0–1)
                  </th>
                  <th className="pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-[#557267]">
                    Tren
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <TableRow key={row.name} row={row} index={i} isProvince={isProvince} />
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        {/* Footer note + CTA if no location */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] leading-4 text-[#8a9e8f]">
            Data ilustrasi berdasarkan skenario uji. Nilai aktual tersedia saat sistem operasional. [REAL DATA]
          </p>
          {!hasLocation && (
            <button
              type="button"
              onClick={() => {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    localStorage.setItem("mawas_user_lat", String(pos.coords.latitude));
                    localStorage.setItem("mawas_user_lng", String(pos.coords.longitude));
                    localStorage.setItem("mawas_location_status", "granted");
                    window.dispatchEvent(new Event("mawas_location_updated"));
                  },
                  () => {
                    localStorage.setItem("mawas_location_status", "denied");
                    window.dispatchEvent(new Event("mawas_location_updated"));
                  }
                );
              }}
              className="inline-flex shrink-0 items-center gap-1.5 self-start text-xs font-semibold text-[#173e32] underline underline-offset-4 hover:text-[#245542] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b97a16]"
            >
              <MapPin className="size-3.5" />
              Lihat data kabupaten wilayah saya
            </button>
          )}
          {hasLocation && (
            <div className="flex items-center gap-1.5 text-xs text-[#557267]">
              <MapPin className="size-3.5 text-[#173e32]" />
              <span>{userProvince}</span>
              <Globe className="ml-2 size-3.5" />
              <span>34 Provinsi tercakup</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
