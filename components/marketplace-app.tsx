"use client"

import { useState, useEffect } from "react"
import { useRole } from "@/lib/role-context"
import { Onboarding } from "./onboarding"
import { BuyerDashboard } from "./buyer-dashboard"
import { MerchantDashboard } from "./merchant-dashboard"
import { MerchantSetup } from "./merchant-setup"
import { AdminLogin } from "./admin-login"
import { AdminDashboard } from "./admin-dashboard"

export function MarketplaceApp() {
  const { role, user, setUser } = useRole()
  const [adminAuthenticated, setAdminAuthenticated] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)

  // Check if merchant setup is already completed from user data
  useEffect(() => {
    if (user?.merchantProfile?.setup_completed) {
      setSetupComplete(true)
    }
  }, [user])

  // Show onboarding if no role selected
  if (!role) {
    return <Onboarding />
  }

  // Handle merchant setup flow - only show if setup not completed
  const needsSetup = role === "merchant" && !user?.merchantProfile?.setup_completed && !setupComplete
  
  if (needsSetup) {
    return (
      <MerchantSetup
        userId={user?.userId || ""}
        smedanId={user?.merchantProfile?.smedan_id || ""}
        onComplete={(profile) => {
          // Update user context with completed profile
          if (user) {
            setUser({
              ...user,
              merchantProfile: {
                ...user.merchantProfile,
                ...profile,
                setup_completed: true,
              }
            })
          }
          setSetupComplete(true)
        }}
      />
    )
  }

  // Show appropriate dashboard based on role
  switch (role) {
    case "buyer":
      return <BuyerDashboard />
    case "merchant":
      return <MerchantDashboard />
    case "admin":
      if (!adminAuthenticated) {
        return <AdminLogin onSuccess={() => setAdminAuthenticated(true)} />
      }
      return <AdminDashboard />
    default:
      return <Onboarding />
  }
}
