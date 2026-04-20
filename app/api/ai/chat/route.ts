import { NextRequest, NextResponse } from 'next/server'
import {
  buildAiSearchReply,
  buildConversationalReply,
  buildSupportReply,
  detectConversationalIntent,
  detectReplyLanguage,
  detectSupportIntent,
  searchMarketplace,
} from '@/lib/ai-marketplace-search'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = String(body?.message || '').trim()
    const language = String(body?.language || 'auto')
    const assistantMode = body?.assistantMode === 'merchant' ? 'merchant' : 'buyer'
    const replyLanguage = detectReplyLanguage({ message, preferredLanguage: language })

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 })
    }

    const supportIntent = detectSupportIntent(message)
    if (supportIntent) {
      return NextResponse.json({
        success: true,
        reply: buildSupportReply({
          intent: supportIntent,
          language: replyLanguage,
          assistantMode,
        }),
        data: {
          products: [],
          vendors: [],
        },
        replyLanguage,
      })
    }

    const conversationalIntent = detectConversationalIntent(message)
    if (conversationalIntent) {
      return NextResponse.json({
        success: true,
        reply: buildConversationalReply({
          intent: conversationalIntent,
          language: replyLanguage,
          assistantMode,
        }),
        data: {
          products: [],
          vendors: [],
        },
        replyLanguage,
      })
    }

    const result = await searchMarketplace({
      query: message,
      type: 'both',
      limit: 8,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    const reply = buildAiSearchReply({
      query: message,
      products: result.products,
      vendors: result.vendors,
      language: replyLanguage,
      assistantMode,
    })

    return NextResponse.json({
      success: true,
      reply,
      data: {
        products: result.products,
        vendors: result.vendors,
      },
        replyLanguage,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'AI chat failed' },
      { status: 500 }
    )
  }
}
