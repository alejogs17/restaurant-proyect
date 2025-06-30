"use client"

import { useState } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { Input } from "@/Componentes/ui/input"
import { TableManagement } from "@/Componentes/Mesas/table-management"
import { CreateTableDialog } from "@/Componentes/Mesas/create-table-dialog"
import { TableStatusFilter } from "@/Componentes/Mesas/table-status-filter"
import { useIsMounted } from "@/hooks/use-is-mounted"
import ProtectedRoute from "@/Componentes/ProtectedRoute"

export default function TablesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const isMounted = useIsMounted()

  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Mesas</h1>
            <p className="text-muted-foreground">Administra las mesas del restaurante y su estado</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Mesa
          </Button>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar mesas..."
              className="pl-10"
              disabled
            />
          </div>
          <div className="w-[180px] h-10 bg-gray-100 rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "cashier", "chef", "waiter"]}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Mesas</h1>
            <p className="text-muted-foreground">Administra las mesas del restaurante y su estado</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Mesa
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar mesas..."
              value={searchTerm ?? ""}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <TableStatusFilter value={statusFilter} onChange={setStatusFilter} />
        </div>

        <TableManagement searchTerm={searchTerm} statusFilter={statusFilter} />

        <CreateTableDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      </div>
    </ProtectedRoute>
  )
}
