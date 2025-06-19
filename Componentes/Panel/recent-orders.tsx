"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { Clock, User } from "lucide-react"

export function RecentOrders() {
  const orders = [
    {
      id: "ORD-001",
      table: "Mesa 3",
      customer: "Juan Pérez",
      items: ["Hamburguesa de Res", "Papas Fritas", "Coca Cola"],
      total: 89960,
      status: "preparing",
      time: "5 min",
    },
    {
      id: "ORD-002",
      table: "Mesa 7",
      customer: "María García",
      items: ["Salmón a la Plancha", "Ensalada César"],
      total: 143920,
      status: "ready",
      time: "12 min",
    },
    {
      id: "ORD-003",
      table: "Mesa 1",
      customer: "Carlos López",
      items: ["Pasta Carbonara", "Té Helado"],
      total: 83920,
      status: "pending",
      time: "2 min",
    },
    {
      id: "ORD-004",
      table: "Mesa 5",
      customer: "Ana Martínez",
      items: ["Alitas de Pollo", "Margarita"],
      total: 91920,
      status: "delivered",
      time: "25 min",
    },
  ]

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
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-gray-900">{order.id}</span>
                  <Badge variant="outline" className="text-xs">
                    {order.table}
                  </Badge>
                  <Badge className={`text-xs ${getStatusColor(order.status)}`}>{getStatusText(order.status)}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <User className="h-3 w-3" />
                  {order.customer}
                </div>
                <div className="text-xs text-gray-500">{order.items.join(", ")}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">${order.total.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{order.time}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
