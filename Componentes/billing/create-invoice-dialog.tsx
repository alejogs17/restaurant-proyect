"use client"

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react"
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
import { useToast } from "@/Componentes/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface Order {
  id: number
  order_number: string
  customer_name?: string
  subtotal: number
  tax: number
  discount: number
  total: number
  status: string
  created_at?: string
}

interface CreateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateInvoiceDialog({ open, onOpenChange }: CreateInvoiceDialogProps) {
  const [orderId, setOrderId] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      fetchOrders()
      // Set default due date to 30 days from now
      const defaultDueDate = new Date()
      defaultDueDate.setDate(defaultDueDate.getDate() + 30)
      setDueDate(defaultDueDate.toISOString().split("T")[0])
    }
  }, [open])

  // Suscripción en tiempo real para actualizar la lista cuando se creen facturas
  useEffect(() => {
    if (!open) return

    const channel = supabase
      .channel('invoice-creation-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'invoices' },
        (payload: any) => {
          console.log('Nueva factura creada:', payload)
          // Actualizar la lista de pedidos cuando se crea una nueva factura
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [open, supabase])

  const fetchOrders = async () => {
    try {
      // Primero obtener todas las órdenes completadas o entregadas
      const { data: allOrders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id, order_number, customer_name, subtotal, tax, discount, total, status, created_at
        `)
        .or('status.eq.completed,status.eq.delivered')
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error("Error fetching orders:", ordersError)
        throw ordersError
      }

      // Luego obtener todas las facturas para filtrar
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select('order_id')

      if (invoicesError) {
        console.error("Error fetching invoices:", invoicesError)
        throw invoicesError
      }

      // Crear un set de order_ids que ya tienen facturas
      const invoicedOrderIds = new Set(invoices?.map((inv: { order_id: number }) => inv.order_id) || [])

      // Filtrar las órdenes que no tienen facturas
      const availableOrders = allOrders?.filter((order: Order) => !invoicedOrderIds.has(order.id)) || []
      
      setOrders(availableOrders)
      
      // Mostrar alert si no hay órdenes disponibles
      if (availableOrders.length === 0) {
        alert("No hay órdenes por facturar")
      }
    } catch (error: any) {
      console.error("Error in fetchOrders:", error)
      toast({
        title: "Error",
        description: `No se pudieron cargar los pedidos: ${error.message}`,
        variant: "destructive",
      })
      setOrders([])
    }
  }

  const handleOrderSelect = (orderIdStr: string) => {
    setOrderId(orderIdStr)
    const order = orders.find((o: Order) => o.id.toString() === orderIdStr)
    if (order) {
      setSelectedOrder(order)
      if (order.customer_name) {
        setCustomerName(order.customer_name)
      }
    }
  }

  const generateInvoiceNumber = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, "0")
    const timestamp = now.getTime().toString().slice(-6)
    return `FAC-${year}${month}-${timestamp}`
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    if (!selectedOrder) {
      toast({
        title: "Error",
        description: "Debe seleccionar un pedido",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const invoiceNumber = generateInvoiceNumber()

      const { error } = await supabase.from("invoices").insert([
        {
          invoice_number: invoiceNumber,
          order_id: selectedOrder.id,
          customer_name: customerName || null,
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          customer_address: customerAddress || null,
          subtotal: selectedOrder.subtotal,
          tax: selectedOrder.tax,
          discount: selectedOrder.discount,
          total: selectedOrder.total,
          status: "draft",
          due_date: dueDate,
        },
      ])

      if (error) throw error

      toast({
        title: "Factura creada",
        description: `La factura ${invoiceNumber} ha sido creada correctamente`,
      })

      // Reset form
      setOrderId("")
      setCustomerName("")
      setCustomerEmail("")
      setCustomerPhone("")
      setCustomerAddress("")
      setSelectedOrder(null)
      
      // Cerrar el diálogo
      onOpenChange(false)
      
      // Recargar la página para mostrar la nueva factura
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo crear la factura",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Crear Nueva Factura</DialogTitle>
          <DialogDescription>
            Selecciona un pedido y completa los datos del cliente.
          </DialogDescription>
        </DialogHeader>
  
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[70vh] pr-1">
          <div className="grid gap-3 text-sm">
            {/* Selector del pedido */}
            <div className="grid gap-1.5">
              <Label>Pedido</Label>
              <Select value={orderId} onValueChange={handleOrderSelect} required disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Actualizando..." : "Selecciona un pedido"} />
                </SelectTrigger>
                <SelectContent>
                  {orders.length > 0 ? (
                    orders.map((order: Order) => (
                      <SelectItem key={order.id} value={order.id.toString()}>
                        {order.order_number} - {formatCurrency(order.total)}
                        {order.customer_name && ` - ${order.customer_name}`}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {loading ? "Cargando pedidos..." : "No hay pedidos disponibles para facturar"}
                    </div>
                  )}
                </SelectContent>
              </Select>
              {orders.length === 0 && !loading && (
                <p className="text-xs text-muted-foreground">
                  Solo se muestran pedidos completados o entregados que no tienen factura.
                </p>
              )}
            </div>
  
            {/* Resumen del pedido */}
            {selectedOrder && (
              <div className="bg-gray-100 p-2 rounded-md text-sm space-y-1">
                <h4 className="font-medium">Resumen</h4>
                {[
                  ["Subtotal", selectedOrder.subtotal],
                  ["IVA", selectedOrder.tax],
                  ...(selectedOrder.discount > 0 ? [["Descuento", -selectedOrder.discount]] : []),
                  ["Total", selectedOrder.total],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    className={`flex justify-between ${
                      label === "Total" ? "font-bold border-t pt-1" : ""
                    } ${label === "Descuento" ? "text-green-600" : ""}`}
                  >
                    <span>{label}:</span>
                    <span>{formatCurrency(val as number)}</span>
                  </div>
                ))}
              </div>
            )}
  
            {/* Datos del cliente */}
            <div className="grid gap-1.5">
              <Label>Nombre del Cliente</Label>
              <Input
                placeholder="Nombre completo"
                value={customerName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)}
                required
              />
            </div>
  
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="cliente@email.com"
                  value={customerEmail}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Teléfono</Label>
                <Input
                  placeholder="300 123 4567"
                  value={customerPhone}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
  
            <div className="grid gap-1.5">
              <Label>Dirección</Label>
              <Textarea
                placeholder="Dirección del cliente"
                value={customerAddress}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCustomerAddress(e.target.value)}
                rows={2}
              />
            </div>
  
            <div className="grid gap-1.5">
              <Label>Fecha de Vencimiento</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>
  
          {/* Footer fijo */}
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || orders.length === 0 || !selectedOrder} 
              className="bg-orange-500 hover:bg-orange-600"
            >
              {loading ? "Creando..." : "Crear Factura"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
