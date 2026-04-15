import { NextResponse } from 'next/server'
import { getTransactions, getTransactionStats } from '@/lib/admin-actions'

export async function GET() {
  try {
    const [txnResult, statsResult] = await Promise.all([
      getTransactions(),
      getTransactionStats(),
    ])

    const transactions = txnResult.success ? txnResult.data.map((t: any) => ({
      id: t.id,
      user: t.buyer_id || 'Unknown',
      amount: t.grand_total || t.total_amount || 0,
      status: t.status === 'delivered' ? 'completed' : t.status || 'pending',
      date: new Date(t.created_at).toLocaleDateString(),
      type: 'payment',
    })) : []

    const raw = statsResult.success ? statsResult.data : null

    let productEscrow = 0
    let deliveryEscrow = 0

    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: escrowRows, error } = await supabase
        .from('escrow')
        .select('type, amount, status')
        .eq('status', 'held')

      if (!error) {
        productEscrow = (escrowRows || [])
          .filter((row: any) => row.type === 'product')
          .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0)

        deliveryEscrow = (escrowRows || [])
          .filter((row: any) => row.type === 'delivery')
          .reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0)
      }
    } catch {
      productEscrow = 0
      deliveryEscrow = 0
    }

    const stats = {
      totalTransactions: transactions.length,
      totalRevenue: raw?.totalRevenue || 0,
      productEscrow,
      deliveryEscrow,
      completedPayments: raw?.successful || 0,
      pendingPayments: raw?.pending || 0,
    }

    return NextResponse.json({ success: true, transactions, stats })
  } catch (error) {
    console.error('Admin transactions API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
