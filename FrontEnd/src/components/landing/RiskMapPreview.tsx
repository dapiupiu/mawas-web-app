import { MapPin } from "lucide-react"
import { useState } from "react"

type RiskLevel = "Rendah" | "Perlu perhatian" | "Tinggi"
const areas: { id: string; label: string; risk: RiskLevel; path: string }[] = [
  { id: "sumatra", label: "Sumatra", risk: "Rendah", path: "M88 124l45-45 26 13-11 42-31 31-29-13z" }, { id: "java", label: "Jawa", risk: "Perlu perhatian", path: "M177 172l111-9 13 14-35 16-68 4-21-11z" }, { id: "kalimantan", label: "Kalimantan", risk: "Rendah", path: "M225 67l68 3 31 47-18 52-58 2-28-44z" }, { id: "sulawesi", label: "Sulawesi", risk: "Tinggi", path: "M345 90l31-23 19 21-11 23 27 21-26 35-31-12-6-29-24-13z" }, { id: "papua", label: "Papua", risk: "Rendah", path: "M445 101l87 6 27 35-25 35-88-12-18-34z" },
]
const colors: Record<RiskLevel, string> = { Rendah: "#6d9670", "Perlu perhatian": "#966a13", Tinggi: "#bb5b42" }

export function RiskMapPreview() {
  const [selected, setSelected] = useState<(typeof areas)[number] | null>(null)
  return <div className="overflow-hidden rounded-2xl border border-[#173e32]/15 bg-[#fbfaf5] shadow-[0_18px_50px_rgba(23,62,50,0.10)]">
    <div className="flex flex-col gap-3 border-b border-[#173e32]/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="text-sm font-semibold text-[#173e32]">Peta risiko publik</p><p className="text-xs text-[#557267]">Ilustrasi fungsi peta, bukan status wilayah</p></div><span className="w-fit rounded-md border border-[#173e32]/20 bg-white px-3 py-2 text-sm text-[#36564a]">Tampilan seluruh wilayah</span></div>
    <div className="relative bg-[radial-gradient(circle_at_50%_42%,#edf1e5_0%,#f7f5ed_52%,#e8ecdf_100%)] p-4 sm:p-7"><svg viewBox="0 0 620 255" className="h-auto w-full" role="img" aria-label="Peta ilustratif Indonesia dengan lima area yang dapat dipilih"><path d="M28 235C130 207 178 231 272 216s185-7 314-38" fill="none" stroke="#b6cbb2" strokeWidth="1" strokeDasharray="4 8" />{areas.map((area) => <path key={area.id} d={area.path} fill={colors[area.risk]} stroke="#f7f5ed" strokeWidth="3" className="cursor-pointer transition-opacity hover:opacity-75 focus:outline-none" tabIndex={0} role="button" aria-label={`Pilih ${area.label}, risiko ${area.risk.toLowerCase()}`} onClick={() => setSelected(area)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(area) } }} />)}<g fill="#173e32" fontSize="11" fontFamily="Geist Variable, sans-serif" fontWeight="600"><text x="98" y="68">SUMATRA</text><text x="215" y="213">JAWA</text><text x="246" y="58">KALIMANTAN</text><text x="347" y="183">SULAWESI</text><text x="477" y="92">PAPUA</text></g></svg>
      <div className="mt-4 grid gap-3 border-t border-[#173e32]/10 pt-4 sm:grid-cols-[1fr_auto] sm:items-center"><div className="flex items-start gap-2 text-sm text-[#36564a]" aria-live="polite"><MapPin className="mt-0.5 size-4 shrink-0 text-[#b97a16]" />{selected ? <span><strong className="font-semibold text-[#173e32]">{selected.label}</strong>: contoh visual tingkat risiko {selected.risk.toLowerCase()}, bukan data operasional. Detail prediksi tampil saat sumber data terhubung.</span> : <span>Pilih area pada ilustrasi peta untuk mencoba panel informasi.</span>}</div><div className="flex gap-3 text-xs font-medium text-[#36564a]" aria-label="Contoh legenda risiko">{Object.entries(colors).map(([level, color]) => <span key={level} className="flex items-center gap-1.5"><i className="size-2.5 rounded-full" style={{ backgroundColor: color }} />{level}</span>)}</div></div>
    </div>
  </div>
}
