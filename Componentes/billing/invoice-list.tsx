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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency", currency: "COP", minimumFractionDigits: 0,
    }).format(amount)
  }

  const getCurrentDateTime = () => {
    const now = new Date()
    return {
      date: now.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: now.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: now.toISOString().slice(0, 19).replace(/:/g, "-"),
    }
  }

  const printInvoice = (invoice: Invoice) => {
    const dateTime = getCurrentDateTime()
    
    // Crear contenido HTML para impresión
    const printContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factura ${invoice.invoice_number}</title>
        <style>
          @page {
            margin: 1.5cm;
            size: A4;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
            font-size: 12px;
          }
          
          /* ENCABEZADO */
          .header {
            text-align: center;
            border-bottom: 4px solid #1e40af;
            padding-bottom: 20px;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 20px;
            border-radius: 8px;
          }
          
          .company-logo {
            font-size: 32px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 8px;
            letter-spacing: 3px;
          }
          
          .invoice-title {
            font-size: 24px;
            color: #374151;
            margin-bottom: 10px;
            font-weight: 600;
          }
          
          .invoice-number {
            font-size: 18px;
            color: #1e40af;
            background-color: #dbeafe;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            font-weight: 600;
          }
          
          /* INFORMACIÓN DE LA FACTURA */
          .invoice-info {
            background-color: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          
          .info-section h3 {
            color: #1e40af;
            font-size: 14px;
            margin-bottom: 10px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 5px;
          }
          
          .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 4px 0;
          }
          
          .info-label {
            font-weight: 600;
            color: #475569;
          }
          
          .info-value {
            color: #1e293b;
            font-weight: 500;
          }
          
          /* DETALLES DE LA FACTURA */
          .invoice-details {
            margin-bottom: 40px;
          }
          
          .details-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 15px;
            padding: 10px 0;
            border-bottom: 3px solid #e2e8f0;
            background: linear-gradient(90deg, #dbeafe 0%, transparent 100%);
            padding-left: 15px;
          }
          
          .amount-details {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 2px solid #0ea5e9;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
          }
          
          .amount-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .amount-row:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 18px;
            color: #1e40af;
            border-top: 2px solid #0ea5e9;
            padding-top: 12px;
            margin-top: 12px;
          }
          
          .total-amount {
            color: #059669 !important;
            font-size: 24px !important;
            font-family: 'Courier New', monospace;
          }
          
          /* PIE DE PÁGINA */
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
          }
          
          .footer-info {
            font-size: 10px;
            color: #6b7280;
            margin-top: 20px;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            color: white;
            text-transform: uppercase;
          }
          
          .status-paid { background-color: #059669; }
          .status-sent { background-color: #3b82f6; }
          .status-draft { background-color: #6b7280; }
          .status-overdue { background-color: #dc2626; }
          .status-cancelled { background-color: #991b1b; }
          
          @media print {
            .no-print { display: none !important; }
            body { print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <!-- ENCABEZADO -->
        <div class="header">
          <div class="company-logo">🍽️ RESTAURANTE OS</div>
          <div class="invoice-title">FACTURA</div>
          <div class="invoice-number">#${invoice.invoice_number}</div>
        </div>

        <!-- INFORMACIÓN DE LA FACTURA -->
        <div class="invoice-info">
          <div class="info-section">
            <h3>👤 Información del Cliente</h3>
            <div class="info-item">
              <span class="info-label">Nombre:</span>
              <span class="info-value">${invoice.customer_name || 'Cliente General'}</span>
            </div>
            ${invoice.customer_email ? `
            <div class="info-item">
              <span class="info-label">Email:</span>
              <span class="info-value">${invoice.customer_email}</span>
            </div>
            ` : ''}
            ${invoice.customer_phone ? `
            <div class="info-item">
              <span class="info-label">Teléfono:</span>
              <span class="info-value">${invoice.customer_phone}</span>
            </div>
            ` : ''}
            ${invoice.customer_address ? `
            <div class="info-item">
              <span class="info-label">Dirección:</span>
              <span class="info-value">${invoice.customer_address}</span>
            </div>
            ` : ''}
          </div>
          <div class="info-section">
            <h3>📋 Información de la Factura</h3>
            <div class="info-item">
              <span class="info-label">Fecha de Emisión:</span>
              <span class="info-value">${new Date(invoice.created_at).toLocaleDateString("es-CO")}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Fecha de Vencimiento:</span>
              <span class="info-value">${new Date(invoice.due_date).toLocaleDateString("es-CO")}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Estado:</span>
              <span class="info-value">
                <span class="status-badge status-${invoice.status}">${getStatusLabel(invoice.status)}</span>
              </span>
            </div>
            ${invoice.orders?.order_number ? `
            <div class="info-item">
              <span class="info-label">Pedido Relacionado:</span>
              <span class="info-value">#${invoice.orders.order_number}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- DETALLES DE LA FACTURA -->
        <div class="invoice-details">
          <div class="details-title">💰 Detalles del Monto</div>
          <div class="amount-details">
            <div class="amount-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            <div class="amount-row">
              <span>Impuestos:</span>
              <span>${formatCurrency(invoice.tax)}</span>
            </div>
            <div class="amount-row">
              <span>Descuento:</span>
              <span style="color: #dc2626;">-${formatCurrency(invoice.discount)}</span>
            </div>
            <div class="amount-row">
              <span>Total:</span>
              <span class="total-amount">${formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        <!-- PIE DE PÁGINA -->
        <div class="footer">
          <div class="footer-info">
            <p><strong>🍽️ RESTAURANTE OS</strong> - Sistema de Gestión Integral</p>
            <p>📄 Factura generada el ${dateTime.date} a las ${dateTime.time}</p>
            <p>💰 Moneda: Pesos Colombianos (COP) | 📊 Sistema: RestauranteOS v1.0</p>
            <p>⚠️ Este documento es una representación oficial de la factura</p>
            <p>© ${new Date().getFullYear()} RestauranteOS - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Crear ventana de impresión
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      
      // Esperar a que se cargue el contenido y luego imprimir
      printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
      }
      
      toast({
        title: "Imprimiendo factura",
        description: `La factura ${invoice.invoice_number} se está imprimiendo...`,
      })
    }
  }

  const generatePDF = async (invoice: Invoice) => {
    try {
      const dateTime = getCurrentDateTime()
      
      toast({
        title: "Generando PDF",
        description: "La factura se está generando...",
      })

      // Crear contenido HTML para PDF (similar al de impresión pero optimizado para PDF)
      const pdfContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Factura ${invoice.invoice_number}</title>
          <style>
            @page {
              margin: 1.5cm;
              size: A4;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.4;
              color: #333;
              margin: 0;
              padding: 0;
              font-size: 12px;
            }
            
            /* ENCABEZADO */
            .header {
              text-align: center;
              border-bottom: 4px solid #1e40af;
              padding-bottom: 20px;
              margin-bottom: 30px;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              padding: 20px;
              border-radius: 8px;
            }
            
            .company-logo {
              font-size: 32px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 8px;
              letter-spacing: 3px;
            }
            
            .invoice-title {
              font-size: 24px;
              color: #374151;
              margin-bottom: 10px;
              font-weight: 600;
            }
            
            .invoice-number {
              font-size: 18px;
              color: #1e40af;
              background-color: #dbeafe;
              padding: 8px 16px;
              border-radius: 20px;
              display: inline-block;
              font-weight: 600;
            }
            
            /* INFORMACIÓN DE LA FACTURA */
            .invoice-info {
              background-color: #f8fafc;
              border: 2px solid #e2e8f0;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 30px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            
            .info-section h3 {
              color: #1e40af;
              font-size: 14px;
              margin-bottom: 10px;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 5px;
            }
            
            .info-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding: 4px 0;
            }
            
            .info-label {
              font-weight: 600;
              color: #475569;
            }
            
            .info-value {
              color: #1e293b;
              font-weight: 500;
            }
            
            /* DETALLES DE LA FACTURA */
            .invoice-details {
              margin-bottom: 40px;
            }
            
            .details-title {
              font-size: 18px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 15px;
              padding: 10px 0;
              border-bottom: 3px solid #e2e8f0;
              background: linear-gradient(90deg, #dbeafe 0%, transparent 100%);
              padding-left: 15px;
            }
            
            .amount-details {
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              border: 2px solid #0ea5e9;
              border-radius: 10px;
              padding: 20px;
              margin: 20px 0;
            }
            
            .amount-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              padding: 8px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .amount-row:last-child {
              border-bottom: none;
              font-weight: bold;
              font-size: 18px;
              color: #1e40af;
              border-top: 2px solid #0ea5e9;
              padding-top: 12px;
              margin-top: 12px;
            }
            
            .total-amount {
              color: #059669 !important;
              font-size: 24px !important;
              font-family: 'Courier New', monospace;
            }
            
            /* PIE DE PÁGINA */
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
              background-color: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
            }
            
            .footer-info {
              font-size: 10px;
              color: #6b7280;
              margin-top: 20px;
            }
            
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              color: white;
              text-transform: uppercase;
            }
            
            .status-paid { background-color: #059669; }
            .status-sent { background-color: #3b82f6; }
            .status-draft { background-color: #6b7280; }
            .status-overdue { background-color: #dc2626; }
            .status-cancelled { background-color: #991b1b; }
            
            @media print {
              .no-print { display: none !important; }
              body { print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <!-- ENCABEZADO -->
          <div class="header">
            <div class="company-logo">🍽️ RESTAURANTE OS</div>
            <div class="invoice-title">FACTURA</div>
            <div class="invoice-number">#${invoice.invoice_number}</div>
          </div>

          <!-- INFORMACIÓN DE LA FACTURA -->
          <div class="invoice-info">
            <div class="info-section">
              <h3>👤 Información del Cliente</h3>
              <div class="info-item">
                <span class="info-label">Nombre:</span>
                <span class="info-value">${invoice.customer_name || 'Cliente General'}</span>
              </div>
              ${invoice.customer_email ? `
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${invoice.customer_email}</span>
              </div>
              ` : ''}
              ${invoice.customer_phone ? `
              <div class="info-item">
                <span class="info-label">Teléfono:</span>
                <span class="info-value">${invoice.customer_phone}</span>
              </div>
              ` : ''}
              ${invoice.customer_address ? `
              <div class="info-item">
                <span class="info-label">Dirección:</span>
                <span class="info-value">${invoice.customer_address}</span>
              </div>
              ` : ''}
            </div>
            <div class="info-section">
              <h3>📋 Información de la Factura</h3>
              <div class="info-item">
                <span class="info-label">Fecha de Emisión:</span>
                <span class="info-value">${new Date(invoice.created_at).toLocaleDateString("es-CO")}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fecha de Vencimiento:</span>
                <span class="info-value">${new Date(invoice.due_date).toLocaleDateString("es-CO")}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Estado:</span>
                <span class="info-value">
                  <span class="status-badge status-${invoice.status}">${getStatusLabel(invoice.status)}</span>
                </span>
              </div>
              ${invoice.orders?.order_number ? `
              <div class="info-item">
                <span class="info-label">Pedido Relacionado:</span>
                <span class="info-value">#${invoice.orders.order_number}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- DETALLES DE LA FACTURA -->
          <div class="invoice-details">
            <div class="details-title">💰 Detalles del Monto</div>
            <div class="amount-details">
              <div class="amount-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(invoice.subtotal)}</span>
              </div>
              <div class="amount-row">
                <span>Impuestos:</span>
                <span>${formatCurrency(invoice.tax)}</span>
              </div>
              <div class="amount-row">
                <span>Descuento:</span>
                <span style="color: #dc2626;">-${formatCurrency(invoice.discount)}</span>
              </div>
              <div class="amount-row">
                <span>Total:</span>
                <span class="total-amount">${formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          <!-- PIE DE PÁGINA -->
          <div class="footer">
            <div class="footer-info">
              <p><strong>🍽️ RESTAURANTE OS</strong> - Sistema de Gestión Integral</p>
              <p>📄 Factura generada el ${dateTime.date} a las ${dateTime.time}</p>
              <p>💰 Moneda: Pesos Colombianos (COP) | 📊 Sistema: RestauranteOS v1.0</p>
              <p>⚠️ Este documento es una representación oficial de la factura</p>
              <p>© ${new Date().getFullYear()} RestauranteOS - Todos los derechos reservados</p>
            </div>
          </div>
        </body>
        </html>
      `

      // Crear blob y descargar
      const blob = new Blob([pdfContent], { type: "text/html;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `factura_${invoice.invoice_number}_${dateTime.timestamp}.html`
      link.click()

      toast({
        title: "✅ PDF Generado Exitosamente",
        description: `Documento profesional descargado. Ábrelo en tu navegador y usa Ctrl+P para imprimir como PDF.`,
        duration: 8000,
      })
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
                  <DropdownMenuItem onClick={() => printInvoice(invoice)}>
                    <Printer className="mr-2 h-4 w-4" /> Imprimir
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => generatePDF(invoice)}>
                    <Download className="mr-2 h-4 w-4" /> Descargar PDF
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
                  <div className="flex justify-between"><span>Impuestos:</span> <span>{formatCurrency(selectedInvoice.tax)}</span></div>
                  <div className="flex justify-between"><span>Descuento:</span> <span className="text-red-500">-{formatCurrency(selectedInvoice.discount)}</span></div>
                  <div className="flex justify-between items-center font-bold text-xl border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => printInvoice(selectedInvoice)}>
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
