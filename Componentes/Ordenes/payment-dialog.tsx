"use client"

import React from "react"

import { useState } from "react"
import { CreditCard, Banknote, Smartphone, Building } from "lucide-react"
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
import { Card, CardContent } from "@/Componentes/ui/card"
import { useToast } from "@/Componentes/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: {
    id: number
    order_number: string
    total: number
  } | null
}

const paymentMethods = [
  { value: "cash", label: "Efectivo", icon: Banknote, color: "text-green-600" },
  { value: "credit_card", label: "Tarjeta de Crédito", icon: CreditCard, color: "text-blue-600" },
  { value: "debit_card", label: "Tarjeta Débito", icon: CreditCard, color: "text-indigo-600" },
  { value: "mobile_payment", label: "Nequi/Daviplata", icon: Smartphone, color: "text-purple-600" },
  { value: "bank_transfer", label: "Transferencia Bancaria", icon: Building, color: "text-gray-600" },
]

export function PaymentDialog({ open, onOpenChange, order }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState("")
  const [amount, setAmount] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  React.useEffect(() => {
    if (order && open) {
      setAmount(order.total.toString())
    }
  }, [order, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!order) {
      toast({
        title: "Error",
        description: "No hay pedido seleccionado",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Usuario no autenticado")

      // Create payment record
      const { error: paymentError } = await supabase.from("payments").insert([
        {
          order_id: order.id,
          payment_method: paymentMethod,
          amount: Number.parseFloat(amount),
          reference_number: referenceNumber || null,
          notes: notes || null,
          user_id: user.id,
        },
      ])

      if (paymentError) throw paymentError

      // Update order status to completed
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", order.id)

      if (orderError) throw orderError

      toast({
        title: "Pago registrado",
        description: `El pago de ${formatCurrency(Number.parseFloat(amount))} ha sido registrado correctamente`,
      })

      // Reset form
      setPaymentMethod("")
      setAmount("")
      setReferenceNumber("")
      setNotes("")
      onOpenChange(false)
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo registrar el pago",
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

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Procesar Pago</DialogTitle>
          <DialogDescription>Registra el pago para el pedido {order.order_number}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total a pagar:</span>
                <span className="text-xl font-bold text-orange-600">{formatCurrency(order.total)}</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Método de Pago</Label>
              <div className="grid grid-cols-1 gap-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon
                  return (
                    <Card
                      key={method.value}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        paymentMethod === method.value ? "ring-2 ring-orange-500 bg-orange-50" : ""
                      }`}
                      onClick={() => setPaymentMethod(method.value)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${method.color}`} />
                          <span className="font-medium">{method.label}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Monto Recibido</Label>
              <Input
                id="amount"
                type="number"
                step="1"
                min="0"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            {paymentMethod && paymentMethod !== "cash" && (
              <div className="grid gap-2">
                <Label htmlFor="reference">Número de Referencia</Label>
                <Input
                  id="reference"
                  placeholder="Número de transacción, autorización, etc."
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Observaciones adicionales..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {Number.parseFloat(amount) > order.total && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between items-center text-blue-700">
                  <span>Cambio a devolver:</span>
                  <span className="font-bold">{formatCurrency(Number.parseFloat(amount) - order.total)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !paymentMethod || !amount}
              className="bg-green-500 hover:bg-green-600"
            >
              {loading ? "Procesando..." : "Procesar Pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
