"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { AlertTriangle, Package, TrendingUp } from "lucide-react"
import { ExportDropdown } from "./export-dropdown"
import { createClient } from "@/lib/supabase/client"

interface InventoryReportProps {
  dateRange: string
  startDate: Date
  endDate: Date
}

interface InventoryStats {
  total_items: number
  low_stock_count: number
  out_of_stock_count: number
  total_value: number
}

interface InventoryItem {
  id: number
  name: string
  description?: string
  unit: string
  quantity: number
  min_quantity: number
  cost_per_unit: number
  updated_at: string
}

interface InventoryMovement {
  id: number
  inventory_item_id: number
  movement_type: "in" | "out"
  quantity: number
  reason: string
  created_at: string
  inventory_items: {
    name: string
    unit: string
  }
}

export function InventoryReport({ dateRange, startDate, endDate }: InventoryReportProps) {
  const [inventoryStats, setInventoryStats] = useState<InventoryStats>({
    total_items: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    total_value: 0,
  })
  const [topValueItems, setTopValueItems] = useState<InventoryItem[]>([])
  const [lowStockAlerts, setLowStockAlerts] = useState<InventoryItem[]>([])
  const [outOfStockItems, setOutOfStockItems] = useState<InventoryItem[]>([])
  const [recentMovements, setRecentMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchInventoryData()
  }, [dateRange, startDate, endDate])

  const fetchInventoryData = async () => {
    setLoading(true)
    try {
      console.log("Fetching inventory data...")
      
      // Obtener estadísticas básicas del inventario
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from("inventory_items")
        .select("*")
      
      if (inventoryError) {
        console.error("Error fetching inventory:", inventoryError)
        throw inventoryError
      }
      
      console.log("Inventory items:", inventoryItems)
      
      // Calcular estadísticas
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

      setInventoryStats({
        total_items: totalItems,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount,
        total_value: totalValue,
      })

      // Obtener items de mayor valor
      const topValue = inventoryItems
        ?.sort((a: any, b: any) => 
          (b.quantity * (b.cost_per_unit || 0)) - (a.quantity * (a.cost_per_unit || 0))
        )
        .slice(0, 5) || []
      
      setTopValueItems(topValue)

      // Obtener alertas de stock bajo
      const lowStock = inventoryItems
        ?.filter((item: any) => 
          item.quantity > 0 && item.quantity <= item.min_quantity
        )
        .sort((a: any, b: any) => a.quantity - b.quantity) || []
      
      setLowStockAlerts(lowStock)

      // Obtener items sin stock
      const outOfStock = inventoryItems
        ?.filter((item: any) => item.quantity <= 0)
        .sort((a: any, b: any) => a.name.localeCompare(b.name)) || []
      
      setOutOfStockItems(outOfStock)

      // Intentar obtener movimientos recientes (opcional)
      try {
        const { data: movements, error: movementsError } = await supabase
          .from("inventory_movements")
          .select("*")
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .order("created_at", { ascending: false })
          .limit(10)
        
        if (movementsError) {
          console.warn("Movements table not available:", movementsError)
          setRecentMovements([])
        } else {
          console.log("Movements data:", movements)
          
          // Si hay movimientos, obtener los nombres de los items por separado
          let movementsWithNames = movements || []
          if (movements && movements.length > 0) {
            const itemIds = [...new Set(movements.map((m: any) => m.inventory_item_id))]
            const { data: items, error: itemsError } = await supabase
              .from("inventory_items")
              .select("id, name, unit")
              .in("id", itemIds)
            
            if (!itemsError && items) {
              const itemsMap = items.reduce((acc: any, item: any) => {
                acc[item.id] = { name: item.name, unit: item.unit }
                return acc
              }, {})
              
              movementsWithNames = movements.map((movement: any) => ({
                ...movement,
                inventory_items: itemsMap[movement.inventory_item_id] || { name: 'Item no encontrado', unit: 'N/A' }
              }))
            }
          }
          
          setRecentMovements(movementsWithNames)
        }
      } catch (movementsError) {
        console.warn("Movements table not available:", movementsError)
        setRecentMovements([])
      }

    } catch (error) {
      console.error("Error fetching inventory data:", error)
      // Establecer valores por defecto en caso de error
      setInventoryStats({
        total_items: 0,
        low_stock_count: 0,
        out_of_stock_count: 0,
        total_value: 0,
      })
      setTopValueItems([])
      setLowStockAlerts([])
      setOutOfStockItems([])
      setRecentMovements([])
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

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) {
      return { status: "out", label: "Sin Stock", color: "bg-red-500" }
    } else if (item.quantity <= item.min_quantity) {
      return { status: "low", label: "Stock Bajo", color: "bg-amber-500" }
    } else {
      return { status: "normal", label: "Normal", color: "bg-green-500" }
    }
  }

  const getUrgencyLevel = (item: InventoryItem) => {
    const percentage = (item.quantity / item.min_quantity) * 100
    if (percentage <= 50) return "high"
    if (percentage <= 75) return "medium"
    return "low"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Reporte de Inventario</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" id="inventory-report-content">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Reporte de Inventario</h2>
        <ExportDropdown
          data={{
            resumen: {
              valorTotal: inventoryStats.total_value,
              totalItems: inventoryStats.total_items,
              stockBajo: inventoryStats.low_stock_count,
              sinStock: inventoryStats.out_of_stock_count,
              periodoAnalizado: dateRange,
            },
            itemsValor: topValueItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              value: item.quantity * item.cost_per_unit,
              status: getStockStatus(item).status
            })),
            alertas: lowStockAlerts.map(item => ({
              name: item.name,
              current: item.quantity,
              minimum: item.min_quantity,
              unit: item.unit,
              urgency: getUrgencyLevel(item)
            })),
            movimientos: recentMovements.map(movement => ({
              item: movement.inventory_items.name,
              type: movement.movement_type,
              quantity: movement.quantity,
              date: movement.created_at,
              reason: movement.reason
            })),
          }}
          filename="reporte_inventario"
          elementId="inventory-report-content"
          startDate={startDate}
          endDate={endDate}
          reportTitle="Reporte de Inventario"
        />
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(inventoryStats.total_value)}</div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+3.1%</span>
              <span className="text-muted-foreground ml-1">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inventoryStats.total_items}</div>
            <div className="flex items-center mt-2 text-sm">
              <Package className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-muted-foreground">Productos activos</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inventoryStats.low_stock_count}</div>
            <div className="flex items-center mt-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-muted-foreground">Requieren atención</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sin Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inventoryStats.out_of_stock_count}</div>
            <div className="flex items-center mt-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-muted-foreground">Urgente reposición</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items de mayor valor */}
      <Card>
        <CardHeader>
          <CardTitle>Items de Mayor Valor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topValueItems.map((item, index) => {
              const status = getStockStatus(item)
              return (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant={status.status === "low" ? "destructive" : "outline"}
                      className={status.status === "low" ? "bg-orange-100 text-orange-800" : ""}
                    >
                      {status.label}
                    </Badge>
                    <span className="font-bold text-lg">{formatCurrency(item.quantity * item.cost_per_unit)}</span>
                  </div>
                </div>
              )
            })}
            {topValueItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay items de inventario registrados
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alertas de stock bajo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-orange-600">Alertas de Stock Bajo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lowStockAlerts.map((item) => {
              const urgency = getUrgencyLevel(item)
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    urgency === "high" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <AlertTriangle
                      className={`h-5 w-5 ${urgency === "high" ? "text-red-500" : "text-orange-500"}`}
                    />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Stock actual: {item.quantity} {item.unit}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={urgency === "high" ? "destructive" : "secondary"}
                      className={urgency === "high" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}
                    >
                      {urgency === "high" ? "Urgente" : "Medio"}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Mínimo: {item.min_quantity} {item.unit}
                    </p>
                  </div>
                </div>
              )
            })}
            {lowStockAlerts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay alertas de stock bajo
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items sin stock */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Items Sin Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {outOfStockItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <div>
                  <p className="font-medium text-red-800">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Última actualización: {new Date(item.updated_at).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="destructive">Sin Stock</Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mínimo: {item.min_quantity} {item.unit}
                  </p>
                </div>
              </div>
            ))}
            {outOfStockItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay items sin stock
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Movimientos recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentMovements.map((movement) => (
              <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${movement.movement_type === "in" ? "bg-green-500" : "bg-red-500"}`} />
                  <div>
                    <p className="font-medium">{movement.inventory_items.name}</p>
                    <p className="text-sm text-muted-foreground">{movement.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${movement.movement_type === "in" ? "text-green-600" : "text-red-600"}`}>
                    {movement.movement_type === "in" ? "+" : "-"}
                    {movement.quantity} {movement.inventory_items.unit}
                  </p>
                  <p className="text-sm text-muted-foreground">{new Date(movement.created_at).toLocaleDateString("es-ES")}</p>
                </div>
              </div>
            ))}
            {recentMovements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay movimientos registrados en el período seleccionado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
