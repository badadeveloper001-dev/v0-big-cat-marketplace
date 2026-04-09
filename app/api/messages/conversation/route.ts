import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateConversation } from '@/lib/message-actions'

export async function POST(request: NextRequest) {
  try {
    const { buyerId, merchantId, productId } = await request.json()

    if (!buyerId || !merchantId) {
      return NextResponse.json(
        { success: false, error: 'Buyer ID and Merchant ID are required' },
        { status: 400 }
      )
    }

    const result = await getOrCreateConversation(buyerId, merchantId, productId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get or create conversation API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}