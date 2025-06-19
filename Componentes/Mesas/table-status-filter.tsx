"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Componentes/ui/select"

interface TableStatusFilterProps {
  value: string
  onChange: (value: string) => void
}

export function TableStatusFilter({ value, onChange }: TableStatusFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filtrar por estado" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas las mesas</SelectItem>
        <SelectItem value="available">Disponibles</SelectItem>
        <SelectItem value="occupied">Ocupadas</SelectItem>
        <SelectItem value="reserved">Reservadas</SelectItem>
        <SelectItem value="payment">Esperando Pago</SelectItem>
      </SelectContent>
    </Select>
  )
}
