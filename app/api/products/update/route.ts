import { NextRequest, NextResponse } from 'next/server'
import { updateProduct } from '@/lib/product-actions'

export async function PUT(request: NextRequest) {
  try {
    const { productId, updates } = await request.json()

    if (!productId || !updates) {
      return NextResponse.json(
        { success: false, error: 'Product ID and updates are required' },
        { status: 400 }
      )
    }

    const result = await updateProduct(productId, updates)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Update product API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}