'use server'

import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import bcrypt from 'bcrypt'

export async function buyerSignup(email: string, password: string, name: string, phone: string) {
  try {
    const supabase = await createClient()
    
    const passwordHash = await bcrypt.hash(password, 10)
    
    const { data, error } = await supabase
      .from('auth_users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        phone,
        role: 'buyer'
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function merchantSignup(email: string, password: string, businessName: string, phone: string) {
  try {
    const supabase = await createClient()
    
    const passwordHash = await bcrypt.hash(password, 10)
    
    const { data, error } = await supabase
      .from('auth_users')
      .insert({
        email,
        password_hash: passwordHash,
        business_name: businessName,
        phone,
        role: 'merchant'
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function emailPasswordLogin(email: string, password: string) {
  try {
    const supabase = await createClient()
    
    const { data: user, error: userError } = await supabase
      .from('auth_users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return { success: false, error: 'Invalid password' }
    }

    return { success: true, data: { user } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function logout() {
  return { success: true }
}

export async function buyerSignupWithName(email: string, password: string, name: string, phone: string) {
  return buyerSignup(email, password, name, phone)
}

export async function requestPasswordReset(email: string) {
  return { success: true }
}

export async function resetPassword(email: string, newPassword: string) {
  try {
    const supabase = await createClient()
    
    const passwordHash = await bcrypt.hash(newPassword, 10)
    
    const { error } = await supabase
      .from('auth_users')
      .update({ password_hash: passwordHash })
      .eq('email', email)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getUserById(userId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('auth_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
