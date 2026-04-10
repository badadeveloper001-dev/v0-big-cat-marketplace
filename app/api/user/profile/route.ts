import { NextRequest, NextResponse } from 'next/server'
import { getUserProfile, updateUserProfile } from '@/lib/user-actions'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const result = await getUserProfile(userId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get user profile API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, updates } = await request.json()

    if (!userId || !updates) {
      return NextResponse.json(
        { success: false, error: 'User ID and updates are required' },
        { status: 400 }
      )
    }

    const result = await updateUserProfile(userId, updates)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Update user profile API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
