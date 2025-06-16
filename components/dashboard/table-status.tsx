"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

export function TableStatus() {
  const tables = [
    { id: 1, name: "Mesa 1", capacity: 4, status: "occupied", customers: 3, time: "45 min" },
    { id: 2, name: "Mesa 2", capacity: 2, status: "available", customers: 0, time: null },
    { id: 3, name: "Mesa 3", capacity: 6, status: "occupied", customers: 5, time: "20 min" },
    { id: 4, name: "Mesa 4", capacity: 4, status: "payment", customers: 4, time: "1h 15min" },
    { id: 5, name: "Mesa 5", capacity: 2, status: "occupied", customers: 2, time: "30 min" },
    { id: 6, name: "Mesa 6", capacity: 8, status: "reserved", customers: 0, time: "19:30" },
    { id: 7, name: "Mesa 7", capacity: 4, status: "occupied", customers: 4, time: "25 min" },
    { id: 8, name: "Mesa 8", capacity: 4, status: "available", customers: 0, time: null },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200"
      case "occupied":
        return "bg-red-100 text-red-800 border-red-200"
      case "reserved":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "payment":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Disponible"
      case "occupied":
        return "Ocupada"
      case "reserved":
        return "Reservada"
      case "payment":
        return "Pagando"
      default:
        return status
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-orange-600" />
          Estado de Mesas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${getStatusColor(table.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{table.name}</span>
                <Badge variant="outline" className="text-xs">
                  {table.capacity} pers
                </Badge>
              </div>
              <div className="text-sm mb-1">
                <Badge className={`text-xs ${getStatusColor(table.status)}`}>{getStatusText(table.status)}</Badge>
              </div>
              {table.status === "occupied" && (
                <div className="text-xs opacity-75">
                  {table.customers}/{table.capacity} • {table.time}
                </div>
              )}
              {table.status === "reserved" && <div className="text-xs opacity-75">Reserva: {table.time}</div>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
