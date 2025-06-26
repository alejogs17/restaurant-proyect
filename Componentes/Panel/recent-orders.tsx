"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { Clock, User } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function RecentOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      const supabase = createClient()
      // Traer las 4 órdenes más recientes con order_number
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('id, order_number, table_id, customer_name, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(4)
      if (!ordersData || ordersData.length === 0) {
        setOrders([])
        setLoading(false)
        return
      }
      // Obtener nombres de mesas
      const tableIds = Array.from(new Set(ordersData.map((o: any) => o.table_id).filter(Boolean)))
      let mesasMap: Record<string, string> = {}
      if (tableIds.length > 0) {
        const { data: mesas } = await supabase
          .from('tables')
          .select('id, name')
          .in('id', tableIds)
        mesasMap = (mesas || []).reduce((acc: Record<string, string>, m: any) => {
          acc[m.id] = m.name
          return acc
        }, {})
      }
      // Obtener productos de cada orden (join con products)
      const orderIds = ordersData.map((o: any) => o.id)
      let itemsMap: Record<string, string[]> = {}
      if (orderIds.length > 0) {
        const { data: items } = await supabase
          .from('order_items')
          .select('order_id, products(name)')
          .in('order_id', orderIds)
        itemsMap = (items || []).reduce((acc: Record<string, string[]>, item: any) => {
          if (!acc[item.order_id]) acc[item.order_id] = []
          acc[item.order_id].push(item.products?.name || 'Sin nombre')
          return acc
        }, {})
      }
      setOrders(ordersData.map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        table: mesasMap[order.table_id] || `Mesa ${order.table_id || '-'}`,
        customer: order.customer_name || 'Sin nombre',
        items: itemsMap[order.id] || [],
        total: order.total,
        status: order.status,
        time: order.created_at ? getTimeAgo(order.created_at) : '',
      })))
      setLoading(false)
    }
    fetchOrders()
  }, [])

  function getTimeAgo(dateString: string) {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'ahora'
    if (diffMin < 60) return `${diffMin} min`
    const diffH = Math.floor(diffMin / 60)
    return `${diffH}h ${diffMin % 60}min`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "preparing":
        return "bg-blue-100 text-blue-800"
      case "ready":
        return "bg-green-100 text-green-800"
      case "delivered":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "preparing":
        return "Preparando"
      case "ready":
        return "Listo"
      case "delivered":
        return "Entregado"
      default:
        return status
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          Órdenes Recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-gray-500">Cargando órdenes...</div>
          ) : orders.length === 0 ? (
            <div className="text-center text-gray-500">No hay órdenes recientes</div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-lg">{order.order_number || order.id}</span>
                    <Badge variant="outline" className="text-xs px-2 py-0.5 font-medium">{order.table}</Badge>
                    <Badge className={`text-xs px-2 py-0.5 font-medium ${getStatusColor(order.status)}`}>{getStatusText(order.status)}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-0.5">
                    <User className="h-4 w-4" />
                    <span className="truncate">{order.customer}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{order.items.length > 0 ? order.items.join(", ") : 'Sin productos'}</div>
                </div>
                <div className="flex flex-col items-end justify-between mt-2 sm:mt-0 min-w-[90px]">
                  <div className="font-semibold text-gray-900 text-lg">{order.total ? `$${order.total.toLocaleString()}` : ''}</div>
                  <div className="text-xs text-gray-500 mt-1">{order.time}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
