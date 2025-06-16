"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Download, Eye, Send, Printer } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface Invoice {
  id: number
  invoice_number: string
  order_id: number
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  customer_address?: string
  subtotal: number
  tax: number
  discount: number
  total: number
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
  due_date: string
  created_at: string
  orders: {
    order_number: string
    order_type: string
    tables?: {
      name: string
    }
  }
}

interface InvoiceListProps {
  searchTerm: string
}

export function InvoiceList({ searchTerm }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          orders (
            order_number,
            order_type,
            tables (name)
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      setInvoices(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las facturas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateInvoiceStatus = async (invoiceId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", invoiceId)

      if (error) throw error

      setInvoices(
        invoices.map((invoice) => (invoice.id === invoiceId ? { ...invoice, status: newStatus as any } : invoice)),
      )

      toast({
        title: "Estado actualizado",
        description: `La factura ha sido marcada como ${getStatusLabel(newStatus)}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la factura",
        variant: "destructive",
      })
    }
  }

  const generatePDF = async (invoice: Invoice) => {
    try {
      // Aquí implementarías la generación de PDF
      // Por ahora, mostraremos un mensaje
      toast({
        title: "Generando PDF",
        description: "La factura se está generando...",
      })

      // Simular descarga
      setTimeout(() => {
        const link = document.createElement("a")
        link.href = "#"
        link.download = `factura-${invoice.invoice_number}.pdf`
        link.click()

        toast({
          title: "PDF generado",
          description: "La factura ha sido descargada",
        })
      }, 2000)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-500"
      case "sent":
        return "bg-blue-500"
      case "paid":
        return "bg-green-500"
      case "overdue":
        return "bg-red-500"
      case "cancelled":
        return "bg-red-600"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Borrador"
      case "sent":
        return "Enviada"
      case "paid":
        return "Pagada"
      case "overdue":
        return "Vencida"
      case "cancelled":
        return "Cancelada"
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

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.orders.order_number.toLowerCase().includes(searchTerm.toLowerCase()),
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
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id} className="transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      className={`${getStatusColor(invoice.status)} hover:${getStatusColor(invoice.status)} text-white`}
                    >
                      {getStatusLabel(invoice.status)}
                    </Badge>
                    <Badge variant="outline">{invoice.orders.order_number}</Badge>
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
                        setSelectedInvoice(invoice)
                        setShowDetailsDialog(true)
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => generatePDF(invoice)}>
                      <Download className="mr-2 h-4 w-4" />
                      Descargar PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => generatePDF(invoice)}>
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir
                    </DropdownMenuItem>
                    {invoice.status === "draft" && (
                      <DropdownMenuItem onClick={() => updateInvoiceStatus(invoice.id, "sent")}>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar
                      </DropdownMenuItem>
                    )}
                    {invoice.status === "sent" && (
                      <DropdownMenuItem onClick={() => updateInvoiceStatus(invoice.id, "paid")}>
                        Marcar como Pagada
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invoice.customer_name && (
                  <p className="text-sm text-muted-foreground">Cliente: {invoice.customer_name}</p>
                )}
                {invoice.orders.tables && (
                  <p className="text-sm text-muted-foreground">Mesa: {invoice.orders.tables.name}</p>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-lg font-bold text-orange-600">{formatCurrency(invoice.total)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Creada: {new Date(invoice.created_at).toLocaleDateString("es-ES")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Vence: {new Date(invoice.due_date).toLocaleDateString("es-ES")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Factura {selectedInvoice.invoice_number}</span>
                  <Badge
                    className={`${getStatusColor(selectedInvoice.status)} hover:${getStatusColor(
                      selectedInvoice.status,
                    )} text-white`}
                  >
                    {getStatusLabel(selectedInvoice.status)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Número de Pedido</p>
                    <p>{selectedInvoice.orders.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha de Creación</p>
                    <p>{new Date(selectedInvoice.created_at).toLocaleDateString("es-ES")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha de Vencimiento</p>
                    <p>{new Date(selectedInvoice.due_date).toLocaleDateString("es-ES")}</p>
                  </div>
                  {selectedInvoice.customer_name && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                      <p>{selectedInvoice.customer_name}</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Subtotal:</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">IVA (19%):</span>
                    <span>{formatCurrency(selectedInvoice.tax)}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="text-sm">Descuento:</span>
                      <span>-{formatCurrency(selectedInvoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className="text-orange-600">{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => generatePDF(selectedInvoice)} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar PDF
                  </Button>
                  <Button variant="outline" onClick={() => generatePDF(selectedInvoice)} className="flex-1">
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
