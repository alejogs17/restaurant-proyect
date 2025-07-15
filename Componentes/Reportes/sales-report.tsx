"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { TrendingUp, Calendar, Clock } from "lucide-react"
import { ExportDropdown } from "./export-dropdown"

interface SalesReportProps {
  dateRange: string
  startDate: Date
  endDate: Date
}

export function SalesReport({ dateRange, startDate, endDate }: SalesReportProps) {
  const [dailyAverage, setDailyAverage] = useState(0)
  const [bestDay, setBestDay] = useState<{ date: string, amount: number } | null>(null)
  const [worstDay, setWorstDay] = useState<{ date: string, amount: number } | null>(null)
  const [peakHour, setPeakHour] = useState<string>("")
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [topWaiters, setTopWaiters] = useState<any[]>([])
  const [soldProducts, setSoldProducts] = useState<any[]>([])
  const [soldOrders, setSoldOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchSalesData()
  }, [dateRange, startDate, endDate])

  const fetchSalesData = async () => {
    setLoading(true)
    try {
      console.log("Fetching sales data...")
      
      // 1. Obtener órdenes completadas (sin JOIN automático)
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total, created_at, user_id')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed')
      
      if (ordersError) {
        console.error("Error fetching orders:", ordersError)
        console.error("Error details:", {
          message: ordersError.message,
          details: ordersError.details,
          hint: ordersError.hint,
          code: ordersError.code
        })
        throw ordersError
      }
      console.log("Orders data:", orders)

      // Obtener datos de usuarios por separado si hay órdenes
      let userProfiles: Record<string, any> = {}
      if (orders && orders.length > 0) {
        const userIds = [...new Set(orders.map((o: any) => o.user_id).filter(Boolean))]
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', userIds)
          
          if (!profilesError && profiles) {
            userProfiles = profiles.reduce((acc: any, profile: any) => {
              acc[profile.id] = profile
              return acc
            }, {})
          }
        }
      }

      // Agrupar ventas por día
      const dayMap: Record<string, number> = {}
      orders?.forEach((o: any) => {
        const d = new Date(o.created_at)
        const key = d.toISOString().split('T')[0]
        if (!dayMap[key]) dayMap[key] = 0
        dayMap[key] += o.total || 0
      })
      const days = Object.entries(dayMap)
      const totalDays = days.length
      const totalSales = days.reduce((acc, [, amount]) => acc + amount, 0)
      setDailyAverage(totalDays > 0 ? Math.round(totalSales / totalDays) : 0)
      
      // Mejor y peor día
      if (days.length > 0) {
        const sorted = days.sort((a, b) => b[1] - a[1])
        setBestDay({ date: sorted[0][0], amount: sorted[0][1] })
        setWorstDay({ date: sorted[sorted.length - 1][0], amount: sorted[sorted.length - 1][1] })
      } else {
        setBestDay(null)
        setWorstDay(null)
      }

      // 2. Hora pico (más órdenes en una hora)
      const hourMap: Record<string, number> = {}
      orders?.forEach((o: any) => {
        const d = new Date(o.created_at)
        const hour = d.getHours()
        const key = `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`
        if (!hourMap[key]) hourMap[key] = 0
        hourMap[key] += 1
      })
      const peak = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0]
      setPeakHour(peak ? peak[0] : "")

      // 3. Métodos de pago
      console.log("Fetching payments...")
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('payment_method, amount')
        .gte('payment_date', startDate.toISOString())
        .lte('payment_date', endDate.toISOString())
      
      if (paymentsError) {
        console.error("Error fetching payments:", paymentsError)
        console.error("Payments error details:", {
          message: paymentsError.message,
          details: paymentsError.details,
          hint: paymentsError.hint,
          code: paymentsError.code
        })
        throw paymentsError
      }
      console.log("Payments data:", payments)
      
      const methodMap: Record<string, { method: string, amount: number }> = {}
      let totalPaid = 0
      payments?.forEach((p: any) => {
        const method = p.payment_method
        if (!methodMap[method]) methodMap[method] = { method, amount: 0 }
        methodMap[method].amount += p.amount || 0
        totalPaid += p.amount || 0
      })
      const methodsArr = Object.values(methodMap).map(m => ({ ...m, percentage: totalPaid > 0 ? Math.round((m.amount / totalPaid) * 100) : 0 }))
      setPaymentMethods(methodsArr)

      // 4. Top meseros (por ventas y órdenes)
      const waiterMap: Record<string, { name: string, sales: number, orders: number }> = {}
      orders?.forEach((o: any) => {
        const profile = userProfiles[o.user_id]
        const name = profile ? `${profile.first_name} ${profile.last_name}` : 'Sin nombre'
        if (!waiterMap[name]) waiterMap[name] = { name, sales: 0, orders: 0 }
        waiterMap[name].sales += o.total || 0
        waiterMap[name].orders += 1
      })
      const sortedWaiters = Object.values(waiterMap).sort((a, b) => b.sales - a.sales).slice(0, 4)
      setTopWaiters(sortedWaiters)
      
      // 5. Productos vendidos en el período
      const { data: ordersWithItems, error: orderItemsError } = await supabase
        .from('orders')
        .select(`id, created_at, total, order_items (product_id, quantity, total_price, products (name))`)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed')

      if (orderItemsError) {
        console.error('Error fetching order items:', orderItemsError)
      } else {
        // Mapear productos vendidos
        const productMap: Record<string, { name: string, sold: number, revenue: number }> = {}
        ordersWithItems?.forEach((order: any) => {
          order.order_items?.forEach((item: any) => {
            const productId = item.product_id
            if (!productMap[productId]) {
              productMap[productId] = {
                name: item.products?.name || 'Sin nombre',
                sold: 0,
                revenue: 0
              }
            }
            productMap[productId].sold += item.quantity || 0
            productMap[productId].revenue += item.total_price || 0
          })
        })
        setSoldProducts(Object.values(productMap).sort((a, b) => b.sold - a.sold))

        // Guardar detalle de órdenes vendidas
        setSoldOrders(
          ordersWithItems?.map((order: any) => ({
            id: order.id,
            date: order.created_at,
            total: order.total,
            items: order.order_items?.map((item: any) => ({
              name: item.products?.name || 'Sin nombre',
              quantity: item.quantity,
              total: item.total_price
            })) || []
          })) || []
        )
      }
      
    } catch (error) {
      console.error('Error fetching sales data:', error)
      console.error('Full error object:', JSON.stringify(error, null, 2))
      // Establecer valores por defecto en caso de error
      setDailyAverage(0)
      setBestDay(null)
      setWorstDay(null)
      setPeakHour("")
      setPaymentMethods([])
      setTopWaiters([])
      setSoldProducts([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">📊 Reporte de Ventas</h2>
          <p className="text-muted-foreground">Análisis detallado de ventas del período seleccionado</p>
        </div>
        <ExportDropdown
          data={{
            resumen: {
              promedioDiario: dailyAverage,
              mejorDia: bestDay ? `${formatCurrency(bestDay.amount)} (${new Date(bestDay.date).toLocaleDateString("es-CO")})` : "Sin datos",
              horaPico: peakHour,
              periodoAnalizado: dateRange,
            },
            metodosPago: paymentMethods,
            mejoresMeseros: topWaiters,
            productosVendidos: soldProducts,
            ordenesVendidas: soldOrders,
          }}
          filename="reporte_ventas"
          elementId="sales-report-content"
          startDate={startDate}
          endDate={endDate}
          reportTitle="REPORTE DE VENTAS"
        />
      </div>
      
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-6" id="sales-report-content">
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  💰 Promedio Diario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(dailyAverage)}</div>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">+12.5%</span>
                  <span className="text-muted-foreground ml-1">vs período anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  🏆 Mejor Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{bestDay ? formatCurrency(bestDay.amount) : "Sin datos"}</div>
                <div className="flex items-center mt-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-muted-foreground">
                    {bestDay ? new Date(bestDay.date).toLocaleDateString("es-CO") : "Sin datos"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  ⏰ Hora Pico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{peakHour || "Sin datos"}</div>
                <div className="flex items-center mt-2 text-sm">
                  <Clock className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-muted-foreground">Mayor actividad</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métodos de pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">💳 Métodos de Pago</CardTitle>
              <p className="text-sm text-muted-foreground">
                Distribución de ventas por método de pago durante el período
              </p>
            </CardHeader>
            <CardContent>
              {paymentMethods.length > 0 ? (
                <div className="space-y-4">
                  {paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"][index],
                          }}
                        />
                        <span className="font-medium text-lg">{method.method}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="text-sm px-3 py-1">
                          {method.percentage}%
                        </Badge>
                        <span className="font-bold text-xl text-green-600">{formatCurrency(method.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos de métodos de pago para el período seleccionado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top meseros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">🏆 Mejores Meseros del Período</CardTitle>
              <p className="text-sm text-muted-foreground">
                Ranking de meseros por ventas totales y número de órdenes atendidas
              </p>
            </CardHeader>
            <CardContent>
              {topWaiters.length > 0 ? (
                <div className="space-y-4">
                  {topWaiters.map((waiter, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{waiter.name}</p>
                          <p className="text-sm text-muted-foreground">📋 {waiter.orders} órdenes atendidas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-green-600">{formatCurrency(waiter.sales)}</p>
                        <p className="text-sm text-muted-foreground">
                          💳 {formatCurrency(waiter.sales / waiter.orders)} promedio/orden
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos de meseros para el período seleccionado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Productos vendidos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">🛍️ Productos Vendidos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Lista de productos vendidos con cantidad y monto total por producto
              </p>
            </CardHeader>
            <CardContent>
              {soldProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Producto
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad Vendida
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {soldProducts.map((product, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sold}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos de productos vendidos para el período seleccionado
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
