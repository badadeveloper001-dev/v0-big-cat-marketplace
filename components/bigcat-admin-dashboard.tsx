"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Users, Store, ShoppingBag, TrendingUp, Truck, CheckCircle2 } from "lucide-react"

export function BigcatAdminDashboard() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const adminAccess = sessionStorage.getItem("adminAccess")
    if (adminAccess === "BIGCAT_00") {
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
      label: "Total Users",
      value: "2,847",
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Total Merchants",
      value: "342",
      icon: Store,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Total Orders",
      value: "12,456",
      icon: ShoppingBag,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Total Revenue",
      value: "₦4.2M",
      icon: TrendingUp,
      color: "bg-orange-100 text-orange-600",
    },
  ]

  const logisticsData = [
    { label: "Active Deliveries", value: 245, color: "text-blue-600" },
    { label: "Completed Deliveries", value: 8,934, color: "text-green-600" },
    { label: "Pending Deliveries", value: 67, color: "text-yellow-600" },
  ]

  const recentUsers = [
    { id: 1, name: "John Doe", email: "john@example.com", joined: "2 days ago", type: "buyer" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", joined: "1 week ago", type: "merchant" },
    { id: 3, name: "Tech Solutions", email: "tech@example.com", joined: "2 weeks ago", type: "merchant" },
    { id: 4, name: "Alice Johnson", email: "alice@example.com", joined: "3 weeks ago", type: "buyer" },
  ]

  const recentOrders = [
    { id: "ORD001", user: "John Doe", amount: 45000, status: "delivered", date: "2024-03-20" },
    { id: "ORD002", user: "Jane Smith", amount: 32500, status: "processing", date: "2024-03-20" },
    { id: "ORD003", user: "Tech Solutions", amount: 125000, status: "delivered", date: "2024-03-19" },
    { id: "ORD004", user: "Fashion Forward", amount: 78000, status: "pending", date: "2024-03-19" },
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
            <h1 className="text-2xl font-bold text-foreground">BigCat Super Admin</h1>
            <p className="text-sm text-muted-foreground">Complete Marketplace Overview</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

        {/* Logistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg text-foreground">Logistics Overview</h2>
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col gap-4">
              {logisticsData.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-bold text-lg text-foreground mb-6">Quick Access</h2>
            <div className="flex flex-col gap-3">
              <button className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors text-left">
                View All Users
              </button>
              <button className="w-full p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition-colors text-left">
                View All Merchants
              </button>
              <button className="w-full p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors text-left">
                View All Orders
              </button>
            </div>
          </div>
        </div>

        {/* Recent Users & Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="font-bold text-lg text-foreground">Recent Users</h2>
            </div>
            <div className="divide-y divide-border">
              {recentUsers.map((user) => (
                <div key={user.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">{user.joined}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      user.type === "merchant"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {user.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="font-bold text-lg text-foreground">Recent Orders</h2>
            </div>
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{order.id}</p>
                      <p className="text-xs text-muted-foreground">{order.user}</p>
                      <p className="text-xs text-muted-foreground mt-1">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">₦{(order.amount / 1000).toFixed(0)}K</p>
                      <span className={`text-xs font-semibold px-2 py-1 rounded inline-block mt-1 ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "processing"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
