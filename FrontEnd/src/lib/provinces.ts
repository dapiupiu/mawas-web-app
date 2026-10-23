export const INDONESIA_PROVINCES = [
  "Aceh",
  "Bali",
  "Banten",
  "Bengkulu",
  "DKI Jakarta",
  "DI Yogyakarta",
  "Gorontalo",
  "Jambi",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "Kalimantan Barat",
  "Kalimantan Selatan",
  "Kalimantan Tengah",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Kepulauan Bangka Belitung",
  "Kepulauan Riau",
  "Lampung",
  "Maluku",
  "Maluku Utara",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Papua",
  "Papua Barat",
  "Papua Barat Daya",
  "Papua Pegunungan",
  "Papua Selatan",
  "Papua Tengah",
  "Riau",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tengah",
  "Sulawesi Tenggara",
  "Sulawesi Utara",
  "Sumatera Barat",
  "Sumatera Selatan",
  "Sumatera Utara",
] as const;

export type IndonesiaProvince = (typeof INDONESIA_PROVINCES)[number];

function normalizeProvName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(provinsi|daerah khusus ibukota|daerah istimewa)\s+/, "")
    .trim();
}

export function matchProvince(query: string, target: string): boolean {
  const q = normalizeProvName(query);
  const t = normalizeProvName(target);

  if (q === t) return true;

  // Yogyakarta
  if (
    (q === "di yogyakarta" || q === "yogyakarta" || q === "diy") &&
    (t === "di yogyakarta" || t === "yogyakarta" || t === "diy")
  ) {
    return true;
  }

  // Jakarta
  if (
    (q === "dki jakarta" || q === "jakarta") &&
    (t === "dki jakarta" || t === "jakarta")
  ) {
    return true;
  }

  // Bangka Belitung
  if (
    q.includes("bangka") &&
    q.includes("belitung") &&
    t.includes("bangka") &&
    t.includes("belitung")
  ) {
    return true;
  }

  // Support for 34 provinces GeoJSON mapping the 2022 Papua pemekaran
  if (q === "papua") {
    return (
      t === "papua" ||
      t === "papua pegunungan" ||
      t === "papua tengah" ||
      t === "papua selatan"
    );
  }
  if (q === "papua barat") {
    return t === "papua barat" || t === "papua barat daya";
  }

  // Strict check: Prevent "riau" matching "kepulauan riau" or "maluku" matching "maluku utara"
  if (q === "riau" && t !== "riau") return false;
  if (q === "maluku" && t !== "maluku") return false;

  return false;
}
