import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/Componentes/theme-provider"
import { SidebarProvider } from "@/Componentes/ui/sidebar"
import { Toaster } from "@/Componentes/ui/toaster"
import { AutoLogoutHandler } from "@/Componentes/auto-logout-handler"
import { UserRoleProvider } from "@/hooks/UserRoleContext"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Restaurant Management System",
  description: "Complete restaurant management solution",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <SidebarProvider>
            <UserRoleProvider>
              <AutoLogoutHandler />
              {children}
              <Toaster />
            </UserRoleProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
