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
const MAX_STOCK_VALUE = 99999999

function isBigZeeWears(value: unknown) {
  const normalized = String(value || '').toLowerCase()
  return normalized.includes('big zee wears') || normalized.includes('big zee')
}

function sortBigZeeFirst<T>(items: T[], getText: (item: T) => string) {
  return [...items].sort((a, b) => {
    const aIsBigZee = isBigZeeWears(getText(a))
    const bIsBigZee = isBigZeeWears(getText(b))

    if (aIsBigZee === bIsBigZee) return 0
    return aIsBigZee ? -1 : 1
  })
}

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

function sanitizeWholeNumber(
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

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error(`${fieldName} must be a whole number`)
  }

  if (options.min !== undefined && parsed < options.min) {
    throw new Error(`${fieldName} must be at least ${options.min}`)
  }

  if (parsed > MAX_STOCK_VALUE) {
    throw new Error(`${fieldName} is too large. Maximum allowed is ${MAX_STOCK_VALUE.toLocaleString()}`)
  }

  return parsed
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
    stock: Number.isFinite(Number(product?.stock)) ? Number(product.stock) : 0,
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
    const { data, error } = await supabase
      .from('products')
      .select('*, merchant_profiles:auth_users!merchant_id(business_name, business_category, business_description, name, location, avatar_url)')
      .eq('merchant_id', merchantId)
      .eq('is_active', true)
    if (error) throw error
    return { success: true, data: (data || []).map(normalizeProduct).filter((product) => product.status !== 'deleted') }
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

    const normalizedProducts = (data || []).map(normalizeProduct)
    const sortedProducts = sortBigZeeFirst(
      normalizedProducts,
      (product: any) => `${product?.merchant_profiles?.business_name || ''} ${product?.merchant_profiles?.name || ''} ${product?.name || ''}`
    )

    return { success: true, data: sortedProducts }
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

    const normalized = normalizeProduct(data)
    if (normalized.status === 'deleted' || normalized.is_active === false) {
      return { success: false, error: 'Product not found' }
    }

    return { success: true, data: normalized }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createProduct(merchantId: string, product: ProductInput, actorId?: string) {
  try {
    const supabase = await createClient()

    if (actorId && actorId !== merchantId) {
      return { success: false, error: 'You are not allowed to create products for this merchant.' }
    }

    const normalizedProduct = {
      ...product,
      price: sanitizeDecimal(product.price, 'Product price', { required: true, min: 0.01 }),
      stock: sanitizeWholeNumber(product.stock, 'Stock quantity', { min: 0 }),
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

export async function updateProduct(productId: string, updates: Partial<ProductInput>, actorId?: string) {
  try {
    const supabase = await createClient()

    const normalizedUpdates = {
      ...updates,
      ...(updates.price !== undefined
        ? { price: sanitizeDecimal(updates.price, 'Product price', { min: 0.01 }) }
        : {}),
      ...(updates.stock !== undefined
        ? { stock: sanitizeWholeNumber(updates.stock, 'Stock quantity', { min: 0 }) }
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

    let updateQuery = (supabase.from('products') as any).update(richUpdates).eq('id', productId)
    if (actorId) updateQuery = updateQuery.eq('merchant_id', actorId)

    let result = await updateQuery.select().single()

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

      let fallbackQuery = (supabase.from('products') as any).update(fallbackUpdates).eq('id', productId)
      if (actorId) fallbackQuery = fallbackQuery.eq('merchant_id', actorId)

      result = await fallbackQuery.select().single()
    }

    if (result.error) throw result.error
    return { success: true, data: normalizeProduct(result.data) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteProduct(productId: string, actorId?: string) {
  try {
    const supabase = await createClient()
    let query = supabase.from('products').delete().eq('id', productId)
    if (actorId) query = query.eq('merchant_id', actorId)

    const { error } = await query

    if (!error) {
      return { success: true, deleted: true, message: 'Product deleted successfully' }
    }

    const errorMessage = String(error.message || '')
    const hasReferenceConstraint = /foreign key|violates.*constraint|order_items_product_id_fkey/i.test(errorMessage)

    if (!hasReferenceConstraint) {
      throw error
    }

    const softDeleteAttempts = [
      { is_active: false, status: 'deleted', stock: 0, updated_at: new Date().toISOString() },
      { is_active: false, stock: 0, updated_at: new Date().toISOString() },
      { is_active: false, stock: 0 },
      { status: 'deleted' },
    ]

    let archived = false
    let lastSoftDeleteError: any = null

    for (const payload of softDeleteAttempts) {
      let updateQuery = (supabase.from('products') as any).update(payload).eq('id', productId)
      if (actorId) updateQuery = updateQuery.eq('merchant_id', actorId)

      const result = await updateQuery.select('id').maybeSingle()
      if (!result.error) {
        archived = true
        break
      }
      lastSoftDeleteError = result.error
    }

    if (!archived && lastSoftDeleteError) {
      throw lastSoftDeleteError
    }

    return {
      success: true,
      archived: true,
      message: 'Product removed from active listings. Existing orders were preserved.',
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function requestWeightVerification(productId: string) {
  return { success: true, message: 'Verification requested' }
}
