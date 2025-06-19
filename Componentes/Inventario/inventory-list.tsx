"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Package, AlertTriangle, Edit, Trash2, Plus, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { createClient } from "@/lib/supabase/client"

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
  const [items, setItems] = useState<InventoryItem[]>([])

  useEffect(() => {
    const fetchInventory = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
      if (error) {
        console.error("Error al obtener inventario:", error)
      } else {
        setItems(data)
      }
    }

    fetchInventory()
  }, [])

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