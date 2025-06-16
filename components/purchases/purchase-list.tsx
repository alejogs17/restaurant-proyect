"use client"

import { useState } from "react"
import { MoreHorizontal, Package, Calendar, User, Eye, Edit, Trash2, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Purchase {
  id: number
  supplier: string
  user: string
  date: string
  total: number
  items: number
  status: "completed" | "pending" | "cancelled"
  notes?: string
  details: Array<{
    item: string
    quantity: number
    unit: string
    price: number
    total: number
  }>
}

interface PurchaseListProps {
  searchTerm: string
}

export function PurchaseList({ searchTerm }: PurchaseListProps) {
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  // Datos de ejemplo para compras
  const purchases: Purchase[] = [
    {
      id: 1,
      supplier: "Distribuidora Central S.A.S.",
      user: "María González",
      date: "2024-01-15",
      total: 2450000,
      items: 8,
      status: "completed",
      notes: "Compra mensual de productos básicos",
      details: [
        { item: "Arroz Blanco", quantity: 50, unit: "kg", price: 3500, total: 175000 },
        { item: "Aceite de Girasol", quantity: 20, unit: "l", price: 8500, total: 170000 },
        { item: "Pollo Entero", quantity: 30, unit: "kg", price: 12000, total: 360000 },
        { item: "Carne de Res", quantity: 25, unit: "kg", price: 18000, total: 450000 },
        { item: "Tomate", quantity: 40, unit: "kg", price: 4500, total: 180000 },
        { item: "Lechuga", quantity: 60, unit: "unidad", price: 2500, total: 150000 },
        { item: "Pan Hamburguesa", quantity: 200, unit: "unidad", price: 1500, total: 300000 },
        { item: "Queso Mozzarella", quantity: 15, unit: "kg", price: 15000, total: 225000 },
      ],
    },
    {
      id: 2,
      supplier: "Carnes Premium Ltda.",
      user: "Carlos Rodríguez",
      date: "2024-01-14",
      total: 1850000,
      items: 5,
      status: "completed",
      details: [
        { item: "Carne Premium", quantity: 20, unit: "kg", price: 25000, total: 500000 },
        { item: "Pollo Orgánico", quantity: 15, unit: "kg", price: 18000, total: 270000 },
        { item: "Cerdo", quantity: 12, unit: "kg", price: 22000, total: 264000 },
        { item: "Chorizo Artesanal", quantity: 8, unit: "kg", price: 28000, total: 224000 },
        { item: "Tocino", quantity: 10, unit: "kg", price: 19200, total: 192000 },
      ],
    },
    {
      id: 3,
      supplier: "Frutas y Verduras del Campo",
      user: "Ana Martínez",
      date: "2024-01-13",
      total: 890000,
      items: 12,
      status: "completed",
      details: [
        { item: "Tomate Cherry", quantity: 15, unit: "kg", price: 8000, total: 120000 },
        { item: "Aguacate", quantity: 20, unit: "kg", price: 12000, total: 240000 },
        { item: "Cebolla Blanca", quantity: 25, unit: "kg", price: 3200, total: 80000 },
        { item: "Pimentón", quantity: 10, unit: "kg", price: 6500, total: 65000 },
        { item: "Cilantro", quantity: 5, unit: "kg", price: 15000, total: 75000 },
        { item: "Limón", quantity: 30, unit: "kg", price: 4000, total: 120000 },
      ],
    },
    {
      id: 4,
      supplier: "Lácteos La Pradera",
      user: "Luis Hernández",
      date: "2024-01-12",
      total: 1250000,
      items: 6,
      status: "pending",
      notes: "Pendiente de entrega",
      details: [
        { item: "Leche Entera", quantity: 50, unit: "l", price: 4500, total: 225000 },
        { item: "Queso Campesino", quantity: 20, unit: "kg", price: 18000, total: 360000 },
        { item: "Mantequilla", quantity: 15, unit: "kg", price: 22000, total: 330000 },
        { item: "Crema de Leche", quantity: 25, unit: "l", price: 8500, total: 212500 },
        { item: "Yogurt Natural", quantity: 30, unit: "unidad", price: 4000, total: 120000 },
      ],
    },
    {
      id: 5,
      supplier: "Bebidas El Dorado",
      user: "Patricia Silva",
      date: "2024-01-11",
      total: 980000,
      items: 4,
      status: "completed",
      details: [
        { item: "Cerveza Nacional", quantity: 120, unit: "botella", price: 3200, total: 384000 },
        { item: "Gaseosa Cola", quantity: 80, unit: "lata", price: 2800, total: 224000 },
        { item: "Agua con Gas", quantity: 60, unit: "botella", price: 3500, total: 210000 },
        { item: "Jugo Natural", quantity: 40, unit: "botella", price: 4050, total: 162000 },
      ],
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completada"
      case "pending":
        return "Pendiente"
      case "cancelled":
        return "Cancelada"
      default:
        return status
    }
  }

  const filteredPurchases = purchases.filter(
    (purchase) =>
      purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.notes?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPurchases.map((purchase) => (
          <Card key={purchase.id} className="transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-500" />
                    Compra #{purchase.id}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(purchase.status)}>{getStatusText(purchase.status)}</Badge>
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
                        setSelectedPurchase(purchase)
                        setShowDetailsDialog(true)
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 focus:text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span>{purchase.supplier}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{purchase.user}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(purchase.date).toLocaleDateString("es-ES")}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground">{purchase.items} productos</span>
                  <span className="text-lg font-bold text-orange-600">{formatCurrency(purchase.total)}</span>
                </div>
                {purchase.notes && <p className="text-xs text-muted-foreground line-clamp-2">{purchase.notes}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPurchase && (
            <>
              <DialogHeader>
                <DialogTitle>Compra #{selectedPurchase.id}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Proveedor</p>
                    <p className="font-medium">{selectedPurchase.supplier}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                    <p>{new Date(selectedPurchase.date).toLocaleDateString("es-ES")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Comprador</p>
                    <p>{selectedPurchase.user}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estado</p>
                    <Badge className={getStatusColor(selectedPurchase.status)}>
                      {getStatusText(selectedPurchase.status)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">Productos Comprados</p>
                  <div className="space-y-2">
                    {selectedPurchase.details.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.item}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} {item.unit} × {formatCurrency(item.price)}
                          </p>
                        </div>
                        <p className="font-bold text-orange-600">{formatCurrency(item.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Total de la Compra:</span>
                    <span className="text-2xl font-bold text-orange-600">{formatCurrency(selectedPurchase.total)}</span>
                  </div>
                </div>

                {selectedPurchase.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notas</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedPurchase.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
