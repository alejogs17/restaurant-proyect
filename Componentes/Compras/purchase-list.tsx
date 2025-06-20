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

  const handleError = (err: unknown, type: keyof ErrorState) => {
    console.error(`Error fetching ${type}:`, err)
    if (err instanceof Error || (err && typeof err === 'object' && 'message' in err)) {
      setError(prev => ({...prev, [type]: err as Error | PostgrestError}))
    }
  }

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
      handleError(err, 'purchases')
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
        handleError(err, 'suppliers')
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
        handleError(err, 'purchaseItems')
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

    try {
      const wasCompleted = selectedPurchase.status === "completed"
      const willBeCompleted = editForm.status === "completed"
      
      // Update purchase
      const { data, error } = await supabase
        .from('purchases')
        .update({
          supplier_id: editForm.supplier_id,
          status: editForm.status,
          notes: editForm.notes,
          purchase_date: editForm.purchase_date,
          total_amount: editForm.total_amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPurchase.id)
        .select()

      if (error) {
        throw error
      }

      // If status is changing to completed, update inventory
      if (!wasCompleted && willBeCompleted) {
        console.log('Changing status to completed, will update inventory')

        // Verificar permisos del usuario
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          console.error('Session error:', sessionError)
          toast({
            title: "Error",
            description: "No tienes permisos para actualizar el inventario. Por favor, inicia sesión nuevamente.",
            variant: "destructive",
          })
          return
        }

        // Verificar rol del usuario
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profileError || !userProfile) {
          console.error('Profile error:', profileError)
          toast({
            title: "Error",
            description: "No se pudo verificar tus permisos. Por favor, contacta al administrador.",
            variant: "destructive",
          })
          return
        }

        if (!['admin', 'cashier'].includes(userProfile.role)) {
          console.error('Unauthorized role:', userProfile.role)
          toast({
            title: "Error",
            description: "No tienes los permisos necesarios para actualizar el inventario.",
            variant: "destructive",
          })
          return
        }

        // Get purchase items
        const { data: purchaseItems, error: itemsError } = await supabase
          .from('purchase_items')
          .select(`
            id,
            inventory_item_id,
            quantity,
            unit_price,
            total_price
          `)
          .eq('purchase_id', selectedPurchase.id)

        if (itemsError) {
          throw itemsError
        }

        // Update inventory for each item
        console.log('Starting inventory update process...')
        console.log('Purchase items to process:', purchaseItems)

        for (const item of purchaseItems) {
          console.log('Processing item:', {
            raw_item: item,
            inventory_item_id: item?.inventory_item_id,
            quantity: item?.quantity,
            typeof_id: typeof item?.inventory_item_id,
            typeof_quantity: typeof item?.quantity
          })

          if (!item?.inventory_item_id || !item?.quantity) {
            console.error("Item data is incomplete:", {
              item,
              has_id: !!item?.inventory_item_id,
              has_quantity: !!item?.quantity
            })
            continue
          }

          try {
            const itemId = parseInt(item.inventory_item_id.toString())
            const quantityChange = parseFloat(item.quantity.toString())

            console.log('Calling update_inventory_quantity with:', {
              itemId,
              quantityChange,
              typeof_itemId: typeof itemId,
              typeof_quantityChange: typeof quantityChange
            })

            const { data: updateResult, error: inventoryError } = await supabase.rpc(
              "update_inventory_quantity",
              {
                p_item_id: itemId,
                p_quantity_change: quantityChange
              }
            )

            console.log('Update result:', { updateResult, inventoryError })

            if (inventoryError) {
              console.error("--- DETAILED INVENTORY UPDATE ERROR ---");
              console.error("Timestamp:", new Date().toISOString());
              console.error("Item being processed:", JSON.stringify(item, null, 2));
              console.error("Parsed values:", { itemId, quantityChange });
              console.error("Full inventoryError object:", JSON.stringify(inventoryError, null, 2));
              console.error("Error message:", inventoryError.message);
              console.error("Error code:", inventoryError.code);
              console.error("Error details:", inventoryError.details);
              console.error("Error hint:", inventoryError.hint);
              console.error("--- END OF ERROR REPORT ---");

              toast({
                title: "Error de Inventario",
                description: `Error al actualizar item ${itemId}: ${inventoryError.message}`,
                variant: "destructive",
              })
            } else {
              console.log('Inventory updated successfully:', {
                itemId,
                quantityChange,
                result: updateResult
              })
            }
          } catch (error) {
            console.error('Error processing inventory update:', {
              error,
              item,
              error_message: error instanceof Error ? error.message : 'Unknown error'
            })
            
            toast({
              title: "Error de Inventario",
              description: "Error al procesar la actualización del inventario",
              variant: "destructive",
            })
          }
        }
      }

      setPurchases(purchases.map(p => 
        p.id === selectedPurchase.id ? { ...p, ...data[0] } : p
      ))
      setShowEditDialog(false)
      setSelectedPurchase(null)
      setEditForm({
        supplier_id: 0,
        status: "pending",
        notes: "",
        purchase_date: new Date().toISOString().split('T')[0],
        total_amount: 0
      })

      toast({
        title: "Compra actualizada",
        description: willBeCompleted ? "La compra se ha completado y el inventario ha sido actualizado" : "La compra ha sido actualizada",
      })
    } catch (err) {
      console.error('Error updating purchase:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al actualizar la compra",
        variant: "destructive",
      })
    }
  }

  const filteredPurchases = purchases.filter(
    (purchase) =>
      (purchase.suppliers?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (getProfileName(purchase.user_id, purchase.users).toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (purchase.notes?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  )

  return (
    <>
      {error.purchases && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">
          Error al cargar compras: {error.purchases.message || error.purchases.toString()}
        </div>
      )}

      {error.suppliers && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">
          Error al cargar proveedores: {error.suppliers.message || error.suppliers.toString()}
        </div>
      )}

      {error.purchaseItems && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">
          Error al cargar detalles: {error.purchaseItems.message || error.purchaseItems.toString()}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading.purchases ? (
          <div className="col-span-3 text-center p-8">Cargando compras...</div>
        ) : filteredPurchases.length === 0 ? (
          <div className="col-span-3 text-center p-8">No se encontraron compras</div>
        ) : (
          filteredPurchases.map((purchase) => (
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
                      <DropdownMenuItem onClick={() => handleEditClick(purchase)}>
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
                    <span>{purchase.suppliers?.name || "Sin proveedor"}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User  className="h-3 w-3" />
                    <span>{getProfileName(purchase.user_id, purchase.users)}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                    <span>{new Date(purchase.purchase_date).toLocaleDateString("es-ES")}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted-foreground">
                      {purchase.purchase_items?.length || 0} productos
                    </span>
                    <span className="text-lg font-bold text-orange-600">{formatCurrency(purchase.total_amount)}</span>
                </div>
                {purchase.notes && <p className="text-xs text-muted-foreground line-clamp-2">{purchase.notes}</p>}
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Dialog de Detalles */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPurchase && (
            <>
              <DialogHeader>
                <DialogTitle>Compra #{selectedPurchase.id}</DialogTitle>
              </DialogHeader>
              {loading.purchaseItems ? (
                <div className="p-8 text-center">Cargando detalles...</div>
              ) : error.purchaseItems ? (
                <div className="p-4 bg-red-100 text-red-800 rounded">
                  Error al cargar detalles: {error.purchaseItems.message || error.purchaseItems.toString()}
                </div>
              ) : (
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Proveedor</p>
                      <p className="font-medium">{selectedPurchase.suppliers?.name || "Sin proveedor"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                      <p>{new Date(selectedPurchase.purchase_date).toLocaleDateString("es-ES")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Comprador</p>
                      <p>{getProfileName(selectedPurchase.user_id, selectedPurchase.users)}</p>
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
                      {purchaseItems.length === 0 ? (
                        <p>No hay productos comprados para esta compra.</p>
                      ) : (
                        purchaseItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between">
                            <span>{item.inventory_items.name} - {item.quantity} {item.inventory_items.unit}</span>
                            <span>{formatCurrency(item.total_price)}</span>
                        </div>
                        ))
                      )}
                </div>
                  </div>
                  </div>
                )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Edición */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Compra #{selectedPurchase?.id}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label>Proveedor</Label>
              <select
                className="w-full p-2 border rounded"
                value={editForm.supplier_id || ""}
                onChange={(e) => setEditForm({ ...editForm, supplier_id: Number(e.target.value) || 0 })}
                required
              >
                <option value="">Seleccionar proveedor</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Estado</Label>
              <select
                className="w-full p-2 border rounded"
                value={editForm.status || "pending"}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "completed" | "pending" | "cancelled" })}
                required
              >
                <option value="pending">Pendiente</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>

            <div>
              <Label>Fecha de Compra</Label>
              <Input
                type="date"
                value={editForm.purchase_date || new Date().toISOString().split('T')[0]}
                onChange={(e) => setEditForm({ ...editForm, purchase_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Monto Total</Label>
              <Input
                type="number"
                value={editForm.total_amount || 0}
                onChange={(e) => setEditForm({ ...editForm, total_amount: Number(e.target.value) || 0 })}
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label>Notas</Label>
              <textarea
                className="w-full p-2 border rounded"
                value={editForm.notes || ""}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
