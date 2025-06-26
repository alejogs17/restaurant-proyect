"use client"

import { useState, useEffect, useCallback } from "react"
import { CreditCard, Banknote, Smartphone, Building, TrendingUp, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { useToast } from "@/Componentes/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js"

interface PaymentStats {
  method: string
  total: number
  count: number
  percentage: number
}

type PaymentQueryData = {
  payment_method: string
  amount: number
}

type InvoiceQueryData = {
  total: number
  status: string
}

export function PaymentMethodStats() {
  const [stats, setStats] = useState<PaymentStats[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchStats = useCallback(async () => {
    try {
      // Obtener estadísticas de métodos de pago del día actual
      const today = new Date().toISOString().split("T")[0]

      // Obtener pagos del día
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("payment_method, amount")
        .gte("payment_date", `${today}T00:00:00`)
        .lt("payment_date", `${today}T23:59:59`)

      if (paymentsError) throw paymentsError

      // Obtener facturas creadas hoy
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("total, status")
        .gte("created_at", `${today}T00:00:00`)
        .lt("created_at", `${today}T23:59:59`)

      if (invoicesError) throw invoicesError

      // Calcular estadísticas de pagos
      const methodTotals: { [key: string]: { total: number; count: number } } = {}
      let totalPayments = 0

      paymentsData?.forEach((payment: PaymentQueryData) => {
        const method = payment.payment_method
        if (!methodTotals[method]) {
          methodTotals[method] = { total: 0, count: 0 }
        }
        methodTotals[method].total += payment.amount
        methodTotals[method].count += 1
        totalPayments += payment.amount
      })

      // Separar facturas pagadas y pendientes
      const paidInvoices = invoicesData?.filter((invoice: InvoiceQueryData) => invoice.status === 'paid') || []
      const pendingInvoices = invoicesData?.filter((invoice: InvoiceQueryData) => invoice.status !== 'paid') || []

      const totalPaidInvoices = paidInvoices.reduce((sum: number, invoice: InvoiceQueryData) => sum + invoice.total, 0)
      const totalPendingInvoices = pendingInvoices.reduce((sum: number, invoice: InvoiceQueryData) => sum + invoice.total, 0)

      // El total del día incluye pagos + facturas pendientes (las pagadas ya están en pagos)
      const totalRevenue = totalPayments + totalPendingInvoices

      const statsArray = Object.entries(methodTotals).map(([method, data]) => ({
        method,
        total: data.total,
        count: data.count,
        percentage: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0,
      }))

      // Agregar estadística de facturas pagadas si hay facturas pagadas del día
      if (totalPaidInvoices > 0) {
        statsArray.push({
          method: "paid_invoices",
          total: totalPaidInvoices,
          count: paidInvoices.length,
          percentage: totalRevenue > 0 ? (totalPaidInvoices / totalRevenue) * 100 : 0,
        })
      }

      // Agregar estadística de facturas pendientes si hay facturas pendientes del día
      if (totalPendingInvoices > 0) {
        statsArray.push({
          method: "pending_invoices",
          total: totalPendingInvoices,
          count: pendingInvoices.length,
          percentage: totalRevenue > 0 ? (totalPendingInvoices / totalRevenue) * 100 : 0,
        })
      }

      setStats(statsArray)
      setTotalRevenue(totalRevenue)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas de pagos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  useEffect(() => {
    // Fetch initial data
    fetchStats()

    // Subscribe to changes in payments table
    const paymentsChannel = supabase
      .channel('payment-stats-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Payment change received!', payload)
          fetchStats() // Refetch stats on any change
        }
      )
      .subscribe()

    // Subscribe to changes in invoices table
    const invoicesChannel = supabase
      .channel('invoice-stats-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('Invoice change received!', payload)
          fetchStats() // Refetch stats on any change
        }
      )
      .subscribe()

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(paymentsChannel)
      supabase.removeChannel(invoicesChannel)
    }
  }, [supabase, fetchStats])

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-5 w-5 text-green-600" />
      case "credit_card":
      case "debit_card":
        return <CreditCard className="h-5 w-5 text-blue-600" />
      case "mobile_payment":
        return <Smartphone className="h-5 w-5 text-purple-600" />
      case "bank_transfer":
        return <Building className="h-5 w-5 text-gray-600" />
      case "pending_invoices":
        return <FileText className="h-5 w-5 text-orange-600" />
      case "paid_invoices":
        return <FileText className="h-5 w-5 text-green-600" />
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />
    }
  }

  const getMethodLabel = (method: string) => {
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
      case "pending_invoices":
        return "Facturas Pendientes"
      case "paid_invoices":
        return "Facturas Pagadas"
      case "other":
        return "Otro"
      default:
        return "Desconocido"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {/* Total Revenue */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
            <TrendingUp className="h-5 w-5" />
            Total del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalRevenue)}</div>
          <p className="text-sm text-orange-600">Ingresos totales</p>
        </CardContent>
      </Card>

      {/* Payment Method Stats */}
      {stats.map((stat) => (
        <Card key={stat.method}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              {getMethodIcon(stat.method)}
              {getMethodLabel(stat.method)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(stat.total)}</div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{stat.count} transacciones</span>
              <span>{stat.percentage.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Fill empty slots if less than 4 payment methods */}
      {Array.from({ length: Math.max(0, 4 - stats.length) }).map((_, i) => (
        <Card key={`empty-${i}`} className="border-dashed border-gray-300">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Sin datos</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
