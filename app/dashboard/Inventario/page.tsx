"use client"

import { useState, useEffect } from "react"
import { Plus, Search, AlertTriangle } from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { Input } from "@/Componentes/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Componentes/ui/tabs"
import { InventoryList } from "@/Componentes/Inventario/inventory-list"
import { InventoryAlerts } from "@/Componentes/Inventario/inventory-alerts"
import { CreateInventoryItemDialog } from "@/Componentes/Inventario/create-inventory-item-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { createClient } from "@/lib/supabase/client"
import ProtectedRoute from "@/Componentes/ProtectedRoute"

interface InventoryStats {
  total_items: number
  low_stock_count: number
  out_of_stock_count: number
  total_value: number
}

export default function InventarioPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateItem, setShowCreateItem] = useState(false)
  const [inventoryStats, setInventoryStats] = useState<InventoryStats>({
    total_items: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
    total_value: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInventoryStats = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase.rpc("get_inventory_stats")
        
        if (error) {
          console.error("Error fetching inventory stats:", error)
        } else if (data && data.length > 0) {
          setInventoryStats(data[0])
        }
      } catch (error) {
        console.error("Error fetching inventory stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInventoryStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "cashier", "chef"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
            <p className="text-gray-600">Controla el stock de insumos y productos</p>
          </div>
          <Button onClick={() => setShowCreateItem(true)} className="bg-blue-500 hover:bg-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Insumo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Insumos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : inventoryStats.total_items}
              </div>
              <p className="text-xs text-muted-foreground">productos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {loading ? "..." : inventoryStats.low_stock_count}
              </div>
              <p className="text-xs text-muted-foreground">requieren reposición</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {loading ? "..." : inventoryStats.out_of_stock_count}
              </div>
              <p className="text-xs text-muted-foreground">agotados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? "..." : formatCurrency(inventoryStats.total_value)}
              </div>
              <p className="text-xs text-muted-foreground">inventario valorizado</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar insumos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <InventoryList searchTerm={searchTerm} />
          </TabsContent>

          <TabsContent value="alerts">
            <InventoryAlerts />
          </TabsContent>
        </Tabs>

        <CreateInventoryItemDialog open={showCreateItem} onOpenChange={setShowCreateItem} />
      </div>
    </ProtectedRoute>
  )
}
