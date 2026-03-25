"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Clock, XCircle, BarChart3, Users } from "lucide-react"

export function SmedanAdminDashboard() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [merchants, setMerchants] = useState([
    {
      id: "1",
      name: "Tech Solutions Ltd",
      businessType: "Electronics & Tech",
      smedanId: "SMEDAN-2024-001",
      status: "pending",
    },
    {
      id: "2",
      name: "Fashion Forward",
      businessType: "Fashion & Apparel",
      smedanId: "SMEDAN-2024-002",
      status: "approved",
    },
    {
      id: "3",
      name: "Food & Beverages Co",
      businessType: "Food & Beverage",
      smedanId: "SMEDAN-2024-003",
      status: "pending",
    },
  ])

  useEffect(() => {
    const adminAccess = sessionStorage.getItem("adminAccess")
    if (adminAccess === "SMEDAN_123") {
      setIsAuthorized(true)
    } else {
      router.push("/")
    }
  }, [router])

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: "Total Merchants",
      value: merchants.length,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Pending Verification",
      value: merchants.filter((m) => m.status === "pending").length,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      label: "Approved Merchants",
      value: merchants.filter((m) => m.status === "approved").length,
      icon: CheckCircle2,
      color: "bg-green-100 text-green-600",
    },
  ]

  const handleApprove = (id: string) => {
    setMerchants(
      merchants.map((m) => (m.id === id ? { ...m, status: "approved" } : m))
    )
  }

  const handleReject = (id: string) => {
    setMerchants(merchants.filter((m) => m.id !== id))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar & Header */}
      <div className="border-b border-border">
        <div className="flex items-center gap-4 p-6 max-w-7xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">SMEDAN Admin</h1>
            <p className="text-sm text-muted-foreground">Merchant Verification Dashboard</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Merchants Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="font-bold text-lg text-foreground">Merchants</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 font-semibold text-sm text-foreground">
                    Business Name
                  </th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground">
                    Type
                  </th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground">
                    SMEDAN ID
                  </th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground">
                    Status
                  </th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((merchant) => (
                  <tr key={merchant.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-4 text-sm text-foreground font-medium">
                      {merchant.name}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {merchant.businessType}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {merchant.smedanId}
                    </td>
                    <td className="p-4 text-sm">
                      {merchant.status === "approved" ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm">
                      {merchant.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(merchant.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(merchant.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
