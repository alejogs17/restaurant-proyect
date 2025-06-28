"use client"

import { SessionTimeoutWarning } from "@/Componentes/session-timeout-warning"

export function DashboardSessionManager() {
  return <SessionTimeoutWarning warningMinutes={30} timeoutMinutes={120} />
} 