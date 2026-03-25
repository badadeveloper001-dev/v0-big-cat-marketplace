'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface MerchantSetupData {
  businessName: string
  businessDescription: string
  category: string
  location: string
  logoUrl?: string
}

interface SetupResponse {
  success: boolean
  error?: string
  data?: any
}

// Validation
function validateBusinessName(name: string): boolean {
  return name.trim().length >= 2 && name.length <= 100
}

function validateBusinessDescription(description: string): boolean {
  return description.trim().length >= 10 && description.length <= 1000
}

function validateCategory(category: string): boolean {
  const validCategories = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports & Outdoors',
    'Books & Media',
    'Toys & Games',
    'Food & Beverages',
    'Health & Beauty',
    'Automotive',
    'Office Supplies',
    'Other'
  ]
  return validCategories.includes(category)
}

function validateLocation(location: string): boolean {
  return location.trim().length >= 2 && location.length <= 100
}

/**
 * Save merchant setup data - Creates merchant profile on first setup
 */
export async function saveMerchantSetup(
  userId: string,
  smedanId: string,
  setupData: MerchantSetupData
): Promise<SetupResponse> {
  try {
    // Validate all inputs
    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    if (!smedanId) {
      return { success: false, error: 'SMEDAN ID is required' }
    }

    if (!validateBusinessName(setupData.businessName)) {
      return { success: false, error: 'Business name must be between 2 and 100 characters' }
    }

    if (!validateBusinessDescription(setupData.businessDescription)) {
      return { success: false, error: 'Business description must be between 10 and 1000 characters' }
    }

    if (!validateCategory(setupData.category)) {
      return { success: false, error: 'Please select a valid category' }
    }

    if (!validateLocation(setupData.location)) {
      return { success: false, error: 'Location must be between 2 and 100 characters' }
    }

    const supabase = await createClient()

    // Check if merchant profile exists
    const { data: existingProfile } = await supabase
      .from('merchant_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    let result
    let error

    if (existingProfile) {
      // Profile exists, update it
      const response = await supabase
        .from('merchant_profiles')
        .update({
          business_name: setupData.businessName.trim(),
          business_description: setupData.businessDescription.trim(),
          category: setupData.category,
          location: setupData.location.trim(),
          logo_url: setupData.logoUrl || null,
          setup_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .maybeSingle()

      result = response.data
      error = response.error
    } else {
      // Profile doesn't exist, create it
      const response = await supabase
        .from('merchant_profiles')
        .insert({
          user_id: userId,
          smedan_id: smedanId,
          business_name: setupData.businessName.trim(),
          business_description: setupData.businessDescription.trim(),
          category: setupData.category,
          location: setupData.location.trim(),
          logo_url: setupData.logoUrl || null,
          setup_completed: true,
        })
        .select()
        .maybeSingle()

      result = response.data
      error = response.error
    }

    if (error) {
      console.error('[v0] Merchant setup error:', error)
      return { success: false, error: `Failed to save setup information: ${error.message}` }
    }

    if (!result) {
      console.error('[v0] No result returned from merchant setup')
      return { success: false, error: 'Failed to save setup information' }
    }

    revalidatePath('/')
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('[v0] Unexpected error in saveMerchantSetup:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get merchant profile for display
 */
export async function getMerchantProfile(merchantId: string): Promise<SetupResponse> {
  try {
    if (!merchantId) {
      return { success: false, error: 'Merchant ID is required' }
    }

    const supabase = await createClient()

    const { data: profile, error } = await supabase
      .from('merchant_profiles')
      .select('*')
      .eq('id', merchantId)
      .single()

    if (error || !profile) {
      return { success: false, error: 'Merchant profile not found' }
    }

    return {
      success: true,
      data: profile,
    }
  } catch (error) {
    console.error('[v0] Unexpected error in getMerchantProfile:', error)
    return { success: false, error: 'Failed to fetch merchant profile' }
  }
}
