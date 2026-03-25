"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from "react"

export type UserRole = "buyer" | "merchant" | "admin" | null

interface User {
  userId: string
  email: string
  role: UserRole
  phone?: string
  merchantProfile?: any
}

interface RoleContextType {
  role: UserRole
  user: User | null
  setRole: (role: UserRole) => void
  setUser: (user: User | null) => void
  isLoading: boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const storedSession = localStorage.getItem("auth_session")
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession)
        setRole(parsedSession.role)
        setUser(parsedSession.user)
      }
    } catch (error) {
      console.error("[v0] Failed to restore session:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Persist session when role or user changes
  useEffect(() => {
    if (!isLoading) {
      if (role && user) {
        localStorage.setItem("auth_session", JSON.stringify({ role, user }))
      } else {
        localStorage.removeItem("auth_session")
      }
    }
  }, [role, user, isLoading])

  const contextValue: RoleContextType = {
    role,
    user,
    setRole,
    setUser,
    isLoading,
  }

  return (
    <RoleContext.Provider value={contextValue}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return context
}
