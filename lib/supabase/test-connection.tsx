"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function TestSupabaseConnection() {
  const [connectionStatus, setConnectionStatus] = useState<{
    status: "idle" | "testing" | "success" | "error"
    message: string
    details?: any
  }>({ status: "idle", message: "Presiona el botón para probar la conexión" })

  const testConnection = async () => {
    setConnectionStatus({ status: "testing", message: "Probando conexión..." })

    try {
      const supabase = createClient()

      // Test 1: Verificar variables de entorno
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!url || !key) {
        throw new Error("Variables de entorno de Supabase no configuradas")
      }

      // Test 2: Probar conexión básica
      const { data: healthCheck, error: healthError } = await supabase.from("tables").select("count").limit(1)

      if (healthError) {
        throw new Error(`Error de conexión: ${healthError.message}`)
      }

      // Test 3: Verificar autenticación
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession()

      if (authError) {
        throw new Error(`Error de autenticación: ${authError.message}`)
      }

      // Test 4: Probar consulta a tabla específica
      const { data: tablesData, error: tablesError } = await supabase.from("tables").select("*").limit(5)

      if (tablesError) {
        throw new Error(`Error consultando tablas: ${tablesError.message}`)
      }

      setConnectionStatus({
        status: "success",
        message: "Conexión exitosa a Supabase",
        details: {
          url: url.substring(0, 30) + "...",
          authenticated: !!session,
          tablesCount: tablesData?.length || 0,
          user: session?.user?.email || "No autenticado",
        },
      })
    } catch (error: any) {
      setConnectionStatus({
        status: "error",
        message: error.message || "Error desconocido",
        details: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "..." || "No configurada",
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
      })
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "testing":
        return <AlertCircle className="h-5 w-5 text-yellow-500 animate-pulse" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = () => {
    switch (connectionStatus.status) {
      case "success":
        return <Badge className="bg-green-500">Conectado</Badge>
      case "error":
        return <Badge className="bg-red-500">Error</Badge>
      case "testing":
        return <Badge className="bg-yellow-500">Probando...</Badge>
      default:
        return <Badge variant="outline">Sin probar</Badge>
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Prueba de Conexión a Supabase
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Estado de la conexión:</span>
          <span
            className={`font-medium ${
              connectionStatus.status === "success"
                ? "text-green-600"
                : connectionStatus.status === "error"
                  ? "text-red-600"
                  : "text-gray-600"
            }`}
          >
            {connectionStatus.message}
          </span>
        </div>

        {connectionStatus.details && (
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <h4 className="font-medium">Detalles:</h4>
            {Object.entries(connectionStatus.details).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>
                <span className="font-mono">{String(value)}</span>
              </div>
            ))}
          </div>
        )}

        <Button onClick={testConnection} disabled={connectionStatus.status === "testing"} className="w-full">
          {connectionStatus.status === "testing" ? "Probando..." : "Probar Conexión"}
        </Button>

        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong>Variables requeridas:</strong>
          </p>
          <p>• NEXT_PUBLIC_SUPABASE_URL</p>
          <p>• NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
        </div>
      </CardContent>
    </Card>
  )
}
