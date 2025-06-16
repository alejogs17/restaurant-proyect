"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Star } from "lucide-react"
import { ExportDropdown } from "./export-dropdown"

interface ProductsReportProps {
  dateRange: string
  startDate: Date
  endDate: Date
}

export function ProductsReport({ dateRange, startDate, endDate }: ProductsReportProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Datos de ejemplo para productos
  const productsData = {
    topSelling: [
      { name: "Hamburguesa de Res", sold: 245, revenue: 15670200, growth: 15.2 },
      { name: "Pasta Carbonara", sold: 189, revenue: 12844044, growth: 8.7 },
      { name: "Salmón a la Plancha", sold: 156, revenue: 15593760, growth: 12.3 },
      { name: "Alitas de Pollo", sold: 134, revenue: 6962640, growth: -2.1 },
      { name: "Ensalada César", sold: 98, revenue: 4308080, growth: 5.8 },
    ],
    categories: [
      { name: "Plato Principal", revenue: 28450000, percentage: 62.3, growth: 10.5 },
      { name: "Entradas", revenue: 8920000, percentage: 19.5, growth: 7.2 },
      { name: "Bebidas", revenue: 5680000, percentage: 12.4, growth: 15.8 },
      { name: "Postres", revenue: 2630000, percentage: 5.8, growth: -3.2 },
    ],
    lowPerforming: [
      { name: "Té Helado", sold: 12, revenue: 191520, growth: -25.3 },
      { name: "Cheesecake", sold: 18, revenue: 575280, growth: -18.7 },
      { name: "Torta de Chocolate", sold: 23, revenue: 827080, growth: -12.1 },
    ],
  }

  return (
    <div className="space-y-6" id="products-report-content">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reporte de Productos</h2>
        <ExportDropdown
          data={{
            masVendidos: productsData.topSelling,
            categorias: productsData.categories,
            bajoRendimiento: productsData.lowPerforming,
            periodoAnalizado: dateRange,
          }}
          filename="reporte_productos"
          elementId="products-report-content"
          startDate={startDate}
          endDate={endDate}
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
            {productsData.topSelling.map((product, index) => (
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
            {productsData.categories.map((category, index) => (
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
            {productsData.lowPerforming.map((product, index) => (
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
