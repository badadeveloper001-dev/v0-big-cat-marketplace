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