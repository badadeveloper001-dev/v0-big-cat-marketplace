/**
 * WhatsApp Business API integration via Meta Cloud API.
 * Set environment variables:
 *   WHATSAPP_PHONE_NUMBER_ID  – your Meta phone number ID
 *   WHATSAPP_ACCESS_TOKEN     – your Meta system-user access token
 *   WHATSAPP_RECIPIENT_PREFIX – optional: country code prefix e.g. "234" (Nigeria)
 */

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const API_VERSION = 'v19.0'

export interface WhatsAppTextMessage {
  to: string       // phone number without leading + e.g. "2348012345678"
  body: string
}

function normalizePhone(phone: string): string {
  // Strip spaces/dashes, remove leading 0 and prepend 234 for Nigeria if needed
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('+')) return cleaned.slice(1)
  if (cleaned.startsWith('0')) return `234${cleaned.slice(1)}`
  if (cleaned.startsWith('234')) return cleaned
  return cleaned
}

export async function sendWhatsAppMessage(message: WhatsAppTextMessage): Promise<boolean> {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    // Not configured – log and silently continue
    console.info('[WhatsApp] Not configured. Skipping notification to', message.to)
    return false
  }

  const phone = normalizePhone(message.to)
  if (!phone || phone.length < 7) return false

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message.body },
        }),
      },
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('[WhatsApp] API error:', err)
      return false
    }

    return true
  } catch (error) {
    console.error('[WhatsApp] Send failed:', error)
    return false
  }
}

// Convenience helpers for common marketplace events
export const whatsapp = {
  orderPlaced: (phone: string, orderId: string, total: string) =>
    sendWhatsAppMessage({
      to: phone,
      body: `✅ *BigCat Marketplace*\n\nYour order *${orderId.slice(0, 8).toUpperCase()}* has been placed successfully!\n\nTotal: ${total}\n\nWe'll update you when it ships. Thank you for shopping with us! 🛍️`,
    }),

  orderShipped: (phone: string, orderId: string, riderName?: string) =>
    sendWhatsAppMessage({
      to: phone,
      body: `🚚 *BigCat Marketplace*\n\nYour order *${orderId.slice(0, 8).toUpperCase()}* is on its way!${riderName ? `\n\nRider: ${riderName}` : ''}\n\nExpect delivery soon. Open the app to track your order.`,
    }),

  orderDelivered: (phone: string, orderId: string) =>
    sendWhatsAppMessage({
      to: phone,
      body: `🎉 *BigCat Marketplace*\n\nYour order *${orderId.slice(0, 8).toUpperCase()}* has been delivered!\n\nEnjoy your purchase. If there's any issue, use the "Report Issue" button in the app.`,
    }),

  merchantNewOrder: (phone: string, orderId: string, amount: string) =>
    sendWhatsAppMessage({
      to: phone,
      body: `🛒 *BigCat – New Order*\n\nYou have a new order! *${orderId.slice(0, 8).toUpperCase()}*\n\nAmount: ${amount}\n\nLog in to BigCat Merchant Dashboard to process it now.`,
    }),

  refundInitiated: (phone: string, orderId: string, amount: string) =>
    sendWhatsAppMessage({
      to: phone,
      body: `💰 *BigCat Marketplace*\n\nYour refund request for order *${orderId.slice(0, 8).toUpperCase()}* has been received.\n\nAmount: ${amount}\n\nBigCat admin will process it within 3–5 business days.`,
    }),

  couponCode: (phone: string, code: string, discount: string) =>
    sendWhatsAppMessage({
      to: phone,
      body: `🎁 *BigCat Marketplace*\n\nYou have a special discount!\n\nUse code *${code}* at checkout to get ${discount} off your next order.\n\nShop now at BigCat Marketplace! 🛍️`,
    }),
}
