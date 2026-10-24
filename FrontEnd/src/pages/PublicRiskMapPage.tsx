import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudRain,
  HelpCircle,
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
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/map/SearchableSelect";
import {
  latestRisikoPerKabupaten,
  risikoApi,
  type RisikoItem,
  type AnalisisAIResponse,
} from "@/lib/api";
import { matchProvince } from "@/lib/provinces";
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
type Coordinates = { lat: number; lng: number };

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
  const [userCoords, setUserCoords] = useState<Coordinates | null>(() => {
    const status = localStorage.getItem("mawas_location_status");
    const latValue = localStorage.getItem("mawas_user_lat");
    const lngValue = localStorage.getItem("mawas_user_lng");
    const lat = latValue ? Number(latValue) : Number.NaN;
    const lng = lngValue ? Number(lngValue) : Number.NaN;

    return status === "granted" && Number.isFinite(lat) && Number.isFinite(lng)
      ? { lat, lng }
      : null;
  });

  // Search filter query
  const [searchState, setSearchState] = useState("Pilih wilayah pada peta.");

  // Mobile drawer toggle
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  // Model & AI state
  const [searchParams] = useSearchParams();
  const [riskItems, setRiskItems] = useState<RisikoItem[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<AnalisisAIResponse | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState("");

  // Gesture and view transforms
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
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

    // Load real ML model risk items
    risikoApi
      .getAllRisiko()
      .then((items) => {
        if (!ignore) {
          setRiskItems(items);
          const dates = items
            .map((item) => item.tanggal)
            .filter((date): date is string => Boolean(date))
            .sort();
          if (dates.length > 0) setSelectedDate(dates[dates.length - 1]);
        }
      })
      .catch((err) => {
        console.warn("Gagal memuat risiko:", err);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Attach non-passive wheel listener so preventDefault() works without browser warning
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    const onWheel = (e: globalThis.WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey) {
        setZoom((v) => clamp(v - e.deltaY * 0.002, 0.85, 12));
        return;
      }
      setPan((c) => ({
        x: clamp(c.x - e.deltaX, -2600, 2600),
        y: clamp(c.y - e.deltaY, -1800, 1800),
      }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const handleLocationUpdate = (event: Event) => {
      const detail = (event as CustomEvent<
        Coordinates & { status?: string }
      >).detail;

      if (
        detail?.status === "granted" &&
        Number.isFinite(detail.lat) &&
        Number.isFinite(detail.lng)
      ) {
        setUserCoords({ lat: detail.lat, lng: detail.lng });
        return;
      }

      setUserCoords(null);
    };

    window.addEventListener("mawas_location_updated", handleLocationUpdate);
    return () =>
      window.removeEventListener(
        "mawas_location_updated",
        handleLocationUpdate,
      );
  }, []);

  const riskDates = useMemo(
    () =>
      Array.from(
        new Set(
          riskItems
            .map((item) => item.tanggal)
            .filter((date): date is string => Boolean(date)),
        ),
      ).sort(),
    [riskItems],
  );
  const minRiskDate = riskDates[0] || "";
  const maxRiskDate = riskDates[riskDates.length - 1] || "";
  const latestRiskDate = maxRiskDate;
  const changeDate = (direction: -1 | 1) => {
    const selectedSnapshot = riskDates.filter((date) => date <= (selectedDate || latestRiskDate)).at(-1);
    const currentIndex = selectedSnapshot ? riskDates.indexOf(selectedSnapshot) : 0;
    const nextDate = riskDates[currentIndex + direction];
    if (nextDate) setSelectedDate(nextDate);
  };
  const risksForSelectedDate = useMemo(
    () =>
      latestRisikoPerKabupaten(
        riskItems.filter(
          (item) =>
            !selectedDate || !item.tanggal || item.tanggal <= selectedDate,
        ),
      ),
    [riskItems, selectedDate],
  );

  // Map lookup by id_fe and code/name fallback for older database rows.
  const riskByFeId = useMemo(() => {
    const map = new Map<string, RisikoItem>();
    for (const item of risksForSelectedDate) {
      if (item.id_fe) map.set(item.id_fe, item);
      if (item.kode_kabupaten) map.set(item.kode_kabupaten, item);
      if (item.nama_kabupaten) {
        map.set(item.nama_kabupaten.toLowerCase(), item);
        const clean = item.nama_kabupaten
          .toLowerCase()
          .replace(/^(kabupaten|kota)\s+/, "");
        map.set(clean, item);
      }
    }
    return map;
  }, [risksForSelectedDate]);

  const getKabupatenRisk = (feature: KabupatenFeature): RisikoItem | null => {
    const p = feature.properties;
    if (!p) return null;
    return (
      riskByFeId.get(p.id) ||
      riskByFeId.get(p.kab_name.toLowerCase()) ||
      riskByFeId.get(
        p.kab_name.toLowerCase().replace(/^(kabupaten|kota)\s+/, ""),
      ) ||
      null
    );
  };

  const getRiskColor = (risk: RisikoItem | null): string => {
    const kat = (risk?.kategori || "").toLowerCase();
    if (kat === "tinggi" || kat === "kritis") {
      return "#ef4444"; // Merah Terang (Kritis)
    }
    if (kat === "sedang" || kat === "warning" || kat === "waspada") {
      return "#eab308"; // Kuning Terang (Warning)
    }
    if (kat === "rendah" || kat === "normal" || kat === "aman") {
      return "#22c55e"; // Hijau Terang (Normal)
    }
    return "#94a3b8";
  };

  // Aggregated risk per province for national overview
  const getProvinceRisk = (provName: string) => {
    const items = risksForSelectedDate.filter(
      (item) => item.provinsi && matchProvince(provName, item.provinsi),
    );
    if (!items.length) {
      return {
        color: "#94a3b8",
        status: "Data tidak tersedia",
        total: 0,
        tinggi: 0,
        sedang: 0,
        rendah: 0,
        tidakTersedia: 0,
      };
    }
    const tinggi = items.filter(
      (k) => ["tinggi", "kritis"].includes((k.kategori || "").toLowerCase()),
    ).length;
    const sedang = items.filter(
      (k) => ["sedang", "waspada", "warning"].includes((k.kategori || "").toLowerCase()),
    ).length;
    const rendah = items.filter(
      (k) => ["rendah", "normal", "aman"].includes((k.kategori || "").toLowerCase()),
    ).length;
    const kosong = items.filter(
      (k) =>
        k.skor_risiko === null ||
        ["data tidak tersedia", "tidak_tersedia"].includes((k.kategori || "").toLowerCase()),
    ).length;

    let color = "#22c55e";
    let status = "Normal";
    if (tinggi > 0) {
      color = "#ef4444"; // Merah Terang (Kritis)
      status = "Kritis";
    } else if (sedang > 0) {
      color = "#eab308"; // Kuning Terang (Warning)
      status = "Waspada";
    } else if (rendah === 0) {
      color = "#94a3b8";
      status = "Data tidak tersedia";
    }
    if (items.length > 0 && kosong > 0 && (tinggi > 0 || sedang > 0 || rendah > 0)) {
      status += " (data tidak lengkap)";
    }
    return {
      color,
      status,
      tinggi,
      sedang,
      rendah,
      tidakTersedia: kosong,
      total: items.length,
    };
  };

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

  const userMarkerPoint = useMemo(() => {
    if (!userCoords) return null;
    return projectMercator([userCoords.lng, userCoords.lat]);
  }, [userCoords]);

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

  // Auto-select province if passed in URL query param (?prov=...)
  useEffect(() => {
    const provParam = searchParams.get("prov");
    if (provParam && geoData?.features && !selectedProvinceName) {
      const match = geoData.features.find((f) =>
        matchProvince(provParam, f.properties.name),
      );
      if (match) {
        selectProvince(match.properties.name, true);
      }
    }
  }, [searchParams, geoData, selectedProvinceName]);

  // Fetch Generative AI analysis when a kabupaten is selected
  useEffect(() => {
    if (!selectedKabupatenFeature) {
      setAiAnalysis(null);
      setAiAnalysisError("");
      return;
    }
    const risk = getKabupatenRisk(selectedKabupatenFeature);
    setIsLoadingAI(true);
    setAiAnalysisError("");
    const id =
      risk?.kode_kabupaten ||
      selectedKabupatenFeature.properties.id ||
      selectedKabupatenFeature.properties.kab_name;

    risikoApi
      .getAnalisisAI(id, risk?.tanggal)
      .then((res) => {
        setAiAnalysis(res);
        setIsLoadingAI(false);
      })
      .catch(() => {
        setAiAnalysis(null);
        setAiAnalysisError("Analisis belum tersedia. Silakan coba lagi.");
        setIsLoadingAI(false);
      });
  }, [selectedKabupatenFeature, riskByFeId, selectedDate]);

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
        x: clamp(
          previous.pan.x + event.clientX - previous.midpoint.x,
          -2600,
          2600,
        ),
        y: clamp(
          previous.pan.y + event.clientY - previous.midpoint.y,
          -1800,
          1800,
        ),
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

  return (
    <main className="flex h-dvh w-screen flex-col overflow-hidden bg-[#e8ecdf] text-[#173e32] sm:relative sm:block sm:overflow-hidden">
      {/* Top navigation bar: fixed on mobile, absolute floating on desktop */}
      <header className="relative z-30 flex items-center gap-1.5 bg-[#e8ecdf]/95 px-2 py-1.5 shadow-sm backdrop-blur sm:absolute sm:left-4 sm:top-4 sm:flex-wrap sm:gap-2 sm:bg-transparent sm:p-0 sm:shadow-none">
        <Link
          to="/"
          aria-label="Kembali ke Mawas"
          className="group inline-flex h-11 min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-md border border-[#173e32] bg-[#173e32] px-2 text-[11px] font-semibold text-[#f5f1e8] shadow-[0_8px_20px_rgba(23,62,50,0.2)] transition-colors hover:bg-[#245542] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b97a16] sm:h-10 sm:min-h-10 sm:gap-2 sm:rounded-lg sm:px-3 sm:text-sm"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5 sm:size-4" />
          <img src="/logo-mawas/VEKTOR/icon/MAWAS-icon-cream.svg" alt="" className="size-3.5 object-contain sm:size-4" />
          <span className="hidden sm:inline">Kembali ke Mawas</span>
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

        {/* Date Selector with Next / Prev buttons matching height */}
        <div className="inline-flex min-w-0 items-center rounded-md border border-[#173e32]/15 bg-[#f5f1e8]/95 p-0.5 shadow-sm backdrop-blur sm:p-1">
          <button
            type="button"
            onClick={() => changeDate(-1)}
            disabled={riskDates.length <= 1 || selectedDate <= minRiskDate}
            className="inline-flex h-11 w-8 shrink-0 items-center justify-center rounded text-[#36564a] transition-colors hover:bg-[#dce7d7] hover:text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#b97a16] disabled:cursor-not-allowed disabled:opacity-40 sm:size-9 sm:h-9 sm:w-9"
            aria-label="Tanggal sebelumnya"
            title={riskDates.length <= 1 ? "Hanya tersedia satu tanggal snapshot" : "Snapshot sebelumnya"}
          >
            <ChevronLeft className="size-3.5 sm:size-4" />
          </button>
          <div className="inline-flex min-h-11 min-w-0 items-center gap-1 px-1 text-[11px] font-semibold text-[#173e32] sm:min-h-9 sm:gap-1.5 sm:px-2 sm:text-xs">
            <Calendar className="hidden size-3.5 text-[#b97a16] sm:block" />
            <span className="hidden text-[11px] text-[#557267] sm:inline">
              Tanggal:
            </span>
            <input
              type="date"
              value={selectedDate}
              min={minRiskDate || undefined}
              max={maxRiskDate || undefined}
              disabled={riskDates.length <= 1}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Tanggal snapshot peta"
              className="w-[7.6rem] min-w-0 cursor-pointer bg-transparent text-[11px] font-bold text-[#173e32] focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:text-xs"
              title={riskDates.length <= 1 ? "Filter tanggal hanya tersedia jika ada beberapa snapshot" : "Pilih tanggal snapshot"}
            />
            {riskDates.length === 1 && (
              <span className="hidden text-[10px] font-medium text-[#557267] sm:inline">
                1 snapshot
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => changeDate(1)}
            disabled={riskDates.length <= 1 || selectedDate >= maxRiskDate}
            className="inline-flex h-11 w-8 shrink-0 items-center justify-center rounded text-[#36564a] transition-colors hover:bg-[#dce7d7] hover:text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#b97a16] disabled:cursor-not-allowed disabled:opacity-40 sm:size-9 sm:h-9 sm:w-9"
            aria-label="Tanggal berikutnya"
            title={riskDates.length <= 1 ? "Hanya tersedia satu tanggal snapshot" : "Snapshot berikutnya"}
          >
            <ChevronRight className="size-3.5 sm:size-4" />
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

      {/* Interactive Map Area: flex-1 on mobile, absolute fill on desktop */}
      <div
        ref={mapContainerRef}
        className="relative flex-1 sm:absolute sm:inset-0 flex items-center justify-center overflow-hidden"
      >
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
                    const provRisk = getProvinceRisk(props.name);
                    return (
                      <path
                        key={props.id}
                        d={path}
                        fill={provRisk.color}
                        stroke={isSelected ? "#173e32" : "#ffffff"}
                        strokeWidth={isSelected ? 3 : 1}
                        strokeLinejoin="round"
                        opacity={isSelected ? 1 : 0.94}
                        className="cursor-pointer transition-[opacity,stroke,stroke-width] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b97a16]"
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        aria-label={`Provinsi ${props.name}. Status: ${provRisk.status} (${provRisk.tinggi} kritis, ${provRisk.sedang} waspada, ${provRisk.rendah} normal, ${provRisk.tidakTersedia} tanpa skor).`}
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
                          fill="#dce5d9"
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
                      const risk = getKabupatenRisk(feature);
                      const color = getRiskColor(risk);
                      const kat = risk?.kategori || "Data tidak tersedia";
                      const skor =
                        risk?.skor_risiko !== null &&
                        risk?.skor_risiko !== undefined
                          ? Math.round(Number(risk.skor_risiko))
                          : "Tidak tersedia";
                      return (
                        <path
                          key={props.id}
                          d={path}
                          fill={color}
                          stroke="none"
                          opacity={
                            isSelected ? 1 : selectedKabupatenName ? 0.38 : 0.78
                          }
                          className="cursor-pointer transition-[fill,opacity] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b97a16]"
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          aria-label={`${props.kab_name}. Kategori: ${kat}. Skor: ${skor}.`}
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

              {userMarkerPoint && (
                <g
                  transform={`translate(${userMarkerPoint[0]}, ${userMarkerPoint[1]})`}
                  pointerEvents="none"
                  aria-label="Lokasi Anda"
                  role="img"
                >
                  <circle
                    r="9"
                    className={
                      reduceMotion
                        ? "fill-[#173e32]/35"
                        : "animate-ping fill-[#173e32]/35"
                    }
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

      {/* Mobile persistent bottom search bar (replaces floating toggle button) */}
      <div className="sm:hidden relative z-30 flex items-center gap-2 border-t border-[#173e32]/15 bg-[#f5f1e8]/98 px-3 py-2.5 shadow-[0_-4px_12px_rgba(23,62,50,0.08)] backdrop-blur">
        <button
          type="button"
          onClick={() => setIsMobilePanelOpen((open) => !open)}
          className="flex flex-1 items-center gap-2.5 rounded-lg border border-[#173e32]/20 bg-white px-3.5 py-2.5 text-left text-xs font-medium text-[#557267] shadow-sm focus-visible:outline-2 focus-visible:outline-[#b97a16]"
          aria-expanded={isMobilePanelOpen}
          aria-controls="risk-map-sidebar"
        >
          <Search className="size-4 shrink-0 text-[#173e32]" />
          <span className="truncate">
            {selectedKabupatenName || selectedProvinceName
              ? `${selectedKabupatenName || selectedProvinceName}`
              : "Cari provinsi atau kabupaten..."}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setIsMobilePanelOpen((open) => !open)}
          className="grid size-11 shrink-0 place-items-center rounded-lg border border-[#173e32]/20 bg-white text-[#173e32] shadow-sm focus-visible:outline-2 focus-visible:outline-[#b97a16]"
          aria-label="Filter wilayah"
        >
          {isMobilePanelOpen ? <X className="size-5" /> : <SlidersHorizontal className="size-5" />}
        </button>
      </div>

      {/* Mobile bottom summary: shown in the search bar label above, no extra pill needed */}

      {/* Panel: bottom sheet on mobile, floating aside on desktop */}
      <aside
        id="risk-map-sidebar"
        className={`
          fixed bottom-0 inset-x-0 z-40 max-h-[82dvh] overflow-y-auto rounded-t-2xl border-t border-[#173e32]/15 bg-[#fbfaf5] p-5 shadow-[0_-8px_32px_rgba(23,62,50,0.16)]
          transition-transform duration-300 ease-out
          sm:absolute sm:inset-auto sm:right-5 sm:top-5 sm:bottom-auto sm:max-h-[calc(100dvh-2.5rem)] sm:w-auto sm:max-w-md sm:rounded-xl sm:border sm:border-[#173e32]/15 sm:p-6 sm:shadow-[0_16px_36px_rgba(23,62,50,0.14)] sm:translate-y-0
          ${isMobilePanelOpen ? "translate-y-0" : "translate-y-full sm:translate-y-0"}
        `}
        aria-label="Pencarian wilayah dan indikator kekeringan"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#dce7d7] text-[#173e32]">
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

        {/* Legend: 3 Standard Colors */}
        <section
          className="mt-4 rounded-xl border border-[#173e32]/12 bg-white/65 p-4"
          aria-label="Legenda status risiko"
        >
          <div className="flex items-center gap-2">
            <Leaf className="size-4 text-[#36564a]" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-[#173e32]">
                3 Tingkat Risiko
              </h2>
              <p className="text-xs text-[#557267]">
                Warna peta menunjukkan tingkat perhatian wilayah.
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="flex items-start gap-2.5 rounded-lg border border-[#22c55e]/50 bg-[#22c55e]/15 p-2.5 text-[#14532d]">
              <Leaf
                className="mt-0.5 size-4 shrink-0 text-[#16a34a]"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-bold text-[#15803d]">
                  Hijau: Normal
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-[#166534]">
                  Kondisi vegetasi aman dan dalam batas normal.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-lg border border-[#eab308]/60 bg-[#eab308]/20 p-2.5 text-[#713f12]">
              <CloudRain
                className="mt-0.5 size-4 shrink-0 text-[#ca8a04]"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-bold text-[#854d0e]">
                  Kuning: Warning
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-[#854d0e]">
                  Perlu kewaspadaan deviasi vegetasi & curah hujan.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-lg border border-[#ef4444]/50 bg-[#ef4444]/15 p-2.5 text-[#7f1d1d]">
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0 text-[#dc2626]"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-bold text-[#991b1b]">
                  Merah: Kritis
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-[#991b1b]">
                  Prioritas perhatian & mitigasi darurat.
                </p>
              </div>
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

          {/* Table display & AI Analysis */}
          {selectedKabupatenFeature ? (
            (() => {
              const currentRisk = getKabupatenRisk(selectedKabupatenFeature);
              const kat = (
                currentRisk?.kategori || "data tidak tersedia"
              ).toLowerCase();
              const skor =
                currentRisk?.skor_risiko !== null &&
                currentRisk?.skor_risiko !== undefined
                  ? Math.round(Number(currentRisk.skor_risiko))
                  : null;
              const faktorText = Array.isArray(currentRisk?.faktor_penyebab)
                ? currentRisk.faktor_penyebab.join(", ")
                : currentRisk?.faktor_penyebab ||
                  (skor === null
                    ? "Data satelit vegetasi pada periode ini terlalu sedikit untuk dinilai (awan/tutupan)"
                    : "Kondisi vegetasi normal");

              const hasWeather = currentRisk?.punya_data_cuaca === true;

              return (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#173e32]/5 p-2.5 border border-[#173e32]/10">
                    <span className="text-[11px] font-medium text-[#557267]">
                      Kondisi per {currentRisk?.tanggal || selectedDate} (
                      {currentRisk?.horizon_hari || 30} hari)
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        kat === "tinggi" || kat === "kritis"
                          ? "bg-[#ef4444]/15 text-[#991b1b] border border-[#ef4444]/30"
                          : kat === "sedang" || kat === "warning" || kat === "waspada"
                            ? "bg-[#eab308]/20 text-[#854d0e] border border-[#eab308]/40"
                            : skor === null
                              ? "bg-slate-500/10 text-slate-600 border border-slate-500/20"
                              : "bg-[#22c55e]/15 text-[#166534] border border-[#22c55e]/30"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          kat === "tinggi" || kat === "kritis"
                            ? "bg-[#ef4444]"
                            : kat === "sedang" || kat === "warning" || kat === "waspada"
                              ? "bg-[#eab308]"
                              : skor === null
                                ? "bg-slate-400"
                                : "bg-[#22c55e]"
                        }`}
                      />
                      {kat === "tinggi" || kat === "kritis"
                        ? "Kritis (Merah)"
                        : kat === "sedang" || kat === "warning" || kat === "waspada"
                          ? "Warning (Kuning)"
                          : skor === null
                            ? "Data tidak tersedia"
                            : "Normal (Hijau)"}
                    </span>
                  </div>

                  {/* Indikator Table */}
                  <div className="overflow-hidden rounded-lg border border-[#173e32]/15 bg-white/80">
                    <table className="w-full text-left text-xs">
                      <tbody className="divide-y divide-[#173e32]/10">
                        <tr>
                          <td className="px-3 py-2 text-[#557267] w-1/3">
                            Skor Risiko
                          </td>
                          <td className="px-3 py-2 font-bold text-[#173e32]">
                            {skor !== null ? (
                              <span className="inline-flex items-center gap-2">
                                <span className="font-mono text-sm">
                                  {skor} / 100
                                </span>
                                <span className="text-[10px] font-normal text-[#557267]">
                                  (persentil deviasi)
                                </span>
                              </span>
                            ) : (
                              <span className="italic text-[#64748b]">
                                Data tidak tersedia
                              </span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-[#557267]">
                            Faktor Utama
                          </td>
                          <td className="px-3 py-2 text-xs font-medium text-[#234538] leading-relaxed">
                            {faktorText}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-[#557267]">
                            Data Cuaca BMKG
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {hasWeather ? (
                              <span className="inline-flex items-center gap-1 font-medium text-[#2b5930]">
                                <CheckCircle2
                                  size={13}
                                  className="text-[#6d9670]"
                                />
                                Tersedia (CHIRPS)
                              </span>
                            ) : currentRisk?.punya_data_cuaca === false ? (
                              <span className="inline-flex items-center gap-1 font-medium text-[#b97a16]">
                                <HelpCircle size={13} />
                                Wilayah pemekaran Papua 2022 (belum tercakup)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[#64748b]">
                                <HelpCircle size={13} />
                                Informasi tidak tersedia
                              </span>
                            )}
                          </td>
                        </tr>
                        {currentRisk?.rfq !== undefined && (
                          <tr>
                            <td className="px-3 py-2 text-[#557267]">
                              Rasio Hujan (RFQ)
                            </td>
                            <td className="px-3 py-2 font-mono text-xs text-[#173e32]">
                              {currentRisk.rfq}% dari normal
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-xl border border-[#173e32]/20 bg-[#f1f6ef] p-3.5 shadow-sm">
                    <div className="border-b border-[#173e32]/10 pb-2.5">
                      <h4 className="text-xs font-bold text-[#173e32]">
                        Analisis situasi dan rekomendasi
                      </h4>
                      <p className="mt-0.5 text-[10px] text-[#557267]">
                        Ringkasan berdasarkan indikator wilayah terpilih.
                      </p>
                    </div>

                    <div className="mt-2.5">
                      {isLoadingAI ? (
                        <div className="flex items-center gap-2 py-4 text-xs text-[#557267]">
                          <RefreshCw className="size-4 animate-spin text-[#b97a16]" />
                          <span>
                            Menyiapkan analisis risiko...
                          </span>
                        </div>
                      ) : aiAnalysisError ? (
                        <p className="text-xs text-[#557267]">{aiAnalysisError}</p>
                      ) : aiAnalysis?.analisis_ai ? (
                        <div className="space-y-2.5">
                          <p className="text-xs leading-relaxed text-[#234538]">
                            {aiAnalysis.analisis_ai.penjelasan}
                          </p>
                          <p className="text-[10px] leading-relaxed text-[#557267]">
                            Kondisi per{" "}
                            {new Date(`${aiAnalysis.tanggal}T00:00:00`).toLocaleDateString(
                              "id-ID",
                              { day: "numeric", month: "long", year: "numeric" },
                            )}{" "}
                            (bukan real-time). Skor adalah peringkat relatif, bukan prakiraan absolut;
                            data hujan masih prelim dan 41 kabupaten tidak memiliki data cuaca.
                            Urutan risiko bersifat indikatif dan model belum mengungguli aturan sederhana;
                            verifikasi lapangan tetap diperlukan.
                          </p>
                          {aiAnalysis.analisis_ai.rekomendasi.length > 0 && (
                            <div className="rounded-lg bg-white/90 p-2.5 border border-[#173e32]/10">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#173e32]">
                                Langkah Rekomendasi Mitigasi:
                              </p>
                              <ul className="mt-1.5 space-y-1.5">
                                {(Array.isArray(
                                  aiAnalysis.analisis_ai.rekomendasi,
                                )
                                  ? aiAnalysis.analisis_ai.rekomendasi
                                  : [aiAnalysis.analisis_ai.rekomendasi]
                                ).map((rec, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-1.5 text-xs text-[#36564a]"
                                  >
                                    <span className="grid size-4 shrink-0 place-items-center rounded-full bg-[#173e32]/10 text-[10px] font-bold text-[#173e32] mt-0.5">
                                      {i + 1}
                                    </span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-[#557267]">
                          Pilih kabupaten untuk membaca analisis wilayah.
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center justify-between border-t border-[#173e32]/10 pt-2 text-[10px] text-[#557267]">
                        <button
                          type="button"
                          onClick={() => {
                            const risk = getKabupatenRisk(
                              selectedKabupatenFeature,
                            );
                            setIsLoadingAI(true);
                            const id =
                              risk?.kode_kabupaten ||
                              selectedKabupatenFeature.properties.id;
                            setAiAnalysisError("");
                            risikoApi
                              .getAnalisisAI(id, risk?.tanggal)
                              .then((res) => {
                                setAiAnalysis(res);
                                setIsLoadingAI(false);
                              })
                              .catch(() => {
                                setAiAnalysis(null);
                                setAiAnalysisError("Analisis belum tersedia. Silakan coba lagi.");
                                setIsLoadingAI(false);
                              });
                          }}
                          className="ml-auto inline-flex min-h-8 items-center gap-1 rounded-md px-2 font-semibold text-[#173e32] hover:bg-[#dce7d7] hover:text-[#173e32] focus-visible:outline-2 focus-visible:outline-[#b97a16]"
                        >
                          <RefreshCw size={10} /> Perbarui ringkasan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : selectedProvinceFeature ? (
            (() => {
              const provRisk = getProvinceRisk(
                selectedProvinceFeature.properties.name,
              );
              return (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#173e32]/5 p-2.5 border border-[#173e32]/10">
                    <span className="text-[11px] font-medium text-[#557267]">
                      {provRisk.total} Kabupaten/Kota tercakup
                      {provRisk.tidakTersedia > 0 &&
                        ` · ${provRisk.tidakTersedia} tanpa skor`}
                    </span>
                    <span className="text-xs font-semibold text-[#173e32]">
                      Status: {provRisk.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/10 p-2.5">
                      <p className="text-base font-bold text-[#991b1b]">
                        {provRisk.tinggi}
                      </p>
                      <p className="text-[10px] font-semibold text-[#991b1b]">
                        Merah (Kritis)
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#eab308]/40 bg-[#eab308]/15 p-2.5">
                      <p className="text-base font-bold text-[#854d0e]">
                        {provRisk.sedang}
                      </p>
                      <p className="text-[10px] font-semibold text-[#854d0e]">
                        Kuning (Warning)
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#22c55e]/30 bg-[#22c55e]/10 p-2.5">
                      <p className="text-base font-bold text-[#166534]">
                        {provRisk.rendah}
                      </p>
                      <p className="text-[10px] font-semibold text-[#166534]">
                        Hijau (Normal)
                      </p>
                    </div>
                  </div>

                  {granularity === "provinsi" && (
                    <Button
                      type="button"
                      onClick={() => {
                        setGranularity("kabupaten");
                        zoomToProvince(selectedProvinceFeature);
                      }}
                      className="w-full min-h-11 bg-[#173e32] text-[#f5f1e8] text-xs font-semibold hover:bg-[#245542]"
                    >
                      <Layers className="size-4" />
                      Buka Peta Kabupaten di{" "}
                      {selectedProvinceFeature.properties.name}
                    </Button>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-[#173e32]/25 bg-white/40 p-4 text-center">
              <Info className="mx-auto size-5 text-[#557267]" />
              <p className="mt-1 text-xs text-[#36564a]">
                Klik provinsi atau kabupaten pada peta untuk melihat indikator
                risiko vegetasi, skor deviasi, dan rekomendasi AI.
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
