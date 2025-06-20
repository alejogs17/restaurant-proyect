"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export default function TestConnectionPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const runTests = async () => {
    setIsLoading(true)
    const results: any = {}

    try {
      // Test 1: Check session
      const { data: { session } } = await supabase.auth.getSession()
      results.session = {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      }

      // Test 2: Check if profiles table exists and has data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(10)

      results.profiles = {
        count: profiles?.length || 0,
        error: profilesError,
        data: profiles
      }

      // Test 3: Check current user profile
      if (session?.user?.id) {
        const { data: userProfile, error: userProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        results.userProfile = {
          exists: !!userProfile,
          data: userProfile,
          error: userProfileError
        }
      }

      // Test 4: Check RLS policies by trying to insert a test profile
      const { data: insertTest, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: 'test-id-123',
          first_name: 'Test',
          last_name: 'User',
          role: 'waiter',
          status: 'active'
        })

      results.insertTest = {
        success: !insertError,
        error: insertError
      }

      // Clean up test data
      if (!insertError) {
        await supabase
          .from('profiles')
          .delete()
          .eq('id', 'test-id-123')
      }

    } catch (error) {
      results.error = error
    }

    setTestResults(results)
    setIsLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Database Connection</h1>
      
      <button 
        onClick={runTests}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isLoading ? 'Running Tests...' : 'Run Tests'}
      </button>

      {testResults && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
