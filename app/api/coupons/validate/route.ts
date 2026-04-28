import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/coupons/validate
// Body: { code, merchantId, orderTotal }
// Returns: { valid, discount, discountType, discountValue, couponId, finalTotal, message }

export async function POST(request: NextRequest) {
  try {
    const { code, merchantId, orderTotal } = await request.json()

    if (!code || !orderTotal) {
      return NextResponse.json({ success: false, valid: false, message: 'code and orderTotal are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const normalizedCode = String(code).toUpperCase().trim()

    let query = (supabase.from('coupons') as any)
      .select('*')
      .eq('code', normalizedCode)
      .eq('active', true)
      .single()

    const { data: coupon, error } = await query

    if (error) {
      if (String(error.message || '').toLowerCase().includes('does not exist')) {
        return NextResponse.json({ success: false, valid: false, message: 'Coupon system not yet configured.' })
      }
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: true, valid: false, message: 'Invalid or expired coupon code.' })
      }
      throw error
    }

    if (!coupon) {
      return NextResponse.json({ success: true, valid: false, message: 'Invalid or expired coupon code.' })
    }

    // Scope check: coupon belongs to merchant if merchantId set
    if (coupon.merchant_id && merchantId && coupon.merchant_id !== merchantId) {
      return NextResponse.json({ success: true, valid: false, message: 'This coupon is not valid for items in your cart.' })
    }

    // Expiry check
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ success: true, valid: false, message: 'This coupon has expired.' })
    }

    // Min order check
    if (coupon.min_order_amount && Number(orderTotal) < Number(coupon.min_order_amount)) {
      return NextResponse.json({
        success: true,
        valid: false,
        message: `Minimum order of ₦${Number(coupon.min_order_amount).toLocaleString()} required for this coupon.`,
      })
    }

    // Max uses check
    if (coupon.max_uses !== null && Number(coupon.current_uses || 0) >= Number(coupon.max_uses)) {
      return NextResponse.json({ success: true, valid: false, message: 'This coupon has reached its usage limit.' })
    }

    // Calculate discount
    const total = Number(orderTotal)
    let discount = 0
    if (coupon.discount_type === 'percentage') {
      discount = (total * Number(coupon.discount_value)) / 100
    } else {
      discount = Math.min(Number(coupon.discount_value), total)
    }

    const finalTotal = Math.max(0, total - discount)

    return NextResponse.json({
      success: true,
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: Number(coupon.discount_value),
      discount: Math.round(discount * 100) / 100,
      finalTotal: Math.round(finalTotal * 100) / 100,
      message: coupon.discount_type === 'percentage'
        ? `${coupon.discount_value}% off applied!`
        : `₦${Number(coupon.discount_value).toLocaleString()} off applied!`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, valid: false, message: error.message }, { status: 500 })
  }
}
