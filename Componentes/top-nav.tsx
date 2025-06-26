"use client"

import { Bell, Search, Menu } from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { Input } from "@/Componentes/ui/input"
import { Avatar, AvatarFallback } from "@/Componentes/ui/avatar"
import { useUserRole } from "@/hooks/useUserRole"
import { Badge } from "./ui/badge"
import { Skeleton } from "./ui/skeleton"

export function TopNav({ onMobileMenuClick }: { onMobileMenuClick: () => void }) {
  const { role, loading } = useUserRole()

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
          <Button variant="outline" size="icon" className="rounded-full">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>
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
