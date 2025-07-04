"use client"

import { useState, useEffect } from "react"
import { Clock, User, MapPin, CheckCircle, AlertCircle, Printer, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { Button } from "@/Componentes/ui/button"
import { useToast } from "@/Componentes/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

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
        .eq('status', status)

      if (error) {
        console.error("Error fetching orders:", error)
        throw error
      }

      // Ordenar por fecha de creación (más antiguos primero para la cocina)
      const sortedData = data ? data.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ) : []
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
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pedido ${order.order_number}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .order-container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 400px;
            margin: 0 auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          .restaurant-name {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
          }
          .order-number {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
          }
          .order-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 25px;
          }
          .info-item {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
          }
          .info-label {
            font-size: 12px;
            color: #666;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 14px;
            color: #333;
            font-weight: 600;
          }
          .items-section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 8px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .item:last-child {
            border-bottom: none;
          }
          .item-quantity {
            font-weight: bold;
            color: #667eea;
            margin-right: 8px;
          }
          .item-name {
            flex: 1;
            font-weight: 500;
          }
          .notes {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
          }
          .notes-title {
            font-weight: bold;
            color: #856404;
            margin-bottom: 8px;
          }
          .notes-content {
            color: #856404;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 25px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            color: #666;
            font-size: 12px;
          }
          .urgency-high {
            border-left-color: #dc3545;
            background: #f8d7da;
          }
          .urgency-medium {
            border-left-color: #ffc107;
            background: #fff3cd;
          }
          .urgency-low {
            border-left-color: #28a745;
            background: #d4edda;
          }
          @media print {
            body { background: white; }
            .order-container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="order-container">
          <div class="header">
            <div class="restaurant-name">RESTAURANTE</div>
            <div class="order-number">Pedido ${order.order_number}</div>
            <div style="font-size: 14px; color: #666;">
              ${new Date(order.created_at).toLocaleString('es-ES')}
            </div>
          </div>
          
          <div class="order-info">
            <div class="info-item">
              <div class="info-label">Tipo</div>
              <div class="info-value">${getOrderTypeLabel(order.order_type)}</div>
            </div>
            ${order.tables ? `
            <div class="info-item">
              <div class="info-label">Mesa</div>
              <div class="info-value">${order.tables.name}</div>
            </div>
            ` : ''}
            ${order.customer_name ? `
            <div class="info-item">
              <div class="info-label">Cliente</div>
              <div class="info-value">${order.customer_name}</div>
            </div>
            ` : ''}
            <div class="info-item">
              <div class="info-label">Tiempo</div>
              <div class="info-value">${getTimeElapsed(order.created_at)}</div>
            </div>
          </div>
          
          <div class="items-section">
            <div class="section-title">Productos</div>
            ${order.order_items.map(item => `
              <div class="item">
                <div>
                  <span class="item-quantity">${item.quantity}x</span>
                  <span class="item-name">${item.products.name}</span>
                </div>
                ${item.notes ? `<div style="font-size: 12px; color: #666;">Nota: ${item.notes}</div>` : ''}
              </div>
            `).join('')}
          </div>
          
          ${order.notes ? `
          <div class="notes">
            <div class="notes-title">Notas del Pedido:</div>
            <div class="notes-content">${order.notes}</div>
          </div>
          ` : ''}
          
          <div class="footer">
            <div>Impreso el ${new Date().toLocaleString('es-ES')}</div>
            <div>Vista de Cocina - Sistema de Restaurante</div>
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  const downloadOrderPDF = (order: KitchenOrder) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pedido ${order.order_number}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .order-container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 400px;
            margin: 0 auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          .restaurant-name {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
          }
          .order-number {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
          }
          .order-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 25px;
          }
          .info-item {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
          }
          .info-label {
            font-size: 12px;
            color: #666;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 14px;
            color: #333;
            font-weight: 600;
          }
          .items-section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 8px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .item:last-child {
            border-bottom: none;
          }
          .item-quantity {
            font-weight: bold;
            color: #667eea;
            margin-right: 8px;
          }
          .item-name {
            flex: 1;
            font-weight: 500;
          }
          .notes {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
          }
          .notes-title {
            font-weight: bold;
            color: #856404;
            margin-bottom: 8px;
          }
          .notes-content {
            color: #856404;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 25px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="order-container">
          <div class="header">
            <div class="restaurant-name">RESTAURANTE</div>
            <div class="order-number">Pedido ${order.order_number}</div>
            <div style="font-size: 14px; color: #666;">
              ${new Date(order.created_at).toLocaleString('es-ES')}
            </div>
          </div>
          
          <div class="order-info">
            <div class="info-item">
              <div class="info-label">Tipo</div>
              <div class="info-value">${getOrderTypeLabel(order.order_type)}</div>
            </div>
            ${order.tables ? `
            <div class="info-item">
              <div class="info-label">Mesa</div>
              <div class="info-value">${order.tables.name}</div>
            </div>
            ` : ''}
            ${order.customer_name ? `
            <div class="info-item">
              <div class="info-label">Cliente</div>
              <div class="info-value">${order.customer_name}</div>
            </div>
            ` : ''}
            <div class="info-item">
              <div class="info-label">Tiempo</div>
              <div class="info-value">${getTimeElapsed(order.created_at)}</div>
            </div>
          </div>
          
          <div class="items-section">
            <div class="section-title">Productos</div>
            ${order.order_items.map(item => `
              <div class="item">
                <div>
                  <span class="item-quantity">${item.quantity}x</span>
                  <span class="item-name">${item.products.name}</span>
                </div>
                ${item.notes ? `<div style="font-size: 12px; color: #666;">Nota: ${item.notes}</div>` : ''}
              </div>
            `).join('')}
          </div>
          
          ${order.notes ? `
          <div class="notes">
            <div class="notes-title">Notas del Pedido:</div>
            <div class="notes-content">${order.notes}</div>
          </div>
          ` : ''}
          
          <div class="footer">
            <div>Generado el ${new Date().toLocaleString('es-ES')}</div>
            <div>Vista de Cocina - Sistema de Restaurante</div>
          </div>
        </div>
      </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pedido-${order.order_number}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Descarga iniciada",
      description: `El pedido ${order.order_number} se está descargando como HTML`,
    })
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

              <div className="space-y-2">
                {/* Botones de impresión */}
                <div className="flex gap-1 justify-center">
                  <Button
                    onClick={() => printOrder(order)}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Imprimir pedido"
                  >
                    <Printer className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={() => downloadOrderPDF(order)}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Descargar como PDF"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Botones de estado */}
                {status === "pending" && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, "preparing")}
                    className="w-full bg-blue-500 hover:bg-blue-600"
                    size="sm"
                  >
                    Iniciar Preparación
                  </Button>
                )}
                {status === "preparing" && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, "ready")}
                    className="w-full bg-green-500 hover:bg-green-600"
                    size="sm"
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Marcar Listo
                  </Button>
                )}
                {status === "ready" && (
                  <div className="w-full text-center">
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Listo para Entregar
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
