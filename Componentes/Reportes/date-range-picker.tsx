"use client"

import { useState } from "react"
import { Calendar, CalendarDays } from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { Calendar as CalendarComponent } from "@/Componentes/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/Componentes/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Componentes/ui/select"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
  onDateRangeChange: (startDate: Date, endDate: Date) => void
  className?: string
}

export function DateRangePicker({ onDateRangeChange, className }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [isStartOpen, setIsStartOpen] = useState(false)
  const [isEndOpen, setIsEndOpen] = useState(false)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setStartDate(date)
      if (date > endDate) {
        setEndDate(date)
        onDateRangeChange(date, date)
      } else {
        onDateRangeChange(date, endDate)
      }
      setIsStartOpen(false)
    }
  }

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      setEndDate(date)
      if (date < startDate) {
        setStartDate(date)
        onDateRangeChange(date, date)
      } else {
        onDateRangeChange(startDate, date)
      }
      setIsEndOpen(false)
    }
  }

  const handlePresetChange = (preset: string) => {
    const now = new Date()
    let newStartDate: Date
    let newEndDate = now

    switch (preset) {
      case "today":
        newStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        newEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        break
      case "yesterday":
        newStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        newEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
        break
      case "7days":
        newStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30days":
        newStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "90days":
        newStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case "thisMonth":
        newStartDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "lastMonth":
        newStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        newEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        break
      case "thisYear":
        newStartDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        return
    }

    setStartDate(newStartDate)
    setEndDate(newEndDate)
    onDateRangeChange(newStartDate, newEndDate)
  }

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      {/* Presets rápidos */}
      <div className="flex flex-wrap gap-2">
        <Select onValueChange={handlePresetChange}>
          <SelectTrigger className="w-48">
            <CalendarDays className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Períodos rápidos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoy</SelectItem>
            <SelectItem value="yesterday">Ayer</SelectItem>
            <SelectItem value="7days">Últimos 7 días</SelectItem>
            <SelectItem value="30days">Últimos 30 días</SelectItem>
            <SelectItem value="90days">Últimos 90 días</SelectItem>
            <SelectItem value="thisMonth">Este mes</SelectItem>
            <SelectItem value="lastMonth">Mes pasado</SelectItem>
            <SelectItem value="thisYear">Este año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selección personalizada de fechas */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">Fecha de inicio</label>
          <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {startDate ? formatDate(startDate) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={startDate}
                onSelect={handleStartDateChange}
                disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-700">Fecha de fin</label>
          <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {endDate ? formatDate(endDate) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={endDate}
                onSelect={handleEndDateChange}
                disabled={(date) => date > new Date() || date < startDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Resumen del período seleccionado */}
      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="font-medium text-blue-800 mb-1">Período seleccionado:</div>
        <div>
          Desde: <span className="font-semibold">{formatDate(startDate)}</span> hasta{" "}
          <span className="font-semibold">{formatDate(endDate)}</span>
        </div>
        <div className="text-xs mt-1">
          Total: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} días
        </div>
      </div>
    </div>
  )
}
