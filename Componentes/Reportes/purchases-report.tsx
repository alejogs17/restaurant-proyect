"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { TrendingUp, TrendingDown, ShoppingCart, Truck } from "lucide-react"
import { ExportDropdown } from "./export-dropdown"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface PurchasesReportProps {
  dateRange: string
  startDate: Date
  endDate: Date
}

export function PurchasesReport({ dateRange, startDate, endDate }: PurchasesReportProps) {
  const [totalSpent, setTotalSpent] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [averageOrder, setAverageOrder] = useState(0)
  const [topSuppliers, setTopSuppliers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [recentPurchases, setRecentPurchases] = useState<any[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchPurchasesData()
  }, [dateRange, startDate, endDate])

  const fetchPurchasesData = async () => {
    try {
      setLoading(true)
      console.log("Fetching purchases data...")
      
      // 1. Obtener compras con datos de proveedores
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          id, 
          total_amount, 
          supplier_id, 
          purchase_date, 
          status,
          suppliers(name)
        `)
        .gte('purchase_date', startDate.toISOString())
        .lte('purchase_date', endDate.toISOString())
      
      if (purchasesError) {
        console.error("Error fetching purchases:", purchasesError)
        throw purchasesError
      }
      
      console.log("Purchases data:", purchases)

      // 2. Obtener items de compras
      const { data: purchaseItems, error: itemsError } = await supabase
        .from('purchase_items')
        .select(`
          total_price, 
          inventory_item_id,
          inventory_items(name, unit)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      if (itemsError) {
        console.warn("Error fetching purchase items:", itemsError)
      }
      
      console.log("Purchase items data:", purchaseItems)

      // 3. Calcular estadísticas básicas
      const totalSpentVal = purchases?.reduce((acc: number, p: any) => acc + (p.total_amount || 0), 0) || 0
      setTotalSpent(totalSpentVal)
      setTotalOrders(purchases?.length || 0)
      setAverageOrder(purchases && purchases.length > 0 ? Math.round(totalSpentVal / purchases.length) : 0)

      // 4. Proveedores principales
      const supplierMap: Record<string, { name: string, spent: number, orders: number, growth: number }> = {}
      purchases?.forEach((p: any) => {
        const name = p.suppliers?.name || `Proveedor ${p.supplier_id || 'Sin ID'}`
        if (!supplierMap[name]) supplierMap[name] = { name, spent: 0, orders: 0, growth: 0 }
        supplierMap[name].spent += p.total_amount || 0
        supplierMap[name].orders += 1
      })
      const sortedSuppliers = Object.values(supplierMap).sort((a: any, b: any) => b.spent - a.spent).slice(0, 5)
      setTopSuppliers(sortedSuppliers)

      // 5. Gastos por categoría de insumo
      const categoryMap: Record<string, { name: string, spent: number, orders: number }> = {}
      purchaseItems?.forEach((item: any) => {
        const itemName = item.inventory_items?.name || 'Item sin nombre'
        const catName = itemName.split(' ')[0] + 's' // Simplificado: usar primera palabra + 's'
        if (!categoryMap[catName]) categoryMap[catName] = { name: catName, spent: 0, orders: 0 }
        categoryMap[catName].spent += item.total_price || 0
        categoryMap[catName].orders += 1
      })
      const totalCatSpent = Object.values(categoryMap).reduce((acc: number, c: any) => acc + c.spent, 0)
      const categoriesArr = Object.values(categoryMap).map((c: any) => ({ ...c, percentage: totalCatSpent > 0 ? Math.round((c.spent / totalCatSpent) * 100) : 0 }))
      setCategories(categoriesArr)

      // 6. Compras recientes
      const recent = purchases?.slice(0, 4).map((p: any, i: number) => ({
        id: p.id,
        supplier: p.suppliers?.name || `Proveedor ${p.supplier_id || 'Sin ID'}`,
        date: p.purchase_date,
        amount: p.total_amount,
        status: p.status,
        items: purchaseItems?.filter((item: any) => item.purchase_id === p.id).length || 0
      })) || []
      setRecentPurchases(recent)

      // 7. Tendencia mensual
      const trendMap: Record<string, number> = {}
      purchases?.forEach((p: any) => {
        const d = new Date(p.purchase_date)
        const key = d.toLocaleString('es-CO', { month: 'short' })
        if (!trendMap[key]) trendMap[key] = 0
        trendMap[key] += p.total_amount || 0
      })
      const trendArr = Object.entries(trendMap).map(([month, amount]: [string, number]) => ({ month, amount }))
      setMonthlyTrend(trendArr)
      
    } catch (error) {
      console.error('Error fetching purchases data:', error)
      // Establecer valores por defecto en caso de error
      setTotalSpent(0)
      setTotalOrders(0)
      setAverageOrder(0)
      setTopSuppliers([])
      setCategories([])
      setRecentPurchases([])
      setMonthlyTrend([])
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completada"
      case "pending":
        return "Pendiente"
      case "cancelled":
        return "Cancelada"
      default:
        return status
    }
  }

  return (
    <div className="space-y-6" id="purchases-report-content">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Reporte de Compras</h2>
        <ExportDropdown
          reportTitle="Reporte de Compras"
          data={{
            resumen: {
              totalGastado: totalSpent,
              totalOrdenes: totalOrders,
              promedioOrden: averageOrder,
              periodoAnalizado: dateRange,
            },
            proveedores: topSuppliers,
            categorias: categories,
            comprasRecientes: recentPurchases,
            tendenciaMensual: monthlyTrend,
          }}
          filename="reporte_compras"
          elementId="purchases-report-content"
          startDate={startDate}
          endDate={endDate}
        />
      </div>
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Gastado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalSpent)}</div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+5.5%</span>
              <span className="text-muted-foreground ml-1">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Órdenes Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalOrders}</div>
            <div className="flex items-center mt-2 text-sm">
              <ShoppingCart className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-muted-foreground">Compras realizadas</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Promedio por Orden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(averageOrder)}</div>
            <div className="flex items-center mt-2 text-sm">
              <Truck className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-muted-foreground">Por compra</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top proveedores */}
      <Card>
        <CardHeader>
          <CardTitle>Principales Proveedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topSuppliers.map((supplier: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{supplier.name}</p>
                    <p className="text-sm text-muted-foreground">{supplier.orders} órdenes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-blue-600">{formatCurrency(supplier.spent)}</p>
                  <div className="flex items-center text-sm">
                    {supplier.growth > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={supplier.growth > 0 ? "text-green-600" : "text-red-600"}>
                      {supplier.growth > 0 ? "+" : ""}
                      {supplier.growth}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compras por categoría */}
      <Card>
        <CardHeader>
          <CardTitle>Compras por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((category: any, index: number) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{category.name}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{category.percentage}%</Badge>
                    <span className="font-bold">{formatCurrency(category.spent)}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${category.percentage}%` }} />
                </div>
                <p className="text-sm text-muted-foreground">{category.orders} órdenes</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compras recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Compras Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPurchases.map((purchase: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{purchase.id}</p>
                    <p className="text-sm text-muted-foreground">{purchase.supplier}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(purchase.date).toLocaleDateString("es-ES")} • {purchase.items} items
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(purchase.amount)}</p>
                  <Badge variant="outline" className={getStatusColor(purchase.status)}>
                    {getStatusText(purchase.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
