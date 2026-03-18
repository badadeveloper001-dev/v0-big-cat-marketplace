"use client"

import { useRole } from "@/lib/role-context"
import {
  Home,
  Search,
  ShoppingBag,
  User,
  Bell,
  ArrowLeft,
  Mic,
  Sparkles,
  Star,
  MapPin,
  ChevronRight,
  Package,
  Zap,
} from "lucide-react"
import { useState } from "react"

const categories = [
  { name: "Fashion", icon: "👗", color: "bg-rose-50 text-rose-500" },
  { name: "Electronics", icon: "💻", color: "bg-blue-50 text-blue-500" },
  { name: "Home Services", icon: "🏠", color: "bg-amber-50 text-amber-500" },
  { name: "Beauty", icon: "💄", color: "bg-purple-50 text-purple-500" },
  { name: "Sports", icon: "⚽", color: "bg-green-50 text-green-500" },
  { name: "Food", icon: "🍔", color: "bg-orange-50 text-orange-500" },
]

const aiSuggestions = [
  "Find a tailor near me",
  "I need a plumber in Lagos",
  "Best electronics deals today",
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
    badgeColor: "bg-amber-50 text-amber-600",
    bgColor: "bg-rose-100",
    initials: "SH",
    iconColor: "text-rose-500",
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
    badgeColor: "bg-primary/10 text-primary",
    bgColor: "bg-blue-100",
    initials: "TN",
    iconColor: "text-blue-500",
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
    badgeColor: "bg-green-50 text-green-600",
    bgColor: "bg-amber-100",
    initials: "FP",
    iconColor: "text-amber-600",
    description: "Plumbing, electrical & general repairs",
  },
]

const recentOrders = [
  { id: "NX-2847", item: "Linen Suit", status: "Delivered", date: "Mar 15", amount: 89.99, icon: "👗" },
  { id: "NX-2833", item: "Wireless Earbuds", status: "In Transit", date: "Mar 12", amount: 149.99, icon: "💻" },
]

export function BuyerDashboard() {
  const { setRole } = useRole()
  const [activeTab, setActiveTab] = useState("home")
  const [searchQuery, setSearchQuery] = useState("")
  const [aiExpanded, setAiExpanded] = useState(false)
  const [suggestionIdx, setSuggestionIdx] = useState(0)

  const handleSuggestionTap = (s: string) => {
    setSearchQuery(s)
    setAiExpanded(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setRole(null)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground leading-none">Good morning</span>
            <span className="font-semibold text-foreground text-sm">Alex Johnson</span>
          </div>
          <button className="relative p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </button>
        </div>

        {/* Prominent Search Bar */}
        <div className="flex items-center gap-2 pb-1">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-secondary border border-border rounded-xl shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products or services"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
            />
            <button
              aria-label="Voice search"
              className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex-shrink-0"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* AI Assistant Button */}
          <button
            onClick={() => setAiExpanded(!aiExpanded)}
            className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all flex-shrink-0 ${
              aiExpanded
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
            aria-label="AI Assistant"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* AI Assistant Panel */}
      {aiExpanded && (
        <div className="mx-4 mt-3 p-4 bg-card border border-primary/20 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Nexus AI</p>
              <p className="text-xs text-muted-foreground">Your smart shopping assistant</p>
            </div>
            <Zap className="w-3.5 h-3.5 text-amber-500 ml-auto" />
          </div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Try asking:</p>
          <div className="flex flex-col gap-2">
            {aiSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionTap(s)}
                className="flex items-center gap-2 px-3 py-2.5 bg-secondary rounded-xl text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors text-left"
              >
                <Mic className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="italic">"{s}"</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI hint when panel closed */}
      {!aiExpanded && (
        <div className="px-4 pt-2.5">
          <button
            onClick={() => setAiExpanded(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Try: <span className="italic text-primary font-medium">"{aiSuggestions[suggestionIdx]}"</span></span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        {/* Categories */}
        <section className="mt-4 mb-5">
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="font-semibold text-foreground text-base">Categories</h2>
            <button className="text-xs text-primary font-medium flex items-center gap-0.5">
              See all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pl-4 pr-4 pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.name}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div className={`w-14 h-14 rounded-2xl ${cat.color.split(" ")[0]} flex items-center justify-center text-2xl shadow-sm border border-border/50`}>
                  {cat.icon}
                </div>
                <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Featured Vendors */}
        <section className="px-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground text-base">Featured Vendors</h2>
            <button className="text-xs text-primary font-medium flex items-center gap-0.5">
              See all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl shadow-sm hover:border-primary/30 transition-all"
              >
                {/* Avatar */}
                <div className={`w-14 h-14 rounded-xl ${vendor.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <span className={`font-bold text-lg ${vendor.iconColor}`}>{vendor.initials}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-foreground text-sm">{vendor.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${vendor.badgeColor}`}>
                      {vendor.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{vendor.description}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-medium text-foreground">{vendor.rating}</span>
                      <span className="text-xs text-muted-foreground">({vendor.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{vendor.location}</span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            ))}
          </div>
        </section>

        {/* Recent Orders */}
        <section className="px-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Recent Orders
            </h2>
            <button className="text-xs text-primary font-medium flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-col gap-2.5">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl flex-shrink-0">
                  {order.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{order.item}</p>
                  <p className="text-xs text-muted-foreground">{order.id} · {order.date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-foreground text-sm">${order.amount}</p>
                  <p className={`text-xs font-medium ${order.status === "Delivered" ? "text-primary" : "text-chart-4"}`}>
                    {order.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border px-2 py-2">
        <div className="flex items-center justify-around">
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "search", icon: Search, label: "Search" },
            { id: "orders", icon: ShoppingBag, label: "Orders" },
            { id: "profile", icon: User, label: "Profile" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                activeTab === item.id
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
