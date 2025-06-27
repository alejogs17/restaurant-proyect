"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/Componentes/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Componentes/ui/dialog"
import { useSessionTimeout } from "@/hooks/use-session-timeout"
import { createClient } from "@/lib/supabase/client"

interface SessionTimeoutWarningProps {
  warningMinutes?: number
  timeoutMinutes?: number
}

export function SessionTimeoutWarning({ 
  warningMinutes = 5, 
  timeoutMinutes = 30 
}: SessionTimeoutWarningProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(warningMinutes * 60)
  const pathname = usePathname()
  const supabase = createClient()

  // Solo activar en páginas del dashboard
  const isDashboardPage = pathname?.startsWith('/dashboard')
  const isPublicPage = pathname?.startsWith('/auth') || pathname?.startsWith('/demo-login') || pathname === '/'
  
  if (!isDashboardPage || isPublicPage) {
    return null
  }

  const handleExtendSession = async () => {
    try {
      // Refrescar la sesión
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await supabase.auth.refreshSession()
        setShowWarning(false)
        setTimeLeft(warningMinutes * 60)
      }
    } catch (error) {
      console.error("Error al extender la sesión:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  useSessionTimeout({
    timeoutMinutes: timeoutMinutes - warningMinutes, // Mostrar advertencia 5 minutos antes
    onTimeout: () => {
      setShowWarning(true)
    }
  })

  useEffect(() => {
    if (showWarning && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleLogout()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [showWarning, timeLeft])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sesión por expirar</DialogTitle>
          <DialogDescription>
            Tu sesión expirará en {formatTime(timeLeft)} minutos por inactividad.
            ¿Deseas continuar con la sesión activa?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleLogout}>
            Cerrar sesión
          </Button>
          <Button onClick={handleExtendSession}>
            Continuar sesión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 