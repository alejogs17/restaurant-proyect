"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface OrderTimerProps {
  createdAt: string
}

export function OrderTimer({ createdAt }: OrderTimerProps) {
  const [timeElapsed, setTimeElapsed] = useState("")

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const created = new Date(createdAt)
      const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000)

      const hours = Math.floor(diffInSeconds / 3600)
      const minutes = Math.floor((diffInSeconds % 3600) / 60)
      const seconds = diffInSeconds % 60

      if (hours > 0) {
        setTimeElapsed(`${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
      } else {
        setTimeElapsed(`${minutes}:${seconds.toString().padStart(2, "0")}`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [createdAt])

  return (
    <div className="flex items-center gap-1 text-sm">
      <Clock className="h-3 w-3" />
      {timeElapsed}
    </div>
  )
}
