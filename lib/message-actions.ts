'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface MessageResponse {
  success: boolean
  error?: string
  data?: any
}

/**
 * Get or create a conversation between buyer and merchant
 */
export async function getOrCreateConversation(
  buyerId: string,
  merchantId: string
): Promise<MessageResponse> {
  try {
    if (!buyerId || !merchantId) {
      return { success: false, error: 'Missing buyer or merchant ID' }
    }

    const supabase = await createClient()

    // Check if conversation exists
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('buyer_id', buyerId)
      .eq('merchant_id', merchantId)
      .single()

    if (existingConversation) {
      return {
        success: true,
        data: existingConversation,
      }
    }

    // Create new conversation
    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert({
        buyer_id: buyerId,
        merchant_id: merchantId,
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error creating conversation:', error)
      return { success: false, error: 'Failed to create conversation' }
    }

    return {
      success: true,
      data: newConversation,
    }
  } catch (error) {
    console.error('[v0] Unexpected error in getOrCreateConversation:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get user conversations
 */
export async function getUserConversations(userId: string): Promise<MessageResponse> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    const supabase = await createClient()

    // Get conversations where user is buyer or merchant
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        buyer:buyer_id(id, full_name, email),
        merchant:merchant_id(id, full_name, email, business_name)
      `)
      .or(`buyer_id.eq.${userId},merchant_id.eq.${userId}`)
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('[v0] Error fetching conversations:', error)
      return { success: false, error: 'Failed to fetch conversations' }
    }

    return {
      success: true,
      data: conversations || [],
    }
  } catch (error) {
    console.error('[v0] Unexpected error in getUserConversations:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Send message
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  message: string
): Promise<MessageResponse> {
  try {
    if (!conversationId || !senderId || !message.trim()) {
      return { success: false, error: 'Missing required fields' }
    }

    const supabase = await createClient()

    // Create message
    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: message.trim(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('[v0] Error sending message:', error)
      return { success: false, error: 'Failed to send message' }
    }

    // Update conversation's updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    revalidatePath('/')
    return {
      success: true,
      data: newMessage,
    }
  } catch (error) {
    console.error('[v0] Unexpected error in sendMessage:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get conversation messages
 */
export async function getConversationMessages(conversationId: string): Promise<MessageResponse> {
  try {
    if (!conversationId) {
      return { success: false, error: 'Conversation ID is required' }
    }

    const supabase = await createClient()

    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, full_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[v0] Error fetching messages:', error)
      return { success: false, error: 'Failed to fetch messages' }
    }

    return {
      success: true,
      data: messages || [],
    }
  } catch (error) {
    console.error('[v0] Unexpected error in getConversationMessages:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
