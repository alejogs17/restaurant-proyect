"use client"

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react"
import { Plus, Minus, X } from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Componentes/ui/dialog"
import { Input } from "@/Componentes/ui/input"
import { Label } from "@/Componentes/ui/label"
import { Textarea } from "@/Componentes/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Componentes/ui/select"
import { Card, CardContent } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { useToast } from "@/Componentes/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface Table {
  id: number
  name: string
  status: string
}

interface Product {
  id: number
  name: string
  price: number
  categories: {
    name: string
  }
}

interface OrderItem {
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
}

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateOrderDialog({ open, onOpenChange }: CreateOrderDialogProps) {
  const [orderType, setOrderType] = useState<"dine_in" | "takeout" | "delivery">("dine_in")
  const [tableId, setTableId] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [tables, setTables] = useState<Table[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      fetchTables()
      fetchProducts()
    }
  }, [open])

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from("tables")
        .select("id, name, status")
        .eq("status", "available")

      if (error) {
        console.error("Error fetching tables:", error)
        throw error
      }

      // Ordenar por nombre en el cliente
      const sortedData = data ? data.sort((a: Table, b: Table) => a.name.localeCompare(b.name)) : []
      setTables(sortedData)
    } catch (error: any) {
      console.error("Error in fetchTables:", error)
      toast({
        title: "Error",
        description: `No se pudieron cargar las mesas: ${error.message}`,
        variant: "destructive",
      })
      setTables([])
    }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          price,
          category_id,
          categories(name)
        `)
        .eq("active", true)

      if (error) {
        console.error("Error fetching products:", error)
        throw error
      }

      // Ordenar por nombre en el cliente
      const sortedData = data ? data.sort((a: Product, b: Product) => a.name.localeCompare(b.name)) : []
      setProducts(sortedData)
    } catch (error: any) {
      console.error("Error in fetchProducts:", error)
      toast({
        title: "Error",
        description: `No se pudieron cargar los productos: ${error.message}`,
        variant: "destructive",
      })
      setProducts([])
    }
  }

  const addProductToOrder = (product: Product) => {
    const existingItem = orderItems.find((item) => item.product_id === product.id)

    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total_price: (item.quantity + 1) * item.unit_price,
              }
            : item,
        ),
      )
    } else {
      setOrderItems([
        ...orderItems,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: product.price,
          total_price: product.price,
        },
      ])
    }
  }

  const updateItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems(orderItems.filter((item) => item.product_id !== productId))
    } else {
      setOrderItems(
        orderItems.map((item) =>
          item.product_id === productId
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

  const removeItem = (productId: number) => {
    setOrderItems(orderItems.filter((item) => item.product_id !== productId))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const calculateTotal = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0)
    const tax = subtotal * 0.19 // 19% IVA
    return {
      subtotal,
      tax,
      total: subtotal + tax,
    }
  }

  const generateOrderNumber = () => {
    const now = new Date()
    const timestamp = now.getTime().toString().slice(-6)
    return `ORD-${timestamp}`
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    if (orderItems.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un producto al pedido",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const { subtotal, tax, total } = calculateTotal()
      const orderNumber = generateOrderNumber()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Usuario no autenticado")

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            order_number: orderNumber,
            table_id: orderType === "dine_in" ? Number.parseInt(tableId) : null,
            user_id: user.id,
            status: "pending",
            order_type: orderType,
            customer_name: customerName || null,
            customer_phone: customerPhone || null,
            customer_address: customerAddress || null,
            subtotal,
            tax,
            discount: 0,
            total,
            notes: notes || null,
          },
        ])
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItemsData = orderItems.map((item) => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        notes: item.notes || null,
        status: "pending",
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItemsData)

      if (itemsError) throw itemsError

      // Update table status if dine-in
      if (orderType === "dine_in" && tableId) {
        await supabase.from("tables").update({ status: "occupied" }).eq("id", Number.parseInt(tableId))
      }

      toast({
        title: "Pedido creado",
        description: `El pedido ${orderNumber} ha sido creado correctamente`,
      })

      // Reset form
      setOrderType("dine_in")
      setTableId("")
      setCustomerName("")
      setCustomerPhone("")
      setCustomerAddress("")
      setNotes("")
      setOrderItems([])
      onOpenChange(false)
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo crear el pedido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, tax, total } = calculateTotal()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Pedido</DialogTitle>
          <DialogDescription>Selecciona los productos y completa la información del pedido.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Order Type and Details */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Tipo de Pedido</Label>
                <Select value={orderType} onValueChange={(value: "dine_in" | "takeout" | "delivery") => setOrderType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dine_in">En Mesa</SelectItem>
                    <SelectItem value="takeout">Para Llevar</SelectItem>
                    <SelectItem value="delivery">Domicilio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {orderType === "dine_in" && (
                <div className="grid gap-2">
                  <Label>Mesa</Label>
                  <Select value={tableId} onValueChange={setTableId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una mesa" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map((table) => (
                        <SelectItem key={table.id} value={table.id.toString()}>
                          {table.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(orderType === "takeout" || orderType === "delivery") && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Nombre del Cliente</Label>
                    <Input
                      value={customerName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)}
                      placeholder="Nombre completo"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Teléfono</Label>
                    <Input
                      value={customerPhone}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerPhone(e.target.value)}
                      placeholder="Número de teléfono"
                      required
                    />
                  </div>
                </div>
              )}

              {orderType === "delivery" && (
                <div className="grid gap-2">
                  <Label>Dirección de Entrega</Label>
                  <Textarea
                    value={customerAddress}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCustomerAddress(e.target.value)}
                    placeholder="Dirección completa"
                    required
                  />
                </div>
              )}
            </div>

            {/* Products Selection */}
            <div className="grid gap-4">
              <Label>Productos Disponibles</Label>
              <div className="grid gap-2 max-h-40 overflow-y-auto">
                {products.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => addProductToOrder(product)}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {product.categories.name}
                          </Badge>
                        </div>
                        <p className="font-semibold">{formatCurrency(product.price)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Order Items */}
            {orderItems.length > 0 && (
              <div className="grid gap-4">
                <Label>Productos en el Pedido</Label>
                <div className="grid gap-2">
                  {orderItems.map((item) => (
                    <Card key={item.product_id}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(item.unit_price)} x {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(item.product_id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="font-semibold w-20 text-right">
                            {formatCurrency(item.total_price)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="grid gap-2">
              <Label>Notas Adicionales</Label>
              <Textarea
                value={notes}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                placeholder="Instrucciones especiales, alergias, etc."
                rows={3}
              />
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Resumen del Pedido</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA (19%):</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || orderItems.length === 0}>
              {loading ? "Creando..." : "Crear Pedido"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
