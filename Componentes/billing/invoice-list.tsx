"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Download, Eye, Send, Printer, CreditCard, Banknote, Smartphone, Building } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { Button } from "@/Componentes/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Componentes/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/Componentes/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Componentes/ui/select"
import { Label } from "@/Componentes/ui/label"
import { useToast } from "@/Componentes/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import jsPDF from "jspdf"

interface Invoice {
  id: number
  invoice_number: string
  order_id: number
  customer_name?: string
  customer_email?: string
  subtotal: number
  tax: number
  discount: number
  total: number
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  due_date: string
  created_at: string
  orders: {
    order_number: string
    tables?: { name: string } | null
  } | null
}

interface InvoiceListProps {
  searchTerm: string
}

export function InvoiceList({ searchTerm }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [processingPayment, setProcessingPayment] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          orders (order_number, tables (name))
        `)

      if (error) {
        console.error("Error al obtener las facturas:", error)
        throw error
      }
      
      const sortedData = data ? data.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ) : []
      setInvoices(sortedData)
    } catch (error: any) {
      console.error("Error en fetchInvoices:", error)
      toast({
        title: "Error",
        description: `No se pudieron cargar las facturas: ${error.message}`,
        variant: "destructive",
      })
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const updateInvoiceStatus = async (invoiceId: number, newStatus: Invoice['status']) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", invoiceId)

      if (error) throw error;

      setInvoices(
        invoices.map((invoice) => (invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice)),
      );

      toast({
        title: "Estado actualizado",
        description: `La factura ha sido marcada como ${getStatusLabel(newStatus)}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la factura.",
        variant: "destructive",
      });
    }
  };

  const markAsPaid = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowPaymentDialog(true)
  }

  const processPayment = async () => {
    if (!selectedInvoice) return

    setProcessingPayment(true)
    try {
      // Primero actualizar el estado de la factura a 'paid'
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq("id", selectedInvoice.id)

      if (invoiceError) throw invoiceError

      // Luego crear el pago manualmente con el método seleccionado
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          order_id: selectedInvoice.order_id,
          payment_method: paymentMethod,
          amount: selectedInvoice.total,
          reference_number: `MANUAL-${selectedInvoice.invoice_number}`,
          notes: `Pago manual registrado para factura ${selectedInvoice.invoice_number}`,
          payment_date: new Date().toISOString()
        })

      if (paymentError) throw paymentError

      // Actualizar la lista de facturas
      setInvoices(
        invoices.map((invoice) => 
          invoice.id === selectedInvoice.id 
            ? { ...invoice, status: 'paid' } 
            : invoice
        )
      )

      toast({
        title: "Pago registrado",
        description: `La factura ${selectedInvoice.invoice_number} ha sido marcada como pagada y se ha registrado el pago.`,
      })

      setShowPaymentDialog(false)
      setSelectedInvoice(null)
      setPaymentMethod("cash")
      
      // Recargar la página para mostrar los cambios
      window.location.reload()
    } catch (error: any) {
      console.error("Error procesando pago:", error)
      toast({
        title: "Error",
        description: "No se pudo procesar el pago.",
        variant: "destructive",
      })
    } finally {
      setProcessingPayment(false)
    }
  }

  const generatePDF = async (invoice: Invoice, printDirectly = false) => {
    try {
      const doc = new jsPDF();
      // Título
      doc.setFontSize(18);
      doc.text("Factura", 14, 20);
      doc.setFontSize(12);
      doc.text(`Número: ${invoice.invoice_number}`, 14, 30);
      doc.text(`Cliente: ${invoice.customer_name || "-"}`, 14, 38);
      doc.text(`Correo: ${invoice.customer_email || "-"}`, 14, 46);
      doc.text(`Fecha: ${new Date(invoice.created_at).toLocaleString()}`, 14, 54);
      doc.text(`Estado: ${getStatusLabel(invoice.status)}`, 14, 62);
      doc.text(`Subtotal: $${invoice.subtotal.toFixed(2)}`, 14, 70);
      doc.text(`Descuento: $${invoice.discount.toFixed(2)}`, 14, 78);
      doc.text(`Total: $${invoice.total.toFixed(2)}`, 14, 86);
      // Detalles de la orden (si existen)
      if (invoice.orders) {
        doc.text(`Orden: ${invoice.orders.order_number}`, 14, 102);
        if (invoice.orders.tables && invoice.orders.tables.name) {
          doc.text(`Mesa: ${invoice.orders.tables.name}`, 14, 110);
        }
      }
      // Pie de página
      doc.setFontSize(10);
      doc.text("Gracias por su compra", 14, 140);
      if (printDirectly) {
        doc.autoPrint && doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
        toast({
          title: "Imprimiendo PDF",
          description: "Se ha enviado el PDF a la impresora",
        });
      } else {
        doc.save(`factura-${invoice.invoice_number}.pdf`);
        toast({
          title: "PDF generado",
          description: "La factura ha sido descargada",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      });
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-500"
      case "sent": return "bg-blue-500"
      case "paid": return "bg-green-500"
      case "overdue": return "bg-red-500"
      case "cancelled": return "bg-red-600"
      default: return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft": return "Borrador"
      case "sent": return "Enviada"
      case "paid": return "Pagada"
      case "overdue": return "Vencida"
      case "cancelled": return "Cancelada"
      default: return status
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency", currency: "COP", minimumFractionDigits: 0,
    }).format(amount)
  }

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.orders?.order_number?.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredInvoices.map((invoice) => (
        <Card key={invoice.id} className="transition-all hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">Factura #{invoice.invoice_number}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Cliente: {invoice.customer_name || 'Cliente General'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${getStatusColor(invoice.status)} text-white`}>
                    {getStatusLabel(invoice.status)}
                  </Badge>
                  {invoice.orders && (
                    <Badge variant="outline">Pedido #{invoice.orders.order_number}</Badge>
                  )}
                  {invoice.orders?.tables?.name && (
                    <Badge variant="outline">Mesa: {invoice.orders.tables.name}</Badge>
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
                  <DropdownMenuItem onClick={() => { setSelectedInvoice(invoice); setShowDetailsDialog(true); }}>
                    <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => generatePDF(invoice, true)}>
                    <Printer className="mr-2 h-4 w-4" /> Imprimir
                  </DropdownMenuItem>
                  {invoice.status === 'draft' && (
                    <DropdownMenuItem onClick={() => updateInvoiceStatus(invoice.id, 'sent')}>
                      <Send className="mr-2 h-4 w-4" /> Enviar Factura
                    </DropdownMenuItem>
                  )}
                  {invoice.status === 'sent' && (
                     <DropdownMenuItem onClick={() => markAsPaid(invoice)}>
                       Marcar como Pagada
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Vence: {new Date(invoice.due_date).toLocaleDateString("es-ES")}
              </p>
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm font-medium">Total</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(invoice.total)}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Creada: {new Date(invoice.created_at).toLocaleString("es-ES")}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Details Dialog */}
      {selectedInvoice && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Factura #{selectedInvoice.invoice_number}</span>
                <Badge className={`${getStatusColor(selectedInvoice.status)} text-white`}>
                  {getStatusLabel(selectedInvoice.status)}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Cliente</h3>
                  <p>{selectedInvoice.customer_name || 'Cliente General'}</p>
                  <p>{selectedInvoice.customer_email}</p>
                </div>
                <div className="text-right">
                  <p><strong>Fecha Factura:</strong> {new Date(selectedInvoice.created_at).toLocaleDateString("es-ES")}</p>
                  <p><strong>Fecha Vencimiento:</strong> {new Date(selectedInvoice.due_date).toLocaleDateString("es-ES")}</p>
                  {selectedInvoice.orders?.order_number && (
                    <p><strong>Pedido Relacionado:</strong> #{selectedInvoice.orders.order_number}</p>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Detalles del Monto</h3>
                <div className="space-y-1">
                  <div className="flex justify-between"><span>Subtotal:</span> <span>{formatCurrency(selectedInvoice.subtotal)}</span></div>
                  <div className="flex justify-between"><span>Descuento:</span> <span className="text-red-500">-{formatCurrency(selectedInvoice.discount)}</span></div>
                  <div className="flex justify-between items-center font-bold text-xl border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => generatePDF(selectedInvoice, true)}>
                  <Printer className="mr-2 h-4 w-4" /> Imprimir
                </Button>
                <Button variant="outline" onClick={() => generatePDF(selectedInvoice)}>
                  <Download className="mr-2 h-4 w-4" /> Descargar PDF
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Dialog */}
      {selectedInvoice && (
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Pago</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Detalles de la Factura</h3>
                <p className="text-sm text-gray-600">Factura #{selectedInvoice.invoice_number}</p>
                <p className="text-sm text-gray-600">Cliente: {selectedInvoice.customer_name || 'Cliente General'}</p>
                <p className="text-lg font-bold text-green-600 mt-2">
                  Total: {formatCurrency(selectedInvoice.total)}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment-method">Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                    <SelectItem value="debit_card">Tarjeta Débito</SelectItem>
                    <SelectItem value="mobile_payment">Pago Móvil</SelectItem>
                    <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentDialog(false)}
                disabled={processingPayment}
              >
                Cancelar
              </Button>
              <Button 
                onClick={processPayment}
                disabled={processingPayment}
                className="bg-green-600 hover:bg-green-700"
              >
                {processingPayment ? "Procesando..." : "Confirmar Pago"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
