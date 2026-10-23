import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, Search, X } from "lucide-react";
import { INDONESIA_PROVINCES, matchProvince } from "@/lib/provinces";

interface ProvinceSearchInputProps {
  onSelect?: (province: string) => void;
  className?: string;
  placeholder?: string;
}

export function ProvinceSearchInput({
  onSelect,
  className = "",
  placeholder = "Cari provinsi (cth: Jawa Barat, Aceh)...",
}: ProvinceSearchInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial query from URL search param if present
  useEffect(() => {
    const provParam = searchParams.get("prov");
    if (provParam) {
      setQuery(provParam);
    }
  }, [searchParams]);

  // Filter provinces based on query
  const filtered = query.trim()
    ? INDONESIA_PROVINCES.filter((prov) => matchProvince(query, prov))
    : INDONESIA_PROVINCES;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (prov: string) => {
    setQuery(prov);
    setIsOpen(false);

    if (onSelect) {
      onSelect(prov);
      return;
    }

    // Default action: update URL param ?prov=...
    if (window.location.pathname === "/" || window.location.pathname === "") {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("prov", prov);
      setSearchParams(newParams, { replace: false });

      // Smooth scroll to preview or agri status panel
      const targetElement =
        document.getElementById("status-wilayah") ||
        document.getElementById("peta-risiko") ||
        document.getElementById("beranda");
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      navigate(`/?prov=${encodeURIComponent(prov)}#status-wilayah`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      handleSelect(filtered[0]);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 text-[#173e32]/60"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Cari provinsi di Indonesia"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          className="h-10 w-full rounded-lg border border-[#173e32]/20 bg-[#f5f1e8] pl-9 pr-8 text-[13px] font-medium text-[#173e32] placeholder:text-[#173e32]/45 transition-all focus:border-[#b97a16] focus:bg-[#fbf9f4] focus:outline-none focus:ring-2 focus:ring-[#b97a16]/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 flex size-5 items-center justify-center rounded-full text-[#173e32]/50 hover:bg-[#173e32]/10 hover:text-[#173e32]"
            aria-label="Hapus pencarian provinsi"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-60 overflow-y-auto rounded-lg border border-[#173e32]/15 bg-[#f5f1e8] p-1.5 shadow-xl shadow-[#173e32]/10"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-[#173e32]/60">
              Provinsi "{query}" tidak ditemukan.
            </div>
          ) : (
            filtered.map((prov) => (
              <button
                key={prov}
                type="button"
                role="option"
                aria-selected={query.toLowerCase() === prov.toLowerCase()}
                onClick={() => handleSelect(prov)}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-medium text-[#173e32] transition-colors hover:bg-[#173e32]/10 focus:bg-[#173e32]/10 focus:outline-none"
              >
                <MapPin size={13} className="shrink-0 text-[#b97a16]" />
                <span className="truncate">{prov}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
