"use client"

import { useRole } from "@/lib/role-context"
import {
  ArrowLeft,
  Bell,
  Home,
  Users,
  Store,
  Shield,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  Activity,
} from "lucide-react"
import { useState } from "react"

const platformStats = [
  { label: "Total Users", value: "24,847", change: "+12.5%", icon: Users },
  { label: "Merchants", value: "1,284", change: "+8.2%", icon: Store },
  { label: "Revenue", value: "$847K", change: "+23.1%", icon: DollarSign },
  { label: "Active Now", value: "1,429", change: "", icon: Activity },
]

const pendingApprovals = [
  { id: 1, name: "TechGadgets Pro", type: "Merchant", date: "Mar 18" },
  { id: 2, name: "Fashion Hub", type: "Merchant", date: "Mar 17" },
  { id: 3, name: "Sports Zone", type: "Merchant", date: "Mar 17" },
]

const recentActivity = [
  {
    id: 1,
    action: "New merchant registered",
    detail: "ElectroMart",
    time: "2 min ago",
    type: "success",
  },
  {
    id: 2,
    action: "Suspicious activity detected",
    detail: "User #4829",
    time: "15 min ago",
    type: "warning",
  },
  {
    id: 3,
    action: "Payment processed",
    detail: "$12,847.00",
    time: "1 hour ago",
    type: "success",
  },
  {
    id: 4,
    action: "Account suspended",
    detail: "User #3921",
    time: "2 hours ago",
    type: "error",
  },
]

export function AdminDashboard() {
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
          <h1 className="font-semibold text-foreground">Admin Dashboard</h1>
          <button className="relative p-2 -mr-2 text-muted-foreground hover:text-foreground">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        {/* Admin Badge */}
        <div className="px-4 py-4">
          <div className="bg-gradient-to-br from-primary/10 to-secondary p-4 rounded-xl border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Administrator</p>
                <h2 className="font-bold text-foreground">System Overview</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <section className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            {platformStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary">
                    <stat.icon className="w-4 h-4 text-primary" />
                  </div>
                  {stat.change && (
                    <span className="text-xs text-primary flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pending Approvals */}
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-chart-4" />
              Pending Approvals
            </h2>
            <span className="text-xs px-2 py-1 bg-chart-4/20 text-chart-4 rounded-full">
              {pendingApprovals.length} pending
            </span>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {pendingApprovals.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-4 ${
                  index !== pendingApprovals.length - 1
                    ? "border-b border-border"
                    : ""
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.type} - {item.date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Recent Activity</h2>
            <button className="text-sm text-primary">View all</button>
          </div>
          <div className="flex flex-col gap-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-4 bg-card border border-border rounded-xl"
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    activity.type === "success"
                      ? "bg-primary/20"
                      : activity.type === "warning"
                      ? "bg-chart-4/20"
                      : "bg-destructive/20"
                  }`}
                >
                  {activity.type === "success" ? (
                    <CheckCircle
                      className={`w-4 h-4 ${
                        activity.type === "success"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  ) : activity.type === "warning" ? (
                    <AlertTriangle className="w-4 h-4 text-chart-4" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.detail}</p>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-4 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          {[
            { id: "home", icon: Home, label: "Overview" },
            { id: "users", icon: Users, label: "Users" },
            { id: "merchants", icon: Store, label: "Merchants" },
            { id: "security", icon: Shield, label: "Security" },
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
