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

    const { data: updatedUser, error } = await supabase
      .from('auth_users')
      .update({
        full_name: updates.full_name,
        phone: updates.phone,
        address: updates.address,
        avatar_url: updates.avatar_url,
        updated_at: new Date().toISOString(),
      })
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
