import { createClient } from '@/lib/supabase/server'
import { createClient as createAnonClient } from '@supabase/supabase-js'

const INITIAL_MERCHANT_TOKENS = 100

/** Anon-key client — only used for signInWithPassword (no service-role needed) */
function getAnonClient() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function signup(email: string, password: string, name: string, phone: string, role: 'buyer' | 'merchant') {
  try {
    const admin = createClient()

    // Create user in Supabase Auth (handles hashing, no bcrypt needed)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, name },
    })

    if (authError) {
      if (authError.message?.toLowerCase().includes('already registered') || authError.message?.toLowerCase().includes('already exists')) {
        return { success: false, error: 'An account with this email already exists. Please try logging in instead.' }
      }
      return { success: false, error: 'Failed to create account. Please try again.' }
    }

    const supabaseUserId = authData.user.id
    const profileData = role === 'merchant'
      ? { id: supabaseUserId, email, password_hash: '', business_name: name, name, phone, role, token_balance: INITIAL_MERCHANT_TOKENS }
      : { id: supabaseUserId, email, password_hash: '', name, phone, role, token_balance: 0 }

    const { data, error } = await admin.from('auth_users').insert(profileData).select().single()

    if (error) {
      // Clean up orphaned auth user if profile insert fails
      await admin.auth.admin.deleteUser(supabaseUserId)
      return { success: false, error: 'Failed to create account. Please try again.' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Signup error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function signupEnhanced(params: {
  email: string
  password: string
  name: string
  phone: string
  role: 'buyer' | 'merchant'
  smedanId?: string
  cacId?: string
}) {
  try {
    const admin = createClient()
    const { email, password, name, phone, role, smedanId, cacId } = params

    // Create in Supabase Auth
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, name },
    })

    if (authError) {
      if (authError.message?.toLowerCase().includes('already registered') || authError.message?.toLowerCase().includes('already exists')) {
        return { success: false, error: 'An account with this email already exists. Please try logging in instead.' }
      }
      return { success: false, error: 'Failed to create account. Please try again.' }
    }

    const supabaseUserId = authData.user.id
    const baseData = role === 'merchant'
      ? {
          id: supabaseUserId,
          email,
          password_hash: '',
          business_name: name,
          name,
          phone,
          role,
          smedan_id: smedanId || null,
          cac_id: cacId || null,
          token_balance: INITIAL_MERCHANT_TOKENS,
        }
      : {
          id: supabaseUserId,
          email,
          password_hash: '',
          name,
          phone,
          role,
          token_balance: 0,
        }

    let { data, error } = await admin.from('auth_users').insert(baseData as any).select().single()

    // Fallback for environments where cac_id column is not yet migrated.
    if (error && String(error.message || '').toLowerCase().includes('cac_id')) {
      const { cac_id, ...withoutCac } = baseData as any
      const fallback = await admin.from('auth_users').insert(withoutCac).select().single()
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      await admin.auth.admin.deleteUser(supabaseUserId)
      return { success: false, error: 'Failed to create account. Please try again.' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Signup error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function loginWithGoogle(params: {
  email: string
  name: string
  role: 'buyer' | 'merchant'
  googleId: string
}) {
  try {
    const admin = createClient()
    const { email, name, role, googleId } = params

    // Check if a profile already exists for this email
    const { data: existing, error: existingError } = await admin
      .from('auth_users')
      .select('*')
      .eq('email', email)
      .single()

    if (!existingError && existing) {
      if (existing.role !== role) {
        return {
          success: false,
          error: `This Google account is already linked as ${existing.role}. Please use the ${existing.role} portal.`,
        }
      }
      // Update google_id on profile
      const { data: updated } = await admin
        .from('auth_users')
        .update({ google_id: googleId, updated_at: new Date().toISOString() } as any)
        .eq('id', existing.id)
        .select('*')
        .single()

      return { success: true, data: { user: updated || existing } }
    }

    // New user via Google — create Supabase Auth user with a random password
    const randomPassword = crypto.randomUUID() + crypto.randomUUID()
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { role, name, google_id: googleId },
    })

    if (authError) {
      return { success: false, error: 'Failed to sign in with Google.' }
    }

    const supabaseUserId = authData.user.id
    const insertPayload = role === 'merchant'
      ? {
          id: supabaseUserId,
          email,
          name,
          business_name: name,
          phone: null,
          role,
          password_hash: '',
          google_id: googleId,
          token_balance: INITIAL_MERCHANT_TOKENS,
        }
      : {
          id: supabaseUserId,
          email,
          name,
          phone: null,
          role,
          password_hash: '',
          google_id: googleId,
          token_balance: 0,
        }

    let { data, error } = await admin.from('auth_users').insert(insertPayload as any).select('*').single()

    if (error && String(error.message || '').toLowerCase().includes('google_id')) {
      const { google_id, ...withoutGoogle } = insertPayload as any
      const fallback = await admin.from('auth_users').insert(withoutGoogle).select('*').single()
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      await admin.auth.admin.deleteUser(supabaseUserId)
      return { success: false, error: 'Failed to sign in with Google.' }
    }

    return { success: true, data: { user: data } }
  } catch (error) {
    console.error('Google auth error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function login(email: string, password: string) {
  try {
    // Use anon client — signInWithPassword does not require service role
    const supabase = getAnonClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !authData.user) {
      return { success: false, error: 'Invalid email or password.' }
    }

    // Fetch the profile row
    const admin = createClient()
    const { data: profile, error: profileError } = await admin
      .from('auth_users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      return { success: false, error: 'User profile not found.' }
    }

    const { password_hash, ...userData } = profile
    return {
      success: true,
      data: {
        user: userData,
        // Include session so client can call supabase.auth.setSession()
        session: authData.session,
      },
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function getUserById(userId: string) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('auth_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      return { success: false, error: 'User not found.' }
    }

    const { password_hash, ...userData } = data
    return { success: true, data: userData }
  } catch (error) {
    console.error('Get user error:', error)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

export async function logout() {
  return { success: true }
}