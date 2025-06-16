"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Minus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface Supplier {
  id: number
  name: string
}

interface InventoryItem {
  id: number
  name: string
  unit: string
  cost_per_unit: number
}

interface PurchaseItem {
  inventory_item_id: number
  item_name: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
}

interface CreatePurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreatePurchaseDialog({ open, onOpenChange }: CreatePurchaseDialogProps) {
  const [supplierId, setSupplierId] = useState("")
  const [purchaseDate, setPurchaseDate] = useState("")
  const [notes, setNotes] = useState("")
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      fetchSuppliers()
      fetchInventoryItems()
      // Set default date to today
      setPurchaseDate(new Date().toISOString().split("T")[0])
    }
  }, [open])

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase.from("suppliers").select("id, name").order("name")

      if (error) throw error

      setSuppliers(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los proveedores",
        variant: "destructive",
      })
    }
  }

  const fetchInventoryItems = async () => {
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, unit, cost_per_unit")
        .order("name")

      if (error) throw error

      setInventoryItems(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los insumos",
        variant: "destructive",
      })
    }
  }

  const addItemToPurchase = (item: InventoryItem) => {
    const existingItem = purchaseItems.find((purchaseItem) => purchaseItem.inventory_item_id === item.id)

    if (existingItem) {
      setPurchaseItems(
        purchaseItems.map((purchaseItem) =>
          purchaseItem.inventory_item_id === item.id
            ? {
                ...purchaseItem,
                quantity: purchaseItem.quantity + 1,
                total_price: (purchaseItem.quantity + 1) * purchaseItem.unit_price,
              }
            : purchaseItem,
        ),
      )
    } else {
      setPurchaseItems([
        ...purchaseItems,
        {
          inventory_item_id: item.id,
          item_name: item.name,
          unit: item.unit,
          quantity: 1,
          unit_price: item.cost_per_unit,
          total_price: item.cost_per_unit,
        },
      ])
    }
  }

  const updateItemQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setPurchaseItems(purchaseItems.filter((item) => item.inventory_item_id !== itemId))
    } else {
      setPurchaseItems(
        purchaseItems.map((item) =>
          item.inventory_item_id === itemId
            ? {
                ...item,
                quantity: newQuantity,
                total_price: newQuantity * item.unit_price,
              }
            : item,
        ),
      )
    }
  }

  const updateItemPrice = (itemId: number, newPrice: number) => {
    setPurchaseItems(
      purchaseItems.map((item) =>
        item.inventory_item_id === itemId
          ? {
              ...item,
              unit_price: newPrice,
              total_price: item.quantity * newPrice,
            }
          : item,
      ),
    )
  }

  const removeItem = (itemId: number) => {
    setPurchaseItems(purchaseItems.filter((item) => item.inventory_item_id !== itemId))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const calculateTotal = () => {
    return purchaseItems.reduce((sum, item) => sum + item.total_price, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (purchaseItems.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un producto a la compra",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Usuario no autenticado")

      const totalAmount = calculateTotal()

      // Create purchase
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchases")
        .insert([
          {
            supplier_id: Number.parseInt(supplierId),
            user_id: user.id,
            purchase_date: purchaseDate,
            total_amount: totalAmount,
            notes: notes || null,
          },
        ])
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // Create purchase items
      const purchaseItemsData = purchaseItems.map((item) => ({
        purchase_id: purchaseData.id,
        inventory_item_id: item.inventory_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }))

      const { error: itemsError } = await supabase.from("purchase_items").insert(purchaseItemsData)

      if (itemsError) throw itemsError

      // Update inventory quantities
      for (const item of purchaseItems) {
        const { error: inventoryError } = await supabase.rpc("update_inventory_quantity", {
          item_id: item.inventory_item_id,
          quantity_change: item.quantity,
        })

        if (inventoryError) {
          console.error("Error updating inventory:", inventoryError)
          // Continue with other items even if one fails
        }
      }

      toast({
        title: "Compra creada",
        description: `La compra ha sido registrada correctamente`,
      })

      // Reset form
      setSupplierId("")
      setPurchaseDate("")
      setNotes("")
      setPurchaseItems([])
      onOpenChange(false)
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo crear la compra",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const total = calculateTotal()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Compra</DialogTitle>
          <DialogDescription>Registra una nueva compra de insumos para el restaurante.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Purchase Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Proveedor</Label>
                <Select value={supplierId} onValueChange={setSupplierId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Fecha de Compra</Label>
                <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
              </div>
            </div>

            {/* Inventory Items Selection */}
            <div className="grid gap-4">
              <Label>Insumos Disponibles</Label>
              <div className="grid gap-2 max-h-40 overflow-y-auto">
                {inventoryItems.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => addItemToPurchase(item)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Unidad: {item.unit}</p>
                        </div>
                        <p className="font-bold text-orange-600">{formatCurrency(item.cost_per_unit)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Purchase Items */}
            {purchaseItems.length > 0 && (
              <div className="grid gap-4">
                <Label>Productos en la Compra</Label>
                <div className="space-y-2">
                  {purchaseItems.map((item) => (
                    <Card key={item.inventory_item_id}>
                      <CardContent className="p-3">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-4">
                            <p className="font-medium">{item.item_name}</p>
                            <p className="text-sm text-muted-foreground">{item.unit}</p>
                          </div>
                          <div className="col-span-2">
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateItemQuantity(item.inventory_item_id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItemQuantity(item.inventory_item_id, Number.parseFloat(e.target.value) || 0)
                                }
                                className="w-16 text-center"
                                min="0"
                                step="0.01"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateItemQuantity(item.inventory_item_id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) =>
                                updateItemPrice(item.inventory_item_id, Number.parseFloat(e.target.value) || 0)
                              }
                              placeholder="Precio"
                              min="0"
                              step="1"
                            />
                          </div>
                          <div className="col-span-3 text-right">
                            <p className="font-bold">{formatCurrency(item.total_price)}</p>
                          </div>
                          <div className="col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.inventory_item_id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            {purchaseItems.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total de la Compra:</span>
                  <span className="text-orange-600">{formatCurrency(total)}</span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="grid gap-2">
              <Label>Notas</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones sobre la compra..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || purchaseItems.length === 0}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {loading ? "Creando..." : "Crear Compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
