"use client"

import { useState } from "react"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductManagement } from "@/components/menu/product-management"
import { CategoryManagement } from "@/components/menu/category-management"
import { CreateProductDialog } from "@/components/menu/create-product-dialog"
import { CreateCategoryDialog } from "@/components/menu/create-category-dialog"

export default function MenuPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateProductDialog, setShowCreateProductDialog] = useState(false)
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("products")

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Menú</h1>
          <p className="text-muted-foreground">Administra productos, categorías y precios del menú</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCreateCategoryDialog(true)}
            className="border-orange-500 text-orange-600 hover:bg-orange-50"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Button>
          <Button onClick={() => setShowCreateProductDialog(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar productos o categorías..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-6">
          <ProductManagement searchTerm={searchTerm} />
        </TabsContent>
        <TabsContent value="categories" className="mt-6">
          <CategoryManagement searchTerm={searchTerm} />
        </TabsContent>
      </Tabs>

      <CreateProductDialog open={showCreateProductDialog} onOpenChange={setShowCreateProductDialog} />
      <CreateCategoryDialog open={showCreateCategoryDialog} onOpenChange={setShowCreateCategoryDialog} />
    </div>
  )
}
