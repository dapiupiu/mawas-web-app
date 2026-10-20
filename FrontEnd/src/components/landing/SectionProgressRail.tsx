import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

const sections = [
  { id: "pilar-pangan", label: "Fokus saat ini", title: "Kondisi lahan" },
  { id: "metrik-fapar", label: "Dasar data", title: "Sinyal satelit" },
  { id: "peta-risiko", label: "Peta publik", title: "Baca wilayah" },
  { id: "cara-kerja", label: "Alur sistem", title: "Dari sinyal ke respons" },
  { id: "intervensi", label: "Tindak lanjut", title: "Mitigasi lapangan" },
  { id: "roadmap", label: "Peta jalan", title: "Tahap berikutnya" },
]

export function SectionProgressRail() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveIndex(sections.findIndex((section) => section.id === visible.target.id))
    }, { rootMargin: "-30% 0px -55%", threshold: [0.1, 0.4, 0.7] })
    sections.forEach(({ id }) => { const section = document.getElementById(id); if (section) observer.observe(section) })
    return () => observer.disconnect()
  }, [])

  return <nav className="fixed left-5 top-1/2 z-40 hidden w-52 -translate-y-1/2 xl:block" aria-label="Progres section landing page"><Card className="border-[#173e32]/15 bg-[#f5f1e8]/95 py-0 shadow-[0_12px_32px_rgba(23,62,50,0.10)] backdrop-blur"><CardContent className="p-4"><ol>{sections.map((section, index) => { const passed = index <= activeIndex; return <li key={section.id} className="relative"><a href={`#${section.id}`} onClick={() => setActiveIndex(index)} className="group flex gap-3 rounded-md py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b97a16]"><motion.span className="grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold" animate={{ backgroundColor: passed ? "#173e32" : "#d7ddd4", color: passed ? "#f5f1e8" : "#557267" }} transition={{ duration: 0.28 }}>{index + 1}</motion.span><span className="min-w-0"><span className="block text-xs font-semibold text-[#557267] group-hover:text-[#173e32]">{section.label}</span><span className="block truncate text-sm font-medium text-[#173e32]">{section.title}</span></span></a>{index < sections.length - 1 && <motion.div className="ml-[13px] h-5 w-px" animate={{ backgroundColor: index < activeIndex ? "#6d9670" : "#c4ccc2" }} transition={{ duration: 0.28 }} />}</li> })}</ol></CardContent></Card></nav>
}
