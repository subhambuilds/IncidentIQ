"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

const logos = [
  { name: "CrowdStrike", abbr: "CS" },
  { name: "Splunk", abbr: "SP" },
  { name: "Palo Alto", abbr: "PA" },
  { name: "Fortinet", abbr: "FN" },
  { name: "SentinelOne", abbr: "S1" },
  { name: "Elastic", abbr: "EL" },
  { name: "Datadog", abbr: "DD" },
  { name: "Sumo Logic", abbr: "SL" },
]

export function LogoMarquee() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-12 sm:py-16 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 sm:mb-10"
      >
        <p className="text-xs sm:text-sm text-zinc-500 uppercase tracking-wider font-medium">
          Integrates with leading SIEM & security platforms
        </p>
      </motion.div>

      <div className="relative">
        {/* Fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

        {/* Marquee container */}
        <div className="flex animate-marquee">
          {[...logos, ...logos].map((logo, index) => (
            <div
              key={index}
              className="flex items-center justify-center min-w-[120px] sm:min-w-[160px] h-14 sm:h-16 mx-4 sm:mx-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              <div className="flex items-center gap-2 text-zinc-400">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <span className="text-[10px] sm:text-xs font-bold">{logo.abbr}</span>
                </div>
                <span className="font-medium text-sm sm:text-base whitespace-nowrap" style={{ fontFamily: "var(--font-instrument-sans)" }}>
                  {logo.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
