import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Globe, MapPin, Wheat } from "lucide-react";
import { geometryToSvgPath, projectMercator } from "@/lib/geoProjection";
import type { IndonesiaGeoJson, ProvinceFeature } from "@/types/map";
import { matchProvince } from "@/lib/provinces";
import { latestRisikoPerKabupaten, risikoApi, type RisikoItem } from "@/lib/api";

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
  const [isRiskLoading, setIsRiskLoading] = useState(true);
  const [riskItems, setRiskItems] = useState<RisikoItem[]>([]);
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

  useEffect(() => {
    let active = true;
    risikoApi
      .getAllRisiko()
      .then((items) => {
        if (active) setRiskItems(latestRisikoPerKabupaten(items));
      })
      .catch((error) => {
        console.error("Gagal memuat risiko untuk pratinjau peta:", error);
      })
      .finally(() => {
        if (active) setIsRiskLoading(false);
      });
    return () => {
      active = false;
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

  const getProvinceStats = (provinceName?: string) => {
    const items = provinceName
      ? riskItems.filter(
          (item) => item.provinsi && matchProvince(provinceName, item.provinsi),
        )
      : riskItems;
    const kritis = items.filter((item) => item.kategori === "tinggi").length;
    const waspada = items.filter((item) => item.kategori === "sedang").length;
    const normal = items.filter((item) => item.kategori === "rendah").length;
    const unavailable = items.filter(
      (item) =>
        item.skor_risiko === null ||
        item.kategori === "data tidak tersedia",
    ).length;
    const scores = items
      .map((item) => item.skor_risiko)
      .filter((score): score is number => score !== null && Number.isFinite(score));
    const totalScored = scores.length;
    return {
      items,
      kritis,
      waspada,
      normal,
      unavailable,
      total: items.length,
      totalScored,
      averageScore: totalScored
        ? scores.reduce((sum, score) => sum + score, 0) / totalScored
        : null,
      color:
        kritis > 0
          ? "#ef4444"
          : waspada > 0
            ? "#eab308"
            : normal > 0
              ? "#22c55e"
              : "#dce5d9",
      status:
        kritis > 0
          ? "Kritis"
          : waspada > 0
            ? "Waspada"
            : normal > 0
              ? "Normal"
              : "Data tidak tersedia",
    };
  };

  const activeStats = getProvinceStats(activeProvince?.properties.name);
  const displayedStats = activeStats;
  const circumference = 239;
  const greenArc = displayedStats.totalScored
    ? (displayedStats.normal / displayedStats.totalScored) * circumference
    : 0;
  const yellowArc = displayedStats.totalScored
    ? (displayedStats.waspada / displayedStats.totalScored) * circumference
    : 0;
  const redArc = displayedStats.totalScored
    ? (displayedStats.kritis / displayedStats.totalScored) * circumference
    : 0;
  const percentage = (count: number) =>
    displayedStats.totalScored
      ? Math.round((count / displayedStats.totalScored) * 100)
      : 0;
  const categoryExamples = (category: "tinggi" | "sedang" | "rendah") =>
    displayedStats.items
      .filter((item) => item.kategori === category)
      .slice(0, 3)
      .map((item) => item.nama_kabupaten)
      .join(", ") || "Tidak ada data";
  const snapshotDate = displayedStats.items
    .map((item) => item.tanggal)
    .filter((date): date is string => Boolean(date))
    .sort()
    .at(-1);

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
        {isLoading || isRiskLoading ? (
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
              const stats = getProvinceStats(item.name);
              const focused = item.isUserProvince && isZoomedIn;
              return (
                <path
                  key={item.id}
                  d={item.path}
                  fill={stats.color}
                  stroke={focused ? "#173e32" : "#f5f1e8"}
                  strokeWidth={focused ? "1.8" : "0.8"}
                  opacity={stats.total ? 0.9 : 0.65}
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
            activeStats.kritis > 0
              ? "bg-[#9b1c1c]"
              : activeStats.waspada > 0
                ? "bg-[#eab308]"
                : activeStats.normal > 0
                  ? "bg-[#173e32]"
                  : "bg-slate-500"
          }`}
          style={{ minHeight: "142px" }}
        >
          {/* Wheat dekoratif — pojok kanan atas */}
          <Wheat
            className={`absolute -right-3 -top-3 size-20 rotate-[15deg] ${
              activeStats.waspada > 0 ? "text-black/[0.06]" : "text-white/[0.06]"
            }`}
            aria-hidden="true"
          />

          {/* Konten utama */}
          <div className="relative flex h-full flex-col justify-between">
            {/* Baris atas: wilayah + badge status */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                  activeStats.waspada > 0 ? "text-[#713f12]/70" : "text-white/50"
                }`}>
                  {activeProvince
                    ? activeProvince.properties.name
                    : "Indonesia"}
                </p>
                <p
                  className={`text-xs font-semibold ${
                    activeStats.kritis > 0
                      ? "text-[#fca5a5]"
                      : activeStats.waspada > 0
                        ? "text-[#422006]"
                        : activeStats.normal > 0
                          ? "text-[#a3d9b1]"
                          : "text-white/80"
                  }`}
                >
                  Status risiko wilayah
                </p>
              </div>
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  activeStats.kritis > 0
                    ? "bg-[#ef4444]/20 text-[#fecaca]"
                    : activeStats.waspada > 0
                      ? "bg-[#ca8a04] text-[#422006]"
                      : activeStats.normal > 0
                        ? "bg-[#22c55e]/20 text-[#bbf7d0]"
                        : "bg-white/15 text-white/80"
                }`}
              >
                {activeStats.status}
              </span>
            </div>

            {/* Ringkasan skor dan jumlah kategori dari risiko wilayah */}
            <div className="flex items-end justify-between gap-3 pt-2">
              <div>
                <span className={`font-mono text-3xl font-bold leading-none tabular-nums sm:text-4xl ${
                  activeStats.waspada > 0 ? "text-[#422006]" : "text-white"
                }`}>
                  {activeStats.averageScore === null
                    ? "—"
                    : Math.round(activeStats.averageScore)}
                </span>
                <p className={`mt-0.5 text-[10px] font-medium ${
                  activeStats.waspada > 0 ? "text-[#713f12]/80" : "text-white/50"
                }`}>
                  Skor risiko rata-rata / 100
                </p>
              </div>

              {/* Metrik samping */}
              <div className="flex items-end gap-3 text-right">
                <div>
                  <p className={`text-[9px] uppercase tracking-wider ${
                    activeStats.waspada > 0 ? "text-[#713f12]/70" : "text-white/40"
                  }`}>
                    Kritis
                  </p>
                  <p
                    className={`font-mono text-xs font-bold leading-tight sm:text-sm ${
                      activeStats.kritis > 0
                        ? "text-[#fca5a5]"
                        : activeStats.waspada > 0
                          ? "text-[#713f12]"
                          : "text-[#a3d9b1]"
                    }`}
                  >
                    {activeStats.kritis}
                  </p>
                </div>
                <div>
                  <p className={`text-[9px] uppercase tracking-wider ${
                    activeStats.waspada > 0 ? "text-[#713f12]/70" : "text-white/40"
                  }`}>
                    Data
                  </p>
                  <p className={`font-mono text-xs font-bold leading-tight sm:text-sm ${
                    activeStats.waspada > 0 ? "text-[#422006]" : "text-white/90"
                  }`}>
                    {activeStats.totalScored}/{activeStats.total}
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
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#4caf7d"
                  strokeWidth="12"
                  strokeDasharray={`${greenArc} ${circumference - greenArc}`}
                  strokeDashoffset="0"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#d4a028"
                  strokeWidth="12"
                  strokeDasharray={`${yellowArc} ${circumference - yellowArc}`}
                  strokeDashoffset={-greenArc}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#c0392b"
                  strokeWidth="12"
                  strokeDasharray={`${redArc} ${circumference - redArc}`}
                  strokeDashoffset={-(greenArc + yellowArc)}
                />
              </svg>
              {/* Teks di tengah Donut Chart */}
              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                <span className="font-mono text-base font-bold text-[#173e32]">
                  {displayedStats.total}
                </span>
                <span className="mt-0.5 text-[8.5px] font-bold uppercase tracking-wider text-[#557267]">
                  {activeProvince ? "KAB" : "DATA"}
                </span>
              </div>
            </div>

            {/* Rincian Kategori di Samping Pie Chart Dominan */}
            <div className="min-w-0 flex-1 space-y-1 text-[10.5px]">
              <div className="flex items-baseline justify-between gap-1 leading-snug">
                <span className="font-bold text-[#c0392b]">
                  {displayedStats.kritis} Kritis ({percentage(displayedStats.kritis)}%)
                </span>
                <span className="truncate text-[10px] text-[#557267]" title={categoryExamples("tinggi")}>
                  {categoryExamples("tinggi")}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-1 leading-snug">
                <span className="font-bold text-[#8a6000]">
                  {displayedStats.waspada} Waspada ({percentage(displayedStats.waspada)}%)
                </span>
                <span className="truncate text-[10px] text-[#557267]" title={categoryExamples("sedang")}>
                  {categoryExamples("sedang")}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-1 leading-snug">
                <span className="font-bold text-[#1f5c3a]">
                  {displayedStats.normal} Normal ({percentage(displayedStats.normal)}%)
                </span>
                <span className="truncate text-[10px] text-[#557267]" title={categoryExamples("rendah")}>
                  {categoryExamples("rendah")}
                </span>
              </div>
            </div>
          </div>

          {/* Subteks bawah */}
          <div className="border-t border-[#173e32]/6 pt-1 text-[9.5px] text-[#557267] flex justify-between">
            <span>
              {snapshotDate ? `Snapshot ${snapshotDate}` : "Snapshot risiko tidak tersedia"}
            </span>
            <span className="font-mono text-[#173e32] font-medium">
              {displayedStats.totalScored} berdata · {displayedStats.unavailable} tanpa skor
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
