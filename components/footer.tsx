"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ShieldCheck } from "lucide-react"

export function Footer() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <footer ref={ref} className="border-t border-zinc-800 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        >
          {/* Brand */}
          <div>
            <a href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-zinc-950" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-white">IncidentIQ</span>
            </a>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-xs">ML-powered security incident triage and prioritization.</p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <a href="#features" className="text-xs sm:text-sm text-zinc-500 hover:text-white transition-colors">Features</a>
            <a href="#services" className="text-xs sm:text-sm text-zinc-500 hover:text-white transition-colors">Services</a>
            <a href="/dashboard" className="text-xs sm:text-sm text-zinc-500 hover:text-white transition-colors">Dashboard</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-zinc-500 hover:text-white transition-colors">GitHub</a>
          </div>
        </motion.div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 pt-6 border-t border-zinc-800 flex items-center justify-between"
        >
          <p className="text-[10px] sm:text-xs text-zinc-600">&copy; {new Date().getFullYear()} IncidentIQ</p>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-glow" />
            <span className="text-[10px] sm:text-xs text-zinc-500">All Systems Operational</span>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
