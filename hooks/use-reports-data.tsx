"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface SummaryData {
  totalSales: number
  totalOrders: number
  totalPurchases: number
  inventoryValue: number
  salesGrowth: number
  ordersGrowth: number
  purchasesGrowth: number
  inventoryGrowth: number
  period: string
}

interface Order {
  total: number
}

interface Purchase {
  total_amount: number
}

interface InventoryItem {
  quantity: number
  cost_per_unit: number
}

export function useReportsData(startDate: Date, endDate: Date) {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalSales: 0,
    totalOrders: 0,
    totalPurchases: 0,
    inventoryValue: 0,
    salesGrowth: 0,
    ordersGrowth: 0,
    purchasesGrowth: 0,
    inventoryGrowth: 0,
    period: "",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSummaryData()
  }, [startDate, endDate])

  const fetchSummaryData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      // Calcular fechas para el período anterior (mismo rango de días)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const previousStartDate = new Date(startDate.getTime() - (daysDiff * 24 * 60 * 60 * 1000))
      const previousEndDate = new Date(startDate.getTime() - (24 * 60 * 60 * 1000))

      // 1. Obtener ventas totales del período actual
      const { data: currentSales, error: salesError } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (salesError) throw salesError

      // 2. Obtener ventas del período anterior
      const { data: previousSales, error: previousSalesError } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'completed')
        .gte('created_at', previousStartDate.toISOString())
        .lte('created_at', previousEndDate.toISOString())

      if (previousSalesError) throw previousSalesError

      // 3. Obtener órdenes totales del período actual
      const { data: currentOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (ordersError) throw ordersError

      // 4. Obtener órdenes del período anterior
      const { data: previousOrders, error: previousOrdersError } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'completed')
        .gte('created_at', previousStartDate.toISOString())
        .lte('created_at', previousEndDate.toISOString())

      if (previousOrdersError) throw previousOrdersError

      // 5. Obtener compras totales del período actual
      const { data: currentPurchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('total_amount')
        .gte('purchase_date', startDate.toISOString())
        .lte('purchase_date', endDate.toISOString())

      if (purchasesError) throw purchasesError

      // 6. Obtener compras del período anterior
      const { data: previousPurchases, error: previousPurchasesError } = await supabase
        .from('purchases')
        .select('total_amount')
        .gte('purchase_date', previousStartDate.toISOString())
        .lte('purchase_date', previousEndDate.toISOString())

      if (previousPurchasesError) throw previousPurchasesError

      // 7. Obtener valor del inventario actual
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('quantity, cost_per_unit')

      if (inventoryError) throw inventoryError

      // Calcular totales
      const totalSales = currentSales?.reduce((sum: number, order: Order) => sum + (order.total || 0), 0) || 0
      const previousTotalSales = previousSales?.reduce((sum: number, order: Order) => sum + (order.total || 0), 0) || 0
      const totalOrders = currentOrders?.length || 0
      const previousTotalOrders = previousOrders?.length || 0
      const totalPurchases = currentPurchases?.reduce((sum: number, purchase: Purchase) => sum + (purchase.total_amount || 0), 0) || 0
      const previousTotalPurchases = previousPurchases?.reduce((sum: number, purchase: Purchase) => sum + (purchase.total_amount || 0), 0) || 0
      const inventoryValue = inventoryItems?.reduce((sum: number, item: InventoryItem) => sum + ((item.quantity || 0) * (item.cost_per_unit || 0)), 0) || 0

      // Calcular crecimiento (porcentaje)
      const salesGrowth = previousTotalSales > 0 ? ((totalSales - previousTotalSales) / previousTotalSales) * 100 : 0
      const ordersGrowth = previousTotalOrders > 0 ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100 : 0
      const purchasesGrowth = previousTotalPurchases > 0 ? ((totalPurchases - previousTotalPurchases) / previousTotalPurchases) * 100 : 0
      
      // Para el inventario, asumimos un crecimiento del 0% por defecto (se puede ajustar según necesidades)
      const inventoryGrowth = 0

      setSummaryData({
        totalSales,
        totalOrders,
        totalPurchases,
        inventoryValue,
        salesGrowth,
        ordersGrowth,
        purchasesGrowth,
        inventoryGrowth,
        period: `${startDate.toLocaleDateString("es-CO")} al ${endDate.toLocaleDateString("es-CO")}`,
      })

    } catch (err: any) {
      console.error("Error fetching summary data:", err)
      setError(err.message || "Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  return { summaryData, loading, error, refetch: fetchSummaryData }
} 