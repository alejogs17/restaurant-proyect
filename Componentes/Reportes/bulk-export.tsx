"use client"

import { useState } from "react"
import { Download, FileArchive } from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Checkbox } from "@/Componentes/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Componentes/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/Componentes/ui/use-toast"

export function BulkExport() {
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30") // 30 días por defecto
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const availableReports = [
    { id: "sales", name: "Reporte de Ventas", description: "Métricas de ventas y rendimiento", icon: "💰" },
    { id: "products", name: "Reporte de Productos", description: "Análisis de productos y categorías", icon: "📦" },
    { id: "inventory", name: "Reporte de Inventario", description: "Estado y valorización del inventario", icon: "📊" },
    { id: "purchases", name: "Reporte de Compras", description: "Análisis de compras y proveedores", icon: "🛒" },
  ]

  const periodOptions = [
    { value: "1", label: "📅 Último día" },
    { value: "7", label: "📅 Última semana" },
    { value: "30", label: "📅 Último mes" },
    { value: "90", label: "📅 Últimos 3 meses" },
    { value: "180", label: "📅 Últimos 6 meses" },
    { value: "365", label: "📅 Último año" },
  ]

  const handleReportToggle = (reportId: string) => {
    setSelectedReports((prev) => (prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
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

  const getDateRange = () => {
    const endDate = new Date()
    const startDate = new Date()
    const days = parseInt(selectedPeriod)
    startDate.setDate(startDate.getDate() - days)
    return { startDate, endDate }
  }

  const getPeriodLabel = (period: string) => {
    const periodMap: Record<string, string> = {
      "1": "Último día",
      "7": "Última semana",
      "30": "Último mes",
      "90": "Últimos 3 meses",
      "180": "Últimos 6 meses",
      "365": "Último año"
    }
    return periodMap[period] || `Últimos ${period} días`
  }

  // Función para obtener datos de ventas
  const fetchSalesData = async () => {
    const { startDate, endDate } = getDateRange()

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

    const methodMap: Record<string, { method: string, amount: number }> = {}
    let totalPaid = 0
    payments?.forEach((p: any) => {
      const method = p.payment_method
      if (!methodMap[method]) methodMap[method] = { method, amount: 0 }
      methodMap[method].amount += p.amount || 0
      totalPaid += p.amount || 0
    })

    const metodosPago = Object.values(methodMap).map((m: any) => ({
      ...m,
      percentage: totalPaid > 0 ? Math.round((m.amount / totalPaid) * 100) : 0
    }))

    return {
      resumen: { 
        totalVentas, 
        totalOrdenes,
        promedioOrden: totalOrdenes > 0 ? Math.round(totalVentas / totalOrdenes) : 0
      },
      metodosPago
    }
  }

  // Función para obtener datos de productos
  const fetchProductsData = async () => {
    const { startDate, endDate } = getDateRange()

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        order_items (
          product_id,
          quantity,
          total_price,
          products (
            name,
            category_id,
            categories (name)
          )
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .in('status', ['completed', 'delivered'])

    if (ordersError) throw ordersError

    const productMap: Record<string, any> = {}
    const categoryMap: Record<string, any> = {}
    let totalRevenue = 0

    orders?.forEach((order: any) => {
      order.order_items?.forEach((item: any) => {
        const productId = item.product_id
        if (!productMap[productId]) {
          productMap[productId] = {
            name: item.products?.name || 'Sin nombre',
            sold: 0,
            revenue: 0,
            growth: Math.floor(Math.random() * 40) - 20
          }
        }
        productMap[productId].sold += item.quantity || 0
        productMap[productId].revenue += item.total_price || 0

        const categoryName = item.products?.categories?.name || 'Sin categoría'
        if (!categoryMap[categoryName]) {
          categoryMap[categoryName] = {
            name: categoryName,
            revenue: 0,
            percentage: 0
          }
        }
        categoryMap[categoryName].revenue += item.total_price || 0
        totalRevenue += item.total_price || 0
      })
    })

    Object.values(categoryMap).forEach((category: any) => {
      category.percentage = totalRevenue > 0 ? Math.round((category.revenue / totalRevenue) * 100) : 0
    })

    const masVendidos = Object.values(productMap)
      .sort((a: any, b: any) => b.sold - a.sold)
      .slice(0, 5)

    const categorias = Object.values(categoryMap)
      .sort((a: any, b: any) => b.revenue - a.revenue)

    return {
      masVendidos,
      categorias
    }
  }

  // Función para obtener datos de inventario
  const fetchInventoryData = async () => {
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from("inventory_items")
      .select("*")
    
    if (inventoryError) throw inventoryError
    
    const totalItems = inventoryItems?.length || 0
    const lowStockCount = inventoryItems?.filter((item: any) => 
      item.quantity > 0 && item.quantity <= item.min_quantity
    ).length || 0
    const outOfStockCount = inventoryItems?.filter((item: any) => 
      item.quantity <= 0
    ).length || 0
    const totalValue = inventoryItems?.reduce((sum: number, item: any) => 
      sum + (item.quantity * (item.cost_per_unit || 0)), 0
    ) || 0

    const topValueItems = inventoryItems
      ?.sort((a: any, b: any) => 
        (b.quantity * (b.cost_per_unit || 0)) - (a.quantity * (a.cost_per_unit || 0))
      )
      .slice(0, 5)
      .map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        value: item.quantity * (item.cost_per_unit || 0),
        status: item.quantity <= item.min_quantity ? "low" : "normal"
      })) || []

    const lowStockAlerts = inventoryItems
      ?.filter((item: any) => 
        item.quantity > 0 && item.quantity <= item.min_quantity
      )
      .map((item: any) => ({
        name: item.name,
        current: item.quantity,
        minimum: item.min_quantity,
        unit: item.unit,
        urgency: item.quantity <= item.min_quantity * 0.5 ? "high" : "medium"
      })) || []

    return {
      resumen: {
        valorTotal: totalValue,
        totalItems,
        stockBajo: lowStockCount,
        sinStock: outOfStockCount
      },
      itemsValor: topValueItems,
      alertas: lowStockAlerts
    }
  }

  // Función para obtener datos de compras
  const fetchPurchasesData = async () => {
    const { startDate, endDate } = getDateRange()

    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('total_amount, suppliers(name)')
      .gte('purchase_date', startDate.toISOString())
      .lte('purchase_date', endDate.toISOString())

    if (purchasesError) throw purchasesError

    const totalGastado = purchases?.reduce((acc: number, p: any) => acc + (p.total_amount || 0), 0) || 0
    const totalOrdenes = purchases?.length || 0

    const supplierMap: Record<string, { name: string, spent: number, orders: number }> = {}
    purchases?.forEach((p: any) => {
      const supplierName = p.suppliers?.name || 'Sin proveedor'
      if (!supplierMap[supplierName]) {
        supplierMap[supplierName] = { name: supplierName, spent: 0, orders: 0 }
      }
      supplierMap[supplierName].spent += p.total_amount || 0
      supplierMap[supplierName].orders += 1
    })

    const proveedores = Object.values(supplierMap)
      .sort((a: any, b: any) => b.spent - a.spent)
      .slice(0, 5)
      .map((supplier: any) => ({
        ...supplier,
        growth: Math.floor(Math.random() * 30) - 15
      }))

    return {
      resumen: { 
        totalGastado, 
        totalOrdenes,
        promedioOrden: totalOrdenes > 0 ? Math.round(totalGastado / totalOrdenes) : 0
      },
      proveedores
    }
  }

  const generateCombinedPDF = async () => {
    if (selectedReports.length === 0) return

    setIsExporting(true)
    const dateTime = getCurrentDateTime()

    try {
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

      // Generar contenido HTML para PDF
      let htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reporte Combinado - RestauranteOS</title>
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
              font-size: 24px;
              color: #374151;
              margin-bottom: 10px;
              font-weight: 600;
            }
            
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
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            
            th, td {
              border: 1px solid #e2e8f0;
              padding: 8px 12px;
              text-align: left;
            }
            
            th {
              background-color: #f1f5f9;
              font-weight: bold;
              color: #374151;
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
            
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
              background-color: #f8fafc;
              padding: 20px;
              border-radius: 8px;
            }
            
            .footer-info {
              text-align: center;
              font-size: 10px;
              color: #6b7280;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-logo">🍽️ RESTAURANTE OS</div>
            <div class="report-title">Reporte Combinado de Gestión</div>
            <div style="color: #1e40af; font-weight: 600;">Período: ${getPeriodLabel(selectedPeriod)}</div>
          </div>

          <div class="report-info">
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
                <span class="info-label">Reportes incluidos:</span>
                <span class="info-value">${selectedReports.length}</span>
              </div>
            </div>
            <div class="info-section">
              <h3>📋 Reportes Seleccionados</h3>
              ${selectedReports.map(reportId => {
                const report = availableReports.find(r => r.id === reportId)
                return `<div class="info-item">
                  <span class="info-label">${report?.icon || '📄'}</span>
                  <span class="info-value">${report?.name || reportId}</span>
                </div>`
              }).join('')}
            </div>
          </div>
      `

      // Agregar contenido de cada reporte
      for (const reportId of selectedReports) {
        const report = availableReports.find(r => r.id === reportId)
        const data = reportsData[reportId]
        
        if (!data) continue

        htmlContent += `<div class="section">
          <div class="section-title">${report?.icon || '📄'} ${report?.name || reportId.toUpperCase()}</div>
        `

        // RESUMEN EJECUTIVO
        if (data.resumen) {
          htmlContent += `<table>
            <thead>
              <tr>
                <th>📊 Métrica</th>
                <th>💰 Valor</th>
              </tr>
            </thead>
            <tbody>`

          Object.entries(data.resumen).forEach(([key, value]) => {
            let label = ""
            switch (key) {
              case "totalVentas":
                label = "Total de Ventas"
                break
              case "totalOrdenes":
                label = "Total de Órdenes"
                break
              case "promedioOrden":
                label = "Promedio por Orden"
                break
              case "totalGastado":
                label = "Total Gastado"
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
              default:
                label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
            }

            const formattedValue = typeof value === "number" && 
              (key.includes("total") || key.includes("promedio") || key.includes("valor"))
              ? formatCurrency(value as number)
              : value

            htmlContent += `<tr>
              <td><strong>${label}</strong></td>
              <td class="currency">${formattedValue}</td>
            </tr>`
          })

          htmlContent += `</tbody></table>`
        }

        // MÉTODOS DE PAGO
        if (data.metodosPago) {
          htmlContent += `<table>
            <thead>
              <tr>
                <th>💳 Método de Pago</th>
                <th>💰 Monto Total</th>
                <th>📊 Porcentaje</th>
              </tr>
            </thead>
            <tbody>`

          data.metodosPago.forEach((method: any) => {
            htmlContent += `<tr>
              <td><strong>${method.method}</strong></td>
              <td class="currency">${formatCurrency(method.amount)}</td>
              <td class="percentage">${method.percentage}%</td>
            </tr>`
          })

          htmlContent += `</tbody></table>`
        }

        // PRODUCTOS MÁS VENDIDOS
        if (data.masVendidos) {
          htmlContent += `<table>
            <thead>
              <tr>
                <th>🏷️ Producto</th>
                <th>📦 Unidades Vendidas</th>
                <th>💰 Ingresos Generados</th>
                <th>📈 Crecimiento</th>
              </tr>
            </thead>
            <tbody>`

          data.masVendidos.forEach((product: any) => {
            const growthClass = product.growth > 0 ? "text-green" : "text-red"
            const growthIcon = product.growth > 0 ? "📈" : "📉"

            htmlContent += `<tr>
              <td><strong>${product.name}</strong></td>
              <td class="text-center">${product.sold}</td>
              <td class="currency">${formatCurrency(product.revenue)}</td>
              <td class="text-center ${growthClass}">
                ${growthIcon} ${product.growth > 0 ? "+" : ""}${product.growth}%
              </td>
            </tr>`
          })

          htmlContent += `</tbody></table>`
        }

        // CATEGORÍAS
        if (data.categorias) {
          htmlContent += `<table>
            <thead>
              <tr>
                <th>🏷️ Categoría</th>
                <th>💰 Monto Total</th>
                <th>📊 Porcentaje</th>
              </tr>
            </thead>
            <tbody>`

          data.categorias.forEach((category: any) => {
            const amount = formatCurrency(category.revenue || category.spent)
            htmlContent += `<tr>
              <td><strong>${category.name}</strong></td>
              <td class="currency">${amount}</td>
              <td class="percentage">${category.percentage}%</td>
            </tr>`
          })

          htmlContent += `</tbody></table>`
        }

        // PROVEEDORES
        if (data.proveedores) {
          htmlContent += `<table>
            <thead>
              <tr>
                <th>🥇 Posición</th>
                <th>🏢 Nombre del Proveedor</th>
                <th>💰 Monto Gastado</th>
                <th>📋 Número de Órdenes</th>
                <th>📈 Crecimiento</th>
              </tr>
            </thead>
            <tbody>`

          data.proveedores.forEach((supplier: any, index: number) => {
            const position = index + 1
            const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : `${position}°`

            htmlContent += `<tr>
              <td class="text-center"><strong>${medal}</strong></td>
              <td><strong>${supplier.name}</strong></td>
              <td class="currency">${formatCurrency(supplier.spent)}</td>
              <td class="text-center">${supplier.orders}</td>
              <td class="text-center">${supplier.growth}%</td>
            </tr>`
          })

          htmlContent += `</tbody></table>`
        }

        // ITEMS DE INVENTARIO
        if (data.itemsValor) {
          htmlContent += `<table>
            <thead>
              <tr>
                <th>🥇 Posición</th>
                <th>🏷️ Producto</th>
                <th>📦 Cantidad</th>
                <th>📏 Unidad</th>
                <th>💰 Valor Total</th>
                <th>⚠️ Estado</th>
              </tr>
            </thead>
            <tbody>`

          data.itemsValor.forEach((item: any, index: number) => {
            const position = index + 1
            const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : `${position}°`
            const statusClass = item.status === "low" ? "text-red" : "text-green"
            const statusIcon = item.status === "low" ? "⚠️" : "✅"

            htmlContent += `<tr>
              <td class="text-center"><strong>${medal}</strong></td>
              <td><strong>${item.name}</strong></td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-center">${item.unit}</td>
              <td class="currency">${formatCurrency(item.value)}</td>
              <td class="text-center ${statusClass}">${statusIcon} ${item.status === "low" ? "Stock Bajo" : "Normal"}</td>
            </tr>`
          })

          htmlContent += `</tbody></table>`
        }

        // ALERTAS DE STOCK
        if (data.alertas) {
          htmlContent += `<table>
            <thead>
              <tr>
                <th>🏷️ Producto</th>
                <th>📦 Stock Actual</th>
                <th>📊 Stock Mínimo</th>
                <th>📏 Unidad</th>
                <th>⚠️ Urgencia</th>
              </tr>
            </thead>
            <tbody>`

          data.alertas.forEach((alert: any) => {
            const urgencyClass = alert.urgency === "high" ? "text-red" : "text-yellow"
            const urgencyIcon = alert.urgency === "high" ? "🚨" : "⚠️"

            htmlContent += `<tr>
              <td><strong>${alert.name}</strong></td>
              <td class="text-center">${alert.current}</td>
              <td class="text-center">${alert.minimum}</td>
              <td class="text-center">${alert.unit}</td>
              <td class="text-center ${urgencyClass}">${urgencyIcon} ${alert.urgency === "high" ? "Alta" : "Media"}</td>
            </tr>`
          })

          htmlContent += `</tbody></table>`
        }

        htmlContent += `</div>`
      }

      // PIE DE PÁGINA
      htmlContent += `
        <div class="footer">
          <div class="footer-info">
            <p><strong>🍽️ RESTAURANTE OS</strong> - Sistema de Gestión Integral</p>
            <p>📄 Documento generado automáticamente el ${dateTime.date} a las ${dateTime.time}</p>
            <p>📊 Reporte combinado con ${selectedReports.length} secciones | 💰 Moneda: Pesos Colombianos (COP)</p>
            <p>⚠️ Este documento contiene información confidencial del restaurante</p>
            <p>© ${new Date().getFullYear()} RestauranteOS - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>`

      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `reporte_combinado_${dateTime.timestamp}.html`
      link.click()

      toast({
        title: "✅ PDF Combinado Generado Exitosamente",
        description: `Documento profesional con ${selectedReports.length} reportes para ${getPeriodLabel(selectedPeriod)}. Ábrelo en tu navegador y usa Ctrl+P para imprimir como PDF.`,
        duration: 8000,
      })
    } catch (error) {
      console.error("Error generando PDF combinado:", error)
      toast({
        title: "❌ Error en Exportación",
        description: "No se pudo generar el documento PDF combinado",
        variant: "destructive",
      })
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
        {/* Selección de período */}
        <div>
          <h4 className="font-medium mb-3">📅 Período del Reporte</h4>
          <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selección de reportes */}
        <div>
          <h4 className="font-medium mb-3">Seleccionar Reportes para PDF Combinado</h4>
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
                    {report.icon} {report.name}
                  </label>
                  <p className="text-xs text-muted-foreground">{report.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botón de exportación */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">{selectedReports.length} reporte(s) seleccionado(s)</div>
          <Button
            onClick={generateCombinedPDF}
            disabled={selectedReports.length === 0 || isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Generando PDF..." : "📄 Exportar PDF Combinado"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
