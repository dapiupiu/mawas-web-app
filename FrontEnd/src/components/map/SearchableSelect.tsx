import { ChevronDown, Search } from "lucide-react"
import { useId, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type SearchableSelectProps = { label: string; value: string; options: string[]; onChange: (value: string) => void }

export function SearchableSelect({ label, value, options, onChange }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const id = useId()
  const matchingOptions = useMemo(() => options.filter((option) => option.toLowerCase().includes(search.toLowerCase())), [options, search])
  function selectOption(option: string) { onChange(option); setSearch(""); setIsOpen(false) }
  return <div className="relative"><label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-[#36564a]">{label}</label><Button id={id} type="button" variant="outline" className="h-10 w-full justify-between border-[#173e32]/18 bg-white px-3 text-left text-sm font-normal text-[#173e32]" aria-expanded={isOpen} aria-haspopup="listbox" aria-controls={`${id}-options`} onClick={() => setIsOpen((open) => !open)}>{value || `Pilih ${label.toLowerCase()}`}<ChevronDown className={`size-4 text-[#557267] transition-transform ${isOpen ? "rotate-180" : ""}`} /></Button>{isOpen && <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-lg border border-[#173e32]/15 bg-[#fbfaf5] p-2 shadow-[0_14px_30px_rgba(23,62,50,0.16)]"><div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#557267]" /><Input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setIsOpen(false) }} placeholder={`Cari ${label.toLowerCase()}`} className="h-9 border-[#173e32]/15 bg-white pl-8 text-sm" /></div><ul id={`${id}-options`} role="listbox" aria-label={`Pilihan ${label}`} className="mt-2 max-h-36 overflow-y-auto">{matchingOptions.length ? matchingOptions.map((option) => <li key={option}><button type="button" role="option" aria-selected={value === option} className="flex min-h-9 w-full items-center rounded-md px-2 text-left text-sm text-[#173e32] hover:bg-[#dce7d7] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#b97a16]" onMouseDown={(event) => event.preventDefault()} onClick={() => selectOption(option)}>{option}</button></li>) : <li className="px-2 py-2 text-sm text-[#557267]">Tidak ada pilihan yang cocok.</li>}</ul></div>}</div>
}
