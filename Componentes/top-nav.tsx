"use client"

import { Bell, Search, Menu } from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { Input } from "@/Componentes/ui/input"
import { Avatar, AvatarFallback } from "@/Componentes/ui/avatar"
import { useUserRole } from "@/hooks/useUserRole"
import { Badge } from "./ui/badge"
import { Skeleton } from "./ui/skeleton"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function TopNav({ onMobileMenuClick }: { onMobileMenuClick: () => void }) {
  const { role, loading } = useUserRole()

  // Estado para alertas de inventario
  const [alertCount, setAlertCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [alertItems, setAlertItems] = useState<{ name: string; quantity: number; min_quantity: number }[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data: lowStock } = await supabase.rpc("get_low_stock_items")
      const { data: outOfStock } = await supabase.rpc("get_out_of_stock_items")
      const low = lowStock || []
      const out = outOfStock || []
      setAlertCount(low.length + out.length)
      setAlertItems([
        ...out.map((item: any) => ({ name: item.name, quantity: 0, min_quantity: item.min_quantity })),
        ...low.map((item: any) => ({ name: item.name, quantity: item.quantity, min_quantity: item.min_quantity }))
      ])
    }
    fetchAlerts()
    // Opcional: suscribirse a cambios en inventario
  }, [])

  const getRoleDisplayName = (roleName: string | null): string | null => {
    if (!roleName) return null
    const translations: { [key: string]: string } = {
      admin: "Administrador",
      cashier: "Cajero",
      chef: "Cocinero",
      waiter: "Mesero",
    }
    return translations[roleName.toLowerCase()] || roleName
  }

  // Nueva función para eliminar una alerta del estado
  const removeAlert = (name: string) => {
    setAlertItems(alertItems.filter(item => item.name !== name))
    setAlertCount(alertCount - 1)
  }

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMobileMenuClick}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
          {loading ? (
            <Skeleton className="h-6 w-20 rounded-md" />
          ) : (
            role && <Badge variant="outline" suppressHydrationWarning>{getRoleDisplayName(role)}</Badge>
          )}
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-64 rounded-lg bg-background pl-8 md:w-80"
              suppressHydrationWarning
            />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="relative">
            <Button variant="outline" size="icon" className="rounded-full" onClick={() => setShowDropdown(!showDropdown)}>
              <Bell className="h-4 w-4" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1.5 py-0.5">{alertCount}</span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
            {showDropdown && alertCount > 0 && (
              <div className="absolute right-0 mt-2 w-72 bg-white border rounded shadow-lg z-50 p-4">
                <div className="font-bold mb-2 text-red-600">Alertas de Inventario</div>
                <ul className="max-h-60 overflow-y-auto divide-y divide-gray-200">
                  {alertItems.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between py-2">
                      <div>
                        <span className="font-semibold">{item.name}</span>
                        <span className="ml-2 text-xs text-gray-500">Stock: {item.quantity} / Mínimo: {item.min_quantity}</span>
                      </div>
                      <button
                        className="ml-2 text-xs text-red-500 hover:text-red-700"
                        onClick={() => removeAlert(item.name)}
                        title="Eliminar notificación"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 text-xs text-gray-500">Revisa el inventario para más detalles.</div>
              </div>
            )}
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <span className="sr-only">User menu</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
