"use client"

import { useState } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { Input } from "@/Componentes/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Componentes/ui/tabs"
import { OrderList } from "@/Componentes/Ordenes/order-list"
import { CreateOrderDialog } from "@/Componentes/Ordenes/create-order-dialog"
import { OrderStatusFilter } from "@/Componentes/Ordenes/order-status-filter"
import { useIsMounted } from "@/hooks/use-is-mounted"

export default function OrdersPage() {
  const isMounted = useIsMounted();
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  if (!isMounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pedidos</h1>
          <p className="text-muted-foreground">Administra todos los pedidos del restaurante</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Pedido
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar pedidos por número, mesa o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            suppressHydrationWarning
          />
        </div>
        <OrderStatusFilter value={statusFilter} onChange={setStatusFilter} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex overflow-x-auto flex-nowrap whitespace-nowrap gap-2 px-1 no-scrollbar">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="preparing">En preparación</TabsTrigger>
          <TabsTrigger value="ready">Listos</TabsTrigger>
          <TabsTrigger value="delivered">Entregados</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-6">
          <OrderList searchTerm={searchTerm} statusFilter={statusFilter} tabFilter={activeTab} />
        </TabsContent>
      </Tabs>

      <CreateOrderDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  )
}
