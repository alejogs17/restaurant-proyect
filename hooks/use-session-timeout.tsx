"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { usePathname } from "next/navigation"

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number
  onTimeout?: () => void
}

export function useSessionTimeout({ 
  timeoutMinutes = 30, 
  onTimeout 
}: UseSessionTimeoutOptions = {}) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const pathname = usePathname()
  const supabase = createClient()

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(async () => {
      try {
        await supabase.auth.signOut()
        console.log("Sesión cerrada por inactividad")
        onTimeout?.()
      } catch (error) {
        console.error("Error al cerrar sesión por inactividad:", error)
      }
    }, timeoutMinutes * 60 * 1000)
  }

  useEffect(() => {
    // Solo activar en páginas del dashboard, no en login o páginas públicas
    const isDashboardPage = pathname?.startsWith('/dashboard')
    const isPublicPage = pathname?.startsWith('/auth') || pathname?.startsWith('/demo-login') || pathname === '/'
    
    if (!isDashboardPage || isPublicPage) {
      return
    }

    const handleActivity = () => {
      resetTimeout()
    }

    // Eventos que indican actividad del usuario
    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
    ]

    // Agregar event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Iniciar el timeout
    resetTimeout()

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [timeoutMinutes, onTimeout, pathname])

  return { resetTimeout }
} 