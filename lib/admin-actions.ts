import { createClient } from '@/lib/supabase/server'
import { buildLocationQuery, geocodeLocation, haversineDistanceKm } from '@/lib/location-utils'

function toAmount(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function isBigZeeWears(value: unknown) {
  const normalized = String(value || '').toLowerCase()
  return normalized.includes('big zee wears') || normalized.includes('big zee')
}

function sortBigZeeFirst<T>(items: T[], getText: (item: T) => string) {
  return [...items].sort((a, b) => {
    const aIsBigZee = isBigZeeWears(getText(a))
    const bIsBigZee = isBigZeeWears(getText(b))

    if (aIsBigZee === bIsBigZee) return 0
    return aIsBigZee ? -1 : 1
  })
}

function toFiniteNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export async function getMerchants(options: { buyerLat?: number | null; buyerLng?: number | null } = {}) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('auth_users')
      .select('*')
      .eq('role', 'merchant')
    if (error) throw error

    const latitude = toFiniteNumber(options.buyerLat)
    const longitude = toFiniteNumber(options.buyerLng)

    let merchants = data || []

    if (latitude !== null && longitude !== null) {
      const locationCache = new Map<string, Awaited<ReturnType<typeof geocodeLocation>>>()

      merchants = await Promise.all(
        merchants.map(async (merchant: any) => {
          const locationQuery = buildLocationQuery(merchant?.city, merchant?.state, merchant?.location)

          if (!locationQuery) {
            return { ...merchant, distance_km: null }
          }

          if (!locationCache.has(locationQuery)) {
            locationCache.set(locationQuery, await geocodeLocation(locationQuery))
          }

          const resolvedLocation = locationCache.get(locationQuery)
          const distanceKm = resolvedLocation
            ? haversineDistanceKm(latitude, longitude, resolvedLocation.latitude, resolvedLocation.longitude)
            : null

          return {
            ...merchant,
            distance_km: distanceKm,
          }
        }),
      )

      merchants = [...merchants].sort((a: any, b: any) => {
        const leftDistance = toFiniteNumber(a?.distance_km) ?? Number.POSITIVE_INFINITY
        const rightDistance = toFiniteNumber(b?.distance_km) ?? Number.POSITIVE_INFINITY

        if (leftDistance !== rightDistance) {
          return leftDistance - rightDistance
        }

        const leftText = `${a?.business_name || ''} ${a?.name || ''}`
        const rightText = `${b?.business_name || ''} ${b?.name || ''}`
        const leftIsBigZee = isBigZeeWears(leftText)
        const rightIsBigZee = isBigZeeWears(rightText)

        if (leftIsBigZee === rightIsBigZee) return 0
        return leftIsBigZee ? -1 : 1
      })
    } else {
      merchants = sortBigZeeFirst(merchants, (merchant: any) => `${merchant?.business_name || ''} ${merchant?.name || ''}`)
    }

    return { success: true, data: merchants }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function getPlatformStats() {
  try {
    const supabase = await createClient()
    const { count: userCount } = await supabase.from('auth_users').select('*', { count: 'exact', head: true })
    const { count: merchantCount } = await supabase.from('auth_users').select('*', { count: 'exact', head: true }).eq('role', 'merchant')
    const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true })

    const { data: orders } = await supabase.from('orders').select('total_amount, grand_total')
    const totalRevenue = (orders || []).reduce(
      (sum, order: any) => sum + toAmount(order?.grand_total ?? order?.total_amount),
      0,
    )

    return {
      success: true,
      stats: {
        totalUsers: userCount || 0,
        totalMerchants: merchantCount || 0,
        totalOrders: orderCount || 0,
        totalRevenue,
        activeNow: 0,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function approveMerchant(merchantId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('auth_users').update({ setup_completed: true }).eq('id', merchantId)
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function rejectMerchant(merchantId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('auth_users').delete().eq('id', merchantId)
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getRecentUsers() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('auth_users').select('*').order('created_at', { ascending: false }).limit(10)
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function getRecentOrders() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10)
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function getLogisticsStats() {
  try {
    const supabase = await createClient()
    // Placeholder - implement logistics/delivery stats
    const { count: totalDeliveries } = await supabase.from('orders').select('*', { count: 'exact', head: true }).not('status', 'eq', 'pending')
    const { count: pendingDeliveries } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    const { count: completedDeliveries } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered')
    return { success: true, data: { total: totalDeliveries || 0, pending: pendingDeliveries || 0, completed: completedDeliveries || 0 } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getMerchantStats() {
  try {
    const supabase = await createClient()
    const { count: totalMerchants } = await supabase.from('auth_users').select('*', { count: 'exact', head: true }).eq('role', 'merchant')
    const { count: approvedMerchants } = await supabase.from('auth_users').select('*', { count: 'exact', head: true }).eq('role', 'merchant').eq('setup_completed', true)
    const { count: pendingMerchants } = await supabase.from('auth_users').select('*', { count: 'exact', head: true }).eq('role', 'merchant').eq('setup_completed', false)
    return { success: true, data: { total: totalMerchants || 0, approved: approvedMerchants || 0, pending: pendingMerchants || 0 } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getTransactions() {
  try {
    const supabase = await createClient()
    // Assuming there's a transactions table or using orders as transactions
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(20)
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function getTransactionStats() {
  try {
    const supabase = await createClient()
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, total_amount, grand_total, product_total, delivery_fee, status, payment_status, escrow_status')

    if (error) throw error

    const orderRows = orders || []
    const totalRevenue = orderRows.reduce(
      (sum, order: any) => sum + toAmount(order?.grand_total ?? order?.total_amount),
      0,
    )

    const completedPayments = orderRows.filter(
      (order: any) => String(order?.payment_status || '').toLowerCase() === 'completed',
    ).length

    const pendingPayments = orderRows.filter(
      (order: any) => String(order?.payment_status || '').toLowerCase() !== 'completed',
    ).length

    const completedOrders = orderRows.filter((order: any) => {
      const status = String(order?.status || '').toLowerCase()
      return status === 'completed' || status === 'delivered'
    }).length

    const pendingOrders = Math.max(0, orderRows.length - completedOrders)

    let productEscrow = 0
    let deliveryEscrow = 0
    let disbursedAmount = 0

    try {
      const { data: escrowRows, error: escrowError } = await supabase
        .from('escrow')
        .select('type, amount, status')

      if (escrowError) throw escrowError

      for (const row of escrowRows || []) {
        const amount = toAmount((row as any)?.amount)
        const type = String((row as any)?.type || '').toLowerCase()
        const status = String((row as any)?.status || '').toLowerCase()

        if (status === 'held') {
          if (type === 'product') productEscrow += amount
          if (type === 'delivery') deliveryEscrow += amount
        }

        if (status === 'released') {
          disbursedAmount += amount
        }
      }
    } catch (escrowError: any) {
      const message = String(escrowError?.message || '')
      if (!message.includes("Could not find the table 'public.escrow'")) {
        throw escrowError
      }
    }

    return {
      success: true,
      data: {
        totalRevenue,
        successful: completedPayments,
        pending: pendingPayments,
        pendingOrders,
        completedOrders,
        productEscrow,
        deliveryEscrow,
        totalEscrow: productEscrow + deliveryEscrow,
        disbursedAmount,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
