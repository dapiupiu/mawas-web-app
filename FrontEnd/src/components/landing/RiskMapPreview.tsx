import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Globe, MapPin, Wheat } from "lucide-react";
import { geometryToSvgPath, projectMercator } from "@/lib/geoProjection";
import type { IndonesiaGeoJson, ProvinceFeature } from "@/types/map";
import { matchProvince } from "@/lib/provinces";

function isPointInRing(
  point: [number, number],
  ring: [number, number][],
): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isPointInGeometry(point: [number, number], geometry: any): boolean {
  if (geometry.type === "Polygon") {
    return isPointInRing(point, geometry.coordinates[0]);
  }
  if (geometry.type === "MultiPolygon") {
    for (const poly of geometry.coordinates) {
      if (isPointInRing(point, poly[0])) return true;
    }
  }
  return false;
}

function findUserProvince(
  lng: number,
  lat: number,
  features: ProvinceFeature[],
): ProvinceFeature | null {
  for (const f of features) {
    if (isPointInGeometry([lng, lat], f.geometry)) return f;
  }
  let closest: ProvinceFeature | null = null;
  let minDist = Infinity;
  for (const f of features) {
    const center = f.properties?.center || [0, 0];
    const d = (lng - center[0]) ** 2 + (lat - center[1]) ** 2;
    if (d < minDist) {
      minDist = d;
      closest = f;
    }
  }
  return closest;
}

