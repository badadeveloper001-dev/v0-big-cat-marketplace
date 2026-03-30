"use server"

import { createClient } from "@/lib/supabase/server"

export interface Review {
  id: string
  product_id: string
  user_id: string
  order_id?: string
  rating: number
  comment: string
  verified_purchase: boolean
  created_at: string
  user?: {
    name: string
  }
}

export async function getProductReviews(productId: string): Promise<{
  success: boolean
  reviews?: Review[]
  averageRating?: number
  totalReviews?: number
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        users:user_id (name)
      `)
      .eq("product_id", productId)
      .order("created_at", { ascending: false })

    if (error) {
      // Table might not exist yet - return empty
      console.error("Error fetching reviews:", error)
      return { success: true, reviews: [], averageRating: 0, totalReviews: 0 }
    }

    const reviews = data || []
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0

    return {
      success: true,
      reviews: reviews.map(r => ({
        ...r,
        user: r.users
      })),
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
    }
  } catch (error) {
    console.error("Error in getProductReviews:", error)
    return { success: true, reviews: [], averageRating: 0, totalReviews: 0 }
  }
}

export async function createReview(data: {
  productId: string
  userId: string
  orderId?: string
  rating: number
  comment: string
}): Promise<{ success: boolean; review?: Review; error?: string }> {
  try {
    const supabase = await createClient()

    // Check if user already reviewed this product
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("product_id", data.productId)
      .eq("user_id", data.userId)
      .single()

    if (existing) {
      return { success: false, error: "You have already reviewed this product" }
    }

    // Check if this is a verified purchase
    let verifiedPurchase = false
    if (data.orderId) {
      const { data: order } = await supabase
        .from("orders")
        .select("id, status")
        .eq("id", data.orderId)
        .eq("user_id", data.userId)
        .eq("status", "delivered")
        .single()
      
      verifiedPurchase = !!order
    }

    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        product_id: data.productId,
        user_id: data.userId,
        order_id: data.orderId,
        rating: data.rating,
        comment: data.comment,
        verified_purchase: verifiedPurchase,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating review:", error)
      return { success: false, error: "Failed to create review" }
    }

    // Update product average rating
    await updateProductRating(data.productId)

    return { success: true, review }
  } catch (error) {
    console.error("Error in createReview:", error)
    return { success: false, error: "Failed to create review" }
  }
}

async function updateProductRating(productId: string) {
  try {
    const supabase = await createClient()
    
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", productId)

    if (reviews && reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      
      await supabase
        .from("products")
        .update({
          average_rating: Math.round(avg * 100) / 100,
          review_count: reviews.length,
        })
        .eq("id", productId)
    }
  } catch (error) {
    console.error("Error updating product rating:", error)
  }
}

export async function canUserReview(userId: string, productId: string): Promise<{
  canReview: boolean
  hasReviewed: boolean
  hasPurchased: boolean
  orderId?: string
}> {
  try {
    const supabase = await createClient()

    // Check if already reviewed
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .single()

    if (existingReview) {
      return { canReview: false, hasReviewed: true, hasPurchased: true }
    }

    // Check if user has purchased and received this product
    const { data: orders } = await supabase
      .from("orders")
      .select("id, status")
      .eq("user_id", userId)
      .eq("status", "delivered")

    if (!orders || orders.length === 0) {
      return { canReview: false, hasReviewed: false, hasPurchased: false }
    }

    // Check if any order contains this product
    for (const order of orders) {
      const { data: items } = await supabase
        .from("order_items")
        .select("id")
        .eq("order_id", order.id)
        .eq("product_id", productId)
        .single()

      if (items) {
        return { 
          canReview: true, 
          hasReviewed: false, 
          hasPurchased: true, 
          orderId: order.id 
        }
      }
    }

    return { canReview: false, hasReviewed: false, hasPurchased: false }
  } catch (error) {
    console.error("Error checking review eligibility:", error)
    return { canReview: false, hasReviewed: false, hasPurchased: false }
  }
}
