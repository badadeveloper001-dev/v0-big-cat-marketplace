import { NextRequest, NextResponse } from 'next/server'
import { deleteProduct } from '@/lib/product-actions'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const result = await deleteProduct(productId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Delete product API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}