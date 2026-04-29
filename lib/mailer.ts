/**
 * Shared email transport for BigCat Marketplace.
 *
 * Priority:
 *  1. SMTP via nodemailer (EMAIL_HOST set) — works with Gmail, AWS SES, Brevo, Mailersend, etc.
 *  2. Resend (RESEND_API_KEY set) — fallback, free tier restricted to registered domain
 *
 * Required env vars for SMTP (Gmail example):
 *   EMAIL_HOST=smtp.gmail.com
 *   EMAIL_PORT=587
 *   EMAIL_USER=your@gmail.com
 *   EMAIL_PASS=your-app-password   (Google Account → Security → App Passwords)
 *   EMAIL_FROM=BigCat Marketplace <your@gmail.com>
 *
 * For other providers (Brevo, Mailersend, AWS SES SMTP, etc.):
 *   Just change EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS accordingly.
 *   EMAIL_SECURE=true  for port 465 (SSL); omit or set false for port 587 (TLS/STARTTLS)
 */
import nodemailer from 'nodemailer'
import { Resend } from 'resend'

export interface SendEmailInput {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

export interface SendEmailResult {
  success: boolean
  provider?: 'smtp' | 'resend'
  error?: string
}

let smtpTransport: nodemailer.Transporter | null = null
let resendClient: Resend | null = null

function getSmtpTransport(): nodemailer.Transporter | null {
  const host = process.env.EMAIL_HOST
  if (!host) return null

  if (smtpTransport) return smtpTransport

  const port = parseInt(process.env.EMAIL_PORT || '587', 10)
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465

  smtpTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  return smtpTransport
}

function getResendClient(): Resend | null {
  if (resendClient) return resendClient
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  resendClient = new Resend(apiKey)
  return resendClient
}

function defaultFrom(): string {
  // SMTP from address
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM
  if (process.env.EMAIL_USER) return `BigCat Marketplace <${process.env.EMAIL_USER}>`
  // Resend from address
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL
  return 'BigCat Marketplace <onboarding@resend.dev>'
}

/**
 * Send a transactional email. Tries SMTP first, falls back to Resend.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const from = input.from || defaultFrom()

  // --- 1. Try SMTP ---
  const smtp = getSmtpTransport()
  if (smtp) {
    try {
      await smtp.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      })
      return { success: true, provider: 'smtp' }
    } catch (err: any) {
      console.error('[mailer] SMTP send failed:', err?.message)
      return { success: false, provider: 'smtp', error: err?.message || 'SMTP send failed' }
    }
  }

  // --- 2. Fall back to Resend ---
  const resend = getResendClient()
  if (resend) {
    try {
      await resend.emails.send({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text || input.subject,
      })
      return { success: true, provider: 'resend' }
    } catch (err: any) {
      console.error('[mailer] Resend send failed:', err?.message)
      return { success: false, provider: 'resend', error: err?.message || 'Resend send failed' }
    }
  }

  return {
    success: false,
    error: 'No email provider configured. Set EMAIL_HOST (SMTP) or RESEND_API_KEY.',
  }
}
