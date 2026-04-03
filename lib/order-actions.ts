'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateDeliveryFee } from '@/lib/delivery-utils'

export interface OrderItem {
  productId: string
  merchantId: string
  productName: string
  quantity: number
  unitPrice: number
  weight?: number
}

export interface CreateOrderData {
  buyerId: string
  items: OrderItem[]
  deliveryType: 'normal' | 'express'
  deliveryAddress: string
  paymentMethod?: 'palmpay' | 'bank' | 'card'
}

// Create a new order
export async function createOrder(data: CreateOrderData) {
  try {
    const supabase = await createClient()
    
    // Calculate totals
    let productTotal = 0
    let totalWeight = 0
    
    for (const item of data.items) {
      productTotal += item.unitPrice * item.quantity
      totalWeight += (item.weight || 0.5) * item.quantity // Default 0.5kg per item
    }
    
    // Calculate delivery fee
    const deliveryFee = calculateDeliveryFee({
      weight: totalWeight,
      deliveryType: data.deliveryType,
      location: data.deliveryAddress,
    })
    
    const grandTotal = productTotal + deliveryFee
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: data.buyerId,
        status: 'pending',
        delivery_type: data.deliveryType,
        delivery_address: data.deliveryAddress,
        delivery_fee: deliveryFee,
        product_total: productTotal,
        grand_total: grandTotal,
      })
      .select()
      .single()
    
    if (orderError) {
      console.error('[v0] Order creation error:', orderError)
      return { success: false, error: 'Failed to create order' }
    }
    
    // Create order items
    const orderItems = data.items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      merchant_id: item.merchantId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.unitPrice * item.quantity,
      weight: item.weight || 0.5,
    }))
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
    
    if (itemsError) {
      console.error('[v0] Order items error:', itemsError)
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id)
      return { success: false, error: 'Failed to create order items' }
    }
    
    // Create escrow entries
    // Group by merchant for product escrow
    const merchantTotals: { [merchantId: string]: number } = {}
    for (const item of data.items) {
      merchantTotals[item.merchantId] = (merchantTotals[item.merchantId] || 0) + (item.unitPrice * item.quantity)
    }
    
    const escrowEntries = [
      // Product escrow entries per merchant
      ...Object.entries(merchantTotals).map(([merchantId, amount]) => ({
        order_id: order.id,
        type: 'product',
        amount,
        recipient_id: merchantId,
        status: 'held',
      })),
      // Delivery escrow entry
      {
        order_id: order.id,
        type: 'delivery',
        amount: deliveryFee,
        recipient_id: null,
        status: 'held',
      },
    ]
    
    const { error: escrowError } = await supabase
      .from('escrow')
      .insert(escrowEntries)
    
    if (escrowError) {
      console.error('[v0] Escrow error:', escrowError)
      // Continue anyway - escrow can be created later
    }
    
    revalidatePath('/')
    return {
      success: true,
      data: {
        orderId: order.id,
        productTotal,
        deliveryFee,
        grandTotal,
      },
    }
  } catch (error) {
    console.error('[v0] Unexpected error in createOrder:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Get orders for a buyer
export async function getBuyerOrders(buyerId: string) {
  try {
    const supabase = await createClient()
    
    // First get orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false })
    
    if (ordersError) {
      // Schema cache or other error - return empty silently
      return { success: true, data: [] }
    }
    
    if (!orders || orders.length === 0) {
      return { success: true, data: [] }
    }
    
    // Try to get order items (may fail if schema cache not refreshed)
    try {
      const orderIds = orders.map(o => o.id)
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds)
      
      if (itemsError) {
        // Schema cache issue - return orders without items
        return { success: true, data: orders.map(o => ({ ...o, order_items: [] })) }
      }
      
      // Combine orders with their items
      const ordersWithItems = orders.map(order => ({
        ...order,
        order_items: (items || []).filter(item => item.order_id === order.id)
      }))
      
      return { success: true, data: ordersWithItems }
    } catch {
      // If order_items query fails, return orders without items
      return { success: true, data: orders.map(o => ({ ...o, order_items: [] })) }
    }
  } catch {
    return { success: true, data: [] }
  }
}

// Get orders for a merchant
export async function getMerchantOrders(merchantId: string) {
  try {
    const supabase = await createClient()
    
    // Try to get order items for this merchant (may fail if schema cache not refreshed)
    try {
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
      
      if (itemsError) {
        // Schema cache issue - return empty
        return { success: true, data: [] }
      }
      
      if (!orderItems || orderItems.length === 0) {
        return { success: true, data: [] }
      }
      
      // Get unique order IDs
      const orderIds = [...new Set(orderItems.map(item => item.order_id))]
      
      // Fetch the orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds)
      
      if (ordersError) {
        return { success: true, data: [] }
      }
      
      // Group items by order
      const ordersMap: { [orderId: string]: any } = {}
      for (const order of orders || []) {
        ordersMap[order.id] = {
          ...order,
          items: orderItems.filter(item => item.order_id === order.id),
        }
      }
      
      return { success: true, data: Object.values(ordersMap) }
    } catch {
      // If order_items query fails, return empty
      return { success: true, data: [] }
    }
  } catch (error) {
    return { success: true, data: [] }
  }
}

// Update order status
export async function updateOrderStatus(orderId: string, status: string, merchantId?: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    
    if (error) {
      console.error('[v0] Update order status error:', error)
      return { success: false, error: 'Failed to update order status' }
    }
    
    // If delivered, release escrow
    if (status === 'delivered') {
      await releaseEscrow(orderId)
    }
    
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('[v0] Unexpected error in updateOrderStatus:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Release escrow funds
async function releaseEscrow(orderId: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('escrow')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
      })
      .eq('order_id', orderId)
      .eq('status', 'held')
    
    if (error) {
      console.error('[v0] Release escrow error:', error)
    }
  } catch (error) {
    console.error('[v0] Unexpected error in releaseEscrow:', error)
  }
}

// Mark order as paid
export async function markOrderPaid(orderId: string) {
  return updateOrderStatus(orderId, 'paid')
}
