"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Edit, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { Button } from "@/Componentes/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Componentes/ui/dropdown-menu"
import { useToast } from "@/Componentes/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/Componentes/ui/dialog"
import { Input } from "@/Componentes/ui/input"
import { Textarea } from "@/Componentes/ui/textarea"

interface Category {
  id: number
  name: string
  description: string
  active: boolean
  created_at: string
  updated_at: string
}

interface CategoryManagementProps {
  searchTerm: string
}

export function CategoryManagement({ searchTerm }: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  // Estado para edición
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null)
  const [editForm, setEditForm] = useState({ name: "", description: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("categories").select("*")

      if (error) {
        console.error("Error fetching categories:", error)
        throw error
      }

      // Ordenar por nombre en el cliente
      const sortedData = data ? data.sort((a: any, b: any) => a.name.localeCompare(b.name)) : []
      setCategories(sortedData)
    } catch (error: any) {
      console.error("Error in fetchCategories:", error)
      toast({
        title: "Error",
        description: `No se pudieron cargar las categorías: ${error.message}`,
        variant: "destructive",
      })
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const toggleCategoryStatus = async (categoryId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update({ active: !currentStatus, updated_at: new Date().toISOString() })
        .eq("id", categoryId)

      if (error) throw error

      setCategories(
        categories.map((category) => (category.id === categoryId ? { ...category, active: !currentStatus } : category)),
      )

      toast({
        title: "Estado actualizado",
        description: `La categoría ha sido ${!currentStatus ? "activada" : "desactivada"}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la categoría",
        variant: "destructive",
      })
    }
  }

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.map((category) => (
          <Card key={category.id} className={`transition-all hover:shadow-lg ${!category.active ? "opacity-60" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <Badge variant={category.active ? "default" : "secondary"} className="mt-1">
                    {category.active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setCategoryToEdit(category)
                      setEditForm({ name: category.name, description: category.description || "" })
                      setEditDialogOpen(true)
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleCategoryStatus(category.id, category.active)}>
                      {category.active ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Activar
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Diálogo de edición de categoría */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!categoryToEdit) return
              setSaving(true)
              const { error } = await supabase
                .from("categories")
                .update({
                  name: editForm.name,
                  description: editForm.description,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", categoryToEdit.id)
              if (error) {
                toast({
                  title: "Error",
                  description: "No se pudo actualizar la categoría",
                  variant: "destructive",
                })
              } else {
                setEditDialogOpen(false)
                setCategoryToEdit(null)
                fetchCategories()
                toast({
                  title: "Categoría actualizada",
                  description: "La categoría ha sido actualizada correctamente",
                })
              }
              setSaving(false)
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium">Nombre</label>
              <Input
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Descripción</label>
              <Textarea
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
