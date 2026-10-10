"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, ArrowUp, ArrowDown } from "lucide-react"
import { Alert, api } from "@/lib/api"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AlertTableProps {
  alerts: Alert[]
  onAction?: () => void
}

export function AlertTable({ alerts, onAction }: AlertTableProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border rounded-lg bg-card">
        No open alerts in priority queue. Start a simulation to generate traffic.
      </div>
    )
  }

  const handleEscalate = async (alert: Alert) => {
    const nextPri = Math.min(100, (alert.priority || 0) + 10)
    await api.updatePriority(alert.id, nextPri)
    onAction?.()
  }

  const handleDeescalate = async (alert: Alert) => {
    const nextPri = Math.max(0, (alert.priority || 0) - 10)
    await api.updatePriority(alert.id, nextPri)
    onAction?.()
  }

  const handleResolve = async (alertId: string) => {
    await api.resolveAlert(alertId)
    onAction?.()
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Priority</TableHead>
            <TableHead>Cluster</TableHead>
            <TableHead className="w-1/2">Raw Log</TableHead>
            <TableHead>Score Breakdown</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((a) => (
            <TableRow key={a.id} className={(a.priority || 0) > 80 ? "bg-destructive/10" : ""}>
              <TableCell className="font-bold">
                <Badge variant={(a.priority || 0) > 80 ? "destructive" : "default"}>
                  {a.priority != null ? a.priority.toFixed(1) : "0.0"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {a.cluster_id === -1 ? "Noise (-1)" : `C-${a.cluster_id}`}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs max-w-sm truncate" title={a.raw_log}>
                {a.raw_log}
              </TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="text-xs text-muted-foreground underline decoration-dotted">
                      Hover details
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs space-y-1">
                        <div>Dist: {(a.distance_score ?? 0).toFixed(1)} (x0.5)</div>
                        <div>Rare: {(a.rarity_score ?? 0).toFixed(1)} (x0.2)</div>
                        <div>Rule: {(a.rule_boost ?? 0).toFixed(1)}</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  title="Escalate Priority (+10)"
                  onClick={() => handleEscalate(a)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  title="De-escalate Priority (-10)"
                  onClick={() => handleDeescalate(a)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white"
                  title="Resolve Incident"
                  onClick={() => handleResolve(a.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

