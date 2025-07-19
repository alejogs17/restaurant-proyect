"use client"

import React, { useRef, useState, useEffect } from "react"
import { MoreHorizontal, Clock, User, MapPin, Phone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { Button } from "@/Componentes/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Componentes/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Componentes/ui/dialog"
import { useToast } from "@/Componentes/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { PaymentDialog } from "@/Componentes/Ordenes/payment-dialog"

type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "completed" | "cancelled"
type OrderType = "dine_in" | "takeout" | "delivery"

interface Order {
  id: number
  order_number: string
  table_id?: number
  user_id: string
  status: OrderStatus
  order_type: OrderType
  customer_name?: string
  customer_phone?: string
  customer_address?: string
  subtotal: number
  tax: number
  discount: number
  total: number
  notes?: string
  created_at: string
  updated_at: string
  tables?: {
    name: string
  }
  profiles?: {
    first_name: string
    last_name: string
  }
  order_items?: Array<{
    id: number
    quantity: number
    unit_price: number
    total_price: number
    notes?: string
    status: OrderStatus
    products: {
      name: string
    }
  }>
}

interface OrderListProps {
  searchTerm: string
  statusFilter: string
  tabFilter: string
}

export function OrderList({ searchTerm, statusFilter, tabFilter }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [orderForPayment, setOrderForPayment] = useState<{ id: number; order_number: string; total: number } | null>(null)
  const { toast } = useToast()
  const supabase = createClient()
  const printSectionRef = useRef<HTMLDivElement>(null)
  const [paymentMethodForPrint, setPaymentMethodForPrint] = useState<string>("")

  useEffect(() => {
    fetchOrders()

    // Auto refresh cada 10 segundos
    const interval = setInterval(() => {
      fetchOrders()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          table_id,
          user_id,
          status,
          order_type,
          customer_name,
          customer_phone,
          customer_address,
          subtotal,
          tax,
          discount,
          total,
          notes,
          created_at,
          updated_at,
          tables(name),
          order_items(
            id,
            quantity,
            unit_price,
            total_price,
            notes,
            status,
            product_id,
            products (
              name
            )
          )
        `)

      if (error) {
        console.error("Error fetching orders:", error)
        throw error
      }

      // Ordenar los datos en el cliente por fecha de creación (más reciente primero)
      const sortedData = data ? data.sort((a: Order, b: Order) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ) : []
      setOrders(sortedData)
    } catch (error: any) {
      console.error("Error in fetchOrders:", error)
      toast({
        title: "Error",
        description: `No se pudieron cargar los pedidos: ${error.message}`,
        variant: "destructive",
      })
      setOrders([]) // Establecer array vacío en caso de error
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId)

      if (error) throw error

      setOrders(orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))

      toast({
        title: "Estado actualizado",
        description: `El pedido ha sido marcado como ${getStatusLabel(newStatus)}`,
      })

      // Cerrar el menú de detalles si está abierto
      setShowDetailsDialog(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-amber-500"
      case "preparing":
        return "bg-blue-500"
      case "ready":
        return "bg-green-500"
      case "delivered":
        return "bg-purple-500"
      case "completed":
        return "bg-gray-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "preparing":
        return "En Preparación"
      case "ready":
        return "Listo"
      case "delivered":
        return "Entregado"
      case "completed":
        return "Completado"
      case "cancelled":
        return "Cancelado"
      default:
        return "Desconocido"
    }
  }

  const getOrderTypeLabel = (type: OrderType) => {
    switch (type) {
      case "dine_in":
        return "En Mesa"
      case "takeout":
        return "Para Llevar"
      case "delivery":
        return "Domicilio"
      default:
        return "Desconocido"
    }
  }

  const getOrderTypeIcon = (type: OrderType) => {
    switch (type) {
      case "dine_in":
        return <User className="h-4 w-4" />
      case "takeout":
        return <Clock className="h-4 w-4" />
      case "delivery":
        return <MapPin className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleProcessPayment = (order: Order) => {
    setOrderForPayment({
      id: order.id,
      order_number: order.order_number,
      total: order.total,
    })
    setShowPaymentDialog(true)
  }

  const fetchPaymentMethod = async (orderId: number) => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("payment_method")
        .eq("order_id", orderId)
        .order("id", { ascending: false })
        .limit(1)
        .single()
      if (error || !data) return "-"
      // Mapear a nombre legible
      switch (data.payment_method) {
        case "cash": return "Efectivo"
        case "credit_card": return "Tarjeta de Crédito"
        case "debit_card": return "Tarjeta Débito"
        case "mobile_payment": return "Nequi/Daviplata"
        case "bank_transfer": return "Transferencia Bancaria"
        default: return data.payment_method
      }
    } catch {
      return "-"
    }
  }

  const handlePrint = async (order: Order) => {
    setSelectedOrder(order)
    setShowDetailsDialog(false)
    // Consultar método de pago antes de imprimir
    const method = await fetchPaymentMethod(order.id)
    setPaymentMethodForPrint(method)
    setTimeout(() => {
      if (printSectionRef.current) {
        window.print()
      }
    }, 300)
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tables?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesTab = tabFilter === "all" || order.status === tabFilter

    return matchesSearch && matchesStatus && matchesTab
  })

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
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
    <>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="transition-all hover:shadow-lg flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getOrderTypeIcon(order.order_type)}
                    {order.order_number}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      className={`${getStatusColor(order.status)} hover:${getStatusColor(order.status)} text-white`}
                    >
                      {getStatusLabel(order.status)}
                    </Badge>
                    <Badge variant="outline">{getOrderTypeLabel(order.order_type)}</Badge>
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
                        setSelectedOrder(order)
                        setShowDetailsDialog(true)
                      }}
                    >
                      Ver Detalles
                    </DropdownMenuItem>
                    {order.status === "pending" && (
                      <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "preparing")}>
                        Iniciar Preparación
                      </DropdownMenuItem>
                    )}
                    {order.status === "preparing" && (
                      <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "ready")}>
                        Marcar como Listo
                      </DropdownMenuItem>
                    )}
                    {order.status === "ready" && (
                      <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "delivered")}>
                        Marcar como Entregado
                      </DropdownMenuItem>
                    )}
                    {order.status === "delivered" && (
                      <DropdownMenuItem onClick={() => updateOrderStatus(order.id, "completed")}>
                        Completar Pedido
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => updateOrderStatus(order.id, "cancelled")}
                      className="text-red-600 focus:text-red-600"
                    >
                      Cancelar Pedido
                    </DropdownMenuItem>
                    {(order.status === "delivered" || order.status === "ready") && (
                      <DropdownMenuItem onClick={() => handleProcessPayment(order)}>
                        Procesar Pago
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {order.table_id && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Mesa {order.table_id}
                  </p>
                )}
                {order.customer_name && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {order.customer_name}
                  </p>
                )}
                {order.customer_phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {order.customer_phone}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground">{order.order_items?.length || 0} productos</span>
                  <span className="text-lg font-bold text-orange-600">{formatCurrency(order.total)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("es-ES")}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PaymentDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog} order={orderForPayment} />

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Pedido {selectedOrder.order_number}</span>
                  <Badge
                    className={`${getStatusColor(selectedOrder.status)} hover:${getStatusColor(
                      selectedOrder.status,
                    )} text-white`}
                  >
                    {getStatusLabel(selectedOrder.status)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipo de Pedido</p>
                    <p className="flex items-center gap-1">
                      {getOrderTypeIcon(selectedOrder.order_type)}
                      {getOrderTypeLabel(selectedOrder.order_type)}
                    </p>
                  </div>
                  {selectedOrder.tables && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Mesa</p>
                      <p>{selectedOrder.tables.name}</p>
                    </div>
                  )}
                  {selectedOrder.customer_name && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                      <p>{selectedOrder.customer_name}</p>
                    </div>
                  )}
                  {selectedOrder.profiles && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Mesero</p>
                      <p>
                        {selectedOrder.profiles.first_name} {selectedOrder.profiles.last_name}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Productos</p>
                  <div className="space-y-2">
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{item.products.name}</p>
                          <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                          {item.notes && <p className="text-xs text-muted-foreground">Nota: {item.notes}</p>}
                        </div>
                        <p className="font-medium">{formatCurrency(item.total_price)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Subtotal:</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Impuestos:</span>
                    <span>{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="text-sm">Descuento:</span>
                      <span>-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className="text-orange-600">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notas</p>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div style={{ display: "none" }}>
        {selectedOrder && (
          <div ref={printSectionRef} id="print-section" style={{ fontFamily: 'monospace', width: 320 }}>
            <h1 style={{ textAlign: 'center', margin: 0, fontSize: 22 }}>Restaurante Demo</h1>
            <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Ticket de Pedido</h2>
            <p><b>Fecha:</b> {new Date(selectedOrder.created_at).toLocaleString("es-ES")}</p>
            <p><b>Mesa:</b> {selectedOrder.tables?.name || "-"}</p>
            <hr />
            <h3 style={{ margin: '8px 0 4px 0' }}>Productos</h3>
            <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
              {selectedOrder.order_items?.map((item) => (
                <li key={item.id} style={{ marginBottom: 4 }}>
                  {item.products.name} x{item.quantity} - {formatCurrency(item.total_price)}
                </li>
              ))}
            </ul>
            <hr />
            <p style={{ fontSize: 18, margin: '8px 0' }}><b>Total: {formatCurrency(selectedOrder.total)}</b></p>
            <p><b>Método de pago:</b> {paymentMethodForPrint || '-'}</p>
          </div>
        )}
      </div>
    </>
  )
}
