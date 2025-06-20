"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardStats } from "@/Componentes/Panel/dashboard-stats"
import { RecentOrders } from "@/Componentes/Panel/recent-orders"
import { TableStatus } from "@/Componentes/Panel/table-status"
import { TopSellingItems } from "@/Componentes/Panel/top-selling-items"
import { Skeleton } from "@/Componentes/ui/skeleton"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push("/login") // Redirigir si no hay sesión
      } else {
        setLoading(false)
      }
    }

    checkSession()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40" />
        <Skeleton className="h-60" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel</h1>
        <p className="text-gray-600">Resumen general del restaurante</p>
      </div>

      {/* Stats Cards */}
      <DashboardStats />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TableStatus />
        <RecentOrders />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <TopSellingItems />
      </div>
    </div>
  )
}
