"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp } from "lucide-react"

export function TopSellingItems() {
  const items = [
    {
      name: "Hamburguesa de Res",
      sales: 45,
      revenue: 2878200,
      percentage: 100,
      category: "Plato Principal",
    },
    {
      name: "Papas Fritas",
      sales: 38,
      revenue: 910480,
      percentage: 84,
      category: "Acompañamiento",
    },
    {
      name: "Salmón a la Plancha",
      sales: 28,
      revenue: 2798880,
      percentage: 62,
      category: "Plato Principal",
    },
    {
      name: "Alitas de Pollo",
      sales: 25,
      revenue: 1299000,
      percentage: 56,
      category: "Entrada",
    },
    {
      name: "Pasta Carbonara",
      sales: 22,
      revenue: 1495120,
      percentage: 49,
      category: "Plato Principal",
    },
  ]

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
          {items.map((item, index) => (
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
