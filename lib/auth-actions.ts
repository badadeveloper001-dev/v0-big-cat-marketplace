import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcrypt'

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export async function signup(email: string, password: string, name: string, phone: string, role: 'buyer' | 'merchant') {
  try {
    const supabase = createClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('auth_users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return { success: false, error: 'An account with this email already exists. Please try logging in instead.' }
    }

    // Hash password
    const passwordHash = hashPassword(password)

    // Create user
    const userData = role === 'merchant'
      ? { email, password_hash: passwordHash, business_name: name, phone, role }
      : { email, password_hash: passwordHash, name, phone, role }

    const { data, error } = await supabase
      .from('auth_users')
      .insert(userData)
      .select()
      .single()

    if (error) {
      console.error('Signup error:', error)
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
    const supabase = createClient()
    const { email, password, name, phone, role, smedanId, cacId } = params

    const { data: existingUser } = await supabase
      .from('auth_users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return { success: false, error: 'An account with this email already exists. Please try logging in instead.' }
    }

    const passwordHash = hashPassword(password)
    const baseData = role === 'merchant'
      ? {
          email,
          password_hash: passwordHash,
          business_name: name,
          name,
          phone,
          role,
          smedan_id: smedanId || null,
          cac_id: cacId || null,
        }
      : {
          email,
          password_hash: passwordHash,
          name,
          phone,
          role,
        }

    let { data, error } = await supabase
      .from('auth_users')
      .insert(baseData as any)
      .select()
      .single()

    // Fallback for environments where cac_id column is not yet migrated.
    if (error && String(error.message || '').toLowerCase().includes('cac_id')) {
      const { cac_id, ...withoutCac } = baseData as any
      const fallback = await supabase
        .from('auth_users')
        .insert(withoutCac)
        .select()
        .single()
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error('Signup error:', error)
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
    const supabase = createClient()
    const { email, name, role, googleId } = params

    const { data: existing, error: existingError } = await supabase
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

      const { data: updated } = await supabase
        .from('auth_users')
        .update({ google_id: googleId, updated_at: new Date().toISOString() } as any)
        .eq('id', existing.id)
        .select('*')
        .single()

      return { success: true, data: { user: updated || existing } }
    }

    const insertPayload = role === 'merchant'
      ? {
          email,
          name,
          business_name: name,
          phone: null,
          role,
          password_hash: '',
          google_id: googleId,
        }
      : {
          email,
          name,
          phone: null,
          role,
          password_hash: '',
          google_id: googleId,
        }

    let { data, error } = await supabase
      .from('auth_users')
      .insert(insertPayload as any)
      .select('*')
      .single()

    // Fallback for environments without google_id column.
    if (error && String(error.message || '').toLowerCase().includes('google_id')) {
      const { google_id, ...withoutGoogle } = insertPayload as any
      const fallback = await supabase
        .from('auth_users')
        .insert(withoutGoogle)
        .select('*')
        .single()
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error('Google auth error:', error)
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
    const supabase = createClient()

    // Get user by email
    const { data: user, error } = await supabase
      .from('auth_users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return { success: false, error: 'Invalid email or password.' }
    }

    // Verify password
    if (!verifyPassword(password, user.password_hash)) {
      return { success: false, error: 'Invalid email or password.' }
    }

    // Return user data (excluding password hash)
    const { password_hash, ...userData } = user
    return { success: true, data: { user: userData } }
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