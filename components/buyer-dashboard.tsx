"use client"

import { useRole } from "@/lib/role-context"
import { logout } from "@/lib/auth-actions"
import { VendorPage } from "@/components/vendor-page"
import { ChatInterface } from "@/components/chat-interface"
import { ProductsMarketplace } from "@/components/products-marketplace"
import { CartView } from "@/components/cart-view"
import { useCart } from "@/lib/cart-context"
import {
  Home,
  Search,
  ShoppingBag,
  User,
  Bell,
  MessageSquare,
  ArrowLeft,
  Mic,
  Sparkles,
  Star,
  MapPin,
  ChevronRight,
  Package,
  Zap,
  X,
  Send,
  LogOut,
} from "lucide-react"
import { useState } from "react"

const categories = [
  { name: "Fashion", icon: "👗", color: "bg-rose-50" },
  { name: "Electronics", icon: "💻", color: "bg-blue-50" },
  { name: "Home Services", icon: "🏠", color: "bg-amber-50" },
  { name: "Beauty", icon: "💄", color: "bg-purple-50" },
  { name: "Sports", icon: "⚽", color: "bg-green-50" },
  { name: "Food", icon: "🍔", color: "bg-orange-50" },
]

const aiSuggestions = [
  "Find a tailor near me",
  "I need a plumber in Lagos",
  "Best electronics deals today",
  "Compare prices for iPhone 15",
]

const vendors = [
  {
    id: 1,
    name: "StyleHaus",
    category: "Fashion",
    rating: 4.9,
    reviews: 1284,
    location: "Lagos, NG",
    badge: "Top Rated",
    badgeColor: "bg-amber-100 text-amber-700",
    bgColor: "bg-rose-100",
    initials: "SH",
    iconColor: "text-rose-600",
    description: "Premium tailoring & ready-to-wear collections",
  },
  {
    id: 2,
    name: "TechNest",
    category: "Electronics",
    rating: 4.8,
    reviews: 3421,
    location: "Abuja, NG",
    badge: "Verified",
    badgeColor: "bg-primary/15 text-primary",
    bgColor: "bg-blue-100",
    initials: "TN",
    iconColor: "text-blue-600",
    description: "Gadgets, accessories & smart home devices",
  },
  {
    id: 3,
    name: "FixIt Pro",
    category: "Home Services",
    rating: 4.7,
    reviews: 892,
    location: "Port Harcourt, NG",
    badge: "Fast Response",
    badgeColor: "bg-green-100 text-green-700",
    bgColor: "bg-amber-100",
    initials: "FP",
    iconColor: "text-amber-700",
    description: "Plumbing, electrical & general repairs",
  },
]

const recentOrders = [
  { id: "NX-2847", item: "Linen Suit", status: "Delivered", date: "Mar 15", amount: 89.99, icon: "👗" },
  { id: "NX-2833", item: "Wireless Earbuds", status: "In Transit", date: "Mar 12", amount: 149.99, icon: "💻" },
]

