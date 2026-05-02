import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getRiderId(request: NextRequest) {
  return String(request.headers.get('x-rider-id') || '').trim()
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  assigned: ['in_transit'],
  in_transit: ['completed'],
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const riderId = getRiderId(request)
    if (!riderId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId: rawOrderId } = await params
    const orderId = String(rawOrderId || '').trim()
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required.' }, { status: 400 })
    }

    const body = await request.json()
    const newStatus = String(body?.status || '').trim().toLowerCase()

    if (!newStatus) {
      return NextResponse.json({ success: false, error: 'Status is required.' }, { status: 400 })
    }

    const supabase = createClient()

    // Verify this order belongs to this rider
    const { data: assignment, error: fetchError } = await (supabase.from('logistics_order_assignments') as any)
      .select('order_id, rider_id, logistics_status')
      .eq('order_id', orderId)
      .eq('rider_id', riderId)
      .maybeSingle()

    if (fetchError || !assignment) {
      return NextResponse.json({ success: false, error: 'Order not found or not assigned to you.' }, { status: 404 })
    }

    const currentStatus = String(assignment.logistics_status || '').toLowerCase()
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || []

    if (!allowed.includes(newStatus)) {
      return NextResponse.json({
        success: false,
        error: `Cannot change status from "${currentStatus}" to "${newStatus}".`,
      }, { status: 400 })
    }

    const now = new Date().toISOString()
    const updatePayload: Record<string, any> = {
      logistics_status: newStatus,
      updated_at: now,
    }

    if (newStatus === 'completed') {
      updatePayload.completed_at = now
    }

    const { error: updateError } = await (supabase.from('logistics_order_assignments') as any)
      .update(updatePayload)
      .eq('order_id', orderId)
      .eq('rider_id', riderId)

    if (updateError) {
      console.error('Rider order status update error:', updateError)
      return NextResponse.json({ success: false, error: 'Failed to update status.' }, { status: 500 })
    }

    // Also update main order status if going in_transit or completed
    if (newStatus === 'in_transit') {
      await (supabase.from('orders') as any)
        .update({ status: 'in_transit' })
        .eq('id', orderId)
    } else if (newStatus === 'completed') {
      await (supabase.from('orders') as any)
        .update({ status: 'completed' })
        .eq('id', orderId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Rider order update error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 })
  }
}
