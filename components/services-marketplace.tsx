"use client"

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Loader2, Search, Wrench } from 'lucide-react'
import { formatNaira } from '@/lib/currency-utils'
import { getUserStrikeCount, isUserSuspended, resetSafetyState, syncSafetyStateFromServer } from '@/lib/trust-safety'

export function ServicesMarketplace({
  buyerId,
  onBack,
  onChatMerchant,
  onNeedsAuth,
}: {
  buyerId: string
  onBack: () => void
  onChatMerchant?: (conversation?: any) => void
  onNeedsAuth?: () => void
}) {
  const [services, setServices] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')
  const [selectedService, setSelectedService] = useState<any | null>(null)
  const [serviceAddress, setServiceAddress] = useState('')
  const [buyerNote, setBuyerNote] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [suspended, setSuspended] = useState(false)
  const [strikeCount, setStrikeCount] = useState(0)

  const syncSuspensionFromServer = async () => {
    try {
      const response = await fetch(`/api/safety/status?userId=${encodeURIComponent(buyerId)}`)
      const result = await response.json()
      if (result.success) {
        const nextStrikes = Number(result.strikes || 0)
        const nextSuspended = Boolean(result.suspended)
        const nextRemainingMs = Number(result.remainingMs || 0)

        syncSafetyStateFromServer(buyerId, {
          strikes: nextStrikes,
          suspended: nextSuspended,
          remainingMs: nextRemainingMs,
        })

        setStrikeCount(nextStrikes)
        setSuspended(nextSuspended)
        return
      }
    } catch (err) {
      console.error('Safety status sync failed:', err)
    }

    setSuspended(isUserSuspended(buyerId))
    setStrikeCount(getUserStrikeCount(buyerId))
  }

  const guardSuspendedAction = () => {
    if (!suspended) return false
    setError('Your account has been temporarily suspended for violating platform policies.')
    return true
  }

  const categories = useMemo(() => {
    const set = new Set<string>()
    services.forEach((service) => {
      if (service?.category) set.add(String(service.category))
    })
    return Array.from(set)
  }, [services])

  const loadServices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('search', query.trim())
      if (category) params.set('category', category)

      const response = await fetch(`/api/services?${params.toString()}`)
      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Failed to fetch services')
        setServices([])
        return
      }

      setServices(Array.isArray(result.data) ? result.data : [])
      setError('')
    } catch (err) {
      console.error('Load services failed:', err)
      setError('Unable to load services')
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  const loadBookings = async () => {
    try {
      const response = await fetch(`/api/service-bookings?buyerId=${buyerId}`)
      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        setBookings(result.data)
      }
    } catch (err) {
      console.error('Load bookings failed:', err)
    }
  }

  useEffect(() => {
    loadServices()
  }, [category])

  useEffect(() => {
    loadBookings()
  }, [buyerId])

  useEffect(() => {
    syncSuspensionFromServer()
  }, [buyerId])

  const startChatWithMerchant = async (service: any) => {
    if (buyerId === 'guest') { onNeedsAuth?.(); return }
    if (guardSuspendedAction()) return

    const merchantId = String(service?.merchant_id || '').trim()
    if (!merchantId) {
      setError('Merchant is not available for chat yet')
      return
    }

    try {
      const response = await fetch('/api/messages/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId, merchantId }),
      })

      const result = await response.json()
      if (!result.success) {
        setError(result.error || 'Unable to start chat')
        return
      }

      onChatMerchant?.({
        id: result.data?.id,
        vendorId: merchantId,
        vendorName: service.merchant_name || 'Merchant',
        vendorLocation: service.service_city || service.service_state || 'Nigeria',
        vendorRating: 5,
        lastMessage: 'Start a conversation',
        timestamp: new Date(),
        unread: 0,
        avatar: String(service.merchant_name || 'M').charAt(0).toUpperCase(),
      })
    } catch (err) {
      console.error('Start merchant chat failed:', err)
      setError('Unable to start chat with merchant')
    }
  }

  const submitBooking = async () => {
    if (buyerId === 'guest') { onNeedsAuth?.(); return }
    if (guardSuspendedAction()) return

    if (!selectedService) return

    if (!serviceAddress.trim()) {
      setError('Please enter a service address')
      return
    }

    setBookingLoading(true)
    try {
      const response = await fetch('/api/service-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          buyerId,
          scheduledAt: scheduledAt || null,
          serviceAddress: serviceAddress.trim(),
          buyerNote: buyerNote.trim(),
        }),
      })

      const result = await response.json()

      if (!result.success) {
        if (result.code === 'POLICY_USER_SUSPENDED') {
          syncSafetyStateFromServer(buyerId, { strikes: Number(result.strikes || 0), suspended: true, remainingMs: Number(result.remainingMs || 0) })
          setSuspended(true)
        }
        setError(result.error || 'Booking failed. Please try again.')
        return
      }

      setSelectedService(null)
      setServiceAddress('')
      setBuyerNote('')
      setScheduledAt('')
      setError('')
      await loadBookings()
    } catch (err) {
      console.error('Submit booking failed:', err)
      setError('Unable to submit booking. Please try again.')
    } finally {
      setBookingLoading(false)
    }
  }

  const updateBooking = async (bookingId: string, status: 'released' | 'disputed') => {
    if (guardSuspendedAction()) return

    try {
      const response = await fetch('/api/service-bookings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          status,
          actorId: buyerId,
          actorType: 'buyer',
        }),
      })

      const result = await response.json()
      if (!result.success) {
        if (result.code === 'POLICY_USER_SUSPENDED') {
          const nextStrikes = Number(result.strikes || 0)
          const nextSuspended = Boolean(result.suspended)
          const nextRemainingMs = Number(result.remainingMs || 0)

          syncSafetyStateFromServer(buyerId, {
            strikes: nextStrikes,
            suspended: nextSuspended,
            remainingMs: nextRemainingMs,
          })
          setStrikeCount(nextStrikes)
          setSuspended(nextSuspended)
        }

        setError(result.error || 'Failed to update booking')
        return
      }

      await loadBookings()
    } catch (err) {
      console.error('Update booking failed:', err)
      setError('Unable to update booking')
    }
  }

  return (
    <div className="px-4 py-4 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h2 className="text-lg font-bold text-foreground">Services Marketplace</h2>
        <div className="w-10" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-3 space-y-3">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services"
            className="w-full bg-transparent text-sm outline-none"
          />
          <button onClick={loadServices} className="text-xs text-primary font-medium">Search</button>
        </div>
        <div className="flex gap-2 overflow-auto">
          <button
            onClick={() => setCategory('')}
            className={`px-3 py-1.5 text-xs rounded-full border ${!category ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground'}`}
          >
            All
          </button>
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`px-3 py-1.5 text-xs rounded-full border ${category === item ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {suspended && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">Account Suspended</p>
          <p className="text-xs text-red-700 mt-1">
            Your account has been temporarily suspended for violating platform policies.
          </p>
          <p className="text-xs text-red-600 mt-1">Strikes: {strikeCount}</p>
          <button
            onClick={() => {
              resetSafetyState(buyerId)
              setSuspended(false)
              setStrikeCount(0)
              setError('')
            }}
            className="mt-3 px-3 py-2 rounded-lg border border-red-200 bg-white text-red-700 text-xs font-medium"
          >
            Reset Strikes (Demo)
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
        <span className="text-amber-500 text-base mt-0.5">💬</span>
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">Tip:</span> Always chat with the service provider before booking to confirm availability, discuss your requirements, and agree on pricing.
        </p>
      </div>

      <section>
        <h3 className="text-sm font-semibold text-foreground mb-2">Available Services</h3>
        {loading ? (
          <div className="py-10 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading services...
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <Wrench className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No services available yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-sm">{service.title}</p>
                      {service.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{service.category}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description || 'No description provided'}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{service.merchant_name || 'Merchant'}{service.service_city ? ` • ${service.service_city}` : ''}{service.service_state ? `, ${service.service_state}` : ''}</p>
                    {Array.isArray(service.working_days) && service.working_days.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">Available: {service.working_days.join(', ')}{service.working_hours ? ` • ${service.working_hours}` : ''}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{formatNaira(Number(service.base_price || 0))}</p>
                    <p className="text-[10px] text-muted-foreground">starting from</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { if (guardSuspendedAction()) return; setSelectedService(service) }}
                    disabled={suspended}
                    className="w-full rounded-xl bg-primary text-primary-foreground px-3 py-2 text-sm font-medium disabled:opacity-60"
                  >
                    Book Service
                  </button>
                  <button
                    onClick={() => startChatWithMerchant(service)}
                    disabled={suspended}
                    className="w-full rounded-xl border border-border bg-background text-foreground px-3 py-2 text-sm font-medium disabled:opacity-60"
                  >
                    Chat Provider
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground mb-2">My Service Bookings</h3>
        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
            You have no service bookings yet.
          </div>
        ) : (
          <div className="space-y-2">
            {bookings.map((booking) => (
              <div key={booking.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{booking.service?.title || 'Service booking'}</p>
                    <p className="text-xs text-muted-foreground">Provider: {booking.merchant_name || 'Merchant'}</p>
                    {booking.service_address && <p className="text-xs text-muted-foreground">Address: {booking.service_address}</p>}
                    {booking.scheduled_at && <p className="text-xs text-muted-foreground">Scheduled: {new Date(booking.scheduled_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
                    {booking.buyer_note && <p className="text-xs text-muted-foreground italic">Note: "{booking.buyer_note}"</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{formatNaira(Number(booking.quoted_price || 0))}</p>
                    <span className={`inline-flex mt-1 px-2 py-1 rounded-full text-[11px] font-medium ${
                      booking.status === 'released' ? 'bg-primary/10 text-primary' :
                      booking.status === 'completed' ? 'bg-amber-100 text-amber-700' :
                      booking.status === 'cancelled' || booking.status === 'disputed' ? 'bg-destructive/10 text-destructive' :
                      'bg-secondary text-foreground'
                    }`}>
                      {String(booking.status || 'requested').replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                {booking.status === 'completed' && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button onClick={() => updateBooking(booking.id, 'released')} className="rounded-lg bg-primary text-primary-foreground py-2 text-xs font-medium">Confirm & Release Funds</button>
                    <button onClick={() => updateBooking(booking.id, 'disputed')} className="rounded-lg bg-destructive/10 text-destructive py-2 text-xs font-medium">Report Issue</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">Book {selectedService.title}</h3>
              <button onClick={() => setSelectedService(null)} className="text-sm text-muted-foreground">Close</button>
            </div>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              value={serviceAddress}
              onChange={(e) => setServiceAddress(e.target.value)}
              placeholder="Service address"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            <textarea
              value={buyerNote}
              onChange={(e) => setBuyerNote(e.target.value)}
              placeholder="Notes for merchant"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm min-h-24"
            />
            <button
              onClick={submitBooking}
              disabled={bookingLoading || suspended}
              className="w-full rounded-xl bg-primary text-primary-foreground px-3 py-2 text-sm font-medium disabled:opacity-60"
            >
              {bookingLoading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
