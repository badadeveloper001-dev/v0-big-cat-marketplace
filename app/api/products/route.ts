import { NextRequest, NextResponse } from 'next/server'
import { getAllProducts } from '@/lib/product-actions'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const buyerLat = Number(searchParams.get('buyerLat'))
    const buyerLng = Number(searchParams.get('buyerLng'))

    const result = await getAllProducts({
      buyerLat: Number.isFinite(buyerLat) ? buyerLat : null,
      buyerLng: Number.isFinite(buyerLng) ? buyerLng : null,
    })

    if (!result.success || !Array.isArray(result.data) || result.data.length === 0) {
      return NextResponse.json(result)
    }

    const supabase = await createClient()
    const nowIso = new Date().toISOString()
    const { data: promotions } = await supabase
      .from('promotions')
      .select('merchant_id, discount_type, discount_value, min_purchase_amount, product_ids, is_active, start_date, end_date')
      .eq('is_active', true)
      .lte('start_date', nowIso)
      .gte('end_date', nowIso)

    const promoList = Array.isArray(promotions) ? promotions : []
    const enrichedProducts = result.data.map((product: any) => {
      const price = Math.max(0, Number(product?.price || 0))
      if (price <= 0) {
        return { ...product, promotion_percent_off: 0 }
      }

      const eligiblePromos = promoList.filter((promo: any) => {
        if (String(promo.merchant_id || '') !== String(product?.merchant_id || '')) return false
        const scopedProductIds = Array.isArray(promo.product_ids) ? promo.product_ids : []
        if (scopedProductIds.length > 0 && !scopedProductIds.includes(product?.id)) return false
        if (Number(promo.min_purchase_amount || 0) > price) return false
        return true
      })

      let bestPercent = 0
      for (const promo of eligiblePromos) {
        const rawPercent = promo.discount_type === 'percentage'
          ? Number(promo.discount_value || 0)
          : (Number(promo.discount_value || 0) / price) * 100
        const normalizedPercent = Math.max(0, Math.min(100, Math.round(rawPercent)))
        if (normalizedPercent > bestPercent) bestPercent = normalizedPercent
      }

      return {
        ...product,
        promotion_percent_off: bestPercent,
      }
    })

    return NextResponse.json({ ...result, data: enrichedProducts })
  } catch (error) {
    console.error('Get all products API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}