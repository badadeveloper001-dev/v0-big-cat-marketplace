import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const merchantId = '80385b66-d550-4c0f-b492-51effed1644d'

  const keySnippet = key ? `${key.slice(0, 20)}...${key.slice(-10)}` : '(empty)'

  // Test orders via raw fetch
  const ordersRes = await fetch(
    `${url}/rest/v1/orders?merchant_id=eq.${merchantId}&status=in.(delivered,completed)&select=id,status,product_total`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  )
  const ordersBody = await ordersRes.text()

  // Test escrow via raw fetch
  const escrowRes = await fetch(
    `${url}/rest/v1/escrow?recipient_id=eq.${merchantId}&status=eq.released&type=eq.product&select=id,amount`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  )
  const escrowBody = await escrowRes.text()

  return NextResponse.json({
    keySnippet,
    keyLength: key.length,
    orders: { status: ordersRes.status, body: ordersBody },
    escrow: { status: escrowRes.status, body: escrowBody },
  })
}
