"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { AlertTriangle, Package, TrendingUp } from "lucide-react"
import { ExportDropdown } from "./export-dropdown"

interface InventoryReportProps {
  dateRange: string
  startDate: Date
  endDate: Date
}

export function InventoryReport({ dateRange, startDate, endDate }: InventoryReportProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Datos de ejemplo para inventario
  const inventoryData = {
    totalValue: 15420000,
    totalItems: 45,
    lowStockItems: 8,
    outOfStockItems: 2,
    topValueItems: [
      { name: "Carne de Res", quantity: 15, unit: "kg", value: 270000, status: "normal" },
      { name: "Queso Mozzarella", quantity: 8, unit: "kg", value: 120000, status: "low" },
      { name: "Salmón Fresco", quantity: 12, unit: "kg", value: 180000, status: "normal" },
      { name: "Aceite de Oliva", quantity: 20, unit: "l", value: 170000, status: "normal" },
      { name: "Pollo Entero", quantity: 30, unit: "kg", value: 360000, status: "normal" },
    ],
    lowStockAlerts: [
      { name: "Queso Mozzarella", current: 8, minimum: 15, unit: "kg", urgency: "high" },
      { name: "Pan para Hamburguesa", current: 25, minimum: 50, unit: "unidad", urgency: "medium" },
      { name: "Cerveza Nacional", current: 30, minimum: 48, unit: "botella", urgency: "medium" },
      { name: "Aceite de Girasol", current: 5, minimum: 10, unit: "l", urgency: "high" },
    ],
    outOfStock: [
      { name: "Vino Tinto", lastStock: "2024-01-10", supplier: "Licores Premium" },
      { name: "Helado de Vainilla", lastStock: "2024-01-12", supplier: "Lácteos La Pradera" },
    ],
    movements: [
      { item: "Arroz Blanco", type: "in", quantity: 25, date: "2024-01-15", reason: "Compra" },
      { item: "Tomate", type: "out", quantity: 8, date: "2024-01-15", reason: "Uso cocina" },
      { item: "Lechuga", type: "in", quantity: 15, date: "2024-01-14", reason: "Compra" },
      { item: "Carne de Res", type: "out", quantity: 5, date: "2024-01-14", reason: "Uso cocina" },
      { item: "Cerveza Nacional", type: "out", quantity: 24, date: "2024-01-13", reason: "Ventas" },
    ],
  }

  return (
    <div className="space-y-6" id="inventory-report-content">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Reporte de Inventario</h2>
        <ExportDropdown
          data={{
            resumen: {
              valorTotal: inventoryData.totalValue,
              totalItems: inventoryData.totalItems,
              stockBajo: inventoryData.lowStockItems,
              sinStock: inventoryData.outOfStockItems,
              periodoAnalizado: dateRange,
            },
            itemsValor: inventoryData.topValueItems,
            alertas: inventoryData.lowStockAlerts,
            movimientos: inventoryData.movements,
          }}
          filename="reporte_inventario"
          elementId="inventory-report-content"
          startDate={startDate}
          endDate={endDate}
        />
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(inventoryData.totalValue)}</div>
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
            <div className="text-2xl font-bold text-blue-600">{inventoryData.totalItems}</div>
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
            <div className="text-2xl font-bold text-orange-600">{inventoryData.lowStockItems}</div>
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
            <div className="text-2xl font-bold text-red-600">{inventoryData.outOfStockItems}</div>
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
            {inventoryData.topValueItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                    variant={item.status === "low" ? "destructive" : "outline"}
                    className={item.status === "low" ? "bg-orange-100 text-orange-800" : ""}
                  >
                    {item.status === "low" ? "Stock Bajo" : "Normal"}
                  </Badge>
                  <span className="font-bold text-lg">{formatCurrency(item.value)}</span>
                </div>
              </div>
            ))}
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
            {inventoryData.lowStockAlerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  alert.urgency === "high" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <AlertTriangle
                    className={`h-5 w-5 ${alert.urgency === "high" ? "text-red-500" : "text-orange-500"}`}
                  />
                  <div>
                    <p className="font-medium">{alert.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock actual: {alert.current} {alert.unit}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={alert.urgency === "high" ? "destructive" : "secondary"}
                    className={alert.urgency === "high" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"}
                  >
                    {alert.urgency === "high" ? "Urgente" : "Medio"}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mínimo: {alert.minimum} {alert.unit}
                  </p>
                </div>
              </div>
            ))}
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
            {inventoryData.outOfStock.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <div>
                  <p className="font-medium text-red-800">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Último stock: {new Date(item.lastStock).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="destructive">Sin Stock</Badge>
                  <p className="text-sm text-muted-foreground mt-1">{item.supplier}</p>
                </div>
              </div>
            ))}
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
            {inventoryData.movements.map((movement, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${movement.type === "in" ? "bg-green-500" : "bg-red-500"}`} />
                  <div>
                    <p className="font-medium">{movement.item}</p>
                    <p className="text-sm text-muted-foreground">{movement.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${movement.type === "in" ? "text-green-600" : "text-red-600"}`}>
                    {movement.type === "in" ? "+" : "-"}
                    {movement.quantity}
                  </p>
                  <p className="text-sm text-muted-foreground">{new Date(movement.date).toLocaleDateString("es-ES")}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
