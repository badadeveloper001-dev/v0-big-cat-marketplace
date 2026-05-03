import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { getBestPromotionDiscountForItems, incrementPromotionUsage } from "@/lib/promotion-actions"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials")
}

const supabase = createClient(supabaseUrl, supabaseKey)

function isMissingColumnError(error: any) {
  const message = String(error?.message || "").toLowerCase()
  return message.includes("column") && (
    message.includes("does not exist")
    || message.includes("schema cache")
    || message.includes("could not find")
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      productId,
      productName,
      vendorId,
      vendorName,
      quantity,
      unitPrice,
      totalAmount,
      deliveryMethod,
      deliveryFee,
      appliedCoupon,
    } = body

    console.log("[v0] Order initiation request:", {
      productId,
      productName,
      vendorId,
      vendorName,
      quantity,
      unitPrice,
      totalAmount,
      deliveryMethod,
      appliedCoupon,
    })

    const itemSubtotal = Math.max(0, Number(unitPrice || 0) * Number(quantity || 0))
    const appliedPromotion = await getBestPromotionDiscountForItems(String(vendorId), [
      {
        productId: String(productId),
        quantity: Number(quantity || 0),
        unitPrice: Number(unitPrice || 0),
      },
    ])
    const promotionDiscount = Math.min(Number(appliedPromotion?.discountAmount || 0), itemSubtotal)
    const beforeCouponTotal = Math.max(0, itemSubtotal - promotionDiscount + Number(deliveryFee || 0))
    const couponDiscount = Math.min(Number(appliedCoupon?.discount || 0), beforeCouponTotal)
    const finalTotal = Math.max(0, beforeCouponTotal - couponDiscount)

    // Validate required fields
    if (!productId || !vendorId || !totalAmount || !deliveryMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const orderAttempts = [
      {
        product_id: productId,
        product_name: productName,
        vendor_id: vendorId,
        vendor_name: vendorName,
        buyer_id: null,
        quantity,
        unit_price: unitPrice,
        delivery_fee: deliveryFee || 0,
        total_amount: finalTotal,
        delivery_method: deliveryMethod,
        status: "pending",
        payment_status: "pending",
        applied_coupon_code: appliedCoupon?.code || null,
        coupon_discount: couponDiscount,
        final_total: finalTotal,
      },
      {
        product_id: productId,
        product_name: productName,
        vendor_id: vendorId,
        vendor_name: vendorName,
        buyer_id: null,
        quantity,
        unit_price: unitPrice,
        delivery_fee: deliveryFee || 0,
        total_amount: finalTotal,
        delivery_method: deliveryMethod,
        status: "pending",
        payment_status: "pending",
        applied_coupon_code: appliedCoupon?.code || null,
        coupon_discount: couponDiscount,
        final_total: finalTotal,
      },
      {
        product_id: productId,
        product_name: productName,
        vendor_id: vendorId,
        vendor_name: vendorName,
        buyer_id: null,
        quantity,
        unit_price: unitPrice,
        delivery_fee: deliveryFee || 0,
        total_amount: finalTotal,
        delivery_method: deliveryMethod,
        status: "pending",
        applied_coupon_code: appliedCoupon?.code || null,
        coupon_discount: couponDiscount,
        final_total: finalTotal,
      },
    ]

    let order: any[] | null = null
    let lastError: any = null

    for (const attempt of orderAttempts) {
      const { data, error } = await supabase.from("orders").insert([attempt]).select()
      if (!error) {
        order = data || []
        break
      }

      if (!isMissingColumnError(error)) {
        console.error("[v0] Database error:", error)
        return NextResponse.json(
          { error: "Failed to create order" },
          { status: 500 }
        )
      }

      lastError = error
    }

    if (!order) {
      console.error("[v0] Database error:", lastError)
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      )
    }

    console.log("[v0] Order created successfully:", order)

    try {
      const stockResult = await supabase
        .from('products')
        .select('id, stock')
        .eq('id', productId)
        .single()

      if (!stockResult.error && stockResult.data) {
        const currentStock = Math.max(0, Number(stockResult.data.stock || 0))
        const nextStock = Math.max(0, currentStock - Number(quantity || 0))
        await supabase
          .from('products')
          .update({ stock: nextStock })
          .eq('id', productId)
      }
    } catch (stockError) {
      console.error('[v0] Stock update failed:', stockError)
    }

    if (appliedPromotion?.promotionId && promotionDiscount > 0) {
      await incrementPromotionUsage(appliedPromotion.promotionId)
    }

    // TODO: In production, call Kora Pay with Bank API here
    // For MVP, simulate successful payment initiation
    const paymentReference = `PM-${Date.now()}`

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json(
      {
        success: true,
        orderId: order?.[0]?.id,
        promotionDiscount,
        promotionName: appliedPromotion?.promotionName || null,
        paymentReference,
        message: "Order initiated successfully. Redirecting to payment...",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Checkout initiation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
