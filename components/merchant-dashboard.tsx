"use client"

import { useRole } from "@/lib/role-context"
import {
  ArrowLeft,
  Bell,
  Home,
  Package,
  BarChart3,
  Settings,
  Plus,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"

const stats = [
  { label: "Total Sales", value: "$12,847", change: "+12.5%", icon: DollarSign },
  { label: "Orders", value: "284", change: "+8.2%", icon: ShoppingBag },
  { label: "Customers", value: "1,429", change: "+15.3%", icon: Users },
]

const recentOrders = [
  { id: "NX-2847", customer: "John D.", amount: 89.99, status: "Pending" },
  { id: "NX-2846", customer: "Sarah M.", amount: 149.99, status: "Shipped" },
  { id: "NX-2845", customer: "Mike R.", amount: 299.99, status: "Delivered" },
]

const topProducts = [
  { name: "Wireless Earbuds Pro", sold: 234, revenue: 34866 },
  { name: "Smart Watch Series X", sold: 156, revenue: 46644 },
  { name: "Premium Headphones", sold: 189, revenue: 37611 },
]

export function MerchantDashboard() {
  const { setRole } = useRole()
  const [activeTab, setActiveTab] = useState("home")

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setRole(null)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-foreground">Merchant Dashboard</h1>
          <button className="relative p-2 -mr-2 text-muted-foreground hover:text-foreground">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        {/* Welcome Banner */}
        <div className="px-4 py-4">
          <div className="bg-gradient-to-br from-primary/20 to-secondary p-4 rounded-xl border border-primary/30">
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h2 className="text-xl font-bold text-foreground">Acme Store</h2>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary">Sales are up 12% this week</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <section className="px-4 mb-6">
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-card border border-border rounded-xl p-3"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary mb-2">
                  <stat.icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-primary mt-1">{stat.change}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="px-4 mb-6">
          <h2 className="font-semibold text-foreground mb-3">Quick Actions</h2>
          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium">
              <Plus className="w-4 h-4" />
              Add Product
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-secondary text-foreground rounded-xl font-medium border border-border">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          </div>
        </section>

        {/* Recent Orders */}
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Recent Orders</h2>
            <button className="text-sm text-primary">View all</button>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {recentOrders.map((order, index) => (
              <div
                key={order.id}
                className={`flex items-center justify-between p-4 ${
                  index !== recentOrders.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{order.id}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === "Pending"
                          ? "bg-chart-4/20 text-chart-4"
                          : order.status === "Shipped"
                          ? "bg-chart-2/20 text-chart-2"
                          : "bg-primary/20 text-primary"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.customer}</p>
                </div>
                <p className="font-medium text-foreground">${order.amount}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Top Products */}
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Top Products</h2>
            <button className="text-sm text-primary">Manage</button>
          </div>
          <div className="flex flex-col gap-3">
            {topProducts.map((product, index) => (
              <div
                key={product.name}
                className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-foreground font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.sold} sold
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    ${product.revenue.toLocaleString()}
                  </p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-4 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          {[
            { id: "home", icon: Home, label: "Dashboard" },
            { id: "products", icon: Package, label: "Products" },
            { id: "orders", icon: ShoppingBag, label: "Orders" },
            { id: "analytics", icon: BarChart3, label: "Analytics" },
            { id: "settings", icon: Settings, label: "Settings" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 ${
                activeTab === item.id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
