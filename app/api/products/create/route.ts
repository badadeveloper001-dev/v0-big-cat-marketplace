import { NextRequest, NextResponse } from 'next/server'
import { createProduct } from '@/lib/product-actions'

export async function POST(request: NextRequest) {
  try {
    const { merchantId, product } = await request.json()

    if (!merchantId || !product) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID and product data are required' },
        { status: 400 }
      )
    }

    const result = await createProduct(merchantId, product)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Create product API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}