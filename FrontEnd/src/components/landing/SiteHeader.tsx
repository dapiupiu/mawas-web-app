import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { ProvinceSearchInput } from "@/components/landing/ProvinceSearchInput";

const navigation = [
  { label: "Peta risiko", href: "/peta-risiko", route: true },
  { label: "Pilar pangan", href: "#pilar-pangan", route: false },
  { label: "Metrik FAPAR", href: "#metrik-fapar", route: false },
  { label: "Cara kerja", href: "#cara-kerja", route: false },
  { label: "Intervensi", href: "#intervensi", route: false },
  { label: "FAQ", href: "#pertanyaan", route: false },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setIsOpen(false);
  const isRiskPage = location.pathname === "/peta-risiko";

  const motionProps = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: -12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease },
      };

  return (
    <motion.header
      {...motionProps}
      className={`sticky top-0 z-50 w-full rounded-none transition-all duration-300 ${
        isScrolled || isOpen
          ? "border-b border-[#173e32]/10 bg-[#f5f1e8]/95 shadow-[0_4px_24px_-18px_rgba(23,62,50,0.25)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent shadow-none backdrop-blur-none"
      }`}
    >
      <div className="flex min-h-[72px] sm:min-h-[76px] w-full max-w-[1680px] mx-auto items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 xl:px-12">
        {/* Brand */}
        <Link
          to="/"
          onClick={closeMenu}
          className="group flex shrink-0 items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-[#b97a16] focus-visible:ring-offset-4"
          aria-label="Mawas, kembali ke beranda"
        >
          <motion.div
            whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
            transition={{ duration: 0.2 }}
            className="flex h-11 sm:h-12 w-auto items-center justify-start"
          >
            <img
              src="/logo-mawas/PNG/rectangle/MAWAS-rectangle-colour.png"
              alt="Logo Mawas"
              className="h-10 sm:h-12 w-auto max-w-[190px] sm:max-w-[220px] object-contain"
            />
          </motion.div>
        </Link>

        {/* Desktop search province input */}
        <div className="hidden md:block w-52 lg:w-64 xl:w-72">
          <ProvinceSearchInput placeholder="Cari provinsi..." />
        </div>

        {/* Desktop navigation */}
        <nav
          className="hidden items-center gap-1 xl:flex"
          aria-label="Navigasi utama"
        >
          {navigation.map((item) => {
            const isActive =
              item.route && location.pathname === item.href;

            const className = [
              "relative rounded-md px-3.5 py-2 text-[14px] font-semibold transition-colors duration-200",
              isActive
                ? "text-[#173e32]"
                : "text-[#173e32] hover:text-[#235b49] hover:bg-[#173e32]/5",
            ].join(" ");

            const content = (
              <>
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="mawas-nav-indicator"
                    className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-[#173e32]"
                    transition={{ duration: 0.3, ease }}
                  />
                )}
              </>
            );

            return item.route ? (
              <Link
                key={item.href}
                to={item.href}
                onClick={closeMenu}
                aria-current={isActive ? "page" : undefined}
                className={className}
              >
                {content}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={className}
              >
                {content}
              </a>
            );
          })}
        </nav>

        {/* Desktop actions */}
        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          <Button
            asChild
            variant="ghost"
            className="h-10 rounded-lg px-4 text-[13px] font-semibold text-[#173e32] hover:bg-[#173e32]/10 hover:text-[#173e32]"
          >
            <Link to="/signin">Masuk Portal</Link>
          </Button>

          <Button
            asChild
            className="group h-10 rounded-lg bg-[#173e32] px-5 text-[13px] font-semibold text-[#f5f1e8] shadow-sm transition-all duration-300 hover:bg-[#245542] hover:shadow-md"
          >
            <Link
              to="/peta-risiko"
              className="flex items-center gap-2"
            >
              {isRiskPage ? "Buka peta risiko" : "Jelajahi peta"}
              <ArrowUpRight
                size={16}
                className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-lg border-[#173e32]/15 bg-transparent text-[#173e32] hover:bg-[#dce7d7] xl:hidden"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? "Tutup menu" : "Buka menu"}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isOpen ? "close" : "menu"}
              initial={shouldReduceMotion ? false : { opacity: 0, rotate: -45, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, rotate: 45, scale: 0.8 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-center"
            >
              {isOpen ? <X size={19} /> : <Menu size={19} />}
            </motion.span>
          </AnimatePresence>
        </Button>
      </div>

      {/* Mobile navigation */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.nav
            id="mobile-navigation"
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease }}
            className="overflow-hidden border-t border-[#173e32]/10 bg-[#f5f1e8] xl:hidden"
            aria-label="Navigasi seluler"
          >
            <motion.div
              initial={shouldReduceMotion ? false : { y: -8 }}
              animate={{ y: 0 }}
              exit={shouldReduceMotion ? undefined : { y: -8 }}
              className="flex flex-col gap-2 px-4 pb-5 pt-3 sm:px-7"
            >
              {/* Mobile Province Search */}
              <div className="pb-2 pt-1 border-b border-[#173e32]/10">
                <ProvinceSearchInput
                  placeholder="Cari provinsi..."
                  onSelect={(prov) => {
                    closeMenu();
                    const newParams = new URLSearchParams(window.location.search);
                    newParams.set("prov", prov);
                    window.history.pushState(null, "", `/?${newParams.toString()}`);
                    window.dispatchEvent(new Event("popstate"));
                    const targetElement = document.getElementById("status-wilayah");
                    if (targetElement) {
                      targetElement.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                />
              </div>
              {navigation.map((item, index) => {
                const isActive =
                  item.route && location.pathname === item.href;

                const linkClass = [
                  "flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#dce7d7] text-[#173e32]"
                    : "text-[#173e32] hover:bg-[#dce7d7]/70 hover:text-[#173e32]",
                ].join(" ");

                const content = (
                  <>
                    <span>{item.label}</span>
                    <ChevronRight
                      size={16}
                      className={isActive ? "text-[#b97a16]" : "text-[#173e32]/50"}
                    />
                  </>
                );

                return (
                  <motion.div
                    key={item.href}
                    initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.22,
                      delay: shouldReduceMotion ? 0 : index * 0.035,
                    }}
                  >
                    {item.route ? (
                      <Link
                        to={item.href}
                        onClick={closeMenu}
                        className={linkClass}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {content}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        onClick={closeMenu}
                        className={linkClass}
                      >
                        {content}
                      </a>
                    )}
                  </motion.div>
                );
              })}

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#173e32]/10 pt-4">
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-lg border-[#173e32]/20 bg-transparent text-[#173e32] hover:bg-[#dce7d7]"
                >
                  <Link to="/signin" onClick={closeMenu}>
                    Masuk Portal
                  </Link>
                </Button>

                <Button
                  asChild
                  className="h-11 rounded-lg bg-[#173e32] text-[#f5f1e8] hover:bg-[#245542]"
                >
                  <Link
                    to="/peta-risiko"
                    onClick={closeMenu}
                    className="flex items-center gap-1.5"
                  >
                    Lihat peta
                    <ArrowUpRight size={15} />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}