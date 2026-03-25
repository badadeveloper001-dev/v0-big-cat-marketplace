"use client"

import { useState } from "react"
import { useRole } from "@/lib/role-context"
import { Onboarding } from "./onboarding"
import { BuyerDashboard } from "./buyer-dashboard"
import { MerchantDashboard } from "./merchant-dashboard"
import { MerchantSetup } from "./merchant-setup"
import { MiniWebsiteProfile } from "./mini-website-profile"
import { AdminLogin } from "./admin-login"
import { AdminDashboard } from "./admin-dashboard"

export function MarketplaceApp() {
  const { role, user } = useRole()
  const [adminAuthenticated, setAdminAuthenticated] = useState(false)
  const [showMerchantSetup, setShowMerchantSetup] = useState(false)
  const [merchantProfile, setMerchantProfile] = useState<any>(null)
  const [showMiniWebsite, setShowMiniWebsite] = useState(false)

  // Show onboarding if no role selected
  if (!role) {
    return <Onboarding />
  }

  // Handle merchant setup flow
  if (role === "merchant") {
    // Show setup page if not completed
    if (!user?.merchantProfile?.setup_completed && !showMiniWebsite) {
      return (
        <MerchantSetup
          userId={user?.userId}
          smedanId={user?.merchantProfile?.smedan_id}
          onComplete={(profile) => {
            setShowMiniWebsite(true)
            setMerchantProfile(profile)
          }}
        />
      )
    }

    // Show mini website profile after setup is complete
    if (showMiniWebsite && merchantProfile) {
      return (
        <MiniWebsiteProfile
          profile={merchantProfile}
          isOwner={true}
          onEdit={() => setShowMiniWebsite(false)}
        />
      )
    }
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
