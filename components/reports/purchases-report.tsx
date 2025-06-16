"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, ShoppingCart, Truck } from "lucide-react"
import { ExportDropdown } from "./export-dropdown"

interface PurchasesReportProps {
  dateRange: string
  startDate: Date
  endDate: Date
}

export function PurchasesReport({ dateRange, startDate, endDate }: PurchasesReportProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Datos de ejemplo para compras
  const purchasesData = {
    totalSpent: 12450000,
    totalOrders: 45,
    averageOrder: 276667,
    topSuppliers: [
      { name: "Distribuidora Central S.A.S.", spent: 4580000, orders: 12, growth: 15.2 },
      { name: "Carnes Premium Ltda.", spent: 3240000, orders: 8, growth: 8.7 },
      { name: "Frutas y Verduras del Campo", spent: 2180000, orders: 15, growth: 12.3 },
      { name: "Lácteos La Pradera", spent: 1450000, orders: 6, growth: -2.1 },
      { name: "Bebidas y Licores El Dorado", spent: 1000000, orders: 4, growth: 5.8 },
    ],
    categories: [
      { name: "Carnes y Proteínas", spent: 4580000, percentage: 36.8, orders: 15 },
      { name: "Frutas y Verduras", spent: 2890000, percentage: 23.2, orders: 18 },
      { name: "Lácteos", spent: 2180000, percentage: 17.5, orders: 8 },
      { name: "Bebidas", spent: 1450000, percentage: 11.6, orders: 6 },
      { name: "Granos y Cereales", spent: 1350000, percentage: 10.9, orders: 12 },
    ],
    recentPurchases: [
      {
        id: "PUR-001",
        supplier: "Distribuidora Central S.A.S.",
        date: "2024-01-15",
        amount: 450000,
        status: "completed",
        items: 8,
      },
      {
        id: "PUR-002",
        supplier: "Carnes Premium Ltda.",
        date: "2024-01-14",
        amount: 680000,
        status: "completed",
        items: 5,
      },
      {
        id: "PUR-003",
        supplier: "Frutas y Verduras del Campo",
        date: "2024-01-13",
        amount: 320000,
        status: "pending",
        items: 12,
      },
      {
        id: "PUR-004",
        supplier: "Lácteos La Pradera",
        date: "2024-01-12",
        amount: 280000,
        status: "completed",
        items: 6,
      },
    ],
    monthlyTrend: [
      { month: "Dic", amount: 11800000 },
      { month: "Ene", amount: 12450000 },
    ],
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
          data={{
            resumen: {
              totalGastado: purchasesData.totalSpent,
              totalOrdenes: purchasesData.totalOrders,
              promedioOrden: purchasesData.averageOrder,
              periodoAnalizado: dateRange,
            },
            proveedores: purchasesData.topSuppliers,
            categorias: purchasesData.categories,
            comprasRecientes: purchasesData.recentPurchases,
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
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(purchasesData.totalSpent)}</div>
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
            <div className="text-2xl font-bold text-green-600">{purchasesData.totalOrders}</div>
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
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(purchasesData.averageOrder)}</div>
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
            {purchasesData.topSuppliers.map((supplier, index) => (
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
            {purchasesData.categories.map((category, index) => (
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
            {purchasesData.recentPurchases.map((purchase, index) => (
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
