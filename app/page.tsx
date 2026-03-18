"use client"

import { RoleProvider } from "@/lib/role-context"
import { MarketplaceApp } from "@/components/marketplace-app"

export default function Home() {
  return (
    <RoleProvider>
      <MarketplaceApp />
    </RoleProvider>
  )
}
