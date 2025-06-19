"use client"

import { useState } from "react"
import { Download, FileArchive } from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Checkbox } from "@/Componentes/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Componentes/ui/select"
import { exportToCSV, exportToJSON } from "./export-utils"

export function BulkExport() {
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [format, setFormat] = useState("csv")
  const [dateRange, setDateRange] = useState("30")
  const [isExporting, setIsExporting] = useState(false)

  const availableReports = [
    { id: "sales", name: "Reporte de Ventas", description: "Métricas de ventas y rendimiento" },
    { id: "products", name: "Reporte de Productos", description: "Análisis de productos y categorías" },
    { id: "inventory", name: "Reporte de Inventario", description: "Estado y valorización del inventario" },
    { id: "purchases", name: "Reporte de Compras", description: "Análisis de compras y proveedores" },
  ]

  const handleReportToggle = (reportId: string) => {
    setSelectedReports((prev) => (prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]))
  }

  const handleBulkExport = async () => {
    if (selectedReports.length === 0) return

    setIsExporting(true)

    try {
      const timestamp = new Date().toISOString().split("T")[0]

      // Datos de ejemplo para cada reporte
      const reportsData = {
        sales: {
          resumen: { totalVentas: 45680000, totalOrdenes: 1247 },
          metodosPago: [
            { metodo: "Efectivo", monto: 18272000, porcentaje: 40 },
            { metodo: "Tarjeta Crédito", monto: 13704000, porcentaje: 30 },
          ],
        },
        products: {
          masVendidos: [
            { producto: "Hamburguesa de Res", vendidos: 245, ingresos: 15670200 },
            { producto: "Pasta Carbonara", vendidos: 189, ingresos: 12844044 },
          ],
        },
        inventory: {
          resumen: { valorTotal: 15420000, totalItems: 45 },
          alertas: [{ item: "Queso Mozzarella", stock: 8, minimo: 15 }],
        },
        purchases: {
          resumen: { totalGastado: 12450000, totalOrdenes: 45 },
          proveedores: [{ proveedor: "Distribuidora Central", gastado: 4580000 }],
        },
      }

      // Exportar cada reporte seleccionado
      for (const reportId of selectedReports) {
        const data = reportsData[reportId as keyof typeof reportsData]
        const filename = `${reportId}_${timestamp}`

        if (format === "csv") {
          // Convertir datos a formato plano para CSV
          const flatData = Object.entries(data).flatMap(([section, items]) => {
            if (Array.isArray(items)) {
              return items.map((item) => ({ seccion: section, ...item }))
            } else {
              return [{ seccion: section, ...items }]
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
