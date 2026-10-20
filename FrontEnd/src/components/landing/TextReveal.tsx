import { motion, useReducedMotion } from "framer-motion"
import type { PropsWithChildren } from "react"

export function TextReveal({ children }: PropsWithChildren) {
  const reduceMotion = useReducedMotion()
  return <div className="overflow-hidden"><motion.div initial={reduceMotion ? false : { y: "110%" }} whileInView={{ y: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div></div>
}
