"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { Users } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function TableStatus() {
  const [tables, setTables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTables = async () => {
      const supabase = createClient()
      // Obtener todas las mesas
      const { data: mesas, error } = await supabase
        .from('tables')
        .select('id, name, capacity, status')
        .order('id', { ascending: true })
      if (error) {
        setTables([])
      } else {
        // Para cada mesa ocupada, buscar cuántos clientes y desde cuándo está ocupada
        // Suponiendo que hay una tabla 'orders' con user_id, table_id, status, created_at
        const mesasOcupadas = (mesas || []).filter((m: any) => m.status === 'occupied' || m.status === 'payment')
        let customersMap: Record<string, number> = {}
        let timeMap: Record<string, string> = {}
        if (mesasOcupadas.length > 0) {
          const { data: orders } = await supabase
            .from('orders')
            .select('table_id, created_at, status, customer_name')
            .in('table_id', mesasOcupadas.map((m: any) => m.id))
            .in('status', ['pending', 'preparing', 'ready', 'delivered', 'completed'])
          mesasOcupadas.forEach((mesa: any) => {
            // Buscar la orden más reciente activa para la mesa
            const mesaOrders = (orders || []).filter((o: any) => o.table_id === mesa.id)
            if (mesaOrders.length > 0) {
              // Suponiendo que cada orden tiene un solo cliente, o puedes contar customer_name distintos
              customersMap[mesa.id] = mesaOrders.length
              // Tomar la orden más antigua activa para calcular el tiempo
              const oldest = mesaOrders.reduce((min: any, o: any) => new Date(o.created_at) < new Date(min.created_at) ? o : min, mesaOrders[0])
              timeMap[mesa.id] = getTimeAgo(oldest.created_at)
            } else {
              customersMap[mesa.id] = 0
              timeMap[mesa.id] = ''
            }
          })
        }
        setTables((mesas || []).map((mesa: any) => ({
          ...mesa,
          customers: customersMap[mesa.id] || 0,
          time: timeMap[mesa.id] || null,
        })))
      }
      setLoading(false)
    }
    fetchTables()
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
      case "available":
        return "bg-green-100 text-green-800 border-green-200"
      case "occupied":
        return "bg-red-100 text-red-800 border-red-200"
      case "reserved":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "payment":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Disponible"
      case "occupied":
        return "Ocupada"
      case "reserved":
        return "Reservada"
      case "payment":
        return "Pagando"
      default:
        return status
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-orange-600" />
          Estado de Mesas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="text-center text-gray-500">Cargando mesas...</div>
          ) : tables.length === 0 ? (
            <div className="text-center text-gray-500">No hay mesas registradas</div>
          ) : (
            tables.map((table) => (
              <div
                key={table.id}
                className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${getStatusColor(table.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{table.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {table.capacity} pers
                  </Badge>
                </div>
                <div className="text-sm mb-1">
                  <Badge className={`text-xs ${getStatusColor(table.status)}`}>{getStatusText(table.status)}</Badge>
                </div>
                {(table.status === "occupied" || table.status === "payment") && (
                  <div className="text-xs opacity-75">
                    {table.customers}/{table.capacity} • {table.time}
                  </div>
                )}
                {table.status === "reserved" && <div className="text-xs opacity-75">Reserva: {table.time}</div>}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
