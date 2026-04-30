import { createClient } from '@/lib/supabase/server'

const CREDIT_TYPES = ['escrow_release', 'payment', 'wallet_credit']
const DEBIT_TYPES = ['withdrawal', 'wallet_debit']

type WalletTransaction = {
  id: string
  order_id?: string | null
  merchant_id?: string | null
  type?: string | null
  amount?: number | null
  reason?: string | null
  status?: string | null
  created_at?: string | null
}

function toAmount(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeType(value: unknown) {
  return String(value || '').toLowerCase().trim()
}

function isCompletedStatus(value: unknown) {
  const status = String(value || '').toLowerCase().trim()
  if (!status) return true
  return status === 'completed' || status === 'success' || status === 'settled'
}

function computeBalanceFromTransactions(rows: WalletTransaction[]) {
  return rows.reduce((sum, tx) => {
    const amount = Math.max(0, toAmount(tx.amount))
    const type = normalizeType(tx.type)

    if (CREDIT_TYPES.includes(type)) return sum + amount
    if (DEBIT_TYPES.includes(type)) return sum - amount
    return sum
  }, 0)
}

async function insertTransactionWithFallback(supabase: any, payload: Record<string, any>) {
  const now = new Date().toISOString()
  const attempts = [
    {
      ...payload,
      created_at: payload.created_at || now,
      status: payload.status || 'completed',
      reason: payload.reason || null,
      order_id: payload.order_id || null,
      buyer_id: payload.buyer_id || null,
    },
    {
      ...payload,
      status: payload.status || 'completed',
      reason: payload.reason || null,
      order_id: payload.order_id || null,
    },
    {
      ...payload,
      status: payload.status || 'completed',
      order_id: payload.order_id || null,
    },
    {
      ...payload,
      order_id: payload.order_id || null,
    },
  ]

  let lastError: any = null
  for (const attempt of attempts) {
    const { data, error } = await (supabase.from('transactions') as any).insert(attempt).select('*').maybeSingle()
    if (!error) return { success: true, data }
    lastError = error
  }

  return { success: false, error: lastError?.message || 'Failed to record transaction' }
}

export async function getMerchantWalletOverview(merchantId: string, options?: { limit?: number }) {
  const id = String(merchantId || '').trim()
  if (!id) return { success: false, error: 'Merchant id is required', balance: 0, transactions: [] as WalletTransaction[] }

  try {
    const supabase = await createClient()
    const { data, error } = await (supabase.from('transactions') as any)
      .select('id, order_id, merchant_id, type, amount, reason, status, created_at')
      .eq('merchant_id', id)
      .order('created_at', { ascending: false })
      .limit(Math.max(1, Math.min(options?.limit || 100, 500)))

    if (error) throw error

    const rows = (data || []) as WalletTransaction[]
    const completedRows = rows.filter((tx) => isCompletedStatus(tx.status))
    const balance = computeBalanceFromTransactions(completedRows)

    return {
      success: true,
      balance: Math.max(0, balance),
      transactions: rows,
      withdrawalHistory: rows.filter((tx) => DEBIT_TYPES.includes(normalizeType(tx.type))),
    }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to load wallet', balance: 0, transactions: [] as WalletTransaction[] }
  }
}

export async function creditMerchantWalletFromEscrow(params: {
  supabase: any
  orderId: string
  merchantId: string
  amount: number
  reason?: string
}) {
  const orderId = String(params.orderId || '').trim()
  const merchantId = String(params.merchantId || '').trim()
  const amount = Math.max(0, toAmount(params.amount))

  if (!orderId || !merchantId || amount <= 0) {
    return { success: false, error: 'orderId, merchantId and amount are required' }
  }

  try {
    const { data: existing, error: checkError } = await (params.supabase.from('transactions') as any)
      .select('id, type, amount, status')
      .eq('order_id', orderId)
      .eq('merchant_id', merchantId)
      .in('type', ['escrow_release', 'payment'])
      .maybeSingle()

    if (!checkError && existing && isCompletedStatus(existing.status)) {
      return { success: true, skipped: true, reason: 'Escrow credit already recorded for this order' }
    }

    // Try escrow_release first. If DB enum blocks this custom type, fall back to payment.
    const attempts = [
      {
        order_id: orderId,
        merchant_id: merchantId,
        type: 'escrow_release',
        amount,
        reason: params.reason || `Escrow released for order ${orderId}`,
        status: 'completed',
        created_at: new Date().toISOString(),
      },
      {
        order_id: orderId,
        merchant_id: merchantId,
        type: 'payment',
        amount,
        reason: params.reason || `Escrow released for order ${orderId}`,
        status: 'completed',
        created_at: new Date().toISOString(),
      },
    ]

    let lastError: any = null
    for (const payload of attempts) {
      const inserted = await insertTransactionWithFallback(params.supabase, payload)
      if (inserted.success) {
        return { success: true, credited: amount, type: payload.type }
      }
      lastError = inserted.error
    }

    return { success: false, error: String(lastError || 'Failed to credit merchant wallet') }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to credit merchant wallet' }
  }
}

export async function createMerchantWithdrawal(params: {
  merchantId: string
  amount: number
  fee?: number
  netAmount?: number
  bankDisplay?: string
}) {
  const merchantId = String(params.merchantId || '').trim()
  const amount = Math.max(0, toAmount(params.amount))
  const fee = Math.max(0, toAmount(params.fee))
  const netAmount = Math.max(0, toAmount(params.netAmount || (amount - fee)))

  if (!merchantId || amount <= 0) {
    return { success: false, error: 'merchantId and amount are required', balance: 0 }
  }

  const overview = await getMerchantWalletOverview(merchantId, { limit: 300 })
  if (!overview.success) {
    return { success: false, error: overview.error || 'Failed to read wallet balance', balance: 0 }
  }

  if (overview.balance < amount) {
    return {
      success: false,
      error: 'Insufficient wallet balance',
      balance: overview.balance,
    }
  }

  const supabase = await createClient()
  const note = params.bankDisplay
    ? `Merchant withdrawal to ${params.bankDisplay}. Gross: ${amount}. Fee: ${fee}. Net: ${netAmount}.`
    : `Merchant withdrawal. Gross: ${amount}. Fee: ${fee}. Net: ${netAmount}.`

  const payloadAttempts = [
    {
      merchant_id: merchantId,
      type: 'withdrawal',
      amount,
      reason: note,
      status: 'completed',
      created_at: new Date().toISOString(),
    },
    {
      merchant_id: merchantId,
      type: 'wallet_debit',
      amount,
      reason: note,
      status: 'completed',
      created_at: new Date().toISOString(),
    },
  ]

  let inserted: any = null
  for (const payload of payloadAttempts) {
    const result = await insertTransactionWithFallback(supabase, payload)
    if (result.success) {
      inserted = { ...result.data, type: payload.type, amount }
      break
    }
  }

  if (!inserted) {
    return { success: false, error: 'Failed to record withdrawal transaction', balance: overview.balance }
  }

  const nextBalance = Math.max(0, overview.balance - amount)
  return {
    success: true,
    balance: nextBalance,
    transaction: inserted,
  }
}
