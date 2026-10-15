import { motion, useReducedMotion } from "framer-motion"
import type { PropsWithChildren } from "react"

export function Reveal({ children }: PropsWithChildren) {
  const reduceMotion = useReducedMotion()
  return <motion.div initial={reduceMotion ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.45, ease: "easeOut" }}>{children}</motion.div>
}
