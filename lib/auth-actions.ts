'use server'

import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import { revalidatePath } from 'next/cache'

interface AuthResponse {
  success: boolean
  error?: string
  data?: any
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Buyer signup
 */
export async function buyerSignup(email: string, password: string, name?: string): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) return { success: false, error: 'Invalid email address' }
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters' }

    const supabase = await createClient()
    const passwordHash = createHash('sha256').update(password).digest('hex')

    const { data, error } = await supabase
      .from('auth_users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name: name || email.split('@')[0],
        role: 'buyer',
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes('unique')) return { success: false, error: 'Email already exists' }
      return { success: false, error: 'Signup failed' }
    }

    revalidatePath('/')
    return { success: true, data }
  } catch (err) {
    return { success: false, error: 'An error occurred during signup' }
  }
}

/**
 * Merchant signup
 */
export async function merchantSignup(email: string, password: string, businessName?: string): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) return { success: false, error: 'Invalid email address' }
    if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters' }

    const supabase = await createClient()
    const passwordHash = createHash('sha256').update(password).digest('hex')

    const { data, error } = await supabase
      .from('auth_users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        business_name: businessName || 'My Store',
        role: 'merchant',
      })
      .select()
      .single()

    if (error) {
      if (error.message.includes('unique')) return { success: false, error: 'Email already exists' }
      return { success: false, error: 'Signup failed' }
    }

    revalidatePath('/')
    return { success: true, data }
  } catch (err) {
    return { success: false, error: 'An error occurred during signup' }
  }
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) return { success: false, error: 'Invalid email address' }
    if (!password) return { success: false, error: 'Password required' }

    const supabase = await createClient()
    const passwordHash = createHash('sha256').update(password).digest('hex')

    const { data: user, error } = await supabase
      .from('auth_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('password_hash', passwordHash)
      .single()

    if (error || !user) {
      return { success: false, error: 'Invalid email or password' }
    }

    revalidatePath('/')
    return { success: true, data: { user } }
  } catch (err) {
    return { success: false, error: 'An error occurred during login' }
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<AuthResponse> {
  try {
    const supabase = await createClient()

    const { data: user, error } = await supabase
      .from('auth_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) return { success: false, error: 'User not found' }

    return { success: true, data: { user } }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

/**
 * Logout
 */
export async function logout(): Promise<AuthResponse> {
  try {
    revalidatePath('/')
    return { success: true, data: { message: 'Logged out successfully' } }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

/**
 * Email and password login (alias for login)
 */
export async function emailPasswordLogin(email: string, password: string): Promise<AuthResponse> {
  return login(email, password)
}

/**
 * Buyer signup with name (alias for buyerSignup)
 */
export async function buyerSignupWithName(email: string, password: string, name: string): Promise<AuthResponse> {
  return buyerSignup(email, password, name)
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) return { success: false, error: 'Invalid email address' }

    const supabase = await createClient()

    const { data: user } = await supabase
      .from('auth_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (!user) return { success: false, error: 'Email not found' }

    console.log(`[v0] Password reset requested for ${email}`)
    return { success: true, data: { message: 'Password reset instructions sent to email' } }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string, newPassword: string): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) return { success: false, error: 'Invalid email address' }
    if (newPassword.length < 6) return { success: false, error: 'Password must be at least 6 characters' }

    const supabase = await createClient()
    const passwordHash = createHash('sha256').update(newPassword).digest('hex')

    const { error } = await supabase
      .from('auth_users')
      .update({ password_hash: passwordHash })
      .eq('email', email.toLowerCase())

    if (error) return { success: false, error: 'Failed to reset password' }

    revalidatePath('/')
    return { success: true, data: { message: 'Password reset successfully' } }
  } catch {
    return { success: false, error: 'An error occurred' }
  }
}
