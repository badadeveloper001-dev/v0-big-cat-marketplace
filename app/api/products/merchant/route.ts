import { NextRequest, NextResponse } from 'next/server'
import { getMerchantProducts } from '@/lib/product-actions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID is required' },
        { status: 400 }
      )
    }

    const result = await getMerchantProducts(merchantId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get merchant products API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}