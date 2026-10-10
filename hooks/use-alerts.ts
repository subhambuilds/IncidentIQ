"use client"

import { useState, useEffect, useCallback } from "react"
import { api, Alert, StatsResponse } from "@/lib/api"

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [a, s] = await Promise.all([api.getTopAlerts(), api.getStats()])
      setAlerts(a || [])
      setStats(s)
      setError(null)
    } catch (err) {
      console.error("Failed to load alerts/stats:", err)
      setError("Failed to fetch alerts from server.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (mounted) await fetchData()
    }
    run()

    const intv = setInterval(() => {
      if (mounted) fetchData()
    }, 2000)

    return () => {
      mounted = false
      clearInterval(intv)
    }
  }, [fetchData])

  return { alerts, stats, isLoading, error, refresh: fetchData }
}

