'use server'

import { query } from '@/lib/db'
import { randomUUID } from 'crypto'

interface MessageResponse {
  success: boolean
  error?: string
  data?: any
}

export async function createConversation(
  buyerId: string,
  merchantId: string
): Promise<MessageResponse> {
  try {
    const conversationId = randomUUID().toString()

    const { rows } = await query(
      `INSERT INTO conversations (id, buyer_id, merchant_id) VALUES ($1, $2, $3)
       ON CONFLICT (buyer_id, merchant_id) DO UPDATE SET last_message_at = NOW()
       RETURNING *`,
      [conversationId, buyerId, merchantId]
    )

    return { success: true, data: rows[0] }
  } catch {
    return { success: false, error: 'Failed to create conversation' }
  }
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<MessageResponse> {
  try {
    const messageId = randomUUID().toString()

    const { rows } = await query(
      `INSERT INTO messages (id, conversation_id, sender_id, content) VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [messageId, conversationId, senderId, content]
    )

    await query(
      'UPDATE conversations SET last_message_at = NOW() WHERE id = $1',
      [conversationId]
    )

    return { success: true, data: rows[0] }
  } catch {
    return { success: false, error: 'Failed to send message' }
  }
}

export async function getMessages(conversationId: string): Promise<MessageResponse> {
  try {
    const { rows } = await query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    )

    return { success: true, data: rows }
  } catch {
    return { success: false, error: 'Failed to fetch messages' }
  }
}

export async function getUserConversations(userId: string): Promise<MessageResponse> {
  try {
    const { rows } = await query(
      `SELECT * FROM conversations WHERE buyer_id = $1 OR merchant_id = $1 ORDER BY last_message_at DESC`,
      [userId]
    )

    return { success: true, data: rows }
  } catch {
    return { success: false, error: 'Failed to fetch conversations' }
  }
}
