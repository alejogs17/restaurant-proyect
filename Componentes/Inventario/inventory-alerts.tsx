"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Package, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { Button } from "@/Componentes/ui/button"
import { useToast } from "@/Componentes/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface InventoryItem {
  id: number
  name: string
  description?: string
  unit: string
  quantity: number
  min_quantity: number
  cost_per_unit: number
}

export function InventoryAlerts() {
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([])
  const [outOfStockItems, setOutOfStockItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      // Get items with low stock (quantity <= min_quantity but > 0)
      const { data: lowStock, error: lowStockError } = await supabase
        .from("inventory_items")
        .select("*")
        .lte("quantity", supabase.rpc("min_quantity"))
        .gt("quantity", 0)

      if (lowStockError) throw lowStockError

      // Get items out of stock (quantity = 0)
      const { data: outOfStock, error: outOfStockError } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("quantity", 0)

      if (outOfStockError) throw outOfStockError

      setLowStockItems(lowStock || [])
      setOutOfStockItems(outOfStock || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las alertas de inventario",
        variant: "destructive",
      })
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
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Sin Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{outOfStockItems.length}</div>
            <p className="text-sm text-red-600">Insumos agotados</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
              <Package className="h-5 w-5" />
              Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{lowStockItems.length}</div>
            <p className="text-sm text-amber-600">Insumos con stock bajo</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
              <ShoppingCart className="h-5 w-5" />
              Acción Requerida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{outOfStockItems.length + lowStockItems.length}</div>
            <p className="text-sm text-orange-600">Total de alertas</p>
          </CardContent>
        </Card>
      </div>

      {/* Out of Stock Items */}
      {outOfStockItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Insumos Sin Stock
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {outOfStockItems.map((item) => (
              <Card key={item.id} className="border-red-200 bg-red-50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <Badge className="bg-red-500 hover:bg-red-500 text-white mt-1">Sin Stock</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Stock Actual</p>
                        <p className="font-medium text-red-600">0 {item.unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Stock Mínimo</p>
                        <p className="font-medium">
                          {item.min_quantity} {item.unit}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Costo por {item.unit}</p>
                        <p className="font-medium text-orange-600">{formatCurrency(item.cost_per_unit)}</p>
                      </div>
                    </div>
                    <Button className="w-full bg-red-500 hover:bg-red-600" size="sm">
                      <ShoppingCart className="mr-2 h-3 w-3" />
                      Comprar Urgente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock Items */}
      {lowStockItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-amber-600 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Insumos con Stock Bajo
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lowStockItems.map((item) => (
              <Card key={item.id} className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <Badge className="bg-amber-500 hover:bg-amber-500 text-white mt-1">Stock Bajo</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Stock Actual</p>
                        <p className="font-medium text-amber-600">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Stock Mínimo</p>
                        <p className="font-medium">
                          {item.min_quantity} {item.unit}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Costo por {item.unit}</p>
                        <p className="font-medium text-orange-600">{formatCurrency(item.cost_per_unit)}</p>
                      </div>
                    </div>
                    <Button className="w-full bg-amber-500 hover:bg-amber-600" size="sm">
                      <ShoppingCart className="mr-2 h-3 w-3" />
                      Programar Compra
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Alerts */}
      {outOfStockItems.length === 0 && lowStockItems.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">¡Todo en orden!</h3>
            <p className="text-green-600">No hay alertas de inventario en este momento.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
