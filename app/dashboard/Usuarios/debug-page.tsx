"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/Componentes/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/Componentes/ui/card"

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const runDebugTests = async () => {
    setLoading(true)
    const info: any = {}

    try {
      // Test 1: Check session
      const { data: { session } } = await supabase.auth.getSession()
      info.session = {
        exists: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      }

      // Test 2: Try to fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5)

      info.profiles = {
        count: profiles?.length || 0,
        data: profiles,
        error: profilesError
      }

      // Test 3: Try to fetch current user's profile
      if (session?.user?.id) {
        const { data: currentProfile, error: currentProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        info.currentProfile = {
          data: currentProfile,
          error: currentProfileError
        }
      }

      // Test 4: Check RLS status
      const { data: rlsInfo, error: rlsError } = await supabase
        .rpc('get_table_info', { table_name: 'profiles' })
        .catch(() => ({ data: null, error: 'Function not available' }))

      info.rls = {
        data: rlsInfo,
        error: rlsError
      }

    } catch (error) {
      info.generalError = error
    }

    setDebugInfo(info)
    setLoading(false)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Debug Page</h1>
        <Button onClick={runDebugTests} disabled={loading}>
          {loading ? "Running Tests..." : "Run Debug Tests"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            onClick={async () => {
              const { data, error } = await supabase.auth.getSession()
              console.log('Session:', { data, error })
              alert(`Session: ${JSON.stringify({ data, error }, null, 2)}`)
            }}
          >
            Check Session
          </Button>
          
          <Button 
            variant="outline" 
            onClick={async () => {
              const { data, error } = await supabase.from('profiles').select('count')
              console.log('Profiles count:', { data, error })
              alert(`Profiles count: ${JSON.stringify({ data, error }, null, 2)}`)
            }}
          >
            Count Profiles
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 