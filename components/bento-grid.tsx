"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { Activity, Cpu, BarChart3, Zap, Shield } from "lucide-react"

const containerVariants = {
  hidden: {},
  visible: {
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
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

function ThreatPulse() {
  const [dots, setDots] = useState([true, true, true, false, true])

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => prev.map(() => Math.random() > 0.2))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {dots.map((active, i) => (
        <motion.div
          key={i}
          className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${active ? "bg-emerald-500" : "bg-zinc-700"}`}
          animate={active ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}

function PriorityQueueViz() {
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setPressed(true)
      setTimeout(() => setPressed(false), 200)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-1">
      {[92, 78, 65, 41, 23].map((score, i) => (
        <motion.div
          key={i}
          animate={pressed && i === 0 ? { scale: 0.9, y: 2 } : { scale: 1, y: 0 }}
          className={`px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs font-mono rounded border ${
            score > 80
              ? "bg-red-500/20 border-red-500/40 text-red-400"
              : score > 50
              ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
              : "bg-zinc-800 border-zinc-700 text-zinc-400"
          }`}
        >
          {score}
        </motion.div>
      ))}
    </div>
  )
}

function AnimatedChart() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  const points = [
    { x: 0, y: 60 },
    { x: 20, y: 45 },
    { x: 40, y: 55 },
    { x: 60, y: 30 },
    { x: 80, y: 40 },
    { x: 100, y: 15 },
  ]

  const pathD = points.reduce((acc, point, i) => {
    return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`
  }, "")

  return (
    <svg ref={ref} viewBox="0 0 100 70" className="w-full h-20 sm:h-24">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {isInView && (
        <>
          <path d={`${pathD} L 100 70 L 0 70 Z`} fill="url(#chartGradient)" className="opacity-50" />
          <path d={pathD} fill="none" stroke="rgb(16,185,129)" strokeWidth="2" strokeLinecap="round" className="draw-line" />
        </>
      )}
    </svg>
  )
}

export function BentoGrid() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="features" className="py-16 sm:py-24 px-4">
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
            Built for modern SOC teams
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto px-2">
            From raw log ingestion to ML-driven prioritization — IncidentIQ handles the heavy lifting so analysts can focus on real threats.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        >
          {/* Large card - Threat Detection */}
          <motion.div
            variants={itemVariants}
            className="sm:col-span-2 group relative p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <div className="p-2 rounded-lg bg-zinc-800 w-fit mb-3 sm:mb-4">
                  <Activity className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Real-time Threat Detection</h3>
                <p className="text-zinc-400 text-xs sm:text-sm">
                  Continuously ingests security logs and scores each event using DBSCAN clustering and TF-IDF vectorization to surface anomalies instantly.
                </p>
              </div>
              <ThreatPulse />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[{ name: "Detection", value: "< 2s" }, { name: "Accuracy", value: "97.3%" }, { name: "False Pos.", value: "1.2%" }, { name: "Coverage", value: "100%" }].map((metric) => (
                <div key={metric.name} className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-white mb-1">{metric.value}</div>
                  <div className="text-[10px] sm:text-xs text-zinc-500">{metric.name}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Max-Heap Priority Queue */}
          <motion.div
            id="architecture"
            variants={itemVariants}
            className="group relative p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 scroll-mt-28"
          >
            <div className="p-2 rounded-lg bg-zinc-800 w-fit mb-3 sm:mb-4">
              <Cpu className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Max-Heap Priority Queue</h3>
            <p className="text-zinc-400 text-xs sm:text-sm mb-4 sm:mb-6">O(log n) insert & extract-max keeps the most critical incidents at the top, always.</p>
            <PriorityQueueViz />
          </motion.div>

          {/* Anomaly Scoring */}
          <motion.div
            id="ml-engine"
            variants={itemVariants}
            className="group relative p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 scroll-mt-28"
          >
            <div className="p-2 rounded-lg bg-zinc-800 w-fit mb-3 sm:mb-4">
              <BarChart3 className="w-5 h-5 text-violet-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">ML Anomaly Scoring</h3>
            <p className="text-zinc-400 text-xs sm:text-sm mb-3 sm:mb-4">TruncatedSVD dimensionality reduction with DBSCAN clustering visualized in 2D.</p>
            <AnimatedChart />
          </motion.div>

          {/* Performance */}
          <motion.div
            variants={itemVariants}
            className="group relative p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-zinc-800 w-fit mb-3 sm:mb-4">
              <Zap className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">High Throughput</h3>
            <p className="text-zinc-400 text-xs sm:text-sm mb-3 sm:mb-4">
              Process thousands of security events per second with FastAPI async backend.
            </p>
            <div className="flex items-center gap-2 text-emerald-500 text-sm">
              <span className="font-mono">~5,000</span>
              <span className="text-zinc-500">events/sec</span>
            </div>
          </motion.div>

          {/* Security */}
          <motion.div
            variants={itemVariants}
            className="group relative p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-zinc-800 w-fit mb-3 sm:mb-4">
              <Shield className="w-5 h-5 text-rose-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Rule-Based Boosting</h3>
            <p className="text-zinc-400 text-xs sm:text-sm mb-3 sm:mb-4">Keyword-driven rule engine boosts priority for known attack patterns like SQLi, XSS, and RCE.</p>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="px-2 py-1 text-[10px] sm:text-xs bg-zinc-800 rounded text-zinc-400">SQLi</span>
              <span className="px-2 py-1 text-[10px] sm:text-xs bg-zinc-800 rounded text-zinc-400">XSS</span>
              <span className="px-2 py-1 text-[10px] sm:text-xs bg-zinc-800 rounded text-zinc-400">RCE</span>
              <span className="px-2 py-1 text-[10px] sm:text-xs bg-zinc-800 rounded text-zinc-400">LFI</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
