'use server'

import { query } from '@/lib/db'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

interface OrderResponse {
  success: boolean
  error?: string
  data?: any
}

export async function createOrder(
  buyerId: string,
  status: string = 'pending',
  grandTotal: number,
  deliveryType: string = 'normal',
  deliveryAddress?: string,
  paymentMethod?: string
): Promise<OrderResponse> {
  try {
    const orderId = randomUUID().toString()

    const { rows } = await query(
      `INSERT INTO orders (id, buyer_id, status, grand_total, delivery_type, delivery_address, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [orderId, buyerId, status, grandTotal, deliveryType, deliveryAddress, paymentMethod]
    )

    revalidatePath('/')
    return { success: true, data: rows[0] }
  } catch {
    return { success: false, error: 'Failed to create order' }
  }
}

export async function getBuyerOrders(buyerId: string): Promise<OrderResponse> {
  try {
    const { rows: orders } = await query(
      'SELECT * FROM orders WHERE buyer_id = $1 ORDER BY created_at DESC',
      [buyerId]
    )

    if (orders.length === 0) {
      return { success: true, data: [] }
    }

    const orderIds = orders.map((o: any) => o.id)
    const placeholders = orderIds.map((_, i) => `$${i + 1}`).join(',')

    const { rows: items } = await query(
      `SELECT * FROM order_items WHERE order_id IN (${placeholders})`,
      orderIds
    )

    const ordersWithItems = orders.map((order: any) => ({
      ...order,
      order_items: items.filter((item: any) => item.order_id === order.id),
    }))

    return { success: true, data: ordersWithItems }
  } catch {
    return { success: true, data: [] }
  }
}

export async function getMerchantOrders(merchantId: string): Promise<OrderResponse> {
  try {
    const { rows: items } = await query(
      'SELECT * FROM order_items WHERE merchant_id = $1 ORDER BY created_at DESC',
      [merchantId]
    )

    if (items.length === 0) {
      return { success: true, data: [] }
    }

    const orderIds = [...new Set(items.map((item: any) => item.order_id))]
    const placeholders = orderIds.map((_, i) => `$${i + 1}`).join(',')

    const { rows: orders } = await query(
      `SELECT * FROM orders WHERE id IN (${placeholders})`,
      orderIds
    )

    const ordersMap: Record<string, any> = {}
    for (const order of orders) {
      ordersMap[order.id] = {
        ...order,
        items: items.filter((item: any) => item.order_id === order.id),
      }
    }

    return { success: true, data: Object.values(ordersMap) }
  } catch {
    return { success: true, data: [] }
  }
}

export async function updateOrder(
  orderId: string,
  updates: Record<string, any>
): Promise<OrderResponse> {
  try {
    const fields = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ')

    const values = [orderId, ...Object.values(updates)]

    const { rows } = await query(
      `UPDATE orders SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    )

    revalidatePath('/')
    return { success: true, data: rows[0] }
  } catch {
    return { success: false, error: 'Failed to update order' }
  }
}
