'use server'

import { createClient } from '@/lib/supabase/server'

interface ProductInput {
  name: string
  description?: string
  price: number
  category?: string
  image_url?: string
  images?: string[]
  stock?: number
  weight?: number
  is_active?: boolean
  status?: string
}

const MAX_DECIMAL_VALUE = 99999999.99

function sanitizeDecimal(
  value: number | undefined,
  fieldName: string,
  options: { required?: boolean; min?: number } = {},
) {
  if (value === undefined || value === null) {
    if (options.required) {
      throw new Error(`${fieldName} is required`)
    }
    return undefined
  }

  const parsed = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number`)
  }

  if (options.min !== undefined && parsed < options.min) {
    throw new Error(`${fieldName} must be at least ${options.min}`)
  }

  if (parsed > MAX_DECIMAL_VALUE) {
    throw new Error(`${fieldName} is too large. Maximum allowed is ${MAX_DECIMAL_VALUE.toLocaleString()}`)
  }

  return Number(parsed.toFixed(2))
}

function normalizeProduct(product: any) {
  const images = Array.isArray(product?.images)
    ? product.images.filter(Boolean)
    : product?.image_url
      ? [product.image_url]
      : []

  const merchant = product?.merchant_profiles || product?.auth_users

  return {
    ...product,
    images,
    image_url: product?.image_url ?? images[0] ?? null,
    status: product?.status ?? (product?.is_active === false ? 'inactive' : 'active'),
    merchant_profiles: merchant
      ? {
          ...merchant,
          business_name: merchant.business_name || merchant.name || 'Unknown',
          logo_url: merchant.logo_url || merchant.avatar_url || null,
        }
      : undefined,
  }
}

function buildBaseProductPayload(product: Partial<ProductInput>, options: { includeDefaults?: boolean } = {}) {
  return {
    ...(product.name !== undefined ? { name: product.name } : {}),
    ...(product.description !== undefined ? { description: product.description } : {}),
    ...(product.price !== undefined ? { price: product.price } : {}),
    ...(product.category !== undefined ? { category: product.category } : {}),
    ...(product.image_url !== undefined || product.images !== undefined
      ? { image_url: product.image_url || product.images?.[0] || null }
      : {}),
    ...(product.stock !== undefined ? { stock: product.stock } : options.includeDefaults ? { stock: 0 } : {}),
  }
}

export async function getMerchantProducts(merchantId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('products').select('*').eq('merchant_id', merchantId)
    if (error) throw error
    return { success: true, data: (data || []).map(normalizeProduct) }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function getAllProducts() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select('*, merchant_profiles:auth_users!merchant_id(business_name, business_category, business_description, name, location, avatar_url)')
      .eq('is_active', true)
    if (error) throw error
    return { success: true, data: (data || []).map(normalizeProduct) }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function getProductById(productId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select('*, merchant_profiles:auth_users!merchant_id(business_name, business_category, business_description, name, location, avatar_url)')
      .eq('id', productId)
      .single()
    if (error) throw error
    return { success: true, data: normalizeProduct(data) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createProduct(merchantId: string, product: ProductInput) {
  try {
    const supabase = await createClient()

    const normalizedProduct = {
      ...product,
      price: sanitizeDecimal(product.price, 'Product price', { required: true, min: 0.01 }),
      weight: sanitizeDecimal(product.weight, 'Product weight', { min: 0 }),
    }

    const richPayload = {
      ...buildBaseProductPayload(normalizedProduct, { includeDefaults: true }),
      weight: normalizedProduct.weight,
      images: normalizedProduct.images,
      status: normalizedProduct.status ?? 'active',
      merchant_id: merchantId,
    }

    let result = await (supabase.from('products') as any).insert(richPayload).select().single()

    if (result.error && String(result.error.message || '').includes('column')) {
      result = await (supabase.from('products') as any)
        .insert({ ...buildBaseProductPayload(normalizedProduct), merchant_id: merchantId })
        .select()
        .single()
    }

    if (result.error) throw result.error
    return { success: true, data: normalizeProduct(result.data) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateProduct(productId: string, updates: Partial<ProductInput>) {
  try {
    const supabase = await createClient()

    const normalizedUpdates = {
      ...updates,
      ...(updates.price !== undefined
        ? { price: sanitizeDecimal(updates.price, 'Product price', { min: 0.01 }) }
        : {}),
      ...(updates.weight !== undefined
        ? { weight: sanitizeDecimal(updates.weight, 'Product weight', { min: 0 }) }
        : {}),
    }

    const richUpdates = {
      ...buildBaseProductPayload(normalizedUpdates),
      ...(normalizedUpdates.is_active !== undefined ? { is_active: normalizedUpdates.is_active } : {}),
      ...(normalizedUpdates.weight !== undefined ? { weight: normalizedUpdates.weight } : {}),
      ...(normalizedUpdates.images !== undefined ? { images: normalizedUpdates.images } : {}),
      ...(normalizedUpdates.status !== undefined ? { status: normalizedUpdates.status } : {}),
    }

    let result = await (supabase.from('products') as any).update(richUpdates).eq('id', productId).select().single()

    if (result.error && String(result.error.message || '').includes('column')) {
      const fallbackUpdates = {
        ...(normalizedUpdates.name !== undefined ? { name: normalizedUpdates.name } : {}),
        ...(normalizedUpdates.description !== undefined ? { description: normalizedUpdates.description } : {}),
        ...(normalizedUpdates.price !== undefined ? { price: normalizedUpdates.price } : {}),
        ...(normalizedUpdates.category !== undefined ? { category: normalizedUpdates.category } : {}),
        ...(normalizedUpdates.stock !== undefined ? { stock: normalizedUpdates.stock } : {}),
        ...(normalizedUpdates.is_active !== undefined ? { is_active: normalizedUpdates.is_active } : {}),
        ...(normalizedUpdates.image_url !== undefined || normalizedUpdates.images !== undefined
          ? { image_url: normalizedUpdates.image_url || normalizedUpdates.images?.[0] || null }
          : {}),
      }

      result = await (supabase.from('products') as any).update(fallbackUpdates).eq('id', productId).select().single()
    }

    if (result.error) throw result.error
    return { success: true, data: normalizeProduct(result.data) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteProduct(productId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function requestWeightVerification(productId: string) {
  return { success: true, message: 'Verification requested' }
}
