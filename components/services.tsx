"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ShieldCheck, Brain, Server } from "lucide-react"

const services = [
  {
    icon: ShieldCheck,
    title: "Managed SOC Operations",
    description: "24/7 continuous monitoring and incident triage by our expert team using IncidentIQ's ML engine.",
  },
  {
    icon: Brain,
    title: "Custom ML Model Training",
    description: "Tailor the anomaly scoring and clustering models to your organization's specific threat landscape.",
  },
  {
    icon: Server,
    title: "SIEM Integration & Setup",
    description: "Seamlessly integrate IncidentIQ with your existing SIEM (Splunk, Sentinel, etc.) for streamlined ingestion.",
  }
]

export function Services() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="services" className="py-16 sm:py-24 px-4 bg-zinc-950/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-16"
        >
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4"
            style={{ fontFamily: "var(--font-instrument-sans)" }}
          >
            Professional Services
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto px-2">
            Accelerate your security transformation with our expert-led services.
          </p>
        </motion.div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 sm:p-8 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{service.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
