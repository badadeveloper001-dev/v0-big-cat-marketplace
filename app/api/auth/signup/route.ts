import { NextRequest, NextResponse } from 'next/server'
import { signup } from '@/lib/auth-actions'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone, role } = await request.json()

    if (!email || !password || !name || !phone || !role) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      )
    }

    const result = await signup(email, password, name, phone, role as 'buyer' | 'merchant')

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}