"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { formatNaira } from "@/lib/currency-utils"
import { BrandWordmark } from "@/components/brand-wordmark"
import {
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  MapPin,
  Navigation,
  Package,
  RefreshCw,
  Truck,
  Wallet,
} from "lucide-react"

type RiderSession = {
  id: string
  name: string
  phone: string
  email?: string | null
  region?: string | null
}

type RiderOrder = {
  order_id: string
  logistics_status: string
  order_status: string
  delivery_address: string
  delivery_fee: number
  grand_total: number
  assigned_at: string | null
  completed_at: string | null
  notes: string | null
  updated_at: string
  created_at: string
}

const statusLabels: Record<string, string> = {
  assigned: "Ready to Pick Up",
  in_transit: "In Transit",
  completed: "Delivered",
  pending: "Pending",
}

const statusColors: Record<string, string> = {
  assigned: "bg-blue-100 text-blue-700",
  in_transit: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function RiderDashboardPage() {
  const router = useRouter()
  const [rider, setRider] = useState<RiderSession | null>(null)
  const [orders, setOrders] = useState<RiderOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busyOrder, setBusyOrder] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = localStorage.getItem("rider_session")
    if (!raw) {
      router.replace("/rider/login")
      return
    }
    try {
      const session = JSON.parse(raw) as RiderSession
      setRider(session)
    } catch {
      router.replace("/rider/login")
    }
  }, [router])

  const loadOrders = async (riderId: string) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/rider/orders", {
        headers: { "x-rider-id": riderId },
        cache: "no-store",
      })
      const result = await res.json()
      if (!result.success) {
        setError(result.error || "Failed to load orders.")
        return
      }
      setOrders(Array.isArray(result.data) ? result.data : [])
    } catch {
      setError("Network error. Please refresh.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (rider?.id) loadOrders(rider.id)
  }, [rider?.id])

  const updateStatus = async (orderId: string, newStatus: string) => {
    if (!rider?.id) return
    setBusyOrder(orderId)
    try {
      const res = await fetch(`/api/rider/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-rider-id": rider.id,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      const result = await res.json()
      if (!result.success) {
        setError(result.error || "Failed to update status.")
        return
      }
      await loadOrders(rider.id)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setBusyOrder("")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("rider_session")
    router.replace("/rider/login")
  }

  const todayOrders = useMemo(
    () =>
      orders.filter((o) => {
        if (!o.assigned_at) return false
        return new Date(o.assigned_at).toDateString() === new Date().toDateString()
      }),
    [orders]
  )

  const activeOrders = useMemo(
    () => orders.filter((o) => ["assigned", "in_transit"].includes(o.logistics_status)),
    [orders]
  )

  const completedOrders = useMemo(
    () => orders.filter((o) => o.logistics_status === "completed"),
    [orders]
  )

  const totalEarnings = useMemo(
    () => completedOrders.reduce((sum, o) => sum + o.delivery_fee, 0),
    [completedOrders]
  )

  const todayEarnings = useMemo(
    () =>
      todayOrders
        .filter((o) => o.logistics_status === "completed")
        .reduce((sum, o) => sum + o.delivery_fee, 0),
    [todayOrders]
  )

  if (!rider) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-3 max-w-2xl mx-auto">
          <BrandWordmark compact />
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log out
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full space-y-5">
        {/* Rider greeting */}
        <div className="rounded-2xl bg-primary text-primary-foreground p-4 flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">Welcome back,</p>
            <p className="text-lg font-bold">{rider.name}</p>
            <p className="text-xs opacity-70 mt-0.5">{rider.region ? `📍 ${rider.region}` : rider.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-70">Active orders</p>
            <p className="text-3xl font-bold">{activeOrders.length}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{activeOrders.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Active</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{completedOrders.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Delivered</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-bold text-primary">{formatNaira(todayEarnings)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Today</p>
          </div>
        </div>

        {/* Earnings card */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Total Earnings</p>
              <p className="text-xs text-muted-foreground">Across all deliveries</p>
            </div>
          </div>
          <p className="text-lg font-bold text-primary">{formatNaira(totalEarnings)}</p>
        </div>

        {/* Refresh + error */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">My Deliveries</h2>
          <button
            onClick={() => loadOrders(rider.id)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <Package className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No deliveries assigned yet.</p>
            <p className="text-xs text-muted-foreground">Check back soon or contact your coordinator.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const status = order.logistics_status
              const isBusy = busyOrder === order.order_id
              const canMarkTransit = status === "assigned"
              const canMarkDelivered = status === "in_transit"

              return (
                <div key={order.order_id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  {/* Order header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Order #{String(order.order_id).slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Assigned: {formatDate(order.assigned_at)}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[status] || "bg-muted text-muted-foreground"}`}>
                      {statusLabels[status] || status}
                    </span>
                  </div>

                  {/* Delivery address */}
                  <div className="flex items-start gap-2 rounded-xl bg-secondary/50 px-3 py-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{order.delivery_address || "No address provided"}</p>
                  </div>

                  {/* Navigate button */}
                  {order.delivery_address && status !== "completed" && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Open in Google Maps
                    </a>
                  )}

                  {/* Fee */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Your delivery fee</span>
                    <span className="font-bold text-primary">{formatNaira(order.delivery_fee)}</span>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                      {order.notes}
                    </p>
                  )}

                  {/* Status completed info */}
                  {status === "completed" && (
                    <div className="flex items-center gap-2 text-xs text-green-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed: {formatDate(order.completed_at)}
                    </div>
                  )}

                  {/* Action buttons */}
                  {(canMarkTransit || canMarkDelivered) && (
                    <div className="pt-1">
                      {canMarkTransit && (
                        <button
                          onClick={() => updateStatus(order.order_id, "in_transit")}
                          disabled={isBusy}
                          className="w-full rounded-xl bg-indigo-600 text-white py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                          {isBusy ? "Updating…" : "Mark as In Transit"}
                        </button>
                      )}
                      {canMarkDelivered && (
                        <button
                          onClick={() => updateStatus(order.order_id, "completed")}
                          disabled={isBusy}
                          className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          {isBusy ? "Updating…" : "Mark as Delivered"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

    </div>
  )
}
