'use server'

import { query } from '@/lib/db'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

interface ProductResponse {
  success: boolean
  error?: string
  data?: any
}

export async function createProduct(
  merchantId: string,
  name: string,
  description: string,
  price: number,
  category: string,
  stock: number,
  imageUrl?: string
): Promise<ProductResponse> {
  try {
    const productId = randomUUID().toString()

    const { rows } = await query(
      `INSERT INTO products (id, merchant_id, name, description, price, category, stock, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [productId, merchantId, name, description, price, category, stock, imageUrl]
    )

    revalidatePath('/')
    return { success: true, data: rows[0] }
  } catch {
    return { success: false, error: 'Failed to create product' }
  }
}

export async function getMerchantProducts(merchantId: string): Promise<ProductResponse> {
  try {
    const { rows } = await query(
      'SELECT * FROM products WHERE merchant_id = $1 ORDER BY created_at DESC',
      [merchantId]
    )

    return { success: true, data: rows }
  } catch {
    return { success: false, error: 'Failed to fetch products' }
  }
}

export async function updateProduct(
  productId: string,
  updates: Record<string, any>
): Promise<ProductResponse> {
  try {
    const fields = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ')

    const values = [productId, ...Object.values(updates)]

    const { rows } = await query(
      `UPDATE products SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    )

    revalidatePath('/')
    return { success: true, data: rows[0] }
  } catch {
    return { success: false, error: 'Failed to update product' }
  }
}

export async function deleteProduct(productId: string): Promise<ProductResponse> {
  try {
    await query('DELETE FROM products WHERE id = $1', [productId])
    revalidatePath('/')
    return { success: true, data: { message: 'Product deleted successfully' } }
  } catch {
    return { success: false, error: 'Failed to delete product' }
  }
}
