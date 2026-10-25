
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/AuthPages";
import { PublicRiskMapPage } from "@/pages/PublicRiskMapPage";
import { ReadArticlePage } from "@/pages/ReadArticlePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LocationPermissionModal } from "@/components/common/LocationPermissionModal";

function RouteTransition() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const previousPath = useRef(location.pathname);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    if (previousPath.current === location.pathname) return;

    previousPath.current = location.pathname;
    setShowFlash(true);

    window.scrollTo({ top: 0, behavior: "auto" });

    const timeoutId = window.setTimeout(() => {
      setShowFlash(false);
    }, 720);

    return () => window.clearTimeout(timeoutId);
  }, [location.pathname]);

  return (
    <>
      {/* Soft forest-green and gold light sweep */}
      <AnimatePresence>
        {showFlash && !reduceMotion && (
          <motion.div
            key={`transition-flash-${location.pathname}`}
            aria-hidden="true"
            initial={{ x: "-100%", opacity: 0 }}
            animate={{
              x: "110vw",
              opacity: [0, 0.7, 0.35, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              x: {
                duration: 0.72,
                ease: [0.22, 1, 0.36, 1],
              },
              opacity: {
                duration: 0.72,
                times: [0, 0.22, 0.55, 1],
                ease: "easeInOut",
              },
            }}
            className="pointer-events-none fixed inset-y-0 left-0 z-[9999] w-[38vw] min-w-[180px] max-w-[520px]"
            style={{
              background:
                "linear-gradient(110deg, transparent 0%, rgba(23,62,50,0.025) 25%, rgba(23,62,50,0.10) 52%, rgba(185,122,22,0.10) 68%, transparent 100%)",
              filter: "blur(16px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Smooth page transition */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 18,
                  scale: 0.995,
                  filter: "blur(3px)",
                }
          }
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
          }}
          exit={
            reduceMotion
              ? undefined
              : {
                  opacity: 0,
                  y: -10,
                  scale: 0.995,
                  filter: "blur(2px)",
                }
          }
          transition={{
            duration: reduceMotion ? 0 : 0.42,
            ease: [0.22, 1, 0.36, 1],
            filter: {
              duration: 0.32,
              ease: "easeOut",
            },
          }}
          className="min-h-screen bg-[#f5f1e8]"
          style={{
            transformOrigin: "center top",
          }}
        >
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/peta-risiko" element={<PublicRiskMapPage />} />
            <Route path="/artikel/:articleId" element={<ReadArticlePage />} />
            <Route path="/signin" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/signup"
              element={<Navigate to="/signin" replace />}
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteTransition />
      <LocationPermissionModal />
    </BrowserRouter>
  );
}
