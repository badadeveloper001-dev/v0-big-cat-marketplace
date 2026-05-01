import { NextRequest, NextResponse } from 'next/server'
import { getMerchantWalletOverview } from '@/lib/merchant-wallet'

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const merchantId = '80385b66-d550-4c0f-b492-51effed1644d'

  const keySnippet = key ? `${key.slice(0, 20)}...${key.slice(-10)}` : '(empty)'

  // Test orders via raw fetch
  const ordersRes = await fetch(
    `${url}/rest/v1/orders?select=id,status,product_total&merchant_id=eq.${merchantId}&status=in.(delivered,completed)`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  )
  const ordersBody = await ordersRes.text()

  // Test escrow via raw fetch
  const escrowRes = await fetch(
    `${url}/rest/v1/escrow?select=id,amount&recipient_id=eq.${merchantId}&status=eq.released&type=eq.product`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  )
  const escrowBody = await escrowRes.text()

  // Test wallet overview
  const overview = await getMerchantWalletOverview(merchantId, { limit: 100 })

  // Test in.() syntax
  const inTestRes = await fetch(
    `${url}/rest/v1/orders?select=id,status&merchant_id=in.(${merchantId},badadeveloper001@gmail.com)&status=in.(delivered,completed)`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  )
  const inTestBody = await inTestRes.text()

  return NextResponse.json({
    keySnippet,
    keyLength: key.length,
    orders: { status: ordersRes.status, body: ordersBody },
    escrow: { status: escrowRes.status, body: escrowBody },
    inTest: { status: inTestRes.status, body: inTestBody },
    overview,
  })
}
