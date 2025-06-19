"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, CreditCard, Banknote, Smartphone, Building } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { Button } from "@/Componentes/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Componentes/ui/dropdown-menu"
import { useToast } from "@/Componentes/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface Payment {
  id: number
  order_id: number
  payment_method: "cash" | "credit_card" | "debit_card" | "mobile_payment" | "bank_transfer" | "other"
  amount: number
  payment_date: string
  reference_number?: string
  notes?: string
  orders: {
    order_number: string
    customer_name?: string
    tables?: {
      name: string
    }
  }
  profiles: {
    first_name: string
    last_name: string
  }
}

interface PaymentListProps {
  searchTerm: string
}

export function PaymentList({ searchTerm }: PaymentListProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          orders (
            order_number,
            customer_name,
            tables (name)
          ),
          profiles (
            first_name,
            last_name
          )
        `)
        .order("payment_date", { ascending: false })

      if (error) throw error

      setPayments(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los pagos",
        variant: "destructive",
      })
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

  const getPaymentMethodBadge = (method: string) => {
    const colors = {
      cash: "bg-green-500",
      credit_card: "bg-blue-500",
      debit_card: "bg-indigo-500",
      mobile_payment: "bg-purple-500",
      bank_transfer: "bg-gray-500",
      other: "bg-orange-500",
    }

    return (
      <Badge className={`${colors[method as keyof typeof colors] || "bg-gray-500"} text-white`}>
        {getPaymentMethodLabel(method)}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const filteredPayments = payments.filter(
    (payment) =>
      payment.orders.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.orders.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredPayments.map((payment) => (
        <Card key={payment.id} className="transition-all hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getPaymentMethodIcon(payment.payment_method)}
                  {payment.orders.order_number}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">{getPaymentMethodBadge(payment.payment_method)}</div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                  <DropdownMenuItem>Imprimir Recibo</DropdownMenuItem>
                  <DropdownMenuItem>Reembolsar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {payment.orders.customer_name && (
                <p className="text-sm text-muted-foreground">Cliente: {payment.orders.customer_name}</p>
              )}
              {payment.orders.tables && (
                <p className="text-sm text-muted-foreground">Mesa: {payment.orders.tables.name}</p>
              )}
              {payment.reference_number && (
                <p className="text-sm text-muted-foreground">Ref: {payment.reference_number}</p>
              )}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">Monto</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(payment.amount)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cajero: {payment.profiles.first_name} {payment.profiles.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{new Date(payment.payment_date).toLocaleString("es-ES")}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
