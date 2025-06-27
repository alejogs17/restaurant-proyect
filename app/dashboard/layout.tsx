"use client"

import { useState } from "react"
import { AppSidebar } from "@/Componentes/app-sidebar"
import { TopNav } from "@/Componentes/top-nav"
import { DashboardSessionManager } from "@/Componentes/dashboard-session-manager"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen w-full bg-background">
      <AppSidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
      <div className="lg:ml-64 flex flex-col">
        <TopNav onMobileMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
      <DashboardSessionManager />
    </div>
  )
}
