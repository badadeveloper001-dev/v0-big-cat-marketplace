'use server'

import { createClient } from '@/lib/supabase/server'

// SMEDAN Admin Actions
export async function getMerchants() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('auth_users')
      .select('id, email, full_name, business_name, business_description, business_category, smedan_id, setup_completed, created_at')
      .eq('role', 'merchant')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching merchants:', error)
      return { success: false, data: [], error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error in getMerchants:', error)
    return { success: false, data: [], error: 'Failed to fetch merchants' }
  }
}

export async function approveMerchant(merchantId: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('auth_users')
      .update({ setup_completed: true })
      .eq('id', merchantId)
      .eq('role', 'merchant')

    if (error) {
      console.error('Error approving merchant:', error)
      return { success: false, error: error.message }
    }

    return { success: true, message: 'Merchant approved successfully' }
  } catch (error) {
    console.error('Unexpected error in approveMerchant:', error)
    return { success: false, error: 'Failed to approve merchant' }
  }
}

export async function rejectMerchant(merchantId: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('auth_users')
      .delete()
      .eq('id', merchantId)
      .eq('role', 'merchant')

    if (error) {
      console.error('Error rejecting merchant:', error)
      return { success: false, error: error.message }
    }

    return { success: true, message: 'Merchant rejected successfully' }
  } catch (error) {
    console.error('Unexpected error in rejectMerchant:', error)
    return { success: false, error: 'Failed to reject merchant' }
  }
}

export async function getMerchantStats() {
  try {
    const supabase = await createClient()
    
    const { data: merchants } = await supabase
      .from('auth_users')
      .select('id, setup_completed')
      .eq('role', 'merchant')

    const total = merchants?.length || 0
    const approved = merchants?.filter(m => m.setup_completed).length || 0
    const pending = total - approved

    return {
      success: true,
      stats: { total, approved, pending }
    }
  } catch (error) {
    console.error('Error in getMerchantStats:', error)
    return { success: false, stats: { total: 0, approved: 0, pending: 0 } }
  }
}

// PalmPay Admin Actions
export async function getTransactions() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('orders')
      .select('id, buyer_id, grand_total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching transactions:', error)
      return { success: false, data: [], error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error in getTransactions:', error)
    return { success: false, data: [], error: 'Failed to fetch transactions' }
  }
}

export async function getTransactionStats() {
  try {
    const supabase = await createClient()
    
    const { data: orders } = await supabase
      .from('orders')
      .select('grand_total, status')

    const totalTransactions = orders?.length || 0
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.grand_total || 0), 0) || 0

    const { data: escrow } = await supabase
      .from('escrow')
      .select('amount, type, status')

    const productEscrow = escrow
      ?.filter(e => e.type === 'product' && e.status === 'held')
      .reduce((sum, e) => sum + (e.amount || 0), 0) || 0

    const deliveryEscrow = escrow
      ?.filter(e => e.type === 'delivery' && e.status === 'held')
      .reduce((sum, e) => sum + (e.amount || 0), 0) || 0

    const completedPayments = orders?.filter(o => o.status === 'delivered').length || 0
    const pendingPayments = orders?.filter(o => o.status === 'pending').length || 0

    return {
      success: true,
      stats: {
        totalTransactions,
        totalRevenue,
        productEscrow,
        deliveryEscrow,
        completedPayments,
        pendingPayments
      }
    }
  } catch (error) {
    console.error('Error in getTransactionStats:', error)
    return {
      success: false,
      stats: {
        totalTransactions: 0,
        totalRevenue: 0,
        productEscrow: 0,
        deliveryEscrow: 0,
        completedPayments: 0,
        pendingPayments: 0
      }
    }
  }
}

// BigCat Super Admin Actions
export async function getPlatformStats() {
  try {
    const supabase = await createClient()
    
    // Get user stats
    const { data: users } = await supabase
      .from('auth_users')
      .select('id, role')

    const totalUsers = users?.length || 0
    const totalMerchants = users?.filter(u => u.role === 'merchant').length || 0

    // Get order stats
    const { data: orders } = await supabase
      .from('orders')
      .select('id, grand_total, status')

    const totalOrders = orders?.length || 0
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.grand_total || 0), 0) || 0

    return {
      success: true,
      stats: {
        totalUsers,
        totalMerchants,
        totalOrders,
        totalRevenue
      }
    }
  } catch (error) {
    console.error('Error in getPlatformStats:', error)
    return {
      success: false,
      stats: {
        totalUsers: 0,
        totalMerchants: 0,
        totalOrders: 0,
        totalRevenue: 0
      }
    }
  }
}

export async function getRecentUsers() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('auth_users')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching recent users:', error)
      return { success: false, data: [], error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error in getRecentUsers:', error)
    return { success: false, data: [], error: 'Failed to fetch users' }
  }
}

export async function getRecentOrders() {
  try {
    const supabase = await createClient()
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, buyer_id, grand_total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching recent orders:', error)
      return { success: false, data: [], error: error.message }
    }

    // Fetch buyer names
    const orderIds = orders?.map(o => o.buyer_id) || []
    const { data: buyers } = await supabase
      .from('auth_users')
      .select('id, full_name')
      .in('id', orderIds)

    const enrichedOrders = orders?.map(order => ({
      ...order,
      buyerName: buyers?.find(b => b.id === order.buyer_id)?.full_name || 'Unknown'
    })) || []

    return { success: true, data: enrichedOrders }
  } catch (error) {
    console.error('Unexpected error in getRecentOrders:', error)
    return { success: false, data: [], error: 'Failed to fetch orders' }
  }
}

export async function getLogisticsStats() {
  try {
    const supabase = await createClient()
    
    const { data: orders } = await supabase
      .from('orders')
      .select('status')

    const activeDeliveries = orders?.filter(o => o.status === 'processing').length || 0
    const completedDeliveries = orders?.filter(o => o.status === 'delivered').length || 0
    const pendingDeliveries = orders?.filter(o => o.status === 'pending').length || 0

    return {
      success: true,
      stats: {
        activeDeliveries,
        completedDeliveries,
        pendingDeliveries
      }
    }
  } catch (error) {
    console.error('Error in getLogisticsStats:', error)
    return {
      success: false,
      stats: {
        activeDeliveries: 0,
        completedDeliveries: 0,
        pendingDeliveries: 0
      }
    }
  }
}
