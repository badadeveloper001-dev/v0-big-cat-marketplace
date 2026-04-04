'use server'

import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import { revalidatePath } from 'next/cache'

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export async function buyerSignup(email: string, password: string, name?: string) {
  try {
    if (!validateEmail(email)) return { success: false, error: 'Invalid email' }
    if (!password || password.length < 6) return { success: false, error: 'Password must be 6+ characters' }

    const supabase = await createClient()
    const passwordHash = createHash('sha256').update(password).digest('hex')

    const { data, error } = await supabase
      .from('auth_users')
      .insert({ email: email.toLowerCase(), password_hash: passwordHash, name, role: 'buyer' })
      .select()
      .single()

    if (error) return { success: false, error: 'Email already registered' }

    revalidatePath('/')
    return { success: true, data: { userId: data.id, email: data.email, role: data.role } }
  } catch (err) {
    return { success: false, error: 'Signup failed' }
  }
}

export async function merchantSignup(email: string, password: string, businessName?: string) {
  try {
    if (!validateEmail(email)) return { success: false, error: 'Invalid email' }
    if (!password || password.length < 6) return { success: false, error: 'Password must be 6+ characters' }

    const supabase = await createClient()
    const passwordHash = createHash('sha256').update(password).digest('hex')

    const { data, error } = await supabase
      .from('auth_users')
      .insert({ email: email.toLowerCase(), password_hash: passwordHash, business_name: businessName, role: 'merchant' })
      .select()
      .single()

    if (error) return { success: false, error: 'Email already registered' }

    revalidatePath('/')
    return { success: true, data: { userId: data.id, email: data.email, role: data.role } }
  } catch (err) {
    return { success: false, error: 'Signup failed' }
  }
}

export async function login(email: string, password: string) {
  try {
    if (!validateEmail(email)) return { success: false, error: 'Invalid email' }
    if (!password) return { success: false, error: 'Password required' }

    const supabase = await createClient()
    const passwordHash = createHash('sha256').update(password).digest('hex')

    const { data, error } = await supabase
      .from('auth_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('password_hash', passwordHash)
      .single()

    if (error || !data) return { success: false, error: 'Invalid email or password' }

    revalidatePath('/')
    return { success: true, data: { user: data } }
  } catch (err) {
    return { success: false, error: 'Login failed' }
  }
}

export async function logout() {
  try {
    revalidatePath('/')
    return { success: true, data: { message: 'Logged out' } }
  } catch (err) {
    return { success: false, error: 'Logout failed' }
  }
}

export async function emailPasswordLogin(email: string, password: string) {
  return login(email, password)
}

export async function buyerSignupWithName(email: string, password: string, name: string) {
  return buyerSignup(email, password, name)
}

export async function requestPasswordReset(email: string) {
  try {
    if (!validateEmail(email)) return { success: false, error: 'Invalid email' }

    const supabase = await createClient()
    const { data } = await supabase.from('auth_users').select('id').eq('email', email.toLowerCase()).single()

    if (!data) return { success: false, error: 'Email not found' }

    return { success: true, data: { message: 'Password reset sent' } }
  } catch (err) {
    return { success: false, error: 'Request failed' }
  }
}

export async function resetPassword(email: string, newPassword: string) {
  try {
    if (!validateEmail(email)) return { success: false, error: 'Invalid email' }
    if (!newPassword || newPassword.length < 6) return { success: false, error: 'Password must be 6+ characters' }

    const supabase = await createClient()
    const passwordHash = createHash('sha256').update(newPassword).digest('hex')

    const { error } = await supabase
      .from('auth_users')
      .update({ password_hash: passwordHash })
      .eq('email', email.toLowerCase())

    if (error) return { success: false, error: 'Reset failed' }

    revalidatePath('/')
    return { success: true, data: { message: 'Password reset success' } }
  } catch (err) {
    return { success: false, error: 'Reset failed' }
  }
}

export async function getUserById(userId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('auth_users').select('*').eq('id', userId).single()

    if (error) return { success: false, error: 'User not found' }

    return { success: true, data: { user: data } }
  } catch (err) {
    return { success: false, error: 'Failed to fetch user' }
  }
}
