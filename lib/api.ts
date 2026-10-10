export interface Alert {
  id: string
  priority: number
  cluster_id: number
  timestamp: string
  raw_log: string
  status: string
  distance_score: number
  rarity_score: number
  rule_boost: number
  coords: [number, number] | null
}

export interface ClusterSummary {
  cluster_id: number
  size: number
}

export interface StatsResponse {
  heap_size: number
  total_processed: number
  throughput: number
}

export const api = {
  getTopAlerts: async (k: number = 15): Promise<Alert[]> => {
    try {
      const res = await fetch(`/api/alerts/top?k=${k}`)
      if (!res.ok) return []
      return await res.json()
    } catch (err) {
      console.error("Error fetching top alerts:", err)
      return []
    }
  },
  
  takeNextAlert: async (): Promise<Alert | null> => {
    try {
      const res = await fetch("/api/alerts/next", { method: "POST" })
      if (!res.ok) return null
      return await res.json()
    } catch (err) {
      console.error("Error taking next alert:", err)
      return null
    }
  },

  getStats: async (): Promise<StatsResponse | null> => {
    try {
      const res = await fetch("/api/stats")
      if (!res.ok) return null
      return await res.json()
    } catch (err) {
      console.error("Error fetching stats:", err)
      return null
    }
  },
  
  updatePriority: async (id: string, newPriority: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/alerts/${id}/priority`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_priority: newPriority }),
      })
      return res.ok
    } catch (err) {
      console.error("Error updating priority:", err)
      return false
    }
  },
  
  resolveAlert: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" })
      return res.ok
    } catch (err) {
      console.error("Error resolving alert:", err)
      return false
    }
  },
  
  startSimulation: async (count: number = 500): Promise<boolean> => {
    try {
      const res = await fetch(`/api/simulation/start?count=${count}`, { method: "POST" })
      return res.ok
    } catch (err) {
      console.error("Error starting simulation:", err)
      return false
    }
  }
}

