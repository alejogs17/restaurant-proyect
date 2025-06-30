"use client"

import ProtectedRoute from "@/Componentes/ProtectedRoute"
import { useState } from "react"
import { TrendingUp, DollarSign, ShoppingCart, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Componentes/ui/tabs"
import { SalesReport } from "@/Componentes/Reportes/sales-report"
import { InventoryReport } from "@/Componentes/Reportes/inventory-report"
import { PurchasesReport } from "@/Componentes/Reportes/purchases-report"
import { ProductsReport } from "@/Componentes/Reportes/products-report"
import { ExportDropdown } from "@/Componentes/Reportes/export-dropdown"
import { DateRangePicker } from "@/Componentes/Reportes/date-range-picker"
import { BulkExport } from "@/Componentes/Reportes/bulk-export"
import { useReportsData } from "@/hooks/use-reports-data"
import { Skeleton } from "@/Componentes/ui/skeleton"

export default function ReportsPage() {
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const [endDate, setEndDate] = useState<Date>(new Date())

  const { summaryData, loading, error } = useReportsData(startDate, endDate)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDateRange = () => {
    return `${startDate.toLocaleDateString("es-CO")} al ${endDate.toLocaleDateString("es-CO")}`
  }

  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate)
    setEndDate(newEndDate)
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
              <p className="text-gray-600">Análisis detallado del rendimiento del restaurante</p>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <p>Error al cargar los datos: {error}</p>
                <p className="text-sm text-gray-500 mt-2">Verifica tu conexión a internet y vuelve a intentar</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="space-y-6" id="reports-content">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
            <p className="text-gray-600">Análisis detallado del rendimiento del restaurante</p>
            <p className="text-sm text-blue-600 font-medium mt-1">Período: {formatDateRange()}</p>
          </div>
          <div className="flex flex-col lg:flex-row gap-4">
            <ExportDropdown
              data={summaryData}
              filename="resumen_reportes"
              elementId="reports-content"
              startDate={startDate}
              endDate={endDate}
              reportTitle="RESUMEN DE REPORTES"
            />
          </div>
        </div>

        {/* Selector de fechas */}
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Período del Reporte</CardTitle>
          </CardHeader>
          <CardContent>
            <DateRangePicker onDateRangeChange={handleDateRangeChange} />
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(summaryData.totalSales)}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className={summaryData.salesGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                      {summaryData.salesGrowth >= 0 ? "+" : ""}{summaryData.salesGrowth.toFixed(1)}%
                    </span> vs período anterior
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Órdenes Totales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-600">{summaryData.totalOrders.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className={summaryData.ordersGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                      {summaryData.ordersGrowth >= 0 ? "+" : ""}{summaryData.ordersGrowth.toFixed(1)}%
                    </span> vs período anterior
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compras Totales</CardTitle>
              <Package className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(summaryData.totalPurchases)}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className={summaryData.purchasesGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                      {summaryData.purchasesGrowth >= 0 ? "+" : ""}{summaryData.purchasesGrowth.toFixed(1)}%
                    </span> vs período anterior
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(summaryData.inventoryValue)}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className={summaryData.inventoryGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                      {summaryData.inventoryGrowth >= 0 ? "+" : ""}{summaryData.inventoryGrowth.toFixed(1)}%
                    </span> vs período anterior
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Exportación Masiva */}
        <BulkExport />

        {/* Reports Tabs */}
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sales">Ventas</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="purchases">Compras</TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <SalesReport dateRange={formatDateRange()} startDate={startDate} endDate={endDate} />
          </TabsContent>

          <TabsContent value="products">
            <ProductsReport dateRange={formatDateRange()} startDate={startDate} endDate={endDate} />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryReport dateRange={formatDateRange()} startDate={startDate} endDate={endDate} />
          </TabsContent>

          <TabsContent value="purchases">
            <PurchasesReport dateRange={formatDateRange()} startDate={startDate} endDate={endDate} />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
} 