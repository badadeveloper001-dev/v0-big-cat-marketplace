import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Rider login: match by phone number against logistics_riders table
// Uses a simple PIN stored as rider_pin on the riders table (added via migration)
// Falls back to last 4 digits of phone as default PIN if no pin set

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const phone = String(body?.phone || '').trim().replace(/\s+/g, '')
    const pin = String(body?.pin || '').trim()

    if (!phone || !pin) {
      return NextResponse.json({ success: false, error: 'Phone number and PIN are required.' }, { status: 400 })
    }

    const supabase = createClient()

    // Find rider by phone number
    const { data: riders, error } = await (supabase.from('logistics_riders') as any)
      .select('id, name, phone, email, region, is_active, rider_pin')
      .or(`phone.eq.${phone},phone.eq.0${phone.replace(/^234/, '')},phone.eq.234${phone.replace(/^0/, '')}`)
      .limit(5)

    if (error) {
      console.error('Rider login DB error:', error)
      return NextResponse.json({ success: false, error: 'Login failed. Please try again.' }, { status: 500 })
    }

    const rider = Array.isArray(riders) ? riders[0] : null

    if (!rider) {
      return NextResponse.json({ success: false, error: 'No rider account found with this phone number.' }, { status: 401 })
    }

    if (rider.is_active === false) {
      return NextResponse.json({ success: false, error: 'Your rider account has been deactivated. Contact the logistics admin.' }, { status: 403 })
    }

    // Validate PIN: use stored pin, or default to last 4 digits of phone
    const storedPin = String(rider.rider_pin || '').trim()
    const defaultPin = String(phone).replace(/\D/g, '').slice(-4)
    const validPin = storedPin || defaultPin

    if (pin !== validPin) {
      return NextResponse.json({ success: false, error: 'Incorrect PIN. Your default PIN is the last 4 digits of your phone number.' }, { status: 401 })
    }

    // Return rider info (used as session token in localStorage)
    return NextResponse.json({
      success: true,
      rider: {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
        email: rider.email,
        region: rider.region,
      },
    })
  } catch (error) {
    console.error('Rider login error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 })
  }
}
