'use server'

import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

type WebsiteTheme = 'emerald' | 'midnight' | 'sunset'
type WebsiteLayout = 'classic' | 'minimal' | 'bold'

function isWebsiteTheme(value: unknown): value is WebsiteTheme {
  return value === 'emerald' || value === 'midnight' || value === 'sunset'
}

function isWebsiteLayout(value: unknown): value is WebsiteLayout {
  return value === 'classic' || value === 'minimal' || value === 'bold'
}

async function getWebsitePreferencesFromAuthMetadata(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase.auth.admin.getUserById(userId)

  if (error) {
    return { website_theme: undefined, website_layout: undefined }
  }

  const metadata = data.user?.user_metadata || {}
  return {
    website_theme: isWebsiteTheme(metadata.website_theme) ? metadata.website_theme : undefined,
    website_layout: isWebsiteLayout(metadata.website_layout) ? metadata.website_layout : undefined,
  }
}

async function saveWebsitePreferencesToAuthMetadata(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  websiteTheme?: WebsiteTheme,
  websiteLayout?: WebsiteLayout,
) {
  if (websiteTheme === undefined && websiteLayout === undefined) {
    return
  }

  const { data } = await supabase.auth.admin.getUserById(userId)
  const currentMetadata = data.user?.user_metadata || {}

  await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...currentMetadata,
      ...(websiteTheme !== undefined ? { website_theme: websiteTheme } : {}),
      ...(websiteLayout !== undefined ? { website_layout: websiteLayout } : {}),
    },
  })
}

export async function getUserProfile(userId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('auth_users').select('*').eq('id', userId).single()
    if (error) throw error

    const metadataPrefs = await getWebsitePreferencesFromAuthMetadata(supabase, userId)

    return {
      success: true,
      data: {
        ...data,
        website_theme: data.website_theme || metadataPrefs.website_theme,
        website_layout: data.website_layout || metadataPrefs.website_layout,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string
    full_name?: string
    phone?: string
    address?: string
    business_name?: string
    business_description?: string
    business_category?: string
    city?: string
    state?: string
    location?: string
    email?: string
    website_theme?: WebsiteTheme
    website_layout?: WebsiteLayout
  }
) {
  try {
    const supabase = await createClient()

    const websiteTheme = updates.website_theme
    const websiteLayout = updates.website_layout
    const hasWebsiteOverrides = websiteTheme !== undefined || websiteLayout !== undefined

    const { data, error } = await supabase.from('auth_users').update(updates).eq('id', userId).select().single()

    if (!error) {
      await saveWebsitePreferencesToAuthMetadata(supabase, userId, websiteTheme, websiteLayout)

      return {
        success: true,
        data: {
          ...data,
          website_theme: data.website_theme || websiteTheme,
          website_layout: data.website_layout || websiteLayout,
        },
      }
    }

    const errorText = String(error.message || '').toLowerCase()
    const websiteColumnMissing =
      hasWebsiteOverrides
      && (errorText.includes('website_theme') || errorText.includes('website_layout'))
      && (errorText.includes('column') || errorText.includes('schema cache'))

    if (!websiteColumnMissing) {
      throw error
    }

    // Backward compatibility: allow profile save even when the DB has not yet added website preference columns.
    const { website_theme: _theme, website_layout: _layout, ...safeUpdates } = updates
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('auth_users')
      .update(safeUpdates)
      .eq('id', userId)
      .select()
      .single()

    if (fallbackError) {
      throw fallbackError
    }

    await saveWebsitePreferencesToAuthMetadata(supabase, userId, websiteTheme, websiteLayout)

    return {
      success: true,
      data: {
        ...fallbackData,
        website_theme: websiteTheme,
        website_layout: websiteLayout,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  try {
    const supabase = await createClient()
    const { data: user } = await supabase.from('auth_users').select('password_hash').eq('id', userId).single()
    if (!user || user.password_hash !== hashPassword(currentPassword)) return { success: false, error: 'Invalid current password' }
    
    const { error } = await supabase.from('auth_users').update({ password_hash: hashPassword(newPassword) }).eq('id', userId)
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateEmail(userId: string, newEmail: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('auth_users').update({ email: newEmail }).eq('id', userId)
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateNotificationPreferences(userId: string, preferences: any) {
  try {
    const supabase = await createClient()
    const payload = {
      email_notifications: Boolean(preferences?.email_notifications),
      push_notifications: Boolean(preferences?.push_notifications),
      sms_notifications: Boolean(preferences?.sms_notifications),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('auth_users')
      .update(payload)
      .eq('id', userId)
      .select('id, email_notifications, push_notifications, sms_notifications')
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteAccount(userId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('auth_users').delete().eq('id', userId)
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getPaymentMethods(userId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('payment_methods').select('*').eq('user_id', userId)
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function addPaymentMethod(userId: string, method: { type: string; details: any }) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('payment_methods').insert({ user_id: userId, ...method }).select().single()
    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function removePaymentMethod(userId: string, methodId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('payment_methods').delete().eq('id', methodId).eq('user_id', userId)
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function setDefaultPaymentMethod(userId: string, methodId: string) {
  try {
    const supabase = await createClient()
    await supabase.from('payment_methods').update({ is_default: false }).eq('user_id', userId)
    const { error } = await supabase.from('payment_methods').update({ is_default: true }).eq('id', methodId).eq('user_id', userId)
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
