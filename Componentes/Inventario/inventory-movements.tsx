"use client"

import { useState, useEffect } from "react"
import { ArrowUp, ArrowDown, Package, Calendar } from "lucide-react"
import { Card, CardContent } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Componentes/ui/select"
import { useToast } from "@/Componentes/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface InventoryMovement {
  id: number
  inventory_item_id: number
  movement_type: "in" | "out"
  quantity: number
  reason: string
  reference_id?: string
  created_at: string
  inventory_items: {
    name: string
    unit: string
  }
}

export function InventoryMovements() {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "in" | "out">("all")
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchMovements()
  }, [])

  const fetchMovements = async () => {
    try {
      // Note: This would require creating an inventory_movements table
      // For now, we'll show a placeholder
      setMovements([])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los movimientos de inventario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getMovementIcon = (type: "in" | "out") => {
    return type === "in" ? (
      <ArrowUp className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowDown className="h-4 w-4 text-red-500" />
    )
  }

  const getMovementBadge = (type: "in" | "out") => {
    return type === "in" ? (
      <Badge className="bg-green-500 hover:bg-green-500 text-white">Entrada</Badge>
    ) : (
      <Badge className="bg-red-500 hover:bg-red-500 text-white">Salida</Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Historial de Movimientos</h3>
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los movimientos</SelectItem>
            <SelectItem value="in">Solo entradas</SelectItem>
            <SelectItem value="out">Solo salidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {movements.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay movimientos registrados</h3>
            <p className="text-gray-500">Los movimientos de inventario aparecerán aquí cuando se registren.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {movements.map((movement) => (
            <Card key={movement.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getMovementIcon(movement.movement_type)}
                    <div>
                      <p className="font-medium">{movement.inventory_items.name}</p>
                      <p className="text-sm text-muted-foreground">{movement.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      {getMovementBadge(movement.movement_type)}
                      <span className="font-medium">
                        {movement.quantity} {movement.inventory_items.unit}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(movement.created_at).toLocaleString("es-ES")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
