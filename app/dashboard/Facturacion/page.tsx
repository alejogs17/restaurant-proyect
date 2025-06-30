"use client"

import { useState } from "react"
import { Plus, Search, FileText, CreditCard } from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { Input } from "@/Componentes/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Componentes/ui/tabs"
import { InvoiceList } from "@/Componentes/billing/invoice-list"
import { PaymentList } from "@/Componentes/billing/payment-list"
import { CreateInvoiceDialog } from "@/Componentes/billing/create-invoice-dialog"
import { PaymentMethodStats } from "@/Componentes/billing/payment-method-stats"
import ProtectedRoute from "@/Componentes/ProtectedRoute"

export default function FacturacionPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("invoices")

  return (
    <ProtectedRoute allowedRoles={["admin", "cashier"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Facturación y Pagos</h1>
            <p className="text-muted-foreground">Gestiona facturas, pagos y métodos de pago</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Factura
          </Button>
        </div>

        <PaymentMethodStats />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar facturas o pagos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Facturas
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pagos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="invoices" className="mt-6">
            <InvoiceList searchTerm={searchTerm} />
          </TabsContent>
          <TabsContent value="payments" className="mt-6">
            <PaymentList searchTerm={searchTerm} />
          </TabsContent>
        </Tabs>

        <CreateInvoiceDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      </div>
    </ProtectedRoute>
  )
}
