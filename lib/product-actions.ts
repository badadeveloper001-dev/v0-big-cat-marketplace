'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface Product {
  id?: string
  name: string
  description: string
  price: number
  category: string
  weight?: number
  images?: string[]
  status?: string
}

interface ProductResponse {
  success: boolean
  error?: string
  data?: any
}

// Validation functions
function validateProductName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 100
}

function validateDescription(desc: string): boolean {
  return desc.trim().length >= 10 && desc.trim().length <= 2000
}

function validatePrice(price: number): boolean {
  return price > 0 && price <= 999999.99
}

function validateCategory(category: string): boolean {
  const validCategories = [
    'Electronics',
    'Fashion',
    'Food & Beverages',
    'Home & Garden',
    'Sports & Outdoors',
    'Books & Media',
    'Beauty & Personal Care',
    'Toys & Games',
    'Automotive',
    'Health & Wellness',
    'Other'
  ]
  return validCategories.includes(category)
}

/**
 * Create a new product
 */
export async function createProduct(
  merchantId: string,
  product: Product
): Promise<ProductResponse> {
  try {
    if (!merchantId) {
      return { success: false, error: 'Merchant ID is required' }
    }

    if (!validateProductName(product.name)) {
      return { success: false, error: 'Product name must be between 2 and 100 characters' }
    }

    if (!validateDescription(product.description)) {
      return { success: false, error: 'Description must be between 10 and 2000 characters' }
    }

    if (!validatePrice(product.price)) {
      return { success: false, error: 'Price must be between 0.01 and 999999.99' }
    }

    if (!validateCategory(product.category)) {
      return { success: false, error: 'Please select a valid category' }
    }

    const supabase = await createClient()

    // Create product
    const { data: newProduct, error: createError } = await supabase
      .from('products')
      .insert({
        merchant_id: merchantId,
        name: product.name.trim(),
        description: product.description.trim(),
        price: product.price,
        category: product.category,
        weight: product.weight || null,
        images: product.images || [],
        status: product.weight ? 'active' : 'pending_weight_verification',
      })
      .select()
      .maybeSingle()

    if (createError) {
      console.error('[v0] Product creation error:', createError)
      return { success: false, error: 'Failed to create product' }
    }

    revalidatePath('/')
    return { success: true, data: newProduct }
  } catch (error) {
    console.error('[v0] Unexpected error in createProduct:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(
  productId: string,
  product: Partial<Product>
): Promise<ProductResponse> {
  try {
    if (!productId) {
      return { success: false, error: 'Product ID is required' }
    }

    if (product.name && !validateProductName(product.name)) {
      return { success: false, error: 'Product name must be between 2 and 100 characters' }
    }

    if (product.description && !validateDescription(product.description)) {
      return { success: false, error: 'Description must be between 10 and 2000 characters' }
    }

    if (product.price && !validatePrice(product.price)) {
      return { success: false, error: 'Price must be between 0.01 and 999999.99' }
    }

    if (product.category && !validateCategory(product.category)) {
      return { success: false, error: 'Please select a valid category' }
    }

    const supabase = await createClient()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (product.name) updateData.name = product.name.trim()
    if (product.description) updateData.description = product.description.trim()
    if (product.price !== undefined) updateData.price = product.price
    if (product.category) updateData.category = product.category
    if (product.weight !== undefined) updateData.weight = product.weight
    if (product.images) updateData.images = product.images
    if (product.status) updateData.status = product.status

    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .maybeSingle()

    if (updateError) {
      console.error('[v0] Product update error:', updateError)
      return { success: false, error: 'Failed to update product' }
    }

    revalidatePath('/')
    return { success: true, data: updatedProduct }
  } catch (error) {
    console.error('[v0] Unexpected error in updateProduct:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string): Promise<ProductResponse> {
  try {
    if (!productId) {
      return { success: false, error: 'Product ID is required' }
    }

    const supabase = await createClient()

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (deleteError) {
      console.error('[v0] Product deletion error:', deleteError)
      return { success: false, error: 'Failed to delete product' }
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('[v0] Unexpected error in deleteProduct:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get merchant's products
 */
export async function getMerchantProducts(merchantId: string): Promise<ProductResponse> {
  try {
    if (!merchantId) {
      return { success: false, error: 'Merchant ID is required' }
    }

    const supabase = await createClient()

    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('[v0] Error fetching merchant products:', fetchError)
      return { success: false, error: 'Failed to fetch products' }
    }

    return { success: true, data: products || [] }
  } catch (error) {
    console.error('[v0] Unexpected error in getMerchantProducts:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all active products for the marketplace
 */
export async function getAllProducts(category?: string, search?: string): Promise<ProductResponse> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('products')
      .select('*, merchant_profiles(id, business_name, logo_url)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: products, error: fetchError } = await query

    if (fetchError) {
      console.error('[v0] Error fetching products:', fetchError)
      return { success: false, error: 'Failed to fetch products' }
    }

    // Filter by search term if provided
    let filteredProducts = products || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredProducts = filteredProducts.filter(
        (p: any) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
      )
    }

    return { success: true, data: filteredProducts }
  } catch (error) {
    console.error('[v0] Unexpected error in getAllProducts:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(productId: string): Promise<ProductResponse> {
  try {
    if (!productId) {
      return { success: false, error: 'Product ID is required' }
    }

    const supabase = await createClient()

    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*, merchant_profiles(id, business_name, logo_url, location)')
      .eq('id', productId)
      .maybeSingle()

    if (fetchError) {
      console.error('[v0] Error fetching product:', fetchError)
      return { success: false, error: 'Failed to fetch product' }
    }

    if (!product) {
      return { success: false, error: 'Product not found' }
    }

    return { success: true, data: product }
  } catch (error) {
    console.error('[v0] Unexpected error in getProductById:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Request weight verification for a product
 */
export async function requestWeightVerification(productId: string): Promise<ProductResponse> {
  try {
    if (!productId) {
      return { success: false, error: 'Product ID is required' }
    }

    const supabase = await createClient()

    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({
        status: 'pending_weight_verification',
        weight_verification_status: 'pending',
      })
      .eq('id', productId)
      .select()
      .maybeSingle()

    if (updateError) {
      console.error('[v0] Error requesting weight verification:', updateError)
      return { success: false, error: 'Failed to request verification' }
    }

    revalidatePath('/')
    return { success: true, data: updated }
  } catch (error) {
    console.error('[v0] Unexpected error in requestWeightVerification:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
