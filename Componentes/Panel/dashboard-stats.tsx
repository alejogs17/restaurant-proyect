"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { DollarSign, Users, ShoppingCart, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function DashboardStats() {
  const [stats, setStats] = useState({
    ventasHoy: 0,
    ordenesActivas: 0,
    mesasOcupadas: 0,
    totalMesas: 0,
    promedioPorMesa: 0,
    loading: true,
  })

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()
      // Ventas de hoy
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()
      const { data: ventas, error: ventasError } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', todayISO)
        .eq('status', 'completed')
      const ventasHoy = ventas ? ventas.reduce((acc: number, o: { total?: number }) => acc + (o.total || 0), 0) : 0

      // Órdenes activas
      const { count: ordenesActivas } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'preparing', 'ready'])

      // Mesas ocupadas y total de mesas
      const { data: mesas, error: mesasError } = await supabase
        .from('tables')
        .select('status')
      const mesasOcupadas = mesas ? (mesas as { status: string }[]).filter((m: { status: string }) => m.status === 'occupied').length : 0
      const totalMesas = mesas ? mesas.length : 0

      // Promedio por mesa (ventas de hoy / mesas ocupadas)
      const promedioPorMesa = mesasOcupadas > 0 ? ventasHoy / mesasOcupadas : 0

      setStats({
        ventasHoy,
        ordenesActivas: ordenesActivas || 0,
        mesasOcupadas,
        totalMesas,
        promedioPorMesa,
        loading: false,
      })
    }
    fetchStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const statCards = [
    {
      title: "Ventas Hoy",
      value: stats.loading ? "..." : formatCurrency(stats.ventasHoy),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Órdenes Activas",
      value: stats.loading ? "..." : stats.ordenesActivas.toString(),
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Mesas Ocupadas",
      value: stats.loading ? "..." : `${stats.mesasOcupadas}/${stats.totalMesas}`,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Promedio por Mesa",
      value: stats.loading ? "..." : formatCurrency(stats.promedioPorMesa),
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
