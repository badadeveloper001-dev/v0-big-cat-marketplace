"use client"

import { useState } from "react"
import { useRole } from "@/lib/role-context"
import { Onboarding } from "./onboarding"
import { BuyerDashboard } from "./buyer-dashboard"
import { MerchantDashboard } from "./merchant-dashboard"
import { AdminLogin } from "./admin-login"
import { AdminDashboard } from "./admin-dashboard"

export function MarketplaceApp() {
  const { role } = useRole()
  const [adminAuthenticated, setAdminAuthenticated] = useState(false)

  // Show onboarding if no role selected
  if (!role) {
    return <Onboarding />
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
