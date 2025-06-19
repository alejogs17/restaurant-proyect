"use client"

import { useState, useEffect } from "react"
import { CreditCard, Banknote, Smartphone, Building, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { useToast } from "@/Componentes/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface PaymentStats {
  method: string
  total: number
  count: number
  percentage: number
}

export function PaymentMethodStats() {
  const [stats, setStats] = useState<PaymentStats[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Obtener estadísticas de métodos de pago del día actual
      const today = new Date().toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("payments")
        .select("payment_method, amount")
        .gte("payment_date", `${today}T00:00:00`)
        .lt("payment_date", `${today}T23:59:59`)

      if (error) throw error

      // Calcular estadísticas
      const methodTotals: { [key: string]: { total: number; count: number } } = {}
      let total = 0

      data?.forEach((payment) => {
        const method = payment.payment_method
        if (!methodTotals[method]) {
          methodTotals[method] = { total: 0, count: 0 }
        }
        methodTotals[method].total += payment.amount
        methodTotals[method].count += 1
        total += payment.amount
      })

      const statsArray = Object.entries(methodTotals).map(([method, data]) => ({
        method,
        total: data.total,
        count: data.count,
        percentage: total > 0 ? (data.total / total) * 100 : 0,
      }))

      setStats(statsArray)
      setTotalRevenue(total)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas de pagos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
