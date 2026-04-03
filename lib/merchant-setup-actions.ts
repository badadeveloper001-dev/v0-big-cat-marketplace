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
 * Save merchant setup data - Updates auth_users with merchant info (bypasses broken merchant_profiles table)
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

    // Update auth_users with merchant setup info instead of using broken merchant_profiles table
    const { data: result, error } = await supabase
      .from('auth_users')
      .update({
        smedan_id: smedanId,
        business_name: setupData.businessName.trim(),
        business_description: setupData.businessDescription.trim(),
        business_category: setupData.category,
        business_location: setupData.location.trim(),
        logo_url: setupData.logoUrl || null,
        setup_completed: true,
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      // console.error('[v0] Merchant setup error:', error)
      return { success: false, error: `Failed to save setup information: ${error.message}` }
    }

    if (!result) {
      // console.error('[v0] No result returned from merchant setup')
      return { success: false, error: 'Failed to save setup information' }
    }

    revalidatePath('/')
    return {
      success: true,
      data: {
        id: result.id,
        user_id: result.id,
        smedan_id: result.smedan_id,
        business_name: result.business_name,
        business_description: result.business_description,
        category: result.business_category,
        location: result.business_location,
        logo_url: result.logo_url,
        setup_completed: result.setup_completed,
      },
    }
  } catch (error) {
    // console.error('[v0] Unexpected error in saveMerchantSetup:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get merchant profile for display
 */
export async function getMerchantProfile(userId: string): Promise<SetupResponse> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    const supabase = await createClient()

    const { data: profile, error } = await supabase
      .from('auth_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return { success: false, error: 'Merchant profile not found' }
    }

    return {
      success: true,
      data: {
        id: profile.id,
        user_id: profile.id,
        smedan_id: profile.smedan_id,
        business_name: profile.business_name,
        business_description: profile.business_description,
        category: profile.business_category,
        location: profile.business_location,
        logo_url: profile.logo_url,
        setup_completed: profile.setup_completed,
      },
    }
  } catch (error) {
    // console.error('[v0] Unexpected error in getMerchantProfile:', error)
    return { success: false, error: 'Failed to fetch merchant profile' }
  }
}
