import { createClient } from '@/lib/supabase/server'

function formatPromotionError(error: any) {
  const message = String(error?.message || error || '').toLowerCase()
  const code = String(error?.code || '')

  const missingSchema =
    message.includes('schema cache')
    || message.includes('could not find the table')
    || message.includes('does not exist')
    || code === 'PGRST205'

  if (missingSchema) {
    return 'Promotions database tables are not set up yet. Run scripts/022-create-promotions-tables.sql in Supabase SQL Editor, then retry.'
  }

  return String(error?.message || 'Promotion operation failed')
}

export interface PromotionInput {
  name: string
  type: 'discount' | 'bundle' | 'flash_sale'
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase_amount?: number
  max_uses?: number
  usage_per_buyer?: number
  start_date: string
  end_date: string
  product_ids?: string[]
}

export interface CouponInput {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase_amount?: number
  max_uses?: number
  max_uses_per_buyer?: number
  start_date: string
  end_date: string
}

export async function createPromotion(merchantId: string, input: PromotionInput) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('promotions')
      .insert({
        merchant_id: merchantId,
        name: input.name,
        type: input.type,
        description: input.description,
        discount_type: input.discount_type,
        discount_value: Number(input.discount_value),
        min_purchase_amount: Number(input.min_purchase_amount || 0),
        max_uses: input.max_uses || null,
        usage_per_buyer: input.usage_per_buyer || 1,
        start_date: input.start_date,
        end_date: input.end_date,
        product_ids: Array.isArray(input.product_ids) ? input.product_ids : [],
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: formatPromotionError(error) }
  }
}

export async function updatePromotion(
  merchantId: string,
  promotionId: string,
  updates: Partial<PromotionInput>,
) {
  try {
    const supabase = await createClient()

    // Verify ownership
    const { data: promo, error: fetchError } = await supabase
      .from('promotions')
      .select('merchant_id')
      .eq('id', promotionId)
      .single()

    if (fetchError || promo?.merchant_id !== merchantId) {
      return { success: false, error: 'Promotion not found or unauthorized' }
    }

    const updatePayload: any = {}
    if (updates.name) updatePayload.name = updates.name
    if (updates.description) updatePayload.description = updates.description
    if (updates.discount_value) updatePayload.discount_value = Number(updates.discount_value)
    if (updates.discount_type) updatePayload.discount_type = updates.discount_type
    if (updates.min_purchase_amount) updatePayload.min_purchase_amount = Number(updates.min_purchase_amount)
    if (updates.start_date) updatePayload.start_date = updates.start_date
    if (updates.end_date) updatePayload.end_date = updates.end_date
    if (updates.max_uses !== undefined) updatePayload.max_uses = updates.max_uses
    if (updates.usage_per_buyer) updatePayload.usage_per_buyer = updates.usage_per_buyer
    if (Array.isArray(updates.product_ids)) updatePayload.product_ids = updates.product_ids
    updatePayload.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('promotions')
      .update(updatePayload)
      .eq('id', promotionId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: formatPromotionError(error) }
  }
}

export async function deletePromotion(merchantId: string, promotionId: string) {
  try {
    const supabase = await createClient()

    const { data: promo, error: fetchError } = await supabase
      .from('promotions')
      .select('merchant_id')
      .eq('id', promotionId)
      .single()

    if (fetchError || promo?.merchant_id !== merchantId) {
      return { success: false, error: 'Promotion not found or unauthorized' }
    }

    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', promotionId)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: formatPromotionError(error) }
  }
}

export async function getMerchantPromotions(merchantId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: formatPromotionError(error), data: [] }
  }
}

export async function createCoupon(merchantId: string, input: CouponInput) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        merchant_id: merchantId,
        code: String(input.code).toUpperCase(),
        discount_type: input.discount_type,
        discount_value: Number(input.discount_value),
        min_purchase_amount: Number(input.min_purchase_amount || 0),
        max_uses: input.max_uses || null,
        max_uses_per_buyer: input.max_uses_per_buyer || 1,
        start_date: input.start_date,
        end_date: input.end_date,
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: formatPromotionError(error) }
  }
}

