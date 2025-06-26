"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Package, AlertTriangle, Edit, Trash2, Plus, Minus, Pencil } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { createClient } from "@/lib/supabase/client"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu"
import { Button } from "../ui/button"
import { Skeleton } from "../ui/skeleton"

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

interface InventoryListProps {
  searchTerm: string
}

export function InventoryList({ searchTerm }: InventoryListProps) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null)
  const [editForm, setEditForm] = useState<Partial<InventoryItem>>({})

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase.from("inventory_items").select("*")
      
      if (error) {
        alert("Error fetching inventory: " + error.message)
      } else {
        setItems(data || [])
      }
      setLoading(false)
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
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                      <Badge className={`${stockStatus.color} text-white`}>
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
                          setItemToEdit(item)
                          setEditForm({
                            name: item.name,
                            description: item.description || '',
                            unit: item.unit,
                            quantity: item.quantity,
                            min_quantity: item.min_quantity,
                            cost_per_unit: item.cost_per_unit
                          })
                          setShowEditDialog(true)
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => {
                          setItemToDelete(item)
                          setShowDeleteDialog(true)
                        }}
                      >
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
                      <p className="text-muted-foreground">Costo por {item.unit}</p>
                      <p className="font-medium text-orange-600">{formatCurrency(item.cost_per_unit)}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Actualizado: {new Date(item.updated_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Ítem</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!itemToEdit) return
              
              const supabase = createClient()
              const { data, error } = await supabase
                .from('inventory_items')
                .update({ ...editForm, updated_at: new Date().toISOString() })
                .eq('id', itemToEdit.id)
                .select()

              if (error) {
                alert("Error actualizando ítem: " + error.message)
              } else {
                setItems(items.map(i => i.id === itemToEdit.id ? data![0] : i))
                setShowEditDialog(false)
              }
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nombre</Label>
                <Input id="name" value={editForm.name || ''} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Descripción</Label>
                <Input id="description" value={editForm.description || ''} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">Unidad</Label>
                <Input id="unit" value={editForm.unit || ''} onChange={(e) => setEditForm({...editForm, unit: e.target.value})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Cantidad</Label>
                <Input id="quantity" type="number" value={editForm.quantity || ''} onChange={(e) => setEditForm({...editForm, quantity: parseFloat(e.target.value)})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="min_quantity" className="text-right">Cant. Mínima</Label>
                <Input id="min_quantity" type="number" value={editForm.min_quantity || ''} onChange={(e) => setEditForm({...editForm, min_quantity: parseFloat(e.target.value)})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cost_per_unit" className="text-right">Costo/Unidad</Label>
                <Input id="cost_per_unit" type="number" value={editForm.cost_per_unit || ''} onChange={(e) => setEditForm({...editForm, cost_per_unit: parseFloat(e.target.value)})} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar producto?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {itemToDelete && (
              <p>¿Estás seguro de que deseas eliminar <strong>{itemToDelete.name}</strong> del inventario?</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!itemToDelete) return
                const supabase = createClient()
                const { error } = await supabase
                  .from("inventory_items")
                  .delete()
                  .eq("id", itemToDelete.id)
                if (error) {
                  alert("Error al eliminar: " + error.message)
                } else {
                  setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id))
                  setShowDeleteDialog(false)
                  setItemToDelete(null)
                }
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
