"use client"

import { useRole } from "@/lib/role-context"
import { logout } from "@/lib/auth-actions"
import {
  ArrowLeft,
  Bell,
  Home,
  Package,
  BarChart3,
  Settings,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  ChevronRight,
  Sparkles,
  Coins,
  Eye,
  Percent,
  MoreHorizontal,
  Pencil,
  Trash2,
  Send,
  Clock,
  CheckCircle2,
  Truck,
  LogOut,
} from "lucide-react"
import { useState } from "react"

const stats = [
  { label: "Total Sales", value: "$24,580", change: "+18.2%", trend: "up", icon: DollarSign },
  { label: "Active Orders", value: "47", change: "+5", trend: "up", icon: ShoppingBag },
  { label: "Token Balance", value: "2,450", change: "-120", trend: "down", icon: Coins },
  { label: "Escrow Balance", value: "$3,240", change: "+$840", trend: "up", icon: Clock },
]

const quickActions = [
  { label: "Add Product", icon: Plus, primary: true },
  { label: "View Orders", icon: ShoppingBag, primary: false },
  { label: "Analytics", icon: BarChart3, primary: false },
  { label: "AI BizPilot", icon: Sparkles, primary: false, highlight: true },
]

const performanceStats = [
  { label: "Views", value: "12,847", change: "+24%", icon: Eye },
  { label: "Orders", value: "284", change: "+12%", icon: ShoppingBag },
  { label: "Conversion", value: "2.2%", change: "-0.3%", negative: true, icon: Percent },
]

const products = [
  { id: 1, name: "Wireless Earbuds Pro", price: 149.99, stock: 234, status: "active", image: "WE" },
  { id: 2, name: "Smart Watch Series X", price: 299.99, stock: 89, status: "active", image: "SW" },
  { id: 3, name: "Premium Headphones", price: 199.99, stock: 12, status: "low", image: "PH" },
  { id: 4, name: "Portable Charger 20K", price: 49.99, stock: 0, status: "out", image: "PC" },
]

const recentOrders = [
  { id: "BC-3847", customer: "John D.", amount: 149.99, status: "pending", time: "2m ago" },
  { id: "BC-3846", customer: "Sarah M.", amount: 299.99, status: "shipped", time: "1h ago" },
  { id: "BC-3845", customer: "Mike R.", amount: 449.99, status: "delivered", time: "3h ago" },
]

const aiInsights = [
  "Your store traffic is high but conversion is low. Consider adjusting pricing or improving product images.",
  "Top seller 'Wireless Earbuds Pro' is trending. Consider increasing stock.",
  "Customers from Lagos have 40% higher order value. Target ads there.",
]

export function MerchantDashboard() {
  const { setRole, setUser } = useRole()
  const [activeTab, setActiveTab] = useState("home")
  const [aiMessage, setAiMessage] = useState("")
  const [currentInsight, setCurrentInsight] = useState(0)

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      setUser(null)
      setRole(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-3.5 h-3.5" />
      case "shipped": return <Truck className="w-3.5 h-3.5" />
      case "delivered": return <CheckCircle2 className="w-3.5 h-3.5" />
      default: return null
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending": return "bg-chart-4/10 text-chart-4"
      case "shipped": return "bg-chart-3/10 text-chart-3"
      case "delivered": return "bg-primary/10 text-primary"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getStockStyle = (status: string) => {
    switch (status) {
      case "active": return "text-primary"
      case "low": return "text-chart-4"
      case "out": return "text-destructive"
      default: return "text-muted-foreground"
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={handleLogout}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-foreground">Merchant Dashboard</h1>
          <button className="relative p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-24">
        {/* Welcome Section */}
        <div className="px-4 pt-5 pb-4">
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h2 className="text-2xl font-bold text-foreground">Acme Store</h2>
        </div>

        {/* Stats Cards */}
        <section className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-card border border-border rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${stat.trend === "up" ? "text-primary" : "text-destructive"}`}>
                    {stat.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stat.change}
                  </span>
                </div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="px-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                  action.primary 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : action.highlight 
                      ? "bg-chart-4/10 text-chart-4 border border-chart-4/30"
                      : "bg-card border border-border text-foreground hover:border-primary/30"
                }`}
              >
                <action.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* AI BizPilot Section */}
        <section className="px-4 mb-6">
          <div className="bg-gradient-to-br from-primary/5 via-card to-chart-4/5 border border-primary/20 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">AI BizPilot</h3>
                <p className="text-[10px] text-muted-foreground">Your intelligent business assistant</p>
              </div>
            </div>
            
            {/* AI Insight Card */}
            <div className="bg-card/80 backdrop-blur rounded-xl p-3 mb-3 border border-border">
              <div className="flex gap-2">
                <div className="w-1 rounded-full bg-primary shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">
                  {aiInsights[currentInsight]}
                </p>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-1">
                  {aiInsights.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentInsight(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentInsight ? "bg-primary" : "bg-border"}`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">Insight {currentInsight + 1} of {aiInsights.length}</span>
              </div>
            </div>

            {/* AI Chat Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask BizPilot anything..."
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                className="flex-1 bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              />
              <button className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-xl shadow-sm shadow-primary/20">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Performance Stats */}
        <section className="px-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Performance</h3>
          <div className="flex gap-3">
            {performanceStats.map((stat) => (
              <div key={stat.label} className="flex-1 bg-card border border-border rounded-2xl p-3 shadow-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary mb-2">
                  <stat.icon className="w-4 h-4 text-foreground" />
                </div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  <span className={`text-[10px] font-medium ${stat.negative ? "text-destructive" : "text-primary"}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Token System */}
        <section className="px-4 mb-6">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-chart-4/10">
                  <Coins className="w-5 h-5 text-chart-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Token Balance</p>
                  <p className="text-xl font-bold text-foreground">2,450</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl shadow-sm shadow-primary/20">
                Buy Tokens
              </button>
            </div>
            <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
              More activity = higher visibility. Tokens boost your store ranking.
            </p>
          </div>
        </section>

        {/* Product Management */}
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Products</h3>
            <button className="text-xs text-primary font-medium">View All</button>
          </div>
          <div className="flex flex-col gap-2">
            {products.map((product) => (
              <div key={product.id} className="bg-card border border-border rounded-2xl p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {product.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-semibold text-foreground">${product.price}</span>
                      <span className={`text-xs ${getStockStyle(product.status)}`}>
                        {product.status === "out" ? "Out of stock" : `${product.stock} in stock`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Orders */}
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Recent Orders</h3>
            <button className="text-xs text-primary font-medium">View All</button>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {recentOrders.map((order, index) => (
              <div
                key={order.id}
                className={`flex items-center justify-between p-3 ${
                  index !== recentOrders.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${getStatusStyle(order.status)}`}>
                    {getStatusIcon(order.status)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground text-sm">{order.id}</p>
                      <span className="text-[10px] text-muted-foreground">{order.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{order.customer}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground text-sm">${order.amount}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 pb-6">
        <div className="flex items-center justify-around">
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "products", icon: Package, label: "Products" },
            { id: "orders", icon: ShoppingBag, label: "Orders" },
            { id: "analytics", icon: BarChart3, label: "Analytics" },
            { id: "settings", icon: Settings, label: "Settings" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
                activeTab === item.id 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
