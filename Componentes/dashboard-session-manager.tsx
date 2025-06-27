"use client"

import { useSessionTimeout } from "@/hooks/use-session-timeout"
import { SessionTimeoutWarning } from "@/Componentes/session-timeout-warning"
import { useRouter } from "next/navigation"

export function DashboardSessionManager() {
  const router = useRouter()
  
  // Hook para cerrar sesión por inactividad (30 minutos)
  useSessionTimeout({
    timeoutMinutes: 30,
    onTimeout: () => {
      // Redirigir al login después del timeout
      router.push('/auth/login')
    }
  })
  
  return <SessionTimeoutWarning />
} 