import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dispatchNotification } from '@/lib/notifications'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const body = await req.json().catch(() => ({}))
    const buyerId: string | undefined = body.buyerId

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Load the order — verify it belongs to this buyer
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, logistics_status, buyer_id, merchant_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    // Verify the requester is the buyer
    if (buyerId && order.buyer_id !== buyerId) {
      return NextResponse.json({ success: false, error: 'Unauthorised' }, { status: 403 })
    }

    // Block cancellation if already cancelled or delivered
    const terminalStatuses = ['cancelled', 'delivered', 'completed']
    if (terminalStatuses.includes(String(order.status).toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'This order cannot be cancelled.' },
        { status: 400 }
      )
    }

    // Block cancellation if a rider has already been assigned
    const logisticsStatus = String(order.logistics_status || 'pending').toLowerCase()
    if (logisticsStatus !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: 'A rider has already been assigned to this order. You can no longer cancel — please use Report Issue if there is a problem.',
        },
        { status: 400 }
      )
    }

    // Cancel the order
    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ success: false, error: 'Failed to cancel order' }, { status: 500 })
    }

    // Notify buyer
    if (order.buyer_id) {
      await dispatchNotification({
        userId: order.buyer_id,
        type: 'order',
        title: 'Order cancelled',
        message: `Your order has been cancelled. If you paid, a refund will be processed. Ref: ${orderId.slice(0, 8).toUpperCase()}`,
        eventKey: `order:cancelled:buyer:${orderId}`,
        metadata: { orderId },
        emailSubject: 'Your order has been cancelled',
      })
    }

    // Notify merchant
    if (order.merchant_id) {
      await dispatchNotification({
        userId: order.merchant_id,
        type: 'order',
        title: 'Order cancelled by buyer',
        message: `A buyer has cancelled order ${orderId.slice(0, 8).toUpperCase()} before a rider was assigned.`,
        eventKey: `order:cancelled:merchant:${orderId}`,
        metadata: { orderId },
        emailSubject: 'Order cancelled by buyer',
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('[cancel-order] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
