"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Users, Edit, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { Button } from "@/Componentes/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Componentes/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Componentes/ui/dialog"
import { useToast } from "@/Componentes/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

type TableStatus = "available" | "occupied" | "reserved" | "payment"

interface Table {
  id: number
  name: string
  capacity: number
  status: TableStatus
  created_at?: string
  updated_at?: string
}

interface TableManagementProps {
  searchTerm: string
  statusFilter: string
}

export function TableManagement({ searchTerm, statusFilter }: TableManagementProps) {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("tables").select("*")

      if (error) {
        console.error("Error fetching tables:", error)
        throw error
      }

      // Ordenar por nombre en el cliente
      const sortedData = data ? data.sort((a: any, b: any) => a.name.localeCompare(b.name)) : []
      setTables(sortedData)
    } catch (error: any) {
      console.error("Error in fetchTables:", error)
      toast({
        title: "Error",
        description: `No se pudieron cargar las mesas: ${error.message}`,
        variant: "destructive",
      })
      setTables([])
    } finally {
      setLoading(false)
    }
  }

  const updateTableStatus = async (tableId: number, newStatus: TableStatus) => {
    try {
      const { error } = await supabase
        .from("tables")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", tableId)

      if (error) throw error

      setTables(tables.map((table) => (table.id === tableId ? { ...table, status: newStatus } : table)))

      toast({
        title: "Estado actualizado",
        description: `El estado de la mesa ha sido actualizado a ${getStatusLabel(newStatus)}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la mesa",
        variant: "destructive",
      })
    }
  }

  const deleteTable = async (tableId: number) => {
    try {
      const { error } = await supabase.from("tables").delete().eq("id", tableId)

      if (error) throw error

      setTables(tables.filter((table) => table.id !== tableId))

      toast({
        title: "Mesa eliminada",
        description: "La mesa ha sido eliminada correctamente",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la mesa",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case "available":
        return "bg-green-500"
      case "occupied":
        return "bg-amber-500"
      case "reserved":
        return "bg-blue-500"
      case "payment":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: TableStatus) => {
    switch (status) {
      case "available":
        return "Disponible"
      case "occupied":
        return "Ocupada"
      case "reserved":
        return "Reservada"
      case "payment":
        return "Esperando Pago"
      default:
        return "Desconocido"
    }
  }

  const getStatusBadge = (status: TableStatus) => {
    const color = getStatusColor(status).replace("bg-", "")
    return (
      <Badge className={`${getStatusColor(status)} hover:${getStatusColor(status)} text-white`}>
        {getStatusLabel(status)}
      </Badge>
    )
  }

  const filteredTables = tables.filter((table) => {
    const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || table.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-0">
              <div className="h-2 w-full rounded-t-lg bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filteredTables.map((table) => (
          <Card key={table.id} className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg">
            <CardContent className="p-0">
              <div className={`h-2 w-full rounded-t-lg ${getStatusColor(table.status)}`} />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{table.name}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTable(table)
                          setShowDetailsDialog(true)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Ver Detalles
                      </DropdownMenuItem>
                      {table.status === "available" && (
                        <>
                          <DropdownMenuItem onClick={() => updateTableStatus(table.id, "occupied")}>
                            Marcar como Ocupada
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateTableStatus(table.id, "reserved")}>
                            Marcar como Reservada
                          </DropdownMenuItem>
                        </>
                      )}
                      {table.status === "occupied" && (
                        <>
                          <DropdownMenuItem onClick={() => updateTableStatus(table.id, "payment")}>
                            Solicitar Pago
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateTableStatus(table.id, "available")}>
                            Liberar Mesa
                          </DropdownMenuItem>
                        </>
                      )}
                      {table.status === "payment" && (
                        <DropdownMenuItem onClick={() => updateTableStatus(table.id, "available")}>
                          Completar Pago
                        </DropdownMenuItem>
                      )}
                      {table.status === "reserved" && (
                        <>
                          <DropdownMenuItem onClick={() => updateTableStatus(table.id, "occupied")}>
                            Sentar Huéspedes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateTableStatus(table.id, "available")}>
                            Cancelar Reserva
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => deleteTable(table.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <Users className="h-3 w-3" />
                  <span>{table.capacity} personas</span>
                </div>
                {getStatusBadge(table.status)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          {selectedTable && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedTable.name}</span>
                  {getStatusBadge(selectedTable.status)}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Capacidad</p>
                    <p className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {selectedTable.capacity} personas
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estado</p>
                    <p>{getStatusLabel(selectedTable.status)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => updateTableStatus(selectedTable.id, "available")}>Marcar Disponible</Button>
                  <Button variant="outline" onClick={() => updateTableStatus(selectedTable.id, "occupied")}>
                    Marcar Ocupada
                  </Button>
                  <Button variant="outline" onClick={() => updateTableStatus(selectedTable.id, "reserved")}>
                    Marcar Reservada
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
