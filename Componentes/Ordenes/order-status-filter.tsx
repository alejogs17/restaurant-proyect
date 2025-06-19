"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Componentes/ui/select"

interface OrderStatusFilterProps {
  value: string
  onChange: (value: string) => void
}

export function OrderStatusFilter({ value, onChange }: OrderStatusFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filtrar por estado" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los estados</SelectItem>
        <SelectItem value="pending">Pendientes</SelectItem>
        <SelectItem value="preparing">En Preparación</SelectItem>
        <SelectItem value="ready">Listos</SelectItem>
        <SelectItem value="delivered">Entregados</SelectItem>
        <SelectItem value="completed">Completados</SelectItem>
        <SelectItem value="cancelled">Cancelados</SelectItem>
      </SelectContent>
    </Select>
  )
}
