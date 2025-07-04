"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Clock, ChefHat, Printer } from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { Badge } from "@/Componentes/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Componentes/ui/tabs"
import { KitchenOrderBoard } from "@/Componentes/kitchen/kitchen-order-board"
import { createClient } from "@/lib/supabase/client"
import ProtectedRoute from "@/Componentes/ProtectedRoute"

interface OrderStats {
  pending: number
  preparing: number
  ready: number
}

export default function CocinaPage() {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [orderStats, setOrderStats] = useState<OrderStats>({
    pending: 0,
    preparing: 0,
    ready: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")
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

  const printAllOrders = async (status: string) => {
    try {
      const { data: orders, error } = await supabase
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

      if (error) throw error

      if (!orders || orders.length === 0) {
        alert('No hay pedidos para imprimir en esta sección')
        return
      }

      const printWindow = window.open('', '_blank')
      if (!printWindow) return

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Pedidos ${status === 'pending' ? 'Pendientes' : status === 'preparing' ? 'En Preparación' : 'Listos'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #667eea;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .restaurant-name {
              font-size: 28px;
              font-weight: bold;
              color: #667eea;
              margin-bottom: 10px;
            }
            .section-title {
              font-size: 24px;
              color: #333;
              margin-bottom: 20px;
            }
            .orders-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 20px;
            }
            .order-card {
              border: 2px solid #667eea;
              border-radius: 12px;
              padding: 20px;
              background: #f8f9fa;
              page-break-inside: avoid;
            }
            .order-header {
              border-bottom: 2px solid #667eea;
              padding-bottom: 15px;
              margin-bottom: 15px;
            }
            .order-number {
              font-size: 18px;
              font-weight: bold;
              color: #333;
              margin-bottom: 5px;
            }
            .order-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 15px;
              font-size: 12px;
            }
            .info-item {
              background: white;
              padding: 8px;
              border-radius: 6px;
              border-left: 3px solid #667eea;
            }
            .info-label {
              font-weight: bold;
              color: #666;
              text-transform: uppercase;
              font-size: 10px;
            }
            .info-value {
              color: #333;
              font-weight: 600;
              font-size: 12px;
            }
            .items-list {
              margin-bottom: 15px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              border-bottom: 1px solid #eee;
              font-size: 12px;
            }
            .item:last-child {
              border-bottom: none;
            }
            .item-quantity {
              font-weight: bold;
              color: #667eea;
              margin-right: 8px;
            }
            .notes {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 6px;
              padding: 10px;
              font-size: 11px;
            }
            .notes-title {
              font-weight: bold;
              color: #856404;
              margin-bottom: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #eee;
              color: #666;
              font-size: 12px;
            }
            @media print {
              .order-card { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">RESTAURANTE</div>
            <div class="section-title">Pedidos ${status === 'pending' ? 'Pendientes' : status === 'preparing' ? 'En Preparación' : 'Listos'}</div>
            <div style="font-size: 14px; color: #666;">
              Impreso el ${new Date().toLocaleString('es-ES')}
            </div>
          </div>
          
          <div class="orders-grid">
            ${orders.map((order: any) => `
              <div class="order-card">
                <div class="order-header">
                  <div class="order-number">Pedido ${order.order_number}</div>
                  <div style="font-size: 12px; color: #666;">
                    ${new Date(order.created_at).toLocaleString('es-ES')}
                  </div>
                </div>
                
                <div class="order-info">
                  <div class="info-item">
                    <div class="info-label">Tipo</div>
                    <div class="info-value">${order.order_type === 'dine_in' ? 'En Mesa' : order.order_type === 'takeout' ? 'Para Llevar' : 'Domicilio'}</div>
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
                    <div class="info-value">${Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60))} min</div>
                  </div>
                </div>
                
                <div class="items-list">
                  ${order.order_items.map((item: any) => `
                    <div class="item">
                      <div>
                        <span class="item-quantity">${item.quantity}x</span>
                        <span>${item.products.name}</span>
                      </div>
                      ${item.notes ? `<div style="font-size: 10px; color: #666;">Nota: ${item.notes}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
                
                ${order.notes ? `
                <div class="notes">
                  <div class="notes-title">Notas del Pedido:</div>
                  <div>${order.notes}</div>
                </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="footer">
            <div>Total de pedidos: ${orders.length}</div>
            <div>Vista de Cocina - Sistema de Restaurante</div>
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
    } catch (error) {
      console.error('Error printing orders:', error)
      alert('Error al imprimir los pedidos')
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "cashier", "chef", "waiter"]}>
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
              onClick={() => printAllOrders(activeTab)}
              variant="outline"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Todos
            </Button>
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
    </ProtectedRoute>
  )
}
