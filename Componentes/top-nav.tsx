"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/Componentes/ui/button"
import { Input } from "@/Componentes/ui/input"
import { Avatar, AvatarFallback } from "@/Componentes/ui/avatar"

export function TopNav() {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4 md:px-6">
        <div className="ml-auto flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search..." className="w-64 rounded-full bg-background pl-8 md:w-80" />
          </div>
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
