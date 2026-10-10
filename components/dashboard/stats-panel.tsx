"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsResponse } from "@/lib/api"
import { Activity, ShieldAlert, Zap } from "lucide-react"

export function StatsPanel({ stats }: { stats: StatsResponse | null }) {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Open Incidents</CardTitle>
          <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{stats?.heap_size || 0}</div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">in priority queue</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Total Processed</CardTitle>
          <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{stats?.total_processed || 0}</div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">logs analyzed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Throughput</CardTitle>
          <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{stats?.throughput != null ? stats.throughput.toFixed(1) : "0.0"}</div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">logs / second</p>
        </CardContent>
      </Card>
    </div>
  )
}
