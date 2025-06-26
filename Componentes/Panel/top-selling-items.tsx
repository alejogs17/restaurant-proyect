"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Progress } from "@/Componentes/ui/progress"
import { TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function TopSellingItems() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      const supabase = createClient()
      // Obtener ventas por producto
      const { data: salesData, error } = await supabase
        .from('order_items')
        .select('product_id, quantity, total_price, products(name, category_id, categories(name))')
      if (error || !salesData) {
        setItems([])
        setLoading(false)
        return
      }
      // Agrupar por producto
      const productMap: Record<string, any> = {}
      salesData.forEach((item: any) => {
        const pid = item.product_id
        if (!productMap[pid]) {
          productMap[pid] = {
            name: item.products?.name || 'Sin nombre',
            sales: 0,
            revenue: 0,
            category: item.products?.categories?.name || 'Sin categoría',
          }
        }
        productMap[pid].sales += item.quantity || 0
        productMap[pid].revenue += item.total_price || 0
      })
      // Ordenar por ventas y tomar los 5 primeros
      const sorted = Object.values(productMap).sort((a: any, b: any) => b.sales - a.sales).slice(0, 5)
      // Calcular porcentaje relativo al más vendido
      const maxSales = sorted.length > 0 ? sorted[0].sales : 1
      sorted.forEach((item: any) => {
        item.percentage = Math.round((item.sales / maxSales) * 100)
      })
      setItems(sorted)
      setLoading(false)
    }
    fetchItems()
  }, [])

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          Productos Más Vendidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {loading ? (
            <div className="text-center text-gray-500">Cargando productos...</div>
          ) : items.length === 0 ? (
            <div className="text-center text-gray-500">No hay ventas registradas</div>
          ) : (
            items.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">${item.revenue.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{item.sales} vendidos</div>
                  </div>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
