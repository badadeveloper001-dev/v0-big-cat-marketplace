'use server'

import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import { revalidatePath } from 'next/cache'

// Validation utilities
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

function validatePhone(phone: string): boolean {
  // Basic phone validation - at least 10 digits
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/
  return phoneRegex.test(phone)
}

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  return { valid: true }
}

function validateSmedanId(smedanId: string): boolean {
  // SMEDAN ID validation - accept various formats
  // Can be alphanumeric with slashes, dashes, etc.
  const smedanRegex = /^[A-Z0-9\-\/]{5,}$/
  return smedanRegex.test(smedanId.toUpperCase()) && smedanId.trim().length >= 5
}

// Hash password using SHA-256 (in production, use bcrypt from 'bcrypt' package for better security)
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

interface AuthResponse {
  success: boolean
  error?: string
  data?: any
}

/**
 * Buyer signup
 */
export async function buyerSignup(
  email: string,
  phone: string,
  password: string,
): Promise<AuthResponse> {
  try {
    // Validate inputs
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' }
    }

    if (!validatePhone(phone)) {
      return { success: false, error: 'Invalid phone number' }
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.message }
    }

    const supabase = await createClient()

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('auth_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return { success: false, error: 'Email already registered' }
    }

    // Hash password
    const passwordHash = hashPassword(password)

    // Create user in auth_users table
    const { data: newUser, error: createError } = await supabase
      .from('auth_users')
      .insert({
        email: email.toLowerCase(),
        phone,
        password_hash: passwordHash,
        role: 'buyer',
      })
      .select()
      .single()

    if (createError) {
      console.error('[v0] Buyer signup error:', createError)
      return { success: false, error: 'Failed to create account' }
    }

    // Revalidate and return
    revalidatePath('/')
    return {
      success: true,
      data: {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    }
  } catch (error) {
    console.error('[v0] Unexpected error in buyerSignup:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Buyer signup with name
 */
export async function buyerSignupWithName(
  email: string,
  phone: string,
  password: string,
  name: string,
): Promise<AuthResponse> {
  try {
    // Validate inputs
    if (!name || name.trim().length < 2) {
      return { success: false, error: 'Please enter a valid name' }
    }

    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' }
    }

    if (!validatePhone(phone)) {
      return { success: false, error: 'Invalid phone number' }
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.message }
    }

    const supabase = await createClient()

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('auth_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return { success: false, error: 'Email already registered' }
    }

    // Hash password
    const passwordHash = hashPassword(password)

    // Create user in auth_users table
    const { data: newUser, error: createError } = await supabase
      .from('auth_users')
      .insert({
        email: email.toLowerCase(),
        phone,
        password_hash: passwordHash,
        role: 'buyer',
        full_name: name.trim(),
      })
      .select()
      .single()

    if (createError) {
      console.error('[v0] Buyer signup error:', createError)
      console.error('[v0] Error details:', createError.message, createError.code)
      return { success: false, error: `Failed to create account: ${createError.message}` }
    }

    // Revalidate and return
    revalidatePath('/')
    return {
      success: true,
      data: {
        userId: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        name: newUser.full_name,
        role: newUser.role,
      },
    }
  } catch (error) {
    console.error('[v0] Unexpected error in buyerSignupWithName:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Merchant signup with profile creation
 */
export async function merchantSignup(
  email: string,
  phone: string,
  password: string,
  smedanId: string,
): Promise<AuthResponse> {
  try {
    // Validate inputs
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' }
    }

    if (!validatePhone(phone)) {
      return { success: false, error: 'Invalid phone number' }
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.message }
    }

    if (!validateSmedanId(smedanId)) {
      return { success: false, error: 'Invalid SMEDAN ID format' }
    }

    const supabase = await createClient()

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('auth_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return { success: false, error: 'Email already registered' }
    }

    // Skip SMEDAN check during signup - will validate during setup when profile is created

    // Hash password
    const passwordHash = hashPassword(password)

    // Create user with smedan_id stored directly in auth_users
    const { data: newUser, error: createUserError } = await supabase
      .from('auth_users')
      .insert({
        email: email.toLowerCase(),
        phone,
        password_hash: passwordHash,
        role: 'merchant',
        smedan_id: smedanId.toUpperCase(),
        setup_completed: false,
      })
      .select()
      .single()

    if (createUserError) {
      console.error('[v0] Merchant signup error:', createUserError)
      return { success: false, error: 'Failed to create account' }
    }

    revalidatePath('/')
    return {
      success: true,
      data: {
        userId: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        merchantProfile: {
          id: newUser.id,
          user_id: newUser.id,
          smedan_id: newUser.smedan_id,
          business_name: null,
          setup_completed: false,
        },
      },
    }
  } catch (error) {
    console.error('[v0] Unexpected error in merchantSignup:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Login with email and password
 */
export async function emailPasswordLogin(
  email: string,
  password: string,
): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' }
    }

    if (!password) {
      return { success: false, error: 'Password is required' }
    }

    const supabase = await createClient()

    // Find user by email
    const { data: user, error: fetchError } = await supabase
      .from('auth_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (fetchError || !user) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Verify password
    const passwordHash = hashPassword(password)
    if (passwordHash !== user.password_hash) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Build merchant profile from auth_users fields if merchant
    let merchantProfile = null
    if (user.role === 'merchant') {
      merchantProfile = {
        id: user.id,
        user_id: user.id,
        smedan_id: user.smedan_id || '',
        business_name: user.business_name || null,
        business_description: user.business_description || null,
        category: user.business_category || null,
        location: user.business_location || null,
        logo_url: user.logo_url || null,
        setup_completed: user.setup_completed || false,
      }
    }

    revalidatePath('/')
    return {
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        name: user.full_name,
        merchantProfile,
      },
    }
  } catch (error) {
    console.error('[v0] Unexpected error in emailPasswordLogin:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get current user session
 */
export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    const supabase = await createClient()

    // Try to get current user from Supabase session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No active session' }
    }

    // Fetch user details from auth_users table
    const { data: authUser, error } = await supabase
      .from('auth_users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !authUser) {
      return { success: false, error: 'User not found' }
    }

    // Build merchant profile from auth_users fields if merchant
    let merchantProfile = null
    if (authUser.role === 'merchant') {
      merchantProfile = {
        id: authUser.id,
        user_id: authUser.id,
        smedan_id: authUser.smedan_id || '',
        business_name: authUser.business_name || null,
        business_description: authUser.business_description || null,
        category: authUser.business_category || null,
        location: authUser.business_location || null,
        logo_url: authUser.logo_url || null,
        setup_completed: authUser.setup_completed || false,
      }
    }

    return {
      success: true,
      data: {
        userId: authUser.id,
        email: authUser.email,
        role: authUser.role,
        name: authUser.full_name,
        merchantProfile,
      },
    }
  } catch (error) {
    console.error('[v0] Unexpected error in getCurrentUser:', error)
    return { success: false, error: 'Failed to fetch user' }
  }
}

/**
 * Logout
 */
export async function logout(): Promise<AuthResponse> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[v0] Logout error:', error)
      return { success: false, error: 'Failed to logout' }
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('[v0] Unexpected error in logout:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
