import { NextRequest, NextResponse } from 'next/server'
import { getMerchantWalletOverview } from '@/lib/merchant-wallet'
import { requireAuthenticatedUser } from '@/lib/supabase/request-auth'

export async function GET(request: NextRequest) {
  const merchantId = String(request.nextUrl.searchParams.get('merchantId') || '').trim()
  if (!merchantId) {
    return NextResponse.json({ success: false, error: 'merchantId is required' }, { status: 400 })
  }

  const auth = await requireAuthenticatedUser(merchantId, request)
  if (auth.response) return auth.response

  const result = await getMerchantWalletOverview(merchantId, { limit: 100 })
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error || 'Failed to load wallet', balance: 0 }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    balance: result.balance,
    withdrawals: result.withdrawalHistory,
    transactions: result.transactions,
  })
}
