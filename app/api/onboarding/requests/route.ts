import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('merchant_onboarding_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const requests = (data || []).map((row: any) => ({
      ...row,
      assigned_agent_id: row.assigned_agent_id || null,
      onboarding_status: row.onboarding_status || 'not_started',
    }))

    return NextResponse.json({ success: true, requests })
  } catch (error: any) {
    const msg = error?.message || 'Unknown error'
    if (msg.includes("Could not find the table 'public.merchant_onboarding_requests'")) {
      return NextResponse.json(
        {
          success: false,
          error: 'Onboarding table is missing. Run scripts/009-create-merchant-onboarding-table.sql in Supabase SQL Editor.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const business_name = String(body.business_name || '').trim()
    const category = String(body.category || '').trim()
    const date_of_commencement = String(body.date_of_commencement || '').trim()
    const owner_name = String(body.owner_name || '').trim()
    const phone = String(body.phone || '').trim()
    const email = String(body.email || '').trim().toLowerCase()

    if (!business_name || !category || !date_of_commencement || !owner_name || !phone || !email) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const payload = {
      id: `onboard_${randomUUID()}`,
      business_name,
      category,
      date_of_commencement,
      owner_name,
      phone,
      email,
      onboarding_status: 'not_started',
      assigned_agent_id: null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('merchant_onboarding_requests')
      .insert(payload as any)
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, request: data })
  } catch (error: any) {
    const msg = error?.message || 'Unknown error'
    if (msg.includes("Could not find the table 'public.merchant_onboarding_requests'")) {
      return NextResponse.json(
        {
          success: false,
          error: 'Onboarding table is missing. Run scripts/009-create-merchant-onboarding-table.sql in Supabase SQL Editor.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
