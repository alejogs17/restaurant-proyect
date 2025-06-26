"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Clock, ChefHat } from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { Badge } from "@/Componentes/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Componentes/ui/tabs"
import { KitchenOrderBoard } from "@/Componentes/kitchen/kitchen-order-board"
import { createClient } from "@/lib/supabase/client"

interface OrderStats {
  pending: number
  preparing: number
  ready: number
}

export default function KitchenPage() {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [orderStats, setOrderStats] = useState<OrderStats>({
    pending: 0,
    preparing: 0,
    ready: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchOrderStats = async () => {
    try {
      // Obtener pedidos pendientes
      const { count: pendingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Obtener pedidos en preparación
      const { count: preparingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'preparing')

      // Obtener pedidos listos
      const { count: readyCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ready')

      setOrderStats({
        pending: pendingCount || 0,
        preparing: preparingCount || 0,
        ready: readyCount || 0
      })
    } catch (error) {
      console.error('Error fetching order stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderStats()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchOrderStats, 5000) // Actualizar cada 5 segundos
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-orange-500" />
            Vista de Cocina
          </h1>
          <p className="text-muted-foreground">Panel de control para la preparación de pedidos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
            Auto Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800">Pendientes</h3>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {loading ? "..." : orderStats.pending}
          </div>
          <p className="text-sm text-amber-600">Pedidos esperando</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ChefHat className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">En Preparación</h3>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {loading ? "..." : orderStats.preparing}
          </div>
          <p className="text-sm text-blue-600">Siendo preparados</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-green-500 text-white px-2 py-1 rounded-md text-sm font-semibold">Listos</div>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {loading ? "..." : orderStats.ready}
          </div>
          <p className="text-sm text-green-600">Para entregar</p>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="preparing">En Preparación</TabsTrigger>
          <TabsTrigger value="ready">Listos</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-6">
          <KitchenOrderBoard status="pending" autoRefresh={autoRefresh} />
        </TabsContent>
        <TabsContent value="preparing" className="mt-6">
          <KitchenOrderBoard status="preparing" autoRefresh={autoRefresh} />
        </TabsContent>
        <TabsContent value="ready" className="mt-6">
          <KitchenOrderBoard status="ready" autoRefresh={autoRefresh} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
