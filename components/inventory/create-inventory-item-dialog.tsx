"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface CreateInventoryItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const units = [
  { value: "kg", label: "Kilogramos" },
  { value: "g", label: "Gramos" },
  { value: "l", label: "Litros" },
  { value: "ml", label: "Mililitros" },
  { value: "unidad", label: "Unidades" },
  { value: "paquete", label: "Paquetes" },
  { value: "caja", label: "Cajas" },
  { value: "botella", label: "Botellas" },
  { value: "lata", label: "Latas" },
]

export function CreateInventoryItemDialog({ open, onOpenChange }: CreateInventoryItemDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [unit, setUnit] = useState("")
  const [quantity, setQuantity] = useState("")
  const [minQuantity, setMinQuantity] = useState("")
  const [costPerUnit, setCostPerUnit] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("inventory_items").insert([
        {
          name,
          description: description || null,
          unit,
          quantity: Number.parseFloat(quantity),
          min_quantity: Number.parseFloat(minQuantity),
          cost_per_unit: Number.parseFloat(costPerUnit),
        },
      ])

      if (error) throw error

      toast({
        title: "Insumo creado",
        description: `El insumo ${name} ha sido creado correctamente`,
      })

      setName("")
      setDescription("")
      setUnit("")
      setQuantity("")
      setMinQuantity("")
      setCostPerUnit("")
      onOpenChange(false)
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo crear el insumo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Insumo</DialogTitle>
          <DialogDescription>Agrega un nuevo insumo al inventario del restaurante.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre del Insumo</Label>
              <Input
                id="name"
                placeholder="Arroz, Aceite, Pollo, etc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Descripción del insumo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unidad de Medida</Label>
              <Select value={unit} onValueChange={setUnit} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una unidad" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unitOption) => (
                    <SelectItem key={unitOption.value} value={unitOption.value}>
                      {unitOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Cantidad Inicial</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minQuantity">Stock Mínimo</Label>
                <Input
                  id="minQuantity"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="costPerUnit">Costo por Unidad (COP)</Label>
              <Input
                id="costPerUnit"
                type="number"
                step="1"
                min="0"
                placeholder="0"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600">
              {loading ? "Creando..." : "Crear Insumo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
