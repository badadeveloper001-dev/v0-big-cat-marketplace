import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const { to, body } = await request.json()

    if (!to || !body) {
      return NextResponse.json({ success: false, error: 'to and body are required' }, { status: 400 })
    }

    const sent = await sendWhatsAppMessage({ to: String(to), body: String(body) })
    return NextResponse.json({ success: true, sent })
  } catch (error) {
    console.error('WhatsApp notify API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
