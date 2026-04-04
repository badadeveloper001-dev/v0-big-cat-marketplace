'use server'

import { createClient } from '@/lib/supabase/server'

export async function getMerchants() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('auth_users')
      .select('*')
      .eq('role', 'merchant')
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function getPlatformStats() {
  try {
    const supabase = await createClient()
    const { count: userCount } = await supabase.from('auth_users').select('*', { count: 'exact', head: true })
    const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true })
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true })
    return { success: true, data: { users: userCount || 0, orders: orderCount || 0, products: productCount || 0 } }
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
