'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface User {
  userId: string
  email: string
  phone?: string
  name?: string
  role: 'buyer' | 'merchant'
  merchantProfile?: any
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
    const stored = localStorage.getItem('userRole')
    const storedUser = localStorage.getItem('userData')

    if (stored) setRoleState(stored)
    if (storedUser) {
      try {
        setUserState(JSON.parse(storedUser))
      } catch {}
    }

    setIsLoading(false)
  }, [])

  const setRole = (newRole: string | null) => {
    setRoleState(newRole)
    if (newRole) {
      localStorage.setItem('userRole', newRole)
    } else {
      localStorage.removeItem('userRole')
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
