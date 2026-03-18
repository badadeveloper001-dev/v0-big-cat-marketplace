import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials")
}

const supabase = createClient(supabaseUrl, supabaseKey)

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
    })

    // Validate required fields
    if (!productId || !vendorId || !totalAmount || !deliveryMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // For MVP: Create order with pending payment status
    // In production, this would integrate with Kora's Pay with Bank API
    const { data: order, error } = await supabase
      .from("orders")
      .insert([
        {
          product_id: productId,
          product_name: productName,
          vendor_id: vendorId,
          vendor_name: vendorName,
          buyer_id: null, // Would be auth.uid() in production
          quantity,
          unit_price: unitPrice,
          delivery_fee: deliveryFee || 0,
          total_amount: totalAmount,
          delivery_method: deliveryMethod,
          status: "pending",
          payment_status: "pending",
          payment_provider: "palmpay",
          escrow_status: "pending",
        },
      ])
      .select()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      )
    }

    console.log("[v0] Order created successfully:", order)

    // TODO: In production, call Kora Pay with Bank API here
    // For MVP, simulate successful payment initiation
    const paymentReference = `PM-${Date.now()}`

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json(
      {
        success: true,
        orderId: order?.[0]?.id,
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
