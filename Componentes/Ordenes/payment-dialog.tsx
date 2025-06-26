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
    if (!order) return setLoading(false)

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuario no autenticado")
      
      const { data: orderData, error: orderFetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order.id)
        .single();

      if (orderFetchError || !orderData) {
        throw new Error('No se pudo obtener la información completa del pedido.');
      }

      // 1. Create payment record
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

      // 2. Create invoice record
      const { error: invoiceError } = await supabase.from("invoices").insert([
        {
          invoice_number: `INV-${orderData.order_number}`,
          order_id: orderData.id,
          customer_name: orderData.customer_name || 'Cliente General',
          subtotal: orderData.subtotal,
          tax: orderData.tax,
          discount: orderData.discount,
          total: orderData.total,
          status: 'paid',
          due_date: new Date().toISOString().split('T')[0],
        }
      ]);

      if (invoiceError) throw invoiceError;
      
      // 3. Update order status to completed
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", order.id)

      if (orderError) throw orderError

      toast({
        title: "Pago y Factura Creados",
        description: `El pago de ${formatCurrency(Number.parseFloat(amount))} ha sido registrado y la factura fue creada.`,
      })

      // Reset form and close dialog
      onOpenChange(false)
      
      // Recargar la página para mostrar los cambios
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: `No se pudo procesar el pago: ${error.message}`,
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
      <DialogContent className="sm:max-w-[300px] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Procesar Pago</DialogTitle>
          <DialogDescription>Registra el pago para el pedido {order.order_number}</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-1">
          <form id="payment-form" onSubmit={handleSubmit} className="grid gap-4 py-4">
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
          </form>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="payment-form"
            disabled={loading || !paymentMethod || !amount}
            className="bg-green-500 hover:bg-green-600"
          >
            {loading ? "Procesando..." : "Procesar Pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
