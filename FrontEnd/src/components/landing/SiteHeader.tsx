import { Menu, X } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { BrandMark } from "./BrandMark"

const navigation = [{ label: "Peta risiko", href: "/peta-risiko", route: true }, { label: "Cara kerja", href: "#cara-kerja", route: false }, { label: "Intervensi", href: "#intervensi", route: false }, { label: "Pertanyaan", href: "#pertanyaan", route: false }]

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const closeMenu = () => setIsOpen(false)
  return <header className="sticky top-0 z-50 border-b border-[#173e32]/10 bg-[#f5f1e8]/95 backdrop-blur">
    <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
      <a href="#beranda" className="flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b97a16]" onClick={closeMenu}><BrandMark /><span className="text-base font-semibold tracking-tight text-[#173e32]">Mawas</span></a>
      <nav className="hidden items-center gap-6 lg:flex" aria-label="Navigasi utama">{navigation.map((item) => item.route ? <Link key={item.href} to={item.href} className="text-sm font-medium text-[#36564a] transition-colors hover:text-[#173e32] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b97a16]">{item.label}</Link> : <a key={item.href} href={item.href} className="text-sm font-medium text-[#36564a] transition-colors hover:text-[#173e32] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b97a16]">{item.label}</a>)}</nav>
      <div className="hidden items-center gap-3 lg:flex"><Button asChild variant="outline" className="h-11 border-[#173e32]/25 bg-transparent px-5 text-[#173e32] hover:bg-[#dce7d7]"><Link to="/signin">Masuk</Link></Button><Button asChild className="h-11 bg-[#173e32] px-5 text-[#f5f1e8] hover:bg-[#245542]"><Link to="/peta-risiko">Lihat peta risiko</Link></Button></div>
      <Button variant="ghost" size="icon" className="size-11 text-[#173e32] lg:hidden" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-controls="mobile-navigation"><span className="sr-only">{isOpen ? "Tutup menu" : "Buka menu"}</span>{isOpen ? <X /> : <Menu />}</Button>
    </div>
    {isOpen && <nav id="mobile-navigation" className="border-t border-[#173e32]/10 bg-[#f5f1e8] px-5 py-4 lg:hidden" aria-label="Navigasi seluler"><div className="mx-auto grid max-w-7xl gap-1">{navigation.map((item) => item.route ? <Link key={item.href} to={item.href} onClick={closeMenu} className="rounded-md px-3 py-3 text-base font-medium text-[#173e32] hover:bg-[#dce7d7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b97a16]">{item.label}</Link> : <a key={item.href} href={item.href} onClick={closeMenu} className="rounded-md px-3 py-3 text-base font-medium text-[#173e32] hover:bg-[#dce7d7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b97a16]">{item.label}</a>)}<Button asChild variant="outline" className="mt-2 h-11 border-[#173e32]/25 bg-transparent text-[#173e32]"><Link to="/signin" onClick={closeMenu}>Masuk operator</Link></Button><Button asChild className="h-11 bg-[#173e32] text-[#f5f1e8] hover:bg-[#245542]"><Link to="/peta-risiko" onClick={closeMenu}>Lihat peta risiko</Link></Button></div></nav>}
  </header>
}
