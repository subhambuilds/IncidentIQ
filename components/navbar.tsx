"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Menu,
  X,
  ShieldCheck,
  Activity,
  Briefcase,
  LayoutDashboard,
  Github,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavItem {
  label: string
  href: string
  icon: typeof Activity
  external?: boolean
  badge?: string
}

const navItems: NavItem[] = [
  { label: "Features", href: "#features", icon: Activity },
  { label: "Services", href: "#services", icon: Briefcase },
  {
    label: "Live Console",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: "Live",
  },
]

export function Navbar() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-5xl"
    >
      <nav
        ref={navRef}
        className="relative flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 rounded-full bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 shadow-2xl shadow-black/40"
      >
        {/* Logo & Operational Status */}
        <div className="flex items-center gap-3 shrink-0">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4 text-zinc-950" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-white tracking-tight">IncidentIQ</span>
          </a>

          {/* Status Chip */}
          <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Engine Active</span>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center gap-0.5 lg:gap-1 relative">
          {navItems.map((item, index) => {
            const isExternal = item.external
            return (
              <a
                key={item.label}
                href={item.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="relative px-3 lg:px-3.5 py-1.5 text-xs lg:text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 rounded-full"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {hoveredIndex === index && (
                  <motion.div
                    layoutId="navbar-hover"
                    className="absolute inset-0 bg-zinc-800/80 rounded-full border border-zinc-700/50"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
                {item.badge && (
                  <span className="relative z-10 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
                {isExternal && (
                  <ExternalLink className="relative z-10 w-3 h-3 text-zinc-500 group-hover:text-zinc-300" />
                )}
              </a>
            )
          })}
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* GitHub Link */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-full"
            asChild
          >
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              title="View on GitHub"
            >
              <Github className="w-4 h-4 mr-1.5" />
              <span className="text-xs">GitHub</span>
            </a>
          </Button>

          {/* Launch Console CTA */}
          <Button
            size="sm"
            className="shimmer-btn bg-white text-zinc-950 hover:bg-zinc-200 rounded-full px-3.5 h-8 text-xs font-medium shadow-md shadow-emerald-500/10 flex items-center gap-1.5"
            asChild
          >
            <a href="/dashboard">
              <span>Open Dashboard</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 p-3 sm:p-4 rounded-2xl bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 shadow-2xl shadow-black/60"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="flex items-center justify-between px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/70 rounded-xl transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400">
                        <Icon size={16} />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {item.badge}
                      </span>
                    ) : item.external ? (
                      <ExternalLink size={14} className="text-zinc-500" />
                    ) : null}
                  </a>
                )
              })}

              <hr className="border-zinc-800 my-2" />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  variant="outline"
                  className="w-full justify-center border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl text-xs h-10"
                  asChild
                >
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="w-3.5 h-3.5 mr-1.5" />
                    GitHub
                  </a>
                </Button>

                <Button
                  className="w-full justify-center shimmer-btn bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl text-xs font-medium h-10"
                  asChild
                >
                  <a href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                    <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </a>
                </Button>
              </div>

              {/* Status footer inside mobile menu */}
              <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between px-2 text-[10px] text-zinc-500 font-mono">
                <span>FastAPI Backend :8000</span>
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
