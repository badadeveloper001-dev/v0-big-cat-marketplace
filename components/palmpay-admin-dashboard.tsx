"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, TrendingUp, Wallet, DollarSign, CheckCircle2, Clock } from "lucide-react"

export function PalmpayAdminDashboard() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [transactions, setTransactions] = useState([
    {
      id: "TXN001",
      user: "John Doe",
      amount: 45000,
      status: "completed",
      date: "2024-03-20",
      type: "payment",
    },
    {
      id: "TXN002",
      user: "Jane Smith",
      amount: 32500,
      status: "pending",
      date: "2024-03-20",
      type: "payment",
    },
    {
      id: "TXN003",
      user: "Tech Solutions",
      amount: 125000,
      status: "completed",
      date: "2024-03-19",
      type: "payout",
    },
    {
      id: "TXN004",
      user: "Fashion Forward",
      amount: 78000,
      status: "pending",
      date: "2024-03-19",
      type: "payment",
    },
  ])

  useEffect(() => {
    const adminAccess = sessionStorage.getItem("adminAccess")
    if (adminAccess === "PALMPAY_012") {
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

  const totalTransactions = transactions.length
  const totalRevenue = transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0)
  const productEscrow = 450000
  const deliveryEscrow = 125000
  const completedPayments = transactions.filter(
    (t) => t.status === "completed"
  ).length
  const pendingPayments = transactions.filter(
    (t) => t.status === "pending"
  ).length

  const stats = [
    {
      label: "Total Transactions",
      value: totalTransactions,
      icon: TrendingUp,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Total Revenue",
      value: `₦${(totalRevenue / 1000).toFixed(0)}K`,
      icon: DollarSign,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Product Escrow",
      value: `₦${(productEscrow / 1000).toFixed(0)}K`,
      icon: Wallet,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Delivery Escrow",
      value: `₦${(deliveryEscrow / 1000).toFixed(0)}K`,
      icon: Wallet,
      color: "bg-orange-100 text-orange-600",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="flex items-center gap-4 p-6 max-w-7xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">PalmPay Admin</h1>
            <p className="text-sm text-muted-foreground">Payment & Escrow Management</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-2">
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

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-bold text-lg text-foreground mb-4">Payment Status Overview</h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-muted-foreground">Completed</span>
                </div>
                <span className="font-bold text-foreground">{completedPayments}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="text-muted-foreground">Pending</span>
                </div>
                <span className="font-bold text-foreground">{pendingPayments}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-bold text-lg text-foreground mb-4">Escrow Summary</h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Product Escrow</span>
                <span className="font-bold text-foreground">₦{(productEscrow / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Delivery Escrow</span>
                <span className="font-bold text-foreground">₦{(deliveryEscrow / 1000).toFixed(0)}K</span>
              </div>
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="font-semibold text-foreground">Total Held</span>
                <span className="font-bold text-foreground">₦{((productEscrow + deliveryEscrow) / 1000).toFixed(0)}K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="font-bold text-lg text-foreground">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 font-semibold text-sm text-foreground">ID</th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground">User</th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground">Amount</th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground">Type</th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground">Date</th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-4 text-sm text-muted-foreground">{txn.id}</td>
                    <td className="p-4 text-sm text-foreground font-medium">{txn.user}</td>
                    <td className="p-4 text-sm text-foreground font-medium">
                      ₦{(txn.amount / 1000).toFixed(0)}K
                    </td>
                    <td className="p-4 text-sm text-muted-foreground capitalize">{txn.type}</td>
                    <td className="p-4 text-sm text-muted-foreground">{txn.date}</td>
                    <td className="p-4 text-sm">
                      {txn.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
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
