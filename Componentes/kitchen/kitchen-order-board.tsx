"use client"

import { useState, useEffect } from "react"
import { Clock, User, MapPin, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { Button } from "@/Componentes/ui/button"
import { useToast } from "@/Componentes/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import jsPDF from "jspdf"

type OrderStatus = "pending" | "preparing" | "ready"

interface KitchenOrder {
  id: number
  order_number: string
  table_id?: number
  order_type: "dine_in" | "takeout" | "delivery"
  customer_name?: string
  created_at: string
  notes?: string
  tables?: {
    name: string
  }
  order_items: Array<{
    id: number
    quantity: number
    notes?: string
    status: string
    products: {
      name: string
    }
  }>
}

interface KitchenOrderBoardProps {
  status: OrderStatus
  autoRefresh: boolean
}

export function KitchenOrderBoard({ status, autoRefresh }: KitchenOrderBoardProps) {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchOrders()

    if (autoRefresh) {
      const interval = setInterval(fetchOrders, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [status, autoRefresh])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products (name)
          ),
          tables (name)
        `)

      if (error) {
        console.error("Error fetching orders:", error)
        throw error
      }

      // Filtrar por estado en el cliente (pending y preparing)
      const filteredData = data ? data.filter((order: any) => 
        ["pending", "preparing"].includes(order.status)
      ) : []

      // Ordenar por fecha de creación (más antiguos primero para la cocina)
      const sortedData = filteredData.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      setOrders(sortedData)
    } catch (error: any) {
      console.error("Error in fetchOrders:", error)
      toast({
        title: "Error",
        description: `No se pudieron cargar los pedidos: ${error.message}`,
        variant: "destructive",
      })
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId)

      if (error) throw error

      // Remove from current view
      setOrders(orders.filter((order) => order.id !== orderId))

      toast({
        title: "Estado actualizado",
        description: `El pedido ha sido actualizado`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido",
        variant: "destructive",
      })
    }
  }

  const getTimeElapsed = (createdAt: string) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min`
    } else {
      const hours = Math.floor(diffInMinutes / 60)
      const minutes = diffInMinutes % 60
      return `${hours}h ${minutes}m`
    }
  }

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case "dine_in":
        return <User className="h-4 w-4" />
      case "takeout":
        return <Clock className="h-4 w-4" />
      case "delivery":
        return <MapPin className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case "dine_in":
        return "En Mesa"
      case "takeout":
        return "Para Llevar"
      case "delivery":
        return "Domicilio"
      default:
        return "Desconocido"
    }
  }

  const getUrgencyColor = (createdAt: string) => {
    const diffInMinutes = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60))

    if (diffInMinutes > 30) return "border-red-500 bg-red-50"
    if (diffInMinutes > 15) return "border-amber-500 bg-amber-50"
    return "border-green-500 bg-green-50"
  }

  const printOrder = (order: KitchenOrder) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Orden de Preparación", 14, 20);
    doc.setFontSize(12);
    doc.text(`Orden: ${order.order_number}`, 14, 30);
    doc.text(`Mesa: ${order.tables?.name || "-"}`, 14, 38);
    doc.text(`Tipo: ${getOrderTypeLabel(order.order_type)}`, 14, 46);
    doc.text(`Cliente: ${order.customer_name || "-"}`, 14, 54);
    doc.text(`Fecha: ${new Date(order.created_at).toLocaleString()}`, 14, 62);
    doc.text("Productos:", 14, 72);
    let y = 80;
    order.order_items.forEach((item, idx) => {
      doc.text(
        `${item.quantity} x ${item.products.name}${item.notes ? " (" + item.notes + ")" : ""}`,
        18,
        y + idx * 8
      );
    });
    doc.setFontSize(10);
    doc.text("--- Fin de la orden ---", 14, y + order.order_items.length * 8 + 10);
    doc.autoPrint && doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {orders.map((order) => (
        <Card
          key={order.id}
          className={`transition-all hover:shadow-lg border-l-4 ${getUrgencyColor(order.created_at)}`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getOrderTypeIcon(order.order_type)}
                  {order.order_number}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{getOrderTypeLabel(order.order_type)}</Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {getTimeElapsed(order.created_at)}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                {Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60)) > 30 && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.order_type === "dine_in" && order.tables && (
                <p className="text-sm font-medium flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {order.tables.name}
                </p>
              )}
              {order.customer_name && (
                <p className="text-sm font-medium flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {order.customer_name}
                </p>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Productos:</p>
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span>
                      {item.quantity}x {item.products.name}
                    </span>
                    {item.notes && (
                      <Badge variant="outline" className="text-xs">
                        Nota
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                  <p className="text-xs font-medium text-yellow-800">Notas del pedido:</p>
                  <p className="text-xs text-yellow-700">{order.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {status === "pending" && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, "preparing")}
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                    size="sm"
                  >
                    Iniciar Preparación
                  </Button>
                )}
                {status === "preparing" && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, "ready")}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                    size="sm"
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Marcar Listo
                  </Button>
                )}
                {status === "ready" && (
                  <div className="flex-1 text-center">
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Listo para Entregar
                    </Badge>
                  </div>
                )}
              </div>

              <Button variant="outline" onClick={() => printOrder(order)}>
                Imprimir Orden
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
