import { NextRequest, NextResponse } from 'next/server'
import { getMerchants } from '@/lib/admin-actions'

export async function GET(request: NextRequest) {
  try {
    const result = await getMerchants()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get merchants API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}