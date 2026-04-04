'use server'

// Force rebuild - Fixed Supabase imports
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import { revalidatePath } from 'next/cache'

interface AuthResponse {
  success: boolean
  error?: string
  data?: any
}

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

/**
 * Generate and send OTP for email verification
 */
export async function generateOTP(email: string): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' }
    }

    const supabase = await createClient()

    // Check if email already registered
    const { data: existingUser } = await supabase
      .from('auth_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return { success: false, error: 'Email already registered' }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Store OTP in database
    const { error: insertError } = await supabase
      .from('otp_verification')
      .insert({
        email: email.toLowerCase(),
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
      })

    if (insertError) {
      return { success: false, error: 'Failed to generate OTP' }
    }

    // In production, send via email service (SendGrid, etc.)
    // For demo, return OTP in response
    console.log(`[v0] OTP for ${email}: ${otp}`)

    return {
      success: true,
      data: {
        message: 'OTP sent to your email',
        // Demo only - always return OTP for testing
        otp: otp,
      },
    }
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(email: string, otpCode: string): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' }
    }

    if (!otpCode || otpCode.length !== 6) {
      return { success: false, error: 'Invalid OTP format' }
    }

    const supabase = await createClient()

    // Find OTP record
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_verification')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp_code', otpCode)
      .single()

    if (fetchError || !otpRecord) {
      // Increment attempts
      await supabase
        .from('otp_verification')
        .update({ attempts: (otpRecord?.attempts || 0) + 1 })
        .eq('email', email.toLowerCase())

      return { success: false, error: 'Invalid OTP code' }
    }

    // Check if expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      return { success: false, error: 'OTP has expired. Please request a new one.' }
    }

    // Check if max attempts exceeded (5 attempts)
    if (otpRecord.attempts >= 5) {
      return { success: false, error: 'Too many failed attempts. Please request a new OTP.' }
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from('otp_verification')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', otpRecord.id)

    if (updateError) {
      return { success: false, error: 'Failed to verify OTP' }
    }

    return { success: true, data: { message: 'Email verified successfully' } }
  } catch (error) {
    // console.error('[v0] Unexpected error in verifyOTP:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Resend OTP code
 */
export async function resendOTP(email: string): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' }
    }

    const supabase = await createClient()

    // Delete old OTP records for this email
    await supabase
      .from('otp_verification')
      .delete()
      .eq('email', email.toLowerCase())

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    const { error } = await supabase
      .from('otp_verification')
      .insert({
        email: email.toLowerCase(),
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
      })

    if (error) {
      return { success: false, error: 'Failed to resend OTP' }
    }

    console.log(`[v0] OTP for ${email}: ${otp}`)

    return {
      success: true,
      data: {
        message: 'OTP sent to your email',
        // Demo only - always return OTP for testing
        otp: otp,
      },
    }
  } catch (error) {
    // console.error('[v0] Unexpected error in resendOTP:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
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
      // console.error('[v0] Buyer signup error:', createError)
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
    // console.error('[v0] Unexpected error in buyerSignup:', error)
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
      // console.error('[v0] Buyer signup error:', createError)
      // console.error('[v0] Error details:', createError.message, createError.code)
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
    // console.error('[v0] Unexpected error in buyerSignupWithName:', error)
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
      // console.error('[v0] Merchant signup error:', createUserError)
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
    // console.error('[v0] Unexpected error in merchantSignup:', error)
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
    // console.error('[v0] Unexpected error in emailPasswordLogin:', error)
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
    // console.error('[v0] Unexpected error in getCurrentUser:', error)
    return { success: false, error: 'Failed to fetch user' }
  }
}

/**
 * Request password reset - generates a reset token
 */
export async function requestPasswordReset(email: string): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' }
    }

    const supabase = await createClient()

    // Check if user exists
    const { data: user } = await supabase
      .from('auth_users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single()

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return { success: true }
    }

    // Generate a simple reset token (6 digits for simplicity)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString()
    const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Store token in database
    const { error } = await supabase
      .from('auth_users')
      .update({
        reset_token: resetToken,
        reset_token_expires: tokenExpiry.toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      // console.error('[v0] Error storing reset token:', error)
      return { success: false, error: 'Failed to process request' }
    }

    // In production, send email with reset token
    // For now, we'll return the token (in real app, this would be sent via email)
    console.log(`[v0] Password reset token for ${email}: ${resetToken}`)
    
    return { 
      success: true, 
      data: { 
        message: 'If an account exists with this email, you will receive reset instructions.',
        // Remove this in production - only for demo purposes
        resetToken 
      } 
    }
  } catch (error) {
    // console.error('[v0] Unexpected error in requestPasswordReset:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Verify reset token and update password
 */
export async function resetPassword(
  email: string,
  token: string,
  newPassword: string
): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' }
    }

    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.message }
    }

    const supabase = await createClient()

    // Find user with valid token
    const { data: user } = await supabase
      .from('auth_users')
      .select('id, reset_token, reset_token_expires')
      .eq('email', email.toLowerCase())
      .single()

    if (!user) {
      return { success: false, error: 'Invalid email or token' }
    }

    // Verify token
    if (user.reset_token !== token) {
      return { success: false, error: 'Invalid reset code' }
    }

    // Check expiry
    if (new Date(user.reset_token_expires) < new Date()) {
      return { success: false, error: 'Reset code has expired. Please request a new one.' }
    }

    // Update password and clear reset token
    const newPasswordHash = hashPassword(newPassword)
    const { error } = await supabase
      .from('auth_users')
      .update({
        password_hash: newPasswordHash,
        reset_token: null,
        reset_token_expires: null,
      })
      .eq('id', user.id)

    if (error) {
      // console.error('[v0] Error updating password:', error)
      return { success: false, error: 'Failed to update password' }
    }

    return { success: true, data: { message: 'Password updated successfully' } }
  } catch (error) {
    // console.error('[v0] Unexpected error in resetPassword:', error)
    return { success: false, error: 'An unexpected error occurred' }
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
      // console.error('[v0] Logout error:', error)
      return { success: false, error: 'Failed to logout' }
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    // console.error('[v0] Unexpected error in logout:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
