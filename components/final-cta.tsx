"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ArrowRight, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FinalCTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="py-16 sm:py-24 px-4">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto text-center"
      >
        <h2
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 tracking-tight"
          style={{ fontFamily: "var(--font-cal-sans)" }}
        >
          Stop drowning in alerts.
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-zinc-400 mb-8 sm:mb-10 max-w-2xl mx-auto px-2">
          Let IncidentIQ&apos;s ML engine prioritize your security incidents automatically. Launch the dashboard and see it in action — no setup required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
          <Button
            size="lg"
            className="shimmer-btn bg-white text-zinc-950 hover:bg-zinc-200 rounded-full px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base font-medium shadow-lg shadow-white/20 w-full sm:w-auto"
            asChild
          >
            <a href="/dashboard">
              <Shield className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
              Open Live Dashboard
            </a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base font-medium border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white hover:border-zinc-700 bg-transparent w-full sm:w-auto"
            asChild
          >
            <a href="#features">
              Explore Features
              <ArrowRight className="ml-2 w-4 h-4" />
            </a>
          </Button>
        </div>

        <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-zinc-500">Open-source core • Built for high-throughput SOC incident response</p>
      </motion.div>
    </section>
  )
}