export async function getMerchantCoupons(merchantId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: formatPromotionError(error), data: [] }
  }
}

export async function validateCoupon(couponCode: string, buyerId: string, cartTotal: number) {
  try {
    const supabase = await createClient()

    // Find coupon
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', String(couponCode).toUpperCase())
      .single()

    if (couponError || !coupon) {
      return { success: false, error: 'Coupon not found', discount: 0 }
    }

    const now = new Date()

    // Check if coupon is valid
    if (!coupon.is_active) {
      return { success: false, error: 'Coupon is inactive', discount: 0 }
    }

    if (new Date(coupon.start_date) > now) {
      return { success: false, error: 'Coupon not yet valid', discount: 0 }
    }

    if (new Date(coupon.end_date) < now) {
      return { success: false, error: 'Coupon has expired', discount: 0 }
    }

    if (cartTotal < coupon.min_purchase_amount) {
      return {
        success: false,
        error: `Minimum purchase of ₦${coupon.min_purchase_amount} required`,
        discount: 0,
      }
    }

    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return { success: false, error: 'Coupon usage limit reached', discount: 0 }
    }

    // Check buyer usage limit
    const { data: usage } = await supabase
      .from('coupon_usage')
      .select('used_count')
      .eq('coupon_id', coupon.id)
      .eq('buyer_id', buyerId)
      .single()

    if (usage && usage.used_count >= coupon.max_uses_per_buyer) {
      return { success: false, error: 'You have reached the usage limit for this coupon', discount: 0 }
    }

    // Calculate discount
    let discount = 0
    if (coupon.discount_type === 'percentage') {
      discount = Math.min((cartTotal * coupon.discount_value) / 100, cartTotal)
    } else {
      discount = Math.min(coupon.discount_value, cartTotal)
    }

    return {
      success: true,
      coupon,
      discount: Math.round(discount * 100) / 100,
    }
  } catch (error: any) {
    return { success: false, error: formatPromotionError(error), discount: 0 }
  }
}

export async function applyCoupon(couponCode: string, buyerId: string) {
  try {
    const supabase = await createClient()

    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', String(couponCode).toUpperCase())
      .single()

    if (!coupon) {
      return { success: false, error: 'Coupon not found' }
    }

    // Increment coupon usage
    await supabase
      .from('coupons')
      .update({ current_uses: coupon.current_uses + 1 })
      .eq('id', coupon.id)

    // Upsert buyer usage
    const { data: usage } = await supabase
      .from('coupon_usage')
      .select('used_count')
      .eq('coupon_id', coupon.id)
      .eq('buyer_id', buyerId)
      .single()

    if (usage) {
      await supabase
        .from('coupon_usage')
        .update({ used_count: usage.used_count + 1, last_used_at: new Date().toISOString() })
        .eq('coupon_id', coupon.id)
        .eq('buyer_id', buyerId)
    } else {
      await supabase.from('coupon_usage').insert({
        coupon_id: coupon.id,
        buyer_id: buyerId,
        used_count: 1,
      })
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: formatPromotionError(error) }
  }
}

export async function getPromotionAnalytics(merchantId: string, promotionId: string) {
  try {
    const supabase = await createClient()

    // Verify ownership
    const { data: promo, error: fetchError } = await supabase
      .from('promotions')
      .select('merchant_id')
      .eq('id', promotionId)
      .single()

    if (fetchError || promo?.merchant_id !== merchantId) {
      return { success: false, error: 'Promotion not found or unauthorized', data: [] }
    }

    const { data, error } = await supabase
      .from('promotion_analytics')
      .select('*')
      .eq('promotion_id', promotionId)
      .order('date', { ascending: false })
      .limit(30)

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: formatPromotionError(error), data: [] }
  }
}
