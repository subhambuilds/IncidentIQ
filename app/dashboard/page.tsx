"use client"

import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar"
import { StatsPanel } from "@/components/dashboard/stats-panel"
import { AlertTable } from "@/components/dashboard/alert-table"
import { ClusterScatter } from "@/components/dashboard/cluster-scatter"
import { useAlerts } from "@/hooks/use-alerts"

export default function DashboardPage() {
  const { alerts, stats, refresh } = useAlerts()

  return (
    <div className="min-h-[100svh] bg-zinc-950 text-foreground pb-8 sm:pb-12">
      <DashboardNavbar onRefresh={refresh} />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-screen-2xl space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-1 sm:gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Security Incident Queue</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Real-time triage using unsupervised ML and Max-Heap priority queue.</p>
        </div>
        
        <StatsPanel stats={stats} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 overflow-x-auto">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Live Incident Queue</h2>
            <AlertTable alerts={alerts} onAction={refresh} />
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            <ClusterScatter alerts={alerts} />
          </div>
        </div>
      </main>
    </div>
  )
}
