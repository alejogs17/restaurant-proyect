"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
} from "lucide-react"
import { Button } from "@/Componentes/ui/button"

export function AppSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="flex items-center justify-between p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Coffee className="h-6 w-6" />
          <span className="text-xl">RestaurantOS</span>
        </Link>
      </div>
      <div className="p-4">
        <nav className="space-y-2">
          <Link 
            href="/dashboard"
            className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
              isActive("/dashboard") ? "bg-orange-100 text-orange-700" : "hover:bg-gray-100"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link 
            href="/dashboard/tables"
            className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
              isActive("/dashboard/tables") ? "bg-orange-100 text-orange-700" : "hover:bg-gray-100"
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Tables</span>
          </Link>
          <Link 
            href="/dashboard/orders"
            className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
              isActive("/dashboard/orders") ? "bg-orange-100 text-orange-700" : "hover:bg-gray-100"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Orders</span>
          </Link>
          <Link 
            href="/dashboard/menu"
            className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
              isActive("/dashboard/menu") ? "bg-orange-100 text-orange-700" : "hover:bg-gray-100"
            }`}
          >
            <Coffee className="h-4 w-4" />
            <span>Menu</span>
          </Link>
          <Link 
            href="/dashboard/kitchen"
            className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
              isActive("/dashboard/kitchen") ? "bg-orange-100 text-orange-700" : "hover:bg-gray-100"
            }`}
          >
            <ChefHat className="h-4 w-4" />
            <span>Kitchen</span>
          </Link>
          <Link 
            href="/dashboard/inventory"
            className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
              isActive("/dashboard/inventory") ? "bg-orange-100 text-orange-700" : "hover:bg-gray-100"
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Inventory</span>
          </Link>
          <Link 
            href="/dashboard/purchases"
            className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
              isActive("/dashboard/purchases") ? "bg-orange-100 text-orange-700" : "hover:bg-gray-100"
            }`}
          >
            <ShoppingBasket className="h-4 w-4" />
            <span>Purchases</span>
          </Link>
          <Link 
            href="/dashboard/reports"
            className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
              isActive("/dashboard/reports") ? "bg-orange-100 text-orange-700" : "hover:bg-gray-100"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Reports</span>
          </Link>
          <Link 
            href="/dashboard/users"
            className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
              isActive("/dashboard/users") ? "bg-orange-100 text-orange-700" : "hover:bg-gray-100"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Users</span>
          </Link>
          <Link 
            href="/dashboard/settings"
            className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
              isActive("/dashboard/settings") ? "bg-orange-100 text-orange-700" : "hover:bg-gray-100"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full justify-start">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  )
}
