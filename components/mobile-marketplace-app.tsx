"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  ChevronRight,
  Heart,
  Home,
  Loader2,
  Package,
  Search,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Store,
  User,
} from "lucide-react"
import { useRole } from "@/lib/role-context"
import { useCart } from "@/lib/cart-context"
import { useWishlist } from "@/lib/wishlist-context"
import { BrandWordmark } from "@/components/brand-wordmark"
import { ProductGrid } from "@/components/product-card"
import { ProductDetailsPage } from "@/components/product-details-page"
import { CartView } from "@/components/cart-view"
import { CheckoutPage } from "@/components/checkout-page"
import { ProfilePage } from "@/components/profile-page"
import { BuyerAuth } from "@/components/buyer-auth"
import { formatNaira } from "@/lib/currency-utils"

const categories = ["Electronics", "Fashion", "Food", "Beauty", "Sports", "Home"]

export function MobileMarketplaceApp() {
  const { user } = useRole()
  const { items: cartItems, getItemCount, getTotal } = useCart()
  const { items: wishlistItems, getItemCount: getWishlistCount } = useWishlist()

  const [activeTab, setActiveTab] = useState<"home" | "discover" | "wishlist" | "cart" | "account">("home")
  const [products, setProducts] = useState<any[]>([])
  const [merchants, setMerchants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showProfileEditor, setShowProfileEditor] = useState(false)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [pendingCheckout, setPendingCheckout] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [productResponse, merchantResponse] = await Promise.all([
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/admin/merchants", { cache: "no-store" }),
        ])

        const productResult = await productResponse.json()
        const merchantResult = await merchantResponse.json()

        if (productResult.success) {
          setProducts(Array.isArray(productResult.data) ? productResult.data : [])
        }

        if (merchantResult.success) {
          setMerchants(Array.isArray(merchantResult.data) ? merchantResult.data : [])
        }
      } catch {
        setProducts([])
        setMerchants([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    if (user && pendingCheckout) {
      setPendingCheckout(false)
      setShowAuthPrompt(false)
      setActiveTab("cart")
      setShowCheckout(true)
    }
  }, [user, pendingCheckout])

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return products.filter((product) => {
      const matchesCategory = !selectedCategory || String(product.category || "").toLowerCase().includes(selectedCategory.toLowerCase())
      const matchesQuery =
        !query ||
        String(product.name || "").toLowerCase().includes(query) ||
        String(product.description || "").toLowerCase().includes(query) ||
        String(product.merchant_profiles?.business_name || "").toLowerCase().includes(query)

      return matchesCategory && matchesQuery
    })
  }, [products, searchQuery, selectedCategory])

  const featuredProducts = filteredProducts.slice(0, activeTab === "home" ? 6 : 24)
  const topMerchants = merchants.slice(0, 6)

  if (selectedProductId) {
    return (
      <ProductDetailsPage
        productId={selectedProductId}
        onBack={() => setSelectedProductId(null)}
        onOpenCart={() => setActiveTab("cart")}
        onCheckout={() => {
          if (!user) {
            setPendingCheckout(true)
            setShowAuthPrompt(true)
            return
          }
          setShowCheckout(true)
        }}
      />
    )
  }

  if (showCheckout) {
    return (
      <CheckoutPage
        onBack={() => setShowCheckout(false)}
        onSuccess={(orderId) => {
          setOrderSuccess(orderId)
          setShowCheckout(false)
          setActiveTab("cart")
        }}
      />
    )
  }

  if (showProfileEditor) {
    return <ProfilePage onBack={() => setShowProfileEditor(false)} />
  }

  if (activeTab === "cart") {
    return (
      <CartView
        onBack={() => setActiveTab("home")}
        onCheckout={() => {
          if (!user) {
            setPendingCheckout(true)
            setShowAuthPrompt(true)
            return
          }
          setShowCheckout(true)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#031b0b] px-0 sm:px-4 py-0 sm:py-4">
      <div className="mx-auto min-h-screen max-w-md overflow-hidden bg-background shadow-2xl ring-1 ring-black/10 sm:rounded-[28px]">
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <BrandWordmark compact />
              <p className="mt-1 text-xs text-muted-foreground">Mobile marketplace experience</p>
            </div>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground"
            >
              <Smartphone className="h-3.5 w-3.5" />
              Web View
            </Link>
          </div>
        </header>

        <main className="pb-24">
          {activeTab === "home" && (
            <div className="space-y-5 p-4">
              <section className="rounded-3xl bg-gradient-to-br from-emerald-600 via-green-600 to-lime-500 p-4 text-white shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">BigCat Mobile</p>
                <h1 className="mt-2 text-2xl font-extrabold leading-tight">Shop fast on the go</h1>
                <p className="mt-2 text-sm text-white/85">
                  Browse products, save wishlist items, and checkout from a dedicated mobile version.
                </p>

                <div className="mt-4 rounded-2xl bg-white/95 px-3 py-2 text-foreground shadow-sm">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search products or merchants"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>
              </section>

              {orderSuccess ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                  Order placed successfully.
                </div>
              ) : null}

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground">Quick categories</h2>
                  <button
                    onClick={() => setActiveTab("discover")}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                  >
                    Browse all
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category)
                        setActiveTab("discover")
                      }}
                      className="rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground whitespace-nowrap"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground">Featured products</h2>
                  <button
                    onClick={() => setActiveTab("discover")}
                    className="text-sm font-semibold text-primary"
                  >
                    See all
                  </button>
                </div>
                <ProductGrid
                  products={featuredProducts.map((product) => ({
                    id: String(product.id),
                    name: product.name,
                    price: Number(product.price || 0),
                    category: product.category || "General",
                    image: product.images?.[0] || product.image_url || null,
                    merchant: {
                      id: String(product.merchant_id || ""),
                      business_name: product.merchant_profiles?.business_name || product.merchant_profiles?.name || "Merchant",
                      logo_url: product.merchant_profiles?.logo_url || product.merchant_profiles?.avatar_url,
                      location: product.merchant_profiles?.location || "Nigeria",
                    },
                  }))}
                  onProductClick={(productId) => setSelectedProductId(productId)}
                  loading={loading}
                />
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-foreground">Top merchants</h2>
                  <Link href="/marketplace" className="text-sm font-semibold text-primary">
                    Open web marketplace
                  </Link>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topMerchants.map((merchant: any) => (
                      <div key={merchant.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{merchant.business_name || merchant.full_name || "Merchant"}</p>
                          <p className="text-xs text-muted-foreground">{merchant.business_category || merchant.location || "Nigeria"}</p>
                        </div>
                        <Link href="/marketplace" className="text-sm font-semibold text-primary">
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === "discover" && (
            <div className="space-y-4 p-4">
              <div className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search the marketplace"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap ${
                    !selectedCategory ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"
                  }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap ${
                      selectedCategory === category ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <ProductGrid
                products={filteredProducts.map((product) => ({
                  id: String(product.id),
                  name: product.name,
                  price: Number(product.price || 0),
                  category: product.category || "General",
                  image: product.images?.[0] || product.image_url || null,
                  merchant: {
                    id: String(product.merchant_id || ""),
                    business_name: product.merchant_profiles?.business_name || product.merchant_profiles?.name || "Merchant",
                    logo_url: product.merchant_profiles?.logo_url || product.merchant_profiles?.avatar_url,
                    location: product.merchant_profiles?.location || "Nigeria",
                  },
                }))}
                onProductClick={(productId) => setSelectedProductId(productId)}
                loading={loading}
              />
            </div>
          )}

          {activeTab === "wishlist" && (
            <div className="space-y-4 p-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Wishlist</h2>
                <p className="text-sm text-muted-foreground">Your saved products in one place.</p>
              </div>

              {wishlistItems.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center">
                  <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-semibold text-foreground">No saved items yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Tap the heart on any product to add it here.</p>
                </div>
              ) : (
                <ProductGrid
                  products={wishlistItems}
                  onProductClick={(productId) => setSelectedProductId(productId)}
                />
              )}
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-4 p-4">
              {!user ? (
                <div className="rounded-2xl border border-border bg-card p-6 text-center">
                  <User className="mx-auto mb-3 h-10 w-10 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">Sign in for full access</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Track orders, edit profile, and checkout faster.</p>
                  <button
                    onClick={() => setShowAuthPrompt(true)}
                    className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
                  >
                    Sign In / Sign Up
                  </button>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Account</p>
                    <h2 className="mt-2 text-xl font-bold text-foreground">{user.name || user.email}</h2>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground">Wishlist</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{getWishlistCount()}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground">Cart</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{getItemCount()}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowProfileEditor(true)}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left font-semibold text-foreground"
                  >
                    Edit profile
                  </button>

                  <Link
                    href="/marketplace"
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left font-semibold text-foreground"
                  >
                    Open full web marketplace
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </>
              )}
            </div>
          )}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-md items-center justify-around border-t border-border bg-card px-2 py-2 sm:rounded-b-[28px]">
          {[
            { key: "home", label: "Home", icon: Home },
            { key: "discover", label: "Shop", icon: Search },
            { key: "wishlist", label: "Saved", icon: Heart },
            { key: "cart", label: "Cart", icon: ShoppingCart },
            { key: "account", label: "Account", icon: User },
          ].map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.key
            const badge = item.key === "wishlist" ? getWishlistCount() : item.key === "cart" ? getItemCount() : 0

            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key as typeof activeTab)}
                className={`relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {badge > 0 ? (
                    <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  ) : null}
                </div>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {showAuthPrompt ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-3xl bg-card p-3 shadow-2xl">
              <BuyerAuth
                mode="modal"
                onBack={() => setShowAuthPrompt(false)}
                onSuccess={() => setShowAuthPrompt(false)}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
