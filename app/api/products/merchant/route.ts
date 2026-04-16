import { NextRequest, NextResponse } from 'next/server'
import { getMerchantProducts } from '@/lib/product-actions'
import { getRequestAuthUser } from '@/lib/supabase/request-auth'

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

    if (!result.success || !Array.isArray(result.data)) {
      return NextResponse.json(result)
    }

    const { user } = await getRequestAuthUser()
    const isOwner = user?.id === merchantId

    const safeData = isOwner
      ? result.data
      : result.data.map((product: any) => {
          const { cost_price, ...rest } = product
          return rest
        })

    return NextResponse.json({ ...result, data: safeData })
  } catch (error) {
    console.error('Get merchant products API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}