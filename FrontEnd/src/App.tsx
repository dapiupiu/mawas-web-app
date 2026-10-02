import { useState } from "react"
import { motion } from "framer-motion"
import {
  Sparkles,
  Zap,
  Layers,
  CheckCircle2,
  ArrowRight,
  Code2,
  Flame,
  Palette,
  Atom,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export default function App() {
  const [count, setCount] = useState(0)
  const [inputText, setInputText] = useState("")

  const techStack = [
    {
      title: "React 19",
      icon: Atom,
      badge: "Core UI",
      desc: "Fast, modern component-based UI library with latest React features.",
      color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    },
    {
      title: "Vite 6/8",
      icon: Zap,
      badge: "Bundler",
      desc: "Instant server start and lightning fast Hot Module Replacement (HMR).",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Tailwind CSS v4",
      icon: Palette,
      badge: "Styling",
      desc: "Next-generation CSS framework with zero configuration and @theme support.",
      color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      title: "Framer Motion",
      icon: Flame,
      badge: "Motion",
      desc: "Production-ready motion library for fluid React animations and gestures.",
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "shadcn/ui",
      icon: Layers,
      badge: "Components",
      desc: "Accessible and customizable Radix-based UI components built with Tailwind.",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-muted/20 to-background text-foreground flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Code2 className="size-5" />
            </span>
            <span className="tracking-tight">Mawas Frontend</span>
          </div>
          <Badge variant="outline" className="px-3 py-1 text-xs gap-1.5 font-medium">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            All Stack Configured
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full space-y-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            Ready for Production Development
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            React + Vite + Tailwind + Motion + shadcn/ui
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Semua dependency dan konfigurasi telah berhasil diintegrasikan. Mulai kembangkan antarmuka aplikasi Anda dengan cepat dan rapi.
          </p>
        </motion.div>

        {/* Tech Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {techStack.map((tech) => {
            const Icon = tech.icon
            return (
              <motion.div
                key={tech.title}
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <Card className="h-full border border-border/60 hover:border-primary/40 transition-colors shadow-xs">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className={`p-2 rounded-lg border ${tech.color}`}>
                      <Icon className="size-5" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {tech.badge}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <CardTitle className="text-lg font-semibold">{tech.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {tech.desc}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}

          {/* Interactive Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card className="h-full border border-border/60 hover:border-primary/40 transition-colors shadow-xs bg-linear-to-br from-card to-muted/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="p-2 rounded-lg border text-pink-500 bg-pink-500/10 border-pink-500/20">
                  <CheckCircle2 className="size-5" />
                </div>
                <Badge variant="default" className="text-xs">
                  Interactive Demo
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardTitle className="text-lg font-semibold">Test shadcn & Motion</CardTitle>
                <div className="space-y-2">
                  <Input
                    placeholder="Ketik sesuatu di sini..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  {inputText && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-xs text-muted-foreground truncate"
                    >
                      Hasil: <span className="font-semibold text-foreground">{inputText}</span>
                    </motion.p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setCount((prev) => prev + 1)}
                  className="w-full gap-2 cursor-pointer"
                >
                  <motion.span
                    key={count}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  >
                    Count: {count}
                  </motion.span>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>

        {/* Quick Commands Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Perintah Menambahkan Komponen shadcn/ui</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Anda dapat langsung menambahkan komponen shadcn/ui kapan saja menggunakan CLI:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="rounded-lg bg-muted/60 p-3 border border-border/50 flex items-center justify-between">
              <code>npx shadcn@latest add dialog</code>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </div>
            <div className="rounded-lg bg-muted/60 p-3 border border-border/50 flex items-center justify-between">
              <code>npx shadcn@latest add dropdown-menu</code>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </div>
            <div className="rounded-lg bg-muted/60 p-3 border border-border/50 flex items-center justify-between">
              <code>npx shadcn@latest add sheet</code>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </div>
            <div className="rounded-lg bg-muted/60 p-3 border border-border/50 flex items-center justify-between">
              <code>npx shadcn@latest add form</code>
              <ArrowRight className="size-3.5 text-muted-foreground" />
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 px-6 text-center text-xs text-muted-foreground">
        <p>FrontEnd Project • Siap dikembangkan dengan Vite & shadcn/ui</p>
      </footer>
    </div>
  )
}
