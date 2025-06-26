"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, CreditCard, Banknote, Smartphone, Building, Printer, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { Button } from "@/Componentes/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Componentes/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/Componentes/ui/dialog"
import { useToast } from "@/Componentes/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface Payment {
  id: number
  order_id: number
  user_id: string | null
  payment_method: "cash" | "credit_card" | "debit_card" | "mobile_payment" | "bank_transfer" | "other"
  amount: number
  payment_date: string
  reference_number?: string
  notes?: string
  orders: {
    order_number: string
    customer_name: string | null
    tables: { name: string } | null
    status: string
  } | null
  profiles: { 
    first_name: string
    last_name: string
  } | null
}

interface PaymentListProps {
  searchTerm: string
}

export function PaymentList({ searchTerm }: PaymentListProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          orders (order_number, customer_name, tables (name), status)
        `)

      if (error) {
        console.error("Error al obtener los pagos:", error)
        throw error
      }

      // Obtener los perfiles de los usuarios que hicieron los pagos
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((payment: any) => payment.user_id).filter(Boolean))]
        
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .in("id", userIds)

          if (profilesError) {
            console.error("Error al obtener perfiles:", profilesError)
          } else {
            // Crear un mapa de perfiles por user_id
            const profilesMap = new Map()
            profilesData?.forEach((profile: any) => {
              profilesMap.set(profile.id, profile)
            })

            // Agregar los datos del perfil a cada pago
            const paymentsWithProfiles = data.map((payment: any) => ({
              ...payment,
              profiles: payment.user_id ? profilesMap.get(payment.user_id) || null : null
            }))

            const sortedData = paymentsWithProfiles.sort((a: any, b: any) => 
              new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
            )
            setPayments(sortedData)
            return
          }
        }
      }

      // Si no hay datos o hay error, usar los datos originales
      const sortedData = data ? data.sort((a: any, b: any) => 
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      ) : []
      setPayments(sortedData)
    } catch (error: any) {
      console.error("Error en fetchPayments:", error)
      toast({
        title: "Error",
        description: `No se pudieron cargar los pagos: ${error.message}`,
        variant: "destructive",
      })
      setPayments([])
    } finally {
      setLoading(false)
    }
  }
  
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4 text-green-600" />
      case "credit_card":
      case "debit_card":
        return <CreditCard className="h-4 w-4 text-blue-600" />
      case "mobile_payment":
        return <Smartphone className="h-4 w-4 text-purple-600" />
      case "bank_transfer":
        return <Building className="h-4 w-4 text-gray-600" />
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Efectivo"
      case "credit_card":
        return "Tarjeta de Crédito"
      case "debit_card":
        return "Tarjeta Débito"
      case "mobile_payment":
        return "Pago Móvil"
      case "bank_transfer":
        return "Transferencia"
      case "other":
        return "Otro"
      default:
        return "Desconocido"
    }
  }
  
  const getCustomerName = (payment: Payment) => {
    if (payment.orders?.customer_name) return payment.orders.customer_name
    return "Cliente General"
  }

  const getCashierName = (payment: Payment) => {
    if (payment.profiles) return `${payment.profiles.first_name || ''} ${payment.profiles.last_name || ''}`.trim()
    return "Cajero no asignado"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "delivered":
        return "bg-blue-500"
      case "ready":
        return "bg-yellow-500"
      case "preparing":
        return "bg-orange-500"
      case "pending":
        return "bg-gray-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completada"
      case "delivered":
        return "Entregada"
      case "ready":
        return "Lista"
      case "preparing":
        return "Preparando"
      case "pending":
        return "Pendiente"
      case "cancelled":
        return "Cancelada"
      default:
        return "Desconocido"
    }
  }

  const filteredPayments = payments.filter(
    (payment) =>
      payment.orders?.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCustomerName(payment).toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
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

  if (!loading && filteredPayments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron pagos</h3>
        <p className="mt-1 text-sm text-gray-500">
          {payments.length === 0 
            ? "No hay pagos registrados en el sistema." 
            : "Intenta ajustar tu búsqueda."}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPayments.map((payment) => (
          <Card key={payment.id} className="transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getPaymentMethodIcon(payment.payment_method)}
                    Pago de Orden #{payment.orders?.order_number}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Cliente: {getCustomerName(payment)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge>{getPaymentMethodLabel(payment.payment_method)}</Badge>
                    {payment.orders?.status && (
                      <Badge className={getOrderStatusColor(payment.orders.status)}>
                        {getOrderStatusText(payment.orders.status)}
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelectedPayment(payment); setShowDetailsDialog(true); }}>
                      <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Printer className="mr-2 h-4 w-4" /> Imprimir Recibo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {payment.orders?.tables && (
                  <p className="text-sm text-muted-foreground">Mesa: {payment.orders.tables.name}</p>
                )}
                {payment.reference_number && (
                  <p className="text-sm text-muted-foreground">Referencia: {payment.reference_number}</p>
                )}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm font-medium">Total Pagado</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cajero: {getCashierName(payment)}
                </p>
                <p className="text-xs text-muted-foreground">{new Date(payment.payment_date).toLocaleString("es-ES")}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPayment && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalles del Pago</DialogTitle>
              <DialogDescription>
                Pago de la orden #{selectedPayment.orders?.order_number}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               {/* Details grid here */}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
