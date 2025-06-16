"use client"

import { useState } from "react"
import { MoreHorizontal, Package, AlertTriangle, Edit, Trash2, Plus, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface InventoryItem {
  id: number
  name: string
  description?: string
  unit: string
  quantity: number
  min_quantity: number
  cost_per_unit: number
  category: string
  supplier: string
  last_updated: string
}

interface InventoryListProps {
  searchTerm: string
}

export function InventoryList({ searchTerm }: InventoryListProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showAdjustDialog, setShowAdjustDialog] = useState(false)
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("")
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add")
  const [adjustmentReason, setAdjustmentReason] = useState("")

  // Datos de ejemplo para inventario
  const items: InventoryItem[] = [
    {
      id: 1,
      name: "Arroz Blanco",
      description: "Arroz blanco de primera calidad",
      unit: "kg",
      quantity: 45,
      min_quantity: 10,
      cost_per_unit: 3500,
      category: "Granos",
      supplier: "Distribuidora Central",
      last_updated: "2024-01-15",
    },
    {
      id: 2,
      name: "Aceite de Girasol",
      description: "Aceite vegetal para cocinar",
      unit: "l",
      quantity: 8,
      min_quantity: 5,
      cost_per_unit: 8500,
      category: "Aceites",
      supplier: "Distribuidora Central",
      last_updated: "2024-01-14",
    },
    {
      id: 3,
      name: "Pollo Entero",
      description: "Pollo fresco de granja",
      unit: "kg",
      quantity: 25,
      min_quantity: 8,
      cost_per_unit: 12000,
      category: "Carnes",
      supplier: "Carnes Premium",
      last_updated: "2024-01-14",
    },
    {
      id: 4,
      name: "Carne de Res",
      description: "Carne de res para hamburguesas",
      unit: "kg",
      quantity: 3,
      min_quantity: 5,
      cost_per_unit: 18000,
      category: "Carnes",
      supplier: "Carnes Premium",
      last_updated: "2024-01-13",
    },
    {
      id: 5,
      name: "Tomate",
      description: "Tomate fresco para ensaladas",
      unit: "kg",
      quantity: 0,
      min_quantity: 5,
      cost_per_unit: 4500,
      category: "Verduras",
      supplier: "Frutas del Campo",
      last_updated: "2024-01-12",
    },
    {
      id: 6,
      name: "Lechuga",
      description: "Lechuga fresca",
      unit: "unidad",
      quantity: 35,
      min_quantity: 10,
      cost_per_unit: 2500,
      category: "Verduras",
      supplier: "Frutas del Campo",
      last_updated: "2024-01-13",
    },
    {
      id: 7,
      name: "Pan para Hamburguesa",
      description: "Pan artesanal para hamburguesas",
      unit: "unidad",
      quantity: 180,
      min_quantity: 20,
      cost_per_unit: 1500,
      category: "Panadería",
      supplier: "Panadería Artesanal",
      last_updated: "2024-01-15",
    },
    {
      id: 8,
      name: "Queso Mozzarella",
      description: "Queso mozzarella para pizzas",
      unit: "kg",
      quantity: 2,
      min_quantity: 3,
      cost_per_unit: 15000,
      category: "Lácteos",
      supplier: "Lácteos La Pradera",
      last_updated: "2024-01-11",
    },
    {
      id: 9,
      name: "Cerveza Nacional",
      description: "Cerveza nacional en botella",
      unit: "botella",
      quantity: 95,
      min_quantity: 24,
      cost_per_unit: 3200,
      category: "Bebidas",
      supplier: "Bebidas El Dorado",
      last_updated: "2024-01-11",
    },
    {
      id: 10,
      name: "Gaseosa Cola",
      description: "Gaseosa cola 350ml",
      unit: "lata",
      quantity: 0,
      min_quantity: 20,
      cost_per_unit: 2800,
      category: "Bebidas",
      supplier: "Bebidas El Dorado",
      last_updated: "2024-01-10",
    },
    {
      id: 11,
      name: "Aguacate",
      description: "Aguacate fresco",
      unit: "kg",
      quantity: 15,
      min_quantity: 8,
      cost_per_unit: 12000,
      category: "Verduras",
      supplier: "Frutas del Campo",
      last_updated: "2024-01-13",
    },
    {
      id: 12,
      name: "Cebolla Blanca",
      description: "Cebolla blanca fresca",
      unit: "kg",
      quantity: 4,
      min_quantity: 6,
      cost_per_unit: 3200,
      category: "Verduras",
      supplier: "Frutas del Campo",
      last_updated: "2024-01-12",
    },
  ]

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) {
      return { status: "out", label: "Sin Stock", color: "bg-red-500" }
    } else if (item.quantity <= item.min_quantity) {
      return { status: "low", label: "Stock Bajo", color: "bg-amber-500" }
    } else {
      return { status: "good", label: "Stock Normal", color: "bg-green-500" }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => {
          const stockStatus = getStockStatus(item)
          return (
            <Card key={item.id} className="transition-all hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {item.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${stockStatus.color} hover:${stockStatus.color} text-white`}>
                        {stockStatus.label}
                      </Badge>
                      {stockStatus.status === "low" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      {stockStatus.status === "out" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedItem(item)
                          setAdjustmentType("add")
                          setShowAdjustDialog(true)
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Stock
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedItem(item)
                          setAdjustmentType("subtract")
                          setShowAdjustDialog(true)
                        }}
                      >
                        <Minus className="mr-2 h-4 w-4" />
                        Reducir Stock
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 focus:text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Stock Actual</p>
                      <p className="font-medium">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Stock Mínimo</p>
                      <p className="font-medium">
                        {item.min_quantity} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Categoría</p>
                      <p className="font-medium">{item.category}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Costo por {item.unit}</p>
                      <p className="font-medium text-orange-600">{formatCurrency(item.cost_per_unit)}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Proveedor: {item.supplier}</p>
                    <p className="text-xs text-muted-foreground">
                      Actualizado: {new Date(item.last_updated).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {adjustmentType === "add" ? "Agregar" : "Reducir"} Stock - {selectedItem.name}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>
                    Stock Actual: {selectedItem.quantity} {selectedItem.unit}
                  </Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Cantidad a {adjustmentType === "add" ? "agregar" : "reducir"}</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reason">Motivo del ajuste</Label>
                  <Input
                    id="reason"
                    placeholder="Compra, merma, corrección, etc."
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    // Aquí iría la lógica para actualizar el stock
                    setShowAdjustDialog(false)
                    setAdjustmentQuantity("")
                    setAdjustmentReason("")
                  }}
                  className={
                    adjustmentType === "add" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                  }
                >
                  {adjustmentType === "add" ? "Agregar" : "Reducir"} Stock
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
