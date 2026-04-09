import { NextRequest, NextResponse } from 'next/server'
import { getAllProducts } from '@/lib/product-actions'

export async function GET(request: NextRequest) {
  try {
    const result = await getAllProducts()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get all products API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}