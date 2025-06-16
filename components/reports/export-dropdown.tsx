"use client"

import { useState } from "react"
import { Download, FileText, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"

interface ExportDropdownProps {
  data: any
  filename: string
  elementId: string
  startDate: Date
  endDate: Date
  reportTitle: string
}

export function ExportDropdown({ data, filename, elementId, startDate, endDate, reportTitle }: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDateRange = () => {
    const start = startDate.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    const end = endDate.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    return `${start} al ${end}`
  }

  const getCurrentDateTime = () => {
    const now = new Date()
    return {
      date: now.toLocaleDateString("es-CO", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: now.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      timestamp: now.toISOString().slice(0, 19).replace(/:/g, "-"),
    }
  }

  // Función para escapar valores CSV correctamente
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return ""

    const str = String(value)
    // Si contiene comas, comillas o saltos de línea, envolver en comillas y escapar comillas internas
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const exportToExcel = () => {
    setIsExporting(true)
    const dateTime = getCurrentDateTime()

    try {
      // Crear contenido CSV bien estructurado sin problemas de comas
      let csvContent = "\uFEFF" // BOM para UTF-8

      // ENCABEZADO PRINCIPAL
      csvContent += `RESTAURANTE OS\n`
      csvContent += `${reportTitle}\n`
      csvContent += `Período: ${formatDateRange()}\n`
      csvContent += `Generado: ${dateTime.date} - ${dateTime.time}\n`
      csvContent += `\n`

      // RESUMEN EJECUTIVO
      if (data.resumen) {
        csvContent += `RESUMEN EJECUTIVO\n`
        csvContent += `================\n`
        csvContent += `Concepto;Valor\n` // Usar punto y coma como separador

        Object.entries(data.resumen).forEach(([key, value]) => {
          let label = ""
          switch (key) {
            case "promedioDiario":
              label = "Promedio Diario de Ventas"
              break
            case "totalGastado":
              label = "Total Gastado en Compras"
              break
            case "valorTotal":
              label = "Valor Total del Inventario"
              break
            case "totalItems":
              label = "Total de Items"
              break
            case "stockBajo":
              label = "Items con Stock Bajo"
              break
            case "sinStock":
              label = "Items Sin Stock"
              break
            case "totalOrdenes":
              label = "Total de Órdenes"
              break
            case "promedioOrden":
              label = "Promedio por Orden"
              break
            default:
              label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
          }

          const formattedValue =
            typeof value === "number" && (key.includes("total") || key.includes("promedio") || key.includes("valor"))
              ? formatCurrency(value as number).replace(/,/g, ".") // Cambiar comas por puntos en números
              : String(value).replace(/,/g, " -") // Reemplazar comas problemáticas

          csvContent += `${label};${formattedValue}\n`
        })
        csvContent += `\n`
      }

      // MÉTODOS DE PAGO
      if (data.metodosPago) {
        csvContent += `MÉTODOS DE PAGO\n`
        csvContent += `===============\n`
        csvContent += `Método;Monto;Porcentaje\n`
        data.metodosPago.forEach((method: any) => {
          const amount = formatCurrency(method.amount).replace(/,/g, ".")
          csvContent += `${method.method};${amount};${method.percentage}%\n`
        })
        csvContent += `\n`
      }

      // MEJORES MESEROS
      if (data.mejoresMeseros) {
        csvContent += `MEJORES MESEROS\n`
        csvContent += `===============\n`
        csvContent += `Posición;Nombre;Ventas Totales;Número de Órdenes;Promedio por Orden\n`
        data.mejoresMeseros.forEach((waiter: any, index: number) => {
          const sales = formatCurrency(waiter.sales).replace(/,/g, ".")
          const average = formatCurrency(waiter.sales / waiter.orders).replace(/,/g, ".")
          csvContent += `${index + 1};${waiter.name};${sales};${waiter.orders};${average}\n`
        })
        csvContent += `\n`
      }

      // PRODUCTOS MÁS VENDIDOS
      if (data.masVendidos) {
        csvContent += `PRODUCTOS MÁS VENDIDOS\n`
        csvContent += `======================\n`
        csvContent += `Posición;Producto;Unidades Vendidas;Ingresos;Crecimiento\n`
        data.masVendidos.forEach((product: any, index: number) => {
          const revenue = formatCurrency(product.revenue).replace(/,/g, ".")
          csvContent += `${index + 1};${product.name};${product.sold};${revenue};${product.growth}%\n`
        })
        csvContent += `\n`
      }

      // CATEGORÍAS
      if (data.categorias) {
        csvContent += `VENTAS POR CATEGORÍA\n`
        csvContent += `====================\n`
        csvContent += `Categoría;Monto;Porcentaje;Órdenes\n`
        data.categorias.forEach((category: any) => {
          const amount = formatCurrency(category.revenue || category.spent).replace(/,/g, ".")
          csvContent += `${category.name};${amount};${category.percentage}%;${category.orders || "N/A"}\n`
        })
        csvContent += `\n`
      }

      // PROVEEDORES
      if (data.proveedores) {
        csvContent += `PRINCIPALES PROVEEDORES\n`
        csvContent += `=======================\n`
        csvContent += `Posición;Proveedor;Monto Gastado;Número de Órdenes;Crecimiento\n`
        data.proveedores.forEach((supplier: any, index: number) => {
          const spent = formatCurrency(supplier.spent).replace(/,/g, ".")
          csvContent += `${index + 1};${supplier.name};${spent};${supplier.orders};${supplier.growth}%\n`
        })
        csvContent += `\n`
      }

      // ITEMS DE INVENTARIO
      if (data.itemsValor) {
        csvContent += `ITEMS DE MAYOR VALOR EN INVENTARIO\n`
        csvContent += `==================================\n`
        csvContent += `Posición;Producto;Cantidad;Unidad;Valor;Estado\n`
        data.itemsValor.forEach((item: any, index: number) => {
          const value = formatCurrency(item.value).replace(/,/g, ".")
          const status = item.status === "low" ? "Stock Bajo" : "Normal"
          csvContent += `${index + 1};${item.name};${item.quantity};${item.unit};${value};${status}\n`
        })
        csvContent += `\n`
      }

      // ALERTAS
      if (data.alertas) {
        csvContent += `ALERTAS DE STOCK BAJO\n`
        csvContent += `=====================\n`
        csvContent += `Producto;Stock Actual;Stock Mínimo;Unidad;Urgencia\n`
        data.alertas.forEach((alert: any) => {
          const urgency = alert.urgency === "high" ? "Alta" : "Media"
          csvContent += `${alert.name};${alert.current};${alert.minimum};${alert.unit};${urgency}\n`
        })
        csvContent += `\n`
      }

      // PIE DEL REPORTE
      csvContent += `INFORMACIÓN DEL REPORTE\n`
      csvContent += `=======================\n`
      csvContent += `Sistema;RestauranteOS v1.0\n`
      csvContent += `Moneda;Pesos Colombianos (COP)\n`
      csvContent += `Zona Horaria;America/Bogota\n`
      csvContent += `Generado por;Administrador del Sistema\n`
      csvContent += `\n`
      csvContent += `NOTAS IMPORTANTES:\n`
      csvContent += `- Todos los valores están en pesos colombianos\n`
      csvContent += `- Los porcentajes son calculados sobre el total del período\n`
      csvContent += `- Este reporte fue generado automáticamente\n`
      csvContent += `- Separador usado: punto y coma (;) para evitar conflictos\n`

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${filename}_${formatDateRange().replace(/\//g, "-")}_${dateTime.timestamp}.csv`
      link.click()

      toast({
        title: "✅ Excel Generado Exitosamente",
        description: `Archivo descargado: ${filename}_${formatDateRange().replace(/\//g, "-")}.csv`,
      })
    } catch (error) {
      console.error("Error exportando Excel:", error)
      toast({
        title: "❌ Error en Exportación",
        description: "No se pudo generar el archivo Excel",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const exportToPDF = () => {
    setIsExporting(true)
    const dateTime = getCurrentDateTime()

    try {
      // Generar contenido HTML estructurado para PDF
      const generateReportContent = (data: any) => {
        let content = ""

        // RESUMEN EJECUTIVO
        if (data.resumen) {
          content += `
            <div class="section">
              <div class="section-title">📈 RESUMEN EJECUTIVO</div>
              <div class="summary-grid">
          `

          Object.entries(data.resumen).forEach(([key, value]) => {
            if (key !== "periodoAnalizado") {
              let label = ""
              let icon = ""
              switch (key) {
                case "promedioDiario":
                  label = "Promedio Diario de Ventas"
                  icon = "💰"
                  break
                case "totalGastado":
                  label = "Total Gastado en Compras"
                  icon = "🛒"
                  break
                case "valorTotal":
                  label = "Valor Total del Inventario"
                  icon = "📦"
                  break
                case "totalItems":
                  label = "Total de Items"
                  icon = "📊"
                  break
                case "stockBajo":
                  label = "Items con Stock Bajo"
                  icon = "⚠️"
                  break
                case "sinStock":
                  label = "Items Sin Stock"
                  icon = "🚫"
                  break
                case "totalOrdenes":
                  label = "Total de Órdenes"
                  icon = "📋"
                  break
                case "promedioOrden":
                  label = "Promedio por Orden"
                  icon = "💳"
                  break
                default:
                  label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
                  icon = "📊"
              }

              const formattedValue =
                typeof value === "number" &&
                (key.includes("total") || key.includes("promedio") || key.includes("valor"))
                  ? formatCurrency(value as number)
                  : value

              content += `
                <div class="summary-card">
                  <div class="summary-label">${icon} ${label}</div>
                  <div class="summary-value">${formattedValue}</div>
                </div>
              `
            }
          })

          content += `
              </div>
            </div>
          `
        }

        // MÉTODOS DE PAGO
        if (data.metodosPago) {
          content += `
            <div class="section">
              <div class="section-title">💳 MÉTODOS DE PAGO</div>
              <table>
                <thead>
                  <tr>
                    <th>🏷️ Método de Pago</th>
                    <th>💰 Monto Total</th>
                    <th>📊 Porcentaje</th>
                    <th>📈 Participación</th>
                  </tr>
                </thead>
                <tbody>
          `

          data.metodosPago.forEach((method: any) => {
            content += `
              <tr>
                <td><strong>${method.method}</strong></td>
                <td class="currency">${formatCurrency(method.amount)}</td>
                <td class="percentage">${method.percentage}%</td>
                <td>
                  <div style="background-color: #e2e8f0; border-radius: 10px; height: 20px; position: relative;">
                    <div style="background-color: #3b82f6; height: 100%; width: ${method.percentage}%; border-radius: 10px;"></div>
                  </div>
                </td>
              </tr>
            `
          })

          content += `
                </tbody>
              </table>
            </div>
          `
        }

        // MEJORES MESEROS
        if (data.mejoresMeseros) {
          content += `
            <div class="section">
              <div class="section-title">🏆 MEJORES MESEROS</div>
              <table>
                <thead>
                  <tr>
                    <th>🥇 Posición</th>
                    <th>👤 Nombre del Mesero</th>
                    <th>💰 Ventas Totales</th>
                    <th>📋 Número de Órdenes</th>
                    <th>💳 Promedio por Orden</th>
                  </tr>
                </thead>
                <tbody>
          `

          data.mejoresMeseros.forEach((waiter: any, index: number) => {
            const position = index + 1
            const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : `${position}°`

            content += `
              <tr>
                <td class="text-center"><strong>${medal}</strong></td>
                <td><strong>${waiter.name}</strong></td>
                <td class="currency">${formatCurrency(waiter.sales)}</td>
                <td class="text-center">${waiter.orders}</td>
                <td class="currency">${formatCurrency(waiter.sales / waiter.orders)}</td>
              </tr>
            `
          })

          content += `
                </tbody>
              </table>
            </div>
          `
        }

        // PRODUCTOS MÁS VENDIDOS
        if (data.masVendidos) {
          content += `
            <div class="section">
              <div class="section-title">⭐ PRODUCTOS MÁS VENDIDOS</div>
              <table>
                <thead>
                  <tr>
                    <th>🏷️ Producto</th>
                    <th>📦 Unidades Vendidas</th>
                    <th>💰 Ingresos Generados</th>
                    <th>📈 Crecimiento</th>
                  </tr>
                </thead>
                <tbody>
          `

          data.masVendidos.forEach((product: any) => {
            const growthClass = product.growth > 0 ? "text-green" : "text-red"
            const growthIcon = product.growth > 0 ? "📈" : "📉"

            content += `
              <tr>
                <td><strong>${product.name}</strong></td>
                <td class="text-center">${product.sold}</td>
                <td class="currency">${formatCurrency(product.revenue)}</td>
                <td class="text-center ${growthClass}">
                  ${growthIcon} ${product.growth > 0 ? "+" : ""}${product.growth}%
                </td>
              </tr>
            `
          })

          content += `
                </tbody>
              </table>
            </div>
          `
        }

        return content
      }

      // Crear documento HTML completo para PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${reportTitle} - RestauranteOS</title>
          <style>
            @page {
              margin: 2cm;
              size: A4;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.4;
              color: #333;
              margin: 0;
              padding: 0;
              font-size: 12px;
            }
            
            /* ENCABEZADO */
            .header {
              text-align: center;
              border-bottom: 4px solid #1e40af;
              padding-bottom: 20px;
              margin-bottom: 30px;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              padding: 20px;
              border-radius: 8px;
            }
            
            .company-logo {
              font-size: 32px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 8px;
              letter-spacing: 3px;
            }
            
            .report-title {
              font-size: 20px;
              color: #374151;
              margin-bottom: 10px;
              font-weight: 600;
            }
            
            .report-period {
              font-size: 16px;
              color: #1e40af;
              background-color: #dbeafe;
              padding: 8px 16px;
              border-radius: 20px;
              display: inline-block;
              font-weight: 600;
            }
            
            /* INFORMACIÓN DEL REPORTE */
            .report-info {
              background-color: #f8fafc;
              border: 2px solid #e2e8f0;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 30px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            
            .info-section h3 {
              color: #1e40af;
              font-size: 14px;
              margin-bottom: 10px;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 5px;
            }
            
            .info-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding: 4px 0;
            }
            
            .info-label {
              font-weight: 600;
              color: #475569;
            }
            
            .info-value {
              color: #1e293b;
              font-weight: 500;
            }
            
            /* SECCIONES */
            .section {
              margin-bottom: 40px;
              page-break-inside: avoid;
            }
            
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 15px;
              padding: 10px 0;
              border-bottom: 3px solid #e2e8f0;
              background: linear-gradient(90deg, #dbeafe 0%, transparent 100%);
              padding-left: 15px;
            }
            
            /* RESUMEN EJECUTIVO */
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }
            
            .summary-card {
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              border: 2px solid #0ea5e9;
              border-radius: 10px;
              padding: 20px;
              text-align: center;
            }
            
            .summary-label {
              font-size: 14px;
              color: #0c4a6e;
              margin-bottom: 8px;
              font-weight: 600;
            }
            
            .summary-value {
              font-size: 24px;
              font-weight: bold;
              color: #1e40af;
              font-family: 'Courier New', monospace;
            }
            
            /* TABLAS */
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              background-color: white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              border-radius: 8px;
              overflow: hidden;
            }
            
            th {
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
              color: white;
              padding: 15px 12px;
              text-align: left;
              font-weight: bold;
              font-size: 13px;
            }
            
            td {
              padding: 12px;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: top;
            }
            
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            
            tr:hover {
              background-color: #f1f5f9;
            }
            
            .currency {
              text-align: right;
              font-weight: bold;
              color: #059669;
              font-family: 'Courier New', monospace;
            }
            
            .percentage {
              text-align: center;
              font-weight: bold;
              color: #7c3aed;
            }
            
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .text-green { color: #059669; }
            .text-red { color: #dc2626; }
            .text-blue { color: #2563eb; }
            
            /* PIE DE PÁGINA */
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
              background-color: #f8fafc;
              padding: 20px;
              border-radius: 8px;
            }
            
            .signature-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 50px;
              margin-top: 40px;
            }
            
            .signature-box {
              text-align: center;
              border-top: 2px solid #374151;
              padding-top: 10px;
              margin-top: 40px;
            }
            
            .signature-title {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 5px;
            }
            
            .signature-name {
              font-weight: bold;
              font-size: 14px;
              color: #1f2937;
            }
            
            .footer-info {
              text-align: center;
              font-size: 10px;
              color: #6b7280;
              margin-top: 20px;
            }
            
            @media print {
              .no-print { display: none !important; }
              body { print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <!-- ENCABEZADO -->
          <div class="header">
            <div class="company-logo">🍽️ RESTAURANTE OS</div>
            <div class="report-title">${reportTitle}</div>
            <div class="report-period">Período: ${formatDateRange()}</div>
          </div>

          <!-- INFORMACIÓN DEL REPORTE -->
          <div class="report-info">
            <div class="info-section">
              <h3>📅 Información del Período</h3>
              <div class="info-item">
                <span class="info-label">Fecha Inicio:</span>
                <span class="info-value">${startDate.toLocaleDateString("es-CO")}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fecha Fin:</span>
                <span class="info-value">${endDate.toLocaleDateString("es-CO")}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Días Analizados:</span>
                <span class="info-value">${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} días</span>
              </div>
            </div>
            <div class="info-section">
              <h3>📊 Información del Reporte</h3>
              <div class="info-item">
                <span class="info-label">Generado:</span>
                <span class="info-value">${dateTime.date}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Hora:</span>
                <span class="info-value">${dateTime.time}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Usuario:</span>
                <span class="info-value">Administrador</span>
              </div>
            </div>
          </div>

          <!-- CONTENIDO DEL REPORTE -->
          <div class="content">
            ${generateReportContent(data)}
          </div>

          <!-- PIE DE PÁGINA -->
          <div class="footer">
            <div class="signature-section">
              <div>
                <div class="signature-box">
                  <div class="signature-title">Elaborado por</div>
                  <div class="signature-name">Sistema RestauranteOS</div>
                </div>
              </div>
              <div>
                <div class="signature-box">
                  <div class="signature-title">Revisado por</div>
                  <div class="signature-name">Administrador</div>
                </div>
              </div>
            </div>
            
            <div class="footer-info">
              <p><strong>🍽️ RESTAURANTE OS</strong> - Sistema de Gestión Integral</p>
              <p>📄 Documento generado automáticamente el ${dateTime.date} a las ${dateTime.time}</p>
              <p>📊 Período analizado: ${formatDateRange()} | 💰 Moneda: Pesos Colombianos (COP)</p>
              <p>⚠️ Este documento contiene información confidencial del restaurante</p>
              <p>© ${new Date().getFullYear()} RestauranteOS - Todos los derechos reservados</p>
            </div>
          </div>
        </body>
        </html>
      `

      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${filename}_${formatDateRange().replace(/\//g, "-")}_${dateTime.timestamp}.html`
      link.click()

      toast({
        title: "✅ PDF Generado Exitosamente",
        description: `Documento profesional descargado. Ábrelo en tu navegador y usa Ctrl+P para imprimir como PDF.`,
        duration: 8000,
      })
    } catch (error) {
      console.error("Error exportando PDF:", error)
      toast({
        title: "❌ Error en Exportación",
        description: "No se pudo generar el documento PDF",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting} className="min-w-[140px]">
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Exportando..." : "📄 Exportar"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>📊 Formato de Exportación</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">📄 Documento PDF</span>
            <span className="text-xs text-muted-foreground">Se abre en navegador para imprimir</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span className="font-medium">📊 Hoja Excel</span>
            <span className="text-xs text-muted-foreground">CSV con separador punto y coma</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
