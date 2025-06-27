"use client"

import { useState, useEffect, useCallback } from "react"
import { MoreHorizontal, Package, Calendar, User, Eye, Edit, Trash2, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"
import { Badge } from "@/Componentes/ui/badge"
import { Button } from "@/Componentes/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Componentes/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/Componentes/ui/dialog"
import { Input } from "@/Componentes/ui/input"
import { Label } from "@/Componentes/ui/label"
import { Textarea } from "@/Componentes/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Componentes/ui/select"
import { createClient } from "@/lib/supabase/client"
import { PostgrestError } from "@supabase/supabase-js"
import { CreatePurchaseDialog } from "@/Componentes/Compras/create-purchase-dialog"
import { useToast } from "@/Componentes/ui/use-toast"
import { Skeleton } from "@/Componentes/ui/skeleton"

interface Purchase {
  id: number
  supplier_id?: number
  user_id?: string
  purchase_date: string
  total_amount: number
  notes?: string
  status: "completed" | "pending" | "cancelled"
  suppliers?: { name: string }
  users?: {
    id: string
    profiles: {
      first_name: string
      last_name: string
    }[]
  }
  purchase_items: {
    id: number
    quantity: number
  }[]
}

interface Supplier {
  id: number
  name: string
}

interface PurchaseListProps {
  searchTerm: string
}

interface LoadingState {
  purchases: boolean
  suppliers: boolean
  purchaseItems: boolean
}

interface ErrorState {
  purchases: Error | PostgrestError | null
  suppliers: Error | PostgrestError | null
  purchaseItems: Error | PostgrestError | null
}

interface EditForm {
  supplier_id: number
  status: "completed" | "pending" | "cancelled"
  notes: string
  purchase_date: string
  total_amount: number
}

export function PurchaseList({ searchTerm }: PurchaseListProps) {
  const supabase = createClient()
  const { toast } = useToast()
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [purchaseItems, setPurchaseItems] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [editForm, setEditForm] = useState<EditForm>({
    supplier_id: 0,
    status: "pending",
    notes: "",
    purchase_date: new Date().toISOString().split('T')[0],
    total_amount: 0
  })
  const [loading, setLoading] = useState<LoadingState>({
    purchases: false,
    suppliers: false,
    purchaseItems: false
  })
  const [error, setError] = useState<ErrorState>({
    purchases: null,
    suppliers: null,
    purchaseItems: null
  })

  const refreshPurchases = useCallback(async () => {
    setLoading(prev => ({...prev, purchases: true}))
    setError(prev => ({...prev, purchases: null}))
    
    try {
      const { data: purchasesData, error: purchasesError } = await supabase
        .from("purchases")
        .select(`
          *,
          suppliers (name),
          purchase_items (id, quantity)
        `)
        .order('created_at', { ascending: false })
      
      if (purchasesError) throw purchasesError
      
      const purchasesWithProfiles = await Promise.all(
        (purchasesData || []).map(async (purchase: Omit<Purchase, 'users'>) => {
          if (!purchase.user_id) return purchase
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', purchase.user_id)
            .single()
            
          return {
            ...purchase,
            users: profileData ? {
              id: purchase.user_id,
              profiles: [profileData]
            } : undefined
          }
        })
      )
      
      setPurchases(purchasesWithProfiles)
    } catch (err) {
      alert(`Error fetching purchases: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(prev => ({...prev, purchases: false}))
    }
  }, [supabase])

  useEffect(() => {
    refreshPurchases()
  }, [refreshPurchases])

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(prev => ({...prev, suppliers: true}))
      setError(prev => ({...prev, suppliers: null}))
      
      try {
        const { data, error: fetchError } = await supabase
          .from("suppliers")
          .select("id, name")
        
        if (fetchError) {
          throw fetchError
        }
        
        setSuppliers(data || [])
      } catch (err) {
        alert(`Error fetching suppliers: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setLoading(prev => ({...prev, suppliers: false}))
      }
    }
    
    fetchSuppliers()
  }, [supabase])

  useEffect(() => {
    const fetchPurchaseItems = async () => {
      if (!selectedPurchase || !showDetailsDialog) {
        setPurchaseItems([])
        return
      }
      
      setLoading(prev => ({...prev, purchaseItems: true}))
      setError(prev => ({...prev, purchaseItems: null}))
      
      try {
        const { data, error: fetchError } = await supabase
          .from("purchase_items")
          .select("*, inventory_items(name, unit)")
          .eq("purchase_id", selectedPurchase.id)
        
        if (fetchError) {
          throw fetchError
        }
        
        setPurchaseItems(data || [])
      } catch (err) {
        alert(`Error fetching purchase items: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setLoading(prev => ({...prev, purchaseItems: false}))
      }
    }
    
    fetchPurchaseItems()
  }, [selectedPurchase, showDetailsDialog, supabase])

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

  const getProfileName = (user_id: string | undefined, users?: Purchase['users']) => {
    if (!user_id || !users?.profiles?.[0]) return "Sin usuario"
    const profile = users.profiles[0]
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Sin usuario"
  }

  const handleEditClick = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setEditForm({
      supplier_id: purchase.supplier_id || 0,
      status: purchase.status || "pending",
      notes: purchase.notes || "",
      purchase_date: purchase.purchase_date ? purchase.purchase_date.split('T')[0] : new Date().toISOString().split('T')[0],
      total_amount: purchase.total_amount || 0
    })
    setShowEditDialog(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPurchase) return

    const { error: updateError } = await supabase
      .from("purchases")
      .update({ ...editForm, updated_at: new Date().toISOString() })
      .eq("id", selectedPurchase.id)
    
    if (updateError) {
      alert(`Error updating purchase: ${updateError.message}`)
      return
    }

    setShowEditDialog(false)
    setSelectedPurchase(null)
    refreshPurchases()
  }

  const handleDeleteSubmit = async () => {
    if (!purchaseToDelete) return

    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', purchaseToDelete.id)

      if (error) {
        throw error
      }

      // Si el estado cambia a completed, actualizar inventario
      if (selectedPurchase) {
        const wasCompleted = selectedPurchase.status !== 'completed';
        const willBeCompleted = editForm.status === 'completed';
        if (!wasCompleted && willBeCompleted) {
          // Obtener los productos de la compra
          const { data: purchaseItems, error: itemsError } = await supabase
            .from('purchase_items')
            .select('id, inventory_item_id, quantity')
            .eq('purchase_id', selectedPurchase.id);

          if (itemsError) throw itemsError;

          // Actualizar inventario para cada producto
          for (const item of purchaseItems) {
            console.log('Actualizando inventario:', item.inventory_item_id, item.quantity);
            const { error: inventoryError } = await supabase.rpc('update_inventory_quantity', {
              p_item_id: item.inventory_item_id,
              p_quantity_change: item.quantity
            });
            if (inventoryError) {
              console.error('Error actualizando inventario:', inventoryError);
            }
          }
        }
      }

      toast({
        title: "Compra eliminada",
        description: "La compra ha sido eliminada exitosamente."
      })
      
      refreshPurchases()
      setShowDeleteDialog(false)
      setPurchaseToDelete(null)
    } catch (err) {
      toast({
        title: "Error al eliminar",
        description: err instanceof Error ? err.message : "No se pudo eliminar la compra.",
        variant: "destructive",
      })
    }
  }

  const filteredPurchases = purchases.filter(
    (purchase) =>
      (purchase.suppliers?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (getProfileName(purchase.user_id, purchase.users).toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (purchase.notes && purchase.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading.purchases) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!loading.purchases && filteredPurchases.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron compras</h3>
        <p className="mt-1 text-sm text-gray-500">Intenta ajustar tu búsqueda o crea una nueva compra.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPurchases.map((purchase) => (
          <Card key={purchase.id} className="transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Compra a {purchase.suppliers?.name || 'Proveedor Desconocido'}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(purchase.status)}>
                      {getStatusText(purchase.status)}
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
                    <DropdownMenuItem onClick={() => {
                      setSelectedPurchase(purchase)
                      setShowDetailsDialog(true)
                    }}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditClick(purchase)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => {
                        setPurchaseToDelete(purchase)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {new Date(purchase.purchase_date).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-medium text-green-600">{formatCurrency(purchase.total_amount)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Items</p>
                    <p className="font-medium">
                      {purchase.purchase_items.reduce((acc, item) => acc + item.quantity, 0)} items
                    </p>
                  </div>
                </div>
                {purchase.notes && (
                  <p className="text-xs text-muted-foreground pt-2 border-t">
                    Nota: {purchase.notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPurchase && (
            <>
              <DialogHeader>
                <DialogTitle>Detalles de la Compra #{selectedPurchase.id}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div><strong>Proveedor:</strong> {selectedPurchase.suppliers?.name || "N/A"}</div>
                <div><strong>Fecha:</strong> {new Date(selectedPurchase.purchase_date).toLocaleDateString("es-ES")}</div>
                <div><strong>Total:</strong> {formatCurrency(selectedPurchase.total_amount)}</div>
                <div><strong>Estado:</strong> <Badge className={getStatusColor(selectedPurchase.status)}>{getStatusText(selectedPurchase.status)}</Badge></div>
                <div className="col-span-2"><strong>Registrado por:</strong> {getProfileName(selectedPurchase.user_id, selectedPurchase.users)}</div>
                {selectedPurchase.notes && <div className="col-span-2"><strong>Notas:</strong> {selectedPurchase.notes}</div>}
              </div>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Items Comprados</h4>
                {loading.purchaseItems ? <p>Cargando items...</p> : (
                  <ul className="space-y-2">
                    {purchaseItems.map((item: any) => (
                      <li key={item.id} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>{item.quantity} x {item.inventory_items?.name || 'Item no encontrado'} ({item.inventory_items?.unit})</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Compra</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label htmlFor="supplier_id">Proveedor</Label>
                <Select
                  value={String(editForm.supplier_id)}
                  onValueChange={(value) => setEditForm(prev => ({...prev, supplier_id: Number(value)}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                  <Label htmlFor="purchase_date">Fecha de Compra</Label>
                  <Input 
                      id="purchase_date"
                      type="date" 
                      value={editForm.purchase_date}
                      onChange={e => setEditForm(prev => ({ ...prev, purchase_date: e.target.value }))}
                  />
              </div>
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: "completed" | "pending" | "cancelled") => setEditForm(prev => ({...prev, status: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                      id="notes"
                      value={editForm.notes}
                      onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
              </div>
              <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
                  <Button type="submit">Guardar Cambios</Button>
              </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <p>
            ¿Estás seguro de que quieres eliminar la compra a{" "}
            <strong>{purchaseToDelete?.suppliers?.name || 'este proveedor'}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmit}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
