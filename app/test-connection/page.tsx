"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/Componentes/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"

interface TestResult {
  success: boolean
  error: string | null
  data: any
}

interface TestResults {
  [key: string]: TestResult
}

export default function TestConnectionPage() {
  const [results, setResults] = useState<TestResults>({})
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testBasicConnection = async () => {
    setLoading(true)
    try {
      // Test básico de conexión
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      setResults((prev: TestResults) => ({
        ...prev,
        basic_connection: {
          success: !error,
          error: error?.message || null,
          data: data
        }
      }))
    } catch (error) {
      setResults((prev: TestResults) => ({
        ...prev,
        basic_connection: {
          success: false,
          error: error as string,
          data: null
        }
      }))
    }
    setLoading(false)
  }

  const testOrdersTable = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .limit(1)
      
      setResults((prev: TestResults) => ({
        ...prev,
        orders: {
          success: !error,
          error: error?.message || null,
          data: data
        }
      }))
    } catch (error) {
      setResults((prev: TestResults) => ({
        ...prev,
        orders: {
          success: false,
          error: error as string,
          data: null
        }
      }))
    }
    setLoading(false)
  }

  const testPaymentsTable = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .limit(1)
      
      setResults((prev: TestResults) => ({
        ...prev,
        payments: {
          success: !error,
          error: error?.message || null,
          data: data
        }
      }))
    } catch (error) {
      setResults((prev: TestResults) => ({
        ...prev,
        payments: {
          success: false,
          error: error as string,
          data: null
        }
      }))
    }
    setLoading(false)
  }

  const testInventoryTable = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .limit(1)
      
      setResults((prev: TestResults) => ({
        ...prev,
        inventory_items: {
          success: !error,
          error: error?.message || null,
          data: data
        }
      }))
    } catch (error) {
      setResults((prev: TestResults) => ({
        ...prev,
        inventory_items: {
          success: false,
          error: error as string,
          data: null
        }
      }))
    }
    setLoading(false)
  }

  const testInventoryMovementsTable = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .limit(1)
      
      setResults((prev: TestResults) => ({
        ...prev,
        inventory_movements: {
          success: !error,
          error: error?.message || null,
          data: data
        }
      }))
    } catch (error) {
      setResults((prev: TestResults) => ({
        ...prev,
        inventory_movements: {
          success: false,
          error: error as string,
          data: null
        }
      }))
    }
    setLoading(false)
  }

  const clearResults = () => {
    setResults({})
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Diagnóstico de Base de Datos</h1>
      
      <div className="flex gap-4 flex-wrap">
        <Button onClick={testBasicConnection} disabled={loading}>
          {loading ? "Probando..." : "Test Conexión Básica"}
        </Button>
        <Button onClick={testOrdersTable} disabled={loading} variant="outline">
          {loading ? "Probando..." : "Test Tabla Orders"}
        </Button>
        <Button onClick={testPaymentsTable} disabled={loading} variant="outline">
          {loading ? "Probando..." : "Test Tabla Payments"}
        </Button>
        <Button onClick={testInventoryTable} disabled={loading} variant="outline">
          {loading ? "Probando..." : "Test Tabla Inventory Items"}
        </Button>
        <Button onClick={testInventoryMovementsTable} disabled={loading} variant="outline">
          {loading ? "Probando..." : "Test Tabla Inventory Movements"}
        </Button>
        <Button onClick={clearResults} variant="destructive">
          Limpiar Resultados
        </Button>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="space-y-4">
          {Object.entries(results).map(([testName, result]: [string, TestResult]) => (
            <Card key={testName}>
              <CardHeader>
                <CardTitle className={`text-lg ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testName} - {result.success ? '✅ Éxito' : '❌ Error'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.error && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-red-600">Error:</h4>
                    <pre className="bg-red-50 p-2 rounded text-sm">{JSON.stringify(result.error, null, 2)}</pre>
                  </div>
                )}
                {result.data && (
                  <div>
                    <h4 className="font-semibold text-green-600">Datos:</h4>
                    <pre className="bg-green-50 p-2 rounded text-sm overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Instrucciones:</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>Ejecuta "Test Conexión Básica" para verificar acceso general</li>
          <li>Ejecuta "Test Tabla Orders" para verificar acceso a orders</li>
          <li>Ejecuta "Test Tabla Payments" para verificar acceso a payments</li>
          <li>Ejecuta "Test Tabla Inventory Items" para verificar acceso a la tabla de inventario</li>
          <li>Ejecuta "Test Tabla Inventory Movements" para verificar acceso a la tabla de movimientos de inventario</li>
          <li>Si hay errores, ejecuta el script SQL de corrección</li>
        </ol>
      </div>
    </div>
  )
}
