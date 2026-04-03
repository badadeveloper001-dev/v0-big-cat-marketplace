'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface UserUpdateResponse {
  success: boolean
  error?: string
  data?: any
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<UserUpdateResponse> {
  try {
    const supabase = await createClient()

    const { data: user, error } = await supabase
      .from('auth_users')
      .select('id, email, full_name, phone, address, avatar_url, role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[v0] Error fetching user profile:', error)
      return { success: false, error: 'Failed to fetch profile' }
    }

    return {
      success: true,
      data: user,
    }
  } catch (error) {
    console.error('[v0] Unexpected error in getUserProfile:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    full_name?: string
    phone?: string
    address?: string
    avatar_url?: string
    // Business/merchant fields
    business_name?: string
    business_description?: string
    business_category?: string
    location?: string
  }
): Promise<UserUpdateResponse> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    // Validate name
    if (updates.full_name && updates.full_name.trim().length < 2) {
      return { success: false, error: 'Name must be at least 2 characters' }
    }

    // Validate phone
    if (updates.phone && updates.phone.trim().length < 10) {
      return { success: false, error: 'Phone number must be at least 10 digits' }
    }

    const supabase = await createClient()

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (updates.full_name !== undefined) updateData.full_name = updates.full_name
    if (updates.phone !== undefined) updateData.phone = updates.phone
    if (updates.address !== undefined) updateData.address = updates.address
    if (updates.avatar_url !== undefined) updateData.avatar_url = updates.avatar_url
    if (updates.business_name !== undefined) updateData.business_name = updates.business_name
    if (updates.business_description !== undefined) updateData.business_description = updates.business_description
    if (updates.business_category !== undefined) updateData.business_category = updates.business_category
    if (updates.location !== undefined) updateData.location = updates.location

    const { data: updatedUser, error } = await supabase
      .from('auth_users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating user profile:', error)
      return { success: false, error: 'Failed to update profile' }
    }

    revalidatePath('/')
    return {
      success: true,
      data: updatedUser,
    }
  } catch (error) {
    console.error('[v0] Unexpected error in updateUserProfile:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update email address
 */
export async function updateEmail(
  userId: string,
  newEmail: string,
  password: string
): Promise<UserUpdateResponse> {
  try {
    if (!userId || !newEmail || !password) {
      return { success: false, error: 'Missing required fields' }
    }

    const supabase = await createClient()

    // Verify password first
    const { data: user } = await supabase
      .from('auth_users')
      .select('password_hash')
      .eq('id', userId)
      .single()

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Simple hash comparison (in production, use bcrypt)
    const crypto = await import('crypto')
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex')

    if (passwordHash !== user.password_hash) {
      return { success: false, error: 'Invalid password' }
    }

    // Check if new email already exists
    const { data: existingEmail } = await supabase
      .from('auth_users')
      .select('id')
      .eq('email', newEmail.toLowerCase())
      .neq('id', userId)
      .single()

    if (existingEmail) {
      return { success: false, error: 'Email already in use' }
    }

    // Update email
    const { data: updatedUser, error } = await supabase
      .from('auth_users')
      .update({
        email: newEmail.toLowerCase(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating email:', error)
      return { success: false, error: 'Failed to update email' }
    }

    revalidatePath('/')
    return {
      success: true,
      data: updatedUser,
    }
  } catch (error) {
    console.error('[v0] Unexpected error in updateEmail:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Change password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<UserUpdateResponse> {
  try {
    if (!userId || !currentPassword || !newPassword) {
      return { success: false, error: 'Missing required fields' }
    }

    // Validate new password
    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' }
    }

    if (!/[A-Z]/.test(newPassword)) {
      return { success: false, error: 'Password must contain at least one uppercase letter' }
    }

    if (!/[0-9]/.test(newPassword)) {
      return { success: false, error: 'Password must contain at least one number' }
    }

    const supabase = await createClient()

    // Get user and verify current password
    const { data: user } = await supabase
      .from('auth_users')
      .select('password_hash')
      .eq('id', userId)
      .single()

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Verify current password
    const crypto = await import('crypto')
    const currentHash = crypto.createHash('sha256').update(currentPassword).digest('hex')

    if (currentHash !== user.password_hash) {
      return { success: false, error: 'Current password is incorrect' }
    }

    // Hash new password
    const newHash = crypto.createHash('sha256').update(newPassword).digest('hex')

    // Update password
    const { error } = await supabase
      .from('auth_users')
      .update({
        password_hash: newHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('[v0] Error changing password:', error)
      return { success: false, error: 'Failed to change password' }
    }

    revalidatePath('/')
    return {
      success: true,
      data: { message: 'Password changed successfully' },
    }
  } catch (error) {
    console.error('[v0] Unexpected error in changePassword:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: {
    email_notifications?: boolean
    push_notifications?: boolean
    sms_notifications?: boolean
  }
): Promise<UserUpdateResponse> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    const supabase = await createClient()

    const { data: updatedUser, error } = await supabase
      .from('auth_users')
      .update({
        email_notifications: preferences.email_notifications,
        push_notifications: preferences.push_notifications,
        sms_notifications: preferences.sms_notifications,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error updating notification preferences:', error)
      return { success: false, error: 'Failed to update preferences' }
    }

    revalidatePath('/')
    return {
      success: true,
      data: updatedUser,
    }
  } catch (error) {
    console.error('[v0] Unexpected error in updateNotificationPreferences:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get user's payment methods
 */
export async function getPaymentMethods(userId: string): Promise<UserUpdateResponse> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    const supabase = await createClient()

    const { data: paymentMethods, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching payment methods:', error)
      return { success: false, error: 'Failed to fetch payment methods' }
    }

    return {
      success: true,
      data: paymentMethods || [],
    }
  } catch (error) {
    console.error('[v0] Unexpected error in getPaymentMethods:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Add a new payment method
 */
export async function addPaymentMethod(
  userId: string,
  cardDetails: {
    card_type: string
    card_last_four: string
    card_holder_name: string
    expiry_month: number
    expiry_year: number
    is_default?: boolean
  }
): Promise<UserUpdateResponse> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    // Validate card details
    if (!cardDetails.card_last_four || cardDetails.card_last_four.length !== 4) {
      return { success: false, error: 'Invalid card number' }
    }

    if (!cardDetails.card_holder_name || cardDetails.card_holder_name.trim().length < 2) {
      return { success: false, error: 'Card holder name is required' }
    }

    if (!cardDetails.expiry_month || cardDetails.expiry_month < 1 || cardDetails.expiry_month > 12) {
      return { success: false, error: 'Invalid expiry month' }
    }

    const currentYear = new Date().getFullYear()
    if (!cardDetails.expiry_year || cardDetails.expiry_year < currentYear) {
      return { success: false, error: 'Card has expired' }
    }

    const supabase = await createClient()

    // If this is the default card, unset other defaults
    if (cardDetails.is_default) {
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId)
    }

    // Check if this is the first card (make it default)
    const { data: existingCards } = await supabase
      .from('payment_methods')
      .select('id')
      .eq('user_id', userId)

    const isFirstCard = !existingCards || existingCards.length === 0

    const { data: newCard, error } = await supabase
      .from('payment_methods')
      .insert({
        user_id: userId,
        card_type: cardDetails.card_type,
        card_last_four: cardDetails.card_last_four,
        card_holder_name: cardDetails.card_holder_name,
        expiry_month: cardDetails.expiry_month,
        expiry_year: cardDetails.expiry_year,
        is_default: cardDetails.is_default || isFirstCard,
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error adding payment method:', error)
      return { success: false, error: 'Failed to add payment method' }
    }

    revalidatePath('/')
    return {
      success: true,
      data: newCard,
    }
  } catch (error) {
    console.error('[v0] Unexpected error in addPaymentMethod:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Remove a payment method
 */
export async function removePaymentMethod(
  userId: string,
  paymentMethodId: string
): Promise<UserUpdateResponse> {
  try {
    if (!userId || !paymentMethodId) {
      return { success: false, error: 'Missing required fields' }
    }

    const supabase = await createClient()

    // Check if this card belongs to the user
    const { data: card } = await supabase
      .from('payment_methods')
      .select('id, is_default')
      .eq('id', paymentMethodId)
      .eq('user_id', userId)
      .single()

    if (!card) {
      return { success: false, error: 'Payment method not found' }
    }

    // Delete the card
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', paymentMethodId)
      .eq('user_id', userId)

    if (error) {
      console.error('[v0] Error removing payment method:', error)
      return { success: false, error: 'Failed to remove payment method' }
    }

    // If it was the default, set another card as default
    if (card.is_default) {
      const { data: remainingCards } = await supabase
        .from('payment_methods')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (remainingCards && remainingCards.length > 0) {
        await supabase
          .from('payment_methods')
          .update({ is_default: true })
          .eq('id', remainingCards[0].id)
      }
    }

    revalidatePath('/')
    return {
      success: true,
      data: { message: 'Payment method removed' },
    }
  } catch (error) {
    console.error('[v0] Unexpected error in removePaymentMethod:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Set a payment method as default
 */
export async function setDefaultPaymentMethod(
  userId: string,
  paymentMethodId: string
): Promise<UserUpdateResponse> {
  try {
    if (!userId || !paymentMethodId) {
      return { success: false, error: 'Missing required fields' }
    }

    const supabase = await createClient()

    // Unset all defaults for this user
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId)

    // Set the new default
    const { data: updatedCard, error } = await supabase
      .from('payment_methods')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', paymentMethodId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('[v0] Error setting default payment method:', error)
      return { success: false, error: 'Failed to update default payment method' }
    }

    revalidatePath('/')
    return {
      success: true,
      data: updatedCard,
    }
  } catch (error) {
    console.error('[v0] Unexpected error in setDefaultPaymentMethod:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete user account (soft delete)
 */
export async function deleteAccount(
  userId: string,
  password: string
): Promise<UserUpdateResponse> {
  try {
    if (!userId || !password) {
      return { success: false, error: 'Password is required to delete account' }
    }

    const supabase = await createClient()

    // Get user and verify password
    const { data: user } = await supabase
      .from('auth_users')
      .select('password_hash, role')
      .eq('id', userId)
      .single()

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Verify password
    const crypto = await import('crypto')
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex')

    if (passwordHash !== user.password_hash) {
      return { success: false, error: 'Invalid password' }
    }

    // Soft delete - mark as deleted instead of removing
    const { error } = await supabase
      .from('auth_users')
      .update({
        deleted_at: new Date().toISOString(),
        email: `deleted_${userId}@deleted.local`,
        phone: null,
        full_name: 'Deleted User',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('[v0] Error deleting account:', error)
      return { success: false, error: 'Failed to delete account' }
    }

    // Delete related data
    await supabase.from('payment_methods').delete().eq('user_id', userId)

    revalidatePath('/')
    return {
      success: true,
      data: { message: 'Account deleted successfully' },
    }
  } catch (error) {
    console.error('[v0] Unexpected error in deleteAccount:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
