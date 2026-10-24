import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { risikoApi, type RiskTrendResponse } from "@/lib/api";

interface ForecastDataPoint {
  period: string;
  label: string;
  value: number; // 0 to 1 scale
  status: "aman" | "waspada" | "kritis";
}

export function HeroAiForecast() {
  const shouldReduceMotion = useReducedMotion();
  const [trend, setTrend] = useState<RiskTrendResponse | null>(null);
  const [isLoadingTrend, setIsLoadingTrend] = useState(true);
  const [trendError, setTrendError] = useState(false);

  useEffect(() => {
    let active = true;
    risikoApi
      .getRiskTrend()
      .then((result) => {
        if (active) setTrend(result);
      })
      .catch((error) => {
        console.error("Gagal memuat tren risiko dari backend:", error);
        if (active) {
          setTrend(null);
          setTrendError(true);
        }
      })
      .finally(() => {
        if (active) setIsLoadingTrend(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const forecastData: ForecastDataPoint[] = (trend?.trend || []).map((point) => {
    const date = new Date(`${point.tanggal}T00:00:00`);
    const label = Number.isNaN(date.getTime())
      ? point.tanggal
      : date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    return {
      period: label,
      label,
      value: point.skor,
      status: point.skor >= 0.5 ? "kritis" : point.skor >= 0.4 ? "waspada" : "aman",
    };
  });
  const regionName = trend?.wilayah || "Nasional";
  const peakPoint = forecastData.reduce<ForecastDataPoint | null>(
    (peak, current) => (!peak || current.value > peak.value ? current : peak),
    null,
  );

  // SVG Chart dimensions — Lebih lebar, luas, dan proporsional
  const width = 640;
  const height = 150;
  const paddingX = 40;
  const paddingY = 24;

  const points = forecastData.map((d, index) => {
    const x =
      paddingX +
      (forecastData.length === 1
        ? 0.5
        : index / (forecastData.length - 1)) *
        (width - 2 * paddingX);
    // 0 is at bottom (height - paddingY), 1 is at top (paddingY)
    const y = height - paddingY - d.value * (height - 2 * paddingY);
    return { x, y, ...d };
  });

  // Smooth bezier curve path calculation
  const linePath = points.reduce((acc, curr, idx, arr) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = arr[idx - 1];
    const cpX1 = prev.x + (curr.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (curr.x - prev.x) / 2;
    const cpY2 = curr.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
  }, "");

  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${
        height - paddingY
      } L ${points[0].x} ${height - paddingY} Z`
    : "";

  // Critical threshold Y (value = 0.50)
  const thresholdY = height - paddingY - 0.5 * (height - 2 * paddingY);

  return (
    <div className="relative mt-10 w-full select-none sm:mt-12">
      {/* Header Minimalis & Fungsional */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[#173e32]/10 pb-2.5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#557267]">
            Tren Risiko Aktual
          </p>
          <h3 className="font-serif text-lg font-bold text-[#173e32]">
            Fokus Wilayah: {regionName}
          </h3>
        </div>

        {/* Legend Grafik Minimalis — Tanpa icon generic, langsung fungsi */}
        <div className="flex items-center gap-4 text-[11px] text-[#557267]">
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-[#173e32]" aria-hidden="true" />
            <span className="font-medium text-[#36564a]">Rata-rata skor risiko (0–1)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0 w-3.5 border-b border-dashed border-[#c0392b]" aria-hidden="true" />
            <span className="font-mono font-medium text-[#c0392b]">Batas Kritis (0.50)</span>
          </div>
        </div>
      </div>

      {/* Chart Luas & Transparan (Tanpa box putih) */}
      <div className="relative mt-3 w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-36 w-full overflow-visible sm:h-44"
          aria-label="Grafik tren skor risiko aktual"
        >
          <defs>
            <linearGradient id="transparentAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c0392b" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#d4a028" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#4caf7d" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Garis batas kritis (0.50) */}
          <line
            x1={paddingX}
            y1={thresholdY}
            x2={width - paddingX}
            y2={thresholdY}
            stroke="#c0392b"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.55"
          />
          <text
            x={width - paddingX}
            y={thresholdY - 6}
            textAnchor="end"
            className="font-mono text-[10px] font-medium fill-[#c0392b]/80"
          >
            Garis Kritis 0.50
          </text>

          {/* Vertical guide lines */}
          {points.map((pt) => (
            <line
              key={`guide-${pt.period}`}
              x1={pt.x}
              y1={pt.y}
              x2={pt.x}
              y2={height - paddingY}
              stroke="#173e32"
              strokeWidth="0.8"
              strokeDasharray="2 2"
              opacity="0.15"
            />
          ))}

          {/* Area gradien transparan */}
          <path d={areaPath} fill="url(#transparentAreaGradient)" />

          {forecastData.length === 0 && (
            <text
              x={width / 2}
              y={height / 2}
              textAnchor="middle"
              className="font-sans text-[12px] fill-[#557267]"
            >
              {isLoadingTrend ? "Memuat tren risiko..." : "Data tren belum tersedia"}
            </text>
          )}

          {/* Garis tren utama */}
          <path
            d={linePath}
            fill="none"
            stroke="#173e32"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Titik data interaktif */}
          {points.map((pt) => {
            const isPeak = pt.period === peakPoint?.period;
            const dotColor =
              pt.value >= 0.5
                ? "#c0392b"
                : pt.value >= 0.4
                ? "#d4a028"
                : "#4caf7d";

            return (
              <g key={pt.period} transform={`translate(${pt.x}, ${pt.y})`}>
                <circle
                  r={isPeak ? 5.5 : 4}
                  fill={dotColor}
                  stroke="#f5f1e8"
                  strokeWidth="2.5"
                />
                {/* Nilai di atas titik */}
                <text
                  y={-9}
                  textAnchor="middle"
                  className="font-mono text-[11px] font-bold fill-[#173e32]"
                >
                  {pt.value.toFixed(2)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Label sumbu X di bawah chart transparan */}
        <div className="flex justify-between px-6 pt-1 text-xs text-[#557267]">
          {forecastData.map((d) => (
            <div key={d.period} className="text-center">
              <span className="block font-mono text-[10px] text-[#173e32]/60">
                {d.label}
              </span>
              <span className="block font-medium text-[#173e32]">
                {d.period}
              </span>
            </div>
          ))}
        </div>

        {/* BOX FLOATING: Diposisikan di center-bawah di bawah grafik agar tidak menutupi kurva sama sekali */}
        {/* Saat hover, card beranimasi bergeser ke kiri-bawah */}
        <div className="mt-5 flex justify-start sm:justify-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={
              shouldReduceMotion
                ? undefined
                : {
                    x: -16, // Dibuang ke kiri saat hover
                    y: 8,   // Dibuang ke bawah saat hover
                    scale: 1.02,
                    boxShadow: "0 24px 44px -12px rgba(23,62,50,0.24)",
                  }
            }
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="cursor-pointer w-full sm:max-w-[450px] rounded-xl border border-[#173e32]/12 bg-[#ffffff]/94 p-3.5 shadow-md backdrop-blur-md transition-colors hover:border-[#173e32]/25"
          >
            <div className="flex items-start gap-2.5">
              {(trend?.rata_rata_skor || 0) >= 0.5 ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#c0392b]" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#4caf7d]" />
              )}
              <div className="text-[11.5px] leading-relaxed text-[#36564a]">
                {trendError ? (
                  <p>
                    <strong className="font-semibold text-[#173e32]">
                      Data tren tidak tersedia.
                    </strong>{" "}
                    Periksa koneksi Backend dan ketersediaan data risiko.
                  </p>
                ) : trend?.rata_rata_skor === null || !trend ? (
                  <p>
                    <strong className="font-semibold text-[#173e32]">
                      Belum ada data risiko yang dapat diringkas.
                    </strong>{" "}
                    Grafik akan tampil setelah tersedia snapshot risiko dari Backend.
                  </p>
                ) : (
                  <p>
                    <strong className="font-semibold text-[#173e32]">
                      Ringkasan {regionName}:
                    </strong>{" "}
                    skor risiko rata-rata{" "}
                    <span className="font-mono font-bold text-[#173e32]">
                      {trend.rata_rata_skor.toFixed(2)}
                    </span>{" "}
                    dari {trend.wilayah_dengan_skor} wilayah berskor.{" "}
                    {trend.wilayah_tanpa_skor} wilayah tanpa skor tidak dihitung
                    sebagai risiko normal; grafik memakai tanggal snapshot yang tersedia.
                  </p>
                )}
              </div>
            </div>

            {/* Quick stats badges di dalam box */}
            <div className="mt-2.5 flex items-center justify-between border-t border-[#173e32]/8 pt-2 text-[10.5px]">
              <span className="font-medium text-[#173e32]">
                Wilayah pada snapshot:{" "}
                <strong className="font-mono font-bold">
                  {trend?.total_wilayah ?? 0}
                </strong>
                {trend && ` · ${trend.wilayah_tanpa_skor} tanpa skor`}
              </span>
              <span className="rounded bg-[#b97a16]/12 px-2 py-0.5 font-medium text-[#8a6000]">
                {peakPoint
                  ? `Tertinggi: ${peakPoint.period} (${peakPoint.value.toFixed(2)})`
                  : "Snapshot: belum tersedia"}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
