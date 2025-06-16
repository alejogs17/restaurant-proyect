import { TestSupabaseConnection } from "@/lib/supabase/test-connection"

export default function TestConnectionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Diagnóstico de Conexión</h1>
          <p className="text-gray-600">Verifica que la conexión a Supabase esté funcionando correctamente</p>
        </div>
        <TestSupabaseConnection />
      </div>
    </div>
  )
}
