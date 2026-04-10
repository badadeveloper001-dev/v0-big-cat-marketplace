'use server'

import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'

function generateId(prefix: string) {
  return `${prefix}_${randomUUID()}`
}

export async function getOrCreateConversation(buyerId: string, merchantId: string, productId?: string) {
  try {
    const supabase = await createClient()

    let query = supabase.from('conversations').select('*').eq('buyer_id', buyerId).eq('merchant_id', merchantId)
    if (productId) query = query.eq('product_id', productId)

    const { data: existing, error: existingError } = await query.maybeSingle()
    if (existingError && existingError.code !== 'PGRST116') throw existingError
    if (existing) return { success: true, data: existing }

    const baseConversation = {
      id: generateId('conv'),
      buyer_id: buyerId,
      merchant_id: merchantId,
      last_message_at: new Date().toISOString(),
    }

    let result = await supabase
      .from('conversations')
      .insert(productId ? { ...baseConversation, product_id: productId } : baseConversation)
      .select()
      .single()

    if (result.error && String(result.error.message || '').includes('product_id')) {
      result = await supabase.from('conversations').insert(baseConversation).select().single()
    }

    if (result.error) throw result.error
    return { success: true, data: result.data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getConversationMessages(conversationId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:auth_users!sender_id(name, business_name, role)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  try {
    const supabase = await createClient()
    const payload = {
      id: generateId('msg'),
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    }

    const { data, error } = await supabase.from('messages').insert(payload).select().single()
    if (error) throw error

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getUserConversations(userId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('conversations')
      .select('*, buyer:auth_users!buyer_id(id, name, full_name, business_name, location, avatar_url), merchant:auth_users!merchant_id(id, name, full_name, business_name, location, avatar_url)')
      .or(`buyer_id.eq.${userId},merchant_id.eq.${userId}`)
      .order('last_message_at', { ascending: false })

    if (error) throw error

    const conversations = await Promise.all(
      (data || []).map(async (conversation) => {
        const { data: latestMessage } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        return {
          ...conversation,
          last_message: latestMessage?.content || 'Start a conversation',
          last_message_at: latestMessage?.created_at || conversation.last_message_at || conversation.created_at,
        }
      })
    )

    return { success: true, data: conversations }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}
