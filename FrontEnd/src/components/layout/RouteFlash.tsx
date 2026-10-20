import { motion } from "framer-motion"

export function RouteFlash() {
  return <motion.div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden bg-[#f5f1e8]" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.98, 0.98, 0] }} transition={{ duration: 0.8, times: [0, 0.2, 0.56, 1] }}>
    <motion.svg viewBox="0 0 1440 900" preserveAspectRatio="none" className="absolute inset-0 size-full" initial={{ opacity: 0, y: 26 }} animate={{ opacity: [0, 0.72, 0], y: [26, 0, -20] }} transition={{ duration: 0.68, delay: 0.08, times: [0, 0.45, 1] }}>
      <path d="M-80 580C138 440 284 648 500 488s344 8 530-134 272 18 502-164" fill="none" stroke="#173e32" strokeWidth="2" strokeDasharray="5 14" />
      <path d="M-80 642C146 500 308 710 536 550s326 8 526-130 268 10 462-100" fill="none" stroke="#b97a16" strokeWidth="3" />
      <path d="M-80 510C146 374 288 566 488 418s362 8 550-142 280 12 482-116" fill="none" stroke="#6d9670" strokeWidth="1.5" strokeDasharray="2 11" />
    </motion.svg>
    <div className="absolute inset-x-[12%] top-1/2 grid -translate-y-1/2 gap-3">
      {["w-[82%]", "w-full", "w-[62%]"].map((width, index) => <motion.div key={width} className={`h-2 rounded-full bg-[#173e32]/14 ${width}`} initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: [0, 1, 1, 0] }} transition={{ duration: 0.52, delay: 0.12 + index * 0.05, times: [0, 0.35, 0.64, 1] }} />)}
    </div>
    <motion.div className="absolute inset-x-0 top-1/2 h-px bg-[#173e32]" initial={{ scaleX: 0 }} animate={{ scaleX: [0, 1, 1, 0] }} transition={{ duration: 0.48, delay: 0.16, times: [0, 0.3, 0.64, 1] }} />
  </motion.div>
}
