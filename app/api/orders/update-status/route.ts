import { NextRequest, NextResponse } from 'next/server'
import { updateOrderStatus } from '@/lib/order-actions'

export async function PUT(request: NextRequest) {
  try {
    const { orderId, status } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'Order ID and status are required' },
        { status: 400 }
      )
    }

    const result = await updateOrderStatus(orderId, status)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Update order status API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}