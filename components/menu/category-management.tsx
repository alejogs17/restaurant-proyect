"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

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

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name")

      if (error) throw error

      setCategories(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      })
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

  const deleteCategory = async (categoryId: number) => {
    try {
      const { error } = await supabase.from("categories").delete().eq("id", categoryId)

      if (error) throw error

      setCategories(categories.filter((category) => category.id !== categoryId))

      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada correctamente",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría",
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
                  <DropdownMenuItem>
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
                  <DropdownMenuItem
                    onClick={() => deleteCategory(category.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
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
  )
}
