"use client"

import { useState, useEffect, useRef } from "react"
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
import { createClient } from "@/lib/supabase/client"

interface SessionTimeoutWarningProps {
  warningMinutes?: number
  timeoutMinutes?: number
}

export function SessionTimeoutWarning({ 
  warningMinutes = 30, 
  timeoutMinutes = 120 
}: SessionTimeoutWarningProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(warningMinutes * 60)
  const pathname = usePathname()
  const supabase = createClient()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const warningTimeoutRef = useRef<NodeJS.Timeout>()

  // Solo activar en páginas del dashboard
  const isDashboardPage = pathname?.startsWith('/dashboard')
  const isPublicPage = pathname?.startsWith('/auth') || pathname?.startsWith('/demo-login') || pathname === '/'
  
  if (!isDashboardPage || isPublicPage) {
    return null
  }

  const resetTimers = () => {
    // Limpiar timers existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
    }
    
    // Ocultar advertencia si está visible
    setShowWarning(false)
    setTimeLeft(warningMinutes * 60)

    // Configurar timer de advertencia (timeoutMinutes - warningMinutes antes del logout)
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true)
    }, (timeoutMinutes - warningMinutes) * 60 * 1000)

    // Configurar timer de logout
    timeoutRef.current = setTimeout(async () => {
      try {
        await supabase.auth.signOut()
        console.log("Sesión cerrada por inactividad")
      } catch (error) {
        console.error("Error al cerrar sesión por inactividad:", error)
      }
    }, timeoutMinutes * 60 * 1000)
  }

  const handleExtendSession = async () => {
    try {
      // Refrescar la sesión
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await supabase.auth.refreshSession()
        resetTimers() // Reiniciar todos los timers
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

  useEffect(() => {
    const handleActivity = () => {
      resetTimers()
    }

    // Eventos que indican actividad del usuario
    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
    ]

    // Agregar event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Iniciar los timers
    resetTimers()

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [timeoutMinutes, warningMinutes])

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
            Tu sesión expirará en {formatTime(timeLeft)} por inactividad.
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