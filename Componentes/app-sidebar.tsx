"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  ChefHat,
  ClipboardList,
  Coffee,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBasket,
  Users,
  Building,
  DollarSign,
} from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/Componentes/ui/use-toast"
import { useUserRole } from "@/hooks/useUserRole"
import { Skeleton } from "@/Componentes/ui/skeleton"
import { Sheet, SheetContent } from "@/Componentes/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "cashier", "chef", "waiter"] },
  { href: "/dashboard/tables", label: "Mesas", icon: Home, roles: ["admin", "cashier", "chef", "waiter"] },
  { href: "/dashboard/orders", label: "Ordenes", icon: ClipboardList, roles: ["admin", "cashier", "chef", "waiter"] },
  { href: "/dashboard/Facturacion", label: "Facturacion", icon: DollarSign, roles: ["admin", "cashier"] },
  { href: "/dashboard/menu", label: "Menu", icon: Coffee, roles: ["admin", "chef", "waiter", "cashier"] },
  { href: "/dashboard/kitchen", label: "Cocina", icon: ChefHat, roles: ["admin", "chef", "waiter", "cashier"] },
  { href: "/dashboard/inventory", label: "Inventario", icon: Package, roles: ["admin", "chef", "cashier"] },
  { href: "/dashboard/purchases", label: "Compras", icon: ShoppingBasket, roles: ["admin", "cashier"] },
  { href: "/dashboard/reports", label: "Reportes", icon: BarChart3, roles: ["admin"] },
  { href: "/dashboard/users", label: "Usuarios", icon: Users, roles: ["admin"] },
  { href: "/dashboard/settings", label: "Ajustes", icon: Settings, roles: ["admin"] },
]

interface AppSidebarProps {
  isMobileOpen: boolean
  onMobileClose: () => void
}

function SidebarContent() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const { role, loading } = useUserRole()

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      })
      router.push("/auth/login")
    } catch (error) {
      alert("Error signing out: " + (error instanceof Error ? error.message : String(error)))
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      })
    }
  }

  const userNavItems = navItems.filter(item => 
    role && item.roles.includes(role)
  )

  return (
    <div className="relative flex flex-col h-screen min-h-screen">
      <div className="flex items-center justify-between p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Coffee className="h-6 w-6 text-orange-600" />
          <span className="text-xl">RestaurantOS</span>
        </Link>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <nav className="space-y-2">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))
          ) : (
            userNavItems.map(item => {
              const Icon = item.icon
              return (
                <Link 
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                    isActive(item.href) ? "bg-orange-100 text-orange-700" : "hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })
          )}
        </nav>
      </div>
      <div className="absolute bottom-0 left-0 w-full p-4 border-t bg-background">
        <Button
          variant="ghost"
          className="w-full flex items-center gap-2 p-2 rounded-md text-left hover:bg-gray-100 transition-colors"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </Button>
      </div>
    </div>
  )
}

export function AppSidebar({ isMobileOpen, onMobileClose }: AppSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 flex-col border-r bg-background fixed top-0 left-0 h-screen z-30">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={onMobileClose}>
        <SheetContent side="left" className="w-64 p-0">
          <VisuallyHidden>
            <h2 id="sidebar-mobile-title">Menú de navegación</h2>
          </VisuallyHidden>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