export function BuyerDashboard() {
  const { setRole, setUser } = useRole()
  const [activeTab, setActiveTab] = useState("home")
  const [searchQuery, setSearchQuery] = useState("")
  const [aiExpanded, setAiExpanded] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<typeof vendors[0] | null>(null)
  const [showProducts, setShowProducts] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const { cart } = useCart()

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      setUser(null)
      setRole(null)
    }
  }

  const handleSuggestionTap = (s: string) => {
    setSearchQuery(s)
    setAiExpanded(false)
  }

  // Show vendor page if a vendor is selected
  if (selectedVendor) {
    return <VendorPage vendor={selectedVendor} onBack={() => setSelectedVendor(null)} />
  }

  // Show products marketplace if selected
  if (showProducts) {
    return <ProductsMarketplace onBack={() => setShowProducts(false)} />
  }

  // Show cart if selected
  if (showCart) {
    return <CartView onBack={() => setShowCart(false)} />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Compact Header */}
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
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground leading-none">Good morning</span>
            <span className="font-semibold text-foreground text-sm">Alex Johnson</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowProducts(true)}
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Products"
              title="Browse products"
            >
              <Package className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowCart(true)}
              className="relative p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Shopping cart"
              title="View cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-32">
        {/* AI Assistant Hero Section */}
        {activeTab === "home" && (
          <>
        <section className="px-4 pt-5 pb-4">
          <div className="bg-primary rounded-3xl p-5 shadow-lg shadow-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-foreground/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-primary-foreground text-lg">BigCat AI</h2>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-foreground/20 text-xs font-medium text-primary-foreground">
                    <Zap className="w-3 h-3" /> Smart
                  </span>
                </div>
                <p className="text-sm text-primary-foreground/80">Your personal shopping assistant</p>
              </div>
            </div>

            {/* Search Bar - Hero Position */}
            <div className="relative">
              <div className="flex items-center gap-3 px-4 py-4 bg-card rounded-2xl shadow-md">
                <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setAiExpanded(true)}
                  placeholder="Ask anything or search..."
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
                />
                <button
                  aria-label="Voice search"
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex-shrink-0"
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
              {aiSuggestions.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionTap(s)}
                  className="flex-shrink-0 px-3 py-2 rounded-xl bg-primary-foreground/15 text-sm text-primary-foreground hover:bg-primary-foreground/25 transition-colors whitespace-nowrap"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* AI Expanded Panel Overlay */}
        {aiExpanded && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
            <div className="flex flex-col h-full">
              {/* AI Panel Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">BigCat AI</h3>
                    <p className="text-xs text-muted-foreground">Ask me anything</p>
                  </div>
                </div>
                <button
                  onClick={() => setAiExpanded(false)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* AI Content */}
              <div className="flex-1 overflow-auto px-4 py-6">
                <div className="max-w-md mx-auto">
                  <p className="text-center text-muted-foreground mb-6">
                    How can I help you today?
                  </p>
                  <div className="flex flex-col gap-3">
                    {aiSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionTap(s)}
                        className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Sparkles className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
                        </div>
                        <span className="text-foreground font-medium">{s}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-center gap-3 px-4 py-3 bg-secondary rounded-2xl">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Type your question..."
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                    autoFocus
                  />
                  <button className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories */}
        <section className="mb-6">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="font-semibold text-foreground text-lg">Categories</h2>
            <button className="text-sm text-primary font-medium flex items-center gap-0.5">
              See all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.name}
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                <div className={`w-16 h-16 rounded-2xl ${cat.color} flex items-center justify-center text-2xl shadow-sm border border-border/50 hover:scale-105 transition-transform`}>
                  {cat.icon}
                </div>
                <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Featured Vendors */}
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground text-lg">Featured Vendors</h2>
            <button className="text-sm text-primary font-medium flex items-center gap-0.5">
              See all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {vendors.map((vendor) => (
              <button
                key={vendor.id}
                onClick={() => setSelectedVendor(vendor)}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl shadow-sm hover:border-primary/30 hover:shadow-md transition-all text-left"
              >
                {/* Avatar */}
                <div className={`w-14 h-14 rounded-2xl ${vendor.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <span className={`font-bold text-lg ${vendor.iconColor}`}>{vendor.initials}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{vendor.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${vendor.badgeColor}`}>
                      {vendor.badge}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-1.5">{vendor.description}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-medium text-foreground">{vendor.rating}</span>
                      <span className="text-sm text-muted-foreground">({vendor.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{vendor.location}</span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        </section>

        {/* Recent Orders */}
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Recent Orders
            </h2>
            <button className="text-sm text-primary font-medium flex items-center gap-0.5">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl shadow-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
                  {order.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{order.item}</p>
                  <p className="text-sm text-muted-foreground">{order.id} · {order.date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-foreground">${order.amount}</p>
                  <p className={`text-sm font-medium ${order.status === "Delivered" ? "text-primary" : "text-chart-4"}`}>
                    {order.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
          </>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <ChatInterface />
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="p-6 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">No Orders Yet</h3>
            <p className="text-sm text-muted-foreground">Your orders will appear here</p>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="p-6 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Profile</h3>
            <p className="text-sm text-muted-foreground">Your profile information</p>
          </div>
        )}
      </main>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around px-2 py-3 max-w-2xl mx-auto">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors ${
              activeTab === "home"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors relative ${
              activeTab === "chat"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="relative">
              <MessageSquare className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                3
              </span>
            </div>
            <span className="text-xs font-medium">Messages</span>
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors ${
              activeTab === "orders"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingBag className="w-6 h-6" />
            <span className="text-xs font-medium">Orders</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors ${
              activeTab === "profile"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
    </div>
  )
}
