import { createClient } from '@/lib/supabase/server'

type ReportIssueInput = {
  orderId: string
  buyerId: string
  issueType: string
  description: string
}

function normalizeStatus(value: string) {
  const normalized = String(value || '').toLowerCase().trim()
  if (['open', 'in_review', 'resolved', 'rejected'].includes(normalized)) return normalized
  return 'open'
}

export async function reportOrderIssue(input: ReportIssueInput) {
  try {
    const supabase = await createClient()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, merchant_id, status')
      .eq('id', input.orderId)
      .single()

    if (orderError || !order) {
      return { success: false, error: 'Order not found' }
    }

    if (String(order.buyer_id) !== String(input.buyerId)) {
      return { success: false, error: 'You are not allowed to report this order' }
    }

    const payload = {
      order_id: input.orderId,
      buyer_id: input.buyerId,
      merchant_id: order.merchant_id || null,
      issue_type: String(input.issueType || 'other').trim() || 'other',
      description: String(input.description || '').trim(),
      status: 'open',
    }

    if (!payload.description) {
      return { success: false, error: 'Please describe the issue' }
    }

    const { data, error } = await (supabase.from('support_issues') as any).insert(payload).select('*').single()
    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to report issue' }
  }
}

export async function getAdminSupportIssues() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('support_issues')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function getBuyerSupportIssues(buyerId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('support_issues')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function updateSupportIssueStatus(issueId: string, status: string, adminNotes?: string) {
  try {
    const supabase = await createClient()
    const nextStatus = normalizeStatus(status)

    const payload = {
      status: nextStatus,
      ...(adminNotes !== undefined ? { admin_notes: adminNotes } : {}),
    }

    const { data, error } = await (supabase.from('support_issues') as any)
      .update(payload)
      .eq('id', issueId)
      .select('*')
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
