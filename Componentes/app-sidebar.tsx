"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, Component, ReactNode } from "react"
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
  DollarSign,
} from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/Componentes/ui/use-toast"
import { useUserRoleContext } from "@/hooks/UserRoleContext"
import { Skeleton } from "@/Componentes/ui/skeleton"
import { Sheet, SheetContent, SheetTitle } from "@/Componentes/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

// Error Boundary Component
class SidebarErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Sidebar error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center text-red-600">
          <p>Error en la barra lateral</p>
          <Button onClick={() => this.setState({ hasError: false })} variant="outline" className="mt-2">
            Reintentar
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home, roles: ["admin", "cashier", "chef", "waiter"] },
  { href: "/dashboard/tables", label: "Mesas", icon: Coffee, roles: ["admin", "waiter", "cashier"] },
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

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void } = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const { role, loading } = useUserRoleContext()
  const [error, setError] = useState<string | null>(null)

  const isActive = (path: string) => {
    try {
      return pathname === path || pathname.startsWith(`${path}/`)
    } catch (err) {
      console.error("Error checking active path:", err)
      return false
    }
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
      console.error("Error signing out:", error)
      setError("Error al cerrar sesión")
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive",
      })
    }
  }

  const userNavItems = navItems.filter(item => {
    try {
      return role && item.roles.includes(role)
    } catch (err) {
      console.error("Error filtering nav items:", err)
      return false
    }
  })

  // Show loading state if loading
  if (loading) {
    return (
      <div className="relative flex flex-col h-screen min-h-screen">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 font-semibold">
            <Coffee className="h-6 w-6 text-orange-600" />
            <span className="text-xl">RestaurantOS</span>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <nav className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-4 border-t bg-background">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="relative flex flex-col h-screen min-h-screen">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 font-semibold">
            <Coffee className="h-6 w-6 text-orange-600" />
            <span className="text-xl">RestaurantOS</span>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="text-center text-red-600">
            <p>Error: {error}</p>
            <Button 
              onClick={() => setError(null)} 
              variant="outline" 
              className="mt-2"
            >
              Reintentar
            </Button>
          </div>
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

  return (
    <div className="relative flex flex-col h-screen min-h-screen">
      <div className="flex items-center justify-between p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Coffee className="h-6 w-6 text-orange-600" />
          <span className="text-xl">RestaurantOS</span>
        </Link>
      </div>
      <div className="flex-1 p-4 overflow-y-auto flex flex-col">
        <nav className="space-y-2 flex-1">
          {userNavItems.map(item => {
            const Icon = item.icon
            return (
              <Link 
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                  isActive(item.href) ? "bg-orange-100 text-orange-700" : "hover:bg-gray-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 p-2 rounded-md transition-colors hover:bg-gray-100 w-full text-left"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </button>
        </nav>
      </div>
    </div>
  )
}

export function AppSidebar({ isMobileOpen, onMobileClose }: AppSidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 flex-col border-r bg-background fixed top-0 left-0 h-screen z-30">
        <SidebarErrorBoundary>
          <SidebarContent />
        </SidebarErrorBoundary>
      </div>
      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={onMobileClose}>
        <SheetContent 
          side="left" 
          className="w-64 p-0 h-screen flex flex-col" // <-- Asegura altura y layout
          aria-labelledby="sidebar-mobile-title"
        >
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SidebarErrorBoundary>
            <SidebarContent onLinkClick={onMobileClose} />
          </SidebarErrorBoundary>
        </SheetContent>
      </Sheet>
    </>
  );
}
