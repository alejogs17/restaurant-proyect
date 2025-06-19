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

      // Test 1: Basic connection
      setConnectionStatus({ status: "testing", message: "🔍 Probando conexión básica..." })
      const { data: healthCheck, error: healthError } = await supabase.from("tables").select("count")

      if (healthError) {
        setConnectionStatus({
          status: "error",
          message: `❌ Error de conexión: ${healthError.message}`,
          details: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "..." || "No configurada",
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          },
        })
        return
      }

      setConnectionStatus({ status: "testing", message: "✅ Conexión básica exitosa" })

      // Test 2: Fetch tables
      setConnectionStatus({ status: "testing", message: "📋 Probando consulta de tablas..." })
      const { data: tablesData, error: tablesError } = await supabase.from("tables").select("*")

      if (tablesError) {
        setConnectionStatus({
          status: "error",
          message: `❌ Error al consultar tablas: ${tablesError.message}`,
          details: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "..." || "No configurada",
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          },
        })
        return
      }

      // Limitar a 5 resultados en el cliente
      const limitedTables = tablesData ? tablesData.slice(0, 5) : []
      setConnectionStatus({
        status: "testing",
        message: `✅ Consulta de tablas exitosa (${limitedTables.length} tablas encontradas)`,
        details: {
          tablesCount: limitedTables.length,
          tables: limitedTables.map((table: any) => table.name),
        },
      })

      // Test 3: Check specific tables
      const requiredTables = ["orders", "products", "categories", "tables"]
      setConnectionStatus({ status: "testing", message: "🔍 Verificando tablas requeridas..." })

      for (const tableName of requiredTables) {
        try {
          const { error } = await supabase.from(tableName).select("id").limit(1)
          if (error) {
            setConnectionStatus({
              status: "error",
              message: `❌ Tabla '${tableName}' no encontrada: ${error.message}`,
              details: {
                tableName,
              },
            })
          } else {
            setConnectionStatus({
              status: "testing",
              message: `✅ Tabla '${tableName}' encontrada`,
              details: {
                tableName,
              },
            })
          }
        } catch (error: any) {
          setConnectionStatus({
            status: "error",
            message: `❌ Error al verificar tabla '${tableName}': ${error.message}`,
            details: {
              tableName,
            },
          })
        }
      }

      setConnectionStatus({ status: "success", message: "🎉 Todas las pruebas completadas" })

    } catch (error: any) {
      setConnectionStatus({
        status: "error",
        message: `❌ Error general: ${error.message}`,
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
