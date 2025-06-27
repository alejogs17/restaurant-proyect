"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { useToast } from "../ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

interface Product {
  id: number
  name: string
  description: string
  price: number
  category_id: number
  image_url?: string
  active: boolean
  categories?: {
    name: string
  }
}

interface Category {
  id: number
  name: string
}

interface ProductManagementProps {
  searchTerm: string
}

export function ProductManagement({ searchTerm }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: 0,
    category_id: 0
  })
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (showEditDialog) {
      fetchCategories()
    }
  }, [showEditDialog])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories(name)
        `)

      if (error) {
        console.error("Error fetching products:", error)
        throw error
      }

      // Ordenar por nombre en el cliente
      const sortedData = data ? data.sort((a: any, b: any) => a.name.localeCompare(b.name)) : []
      setProducts(sortedData)
    } catch (error: any) {
      console.error("Error in fetchProducts:", error)
      toast({
        title: "Error",
        description: `No se pudieron cargar los productos: ${error.message}`,
        variant: "destructive",
      })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("id, name").eq("active", true).order("name")
      if (error) throw error
      setCategories(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      })
    }
  }

  const toggleProductStatus = async (productId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ active: !currentStatus, updated_at: new Date().toISOString() })
        .eq("id", productId)

      if (error) throw error

      setProducts(
        products.map((product) => (product.id === productId ? { ...product, active: !currentStatus } : product)),
      )

      toast({
        title: "Estado actualizado",
        description: `El producto ha sido ${!currentStatus ? "activado" : "desactivado"}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del producto",
        variant: "destructive",
      })
    }
  }


  const filteredProducts = products
    .filter((product) => product.active || !product.active) // Mostrar todos los productos, activos y desactivados
    .filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

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
              <div className="h-20 bg-gray-200 rounded mb-4" />
              <div className="h-4 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card key={product.id} className={`transition-all hover:shadow-lg ${!product.active ? "opacity-60 bg-gray-200" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{product.categories?.name}</Badge>
                    <Badge variant={product.active ? "default" : "secondary"}>
                      {product.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setProductToEdit(product)
                        setEditForm({
                          name: product.name,
                          description: product.description || '',
                          price: product.price,
                          category_id: product.category_id
                        })
                        setShowEditDialog(true)
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleProductStatus(product.id, product.active)}>
                      {product.active ? (
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
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-orange-600">{formatCurrency(product.price)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!productToEdit) return
              const { error } = await supabase
                .from('products')
                .update({
                  name: editForm.name,
                  description: editForm.description,
                  price: editForm.price,
                  category_id: editForm.category_id
                })
                .eq('id', productToEdit.id)
              if (error) {
                toast({
                  title: 'Error',
                  description: 'No se pudo actualizar el producto',
                  variant: 'destructive',
                })
              } else {
                setShowEditDialog(false)
                setProductToEdit(null)
                fetchProducts()
                toast({
                  title: 'Producto actualizado',
                  description: 'El producto ha sido actualizado correctamente',
                })
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium">Nombre</label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={editForm.name ?? ""}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Descripción</label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={editForm.description ?? ""}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Precio</label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={editForm.price ?? 0}
                onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Categoría</label>
              <Select value={editForm.category_id ? editForm.category_id.toString() : ""} onValueChange={val => setEditForm(f => ({ ...f, category_id: Number(val) }))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
