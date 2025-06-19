"use client"

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

export default function ReportsPage() {
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const [endDate, setEndDate] = useState<Date>(new Date())

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

  // Datos de resumen para el período seleccionado
  const summaryData = {
    totalSales: 45680000,
    totalOrders: 1247,
    totalPurchases: 12450000,
    inventoryValue: 15420000,
    salesGrowth: 12.5,
    ordersGrowth: 8.3,
    purchasesGrowth: -5.2,
    inventoryGrowth: 3.1,
    period: formatDateRange(),
  }

  return (
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
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summaryData.totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{summaryData.salesGrowth}%</span> vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Totales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summaryData.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{summaryData.ordersGrowth}%</span> vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compras Totales</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(summaryData.totalPurchases)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">{summaryData.purchasesGrowth}%</span> vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(summaryData.inventoryValue)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{summaryData.inventoryGrowth}%</span> vs período anterior
            </p>
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
  )
}
