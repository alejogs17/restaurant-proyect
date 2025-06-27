"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { usePathname } from "next/navigation"

export function useAutoLogout() {
  const hasLoggedOut = useRef(false)
  const pathname = usePathname()

  useEffect(() => {
    // Solo activar en páginas del dashboard, no en login o páginas públicas
    const isDashboardPage = pathname?.startsWith('/dashboard')
    const isPublicPage = pathname?.startsWith('/auth') || pathname?.startsWith('/demo-login') || pathname === '/'
    
    if (!isDashboardPage || isPublicPage) {
      return
    }

    const supabase = createClient()

    const performLogout = async () => {
      if (hasLoggedOut.current) return
      
      try {
        hasLoggedOut.current = true
        await supabase.auth.signOut()
        console.log("Sesión cerrada automáticamente")
      } catch (error) {
        console.error("Error al cerrar sesión:", error)
      }
    }

    const handleBeforeUnload = () => {
      // Usar sendBeacon para enviar una señal de logout
      if (!hasLoggedOut.current) {
        hasLoggedOut.current = true
        navigator.sendBeacon('/api/auth/logout')
      }
    }

    const handlePageHide = (event: PageTransitionEvent) => {
      // Solo cerrar sesión si la página no se está cacheando
      if (!event.persisted) {
        performLogout()
      }
    }

    const handleUnload = () => {
      performLogout()
    }

    // Agregar event listeners
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("pagehide", handlePageHide)
    window.addEventListener("unload", handleUnload)

    // Cleanup function
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("pagehide", handlePageHide)
      window.removeEventListener("unload", handleUnload)
    }
  }, [pathname])
} 