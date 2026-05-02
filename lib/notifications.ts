"use server"

import { sendEmail } from "@/lib/mailer"
import { createClient } from "@/lib/supabase/server"

export type NotificationType = "order" | "system" | "alert" | "report"

type JsonRecord = Record<string, any>

export interface DispatchNotificationInput {
  userId: string
  title: string
  message: string
  type: NotificationType
  eventKey?: string
  metadata?: JsonRecord
  sendEmail?: boolean
  emailSubject?: string
  emailHtml?: string
  emailText?: string
}

interface NotificationRow {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  created_at: string
  read_at: string | null
  metadata?: JsonRecord | null
}

function isMissingNotificationInfraError(error: any) {
  const message = String(error?.message || "").toLowerCase()
  return message.includes("does not exist")
    || message.includes("relation")
    || message.includes("schema cache")
    || message.includes("could not find")
    || message.includes("column")
}

function escapeHtml(input: string) {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildDefaultEmailHtml(title: string, message: string, metadata?: Record<string, any>) {
  const safeTitle = escapeHtml(title)
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />")

  const orderId = String(metadata?.orderId || "").trim()
  const actionPath = String(metadata?.actionPath || "").trim()
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://v0-big-cat-marketplace.vercel.app").replace(/\/$/, "")
  const trackingUrl = actionPath
    ? `${appUrl}${actionPath}`
    : orderId
      ? `${appUrl}/track/${orderId}`
      : ""
  const trackingId = orderId ? `BC-${orderId.replace(/-/g, "").slice(0, 10).toUpperCase()}` : ""

  const isAlert = /alert|breach|delay|incident|failed|cancel/i.test(title)
  const isSuccess = /confirmed|completed|delivered|released|paid|assigned|approved|placed/i.test(title)
  const accentColor = isAlert ? "#ef4444" : isSuccess ? "#22c55e" : "#f97316"
  const badgeText = isAlert ? "IMPORTANT ALERT" : isSuccess ? "CONFIRMED" : "ORDER UPDATE"
  const year = new Date().getFullYear()

  const orderBox = orderId
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
        <tr>
          <td style="padding:14px 16px;">
            <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#9a3412;letter-spacing:.12em;text-transform:uppercase;">Order Reference</p>
            <p style="margin:0 0 2px;font-size:16px;font-weight:800;color:#0f172a;font-family:'Courier New',monospace;letter-spacing:.04em;">${trackingId}</p>
            <p style="margin:0;font-size:11px;color:#78716c;">ID: ${escapeHtml(orderId)}</p>
          </td>
          <td style="padding:14px 16px;text-align:right;">
            <div style="display:inline-block;background:${accentColor};border-radius:6px;padding:4px 10px;">
              <p style="margin:0;font-size:10px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:.1em;">${badgeText}</p>
            </div>
          </td>
        </tr>
      </table>`
    : ""

  const ctaButton = trackingUrl
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
        <tr>
          <td align="center">
            <a href="${escapeHtml(trackingUrl)}"
               style="display:inline-block;padding:13px 32px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              Track Your Order &rarr;
            </a>
          </td>
        </tr>
      </table>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-radius:16px 16px 0 0;padding:28px 32px;">
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align:middle;padding-right:14px;">
                    <div style="width:46px;height:46px;background:#f97316;border-radius:12px;text-align:center;line-height:46px;font-size:26px;">&#x1F408;</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-.03em;line-height:1.1;">BigCat</p>
                    <p style="margin:0;font-size:10px;font-weight:600;color:#94a3b8;letter-spacing:.14em;text-transform:uppercase;">Marketplace</p>
                  </td>
                  <td style="vertical-align:middle;padding-left:24px;">
                    <p style="margin:0;font-size:11px;color:#64748b;text-align:right;line-height:1.5;">Nigeria&rsquo;s Premium<br/>B2B &amp; B2C Platform</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── ACCENT STRIPE ── -->
          <tr>
            <td style="background:${accentColor};padding:5px 32px;">
              <p style="margin:0;font-size:10px;font-weight:700;color:#ffffff;letter-spacing:.18em;text-transform:uppercase;">${escapeHtml(badgeText)}</p>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="background:#ffffff;padding:32px 32px 28px;">
              <h1 style="margin:0 0 14px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${safeTitle}</h1>
              <p style="margin:0;font-size:14px;color:#475569;line-height:1.75;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${safeMessage}</p>
              ${orderBox}
              ${ctaButton}
            </td>
          </tr>

          <!-- ── DIVIDER ── -->
          <tr>
            <td style="background:#fff7ed;border-left:1px solid #fed7aa;border-right:1px solid #fed7aa;padding:14px 32px;">
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;color:#92400e;font-weight:600;">&#x1F4E6; Need help with your order?</p>
                    <p style="margin:2px 0 0;font-size:11px;color:#b45309;">Reply to this email or visit <a href="${appUrl}/help" style="color:#f97316;text-decoration:none;">BigCat Help Centre</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;">
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
                <tr>
                  <td>
                    <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:#0f172a;">BigCat Marketplace</p>
                    <p style="margin:0 0 10px;font-size:11px;color:#94a3b8;">Nigeria&rsquo;s trusted commerce platform for buyers, merchants &amp; businesses.</p>
                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:10px 0;" />
                    <p style="margin:0;font-size:10px;color:#94a3b8;">
                      &copy; ${year} BigCat Marketplace. All rights reserved.
                      &nbsp;&middot;&nbsp;
                      <a href="${appUrl}" style="color:#f97316;text-decoration:none;">Visit Marketplace</a>
                      &nbsp;&middot;&nbsp;
                      <a href="${appUrl}/privacy" style="color:#f97316;text-decoration:none;">Privacy Policy</a>
                    </p>
                    <p style="margin:6px 0 0;font-size:10px;color:#cbd5e1;">You are receiving this email because you have an active BigCat account. If you did not request this, you can safely ignore it.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function hasProcessedEvent(eventKey: string) {
  const supabase = await createClient()
  const { data, error } = await (supabase.from("automation_events") as any)
    .select("event_key")
    .eq("event_key", eventKey)
    .maybeSingle()

  if (error) {
    const message = String(error.message || "").toLowerCase()
    if (message.includes("does not exist") || message.includes("schema cache")) {
      return false
    }
    throw error
  }

  return Boolean(data)
}

async function recordProcessedEvent(eventKey: string, userId: string, type: NotificationType, metadata?: JsonRecord) {
  const supabase = await createClient()
  const payload = {
    event_key: eventKey,
    user_id: userId,
    event_type: type,
    metadata: metadata || null,
  }

  const { error } = await (supabase.from("automation_events") as any).insert(payload)
  if (error) {
    const message = String(error.message || "").toLowerCase()
    if (message.includes("duplicate key")) {
      return
    }
    if (message.includes("does not exist") || message.includes("schema cache")) {
      return
    }
    throw error
  }
}

async function insertNotification(payload: {
  user_id: string
  title: string
  message: string
  type: NotificationType
  metadata?: JsonRecord | null
  event_key?: string | null
}) {
  const supabase = await createClient()

  const attempts = [
    {
      ...payload,
      metadata: payload.metadata || null,
      event_key: payload.event_key || null,
    },
    {
      user_id: payload.user_id,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      event_key: payload.event_key || null,
    },
    {
      user_id: payload.user_id,
      title: payload.title,
      message: payload.message,
      type: payload.type,
    },
  ]

  let lastError: any = null
  for (const attempt of attempts) {
    const { error } = await (supabase.from("user_notifications") as any).insert(attempt)
    if (!error) return { inserted: true }

    const message = String(error.message || "").toLowerCase()
    if (message.includes("column") || message.includes("schema cache") || message.includes("does not exist")) {
      lastError = error
      continue
    }

    throw error
  }

  if (lastError) {
    if (isMissingNotificationInfraError(lastError)) {
      return { inserted: false, skipped: true, reason: "Notification tables are not available yet" }
    }
    throw lastError
  }

  return { inserted: false, skipped: true, reason: "Notification insert was skipped" }
}

async function maybeSendEmail(userId: string, input: DispatchNotificationInput) {
  if (input.sendEmail === false) {
    return { sent: false, reason: "Email disabled for this event" }
  }

  const supabase = await createClient()
  const { data: profile, error } = await (supabase.from("auth_users") as any)
    .select("email, name, business_name, email_notifications")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    return { sent: false, reason: `Could not read user profile: ${error.message}` }
  }

  const email = String(profile?.email || "").trim()
  if (!email) {
    return { sent: false, reason: "Missing user email" }
  }

  if (profile?.email_notifications === false) {
    return { sent: false, reason: "User disabled email notifications" }
  }

  const from = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || "BigCat Marketplace <onboarding@resend.dev>"
  const subject = input.emailSubject || input.title
  const html = input.emailHtml || buildDefaultEmailHtml(input.title, input.message, input.metadata)
  const text = input.emailText || `${input.title}\n\n${input.message}`

  const result = await sendEmail({ from, to: email, subject, html, text })
  return result.success ? { sent: true as const } : { sent: false, reason: result.error }
}

export async function dispatchNotification(input: DispatchNotificationInput) {
  const userId = String(input.userId || "").trim()
  if (!userId) {
    return { success: false, error: "userId is required" }
  }

  const eventKey = input.eventKey?.trim() || ""

  if (eventKey) {
    try {
      const alreadyProcessed = await hasProcessedEvent(eventKey)
      if (alreadyProcessed) {
        return { success: true, skipped: true, reason: "Duplicate event blocked" }
      }
    } catch (error: any) {
      if (!isMissingNotificationInfraError(error)) {
        throw error
      }
    }
  }

  const notificationInsert = await insertNotification({
    user_id: userId,
    title: input.title,
    message: input.message,
    type: input.type,
    metadata: input.metadata || null,
    event_key: eventKey || null,
  })

  const emailResult = await maybeSendEmail(userId, input)

  if (eventKey) {
    try {
      await recordProcessedEvent(eventKey, userId, input.type, {
        ...(input.metadata || {}),
        email_sent: Boolean(emailResult.sent),
        email_reason: emailResult.sent ? null : emailResult.reason,
      })
    } catch (error: any) {
      if (!isMissingNotificationInfraError(error)) {
        throw error
      }
    }
  }

  return {
    success: true,
    notification: notificationInsert,
    email: emailResult,
  }
}

export async function fetchUserNotifications(userId: string, options?: { limit?: number; unreadOnly?: boolean; type?: NotificationType }) {
  const supabase = await createClient()
  let query = (supabase.from("user_notifications") as any)
    .select("id, user_id, title, message, type, created_at, read_at, metadata")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(options?.limit || 50, 200)))

  if (options?.unreadOnly) {
    query = query.is("read_at", null)
  }

  if (options?.type) {
    query = query.eq("type", options.type)
  }

  const { data, error } = await query
  if (error) {
    return { success: false, error: error.message, data: [] as NotificationRow[] }
  }

  return { success: true, data: (data || []) as NotificationRow[] }
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const supabase = await createClient()
  const { error } = await (supabase.from("user_notifications") as any)
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = await createClient()
  const { error } = await (supabase.from("user_notifications") as any)
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
