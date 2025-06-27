"use client"

import { useAutoLogout } from "@/hooks/use-auto-logout"

export function AutoLogoutHandler() {
  // Solo usar el hook de cierre automático al cerrar la aplicación
  useAutoLogout()
  
  // Este componente no renderiza nada, solo maneja el cierre de sesión
  return null
} 