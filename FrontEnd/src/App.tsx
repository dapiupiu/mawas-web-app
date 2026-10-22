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
import { DashboardPage } from "@/pages/DashboardPage";
import { RouteFlash } from "@/components/layout/RouteFlash";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

function RouteTransition() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const previousPath = useRef(location.pathname);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    setShowFlash(true);
    window.scrollTo({ top: 0, behavior: "instant" });
    const timeoutId = window.setTimeout(() => setShowFlash(false), 820);
    return () => window.clearTimeout(timeoutId);
  }, [location.pathname]);

  return (
    <>
      {showFlash && !reduceMotion && <RouteFlash />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={reduceMotion ? false : { y: "100vh", opacity: 0.92 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion ? undefined : { y: "-100vh", opacity: 0.96 }}
          transition={{ duration: 0.56, ease: [0.65, 0, 0.35, 1] }}
          className="min-h-screen bg-[#f5f1e8]"
        >
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/peta-risiko" element={<PublicRiskMapPage />} />
            <Route path="/signin" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<Navigate to="/signin" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
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
    </BrowserRouter>
  );
}
