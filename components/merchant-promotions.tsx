'use client'

import { useEffect, useState } from 'react'
import {
  Zap,
  Gift,
  Flame,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Copy,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Tag,
} from 'lucide-react'
import { formatNaira } from '@/lib/currency-utils'

interface Promotion {
  id: string
  name: string
  type: 'discount' | 'bundle' | 'flash_sale'
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase_amount: number
  max_uses?: number
  current_uses: number
  usage_per_buyer: number
  start_date: string
  end_date: string
  is_active: boolean
  product_ids: string[]
  created_at: string
}

interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase_amount: number
  max_uses?: number
  current_uses: number
  max_uses_per_buyer: number
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

type TabType = 'discounts' | 'coupons' | 'analytics'

export function MerchantPromotions() {
  const [tab, setTab] = useState<TabType>('discounts')
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'discount' as const,
    discount_type: 'percentage' as const,
    discount_value: 10,
    min_purchase_amount: 0,
    max_uses: undefined as number | undefined,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  const [couponData, setCouponData] = useState({
    code: '',
    discount_type: 'percentage' as const,
    discount_value: 10,
    min_purchase_amount: 0,
    max_uses: undefined as number | undefined,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [tab])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      if (tab === 'discounts') {
        const res = await fetch('/api/merchant/promotions')
        if (!res.ok) throw new Error('Failed to load promotions')
        const data = await res.json()
        setPromotions(data.data || [])
      } else if (tab === 'coupons') {
        const res = await fetch('/api/merchant/coupons')
        if (!res.ok) throw new Error('Failed to load coupons')
        const data = await res.json()
        setCoupons(data.data || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/merchant/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      setPromotions([data.data, ...promotions])
      setShowCreateForm(false)
      setFormData({
        name: '',
        type: 'discount',
        discount_type: 'percentage',
        discount_value: 10,
        min_purchase_amount: 0,
        max_uses: undefined,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/merchant/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          input: couponData,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      setCoupons([data.data, ...coupons])
      setCouponData({
        code: '',
        discount_type: 'percentage',
        discount_value: 10,
        min_purchase_amount: 0,
        max_uses: undefined,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePromotion = async (id: string) => {
    if (!confirm('Delete this promotion?')) return
    try {
      const res = await fetch('/api/merchant/promotions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promotionId: id }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setPromotions(promotions.filter((p) => p.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCoupon(code)
    setTimeout(() => setCopiedCoupon(null), 2000)
  }

  const formatDiscount = (promo: Promotion | Coupon) => {
    if (promo.discount_type === 'percentage') {
      return `${promo.discount_value}% off`
    }
    return `₦${formatNaira(promo.discount_value)}`
  }

  const isActive = (startDate: string, endDate: string) => {
    const now = new Date()
    return new Date(startDate) <= now && now <= new Date(endDate)
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(['discounts', 'coupons', 'analytics'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              tab === t
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'discounts' && '🎯 Discounts'}
            {t === 'coupons' && '🎟️ Coupons'}
            {t === 'analytics' && '📊 Analytics'}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Discounts Tab */}
      {tab === 'discounts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5" /> Active Discounts & Promotions
            </h3>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" /> New Promotion
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreatePromotion} className="rounded-lg border border-border bg-card p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Promotion name (e.g., Summer Sale)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as any })
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="discount">Discount</option>
                  <option value="flash_sale">Flash Sale</option>
                  <option value="bundle">Bundle Deal</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">Discount Type</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_type: e.target.value as any })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mt-1"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₦)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Discount Value</label>
                  <input
                    type="number"
                    placeholder={formData.discount_type === 'percentage' ? '10' : '1000'}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium">Min. Purchase (₦)</label>
                  <input
                    type="number"
                    value={formData.min_purchase_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, min_purchase_amount: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Promotion'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading promotions...</div>
          ) : promotions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No promotions yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {promotions.map((promo) => (
                <div
                  key={promo.id}
                  className="rounded-lg border border-border bg-card p-4 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {promo.type === 'discount' && <Tag className="w-4 h-4 text-blue-500" />}
                      {promo.type === 'flash_sale' && <Flame className="w-4 h-4 text-orange-500" />}
                      {promo.type === 'bundle' && <Gift className="w-4 h-4 text-purple-500" />}
                      <h4 className="font-semibold">{promo.name}</h4>
                      {isActive(promo.start_date, promo.end_date) ? (
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Discount</p>
                        <p className="font-semibold">{formatDiscount(promo)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Uses</p>
                        <p className="font-semibold">
                          {promo.current_uses}
                          {promo.max_uses ? `/${promo.max_uses}` : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Duration</p>
                        <p className="font-semibold text-xs">
                          {new Date(promo.start_date).toLocaleDateString()} -{' '}
                          {new Date(promo.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Min. Purchase</p>
                        <p className="font-semibold">₦{formatNaira(promo.min_purchase_amount)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button className="p-2 hover:bg-muted rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePromotion(promo.id)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Coupons Tab */}
      {tab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Tag className="w-5 h-5" /> Coupon Codes
            </h3>
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" /> New Coupon
              </button>
            ) : null}
          </div>

          {showCreateForm && (
            <form
              onSubmit={handleCreateCoupon}
              className="rounded-lg border border-border bg-card p-6 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Coupon code (e.g., SUMMER20)"
                  value={couponData.code}
                  onChange={(e) =>
                    setCouponData({ ...couponData, code: e.target.value.toUpperCase() })
                  }
                  required
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <select
                  value={couponData.discount_type}
                  onChange={(e) =>
                    setCouponData({ ...couponData, discount_type: e.target.value as any })
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₦)</option>
                </select>
                <input
                  type="number"
                  placeholder={couponData.discount_type === 'percentage' ? '20' : '5000'}
                  value={couponData.discount_value}
                  onChange={(e) =>
                    setCouponData({ ...couponData, discount_value: Number(e.target.value) })
                  }
                  required
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium">Start Date</label>
                  <input
                    type="date"
                    value={couponData.start_date}
                    onChange={(e) =>
                      setCouponData({ ...couponData, start_date: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">End Date</label>
                  <input
                    type="date"
                    value={couponData.end_date}
                    onChange={(e) =>
                      setCouponData({ ...couponData, end_date: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Coupon'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading coupons...</div>
          ) : coupons.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No coupons yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="rounded-lg border border-border bg-card p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-mono bg-muted px-3 py-2 rounded text-sm font-bold">
                        {coupon.code}
                      </div>
                      <div>
                        <p className="font-semibold">{formatDiscount(coupon)} off</p>
                        <p className="text-xs text-muted-foreground">
                          Valid {new Date(coupon.start_date).toLocaleDateString()} -{' '}
                          {new Date(coupon.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      {isActive(coupon.start_date, coupon.end_date) ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(coupon.code)}
                    className="p-2 hover:bg-muted rounded-lg"
                  >
                    {copiedCoupon === coupon.code ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground mb-2">Analytics coming soon!</p>
          <p className="text-sm text-muted-foreground">
            Track promotion performance, customer engagement, and revenue impact.
          </p>
        </div>
      )}
    </div>
  )
}
