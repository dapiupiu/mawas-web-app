import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LocationPermissionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "denied">("idle");

  useEffect(() => {
    const hasRequested = localStorage.getItem("mawas_location_requested");
    if (hasRequested) return;

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((permission) => {
          if (permission.state === "granted") {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                localStorage.setItem("mawas_user_lat", pos.coords.latitude.toString());
                localStorage.setItem("mawas_user_lng", pos.coords.longitude.toString());
                localStorage.setItem("mawas_location_status", "granted");
                localStorage.setItem("mawas_location_requested", "true");
                window.dispatchEvent(new CustomEvent("mawas_location_updated", {
                  detail: { lat: pos.coords.latitude, lng: pos.coords.longitude, status: "granted" }
                }));
              },
              () => {},
              { enableHighAccuracy: false, timeout: 8000 }
            );
            return;
          }

          if (permission.state === "denied") {
            localStorage.setItem("mawas_location_status", "denied");
            localStorage.setItem("mawas_location_requested", "true");
            window.dispatchEvent(new CustomEvent("mawas_location_updated", {
              detail: { status: "denied" }
            }));
            return;
          }

          const timer = setTimeout(() => {
            setIsOpen(true);
          }, 800);
          return () => clearTimeout(timer);
        })
        .catch(() => {
          const timer = setTimeout(() => {
            setIsOpen(true);
          }, 800);
          return () => clearTimeout(timer);
        });
    } else {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllow = () => {
    if (!navigator.geolocation) {
      localStorage.setItem("mawas_location_requested", "true");
      localStorage.setItem("mawas_location_status", "unsupported");
      window.dispatchEvent(new CustomEvent("mawas_location_updated", {
        detail: { status: "unsupported" }
      }));
      setIsOpen(false);
      return;
    }

    setStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        localStorage.setItem("mawas_user_lat", position.coords.latitude.toString());
        localStorage.setItem("mawas_user_lng", position.coords.longitude.toString());
        localStorage.setItem("mawas_location_status", "granted");
        localStorage.setItem("mawas_location_requested", "true");
        window.dispatchEvent(new CustomEvent("mawas_location_updated", {
          detail: { lat: position.coords.latitude, lng: position.coords.longitude, status: "granted" }
        }));
        setStatus("success");
        setTimeout(() => {
          setIsOpen(false);
        }, 800);
      },
      () => {
        localStorage.setItem("mawas_location_status", "denied");
        localStorage.setItem("mawas_location_requested", "true");
        window.dispatchEvent(new CustomEvent("mawas_location_updated", {
          detail: { status: "denied" }
        }));
        setStatus("denied");
        setTimeout(() => {
          setIsOpen(false);
        }, 600);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleDismiss = () => {
    localStorage.setItem("mawas_location_requested", "true");
    localStorage.setItem("mawas_location_status", "dismissed");
    window.dispatchEvent(new CustomEvent("mawas_location_updated", {
      detail: { status: "dismissed" }
    }));
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          role="region"
          aria-label="Izin akses lokasi"
          className="fixed bottom-0 inset-x-0 z-50 min-h-[18vh] sm:min-h-[15vh] border-t border-[#173e32]/10 bg-white shadow-[0_-10px_35px_rgba(0,0,0,0.06)]"
        >
          <div className="relative mx-auto flex h-full min-h-[18vh] sm:min-h-[15vh] max-w-[1600px] flex-col justify-between p-5 sm:flex-row sm:items-center sm:gap-8 sm:px-8 lg:px-12">
            {/* Konten Kiri: Icon putih polos + Teks ringkas */}
            <div className="flex items-start gap-4 sm:items-center">
              <div className="flex size-10 shrink-0 items-center justify-center bg-white text-[#173e32]">
                <MapPin className="size-6 text-[#173e32]" strokeWidth={2.2} />
              </div>
              <div className="max-w-2xl">
                <h3 className="text-sm font-semibold tracking-tight text-[#173e32]">
                  Izinkan Akses Lokasi
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#36564a] sm:text-[13px]">
                  Mawas membutuhkan lokasi Anda untuk menampilkan indikator stres vegetasi dan estimasi kekeringan pertanian di kabupaten Anda.
                </p>
              </div>
            </div>

            {/* Aksi Kanan: Tombol minimalis */}
            <div className="mt-4 flex shrink-0 items-center gap-2.5 sm:mt-0 sm:self-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handleDismiss}
                disabled={status === "loading"}
                className="h-9 rounded-lg px-4 text-xs font-semibold text-[#557267] hover:bg-black/5 hover:text-[#173e32]"
              >
                Nanti Saja
              </Button>
              <Button
                type="button"
                onClick={handleAllow}
                disabled={status === "loading" || status === "success"}
                className="h-9 rounded-lg bg-[#173e32] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#245542] transition-colors"
              >
                {status === "loading" ? (
                  "Mendeteksi..."
                ) : status === "success" ? (
                  <span className="flex items-center gap-1.5">
                    <Check className="size-3.5" />
                    Terhubung
                  </span>
                ) : (
                  "Izinkan"
                )}
              </Button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
