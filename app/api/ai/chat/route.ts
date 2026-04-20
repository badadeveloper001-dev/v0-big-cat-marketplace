import { NextRequest, NextResponse } from 'next/server'
import {
  buildAiSearchReply,
  buildConversationalReply,
  buildStructuredMarketplaceResponse,
  buildSupportReply,
  detectContactBypassAttempt,
  detectConversationalIntent,
  detectMarketplaceIntentType,
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
    const userLocation = String(body?.location || '').trim()
    const recentMessages = Array.isArray(body?.recentMessages)
      ? body.recentMessages.filter((item: unknown) => typeof item === 'string').slice(-8)
      : []
    const replyLanguage = detectReplyLanguage({ message, preferredLanguage: language })
    const intentType = detectMarketplaceIntentType(message)

    const emptyStructured = {
      type: intentType,
      query: message,
      location: userLocation || 'Unknown location',
      results: [],
    }

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 })
    }

    if (detectContactBypassAttempt(message)) {
      return NextResponse.json({
        success: true,
        reply:
          'For your safety, all transactions should remain within the platform. I can still help you find trusted products, services, or verified vendors here.',
        data: {
          products: [],
          vendors: [],
          services: [],
        },
        structured: emptyStructured,
        replyLanguage,
      })
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
          services: [],
        },
        structured: emptyStructured,
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
          services: [],
        },
        structured: emptyStructured,
        replyLanguage,
      })
    }

    const contextualQuery = [
      ...recentMessages,
      message,
    ]
      .join(' ')
      .trim()

    const result = await searchMarketplace({
      query: contextualQuery || message,
      type: 'both',
      limit: 8,
      location: userLocation,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    const reply = buildAiSearchReply({
      query: message,
      products: result.products,
      vendors: result.vendors,
      services: result.services,
      userLocation,
      intentType,
      language: replyLanguage,
      assistantMode,
    })

    const structured = buildStructuredMarketplaceResponse({
      intentType,
      query: message,
      location: userLocation,
      products: result.products,
      services: result.services,
      vendors: result.vendors,
    })

    return NextResponse.json({
      success: true,
      reply,
      data: {
        products: result.products,
        vendors: result.vendors,
        services: result.services,
      },
      structured,
      replyLanguage,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'AI chat failed' },
      { status: 500 }
    )
  }
}
