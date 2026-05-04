"use client"

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Edit2, FileText, Loader2, Plus, Power, Send, Trash2, Wrench, X } from 'lucide-react'
import { formatNaira } from '@/lib/currency-utils'

const SERVICE_CATEGORY_OPTIONS = [
  'Cleaning',
  'Repairs',
  'Beauty',
  'Home Services',
  'Tech Support',
  'Event Services',
  'Health & Wellness',
  'Tutoring',
  'Moving & Delivery',
  'Other',
]

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function statusClass(status: string) {
  const key = String(status || '').toLowerCase()
  if (key === 'completed' || key === 'released') return 'bg-primary/10 text-primary'
  if (key === 'disputed' || key === 'cancelled') return 'bg-destructive/10 text-destructive'
  return 'bg-secondary text-foreground'
}

export function MerchantServices({ merchantId }: { merchantId: string }) {
  const [services, setServices] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [bills, setBills] = useState<any[]>([])
  const [showBillForm, setShowBillForm] = useState(false)
  const [sendingBill, setSendingBill] = useState(false)
  const [billForm, setBillForm] = useState({
    buyerId: '',
    scopeSummary: '',
    timeline: '',
    lineItems: [{ description: '', quantity: 1, unit_price: 0 }] as { description: string; quantity: number; unit_price: number }[],
    discountAmount: '',
    notes: '',
    validUntil: '',
  })
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    basePrice: '',
    workingDays: [] as string[],
    workingHours: '',
    serviceCity: '',
    serviceState: '',
  })

  const loadBills = async () => {
    try {
      const response = await fetch(`/api/service-bills?merchantId=${encodeURIComponent(merchantId)}`)
      const result = await response.json()
      if (result.success && Array.isArray(result.data)) setBills(result.data)
    } catch {}
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [servicesResponse, bookingsResponse] = await Promise.all([
        fetch(`/api/services?merchantId=${merchantId}`),
        fetch(`/api/service-bookings?merchantId=${merchantId}`),
      ])

      const servicesResult = await servicesResponse.json()
      const bookingsResult = await bookingsResponse.json()

      if (servicesResult.success && Array.isArray(servicesResult.data)) {
        setServices(servicesResult.data)
      }

      if (bookingsResult.success && Array.isArray(bookingsResult.data)) {
        setBookings(bookingsResult.data)
      }

      if (!servicesResult.success) {
        setError(servicesResult.error || 'Failed to load services')
      } else {
        setError('')
      }
    } catch (err) {
      console.error('Load merchant services failed:', err)
      setError('Unable to load service data')
    } finally {
      setLoading(false)
    }
    await loadBills()
  }

  useEffect(() => {
    if (!merchantId) return
    loadData()
  }, [merchantId])

  const createListing = async () => {
    if (!form.title.trim()) {
      setError('Service title is required')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          title: form.title,
          description: form.description,
          category: form.category,
          basePrice: Number(form.basePrice || 0),
          workingDays: form.workingDays,
          workingHours: form.workingHours,
          serviceCity: form.serviceCity,
          serviceState: form.serviceState,
        }),
      })

      const result = await response.json()
      if (!result.success) {
        setError(result.error || 'Failed to create service listing')
        return
      }

      setForm({
        title: '',
        description: '',
        category: '',
        basePrice: '',
        workingDays: [],
        workingHours: '',
        serviceCity: '',
        serviceState: '',
      })
      setError('')
      await loadData()
    } catch (err) {
      console.error('Create listing failed:', err)
      setError('Unable to create service listing')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (service: any) => {
    setEditingId(service.id)
    setEditForm({
      title: service.title || '',
      description: service.description || '',
      category: service.category || '',
      basePrice: String(service.base_price || ''),
      workingDays: Array.isArray(service.working_days) ? service.working_days : [],
      workingHours: service.working_hours || '',
      serviceCity: service.service_city || '',
      serviceState: service.service_state || '',
    })
  }

  const saveEdit = async (serviceId: string) => {
    setSaving(true)
    try {
      const response = await fetch('/api/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          serviceId,
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          basePrice: Number(editForm.basePrice || 0),
          workingDays: editForm.workingDays,
          workingHours: editForm.workingHours,
          serviceCity: editForm.serviceCity,
          serviceState: editForm.serviceState,
        }),
      })
      const result = await response.json()
      if (!result.success) { setError(result.error || 'Failed to update service'); return }
      setEditingId(null)
      await loadData()
    } catch {
      setError('Unable to update service')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (service: any) => {
    setTogglingId(service.id)
    try {
      const response = await fetch('/api/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, serviceId: service.id, toggleActive: !service.is_active }),
      })
      const result = await response.json()
      if (!result.success) setError(result.error || 'Failed to toggle service')
      else await loadData()
    } catch {
      setError('Unable to toggle service')
    } finally {
      setTogglingId(null)
    }
  }

  const deleteService = async (serviceId: string) => {
    if (!window.confirm('Delete this service listing? This cannot be undone.')) return
    setDeletingId(serviceId)
    try {
      const response = await fetch('/api/services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, serviceId }),
      })
      const result = await response.json()
      if (!result.success) setError(result.error || 'Failed to delete service')
      else await loadData()
    } catch {
      setError('Unable to delete service')
    } finally {
      setDeletingId(null)
    }
  }

  const createAndSendBill = async () => {
    if (!billForm.buyerId.trim()) { setError('Buyer ID is required'); return }
    if (!billForm.scopeSummary.trim()) { setError('Scope summary is required'); return }
    if (billForm.lineItems.length === 0 || !billForm.lineItems[0].description) { setError('Add at least one line item'); return }
    setSendingBill(true)
    try {
      const createRes = await fetch('/api/service-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          buyerId: billForm.buyerId.trim(),
          scopeSummary: billForm.scopeSummary,
          timeline: billForm.timeline,
          lineItems: billForm.lineItems.filter((i) => i.description.trim()),
          discountAmount: Number(billForm.discountAmount || 0),
          notes: billForm.notes,
          validUntil: billForm.validUntil || null,
        }),
      })
      const createResult = await createRes.json()
      if (!createResult.success) { setError(createResult.error || 'Failed to create bill'); return }
      const billId = createResult.data?.id
      const sendRes = await fetch('/api/service-bills', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', billId, merchantId }),
      })
      const sendResult = await sendRes.json()
      if (!sendResult.success) { setError(sendResult.error || 'Bill created but failed to send'); return }
      setBillForm({ buyerId: '', scopeSummary: '', timeline: '', lineItems: [{ description: '', quantity: 1, unit_price: 0 }], discountAmount: '', notes: '', validUntil: '' })
      setShowBillForm(false)
      setError('')
      await loadBills()
    } catch {
      setError('Unable to send bill')
    } finally {
      setSendingBill(false)
    }
  }

  const cancelBill = async (billId: string) => {
    try {
      await fetch('/api/service-bills', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', billId, actorId: merchantId, actorType: 'merchant' }),
      })
      await loadBills()
    } catch {}
  }

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const response = await fetch('/api/service-bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          status,
          actorId: merchantId,
          actorType: 'merchant',
        }),
      })

      const result = await response.json()
      if (!result.success) {
        setError(result.error || 'Failed to update booking status')
        return
      }

      await loadData()
    } catch (err) {
      console.error('Update booking status failed:', err)
      setError('Unable to update booking status')
    }
  }

  return (
    <div className="px-4 py-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Services</h2>
          <p className="text-sm text-muted-foreground">Create and manage service listings and bookings.</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Wrench className="w-5 h-5" />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {/* Add new service toggle */}
      <button
        onClick={() => setShowAddForm((v) => !v)}
        className="w-full flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
      >
        <span className="text-sm font-semibold text-foreground flex items-center gap-2"><Plus className="w-4 h-4" /> Add New Service</span>
        {showAddForm ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {showAddForm && (
        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs text-muted-foreground">Fill each box with the suggested content below.</p>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Service title: short clear name. Example: Home Plumbing Repair.</p>
            <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Service title" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Description: what is included and any limits.</p>
            <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Describe what is included" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm min-h-20" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Category</p>
              <select value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                <option value="">Select category</option>
                {SERVICE_CATEGORY_OPTIONS.map((option) => (<option key={option} value={option}>{option}</option>))}
              </select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Base price (₦)</p>
              <input value={form.basePrice} onChange={(e) => setForm((prev) => ({ ...prev, basePrice: e.target.value }))} placeholder="Base price" type="number" min={0} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">City</p>
              <input value={form.serviceCity} onChange={(e) => setForm((prev) => ({ ...prev, serviceCity: e.target.value }))} placeholder="City" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">State</p>
              <input value={form.serviceState} onChange={(e) => setForm((prev) => ({ ...prev, serviceState: e.target.value }))} placeholder="State" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1 col-span-2">
              <p className="text-xs text-muted-foreground">Working days</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border border-border bg-background p-3">
                {WEEK_DAYS.map((day) => {
                  const checked = form.workingDays.includes(day)
                  return (
                    <label key={day} className="inline-flex items-center gap-2 text-xs text-foreground">
                      <input type="checkbox" checked={checked} onChange={() => setForm((prev) => ({ ...prev, workingDays: checked ? prev.workingDays.filter((d) => d !== day) : [...prev.workingDays, day] }))} />
                      {day}
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="space-y-1 col-span-2">
              <p className="text-xs text-muted-foreground">Working hours. Example: 8:00 AM - 6:00 PM</p>
              <input value={form.workingHours} onChange={(e) => setForm((prev) => ({ ...prev, workingHours: e.target.value }))} placeholder="8:00 AM - 6:00 PM" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <button onClick={createListing} disabled={saving} className="w-full rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium disabled:opacity-60">
            {saving ? 'Creating...' : 'Create Service Listing'}
          </button>
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold text-foreground mb-2">Your Service Listings</h3>
        {loading ? (
          <div className="py-10 flex items-center justify-center text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin mr-2" />Loading...</div>
        ) : services.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">You have not added services yet.</div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id} className={`rounded-2xl border bg-card p-4 ${service.is_active ? 'border-border' : 'border-border/50 opacity-60'}`}>
                {editingId === service.id ? (
                  <div className="space-y-2">
                    <input value={editForm.title} onChange={(e) => setEditForm((p: any) => ({ ...p, title: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="Title" />
                    <textarea value={editForm.description} onChange={(e) => setEditForm((p: any) => ({ ...p, description: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm min-h-16" placeholder="Description" />
                    <div className="grid grid-cols-2 gap-2">
                      <select value={editForm.category} onChange={(e) => setEditForm((p: any) => ({ ...p, category: e.target.value }))} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
                        <option value="">Category</option>
                        {SERVICE_CATEGORY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <input value={editForm.basePrice} onChange={(e) => setEditForm((p: any) => ({ ...p, basePrice: e.target.value }))} type="number" placeholder="Price" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                      <input value={editForm.serviceCity} onChange={(e) => setEditForm((p: any) => ({ ...p, serviceCity: e.target.value }))} placeholder="City" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                      <input value={editForm.serviceState} onChange={(e) => setEditForm((p: any) => ({ ...p, serviceState: e.target.value }))} placeholder="State" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                      <input value={editForm.workingHours} onChange={(e) => setEditForm((p: any) => ({ ...p, workingHours: e.target.value }))} placeholder="Working hours" className="col-span-2 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(service.id)} disabled={saving} className="flex-1 rounded-lg bg-primary text-primary-foreground py-2 text-xs font-medium disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
                      <button onClick={() => setEditingId(null)} className="flex-1 rounded-lg border border-border bg-background text-foreground py-2 text-xs font-medium">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground text-sm">{service.title}</p>
                          {service.is_active ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Active</span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">Inactive</span>
                          )}
                        </div>
                        {service.category && <p className="text-xs text-muted-foreground mt-0.5">{service.category}</p>}
                        {service.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {Array.isArray(service.working_days) && service.working_days.length > 0 ? service.working_days.join(', ') : 'Days not set'}
                          {service.working_hours ? ` • ${service.working_hours}` : ''}
                        </p>
                        {(service.service_city || service.service_state) && (
                          <p className="text-xs text-muted-foreground">{[service.service_city, service.service_state].filter(Boolean).join(', ')}</p>
                        )}
                      </div>
                      <p className="text-sm font-bold text-foreground whitespace-nowrap">{formatNaira(Number(service.base_price || 0))}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => startEdit(service)} className="flex-1 rounded-lg border border-border bg-background text-foreground py-2 text-xs font-medium flex items-center justify-center gap-1">
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => toggleActive(service)} disabled={togglingId === service.id} className="flex-1 rounded-lg border border-border bg-background text-foreground py-2 text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-60">
                        <Power className="w-3 h-3" /> {togglingId === service.id ? '...' : service.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => deleteService(service.id)} disabled={deletingId === service.id} className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive py-2 px-3 text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-60">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Billing Section */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">Service Bills</h3>
          <button onClick={() => setShowBillForm((v) => !v)} className="inline-flex items-center gap-1.5 text-xs text-primary font-medium border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5">
            <FileText className="w-3.5 h-3.5" /> {showBillForm ? 'Hide Form' : 'Send New Bill'}
          </button>
        </div>

        {showBillForm && (
          <div className="rounded-2xl border border-border bg-card p-4 mb-3 space-y-3">
            <p className="text-xs text-muted-foreground">Create and send a bill to a buyer. They will pay through their wallet and funds go to escrow.</p>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Buyer ID</label>
              <select
                value={billForm.buyerId}
                onChange={(e) => setBillForm((p) => ({ ...p, buyerId: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select from bookings or enter ID...</option>
                {Array.from(new Map(bookings.filter((b) => b.buyer_id).map((b) => [b.buyer_id, b.buyer_name || b.buyer_id])).entries()).map(([id, name]) => (
                  <option key={id} value={id}>{name} ({id.slice(0, 8)}...)</option>
                ))}
              </select>
              <input value={billForm.buyerId} onChange={(e) => setBillForm((p) => ({ ...p, buyerId: e.target.value }))} placeholder="Or paste buyer ID directly" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm mt-1" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Scope / What is included</label>
              <input value={billForm.scopeSummary} onChange={(e) => setBillForm((p) => ({ ...p, scopeSummary: e.target.value }))} placeholder="e.g. Full house cleaning + laundry" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Timeline</label>
                <input value={billForm.timeline} onChange={(e) => setBillForm((p) => ({ ...p, timeline: e.target.value }))} placeholder="e.g. 1 day" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Valid Until</label>
                <input type="date" value={billForm.validUntil} onChange={(e) => setBillForm((p) => ({ ...p, validUntil: e.target.value }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground font-medium">Line Items</label>
                <button onClick={() => setBillForm((p) => ({ ...p, lineItems: [...p.lineItems, { description: '', quantity: 1, unit_price: 0 }] }))} className="text-xs text-primary font-medium">+ Add Row</button>
              </div>
              {billForm.lineItems.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-1 items-center">
                  <input value={item.description} onChange={(e) => setBillForm((p) => { const li = [...p.lineItems]; li[i] = { ...li[i], description: e.target.value }; return { ...p, lineItems: li } })} placeholder="Description" className="col-span-5 rounded-lg border border-border bg-background px-2 py-1.5 text-xs" />
                  <input type="number" min={1} value={item.quantity} onChange={(e) => setBillForm((p) => { const li = [...p.lineItems]; li[i] = { ...li[i], quantity: Number(e.target.value) }; return { ...p, lineItems: li } })} placeholder="Qty" className="col-span-2 rounded-lg border border-border bg-background px-2 py-1.5 text-xs" />
                  <input type="number" min={0} value={item.unit_price} onChange={(e) => setBillForm((p) => { const li = [...p.lineItems]; li[i] = { ...li[i], unit_price: Number(e.target.value) }; return { ...p, lineItems: li } })} placeholder="Price" className="col-span-4 rounded-lg border border-border bg-background px-2 py-1.5 text-xs" />
                  {billForm.lineItems.length > 1 && (
                    <button onClick={() => setBillForm((p) => ({ ...p, lineItems: p.lineItems.filter((_, j) => j !== i) }))} className="col-span-1 text-destructive"><X className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Discount (₦)</label>
                <input type="number" min={0} value={billForm.discountAmount} onChange={(e) => setBillForm((p) => ({ ...p, discountAmount: e.target.value }))} placeholder="0" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Total (auto-calculated)</label>
                <div className="rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm font-semibold text-foreground">
                  ₦{(billForm.lineItems.reduce((sum, i) => sum + Number(i.unit_price) * Number(i.quantity || 1), 0) - Number(billForm.discountAmount || 0)).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Notes (optional)</label>
              <textarea value={billForm.notes} onChange={(e) => setBillForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Any additional notes for the buyer" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm min-h-16" />
            </div>
            <button onClick={createAndSendBill} disabled={sendingBill} className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />{sendingBill ? 'Sending...' : 'Send Bill to Buyer'}
            </button>
          </div>
        )}

        {bills.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">No bills sent yet.</div>
        ) : (
          <div className="space-y-2">
            {bills.map((bill) => (
              <div key={bill.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{bill.scope_summary || 'Service bill'}</p>
                    <p className="text-xs text-muted-foreground">Buyer: {bill.buyer_name || bill.buyer_id?.slice(0, 12) || 'Buyer'}</p>
                    {bill.timeline && <p className="text-xs text-muted-foreground">Timeline: {bill.timeline}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(bill.created_at).toLocaleDateString('en-NG')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">₦{Number(bill.total_amount).toLocaleString()}</p>
                    <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      bill.status === 'paid' ? 'bg-primary/10 text-primary' :
                      bill.status === 'sent' ? 'bg-amber-100 text-amber-700' :
                      bill.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                      'bg-secondary text-foreground'
                    }`}>{bill.status}</span>
                  </div>
                </div>
                {['draft', 'sent'].includes(bill.status) && (
                  <button onClick={() => cancelBill(bill.id)} className="mt-2 text-xs text-destructive border border-destructive/30 rounded-lg px-3 py-1.5">Cancel Bill</button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground mb-2">Incoming Service Bookings</h3>
        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">No bookings yet.</div>
        ) : (
          <div className="space-y-2">
            {bookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{booking.service?.title || 'Service booking'}</p>
                    <p className="text-xs text-muted-foreground mt-1">Buyer: {booking.buyer_name || 'Buyer'}</p>
                    {booking.service_address && <p className="text-xs text-muted-foreground">Address: {booking.service_address}</p>}
                    {booking.scheduled_at && <p className="text-xs text-muted-foreground">Scheduled: {new Date(booking.scheduled_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
                    {booking.buyer_note && <p className="text-xs text-muted-foreground italic">"{booking.buyer_note}"</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{formatNaira(Number(booking.quoted_price || 0))}</p>
                    <span className={`inline-flex mt-1 px-2 py-1 rounded-full text-[11px] font-medium ${statusClass(booking.status)}`}>
                      {String(booking.status || 'requested').replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {booking.status === 'requested' && (
                    <button onClick={() => updateBookingStatus(booking.id, 'accepted')} className="rounded-lg bg-primary text-primary-foreground py-2 px-3 text-xs font-medium">Accept</button>
                  )}
                  {['requested', 'accepted'].includes(booking.status) && (
                    <button onClick={() => updateBookingStatus(booking.id, 'scheduled')} className="rounded-lg bg-secondary text-foreground py-2 px-3 text-xs font-medium">Mark Scheduled</button>
                  )}
                  {['scheduled', 'accepted'].includes(booking.status) && (
                    <button onClick={() => updateBookingStatus(booking.id, 'in_progress')} className="rounded-lg bg-secondary text-foreground py-2 px-3 text-xs font-medium">Start Job</button>
                  )}
                  {booking.status === 'in_progress' && (
                    <button onClick={() => updateBookingStatus(booking.id, 'completed')} className="rounded-lg bg-primary text-primary-foreground py-2 px-3 text-xs font-medium">Mark Completed</button>
                  )}
                  {!['completed', 'released', 'disputed', 'cancelled'].includes(String(booking.status || '')) && (
                    <button onClick={() => updateBookingStatus(booking.id, 'cancelled')} className="rounded-lg bg-destructive/10 text-destructive py-2 px-3 text-xs font-medium">Cancel</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
