"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert } from "@/lib/api"
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899']

function getClusterColor(clusterId: number): string {
  if (clusterId < 0) return '#ef4444' // red for noise/anomaly
  const idx = Math.abs(clusterId) % COLORS.length
  return COLORS[idx]
}

export function ClusterScatter({ alerts }: { alerts: Alert[] }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Format data for Recharts
  const data = alerts
    .filter(a => a.coords && a.coords.length === 2)
    .map(a => ({
      x: a.coords![0],
      y: a.coords![1],
      z: a.priority,
      cluster: a.cluster_id,
      id: a.id,
      log: a.raw_log
    }))

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Cluster Anomaly Map (TruncatedSVD)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full flex items-center justify-center">
          {!mounted ? (
            <div className="text-xs text-muted-foreground">Loading chart...</div>
          ) : data.length === 0 ? (
            <div className="text-xs text-muted-foreground">No cluster coordinates available yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis type="number" dataKey="x" name="SVD1" tick={false} />
                <YAxis type="number" dataKey="y" name="SVD2" tick={false} />
                <ZAxis type="number" dataKey="z" range={[20, 200]} name="Priority" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const d = payload[0].payload
                      return (
                        <div className="bg-popover border text-popover-foreground p-2 rounded-lg shadow-md text-xs max-w-[200px]">
                          <div className="font-bold mb-1">Priority: {d.z != null ? d.z.toFixed(1) : "0.0"}</div>
                          <div>Cluster: {d.cluster === -1 ? "Noise (-1)" : `Cluster ${d.cluster}`}</div>
                          <div className="truncate mt-1 text-muted-foreground">{d.log}</div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Scatter data={data} fill="#8884d8">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getClusterColor(entry.cluster)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

