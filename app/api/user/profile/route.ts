import { NextRequest, NextResponse } from 'next/server'
import { getUserProfile, updateUserProfile } from '@/lib/user-actions'
import { getRequestAuthUser, requireAuthenticatedUser, toPublicProfile } from '@/lib/supabase/request-auth'

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
    if (!result.success) {
      return NextResponse.json(result, { status: 404 })
    }

    const { user } = await getRequestAuthUser(request)
    if (user?.id === userId) {
      return NextResponse.json(result)
    }

    return NextResponse.json({ success: true, data: toPublicProfile(result.data) })
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
    const body = await request.json()
    const { userId, updates } = body

    if (!userId || !updates) {
      return NextResponse.json(
        { success: false, error: 'User ID and updates are required' },
        { status: 400 }
      )
    }

    const auth = await requireAuthenticatedUser(userId, request)

    // DEBUG: expose auth result so we can diagnose resets — remove after confirmed working
    const hasAuthHeader = !!request.headers.get('authorization')
    if (auth.response) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed', _debug: { userId, hasAuthHeader, authUserId: auth.user?.id ?? null } },
        { status: auth.response.status }
      )
    }

    const result = await updateUserProfile(userId, updates)

    // DEBUG: include metadata write result — remove after confirmed working
    return NextResponse.json({
      ...result,
      _debug: {
        authUserId: auth.user?.id,
        hasAuthHeader,
        updatesReceived: Object.keys(updates),
        websiteTheme: updates.website_theme,
        websiteLayout: updates.website_layout,
      },
    })
    if (auth.response) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: auth.response.status }
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
