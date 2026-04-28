import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET  /api/coupons?merchantId=xxx        → list merchant's coupons
// POST /api/coupons                       → create coupon (merchant)
// DELETE /api/coupons?id=xxx              → delete coupon

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const merchantId = searchParams.get('merchantId')

  try {
    const supabase = await createClient()
    let query = (supabase.from('coupons') as any).select('*').order('created_at', { ascending: false })
    if (merchantId) query = query.eq('merchant_id', merchantId)

    const { data, error } = await query
    if (error) {
      if (String(error.message || '').toLowerCase().includes('does not exist')) {
        return NextResponse.json({ success: true, data: [], tableNotReady: true })
      }
      throw error
    }
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, discountType, discountValue, merchantId, minOrderAmount, maxUses, expiresAt } = body

    if (!code || !discountType || !discountValue || !merchantId) {
      return NextResponse.json({ success: false, error: 'code, discountType, discountValue and merchantId are required' }, { status: 400 })
    }

    if (!['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json({ success: false, error: 'discountType must be percentage or fixed' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await (supabase.from('coupons') as any).insert({
      code: String(code).toUpperCase().trim(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      merchant_id: merchantId,
      min_order_amount: Number(minOrderAmount || 0),
      max_uses: maxUses ? Number(maxUses) : null,
      current_uses: 0,
      expires_at: expiresAt || null,
      active: true,
    }).select().single()

    if (error) {
      if (String(error.message || '').toLowerCase().includes('does not exist')) {
        return NextResponse.json({ success: false, error: 'Coupons table not yet created. Run the SQL migration to enable coupons.', tableNotReady: true }, { status: 503 })
      }
      if (String(error.message || '').toLowerCase().includes('unique') || String(error.code || '') === '23505') {
        return NextResponse.json({ success: false, error: 'This coupon code already exists. Use a different code.' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 })

  try {
    const supabase = await createClient()
    const { error } = await (supabase.from('coupons') as any).delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
