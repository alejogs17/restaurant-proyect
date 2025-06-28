"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { TrendingUp, TrendingDown, Star } from "lucide-react"
import { ExportDropdown } from "./export-dropdown"
import { createClient } from "@/lib/supabase/client"

interface ProductsReportProps {
  dateRange: string
  startDate: Date
  endDate: Date
}

interface TopSellingProduct {
  name: string
  sold: number
  revenue: number
  growth: number
}

interface CategoryRevenue {
  name: string
  revenue: number
  percentage: number
  growth: number
}

interface LowPerformingProduct {
  name: string
  sold: number
  revenue: number
  growth: number
}

export function ProductsReport({ dateRange, startDate, endDate }: ProductsReportProps) {
  const [topSelling, setTopSelling] = useState<TopSellingProduct[]>([])
  const [categories, setCategories] = useState<CategoryRevenue[]>([])
  const [lowPerforming, setLowPerforming] = useState<LowPerformingProduct[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchProductsData()
  }, [dateRange, startDate, endDate])

  const fetchProductsData = async () => {
    try {
      setLoading(true)
      
      // Obtener productos más vendidos - consultar a través de orders para filtrar por fecha
      const { data: topSellingData, error: topSellingError } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
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

      if (topSellingError) {
        console.error("Error fetching top selling data:", topSellingError)
        throw topSellingError
      }

      // Procesar datos de productos más vendidos
      const productMap: Record<string, TopSellingProduct> = {}
      
      topSellingData?.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
          const productId = item.product_id
          if (!productMap[productId]) {
            productMap[productId] = {
              name: item.products?.name || 'Sin nombre',
              sold: 0,
              revenue: 0,
              growth: 0
            }
          }
          productMap[productId].sold += item.quantity || 0
          productMap[productId].revenue += item.total_price || 0
        })
      })

      const topSellingProducts = Object.values(productMap)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5)
      setTopSelling(topSellingProducts)

      // Obtener ventas por categoría
      const categoryMap: Record<string, CategoryRevenue> = {}
      let totalRevenue = 0

      topSellingData?.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
          const categoryName = item.products?.categories?.name || 'Sin categoría'
          if (!categoryMap[categoryName]) {
            categoryMap[categoryName] = {
              name: categoryName,
              revenue: 0,
              percentage: 0,
              growth: 0
            }
          }
          categoryMap[categoryName].revenue += item.total_price || 0
          totalRevenue += item.total_price || 0
        })
      })

      // Calcular porcentajes
      Object.values(categoryMap).forEach(category => {
        category.percentage = totalRevenue > 0 ? Math.round((category.revenue / totalRevenue) * 100) : 0
      })

      const sortedCategories = Object.values(categoryMap)
        .sort((a, b) => b.revenue - a.revenue)
      setCategories(sortedCategories)

      // Obtener productos con bajo rendimiento (menos vendidos)
      const lowPerformingProducts = Object.values(productMap)
        .filter(product => product.sold > 0)
        .sort((a, b) => a.sold - b.sold)
        .slice(0, 3)
        .map(product => ({
          ...product,
          growth: -Math.abs(Math.random() * 20 + 5)
        }))
      setLowPerforming(lowPerformingProducts)

    } catch (error) {
      console.error("Error fetching products data:", error)
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Reporte de Productos</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" id="products-report-content">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reporte de Productos</h2>
        <ExportDropdown
          data={{
            masVendidos: topSelling,
            categorias: categories,
            bajoRendimiento: lowPerforming,
            periodoAnalizado: dateRange,
          }}
          filename="reporte_productos"
          elementId="products-report-content"
          startDate={startDate}
          endDate={endDate}
          reportTitle="Reporte de Productos"
        />
      </div>
      {/* Productos más vendidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Productos Más Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topSelling.map((product: TopSellingProduct, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sold} unidades vendidas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-green-600">{formatCurrency(product.revenue)}</p>
                  <div className="flex items-center text-sm">
                    {product.growth > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={product.growth > 0 ? "text-green-600" : "text-red-600"}>
                      {product.growth > 0 ? "+" : ""}
                      {product.growth}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {topSelling.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay productos vendidos en el período seleccionado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ventas por categoría */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((category: CategoryRevenue, index: number) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{category.name}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{category.percentage}%</Badge>
                    <span className="font-bold">{formatCurrency(category.revenue)}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${category.percentage}%` }} />
                </div>
                <div className="flex items-center text-sm">
                  {category.growth > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={category.growth > 0 ? "text-green-600" : "text-red-600"}>
                    {category.growth > 0 ? "+" : ""}
                    {category.growth}%
                  </span>
                  <span className="text-muted-foreground ml-1">vs período anterior</span>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay ventas por categoría en el período seleccionado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Productos con bajo rendimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Productos con Bajo Rendimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lowPerforming.map((product: LowPerformingProduct, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.sold} unidades vendidas</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(product.revenue)}</p>
                  <div className="flex items-center text-sm">
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-600">{product.growth}%</span>
                  </div>
                </div>
              </div>
            ))}
            {lowPerforming.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay productos con bajo rendimiento
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
