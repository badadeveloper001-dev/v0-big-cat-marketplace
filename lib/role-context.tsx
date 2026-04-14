'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface User {
  userId: string
  email: string
  phone?: string
  name?: string
  role: 'buyer' | 'merchant' | 'agent'
  merchantProfile?: any
  region?: string
}

interface RoleContextType {
  role: string | null
  user: User | null
  setRole: (role: string | null) => void
  setUser: (user: User | null) => void
  isLoading: boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<string | null>(null)
  const [user, setUserState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Read localStorage immediately for a fast first render
    const stored = localStorage.getItem('userRole')
    const storedUser = localStorage.getItem('userData')
    if (stored) setRoleState(stored)
    if (storedUser) {
      try { setUserState(JSON.parse(storedUser)) } catch {}
    }

    // Validate the stored session against Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // No valid session — clear stale localStorage data
        localStorage.removeItem('userRole')
        localStorage.removeItem('userData')
        setRoleState(null)
        setUserState(null)
      }
      setIsLoading(false)
    })

    // Sync logout events across tabs / token expiry
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('userRole')
          localStorage.removeItem('userData')
          setRoleState(null)
          setUserState(null)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const setRole = (newRole: string | null) => {
    setRoleState(newRole)
    if (newRole) {
      localStorage.setItem('userRole', newRole)
    } else {
      localStorage.removeItem('userRole')
      // Sign out from Supabase Auth when clearing role
      createClient().auth.signOut()
    }
  }

  const setUser = (newUser: User | null) => {
    setUserState(newUser)
    if (newUser) {
      localStorage.setItem('userData', JSON.stringify(newUser))
    } else {
      localStorage.removeItem('userData')
    }
  }

  return (
    <RoleContext.Provider value={{ role, user, setRole, setUser, isLoading }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) {
    throw new Error('useRole must be used within RoleProvider')
  }
  return context
}
