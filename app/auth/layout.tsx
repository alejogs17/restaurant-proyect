import type React from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 md:p-0">
      <div className="w-full max-w-md mx-auto">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <div className="flex flex-col items-center pt-8 pb-2">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Image
                src="/placeholder.svg?height=32&width=32"
                alt="Restaurant Logo"
                width={32}
                height={32}
                className="text-white"
              />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              RestaurantOS
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Sistema de gestión restaurante</p>
          </div>
          <CardContent className="px-8 pb-8">{children}</CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">© 2024 RestaurantOS. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}
