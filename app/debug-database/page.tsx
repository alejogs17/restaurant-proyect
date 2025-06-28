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

export default function DebugDatabase() {
  const [results, setResults] = useState<TestResults>({})
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testSession = async () => {
    setLoading(true)
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      setResults((prev: TestResults) => ({
        ...prev,
        session: {
          success: !error && !!session,
          error: error?.message || null,
          data: {
            hasSession: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email
          }
        }
      }))
    } catch (error) {
      setResults((prev: TestResults) => ({
        ...prev,
        session: {
          success: false,
          error: error as string,
          data: null
        }
      }))
    }
    setLoading(false)
  }

  const testSimpleQuery = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      setResults((prev: TestResults) => ({
        ...prev,
        simple_query: {
          success: !error,
          error: error?.message || null,
          data: data
        }
      }))
    } catch (error) {
      setResults((prev: TestResults) => ({
        ...prev,
        simple_query: {
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

  const testSalesQuery = async () => {
    setLoading(true)
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      const endDate = new Date()
      
      const { data, error } = await supabase
        .from('orders')
        .select('id, total, created_at, user_id, profiles(first_name, last_name)')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed')
        .limit(5)
      
      setResults((prev: TestResults) => ({
        ...prev,
        sales_query: {
          success: !error,
          error: error?.message || null,
          data: data
        }
      }))
    } catch (error) {
      setResults((prev: TestResults) => ({
        ...prev,
        sales_query: {
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

  const testInventoryFunctions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc("get_inventory_stats")
      
      setResults((prev: TestResults) => ({
        ...prev,
        inventory_stats: {
          success: !error,
          error: error?.message || null,
          data: data
        }
      }))
    } catch (error) {
      setResults((prev: TestResults) => ({
        ...prev,
        inventory_stats: {
          success: false,
          error: error as string,
          data: null
        }
      }))
    }
    setLoading(false)
  }

  const insertTestData = async () => {
    setLoading(true)
    try {
      // Insertar perfil de prueba
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: 'test-user-1',
          first_name: 'Juan',
          last_name: 'Pérez',
          role: 'waiter',
          status: 'active'
        })
        .select()
        .single()
      
      if (profileError) {
        setResults((prev: TestResults) => ({
          ...prev,
          insert_profile: {
            success: false,
            error: profileError?.message || null,
            data: null
          }
        }))
        setLoading(false)
        return
      }

      // Insertar orden de prueba
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          id: 'test-order-1',
          total: 25000,
          status: 'completed',
          user_id: 'test-user-1',
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      setResults((prev: TestResults) => ({
        ...prev,
        insert_data: {
          success: !profileError && !orderError,
          error: profileError?.message || orderError?.message || null,
          data: { profile, order }
        }
      }))
    } catch (error) {
      setResults((prev: TestResults) => ({
        ...prev,
        insert_data: {
          success: false,
          error: error as string,
          data: null
        }
      }))
    }
    setLoading(false)
  }

  const testTableExistence = async () => {
    setLoading(true)
    try {
      // Test para verificar si las tablas existen
      const tables = ['orders', 'payments', 'profiles', 'inventory_items', 'inventory_movements']
      const results: any = {}
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('count')
            .limit(1)
          
          results[table] = {
            exists: !error,
            error: error?.message,
            hasData: data !== null
          }
        } catch (err) {
          results[table] = {
            exists: false,
            error: err,
            hasData: false
          }
        }
      }
      
      setResults(prev => ({
        ...prev,
        table_existence: {
          success: Object.values(results).every((r: any) => r.exists),
          error: null,
          data: results
        }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        table_existence: {
          success: false,
          error: error as string,
          data: null
        }
      }))
    }
    setLoading(false)
  }

  const testRLSPermissions = async () => {
    setLoading(true)
    try {
      // Test para verificar permisos RLS
      const testData = {
        id: 'test-rls-' + Date.now(),
        first_name: 'Test',
        last_name: 'User',
        role: 'waiter',
        status: 'active'
      }
      
      // Intentar insertar un perfil de prueba
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert(testData)
        .select()
        .single()
      
      if (insertError) {
        setResults(prev => ({
          ...prev,
          rls_permissions: {
            success: false,
            error: insertError?.message,
            data: { canInsert: false, error: insertError }
          }
        }))
      } else {
        // Si se insertó correctamente, intentar eliminarlo
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', testData.id)
        
        setResults(prev => ({
          ...prev,
          rls_permissions: {
            success: true,
            error: null,
            data: { 
              canInsert: true, 
              canDelete: !deleteError,
              testData: insertData 
            }
          }
        }))
      }
    } catch (error) {
      setResults(prev => ({
        ...prev,
        rls_permissions: {
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
      <h1 className="text-2xl font-bold">Debug de Base de Datos</h1>
      
      <div className="flex gap-4 flex-wrap">
        <Button onClick={testSession} disabled={loading}>
          {loading ? "Probando..." : "Test Sesión"}
        </Button>
        <Button onClick={testSimpleQuery} disabled={loading} variant="outline">
          {loading ? "Probando..." : "Test Query Simple"}
        </Button>
        <Button onClick={testOrdersTable} disabled={loading} variant="outline">
          {loading ? "Probando..." : "Test Tabla Orders"}
        </Button>
        <Button onClick={testSalesQuery} disabled={loading} variant="outline">
          {loading ? "Probando..." : "Test Query Ventas"}
        </Button>
        <Button onClick={testPaymentsTable} disabled={loading} variant="outline">
          {loading ? "Probando..." : "Test Tabla Payments"}
        </Button>
        <Button onClick={testInventoryFunctions} disabled={loading} variant="outline">
          {loading ? "Probando..." : "Test Funciones Inventario"}
        </Button>
        <Button onClick={insertTestData} disabled={loading} variant="secondary">
          {loading ? "Insertando..." : "Insertar Test Data"}
        </Button>
        <Button onClick={testTableExistence} disabled={loading} variant="outline">
          {loading ? "Probando..." : "Test Tabla Existence"}
        </Button>
        <Button onClick={testRLSPermissions} disabled={loading} variant="outline">
          {loading ? "Probando..." : "Test RLS Permissions"}
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
    </div>
  )
} 