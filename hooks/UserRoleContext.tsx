"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"

interface UserRoleContextType {
  user: User | null
  role: string | null
  loading: boolean
}

const UserRoleContext = createContext<UserRoleContextType>({
  user: null,
  role: null,
  loading: true,
})

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userRole')
    }
    return null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
            localStorage.setItem('userRole', profile.role)
          } else {
            setRole(null)
            localStorage.removeItem('userRole')
          }
        } else {
          setUser(null)
          setRole(null)
          localStorage.removeItem('userRole')
        }
      } catch (error) {
        setUser(null)
        setRole(null)
        localStorage.removeItem('userRole')
        console.error('Error getting user data:', error)
      } finally {
        setLoading(false)
      }
    }
    getUserData()
    // Puedes agregar un listener a cambios de sesión si lo deseas
    // eslint-disable-next-line
  }, [])

  return (
    <UserRoleContext.Provider value={{ user, role, loading }}>
      {children}
    </UserRoleContext.Provider>
  )
}

export function useUserRoleContext() {
  return useContext(UserRoleContext)
} 