export function RiskMapPreview() {
  const [searchParams] = useSearchParams();
  const urlProv = searchParams.get("prov");
  const [geoData, setGeoData] = useState<IndonesiaGeoJson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isZoomedIn, setIsZoomedIn] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (urlProv) {
      setIsZoomedIn(true);
    }
  }, [urlProv]);

  // Koordinat pengguna dari localStorage
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(() => {
    const status = localStorage.getItem("mawas_location_status");
    const latStr = localStorage.getItem("mawas_user_lat");
    const lngStr = localStorage.getItem("mawas_user_lng");
    if (status === "granted" && latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return null;
  });

  // Sinkronisasi realtime jika izin lokasi diperbarui
  useEffect(() => {
    const handleLocationUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (
        customEvent.detail?.status === "granted" &&
        typeof customEvent.detail.lat === "number" &&
        typeof customEvent.detail.lng === "number"
      ) {
        setUserCoords({
          lat: customEvent.detail.lat,
          lng: customEvent.detail.lng,
        });
        setIsZoomedIn(true);
      } else if (customEvent.detail?.status !== "granted") {
        setUserCoords(null);
        setIsZoomedIn(false);
      }
    };

    window.addEventListener("mawas_location_updated", handleLocationUpdate);
    return () =>
      window.removeEventListener(
        "mawas_location_updated",
        handleLocationUpdate,
      );
  }, []);

  // Memuat data GeoJSON batas provinsi Indonesia
  useEffect(() => {
    let isMounted = true;
    fetch("/data/indonesia-prov.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat GeoJSON");
        return res.json();
      })
      .then((data: IndonesiaGeoJson) => {
        if (isMounted) {
          setGeoData(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Deteksi provinsi aktif pengguna (prioritas: URL search param > geolocation)
  const activeProvince = useMemo(() => {
    if (!geoData) return null;
    if (urlProv && urlProv.trim()) {
      const found = geoData.features.find((f) => matchProvince(urlProv, f.properties.name));
      if (found) return found;
    }
    if (!userCoords) return null;
    return findUserProvince(userCoords.lng, userCoords.lat, geoData.features);
  }, [geoData, userCoords, urlProv]);

  // Pra-komputasi SVG path
  const provincePaths = useMemo(() => {
    if (!geoData) return [];
    return geoData.features.map((feature) => ({
      id: feature.properties.id,
      name: feature.properties.name,
      kode: feature.properties.kode,
      path: geometryToSvgPath(feature.geometry),
      isUserProvince: activeProvince
        ? feature.properties.kode === activeProvince.properties.kode ||
          feature.properties.name === activeProvince.properties.name
        : false,
    }));
  }, [geoData, activeProvince]);

  // Titik koordinat proyeksi marker pengguna
  const userMarkerPoint = useMemo(() => {
    if (!userCoords) return null;
    return projectMercator([userCoords.lng, userCoords.lat]);
  }, [userCoords]);

  // Kamera target SVG viewBox (zoom ke provinsi pengguna vs seluruh Indonesia)
  const targetViewBox = useMemo(() => {
    if (!activeProvince || !isZoomedIn) {
      return "0 0 1000 380";
    }

    const [minLon, minLat, maxLon, maxLat] = activeProvince.properties.bbox || [
      95, -11, 141, 6,
    ];
    const p1 = projectMercator([minLon, maxLat]);
    const p2 = projectMercator([maxLon, minLat]);

    const provH = Math.max(30, Math.abs(p2[1] - p1[1]));
    const cx = (p1[0] + p2[0]) / 2;
    const cy = (p1[1] + p2[1]) / 2;

    // Hitung viewBox terfokus pada provinsi dengan rasio aspek standar 1000:380 (~2.63 : 1)
    const viewH = Math.max(165, provH * 1.55);
    const viewW = viewH * (1000 / 380);

    const minX = Math.round(cx - viewW / 2);
    const minY = Math.round(cy - viewH / 2);
    const width = Math.round(viewW);
    const height = Math.round(viewH);

    return `${minX} ${minY} ${width} ${height}`;
  }, [activeProvince, isZoomedIn]);

  return (
    <div className="relative w-full bg-transparent">
      {/* Wrapper peta berlatar transparan dengan efek fade halus (mask-image) di pinggir agar tidak patah */}
      <div
        className="relative w-full overflow-hidden select-none pointer-events-none"
        style={{
          maskImage:
            "radial-gradient(ellipse 92% 84% at 50% 50%, #000 50%, transparent 98%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 92% 84% at 50% 50%, #000 50%, transparent 98%)",
        }}
      >
        {isLoading ? (
          <div className="flex h-[260px] sm:h-[320px] w-full items-center justify-center text-xs text-[#557267]">
            Memuat peta wilayah...
          </div>
        ) : (
          <motion.svg
            animate={{ viewBox: targetViewBox }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
            }
            className="h-auto w-full"
            role="img"
            aria-label="Peta wilayah geospasial provinsi Indonesia"
          >
            {/* Garis khatulistiwa kontur tipis */}
            <path
              d="M30 190 Q 500 180 970 190"
              fill="none"
              stroke="#173e32"
              strokeOpacity="0.08"
              strokeWidth="1"
              strokeDasharray="4 8"
              vectorEffect="non-scaling-stroke"
            />

            {/* Render 34 Provinsi GeoJSON */}
            {provincePaths.map((item) => {
              if (activeProvince) {
                if (item.isUserProvince) {
                  // Wilayah provinsi pengguna: Hijau botol Mawas
                  return (
                    <path
                      key={item.id}
                      d={item.path}
                      fill="#173e32"
                      stroke="#ffffff"
                      strokeWidth="1.2"
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                }
                // Wilayah lain: Sage netral lembut
                return (
                  <path
                    key={item.id}
                    d={item.path}
                    fill="#dce5d9"
                    stroke="#c8d6c4"
                    strokeWidth="0.8"
                    opacity="0.85"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              }

              // Jika lokasi belum/tidak diberikan: 1 Indonesia utuh Sabang sampai Merauke
              return (
                <path
                  key={item.id}
                  d={item.path}
                  fill="#36634c"
                  stroke="#f5f1e8"
                  strokeWidth="0.8"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

            {/* Titik pin presisi pengguna */}
            {userMarkerPoint && activeProvince && (
              <g
                transform={`translate(${userMarkerPoint[0]}, ${userMarkerPoint[1]})`}
              >
                <circle
                  r="9"
                  className="animate-ping fill-[#173e32]/35"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  r="3.5"
                  fill="#ffffff"
                  stroke="#173e32"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            )}
          </motion.svg>
        )}
      </div>

      {/* Location label — top-right, floating chip */}
      <div className="pointer-events-none absolute right-0 top-2 z-10 sm:right-1 sm:top-3">
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          className="flex items-center gap-2 rounded-full px-3 py-1.5 sm:px-4 sm:py-2"
          style={{
            background: "rgba(245, 241, 232, 0.82)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {activeProvince ? (
            <>
              <MapPin className="size-3.5 text-[#173e32]" />
              <span className="text-xs font-semibold text-[#173e32]">
                {activeProvince.properties.name}
              </span>
              <span className="text-[10px] text-[#557267]">
                {isZoomedIn ? "Fokus aktif" : "Seluruh wilayah"}
              </span>
            </>
          ) : (
            <>
              <Globe className="size-3.5 text-[#557267]" />
              <span className="text-xs font-semibold text-[#173e32]">
                Indonesia
              </span>
              <span className="text-[10px] text-[#557267]">34 Provinsi</span>
            </>
          )}
        </motion.div>
      </div>

      {/* Kontrol & metadata di bawah peta */}
      <div className="mt-2.5 flex items-center justify-between px-1">
        <span className="text-[11px] font-medium text-[#557267]">
          {activeProvince
            ? `Pantauan satelit ${activeProvince.properties.name} · Siklus 30 hari`
            : "Pantauan satelit 34 Provinsi · Siklus 30 hari"}
        </span>
        {activeProvince && (
          <button
            type="button"
            onClick={() => setIsZoomedIn((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-[#173e32] transition-colors hover:bg-[#173e32]/10 focus-visible:outline-2 focus-visible:outline-[#b97a16]"
            aria-label={
              isZoomedIn
                ? "Lihat seluruh pulau Indonesia"
                : "Fokus ke provinsi saya"
            }
          >
            {isZoomedIn ? (
              <>
                <Globe className="size-3.5 text-[#557267]" />
                <span>Lihat seluruh pulau</span>
              </>
            ) : (
              <>
                <MapPin className="size-3.5 text-[#173e32]" />
                <span>Fokus wilayah saya</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Grid 2 Card di bawah peta: Card 1 (Summary Status) & Card 2 (Distribusi Risiko dengan Pie Chart Dominan) */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* CARD 1: Summary Status Card (Tinggi lebih pendek & kompak, UI tetap persis) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={
            shouldReduceMotion
              ? undefined
              : {
                  y: -3,
                  boxShadow: "0 14px 30px -10px rgba(23,62,50,0.35)",
                }
          }
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={`relative w-full cursor-default overflow-hidden rounded-xl p-3.5 shadow-md sm:p-4 ${
            activeProvince ? "bg-[#9b1c1c]" : "bg-[#173e32]"
          }`}
          style={{ minHeight: "142px" }}
        >
          {/* Wheat dekoratif — pojok kanan atas */}
          <Wheat
            className="absolute -right-3 -top-3 size-20 rotate-[15deg] text-white/[0.06]"
            aria-hidden="true"
          />

          {/* Konten utama */}
          <div className="relative flex h-full flex-col justify-between">
            {/* Baris atas: wilayah + badge status */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  {activeProvince
                    ? activeProvince.properties.name
                    : "Indonesia"}
                </p>
                <p
                  className={`text-xs font-semibold ${
                    activeProvince ? "text-[#fca5a5]" : "text-[#a3d9b1]"
                  }`}
                >
                  {activeProvince ? "Stres vegetasi aktif" : "Kondisi normal"}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  activeProvince
                    ? "bg-white/20 text-white"
                    : "bg-white/15 text-white/90"
                }`}
              >
                {activeProvince ? "Risiko Tinggi" : "Normal"}
              </span>
            </div>

            {/* Baris bawah: angka besar + metrik FAPAR & Hujan */}
            <div className="flex items-end justify-between gap-3 pt-2">
              <div>
                <span className="font-mono text-3xl font-bold leading-none text-white tabular-nums sm:text-4xl">
                  {activeProvince ? "0.52" : "0.18"}
                </span>
                <p className="mt-0.5 text-[10px] font-medium text-white/50">
                  Indeks stres vegetasi
                </p>
              </div>

              {/* Metrik samping */}
              <div className="flex items-end gap-3 text-right">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/40">
                    FAPAR
                  </p>
                  <p
                    className={`font-mono text-xs font-bold leading-tight sm:text-sm ${
                      activeProvince ? "text-[#fca5a5]" : "text-[#a3d9b1]"
                    }`}
                  >
                    {activeProvince ? "-0.22" : "-0.03"}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/40">
                    Hujan
                  </p>
                  <p className="font-mono text-xs font-bold leading-tight text-white/90 sm:text-sm">
                    50 mm
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CARD 2: Distribusi Risiko — Pie Chart Mendominasi, Tinggi Kompak */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={
            shouldReduceMotion
              ? undefined
              : {
                  y: -3,
                  boxShadow: "0 14px 28px -12px rgba(23,62,50,0.14)",
                }
          }
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex w-full flex-col justify-between overflow-hidden rounded-xl border border-[#173e32]/10 bg-[#ffffff]/85 p-3.5 shadow-sm backdrop-blur-xs sm:p-4"
          style={{ minHeight: "142px" }}
        >
          {/* Header Minimalis */}
          <div className="flex items-center justify-between border-b border-[#173e32]/6 pb-1.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#557267]">
                Distribusi Risiko
              </p>
              <h4 className="font-serif text-xs font-bold text-[#173e32]">
                {activeProvince ? activeProvince.properties.name : "Wilayah Pantauan"}
              </h4>
            </div>
            <a
              href="#status-agri"
              className="text-[10px] font-medium text-[#173e32] hover:text-[#b97a16] transition-colors"
            >
              Lihat tabel &rarr;
            </a>
          </div>

          {/* Area Utama: Pie Chart Mendominasi di Kiri + Detail Kategori di Kanan */}
          <div className="flex items-center gap-3.5 py-1">
            {/* PIE / DONUT CHART BESAR & MENDOMINASI (Diameter ~80px) */}
            <div className="relative size-20 shrink-0">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#e8eedd"
                  strokeWidth="12"
                />
                {/* Arc Hijau (36.4% -> strokeDasharray: 87 / 239) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#4caf7d"
                  strokeWidth="12"
                  strokeDasharray="87 239"
                  strokeDashoffset="0"
                />
                {/* Arc Kuning (36.4% -> strokeDasharray: 87 / 239) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#d4a028"
                  strokeWidth="12"
                  strokeDasharray="87 239"
                  strokeDashoffset="-87"
                />
                {/* Arc Merah (27.2% -> strokeDasharray: 65 / 239) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#c0392b"
                  strokeWidth="12"
                  strokeDasharray="65 239"
                  strokeDashoffset="-174"
                />
              </svg>
              {/* Teks di tengah Donut Chart */}
              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                <span className="font-mono text-base font-bold text-[#173e32]">
                  {activeProvince ? "11" : "34"}
                </span>
                <span className="mt-0.5 text-[8.5px] font-bold uppercase tracking-wider text-[#557267]">
                  {activeProvince ? "KAB" : "PROV"}
                </span>
              </div>
            </div>

            {/* Rincian Kategori di Samping Pie Chart Dominan */}
            <div className="min-w-0 flex-1 space-y-1 text-[10.5px]">
              <div className="flex items-baseline justify-between gap-1 leading-snug">
                <span className="font-bold text-[#c0392b]">3 Kritis (27%)</span>
                <span className="truncate text-[10px] text-[#557267]" title={activeProvince ? "Labuhanbatu, Palas, Asahan" : "Sulteng, Papua Sel, NTT"}>
                  {activeProvince ? "Labuhanbatu, Palas, Asahan" : "Sulteng, Papua Sel, NTT"}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-1 leading-snug">
                <span className="font-bold text-[#8a6000]">4 Waspada (36%)</span>
                <span className="truncate text-[10px] text-[#557267]" title={activeProvince ? "Langkat, Karo, Simalungun..." : "Jateng, NTT, Jatim"}>
                  {activeProvince ? "Langkat, Karo, Simalungun..." : "Jateng, NTT, Jatim"}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-1 leading-snug">
                <span className="font-bold text-[#1f5c3a]">4 Normal (36%)</span>
                <span className="truncate text-[10px] text-[#557267]" title={activeProvince ? "Deli Serdang, Sergai..." : "Sumbar, Sulsel, Kaltim"}>
                  {activeProvince ? "Deli Serdang, Sergai..." : "Sumbar, Sulsel, Kaltim"}
                </span>
              </div>
            </div>
          </div>

          {/* Subteks bawah */}
          <div className="border-t border-[#173e32]/6 pt-1 text-[9.5px] text-[#557267] flex justify-between">
            <span>Pemutakhiran satelit 30 hari</span>
            <span className="font-mono text-[#173e32] font-medium">3 Sentra Kritis</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
