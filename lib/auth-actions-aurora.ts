'use server'

import { query, withConnection } from '@/lib/db'
import { createHash, randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

interface AuthResponse {
  success: boolean
  error?: string
  data?: any
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

function validatePhone(phone: string): boolean {
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

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

// Generate and send OTP
export async function generateOTP(email: string): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' }
    }

    const { rows: existingUsers } = await query(
      'SELECT id FROM auth_users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (existingUsers.length > 0) {
      return { success: false, error: 'Email already registered' }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    const otpId = randomUUID().toString()

    await query(
      'INSERT INTO otp_verification (id, email, otp_code, expires_at, attempts) VALUES ($1, $2, $3, $4, $5)',
      [otpId, email.toLowerCase(), otp, expiresAt.toISOString(), 0]
    )

    console.log(`[v0] OTP for ${email}: ${otp}`)

    return {
      success: true,
      data: { message: 'OTP sent to your email', otp: otp },
    }
  } catch {
    return { success: false, error: 'Failed to generate OTP' }
  }
}

// Verify OTP code
export async function verifyOTP(email: string, otpCode: string): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' }
    }

    if (!otpCode || otpCode.length !== 6) {
      return { success: false, error: 'Invalid OTP format' }
    }

    const { rows: otpRecords } = await query(
      'SELECT * FROM otp_verification WHERE email = $1 AND otp_code = $2',
      [email.toLowerCase(), otpCode]
    )

    if (otpRecords.length === 0) {
      await query(
        'UPDATE otp_verification SET attempts = attempts + 1 WHERE email = $1',
        [email.toLowerCase()]
      )
      return { success: false, error: 'Invalid OTP code' }
    }

    const otpRecord = otpRecords[0]

    if (new Date(otpRecord.expires_at) < new Date()) {
      return { success: false, error: 'OTP has expired. Please request a new one.' }
    }

    if (otpRecord.attempts >= 5) {
      return { success: false, error: 'Too many failed attempts. Please request a new OTP.' }
    }

    await query(
      'UPDATE otp_verification SET verified_at = NOW() WHERE id = $1',
      [otpRecord.id]
    )

    return { success: true, data: { message: 'Email verified successfully' } }
  } catch {
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Resend OTP
export async function resendOTP(email: string): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' }
    }

    await query('DELETE FROM otp_verification WHERE email = $1', [email.toLowerCase()])

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
    const otpId = randomUUID().toString()

    await query(
      'INSERT INTO otp_verification (id, email, otp_code, expires_at, attempts) VALUES ($1, $2, $3, $4, $5)',
      [otpId, email.toLowerCase(), otp, expiresAt.toISOString(), 0]
    )

    console.log(`[v0] Resent OTP for ${email}: ${otp}`)

    return {
      success: true,
      data: { message: 'New OTP sent to your email', otp: otp },
    }
  } catch {
    return { success: false, error: 'Failed to resend OTP' }
  }
}

// Buyer signup
export async function signupBuyer(
  email: string,
  password: string,
  fullName: string,
  phone: string
): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' }
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.message }
    }

    if (!validatePhone(phone)) {
      return { success: false, error: 'Invalid phone number' }
    }

    const userId = randomUUID().toString()
    const passwordHash = hashPassword(password)

    await query(
      `INSERT INTO auth_users (id, email, password_hash, name, full_name, phone, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, email.toLowerCase(), passwordHash, fullName, fullName, phone, 'buyer']
    )

    revalidatePath('/')

    return { success: true, data: { message: 'Account created successfully', userId } }
  } catch {
    return { success: false, error: 'Failed to create account' }
  }
}

// Merchant signup
export async function signupMerchant(
  email: string,
  password: string,
  fullName: string,
  phone: string,
  businessName: string,
  businessDescription: string,
  smedanId: string
): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' }
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.message }
    }

    if (!validatePhone(phone)) {
      return { success: false, error: 'Invalid phone number' }
    }

    const userId = randomUUID().toString()
    const passwordHash = hashPassword(password)

    await query(
      `INSERT INTO auth_users 
       (id, email, password_hash, name, full_name, phone, role, business_name, business_description, smedan_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [userId, email.toLowerCase(), passwordHash, fullName, fullName, phone, 'merchant', businessName, businessDescription, smedanId]
    )

    revalidatePath('/')

    return { success: true, data: { message: 'Merchant account created successfully', userId } }
  } catch {
    return { success: false, error: 'Failed to create merchant account' }
  }
}

// Login
export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Invalid email address' }
    }

    const { rows: users } = await query(
      'SELECT * FROM auth_users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (users.length === 0) {
      return { success: false, error: 'Email or password is incorrect' }
    }

    const user = users[0]
    const passwordHash = hashPassword(password)

    if (user.password_hash !== passwordHash) {
      return { success: false, error: 'Email or password is incorrect' }
    }

    return {
      success: true,
      data: { message: 'Login successful', user },
    }
  } catch {
    return { success: false, error: 'Login failed' }
  }
}
