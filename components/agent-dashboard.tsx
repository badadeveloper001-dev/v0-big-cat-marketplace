"use client"

import { useState, useEffect } from "react"
import { useRole } from "@/lib/role-context"
import {
  ArrowLeft,
  Users,
  MapPin,
  ClipboardList,
  CheckCircle2,
  Clock,
  TrendingUp,
  LogOut,
  RefreshCw,
  UserPlus,
  ShoppingBag,
  Store,
} from "lucide-react"

export function AgentDashboard() {
  const { user, setRole, setUser } = useRole()
  const [stats, setStats] = useState({
    totalMerchants: 0,
    pendingOnboarding: 0,
    completedOnboarding: 0,
    totalBuyers: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const agentName = user?.name || "Agent"
  const agentRegion = (user as any)?.region || "Nigeria"

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [merchantsRes, usersRes] = await Promise.all([
        fetch('/api/admin/merchants').then(r => r.json()),
        fetch('/api/admin/users').then(r => r.json()),
      ])

      const merchants = merchantsRes.success ? merchantsRes.data || [] : []
      const users = usersRes.success ? usersRes.data || [] : []

      const approved = merchants.filter((m: any) => m.setup_completed).length
      const pending = merchants.filter((m: any) => !m.setup_completed).length
      const buyers = users.filter((u: any) => u.role === 'buyer').length

      setStats({
        totalMerchants: merchants.length,
        pendingOnboarding: pending,
        completedOnboarding: approved,
        totalBuyers: buyers,
      })

      // Build recent activity from merchants
      const activity = merchants.slice(0, 8).map((m: any) => ({
        id: m.id,
        name: m.business_name || m.full_name || 'Unknown',
        email: m.email,
        status: m.setup_completed ? 'onboarded' : 'pending',
        date: new Date(m.created_at).toLocaleDateString(),
      }))
      setRecentActivity(activity)
    } catch (error) {
      console.error('Error loading agent stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setRole(null)
    setUser(null)
  }

  const statCards = [
    {
      label: "Total Merchants",
      value: stats.totalMerchants,
      icon: Store,
      color: "bg-purple-100 text-purple-600",
    },
    {
      label: "Pending Onboarding",
      value: stats.pendingOnboarding,
      icon: Clock,
      color: "bg-amber-100 text-amber-600",
    },
    {
      label: "Completed Onboarding",
      value: stats.completedOnboarding,
      icon: CheckCircle2,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Total Buyers",
      value: stats.totalBuyers,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between p-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Agent Dashboard</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {agentRegion}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadStats}
              disabled={loading}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-5xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-primary text-primary-foreground rounded-2xl p-5 mb-6 mt-4">
          <h2 className="text-lg font-bold">Welcome back, {agentName}</h2>
          <p className="text-primary-foreground/80 text-sm mt-1">
            You're managing onboarding for merchants in <strong>{agentRegion}</strong>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Progress Card */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Onboarding Progress
          </h3>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Completion rate</span>
            <span className="font-semibold text-foreground">
              {stats.totalMerchants > 0
                ? `${Math.round((stats.completedOnboarding / stats.totalMerchants) * 100)}%`
                : '0%'}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{
                width: stats.totalMerchants > 0
                  ? `${Math.round((stats.completedOnboarding / stats.totalMerchants) * 100)}%`
                  : '0%'
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{stats.completedOnboarding} completed</span>
            <span>{stats.pendingOnboarding} pending</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Merchant Activity</h3>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : recentActivity.length === 0 ? (
            <div className="p-8 text-center">
              <UserPlus className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No merchants yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary">
                      <Store className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      item.status === 'onboarded'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.status === 'onboarded' ? 'Onboarded' : 'Pending'}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
