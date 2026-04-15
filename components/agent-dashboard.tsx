"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useRole } from "@/lib/role-context"
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  RefreshCw,
  UserRound,
  Users,
} from "lucide-react"

type OnboardingStatus = "not_started" | "in_progress" | "completed"

interface OnboardingRequest {
  id: string
  business_name: string
  category: string
  date_of_commencement: string
  owner_name: string
  phone: string
  email: string
  onboarding_status: OnboardingStatus
  assigned_agent_id: string | null
  created_at?: string
}

export function AgentDashboard() {
  const router = useRouter()
  const { role, user, setRole, setUser } = useRole()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState("")
  const [error, setError] = useState("")
  const [requests, setRequests] = useState<OnboardingRequest[]>([])
  const [selectedRequestId, setSelectedRequestId] = useState("")

  const currentAgentId = String(user?.userId || (user as any)?.id || "").trim()

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedRequestId) || null,
    [requests, selectedRequestId]
  )

  const queue = useMemo(
    () => requests.filter((request) => request.onboarding_status !== "completed"),
    [requests]
  )

  const stats = useMemo(() => {
    return {
      totalMerchants: requests.length,
      pendingOnboarding: requests.filter((request) => request.onboarding_status === "not_started").length,
      inProgress: requests.filter((request) => request.onboarding_status === "in_progress").length,
      completed: requests.filter((request) => request.onboarding_status === "completed").length,
    }
  }, [requests])

  const loadRequests = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/onboarding/requests")
      const result = await response.json()
      if (!result.success) {
        setError(result.error || "Failed to load onboarding requests")
        setRequests([])
        return
      }

      const next = (result.requests || []) as OnboardingRequest[]
      setRequests(next)

      if (next.length === 0) {
        setSelectedRequestId("")
        return
      }

      if (!next.some((request) => request.id === selectedRequestId)) {
        const firstQueueItem = next.find((request) => request.onboarding_status !== "completed")
        setSelectedRequestId(firstQueueItem?.id || next[0].id)
      }
    } catch {
      setError("Failed to load onboarding requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (role !== "agent") return
    loadRequests()
  }, [role])

  const markCompleted = async (requestId: string) => {
    if (!currentAgentId) {
      setError("Unable to determine agent id for this session. Please logout and login again.")
      return
    }

    setActionLoading(`complete:${requestId}`)
    setError("")
    try {
      const response = await fetch(`/api/onboarding/requests/${requestId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: currentAgentId, agentId: currentAgentId }),
      })

      const result = await response.json()
      if (!result.success) {
        setError(result.error || "Failed to complete request")
        return
      }

      await loadRequests()
    } catch {
      setError("Failed to complete request")
    } finally {
      setActionLoading("")
    }
  }

  const startChat = (request: OnboardingRequest) => {
    const subject = encodeURIComponent(`BigCat Onboarding Support: ${request.business_name}`)
    const body = encodeURIComponent(
      `Hello ${request.owner_name},\n\nI am your assigned onboarding agent on BigCat. Let's continue your onboarding process.`
    )
    window.open(`mailto:${request.email}?subject=${subject}&body=${body}`, "_blank")
  }

  const logout = () => {
    setUser(null)
    setRole(null)
    router.push("/")
  }

  if (role !== "agent") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card border border-border rounded-2xl p-6 text-center max-w-md w-full">
          <p className="font-semibold text-foreground">Unauthorized</p>
          <p className="text-sm text-muted-foreground mt-2">Only agents can access this dashboard.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] min-h-screen">
        <aside className="border-r border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Agent Workspace</p>
              <p className="text-xs text-muted-foreground">Onboarding Queue</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="rounded-xl border border-border p-3">
              <p className="text-muted-foreground">Agent</p>
              <p className="font-medium text-foreground mt-1">{user?.name || "Agent"}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {(user as any)?.region || "Nigeria"}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </aside>

        <main className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Merchant Onboarding Dashboard</h1>
              <p className="text-sm text-muted-foreground">Merchant requests are automatically assigned to active agents.</p>
            </div>
            <button
              onClick={loadRequests}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-secondary disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}

          <div className="mt-5 grid grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard label="Total Merchants" value={stats.totalMerchants} icon={<Users className="w-4 h-4" />} />
            <StatCard label="Pending" value={stats.pendingOnboarding} icon={<Clock className="w-4 h-4" />} />
            <StatCard label="In Progress" value={stats.inProgress} icon={<Loader2 className="w-4 h-4" />} />
            <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 className="w-4 h-4" />} />
          </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
            <section className="bg-card border border-border rounded-xl">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Merchant Queue</h2>
                <p className="text-xs text-muted-foreground mt-1">All merchants not yet completed</p>
              </div>

              {loading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : queue.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No pending onboarding requests.</div>
              ) : (
                <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
                  {queue.map((request) => {
                    const isAssignedToCurrent = request.assigned_agent_id === currentAgentId
                    const isAssignedToOther = Boolean(request.assigned_agent_id) && !isAssignedToCurrent

                    return (
                      <div
                        key={request.id}
                        className={`p-4 ${selectedRequestId === request.id ? "bg-secondary/40" : ""}`}
                      >
                        <button
                          onClick={() => setSelectedRequestId(request.id)}
                          className="w-full text-left"
                        >
                          <p className="font-medium text-foreground">{request.business_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{request.category}</p>
                          <div className="mt-2">
                            <StatusBadge status={request.onboarding_status} />
                          </div>
                        </button>

                        <div className="mt-3">
                          {!request.assigned_agent_id ? (
                            <span className="inline-flex text-xs px-3 py-2 rounded-lg border border-amber-300/60 bg-amber-50 text-amber-700">
                              Awaiting auto-assignment
                            </span>
                          ) : isAssignedToCurrent ? (
                            <button
                              onClick={() => setSelectedRequestId(request.id)}
                              className="text-xs px-3 py-2 rounded-lg border border-border hover:bg-secondary"
                            >
                              Continue Chat
                            </button>
                          ) : (
                            <button
                              disabled
                              className="text-xs px-3 py-2 rounded-lg border border-border text-muted-foreground cursor-not-allowed"
                            >
                              Assigned to another agent
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="bg-card border border-border rounded-xl">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Merchant Details</h2>
              </div>

              {!selectedRequest ? (
                <div className="p-8 text-sm text-muted-foreground">Select a merchant request from the queue.</div>
              ) : (
                <div className="p-4 space-y-3">
                  <Detail label="Business Name" value={selectedRequest.business_name} />
                  <Detail label="Category" value={selectedRequest.category} />
                  <Detail label="Date of Commencement" value={selectedRequest.date_of_commencement} />
                  <Detail label="Owner Name" value={selectedRequest.owner_name} />
                  <Detail label="Phone" value={selectedRequest.phone} />
                  <Detail label="Email" value={selectedRequest.email} />
                  <div className="pt-2">
                    <StatusBadge status={selectedRequest.onboarding_status} />
                  </div>

                  <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => startChat(selectedRequest)}
                      disabled={selectedRequest.assigned_agent_id !== currentAgentId}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Mail className="w-4 h-4" />
                      Start Chat
                    </button>
                    <button
                      onClick={() => markCompleted(selectedRequest.id)}
                      disabled={
                        selectedRequest.assigned_agent_id !== currentAgentId ||
                        selectedRequest.onboarding_status === "completed" ||
                        actionLoading === `complete:${selectedRequest.id}`
                      }
                      className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === `complete:${selectedRequest.id}` ? "Updating..." : "Mark as Completed"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: OnboardingStatus }) {
  if (status === "completed") {
    return <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Completed</span>
  }

  if (status === "in_progress") {
    return <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">In Progress</span>
  }

  return <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">Not Started</span>
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="inline-flex rounded-lg bg-secondary p-2 text-muted-foreground">{icon}</div>
      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground font-medium mt-1 break-words">{value || "-"}</p>
    </div>
  )
}
