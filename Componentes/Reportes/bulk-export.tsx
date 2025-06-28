"use client"

import { useState } from "react"
import { Download, FileArchive } from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Checkbox } from "@/Componentes/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Componentes/ui/select"
import { exportToCSV, exportToJSON } from "./export-utils"
import { createClient } from "@/lib/supabase/client"

export function BulkExport() {
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [format, setFormat] = useState("csv")
  const [dateRange, setDateRange] = useState("30")
  const [isExporting, setIsExporting] = useState(false)
  const supabase = createClient()

  const availableReports = [
    { id: "sales", name: "Reporte de Ventas", description: "Métricas de ventas y rendimiento" },
    { id: "products", name: "Reporte de Productos", description: "Análisis de productos y categorías" },
    { id: "inventory", name: "Reporte de Inventario", description: "Estado y valorización del inventario" },
    { id: "purchases", name: "Reporte de Compras", description: "Análisis de compras y proveedores" },
  ]

  const handleReportToggle = (reportId: string) => {
    setSelectedReports((prev) => (prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]))
  }

  // Función para obtener datos de ventas
  const fetchSalesData = async () => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateRange))

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total, status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'completed')

    if (ordersError) throw ordersError

    const totalVentas = orders?.reduce((acc: number, order: any) => acc + (order.total || 0), 0) || 0
    const totalOrdenes = orders?.length || 0

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('payment_method, amount')
      .gte('payment_date', startDate.toISOString())
      .lte('payment_date', endDate.toISOString())

    if (paymentsError) throw paymentsError

    const methodMap: Record<string, { metodo: string, monto: number }> = {}
    let totalPaid = 0
    payments?.forEach((p: any) => {
      const method = p.payment_method
      if (!methodMap[method]) methodMap[method] = { metodo: method, monto: 0 }
      methodMap[method].monto += p.amount || 0
      totalPaid += p.amount || 0
    })

    const metodosPago = Object.values(methodMap).map((m: any) => ({
      ...m,
      porcentaje: totalPaid > 0 ? Math.round((m.monto / totalPaid) * 100) : 0
    }))

    return {
      resumen: { totalVentas, totalOrdenes },
      metodosPago
    }
  }

  // Función para obtener datos de productos
  const fetchProductsData = async () => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateRange))

    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        quantity,
        total_price,
        products (name)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'delivered')

    if (orderItemsError) throw orderItemsError

    const productMap: Record<string, { producto: string, vendidos: number, ingresos: number }> = {}
    orderItems?.forEach((item: any) => {
      const productName = item.products?.name || 'Sin nombre'
      if (!productMap[productName]) {
        productMap[productName] = { producto: productName, vendidos: 0, ingresos: 0 }
      }
      productMap[productName].vendidos += item.quantity || 0
      productMap[productName].ingresos += item.total_price || 0
    })

    const masVendidos = Object.values(productMap)
      .sort((a: any, b: any) => b.vendidos - a.vendidos)
      .slice(0, 10)

    return { masVendidos }
  }

  // Función para obtener datos de inventario
  const fetchInventoryData = async () => {
    const { data: inventoryStats, error: statsError } = await supabase.rpc("get_inventory_stats")
    if (statsError) throw statsError

    const { data: lowStockItems, error: lowStockError } = await supabase.rpc("get_low_stock_items")
    if (lowStockError) throw lowStockError

    const resumen = {
      valorTotal: inventoryStats?.[0]?.total_value || 0,
      totalItems: inventoryStats?.[0]?.total_items || 0
    }

    const alertas = lowStockItems?.map((item: any) => ({
      item: item.name,
      stock: item.quantity,
      minimo: item.min_quantity
    })) || []

    return { resumen, alertas }
  }

  // Función para obtener datos de compras
  const fetchPurchasesData = async () => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateRange))

    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('total_amount, suppliers(name)')
      .gte('purchase_date', startDate.toISOString())
      .lte('purchase_date', endDate.toISOString())

    if (purchasesError) throw purchasesError

    const totalGastado = purchases?.reduce((acc: number, p: any) => acc + (p.total_amount || 0), 0) || 0
    const totalOrdenes = purchases?.length || 0

    const supplierMap: Record<string, { proveedor: string, gastado: number }> = {}
    purchases?.forEach((p: any) => {
      const supplierName = p.suppliers?.name || 'Sin proveedor'
      if (!supplierMap[supplierName]) {
        supplierMap[supplierName] = { proveedor: supplierName, gastado: 0 }
      }
      supplierMap[supplierName].gastado += p.total_amount || 0
    })

    const proveedores = Object.values(supplierMap)
      .sort((a: any, b: any) => b.gastado - a.gastado)
      .slice(0, 10)

    return {
      resumen: { totalGastado, totalOrdenes },
      proveedores
    }
  }

  const handleBulkExport = async () => {
    if (selectedReports.length === 0) return

    setIsExporting(true)

    try {
      const timestamp = new Date().toISOString().split("T")[0]
      const reportsData: Record<string, any> = {}

      // Obtener datos reales para cada reporte seleccionado
      for (const reportId of selectedReports) {
        switch (reportId) {
          case "sales":
            reportsData.sales = await fetchSalesData()
            break
          case "products":
            reportsData.products = await fetchProductsData()
            break
          case "inventory":
            reportsData.inventory = await fetchInventoryData()
            break
          case "purchases":
            reportsData.purchases = await fetchPurchasesData()
            break
        }
      }

      // Exportar cada reporte seleccionado
      for (const reportId of selectedReports) {
        const data = reportsData[reportId]
        const filename = `${reportId}_${timestamp}`

        if (format === "csv") {
          // Convertir datos a formato plano para CSV
          const flatData = Object.entries(data).flatMap(([section, items]) => {
            if (Array.isArray(items)) {
              return items.map((item: any) => ({ seccion: section, ...item }))
            } else {
              return [{ seccion: section, ...(items as Record<string, any>) }]
            }
          })
          exportToCSV(flatData, filename)
        } else {
          exportToJSON(data, filename)
        }

        // Pequeña pausa entre descargas
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error("Error en exportación masiva:", error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileArchive className="h-5 w-5" />
          Exportación Masiva de Reportes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selección de reportes */}
        <div>
          <h4 className="font-medium mb-3">Seleccionar Reportes</h4>
          <div className="space-y-3">
            {availableReports.map((report) => (
              <div key={report.id} className="flex items-start space-x-3">
                <Checkbox
                  id={report.id}
                  checked={selectedReports.includes(report.id)}
                  onCheckedChange={() => handleReportToggle(report.id)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor={report.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {report.name}
                  </label>
                  <p className="text-xs text-muted-foreground">{report.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuración de exportación */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Formato</label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Excel)</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Período</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 3 meses</SelectItem>
                <SelectItem value="365">Último año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botón de exportación */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">{selectedReports.length} reporte(s) seleccionado(s)</div>
          <Button
            onClick={handleBulkExport}
            disabled={selectedReports.length === 0 || isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exportando..." : "Exportar Seleccionados"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
