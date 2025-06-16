"use client"

import { useState } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PurchaseList } from "@/components/purchases/purchase-list"
import { SupplierList } from "@/components/purchases/supplier-list"
import { CreatePurchaseDialog } from "@/components/purchases/create-purchase-dialog"
import { CreateSupplierDialog } from "@/components/purchases/create-supplier-dialog"

export default function PurchasesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreatePurchase, setShowCreatePurchase] = useState(false)
  const [showCreateSupplier, setShowCreateSupplier] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Compras</h1>
          <p className="text-gray-600">Administra compras y proveedores</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateSupplier(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Button>
          <Button onClick={() => setShowCreatePurchase(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Compra
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar compras o proveedores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Tabs defaultValue="purchases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="purchases">Compras</TabsTrigger>
          <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases">
          <PurchaseList searchTerm={searchTerm} />
        </TabsContent>

        <TabsContent value="suppliers">
          <SupplierList searchTerm={searchTerm} />
        </TabsContent>
      </Tabs>

      <CreatePurchaseDialog open={showCreatePurchase} onOpenChange={setShowCreatePurchase} />

      <CreateSupplierDialog open={showCreateSupplier} onOpenChange={setShowCreateSupplier} />
    </div>
  )
}
