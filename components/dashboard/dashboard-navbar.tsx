"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { Play, Sparkles, ShieldCheck } from "lucide-react"

interface DashboardNavbarProps {
  onRefresh?: () => void
}

export function DashboardNavbar({ onRefresh }: DashboardNavbarProps) {
  const [isSimulating, setIsSimulating] = useState(false)
  const [isTakingNext, setIsTakingNext] = useState(false)

  const startSimulation = async () => {
    setIsSimulating(true)
    await api.startSimulation(100)
    setIsSimulating(false)
    onRefresh?.()
  }

  const takeNextAlert = async () => {
    setIsTakingNext(true)
    await api.takeNextAlert()
    setIsTakingNext(false)
    // Alert was extracted from the queue – refresh the list
    onRefresh?.()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-auto sm:h-14 max-w-screen-2xl items-start sm:items-center px-3 sm:px-4 py-2 sm:py-0 flex-col sm:flex-row gap-2 sm:gap-0 justify-between mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-950" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-sm sm:text-base">IncidentIQ Triager</span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          <Button
            onClick={takeNextAlert}
            disabled={isTakingNext}
            variant="secondary"
            size="sm"
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
            {isTakingNext ? "Extracting..." : "Extract Max"}
          </Button>
          <Button
            onClick={startSimulation}
            disabled={isSimulating}
            variant="outline"
            size="sm"
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
            {isSimulating ? "Simulating..." : "Simulate Attack"}
          </Button>
          <Button variant="ghost" size="sm" className="text-xs sm:text-sm" asChild>
            <a href="/">Exit</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
