import { NextRequest, NextResponse } from 'next/server'
import { sendMessage } from '@/lib/message-actions'

export async function POST(request: NextRequest) {
  try {
    const { conversationId, senderId, content } = await request.json()

    if (!conversationId || !senderId || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID, sender ID, and content are required' },
        { status: 400 }
      )
    }

    const result = await sendMessage(conversationId, senderId, content.trim())
    return NextResponse.json(result)
  } catch (error) {
    console.error('Send message API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
