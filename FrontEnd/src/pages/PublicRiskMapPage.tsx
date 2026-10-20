import {
  AlertCircle,
  ArrowLeft,
  CloudRain,
  ChevronRight,
  Info,
  Leaf,
  Layers,
  LocateFixed,
  Map as MapIcon,
  MapPinned,
  Minus,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  type FormEvent,
  type PointerEvent,
  type WheelEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/map/SearchableSelect";
import type {
  IndonesiaGeoJson,
  KabupatenFeature,
  KabupatenGeoJson,
  ProvinceFeature,
} from "@/types/map";
import { geometryToSvgPath, projectMercator } from "@/lib/geoProjection";

type Point = { x: number; y: number };
type Gesture = { distance: number; midpoint: Point; zoom: number; pan: Point };
type MapGranularity = "provinsi" | "kabupaten";

type KabupatenListItem = {
  id: string;
  name: string;
  prov_id: string;
  prov_name: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function PublicRiskMapPage() {
  // Province level state
  const [geoData, setGeoData] = useState<IndonesiaGeoJson | null>(null);
  const [isLoadingProv, setIsLoadingProv] = useState(true);
  const [loadProvError, setLoadProvError] = useState<string | null>(null);

  // Kabupaten level state
  const [allKabList, setAllKabList] = useState<KabupatenListItem[]>([]);
  const [activeKabData, setActiveKabData] = useState<KabupatenGeoJson | null>(
    null,
  );
  const [isLoadingKab, setIsLoadingKab] = useState(false);
  const [loadKabError, setLoadKabError] = useState<string | null>(null);

  // Navigation and selection state
  const [granularity, setGranularity] = useState<MapGranularity>("provinsi");
  const [selectedProvinceName, setSelectedProvinceName] = useState<
    string | null
  >(null);
  const [selectedKabupatenName, setSelectedKabupatenName] = useState<
    string | null
  >(null);

  // Search filter query
  const [searchState, setSearchState] = useState("Pilih wilayah pada peta.");

  // Mobile drawer toggle
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  // Gesture and view transforms
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const reduceMotion = useReducedMotion();

  // Load provinces GeoJSON on mount
  useEffect(() => {
    let ignore = false;
    fetch("/data/indonesia-prov.geojson")
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((data: IndonesiaGeoJson) => {
        if (!ignore) {
          setGeoData(data);
          setIsLoadingProv(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setLoadProvError(
            err instanceof Error ? err.message : "Gagal memuat batas provinsi.",
          );
          setIsLoadingProv(false);
        }
      });

    // Load lightweight kabupaten index for instant search
    fetch("/data/kabupaten-list.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((list: KabupatenListItem[]) => {
        if (!ignore) setAllKabList(list);
      })
      .catch(() => {
        // Fallback silently if list fails
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Projected province SVG paths
  const projectedProvinces = useMemo(() => {
    if (!geoData?.features) return [];
    return geoData.features.map((feature) => ({
      feature,
      path: geometryToSvgPath(feature.geometry),
      centerSvg: projectMercator(feature.properties.center),
    }));
  }, [geoData]);

  // Projected active kabupaten SVG paths
  const projectedKabupaten = useMemo(() => {
    if (!activeKabData?.features) return [];
    return activeKabData.features.map((feature) => ({
      feature,
      path: geometryToSvgPath(feature.geometry),
      centerSvg: projectMercator(feature.properties.center),
    }));
  }, [activeKabData]);

  // Province dropdown options
  const provinceOptions = useMemo(() => {
    if (!geoData?.features) return [];
    return geoData.features.map((f) => f.properties.name).sort();
  }, [geoData]);

  // Selected province feature
  const selectedProvinceFeature: ProvinceFeature | null = useMemo(() => {
    if (!selectedProvinceName || !geoData?.features) return null;
    return (
      geoData.features.find(
        (f) => f.properties.name === selectedProvinceName,
      ) || null
    );
  }, [selectedProvinceName, geoData]);

  // Kabupaten dropdown options
  const kabupatenOptions = useMemo(() => {
    if (selectedProvinceName && selectedProvinceFeature) {
      const pid = String(selectedProvinceFeature.properties.kode);
      const filtered = allKabList.filter((k) => k.prov_id === pid);
      if (filtered.length > 0) return filtered.map((k) => k.name).sort();
      if (activeKabData?.features) {
        return activeKabData.features.map((k) => k.properties.kab_name).sort();
      }
    }
    return allKabList.map((k) => `${k.name} (${k.prov_name})`).sort();
  }, [
    selectedProvinceName,
    selectedProvinceFeature,
    allKabList,
    activeKabData,
  ]);

  // Selected kabupaten feature
  const selectedKabupatenFeature: KabupatenFeature | null = useMemo(() => {
    if (!selectedKabupatenName || !activeKabData?.features) return null;
    return (
      activeKabData.features.find(
        (f) =>
          f.properties.kab_name.toLowerCase() ===
            selectedKabupatenName.toLowerCase() ||
          f.properties.id ===
            selectedKabupatenName.toLowerCase().replace(/ /g, "-"),
      ) || null
    );
  }, [selectedKabupatenName, activeKabData]);

  // Load kabupaten GeoJSON when province is selected or granularity is kabupaten
  const loadKabupatenForProvince = (provinceKode: number | string) => {
    setIsLoadingKab(true);
    setLoadKabError(null);

    fetch(`/data/kabupaten/${provinceKode}.json`)
      .then((res) => {
        if (!res.ok)
          throw new Error(
            `Berkas kabupaten untuk kode ${provinceKode} tidak ditemukan.`,
          );
        return res.json();
      })
      .then((data: KabupatenGeoJson) => {
        setActiveKabData(data);
        setIsLoadingKab(false);
      })
      .catch((err) => {
        setLoadKabError(
          err instanceof Error ? err.message : "Gagal memuat batas kabupaten.",
        );
        setIsLoadingKab(false);
      });
  };

  // Smoothly center and zoom to a province
  const zoomToProvince = (feature: ProvinceFeature) => {
    const bbox = feature.properties.bbox;
    const pMin = projectMercator([bbox[0], bbox[3]]);
    const pMax = projectMercator([bbox[2], bbox[1]]);
    const w = Math.max(Math.abs(pMax[0] - pMin[0]), 24);
    const h = Math.max(Math.abs(pMax[1] - pMin[1]), 24);
    const c = projectMercator(feature.properties.center);

    const targetZoom = clamp(Math.min(560 / w, 240 / h), 1.8, 8.5);
    const targetPanX = clamp((500 - c[0]) * targetZoom, -2600, 2600);
    const targetPanY = clamp((190 - c[1]) * targetZoom, -1800, 1800);

    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
  };

  // Center on a specific kabupaten
  const zoomToKabupaten = (feature: KabupatenFeature) => {
    const c = projectMercator(feature.properties.center);
    const currentZoom = Math.max(zoom, 5.5);
    const targetPanX = clamp((500 - c[0]) * currentZoom, -2600, 2600);
    const targetPanY = clamp((190 - c[1]) * currentZoom, -1800, 1800);

    setZoom(currentZoom);
    setPan({ x: targetPanX, y: targetPanY });
  };

  // Handle province selection
  const selectProvince = (name: string, switchToKabupaten = false) => {
    setSelectedProvinceName(name);
    setSelectedKabupatenName(null);

    const feat = geoData?.features.find((f) => f.properties.name === name);
    if (feat) {
      loadKabupatenForProvince(feat.properties.kode);
      if (switchToKabupaten) {
        setGranularity("kabupaten");
        zoomToProvince(feat);
      } else {
        zoomToProvince(feat);
      }
      setSearchState(`Data Provinsi ${name}.`);
    }
  };

  // Handle kabupaten selection
  const selectKabupaten = (kabName: string) => {
    // If name contains province suffix, e.g. "Kabupaten Karawang (Jawa Barat)"
    const cleanName = kabName.replace(/\s\([^)]+\)$/, "").trim();
    setSelectedKabupatenName(cleanName);

    // If province is not set or differs, find province from allKabList
    const match = allKabList.find(
      (k) => k.name.toLowerCase() === cleanName.toLowerCase(),
    );
    if (match && match.prov_name !== selectedProvinceName) {
      setSelectedProvinceName(match.prov_name);
      loadKabupatenForProvince(match.prov_id);
      setGranularity("kabupaten");
    } else {
      setGranularity("kabupaten");
    }

    if (activeKabData?.features) {
      const feat = activeKabData.features.find(
        (f) => f.properties.kab_name.toLowerCase() === cleanName.toLowerCase(),
      );
      if (feat) {
        zoomToKabupaten(feat);
        setSearchState(`Data ${cleanName}.`);
      }
    }
  };

  // Reset to full Indonesia overview
  const resetToIndonesia = () => {
    setGranularity("provinsi");
    setSelectedProvinceName(null);
    setSelectedKabupatenName(null);
    setActiveKabData(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSearchState("Pilih wilayah pada peta.");
  };

  const showProvinceMap = () => {
    setGranularity("provinsi");
    setSelectedKabupatenName(null);
  };

  // A selection from the search list may arrive before its boundary data.
  useEffect(() => {
    if (!selectedKabupatenName || !activeKabData?.features) return;
    const feature = activeKabData.features.find(
      (item) =>
        item.properties.kab_name.toLowerCase() ===
        selectedKabupatenName.toLowerCase(),
    );
    if (!feature) return;
    zoomToKabupaten(feature);
    setSearchState(`Data ${feature.properties.kab_name}.`);
  }, [activeKabData, selectedKabupatenName]);

  // Form submit
  const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedKabupatenName) {
      selectKabupaten(selectedKabupatenName);
    } else if (selectedProvinceName) {
      selectProvince(selectedProvinceName);
    }
    setIsMobilePanelOpen(false);
  };

  // Touch and pointer gestures
  function startGesture(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointers.current.size === 1) {
      gesture.current = {
        distance: 0,
        midpoint: { x: event.clientX, y: event.clientY },
        zoom,
        pan,
      };
    } else if (pointers.current.size === 2) {
      const [first, second] = [...pointers.current.values()];
      gesture.current = {
        distance: Math.hypot(second.x - first.x, second.y - first.y),
        midpoint: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
        zoom,
        pan,
      };
    }
  }

  function moveGesture(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    event.preventDefault();
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (pointers.current.size === 1) {
      const previous = gesture.current;
      if (!previous) {
        gesture.current = {
          distance: 0,
          midpoint: { x: event.clientX, y: event.clientY },
          zoom,
          pan,
        };
        return;
      }
      setPan({
        x: clamp(previous.pan.x + event.clientX - previous.midpoint.x, -2600, 2600),
        y: clamp(previous.pan.y + event.clientY - previous.midpoint.y, -1800, 1800),
      });
      return;
    }
    if (pointers.current.size !== 2 || !gesture.current) return;
    const [first, second] = [...pointers.current.values()];
    const distance = Math.hypot(second.x - first.x, second.y - first.y);
    const midpoint = {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    };
    setZoom(
      clamp(
        gesture.current.zoom * (distance / gesture.current.distance),
        0.85,
        12,
      ),
    );
    setPan({
      x: clamp(
        gesture.current.pan.x + midpoint.x - gesture.current.midpoint.x,
        -2600,
        2600,
      ),
      y: clamp(
        gesture.current.pan.y + midpoint.y - gesture.current.midpoint.y,
        -1800,
        1800,
      ),
    });
  }

  function endGesture(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size === 1) {
      const remaining = [...pointers.current.values()][0];
      gesture.current = {
        distance: 0,
        midpoint: remaining,
        zoom,
        pan,
      };
      return;
    }
    gesture.current = null;
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    if (event.ctrlKey) {
      setZoom((value) => clamp(value - event.deltaY * 0.002, 0.85, 12));
      return;
    }
    setPan((current) => ({
      x: clamp(current.x - event.deltaX, -2600, 2600),
      y: clamp(current.y - event.deltaY, -1800, 1800),
    }));
  }

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[#e8ecdf] text-[#173e32]">
      {/* Background terrain grain */}
      <div
        className="absolute inset-0 map-grain pointer-events-none"
        aria-hidden="true"
      />

      {/* Top navigation and breadcrumbs bar */}
      <header className="absolute left-4 top-4 z-30 flex flex-wrap items-center gap-2">
        <Link
          to="/"
          className="group inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#173e32] bg-[#173e32] px-3.5 text-sm font-semibold text-[#f5f1e8] shadow-[0_8px_20px_rgba(23,62,50,0.2)] transition-colors hover:bg-[#245542] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b97a16]"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Kembali ke Mawas
        </Link>

        {/* Granularity mode switcher tabs */}
        <div
          role="group"
          aria-label="Pilihan tingkat wilayah peta"
          className="hidden sm:inline-flex items-center rounded-md border border-[#173e32]/15 bg-[#f5f1e8]/95 p-1 shadow-sm backdrop-blur"
        >
          <button
            type="button"
            onClick={showProvinceMap}
            aria-pressed={granularity === "provinsi"}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16] ${
              granularity === "provinsi"
                ? "bg-[#173e32] text-[#f5f1e8]"
                : "text-[#36564a] hover:bg-[#dce7d7] hover:text-[#173e32]"
            }`}
          >
            <MapIcon className="size-3.5" />
            Tingkat Provinsi
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedProvinceName && provinceOptions.length > 0) {
                selectProvince(provinceOptions[0], true);
              } else {
                setGranularity("kabupaten");
              }
            }}
            aria-pressed={granularity === "kabupaten"}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16] ${
              granularity === "kabupaten"
                ? "bg-[#173e32] text-[#f5f1e8]"
                : "text-[#36564a] hover:bg-[#dce7d7] hover:text-[#173e32]"
            }`}
          >
            <Layers className="size-3.5" />
            Tingkat Kabupaten
          </button>
        </div>

        {/* Breadcrumb path */}
        <nav
          aria-label="Navigasi tingkat wilayah"
          className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-[#173e32]/10 bg-[#f5f1e8]/90 px-3 py-2 text-xs font-medium text-[#557267] backdrop-blur"
        >
          <button
            type="button"
            onClick={resetToIndonesia}
            className="hover:text-[#173e32] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[#b97a16]"
          >
            Indonesia
          </button>
          {selectedProvinceName && (
            <>
              <ChevronRight className="size-3.5 opacity-60" />
              <button
                type="button"
                onClick={() => {
                  setGranularity("kabupaten");
                  setSelectedKabupatenName(null);
                  if (selectedProvinceFeature)
                    zoomToProvince(selectedProvinceFeature);
                }}
                className={`hover:text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#b97a16] ${
                  !selectedKabupatenName ? "font-semibold text-[#173e32]" : ""
                }`}
              >
                {selectedProvinceName}
              </button>
            </>
          )}
          {selectedKabupatenName && (
            <>
              <ChevronRight className="size-3.5 opacity-60" />
              <span className="font-semibold text-[#173e32]">
                {selectedKabupatenName}
              </span>
            </>
          )}
        </nav>
      </header>

      {/* Interactive Map Area */}
      <div className="absolute inset-0 flex items-center justify-center">
        {(isLoadingProv || (granularity === "kabupaten" && isLoadingKab)) && (
          <div
            role="status"
            aria-live="polite"
            className="z-20 flex flex-col items-center gap-3 rounded-xl border border-[#173e32]/15 bg-[#f5f1e8]/95 p-6 shadow-md backdrop-blur"
          >
            <RefreshCw className="size-6 animate-spin text-[#173e32]" />
            <p className="text-sm font-semibold text-[#173e32]">
              {granularity === "kabupaten"
                ? `Memuat batas kabupaten untuk ${selectedProvinceName || "wilayah terpilih"}...`
                : "Memuat batas wilayah 34 provinsi Indonesia..."}
            </p>
            <p className="text-xs text-[#557267]">
              Mengurai data GeoJSON administratif spasial.
            </p>
          </div>
        )}

        {(loadProvError || loadKabError) && (
          <div
            role="alert"
            className="z-20 max-w-sm rounded-xl border border-[#bb5b42]/30 bg-[#fce8e6] p-6 text-[#7c1d0f] shadow-md"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5 shrink-0 text-[#bb5b42]" />
              <h2 className="font-semibold text-sm">
                Gagal Memuat Berkas Peta
              </h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#7c1d0f]">
              {loadProvError || loadKabError}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (loadProvError) window.location.reload();
                if (loadKabError && selectedProvinceFeature) {
                  loadKabupatenForProvince(
                    selectedProvinceFeature.properties.kode,
                  );
                }
              }}
              className="mt-4 min-h-11 w-full border-[#bb5b42]/40 bg-white text-xs font-semibold text-[#7c1d0f] hover:bg-[#fadbd8]"
            >
              <RefreshCw className="size-4" />
              Coba Muat Ulang
            </Button>
          </div>
        )}

        {!isLoadingProv && !loadProvError && (
          <motion.div
            className="absolute inset-0 grid touch-none place-items-center cursor-grab active:cursor-grabbing"
            animate={{ scale: zoom, x: pan.x, y: pan.y }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
            onWheel={handleWheel}
            onPointerDown={startGesture}
            onPointerMove={moveGesture}
            onPointerUp={endGesture}
            onPointerCancel={endGesture}
          >
            <svg
              viewBox="0 0 1000 380"
              className="w-[94vw] max-w-6xl select-none"
              role="img"
              aria-label={
                granularity === "kabupaten" && selectedProvinceName
                  ? `Peta kabupaten di Provinsi ${selectedProvinceName}`
                  : "Peta wilayah Indonesia. Gunakan kontrol zoom atau geser untuk menjelajah."
              }
            >
              {/* Equator guide line */}
              <g opacity="0.32">
                <line
                  x1="10"
                  y1="190"
                  x2="990"
                  y2="190"
                  stroke="#173e32"
                  strokeWidth="0.8"
                  strokeDasharray="4 8"
                />
                <text
                  x="24"
                  y="184"
                  fill="#173e32"
                  fontSize="9"
                  fontFamily="Geist Variable, sans-serif"
                  fontWeight="600"
                  letterSpacing="0.08em"
                >
                  GARIS KHATULISTIWA (0°)
                </text>
              </g>

              {/* Major island region labels */}
              <g
                fill="#173e32"
                opacity="0.25"
                fontSize="11"
                fontFamily="Geist Variable, sans-serif"
                fontWeight="700"
                letterSpacing="0.12em"
                aria-hidden="true"
              >
                <text x="110" y="90">
                  SUMATERA
                </text>
                <text x="310" y="325">
                  JAWA
                </text>
                <text x="370" y="105">
                  KALIMANTAN
                </text>
                <text x="565" y="160">
                  SULAWESI
                </text>
                <text x="470" y="340">
                  NUSA TENGGARA
                </text>
                <text x="735" y="130">
                  MALUKU
                </text>
                <text x="860" y="170">
                  PAPUA
                </text>
              </g>

              {/* LAYER 1: National Provinces Layer */}
              {granularity === "provinsi" && (
                <g role="group" aria-label="Batas administratif 34 provinsi">
                  {projectedProvinces.map(({ feature, path }) => {
                    const props = feature.properties;
                    const isSelected = selectedProvinceName === props.name;
                    return (
                      <path
                        key={props.id}
                        d={path}
                        fill={props.sampleRisk.color}
                        stroke={isSelected ? "#b97a16" : "#f5f1e8"}
                        strokeWidth={isSelected ? 3 : 1}
                        strokeLinejoin="round"
                        opacity={isSelected ? 1 : 0.84}
                        className="cursor-pointer transition-[opacity,stroke,stroke-width] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b97a16]"
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        aria-label={`Provinsi ${props.name}. Risiko ${props.sampleRisk.status}.`}
                        onClick={() => selectProvince(props.name, false)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            selectProvince(props.name, false);
                          }
                        }}
                      />
                    );
                  })}
                </g>
              )}

              {/* LAYER 2: Kabupaten Level Layer */}
              {granularity === "kabupaten" && (
                <>
                  {/* Surrounding inactive provinces rendered quietly in background */}
                  <g role="presentation" aria-hidden="true" opacity="0.45">
                    {projectedProvinces
                      .filter(
                        (p) =>
                          p.feature.properties.name !== selectedProvinceName,
                      )
                      .map(({ feature, path }) => (
                        <path
                          key={`bg-${feature.properties.id}`}
                          d={path}
                          fill="#c8d6c4"
                          stroke="#f5f1e8"
                          strokeWidth="0.8"
                        />
                      ))}
                  </g>

                  {/* Active Province Kabupaten Boundaries */}
                  <g
                    role="group"
                    aria-label={`Batas kabupaten di ${selectedProvinceName || "provinsi terpilih"}`}
                  >
                    {projectedKabupaten.map(({ feature, path }) => {
                      const props = feature.properties;
                      const isSelected =
                        selectedKabupatenName === props.kab_name;
                      return (
                        <path
                          key={props.id}
                          d={path}
                          fill={props.sampleRisk.color}
                          stroke={isSelected ? "#b97a16" : "#f5f1e8"}
                          strokeWidth={isSelected ? 2.5 : 0.8}
                          strokeLinejoin="round"
                          opacity={isSelected ? 1 : 0.87}
                          className="cursor-pointer transition-[opacity,stroke,stroke-width] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b97a16]"
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          aria-label={`${props.kab_name}. Risiko ${props.sampleRisk.status}.`}
                          onClick={() => selectKabupaten(props.kab_name)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              selectKabupaten(props.kab_name);
                            }
                          }}
                        />
                      );
                    })}
                  </g>
                </>
              )}
            </svg>
          </motion.div>
        )}
      </div>

      {/* Map zoom controls */}
      <div className="absolute bottom-20 left-4 sm:bottom-16 z-20 grid overflow-hidden rounded-lg border border-[#173e32]/15 bg-[#f5f1e8] shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          className="size-11 rounded-none text-[#173e32] hover:bg-[#dce7d7] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#b97a16]"
          onClick={() => setZoom((value) => clamp(value + 0.35, 0.85, 12))}
          aria-label="Perbesar tampilan peta"
        >
          <Plus className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 rounded-none border-t border-[#173e32]/15 text-[#173e32] hover:bg-[#dce7d7] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#b97a16]"
          onClick={() => setZoom((value) => clamp(value - 0.35, 0.85, 12))}
          aria-label="Perkecil tampilan peta"
        >
          <Minus className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 rounded-none border-t border-[#173e32]/15 text-[#173e32] hover:bg-[#dce7d7] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#b97a16]"
          onClick={() => {
            if (granularity === "kabupaten" && selectedProvinceFeature) {
              zoomToProvince(selectedProvinceFeature);
            } else {
              resetToIndonesia();
            }
          }}
          aria-label="Atur ulang tampilan peta"
        >
          <LocateFixed className="size-5" />
        </Button>
      </div>

      {/* Mobile toggle button for filter panel */}
      <div className="sm:hidden absolute top-4 right-4 z-30">
        <Button
          type="button"
          onClick={() => setIsMobilePanelOpen((open) => !open)}
          className="min-h-11 items-center gap-2 rounded-md border border-[#173e32]/15 bg-[#f5f1e8] px-3.5 text-xs font-semibold text-[#173e32] shadow-sm hover:bg-white focus-visible:outline-2 focus-visible:outline-[#b97a16]"
          aria-expanded={isMobilePanelOpen}
          aria-controls="risk-map-sidebar"
        >
          {isMobilePanelOpen ? (
            <X className="size-4" />
          ) : (
            <SlidersHorizontal className="size-4" />
          )}
          {isMobilePanelOpen ? "Tutup Panel" : "Filter & Wilayah"}
        </Button>
      </div>

      {/* Mobile bottom summary pill */}
      {!isMobilePanelOpen &&
        (selectedKabupatenFeature || selectedProvinceFeature) && (
          <div className="sm:hidden absolute bottom-4 inset-x-4 z-20 flex items-center justify-between rounded-lg border border-[#173e32]/15 bg-[#f5f1e8]/95 px-3 py-2.5 shadow-md backdrop-blur">
            <div className="min-w-0 pr-2">
              <p className="truncate text-xs font-semibold text-[#173e32]">
                {selectedKabupatenFeature
                  ? selectedKabupatenFeature.properties.kab_name
                  : selectedProvinceFeature?.properties.name}
              </p>
              <p className="text-[11px] text-[#557267]">
                Status:{" "}
                {selectedKabupatenFeature
                  ? selectedKabupatenFeature.properties.sampleRisk.status
                  : selectedProvinceFeature?.properties.sampleRisk.status}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsMobilePanelOpen(true)}
              className="min-h-9 shrink-0 bg-[#173e32] px-3 text-xs text-[#f5f1e8] hover:bg-[#245542]"
            >
              Lihat Detail
            </Button>
          </div>
        )}

      {/* Aside details and filter drawer */}
      <aside
        id="risk-map-sidebar"
        className={`absolute right-4 top-4 z-30 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-[#173e32]/15 bg-[#f5f1e8]/95 p-5 shadow-[0_18px_50px_rgba(23,62,50,0.16)] backdrop-blur sm:p-6 transition-transform duration-200 ${
          isMobilePanelOpen ? "translate-y-0" : "max-sm:hidden"
        }`}
        aria-label="Pencarian wilayah dan indikator kekeringan"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#dce7d7] text-[#173e32]">
              <MapPinned className="size-5" />
            </span>
            <div>
              <h1 className="font-serif text-2xl tracking-[-0.03em] text-[#173e32]">
                Cek risiko wilayah
              </h1>
              <p className="mt-1 text-xs leading-5 text-[#557267]">
                Pemantauan stres vegetasi hingga tingkat kabupaten.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsMobilePanelOpen(false)}
            className="sm:hidden size-9 text-[#173e32]"
            aria-label="Tutup panel pencarian"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Level toggle inside drawer */}
        <div className="mt-4 flex rounded-lg border border-[#173e32]/15 bg-white/70 p-1">
          <button
            type="button"
            onClick={showProvinceMap}
            aria-pressed={granularity === "provinsi"}
            className={`flex-1 min-h-9 rounded py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16] ${
              granularity === "provinsi"
                ? "bg-[#173e32] text-[#f5f1e8]"
                : "text-[#36564a] hover:bg-[#dce7d7]"
            }`}
          >
            Peta Provinsi
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedProvinceName && provinceOptions.length > 0) {
                selectProvince(provinceOptions[0], true);
              } else {
                setGranularity("kabupaten");
              }
            }}
            aria-pressed={granularity === "kabupaten"}
            className={`flex-1 min-h-9 rounded py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#b97a16] ${
              granularity === "kabupaten"
                ? "bg-[#173e32] text-[#f5f1e8]"
                : "text-[#36564a] hover:bg-[#dce7d7]"
            }`}
          >
            Peta Kabupaten
          </button>
        </div>

        {/* Legend */}
        <section
          className="mt-4 rounded-xl border border-[#173e32]/12 bg-white/65 p-4"
          aria-label="Legenda status risiko"
        >
          <div className="flex items-center gap-2">
            <Leaf className="size-4 text-[#36564a]" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-[#173e32]">Kategori risiko</h2>
              <p className="text-xs text-[#557267]">Warna peta menunjukkan tingkat perhatian wilayah.</p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="flex items-start gap-2.5 rounded-lg border border-[#15803D]/60 bg-[#15803D]/15 p-2.5 text-[#173e32]">
              <Leaf className="mt-0.5 size-4 shrink-0 text-[#166534]" aria-hidden="true" />
              <div><p className="text-xs font-semibold">Rendah</p><p className="mt-0.5 text-[11px] leading-4">Kondisi dalam pemantauan rutin.</p></div>
            </div>
            <div className="flex items-start gap-2.5 rounded-lg border border-[#FACC15]/70 bg-[#FACC15]/20 p-2.5 text-[#4a3500]">
              <CloudRain className="mt-0.5 size-4 shrink-0 text-[#A16207]" aria-hidden="true" />
              <div><p className="text-xs font-semibold">Sedang</p><p className="mt-0.5 text-[11px] leading-4">Perlu ditinjau lebih lanjut.</p></div>
            </div>
            <div className="flex items-start gap-2.5 rounded-lg border border-[#DC2626]/60 bg-[#DC2626]/15 p-2.5 text-[#7c1d0f]">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#B91C1C]" aria-hidden="true" />
              <div><p className="text-xs font-semibold">Tinggi</p><p className="mt-0.5 text-[11px] leading-4">Perlu menjadi prioritas perhatian.</p></div>
            </div>
          </div>
        </section>

        {/* Search form */}
        <form className="mt-4 space-y-3" onSubmit={handleFilterSubmit}>
          <SearchableSelect
            label="Provinsi (34 Wilayah)"
            value={selectedProvinceName || ""}
            options={provinceOptions}
            onChange={(prov) => selectProvince(prov)}
            placeholder="Pilih provinsi..."
          />
          <SearchableSelect
            label="Kabupaten / Kota (514 Wilayah)"
            value={selectedKabupatenName || ""}
            options={kabupatenOptions}
            onChange={(kab) => selectKabupaten(kab)}
            placeholder={
              selectedProvinceName
                ? `Cari kabupaten di ${selectedProvinceName}...`
                : "Cari salah satu dari 514 kabupaten..."
            }
          />

          <Button
            type="submit"
            className="h-11 w-full bg-[#173e32] text-[#f5f1e8] hover:bg-[#245542] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b97a16]"
          >
            <Search className="size-4" />
            Terapkan Filter Wilayah
          </Button>
        </form>

        {/* Selected Data Card */}
        <section
          className="mt-5 border-t border-[#173e32]/12 pt-4"
          aria-live="polite"
        >
          <div>
            <div>
              <h2 className="text-sm font-semibold text-[#173e32]">
                {selectedKabupatenFeature
                  ? selectedKabupatenFeature.properties.kab_name
                  : selectedProvinceFeature
                    ? `Provinsi ${selectedProvinceFeature.properties.name}`
                    : "Indikator vegetasi & cuaca"}
              </h2>
              <p className="text-[11px] text-[#557267]">
                {selectedKabupatenFeature
                  ? `Provinsi ${selectedKabupatenFeature.properties.prov_name}`
                  : selectedProvinceFeature
                    ? `Kode BPS: ${selectedProvinceFeature.properties.kode}`
                    : "Pilih wilayah untuk detail indikator"}
              </p>
            </div>
          </div>

          <p className="mt-2 text-xs leading-5 text-[#36564a]">{searchState}</p>

          {/* Table display */}
          {selectedKabupatenFeature ? (
            <div className="mt-3 overflow-hidden rounded-lg border border-[#173e32]/15">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#dce7d7] text-[#173e32]">
                  <tr>
                    <th className="px-3 py-2 font-semibold">
                      Indikator Kabupaten
                    </th>
                    <th className="px-3 py-2 font-semibold">Nilai</th>
                    <th className="px-3 py-2 font-semibold">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#173e32]/10 bg-white/70">
                  <tr>
                    <td className="px-3 py-2 text-[#36564a]">Status Risiko</td>
                    <td
                      className="px-3 py-2 font-semibold"
                      style={{ color: "#173e32" }}
                    >
                      {selectedKabupatenFeature.properties.sampleRisk.status}
                    </td>
                    <td className="px-3 py-2 text-[#557267]">
                      {selectedKabupatenFeature.properties.sampleRisk.condition}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-[#36564a]">
                      Anomali FAPAR (30 hari)
                    </td>
                    <td className="px-3 py-2 font-medium text-[#173e32]">
                      {selectedKabupatenFeature.properties.sampleRisk.fapar}
                    </td>
                    <td className="px-3 py-2 text-[#557267]">
                      Satelit HDX/JRC
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-[#36564a]">
                      Curah hujan akumulasi
                    </td>
                    <td className="px-3 py-2 font-medium text-[#173e32]">
                      {selectedKabupatenFeature.properties.sampleRisk.rain}
                    </td>
                    <td className="px-3 py-2 text-[#557267]">
                      Agrometeorologi
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-[#36564a]">
                      Indeks stres vegetasi
                    </td>
                    <td className="px-3 py-2 font-medium text-[#173e32]">
                      {
                        selectedKabupatenFeature.properties.sampleRisk
                          .vegetationIndex
                      }
                    </td>
                    <td className="px-3 py-2 text-[#557267]">
                      Skala 0 sampai 1
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : selectedProvinceFeature ? (
            <div className="mt-3 overflow-hidden rounded-lg border border-[#173e32]/15">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#dce7d7] text-[#173e32]">
                  <tr>
                    <th className="px-3 py-2 font-semibold">
                      Indikator Provinsi
                    </th>
                    <th className="px-3 py-2 font-semibold">Nilai</th>
                    <th className="px-3 py-2 font-semibold">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#173e32]/10 bg-white/70">
                  <tr>
                    <td className="px-3 py-2 text-[#36564a]">Status Risiko</td>
                    <td
                      className="px-3 py-2 font-semibold"
                      style={{ color: "#173e32" }}
                    >
                      {selectedProvinceFeature.properties.sampleRisk.status}
                    </td>
                    <td className="px-3 py-2 text-[#557267]">
                      {selectedProvinceFeature.properties.sampleRisk.condition}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-[#36564a]">
                      Anomali FAPAR (30 hari)
                    </td>
                    <td className="px-3 py-2 font-medium text-[#173e32]">
                      {selectedProvinceFeature.properties.sampleRisk.fapar}
                    </td>
                    <td className="px-3 py-2 text-[#557267]">
                      Satelit HDX/JRC
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-[#36564a]">
                      Curah hujan akumulasi
                    </td>
                    <td className="px-3 py-2 font-medium text-[#173e32]">
                      {selectedProvinceFeature.properties.sampleRisk.rain}
                    </td>
                    <td className="px-3 py-2 text-[#557267]">
                      Agrometeorologi
                    </td>
                  </tr>
                </tbody>
              </table>

              {granularity === "provinsi" && (
                <div className="p-3 bg-[#dce7d7]/40 border-t border-[#173e32]/10">
                  <Button
                    type="button"
                    onClick={() => {
                      setGranularity("kabupaten");
                      zoomToProvince(selectedProvinceFeature);
                    }}
                    className="w-full min-h-10 bg-[#173e32] text-[#f5f1e8] text-xs font-semibold hover:bg-[#245542]"
                  >
                    <Layers className="size-3.5" />
                    Buka Peta Kabupaten di{" "}
                    {selectedProvinceFeature.properties.name}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-[#173e32]/25 bg-white/40 p-3 text-center">
              <Info className="mx-auto size-5 text-[#557267]" />
              <p className="mt-1 text-xs text-[#36564a]">
                Klik provinsi atau kabupaten pada peta untuk melihat indikator
                risiko vegetasi dan kekeringan.
              </p>
            </div>
          )}

          {(selectedProvinceFeature || selectedKabupatenFeature) && (
            <div className="mt-3 pt-3 border-t border-[#173e32]/10 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedKabupatenFeature) {
                    zoomToKabupaten(selectedKabupatenFeature);
                  } else if (selectedProvinceFeature) {
                    zoomToProvince(selectedProvinceFeature);
                  }
                }}
                className="min-h-9 text-xs border-[#173e32]/20 text-[#173e32] hover:bg-[#dce7d7]"
              >
                <MapPinned className="size-3.5" />
                Pusatkan Peta
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetToIndonesia}
                className="min-h-9 text-xs text-[#557267] hover:text-[#173e32]"
              >
                Reset Nusantara
              </Button>
            </div>
          )}
        </section>
      </aside>
    </main>
  );
}
