"use client"

import { useRole } from "@/lib/role-context"
import { 
  Home, 
  Search, 
  ShoppingCart, 
  Heart, 
  User, 
  Bell,
  TrendingUp,
  Star,
  ArrowLeft,
  Package
} from "lucide-react"
import { useState } from "react"

const categories = [
  { name: "Electronics", icon: "💻", count: 1240 },
  { name: "Fashion", icon: "👕", count: 892 },
  { name: "Home", icon: "🏠", count: 567 },
  { name: "Sports", icon: "⚽", count: 423 },
]

const featuredProducts = [
  {
    id: 1,
    name: "Wireless Earbuds Pro",
    price: 149.99,
    rating: 4.8,
    reviews: 2341,
    image: "bg-gradient-to-br from-secondary to-muted",
  },
  {
    id: 2,
    name: "Smart Watch Series X",
    price: 299.99,
    rating: 4.9,
    reviews: 1892,
    image: "bg-gradient-to-br from-primary/20 to-secondary",
  },
  {
    id: 3,
    name: "Premium Headphones",
    price: 199.99,
    rating: 4.7,
    reviews: 3421,
    image: "bg-gradient-to-br from-muted to-card",
  },
]

const recentOrders = [
  { id: "NX-2847", status: "Delivered", date: "Mar 15", amount: 89.99 },
  { id: "NX-2833", status: "In Transit", date: "Mar 12", amount: 249.99 },
]

export function BuyerDashboard() {
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
          <h1 className="font-semibold text-foreground">Nexus Market</h1>
          <button className="relative p-2 -mr-2 text-muted-foreground hover:text-foreground">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        {/* Search */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 px-4 py-3 bg-secondary rounded-xl">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>

        {/* Categories */}
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Categories</h2>
            <button className="text-sm text-primary">See all</button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {categories.map((category) => (
              <button
                key={category.name}
                className="flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors"
              >
                <span className="text-2xl">{category.icon}</span>
                <span className="text-xs text-muted-foreground">{category.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Trending Now
            </h2>
            <button className="text-sm text-primary">See all</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-40 bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className={`h-32 ${product.image}`} />
                <div className="p-3">
                  <h3 className="text-sm font-medium text-foreground line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-primary fill-primary" />
                    <span className="text-xs text-muted-foreground">
                      {product.rating} ({product.reviews})
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-2">
                    ${product.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Orders */}
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Recent Orders
            </h2>
            <button className="text-sm text-primary">View all</button>
          </div>
          <div className="flex flex-col gap-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-xl"
              >
                <div>
                  <p className="font-medium text-foreground">{order.id}</p>
                  <p className="text-sm text-muted-foreground">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">${order.amount}</p>
                  <p className={`text-sm ${order.status === "Delivered" ? "text-primary" : "text-chart-4"}`}>
                    {order.status}
                  </p>
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
            { id: "home", icon: Home, label: "Home" },
            { id: "search", icon: Search, label: "Search" },
            { id: "cart", icon: ShoppingCart, label: "Cart" },
            { id: "wishlist", icon: Heart, label: "Wishlist" },
            { id: "profile", icon: User, label: "Profile" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 ${
                activeTab === item.id
                  ? "text-primary"
                  : "text-muted-foreground"
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
