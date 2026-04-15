import { NextRequest, NextResponse } from 'next/server'
import { getConversationMessages, markConversationAsRead } from '@/lib/message-actions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    if (userId) {
      await markConversationAsRead(conversationId, userId)
    }

    const result = await getConversationMessages(conversationId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get conversation messages API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
