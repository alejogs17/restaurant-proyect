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
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface CreateTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTableDialog({ open, onOpenChange }: CreateTableDialogProps) {
  const [name, setName] = useState("")
  const [capacity, setCapacity] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("tables").insert([
        {
          name,
          capacity: Number.parseInt(capacity),
          status: "available",
        },
      ])

      if (error) throw error

      toast({
        title: "Mesa creada",
        description: `La mesa ${name} ha sido creada correctamente`,
      })

      setName("")
      setCapacity("")
      onOpenChange(false)
      window.location.reload() // Recargar para mostrar la nueva mesa
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo crear la mesa",
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
          <DialogTitle>Crear Nueva Mesa</DialogTitle>
          <DialogDescription>
            Agrega una nueva mesa al restaurante. Completa la información requerida.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre de la Mesa</Label>
              <Input
                id="name"
                placeholder="Mesa 1, Mesa VIP, etc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacidad (personas)</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="20"
                placeholder="4"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600">
              {loading ? "Creando..." : "Crear Mesa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
