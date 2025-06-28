"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export function useUserRole() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const getUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUser(session.user)
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          
          if (profile) {
            setRole(profile.role)
          }
        }
      } catch (error) {
        console.error('Error getting user data:', error)
      } finally {
        setLoading(false)
      }
    }

    getUserData()
  }, [supabase])

  // Return consistent values during SSR
  if (!mounted) {
    return { user: null, role: null, loading: true }
  }

  return { user, role, loading }
} 